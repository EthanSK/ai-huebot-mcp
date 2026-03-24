import { getValidAccessToken } from "./auth.js";
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
    // Fallback to v1 API when v2 returns 403.
    // This happens when the username/hue-application-key isn't set up yet
    // (e.g. first auth before the bridge whitelist step completes).
    // The v1 API only needs a Bearer token, no application key.
    if (response.status === 403) {
      const v1Path = mapV2PathToV1(path);
      if (v1Path) {
        console.warn(
          `[AI HueBot] CLIP v2 returned 403 for ${path}, falling back to v1 API: ${v1Path}`
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
