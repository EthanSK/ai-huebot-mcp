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

  return {
    ...data,
    obtained_at: Date.now(),
  };
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
 * Get a valid access token, refreshing if necessary.
 * Returns null if no tokens are saved (user needs to authorize).
 */
export async function getValidAccessToken(): Promise<string | null> {
  const config = getConfig();
  let tokens = await loadTokens();

  if (!tokens) {
    return null;
  }

  if (isTokenExpired(tokens)) {
    try {
      tokens = await refreshAccessToken(tokens.refresh_token, config);
      await saveTokens(tokens);
    } catch {
      // Refresh failed, user needs to re-authorize
      return null;
    }
  }

  return tokens.access_token;
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
