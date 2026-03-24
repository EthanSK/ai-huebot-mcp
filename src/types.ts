export interface HueTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  /** Timestamp (ms) when the access token was obtained */
  obtained_at: number;
  /** Whitelisted username for hue-application-key header (CLIP v2) */
  username?: string;
}

export interface HueConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export interface HueLightColor {
  xy?: { x: number; y: number };
  gamut_type?: string;
}

export interface HueLightDimming {
  brightness: number;
  min_dim_level?: number;
}

export interface HueLightOn {
  on: boolean;
}

export interface HueLight {
  id: string;
  id_v1?: string;
  type: string;
  metadata: {
    name: string;
    archetype: string;
  };
  on: HueLightOn;
  dimming?: HueLightDimming;
  color?: HueLightColor;
  color_temperature?: {
    mirek: number | null;
    mirek_valid: boolean;
    mirek_schema?: {
      mirek_minimum: number;
      mirek_maximum: number;
    };
  };
  owner: {
    rid: string;
    rtype: string;
  };
}

export interface HueScene {
  id: string;
  type: string;
  metadata: {
    name: string;
    image?: { rid: string; rtype: string };
  };
  group: {
    rid: string;
    rtype: string;
  };
  actions: Array<{
    target: { rid: string; rtype: string };
    action: {
      on?: { on: boolean };
      dimming?: { brightness: number };
      color?: { xy: { x: number; y: number } };
      color_temperature?: { mirek: number };
    };
  }>;
  status?: { active: string };
}

export interface HueApiResponse<T> {
  errors: Array<{ description: string }>;
  data: T[];
}

export interface LightStateUpdate {
  on?: { on: boolean };
  dimming?: { brightness: number };
  color?: { xy: { x: number; y: number } };
}

export interface VibeLight {
  light_id: string;
  color_hex: string;
  brightness: number;
}

export interface SavedVibe {
  name: string;
  slug: string;
  description: string;
  lights: VibeLight[];
  created_at: string;
}
