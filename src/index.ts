#!/usr/bin/env node

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { startAuthFlow, getValidAccessToken } from "./auth.js";
import {
  listLights,
  setLightState,
  setAllLightsState,
  listScenes,
  activateScene,
  hexToXy,
  formatLightInfo,
  hueApiPassthrough,
  runAnimation,
  stopAnimation,
  isAnimationRunning,
  setLightEffect,
  setAllLightsEffect,
} from "./hue-api.js";
import type { AnimationPhase } from "./hue-api.js";
import {
  saveVibe,
  listSavedVibes,
  getSavedVibe,
  deleteSavedVibe,
} from "./saved-vibes.js";
import type { LightStateUpdate } from "./types.js";
import {
  rateVibe,
  incrementTimesShown,
  getVibeFeedback,
  getFavorites,
  getUserHint,
  acknowledgeHint,
} from "./feedback.js";
import {
  getUserProfile,
  updateUserProfile,
  updateLightInventory,
  logVibeToHistory,
  updatePreferencesFromRating,
  noteVibeAsFavourite,
} from "./user-profile.js";

const server = new McpServer({
  name: "ai-huebot",
  version: "1.0.0",
});

// --- hue_auth ---
server.tool(
  "hue_auth",
  "Start the Philips Hue OAuth authorization flow. Opens a browser window to authorize access to your Hue lights. Only needed on first use or when tokens expire.",
  async () => {
    // Check if already authorized
    const existing = await getValidAccessToken();
    if (existing) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Already authorized! Your Hue tokens are valid. Use list_lights to see your lights.",
          },
        ],
      };
    }

    try {
      const result = await startAuthFlow();
      return {
        content: [{ type: "text" as const, text: result }],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Authorization failed: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- hue_api (generic CLIP v2 passthrough) ---
server.tool(
  "hue_api",
  "Make an arbitrary Philips Hue CLIP v2 API call. This gives full unrestricted access to the Hue API. The path is relative to /route/clip/v2/ (e.g. 'resource/light', 'resource/light/{id}', 'resource/scene', 'resource/grouped_light/{id}', 'resource/room', 'resource/zone', 'resource/bridge'). See https://developers.meethue.com/develop/hue-api-v2/ for full API docs.",
  {
    method: z
      .enum(["GET", "PUT", "POST", "DELETE"])
      .describe("HTTP method"),
    path: z
      .string()
      .describe(
        "API path after /route/clip/v2/ (e.g. 'resource/light', 'resource/light/{id}', 'resource/scene', 'resource/grouped_light/{id}')"
      ),
    body: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Optional JSON body for PUT/POST requests"),
  },
  async ({ method, path, body }) => {
    try {
      const result = await hueApiPassthrough(method, path, body);

      const text =
        typeof result.data === "string"
          ? result.data
          : JSON.stringify(result.data, null, 2);

      return {
        content: [
          {
            type: "text" as const,
            text: `HTTP ${result.status}\n\n${text}`,
          },
        ],
        isError: result.status >= 400,
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error calling Hue API: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- list_lights ---
server.tool(
  "list_lights",
  "List all Philips Hue lights with their current state including on/off, brightness, and color.",
  async () => {
    try {
      const lights = await listLights();
      const formatted = lights.map(formatLightInfo).join("\n");

      // Auto-update user profile with light inventory
      try {
        await updateLightInventory(lights);
      } catch {
        // Non-critical, don't fail list_lights
      }

      return {
        content: [
          {
            type: "text" as const,
            text: lights.length > 0
              ? `Found ${lights.length} lights:\n\n${formatted}`
              : "No lights found.",
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error listing lights: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- set_light ---
server.tool(
  "set_light",
  "Set a specific Hue light's state. You can control on/off, brightness (0-100), and color (hex string like #FF0000 or xy coordinates).",
  {
    light_id: z.string().describe("The light ID (from list_lights)"),
    on: z.boolean().optional().describe("Turn the light on (true) or off (false)"),
    brightness: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe("Brightness percentage (0-100)"),
    color_hex: z
      .string()
      .optional()
      .describe("Color as hex string (e.g. #FF0000 for red)"),
    color_xy_x: z.number().min(0).max(1).optional().describe("CIE x color coordinate"),
    color_xy_y: z.number().min(0).max(1).optional().describe("CIE y color coordinate"),
  },
  async ({ light_id, on, brightness, color_hex, color_xy_x, color_xy_y }) => {
    try {
      const state: LightStateUpdate = {};

      if (on !== undefined) {
        state.on = { on };
      }

      if (brightness !== undefined) {
        state.dimming = { brightness };
      }

      if (color_hex) {
        state.color = { xy: hexToXy(color_hex) };
      } else if (color_xy_x !== undefined && color_xy_y !== undefined) {
        state.color = { xy: { x: color_xy_x, y: color_xy_y } };
      }

      await setLightState(light_id, state);

      return {
        content: [
          {
            type: "text" as const,
            text: `Light ${light_id} updated successfully.`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error setting light: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- set_all_lights ---
server.tool(
  "set_all_lights",
  "Set all Hue lights to the same state. You can control on/off, brightness, and color.",
  {
    on: z.boolean().optional().describe("Turn all lights on (true) or off (false)"),
    brightness: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe("Brightness percentage (0-100)"),
    color_hex: z
      .string()
      .optional()
      .describe("Color as hex string (e.g. #FF0000 for red)"),
  },
  async ({ on, brightness, color_hex }) => {
    try {
      const state: LightStateUpdate = {};

      if (on !== undefined) {
        state.on = { on };
      }

      if (brightness !== undefined) {
        state.dimming = { brightness };
      }

      if (color_hex) {
        state.color = { xy: hexToXy(color_hex) };
      }

      const results = await setAllLightsState(state);

      let message = `Updated ${results.succeeded} lights.`;
      if (results.failed > 0) {
        message += `\n${results.failed} failed:\n${results.errors.join("\n")}`;
      }

      return {
        content: [{ type: "text" as const, text: message }],
        isError: results.failed > 0,
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- set_scene ---
server.tool(
  "set_scene",
  "Activate a Hue scene by name. Lists available scenes if the exact name is not found.",
  {
    scene_name: z.string().describe("The name of the scene to activate"),
  },
  async ({ scene_name }) => {
    try {
      const scenes = await listScenes();
      const match = scenes.find(
        (s) => s.metadata.name.toLowerCase() === scene_name.toLowerCase()
      );

      if (!match) {
        const available = scenes.map((s) => s.metadata.name).join(", ");
        return {
          content: [
            {
              type: "text" as const,
              text: `Scene "${scene_name}" not found. Available scenes: ${available || "none"}`,
            },
          ],
          isError: true,
        };
      }

      await activateScene(match.id);

      return {
        content: [
          {
            type: "text" as const,
            text: `Scene "${match.metadata.name}" activated.`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error setting scene: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- set_vibe ---
server.tool(
  "set_vibe",
  "Set a vibe across your lights. Provide a vibe description and an array of light settings that match the vibe. Claude should determine appropriate colors and brightness for each light based on the vibe description.",
  {
    vibe: z.string().describe("Description of the vibe (e.g. 'cozy evening', 'deep focus', 'sunset')"),
    lights: z.array(
      z.object({
        light_id: z.string().describe("The light ID"),
        color_hex: z.string().describe("Hex color for this light (e.g. #FF6B35)"),
        brightness: z.number().min(0).max(100).describe("Brightness percentage (0-100)"),
      })
    ).describe("Array of light settings. Use list_lights first to get available light IDs."),
  },
  async ({ vibe, lights }) => {
    try {
      const results: string[] = [];
      let failures = 0;

      await Promise.allSettled(
        lights.map(async (light) => {
          try {
            const state: LightStateUpdate = {
              on: { on: true },
              dimming: { brightness: light.brightness },
              color: { xy: hexToXy(light.color_hex) },
            };
            await setLightState(light.light_id, state);
            results.push(`${light.light_id}: set to ${light.color_hex} at ${light.brightness}%`);
          } catch (err) {
            failures++;
            results.push(
              `${light.light_id}: FAILED - ${err instanceof Error ? err.message : String(err)}`
            );
          }
        })
      );

      // Auto-save the vibe configuration
      let saveMessage = "";
      try {
        const saved = await saveVibe(vibe, vibe, lights);
        saveMessage = `\nVibe saved as "${saved.name}" (${saved.slug}).`;
      } catch (saveErr) {
        saveMessage = `\n(Failed to auto-save vibe: ${saveErr instanceof Error ? saveErr.message : String(saveErr)})`;
      }

      // Track usage
      try {
        await incrementTimesShown(vibe);
      } catch {
        // Non-critical, don't fail the vibe set
      }

      // Auto-update user profile with vibe history
      try {
        await logVibeToHistory(vibe, lights);
      } catch {
        // Non-critical
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Vibe "${vibe}" applied!\n\n${results.join("\n")}${saveMessage}`,
          },
        ],
        isError: failures > 0,
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error setting vibe: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- save_vibe ---
server.tool(
  "save_vibe",
  "Save the current light state as a named vibe. Captures a snapshot of specified lights with their colors and brightness so it can be re-applied later.",
  {
    name: z.string().describe("A memorable name for the vibe (e.g. 'sunset chill', 'deep focus')"),
    description: z.string().optional().describe("Optional description of the vibe"),
    lights: z.array(
      z.object({
        light_id: z.string().describe("The light ID"),
        color_hex: z.string().describe("Hex color for this light (e.g. #FF6B35)"),
        brightness: z.number().min(0).max(100).describe("Brightness percentage (0-100)"),
      })
    ).describe("Array of light settings to save. Use list_lights first to get current state."),
  },
  async ({ name, description, lights }) => {
    try {
      const saved = await saveVibe(name, description ?? name, lights);

      // Auto-update user profile with favourite note
      try {
        await noteVibeAsFavourite(name, description ?? name);
      } catch {
        // Non-critical
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Vibe "${saved.name}" saved successfully (slug: ${saved.slug}). You can re-apply it later with apply_saved_vibe.`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error saving vibe: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- list_saved_vibes ---
server.tool(
  "list_saved_vibes",
  "List all previously saved vibes. Shows names, descriptions, and light configurations.",
  async () => {
    try {
      const vibes = await listSavedVibes();

      if (vibes.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No saved vibes found. Use set_vibe or save_vibe to create some!",
            },
          ],
        };
      }

      const formatted = vibes
        .map((v) => {
          const lightSummary = v.lights
            .map((l) => `  ${l.light_id}: ${l.color_hex} at ${l.brightness}%`)
            .join("\n");
          return `${v.name} (${v.slug})\n  Description: ${v.description}\n  Created: ${v.created_at}\n  Lights:\n${lightSummary}`;
        })
        .join("\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${vibes.length} saved vibe(s):\n\n${formatted}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error listing vibes: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- apply_saved_vibe ---
server.tool(
  "apply_saved_vibe",
  "Apply a previously saved vibe by name. Restores the light configuration that was saved.",
  {
    name: z.string().describe("The name of the saved vibe to apply"),
  },
  async ({ name }) => {
    try {
      const vibe = await getSavedVibe(name);

      if (!vibe) {
        const available = await listSavedVibes();
        const names = available.map((v) => v.name).join(", ");
        return {
          content: [
            {
              type: "text" as const,
              text: `Vibe "${name}" not found. Available vibes: ${names || "none"}`,
            },
          ],
          isError: true,
        };
      }

      const results: string[] = [];
      let failures = 0;

      await Promise.allSettled(
        vibe.lights.map(async (light) => {
          try {
            const state: LightStateUpdate = {
              on: { on: true },
              dimming: { brightness: light.brightness },
              color: { xy: hexToXy(light.color_hex) },
            };
            await setLightState(light.light_id, state);
            results.push(`${light.light_id}: set to ${light.color_hex} at ${light.brightness}%`);
          } catch (err) {
            failures++;
            results.push(
              `${light.light_id}: FAILED - ${err instanceof Error ? err.message : String(err)}`
            );
          }
        })
      );

      // Track usage
      try {
        await incrementTimesShown(vibe.name);
      } catch {
        // Non-critical
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Vibe "${vibe.name}" applied!\n\n${results.join("\n")}`,
          },
        ],
        isError: failures > 0,
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error applying vibe: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- delete_saved_vibe ---
server.tool(
  "delete_saved_vibe",
  "Delete a previously saved vibe by name.",
  {
    name: z.string().describe("The name of the saved vibe to delete"),
  },
  async ({ name }) => {
    try {
      const deleted = await deleteSavedVibe(name);

      if (!deleted) {
        const available = await listSavedVibes();
        const names = available.map((v) => v.name).join(", ");
        return {
          content: [
            {
              type: "text" as const,
              text: `Vibe "${name}" not found. Available vibes: ${names || "none"}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Vibe "${name}" deleted successfully.`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error deleting vibe: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- rate_vibe ---
server.tool(
  "rate_vibe",
  "Rate a vibe and/or leave feedback. At least one of rating or feedback must be provided. Use the vibe name from saved vibes.",
  {
    vibe_name: z.string().describe("The name of the vibe to rate (must match a saved vibe name)"),
    rating: z
      .number()
      .min(1)
      .max(10)
      .optional()
      .describe("Rating from 1 to 10"),
    feedback: z
      .string()
      .optional()
      .describe("Optional text feedback about the vibe"),
  },
  async ({ vibe_name, rating, feedback }) => {
    try {
      const entry = await rateVibe(vibe_name, rating, feedback);
      const parts: string[] = [];
      if (entry.rating !== undefined) parts.push(`Rating: ${entry.rating}/10`);
      if (entry.feedback) parts.push(`Feedback: "${entry.feedback}"`);
      parts.push(`Times applied: ${entry.times_shown}`);

      // Auto-update user profile with rating preferences
      if (rating !== undefined) {
        try {
          await updatePreferencesFromRating(vibe_name, rating, feedback);
        } catch {
          // Non-critical
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Feedback saved for "${vibe_name}".\n${parts.join("\n")}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error rating vibe: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- get_vibe_feedback ---
server.tool(
  "get_vibe_feedback",
  "Retrieve all vibe feedback entries. Optionally filter by minimum rating or sort by rating. Useful for understanding user preferences.",
  {
    min_rating: z
      .number()
      .min(1)
      .max(10)
      .optional()
      .describe("Only return vibes with at least this rating"),
    sort_by_rating: z
      .boolean()
      .optional()
      .describe("Sort results by rating descending (default: false)"),
  },
  async ({ min_rating, sort_by_rating }) => {
    try {
      const entries = await getVibeFeedback({ min_rating, sort_by_rating });

      if (entries.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No feedback found yet. Use rate_vibe to rate vibes after setting them.",
            },
          ],
        };
      }

      const formatted = entries
        .map((e) => {
          const parts = [`${e.vibe_name} (${e.vibe_slug})`];
          if (e.rating !== undefined) parts.push(`  Rating: ${e.rating}/10`);
          if (e.feedback) parts.push(`  Feedback: "${e.feedback}"`);
          parts.push(`  Times applied: ${e.times_shown}`);
          parts.push(`  Last updated: ${e.timestamp}`);
          return parts.join("\n");
        })
        .join("\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${entries.length} feedback entry/entries:\n\n${formatted}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error getting feedback: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- get_favorites ---
server.tool(
  "get_favorites",
  "Get top-rated vibes (rating >= 7 by default). Use this to suggest vibes the user has enjoyed before.",
  {
    min_rating: z
      .number()
      .min(1)
      .max(10)
      .optional()
      .describe("Minimum rating threshold (default: 7)"),
  },
  async ({ min_rating }) => {
    try {
      const favorites = await getFavorites(min_rating);

      if (favorites.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No favorite vibes found (with rating >= ${min_rating ?? 7}). Rate some vibes first!`,
            },
          ],
        };
      }

      const formatted = favorites
        .map((e) => {
          const parts = [`${e.vibe_name} (${e.vibe_slug})`];
          parts.push(`  Rating: ${e.rating}/10`);
          if (e.feedback) parts.push(`  Feedback: "${e.feedback}"`);
          parts.push(`  Times applied: ${e.times_shown}`);
          return parts.join("\n");
        })
        .join("\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${favorites.length} favorite vibe(s):\n\n${formatted}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error getting favorites: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- get_user_hint ---
server.tool(
  "get_user_hint",
  "Get a hint message about the feedback system for the user. Returns a hint only if the user hasn't been told about the feedback system yet. Relay the hint text to the user if one is returned.",
  async () => {
    try {
      const hint = await getUserHint();
      if (hint) {
        return {
          content: [
            {
              type: "text" as const,
              text: hint,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: "Hint already acknowledged. No need to show again.",
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error getting hint: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- acknowledge_hint ---
server.tool(
  "acknowledge_hint",
  "Mark the feedback system hint as shown so it won't be displayed again.",
  async () => {
    try {
      await acknowledgeHint();
      return {
        content: [
          {
            type: "text" as const,
            text: "Hint acknowledged. It won't be shown again.",
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error acknowledging hint: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- get_user_profile ---
server.tool(
  "get_user_profile",
  "Get the full user profile with light preferences, vibe history, colour preferences, and patterns. Read this before making vibe decisions to personalise recommendations. The profile is stored as markdown at ~/.ai-huebot/user-profile.md and is auto-populated over time.",
  async () => {
    try {
      const profile = await getUserProfile();
      return {
        content: [
          {
            type: "text" as const,
            text: profile,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error getting user profile: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- update_user_profile ---
server.tool(
  "update_user_profile",
  "Update a section of the user profile with new observations, preferences, or notes. Use this to record things the user tells you about their preferences, or to add evolution notes with suggestions.",
  {
    section: z
      .string()
      .describe(
        "The section to update. One of: 'light inventory', 'room mappings', 'colour preferences', 'color preferences', 'time-of-day patterns', 'time of day patterns', 'vibe history', 'explicit preferences', 'evolution notes'"
      ),
    content: z
      .string()
      .describe(
        "The new content for the section (markdown format). Replaces the entire section content."
      ),
  },
  async ({ section, content }) => {
    try {
      const result = await updateUserProfile(section, content);
      return {
        content: [
          {
            type: "text" as const,
            text: result,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error updating user profile: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- animate_lights ---
server.tool(
  "animate_lights",
  "Animate lights through a sequence of color phases. Each phase defines colors/brightness for each light, and the animation cycles through them with smooth transitions. Great for dynamic vibes like 'lava flow', 'ocean waves', 'disco', etc. The AI should generate creative phases based on the vibe description. The animation runs in the background and can be stopped with stop_animation.",
  {
    phases: z
      .array(
        z.object({
          lights: z
            .array(
              z.object({
                light_id: z.string().describe("The light ID"),
                color_hex: z
                  .string()
                  .describe("Hex color for this light in this phase (e.g. #FF6B35)"),
                brightness: z
                  .number()
                  .min(0)
                  .max(100)
                  .describe("Brightness percentage (0-100)"),
              })
            )
            .describe("Light settings for this phase"),
        })
      )
      .describe(
        "Array of animation phases. The animation cycles through these in order. Use at least 2-3 phases for a good effect."
      ),
    duration_per_phase: z
      .number()
      .min(500)
      .max(30000)
      .optional()
      .describe("How long each phase lasts in milliseconds (default: 3000)"),
    transition_time: z
      .number()
      .min(0)
      .max(30000)
      .optional()
      .describe(
        "How long the transition between phases takes in milliseconds, using Hue dynamics (default: 2500)"
      ),
    cycles: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe(
        "How many times to loop through all phases (default: 5)"
      ),
    vibe: z
      .string()
      .optional()
      .describe("Optional vibe description for context (e.g. 'lava flow', 'aurora borealis')"),
  },
  async ({ phases, duration_per_phase, transition_time, cycles, vibe }) => {
    try {
      const durationMs = duration_per_phase ?? 3000;
      const transitionMs = transition_time ?? 2500;
      const numCycles = cycles ?? 5;

      if (phases.length < 1) {
        return {
          content: [
            {
              type: "text" as const,
              text: "At least 1 phase is required for an animation.",
            },
          ],
          isError: true,
        };
      }

      const vibeLabel = vibe ? `"${vibe}" ` : "";

      // Run the animation in the background (non-blocking)
      // We kick it off and return immediately so the MCP call doesn't block
      const animationPromise = runAnimation(
        phases as AnimationPhase[],
        durationMs,
        transitionMs,
        numCycles
      );

      // Wait a short moment for the first phase to apply so we can confirm it started
      await new Promise((resolve) => setTimeout(resolve, 200));

      if (!isAnimationRunning()) {
        // Animation already finished or failed to start — await the result
        const result = await animationPromise;
        return {
          content: [
            {
              type: "text" as const,
              text: result.completed
                ? `Animation ${vibeLabel}completed! Applied ${result.phasesApplied} phase transitions across ${numCycles} cycle(s).`
                : `Animation ${vibeLabel}stopped after ${result.phasesApplied} phase(s).`,
            },
          ],
        };
      }

      // Animation is running in the background — let it continue
      // Don't await the promise; it runs independently
      animationPromise.catch(() => {
        // Swallow errors from background animation
      });

      const totalDuration = (durationMs * phases.length * numCycles) / 1000;
      return {
        content: [
          {
            type: "text" as const,
            text: `Animation ${vibeLabel}started! Cycling through ${phases.length} phase(s) for ${numCycles} cycle(s) (~${Math.round(totalDuration)}s total). Phase duration: ${durationMs}ms, transition: ${transitionMs}ms. Use stop_animation to stop it early.`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error starting animation: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- set_effect ---
server.tool(
  "set_effect",
  "Set a native Hue light effect. Supported effects: 'candle' (candle flicker), 'fire' (fireplace), 'prism' (color cycling/rainbow). Use 'no_effect' to stop. Can target a specific light or all lights.",
  {
    effect: z
      .enum(["candle", "fire", "prism", "no_effect"])
      .describe(
        "The effect to apply: 'candle' (flicker), 'fire' (fireplace), 'prism' (color cycling), or 'no_effect' to stop"
      ),
    light_id: z
      .string()
      .optional()
      .describe(
        "Optional specific light ID. If omitted, applies to all lights."
      ),
  },
  async ({ effect, light_id }) => {
    try {
      if (light_id) {
        await setLightEffect(light_id, effect);
        return {
          content: [
            {
              type: "text" as const,
              text:
                effect === "no_effect"
                  ? `Effect stopped on light ${light_id}.`
                  : `Effect "${effect}" applied to light ${light_id}.`,
            },
          ],
        };
      }

      // Apply to all lights
      const results = await setAllLightsEffect(effect);
      let message =
        effect === "no_effect"
          ? `Effects stopped on ${results.succeeded} light(s).`
          : `Effect "${effect}" applied to ${results.succeeded} light(s).`;
      if (results.failed > 0) {
        message += `\n${results.failed} failed:\n${results.errors.join("\n")}`;
      }

      return {
        content: [{ type: "text" as const, text: message }],
        isError: results.failed > 0,
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error setting effect: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- stop_animation ---
server.tool(
  "stop_animation",
  "Stop any currently running animation or effect. Stops background phase animations started by animate_lights, and also clears any native Hue effects (candle, fire, prism) on all lights.",
  async () => {
    try {
      const wasRunning = stopAnimation();
      // Also clear native effects on all lights
      const effectResults = await setAllLightsEffect("no_effect");

      const parts: string[] = [];
      if (wasRunning) {
        parts.push("Background animation stopped.");
      }
      if (effectResults.succeeded > 0) {
        parts.push(
          `Native effects cleared on ${effectResults.succeeded} light(s).`
        );
      }
      if (effectResults.failed > 0) {
        parts.push(
          `${effectResults.failed} light(s) failed to clear effects:\n${effectResults.errors.join("\n")}`
        );
      }

      if (parts.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No animation or effects were running.",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: parts.join("\n"),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error stopping animation: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// --- Start server ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AI HueBot server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
