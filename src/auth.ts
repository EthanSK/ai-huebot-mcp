import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import open from "open";
import type { HueConfig, HueTokens } from "./types.js";

const TOKENS_DIR = join(homedir(), ".ai-huebot");
const TOKENS_PATH = join(TOKENS_DIR, "tokens.json");

const HUE_AUTH_URL = "https://api.meethue.com/v2/oauth2/authorize";
const HUE_TOKEN_URL = "https://api.meethue.com/v2/oauth2/token";

export function getConfig(): HueConfig {
  return {
    clientId: process.env.HUE_CLIENT_ID ?? "6089e7ca-8bc0-4040-93b7-0745b644c4fd",
    clientSecret: process.env.HUE_CLIENT_SECRET ?? "0cca20e5c36c392ef0f5b9e1d7e07484",
    callbackUrl: process.env.HUE_CALLBACK_URL ?? "http://localhost:8989/callback",
  };
}

export async function loadTokens(): Promise<HueTokens | null> {
  try {
    const data = await readFile(TOKENS_PATH, "utf-8");
    return JSON.parse(data) as HueTokens;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: HueTokens): Promise<void> {
  if (!existsSync(TOKENS_DIR)) {
    await mkdir(TOKENS_DIR, { recursive: true });
  }
  await writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2), "utf-8");
}

function isTokenExpired(tokens: HueTokens): boolean {
  const now = Date.now();
  const expiresAt = tokens.obtained_at + tokens.expires_in * 1000;
  // Consider expired 60 seconds early to avoid edge cases
  return now >= expiresAt - 60_000;
}

async function exchangeCodeForTokens(code: string, config: HueConfig): Promise<HueTokens> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.callbackUrl,
  });

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");

  const response = await fetch(HUE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };

  const tokens: HueTokens = {
    ...data,
    obtained_at: Date.now(),
  };

  // Create a whitelisted username for CLIP v2 API access
  const username = await createWhitelistedUsername(tokens.access_token);
  if (username) {
    tokens.username = username;
  }

  return tokens;
}

async function refreshAccessToken(refreshToken: string, config: HueConfig): Promise<HueTokens> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");

  const response = await fetch(HUE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };

  return {
    ...data,
    obtained_at: Date.now(),
  };
}

/**
 * Create a whitelisted username (hue-application-key) for CLIP v2 API access.
 * This presses the virtual link button and then creates a new username.
 * Returns the username on success, or undefined on failure.
 */
export async function createWhitelistedUsername(accessToken: string): Promise<string | undefined> {
  try {
    // Press the link button remotely
    const linkRes = await fetch("https://api.meethue.com/route/api/0/config", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ linkbutton: true }),
    });

    if (!linkRes.ok) {
      console.warn(
        `[AI HueBot] Failed to press link button (${linkRes.status}): ${await linkRes.text()}`
      );
    }

    // Create a new whitelisted username
    const usernameRes = await fetch("https://api.meethue.com/route/api/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ devicetype: "ai_huebot#claude" }),
    });

    const usernameData = (await usernameRes.json()) as Array<{
      success?: { username: string };
      error?: { description: string };
    }>;

    if (usernameData[0]?.success?.username) {
      console.log("[AI HueBot] Successfully created whitelisted username for CLIP v2 access");
      return usernameData[0].success.username;
    }

    if (usernameData[0]?.error) {
      console.warn(
        `[AI HueBot] Failed to create username: ${usernameData[0].error.description}`
      );
    }
  } catch (err) {
    console.warn(
      "[AI HueBot] Username creation failed:",
      err instanceof Error ? err.message : String(err)
    );
  }
  return undefined;
}

/**
 * Ensure the stored tokens have a valid whitelisted username.
 * If the username is missing, attempt to create one.
 * Returns the (possibly updated) username.
 */
export async function ensureUsername(accessToken: string): Promise<string | undefined> {
  const tokens = await loadTokens();
  if (tokens?.username) {
    return tokens.username;
  }

  console.warn("[AI HueBot] No hue-application-key (username) found, attempting to create one...");
  const username = await createWhitelistedUsername(accessToken);
  if (username && tokens) {
    tokens.username = username;
    await saveTokens(tokens);
  }
  return username;
}

/**
 * Force-refresh the access token even if it hasn't expired.
 * Used when CLIP v2 returns 403 with a valid username — the token
 * may have entered a bad state (e.g., from rate limiting).
 */
export async function forceRefreshToken(): Promise<{
  accessToken: string;
  username: string | undefined;
} | null> {
  const config = getConfig();
  const tokens = await loadTokens();
  if (!tokens) return null;

  try {
    console.warn("[AI HueBot] Force-refreshing access token...");
    const refreshed = await refreshAccessToken(tokens.refresh_token, config);
    // Preserve username
    if (tokens.username) {
      refreshed.username = tokens.username;
    }
    await saveTokens(refreshed);
    return { accessToken: refreshed.access_token, username: refreshed.username };
  } catch {
    console.warn("[AI HueBot] Force token refresh failed");
    return null;
  }
}

/**
 * Get a valid access token and username, refreshing if necessary.
 * Returns null if no tokens are saved (user needs to authorize).
 */
export async function getValidAccessToken(): Promise<{
  accessToken: string;
  username: string | undefined;
} | null> {
  const config = getConfig();
  let tokens = await loadTokens();

  if (!tokens) {
    return null;
  }

  if (isTokenExpired(tokens)) {
    try {
      tokens = await refreshAccessToken(tokens.refresh_token, config);
      // Preserve existing username through refresh
      const existing = await loadTokens();
      if (existing?.username && !tokens.username) {
        tokens.username = existing.username;
      }
      await saveTokens(tokens);
    } catch {
      // Refresh failed, user needs to re-authorize
      return null;
    }
  }

  return { accessToken: tokens.access_token, username: tokens.username };
}

/**
 * Start the OAuth authorization flow.
 * Opens the browser to the Hue authorization page and starts a local
 * HTTP server to catch the callback.
 */
export async function startAuthFlow(): Promise<string> {
  const config = getConfig();
  const callbackUrl = new URL(config.callbackUrl);
  const port = parseInt(callbackUrl.port, 10);

  return new Promise<string>((resolve, reject) => {
    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);

      if (url.pathname === callbackUrl.pathname) {
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(`<html><body><h1>Authorization Failed</h1><p>${error}</p></body></html>`);
          server.close();
          reject(new Error(`Authorization failed: ${error}`));
          return;
        }

        if (!code) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(`<html><body><h1>Missing Code</h1><p>No authorization code received.</p></body></html>`);
          server.close();
          reject(new Error("No authorization code received"));
          return;
        }

        try {
          const tokens = await exchangeCodeForTokens(code, config);
          await saveTokens(tokens);

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(
            `<html><body><h1>Authorization Successful!</h1><p>You can close this window and return to Claude.</p></body></html>`
          );
          server.close();
          resolve("Authorization successful! Tokens saved. You can now use Hue commands.");
        } catch (err) {
          res.writeHead(500, { "Content-Type": "text/html" });
          res.end(
            `<html><body><h1>Token Exchange Failed</h1><p>${err instanceof Error ? err.message : String(err)}</p></body></html>`
          );
          server.close();
          reject(err);
        }
      } else {
        res.writeHead(404);
        res.end("Not found");
      }
    });

    server.listen(port, () => {
      const authUrl = new URL(HUE_AUTH_URL);
      authUrl.searchParams.set("client_id", config.clientId);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("redirect_uri", config.callbackUrl);

      open(authUrl.toString()).catch(() => {
        // If browser open fails, user can manually navigate
      });

      // Set a timeout so the server doesn't hang forever
      setTimeout(() => {
        server.close();
        reject(new Error("Authorization timed out after 5 minutes"));
      }, 5 * 60 * 1000);
    });

    server.on("error", (err) => {
      reject(new Error(`Failed to start callback server: ${err.message}`));
    });
  });
}
