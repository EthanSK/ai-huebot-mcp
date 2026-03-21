import { getValidAccessToken } from "./auth.js";
import type {
  HueApiResponse,
  HueLight,
  HueScene,
  LightStateUpdate,
} from "./types.js";

const RESOURCE_URL = "https://api.meethue.com/route/clip/v2/resource";

async function getAccessToken(): Promise<string> {
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error(
      "Not authorized. Please run the hue_auth tool first to connect your Hue account."
    );
  }
  return token;
}

async function hueRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<HueApiResponse<T>> {
  const token = await getAccessToken();
  const url = `${RESOURCE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
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
  state: LightStateUpdate
): Promise<void> {
  const response = await hueRequest<unknown>(`/light/${lightId}`, {
    method: "PUT",
    body: JSON.stringify(state),
  });

  if (response.errors.length > 0) {
    throw new Error(
      `Failed to update light: ${response.errors.map((e) => e.description).join(", ")}`
    );
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
        await setLightState(light.id, state);
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
