import { getValidAccessToken, ensureUsername, forceRefreshToken } from "./auth.js";
import type {
  HueApiResponse,
  HueLight,
  HueScene,
  LightStateUpdate,
} from "./types.js";

const RESOURCE_URL = "https://api.meethue.com/route/clip/v2/resource";
const V1_BASE_URL = "https://api.meethue.com/route/api/0";

async function getCredentials(): Promise<{
  accessToken: string;
  username: string | undefined;
}> {
  const result = await getValidAccessToken();
  if (!result) {
    throw new Error(
      "Not authorized. Please run the hue_auth tool first to connect your Hue account."
    );
  }
  return result;
}

/**
 * Map a CLIP v2 resource path to the equivalent v1 API path.
 * Returns undefined if there's no known mapping.
 */
function mapV2PathToV1(path: string): string | undefined {
  // /light → /lights
  if (path === "/light") return "/lights";
  // /scene → /scenes
  if (path === "/scene") return "/scenes";

  // /light/{id} → /lights/{id}/state
  const lightMatch = path.match(/^\/light\/(.+)$/);
  if (lightMatch) return `/lights/${lightMatch[1]}/state`;

  // /scene/{id} → /scenes/{id}
  const sceneMatch = path.match(/^\/scene\/(.+)$/);
  if (sceneMatch) return `/scenes/${sceneMatch[1]}`;

  return undefined;
}

/**
 * Convert a v2 PUT body to a v1-compatible body where needed.
 * For scenes, v2 uses {"recall":{"action":"active"}} but v1 just needs the body as-is for PUT.
 * For lights, v2 body goes to /lights/{id}/state in v1.
 */
function mapV2BodyToV1(path: string, body: string | undefined): string | undefined {
  if (!body) return body;

  // Scene recall: v2 {"recall":{"action":"active"}} → v1 scene PUT just needs to be triggered
  const sceneMatch = path.match(/^\/scene\/.+$/);
  if (sceneMatch) {
    try {
      const parsed = JSON.parse(body);
      if (parsed.recall?.action === "active") {
        return JSON.stringify({ on: true });
      }
    } catch {
      // Fall through with original body
    }
  }

  // Light state: v2 {"on":{"on":true},"dimming":{"brightness":50},"color":{"xy":{"x":0.3,"y":0.15}}}
  //           → v1 {"on":true,"bri":127,"xy":[0.3,0.15]}
  const lightMatch = path.match(/^\/light\/.+$/);
  if (lightMatch) {
    try {
      const parsed = JSON.parse(body) as LightStateUpdate;
      const v1Body: Record<string, unknown> = {};
      if (parsed.on !== undefined) v1Body.on = parsed.on.on;
      if (parsed.dimming !== undefined) v1Body.bri = Math.round((parsed.dimming.brightness / 100) * 254);
      if (parsed.color?.xy) v1Body.xy = [parsed.color.xy.x, parsed.color.xy.y];
      if (parsed.dynamics?.duration !== undefined) v1Body.transitiontime = Math.round(parsed.dynamics.duration / 100);
      if (parsed.effects?.effect) v1Body.effect = parsed.effects.effect === "no_effect" ? "none" : parsed.effects.effect;
      return JSON.stringify(v1Body);
    } catch {
      // Fall through with original body
    }
  }

  return body;
}

async function hueRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<HueApiResponse<T>> {
  const { accessToken, username } = await getCredentials();
  const url = `${RESOURCE_URL}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  if (username) {
    headers["hue-application-key"] = username;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    // Handle 403: the hue-application-key (username) is missing or invalid.
    // Try to create one and retry the v2 request before falling back to v1.
    if (response.status === 403) {
      // Attempt to create a username if we don't have one
      if (!username) {
        console.warn(
          `[AI HueBot] CLIP v2 returned 403 for ${path} (no hue-application-key), attempting to create one...`
        );
        const newUsername = await ensureUsername(accessToken);
        if (newUsername) {
          // Retry the v2 request with the new username
          const retryHeaders: Record<string, string> = {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "hue-application-key": newUsername,
          };
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...retryHeaders,
              ...(options.headers as Record<string, string>),
            },
          });
          if (retryResponse.ok) {
            return (await retryResponse.json()) as HueApiResponse<T>;
          }
          console.warn(
            `[AI HueBot] CLIP v2 retry with new username also returned ${retryResponse.status}`
          );
        }
      } else {
        // Token may be stale — try refreshing and retrying once
        console.warn(
          `[AI HueBot] CLIP v2 returned 403 for ${path} (hue-application-key present but rejected), refreshing token...`
        );
        const refreshed = await forceRefreshToken();
        if (refreshed) {
          const retryHeaders: Record<string, string> = {
            Authorization: `Bearer ${refreshed.accessToken}`,
            "Content-Type": "application/json",
          };
          if (refreshed.username) {
            retryHeaders["hue-application-key"] = refreshed.username;
          }
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...retryHeaders,
              ...(options.headers as Record<string, string>),
            },
          });
          if (retryResponse.ok) {
            return (await retryResponse.json()) as HueApiResponse<T>;
          }
          console.warn(
            `[AI HueBot] CLIP v2 retry after token refresh also returned ${retryResponse.status}`
          );
        }
      }

      // Fallback to v1 API.
      // The v1 API only needs a Bearer token, no application key.
      const v1Path = mapV2PathToV1(path);
      if (v1Path) {
        console.warn(
          `[AI HueBot] Falling back to v1 API: ${v1Path}`
        );
        try {
          const v1Url = `${V1_BASE_URL}${v1Path}`;
          const v1Body = mapV2BodyToV1(path, options.body as string | undefined);

          const v1Response = await fetch(v1Url, {
            ...options,
            body: v1Body,
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });

          if (!v1Response.ok) {
            const v1Text = await v1Response.text();
            throw new Error(`Hue v1 API error (${v1Response.status}): ${v1Text}`);
          }

          // v1 response format differs from v2 — best-effort conversion.
          // v1 returns either an array or an object; wrap it to match HueApiResponse shape.
          const v1Data = await v1Response.json();

          // v1 list endpoints return { "1": {...}, "2": {...} } — convert to array
          if (v1Data && typeof v1Data === "object" && !Array.isArray(v1Data)) {
            const items = Object.entries(v1Data).map(([key, value]) => ({
              id: key,
              ...(value as Record<string, unknown>),
            }));
            return { errors: [], data: items } as unknown as HueApiResponse<T>;
          }

          // v1 PUT responses return an array of success/error objects
          if (Array.isArray(v1Data)) {
            // Check if v1 returned errors (e.g. invalid light ID or body format)
            const v1Errors = v1Data.filter(
              (item: Record<string, unknown>) => item.error
            );
            if (v1Errors.length > 0) {
              const descriptions = v1Errors.map(
                (item: Record<string, unknown>) =>
                  (item.error as Record<string, unknown>)?.description ?? "unknown error"
              );
              throw new Error(`Hue v1 API errors: ${descriptions.join(", ")}`);
            }
            return { errors: [], data: v1Data } as unknown as HueApiResponse<T>;
          }

          return { errors: [], data: [v1Data] } as unknown as HueApiResponse<T>;
        } catch (v1Error) {
          console.warn(
            `[AI HueBot] v1 fallback also failed:`,
            v1Error instanceof Error ? v1Error.message : String(v1Error)
          );
          // Fall through to throw the original v2 error
        }
      }
    }

    const text = await response.text();
    throw new Error(`Hue API error (${response.status}): ${text}`);
  }

  return (await response.json()) as HueApiResponse<T>;
}

export async function listLights(): Promise<HueLight[]> {
  const response = await hueRequest<HueLight>("/light");

  if (response.errors.length > 0) {
    throw new Error(
      `Hue API errors: ${response.errors.map((e) => e.description).join(", ")}`
    );
  }

  return response.data;
}

export async function setLightState(
  lightId: string,
  state: LightStateUpdate,
  idV1?: string
): Promise<void> {
  try {
    const response = await hueRequest<unknown>(`/light/${lightId}`, {
      method: "PUT",
      body: JSON.stringify(state),
    });

    if (response.errors.length > 0) {
      throw new Error(
        `Failed to update light: ${response.errors.map((e) => e.description).join(", ")}`
      );
    }
  } catch (err) {
    // If v2 PUT failed (403 fallback also failed), try direct v1 with numeric ID
    if (!idV1) {
      // Look up id_v1 from list_lights
      try {
        const lights = await listLights();
        const light = lights.find((l) => l.id === lightId);
        if (light?.id_v1) idV1 = light.id_v1;
      } catch { /* ignore lookup failure */ }
    }
    if (idV1) {
      const numericId = idV1.replace(/^\/lights\//, "");
      const { accessToken } = await getCredentials();
      const v1State: Record<string, unknown> = {};
      if (state.on !== undefined) v1State.on = state.on.on;
      if (state.dimming !== undefined) v1State.bri = Math.round((state.dimming.brightness / 100) * 254);
      if (state.color?.xy) {
        v1State.xy = [state.color.xy.x, state.color.xy.y];
      }
      const v1Res = await fetch(
        `${V1_BASE_URL}/lights/${numericId}/state`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(v1State),
        }
      );
      if (!v1Res.ok) {
        throw new Error(`v1 fallback failed (${v1Res.status}): ${await v1Res.text()}`);
      }
      const v1Data = await v1Res.json() as Array<{ error?: { description: string } }>;
      const v1Errors = v1Data.filter((r) => r.error);
      if (v1Errors.length > 0) {
        throw new Error(`v1 errors: ${v1Errors.map((e) => e.error!.description).join(", ")}`);
      }
      return;
    }
    throw err;
  }
}

export async function setAllLightsState(
  state: LightStateUpdate
): Promise<{ succeeded: number; failed: number; errors: string[] }> {
  const lights = await listLights();
  const results = { succeeded: 0, failed: 0, errors: [] as string[] };

  await Promise.allSettled(
    lights.map(async (light) => {
      try {
        await setLightState(light.id, state, light.id_v1);
        results.succeeded++;
      } catch (err) {
        results.failed++;
        results.errors.push(
          `${light.metadata.name}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    })
  );

  return results;
}

export async function listScenes(): Promise<HueScene[]> {
  const response = await hueRequest<HueScene>("/scene");

  if (response.errors.length > 0) {
    throw new Error(
      `Hue API errors: ${response.errors.map((e) => e.description).join(", ")}`
    );
  }

  return response.data;
}

export async function activateScene(sceneId: string): Promise<void> {
  const response = await hueRequest<unknown>(`/scene/${sceneId}`, {
    method: "PUT",
    body: JSON.stringify({ recall: { action: "active" } }),
  });

  if (response.errors.length > 0) {
    throw new Error(
      `Failed to activate scene: ${response.errors.map((e) => e.description).join(", ")}`
    );
  }
}

/**
 * Convert a hex color string (#RRGGBB) to CIE xy color coordinates.
 * Uses the wide gamut D65 conversion.
 */
export function hexToXy(hex: string): { x: number; y: number } {
  // Strip # if present
  const clean = hex.replace(/^#/, "");

  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(
      `Invalid hex color "${hex}". Expected format: #RRGGBB or RRGGBB (e.g. #FF0000)`
    );
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  // Apply gamma correction
  const rLinear = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  const gLinear = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  const bLinear = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // Convert to XYZ (Wide RGB D65 conversion)
  const X = rLinear * 0.664511 + gLinear * 0.154324 + bLinear * 0.162028;
  const Y = rLinear * 0.283881 + gLinear * 0.668433 + bLinear * 0.047685;
  const Z = rLinear * 0.000088 + gLinear * 0.072310 + bLinear * 0.986039;

  const sum = X + Y + Z;
  if (sum === 0) {
    return { x: 0.3127, y: 0.3290 }; // D65 white point
  }

  return {
    x: Math.round((X / sum) * 10000) / 10000,
    y: Math.round((Y / sum) * 10000) / 10000,
  };
}

// --- Animation state management ---

/** Tracks the currently running animation so it can be stopped. */
let activeAnimationAbort: AbortController | null = null;

export function isAnimationRunning(): boolean {
  return activeAnimationAbort !== null && !activeAnimationAbort.signal.aborted;
}

export function stopAnimation(): boolean {
  if (activeAnimationAbort && !activeAnimationAbort.signal.aborted) {
    activeAnimationAbort.abort();
    activeAnimationAbort = null;
    return true;
  }
  activeAnimationAbort = null;
  return false;
}

export interface AnimationPhase {
  lights: Array<{
    light_id: string;
    color_hex: string;
    brightness: number;
  }>;
}

/**
 * Run a multi-phase animation loop across lights.
 * Cycles through phases, applying each one with a Hue transition (dynamics.duration),
 * then waiting for the phase duration before moving to the next.
 * Returns when all cycles complete or the animation is aborted.
 */
export async function runAnimation(
  phases: AnimationPhase[],
  durationPerPhase: number,
  transitionTime: number,
  cycles: number
): Promise<{ completed: boolean; phasesApplied: number }> {
  // Stop any existing animation first
  stopAnimation();

  const controller = new AbortController();
  activeAnimationAbort = controller;
  const signal = controller.signal;

  let phasesApplied = 0;

  try {
    for (let cycle = 0; cycle < cycles; cycle++) {
      for (const phase of phases) {
        if (signal.aborted) {
          return { completed: false, phasesApplied };
        }

        // Apply this phase to all lights in parallel
        await Promise.allSettled(
          phase.lights.map(async (light) => {
            const state: LightStateUpdate = {
              on: { on: true },
              dimming: { brightness: light.brightness },
              color: { xy: hexToXy(light.color_hex) },
              dynamics: { duration: transitionTime },
            };
            await setLightState(light.light_id, state);
          })
        );
        phasesApplied++;

        // Wait for the phase duration before moving to the next
        if (signal.aborted) {
          return { completed: false, phasesApplied };
        }
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, durationPerPhase);
          signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              reject(new Error("aborted"));
            },
            { once: true }
          );
        }).catch(() => {
          // Aborted during wait — that's fine
        });
      }
    }

    activeAnimationAbort = null;
    return { completed: true, phasesApplied };
  } catch {
    activeAnimationAbort = null;
    return { completed: false, phasesApplied };
  }
}

/**
 * Set a native Hue effect on a single light (e.g. "candle", "fire", "prism").
 * Pass "no_effect" to stop effects.
 */
export async function setLightEffect(
  lightId: string,
  effect: string
): Promise<void> {
  const state: LightStateUpdate = {
    effects: { effect },
  };
  // Also turn the light on if starting an effect
  if (effect !== "no_effect") {
    state.on = { on: true };
  }
  await setLightState(lightId, state);
}

/**
 * Set a native Hue effect on all lights.
 */
export async function setAllLightsEffect(
  effect: string
): Promise<{ succeeded: number; failed: number; errors: string[] }> {
  const lights = await listLights();
  const results = { succeeded: 0, failed: 0, errors: [] as string[] };

  await Promise.allSettled(
    lights.map(async (light) => {
      try {
        await setLightEffect(light.id, effect);
        results.succeeded++;
      } catch (err) {
        results.failed++;
        results.errors.push(
          `${light.metadata.name}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    })
  );

  return results;
}

/**
 * Generic CLIP v2 API passthrough.
 * Allows making arbitrary requests to the Hue CLIP v2 API.
 * The `path` should be relative to `/route/clip/v2/` (e.g. "resource/light", "resource/scene/{id}").
 */
export async function hueApiPassthrough(
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; data: unknown }> {
  const { accessToken, username } = await getCredentials();

  // Build the full URL — callers pass paths like "resource/light/{id}"
  // The hueRequest helper prepends RESOURCE_URL which is already .../clip/v2/resource,
  // so we go directly to the base clip/v2 endpoint instead.
  const baseUrl = "https://api.meethue.com/route/clip/v2";
  const url = `${baseUrl}/${path.replace(/^\/+/, "")}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  if (username) {
    headers["hue-application-key"] = username;
  }

  const fetchOptions: RequestInit = {
    method: method.toUpperCase(),
    headers,
  };

  if (body !== undefined && (method.toUpperCase() === "PUT" || method.toUpperCase() === "POST")) {
    fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  // Try to parse as JSON, fall back to text
  let responseData: unknown;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  return {
    status: response.status,
    data: responseData,
  };
}

export function formatLightInfo(light: HueLight): string {
  const parts = [
    `ID: ${light.id}`,
    `Name: ${light.metadata.name}`,
    `On: ${light.on.on}`,
  ];

  if (light.dimming) {
    parts.push(`Brightness: ${Math.round(light.dimming.brightness)}%`);
  }

  if (light.color?.xy) {
    parts.push(`Color XY: (${light.color.xy.x}, ${light.color.xy.y})`);
  }

  if (light.color_temperature?.mirek != null) {
    parts.push(`Color Temp: ${light.color_temperature.mirek} mirek`);
  }

  return parts.join(" | ");
}
