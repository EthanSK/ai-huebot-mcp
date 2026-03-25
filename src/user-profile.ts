import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { HueLight } from "./types.js";
import { listSavedVibes } from "./saved-vibes.js";
import { getVibeFeedback } from "./feedback.js";

const DATA_DIR = join(homedir(), ".ai-huebot");
const PROFILE_PATH = join(DATA_DIR, "user-profile.md");

// --- In-memory profile data for structured updates ---

interface ProfileData {
  lightInventory: string;
  roomMappings: string;
  colourPreferences: string;
  timeOfDayPatterns: string;
  vibeHistory: string;
  explicitPreferences: string;
  evolutionNotes: string;
}

const SECTION_NAMES: Record<string, keyof ProfileData> = {
  "light inventory": "lightInventory",
  "room mappings": "roomMappings",
  "colour preferences": "colourPreferences",
  "color preferences": "colourPreferences",
  "time-of-day patterns": "timeOfDayPatterns",
  "time of day patterns": "timeOfDayPatterns",
  "vibe history": "vibeHistory",
  "explicit preferences": "explicitPreferences",
  "evolution notes": "evolutionNotes",
};

// --- Helpers ---

async function ensureDataDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

function profileDataToMarkdown(data: ProfileData): string {
  return `# AI HueBot User Profile

This file is automatically maintained by AI HueBot to remember your light preferences and patterns. The LLM reads this before making vibe decisions.

## Light Inventory

${data.lightInventory || "_No lights discovered yet. Use list_lights to populate._"}

## Room Mappings

${data.roomMappings || "_No room mappings yet. These are inferred from light names and updated as lights are discovered._"}

## Colour Preferences

${data.colourPreferences || "_No colour preferences recorded yet. Rate vibes to build up preferences._"}

## Time-of-Day Patterns

${data.timeOfDayPatterns || "_No time patterns recorded yet. Patterns emerge as you use vibes at different times._"}

## Vibe History

${data.vibeHistory || "_No vibes applied yet._"}

## Explicit Preferences

${data.explicitPreferences || "_No explicit preferences noted yet. Tell the LLM what you like and it will record it here._"}

## Evolution Notes

${data.evolutionNotes || "_No evolution notes yet. Suggestions for trying new things will appear here as patterns develop._"}
`;
}

function markdownToProfileData(markdown: string): ProfileData {
  const data: ProfileData = {
    lightInventory: "",
    roomMappings: "",
    colourPreferences: "",
    timeOfDayPatterns: "",
    vibeHistory: "",
    explicitPreferences: "",
    evolutionNotes: "",
  };

  const sections: { heading: string; key: keyof ProfileData }[] = [
    { heading: "## Light Inventory", key: "lightInventory" },
    { heading: "## Room Mappings", key: "roomMappings" },
    { heading: "## Colour Preferences", key: "colourPreferences" },
    { heading: "## Time-of-Day Patterns", key: "timeOfDayPatterns" },
    { heading: "## Vibe History", key: "vibeHistory" },
    { heading: "## Explicit Preferences", key: "explicitPreferences" },
    { heading: "## Evolution Notes", key: "evolutionNotes" },
  ];

  for (let i = 0; i < sections.length; i++) {
    const start = markdown.indexOf(sections[i].heading);
    if (start === -1) continue;

    const contentStart = start + sections[i].heading.length;
    let contentEnd = markdown.length;

    // Find next section heading
    for (let j = i + 1; j < sections.length; j++) {
      const nextStart = markdown.indexOf(sections[j].heading, contentStart);
      if (nextStart !== -1) {
        contentEnd = nextStart;
        break;
      }
    }

    const content = markdown.substring(contentStart, contentEnd).trim();
    // Skip placeholder text
    if (!content.startsWith("_No ") && !content.startsWith("_")) {
      data[sections[i].key] = content;
    }
  }

  return data;
}

async function loadProfileData(): Promise<ProfileData> {
  try {
    const content = await readFile(PROFILE_PATH, "utf-8");
    return markdownToProfileData(content);
  } catch {
    return {
      lightInventory: "",
      roomMappings: "",
      colourPreferences: "",
      timeOfDayPatterns: "",
      vibeHistory: "",
      explicitPreferences: "",
      evolutionNotes: "",
    };
  }
}

async function saveProfileData(data: ProfileData): Promise<void> {
  await ensureDataDir();
  await writeFile(PROFILE_PATH, profileDataToMarkdown(data), "utf-8");
}

// --- Public API ---

/**
 * Get the full user profile as markdown.
 * If no profile exists, generates an initial one.
 */
export async function getUserProfile(): Promise<string> {
  if (!existsSync(PROFILE_PATH)) {
    await generateInitialProfile();
  }

  try {
    return await readFile(PROFILE_PATH, "utf-8");
  } catch {
    return profileDataToMarkdown({
      lightInventory: "",
      roomMappings: "",
      colourPreferences: "",
      timeOfDayPatterns: "",
      vibeHistory: "",
      explicitPreferences: "",
      evolutionNotes: "",
    });
  }
}

/**
 * Update a specific section of the user profile.
 * The section name is case-insensitive and supports common aliases.
 * Content replaces the entire section.
 */
export async function updateUserProfile(
  sectionName: string,
  content: string
): Promise<string> {
  const key = SECTION_NAMES[sectionName.toLowerCase()];
  if (!key) {
    const validSections = Object.keys(SECTION_NAMES).join(", ");
    throw new Error(
      `Unknown section "${sectionName}". Valid sections: ${validSections}`
    );
  }

  const data = await loadProfileData();
  data[key] = content;
  await saveProfileData(data);

  return `Updated "${sectionName}" section in user profile.`;
}

/**
 * Update the light inventory section from a list of lights.
 * Called automatically when list_lights is used.
 */
export async function updateLightInventory(lights: HueLight[]): Promise<void> {
  const data = await loadProfileData();

  const inventory = lights
    .map((light) => {
      const parts = [`- **${light.metadata.name}** (ID: \`${light.id}\`)`];
      parts.push(`  - Type: ${light.metadata.archetype}`);
      parts.push(`  - On: ${light.on.on}`);
      if (light.dimming) {
        parts.push(`  - Brightness: ${Math.round(light.dimming.brightness)}%`);
      }
      if (light.color?.xy) {
        parts.push(
          `  - Color XY: (${light.color.xy.x}, ${light.color.xy.y})`
        );
      }
      return parts.join("\n");
    })
    .join("\n");

  data.lightInventory = `${lights.length} lights discovered:\n\n${inventory}`;

  // Auto-infer room mappings from light names
  const roomMap = new Map<string, string[]>();
  for (const light of lights) {
    const name = light.metadata.name.toLowerCase();
    // Try to extract room from common naming patterns
    // e.g. "bthrm mirror left" -> "bthrm", "kitchen spot 1" -> "kitchen"
    const firstWord = name.split(/\s+/)[0];
    if (firstWord) {
      const room = firstWord;
      if (!roomMap.has(room)) {
        roomMap.set(room, []);
      }
      roomMap.get(room)!.push(light.metadata.name);
    }
  }

  if (roomMap.size > 0) {
    const mappings = Array.from(roomMap.entries())
      .map(([room, names]) => `- **${room}**: ${names.join(", ")}`)
      .join("\n");
    data.roomMappings = mappings;
  }

  await saveProfileData(data);
}

/**
 * Log a vibe application to the history section.
 * Called automatically when set_vibe is used.
 */
export async function logVibeToHistory(
  vibeName: string,
  lights: Array<{ light_id: string; color_hex: string; brightness: number }>
): Promise<void> {
  const data = await loadProfileData();

  const timestamp = new Date().toISOString();
  const hour = new Date().getHours();
  const timeLabel =
    hour < 6
      ? "night"
      : hour < 12
        ? "morning"
        : hour < 17
          ? "afternoon"
          : hour < 21
            ? "evening"
            : "night";

  const lightSummary = lights
    .map((l) => `${l.color_hex} at ${l.brightness}%`)
    .join(", ");

  const entry = `- **${vibeName}** — ${timestamp} (${timeLabel}): ${lightSummary}`;

  // Keep last 50 entries
  const existingLines = data.vibeHistory
    ? data.vibeHistory.split("\n").filter((l) => l.startsWith("- "))
    : [];
  existingLines.unshift(entry);
  const trimmed = existingLines.slice(0, 50);
  data.vibeHistory = trimmed.join("\n");

  // Update time-of-day patterns
  await updateTimePatterns(data, vibeName, timeLabel);

  await saveProfileData(data);
}

/**
 * Update time-of-day patterns based on vibe usage.
 */
async function updateTimePatterns(
  data: ProfileData,
  vibeName: string,
  timeLabel: string
): Promise<void> {
  // Parse existing patterns or start fresh
  const patternMap = new Map<string, Map<string, number>>();

  if (data.timeOfDayPatterns) {
    const lines = data.timeOfDayPatterns.split("\n");
    for (const line of lines) {
      const match = line.match(/^- \*\*(\w+)\*\*: (.+)$/);
      if (match) {
        const time = match[1];
        const vibes = match[2].split(", ").map((v) => {
          const countMatch = v.match(/^(.+) \((\d+)x\)$/);
          if (countMatch) return { name: countMatch[1], count: parseInt(countMatch[2]) };
          return { name: v, count: 1 };
        });
        const vibeMap = new Map<string, number>();
        for (const v of vibes) {
          vibeMap.set(v.name, v.count);
        }
        patternMap.set(time, vibeMap);
      }
    }
  }

  if (!patternMap.has(timeLabel)) {
    patternMap.set(timeLabel, new Map());
  }
  const vibeMap = patternMap.get(timeLabel)!;
  vibeMap.set(vibeName, (vibeMap.get(vibeName) ?? 0) + 1);

  // Format patterns
  const timeOrder = ["morning", "afternoon", "evening", "night"];
  const formatted = timeOrder
    .filter((t) => patternMap.has(t))
    .map((t) => {
      const vibes = Array.from(patternMap.get(t)!.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => (count > 1 ? `${name} (${count}x)` : name))
        .join(", ");
      return `- **${t}**: ${vibes}`;
    })
    .join("\n");

  data.timeOfDayPatterns = formatted;
}

/**
 * Update colour preferences based on a vibe rating.
 * Called automatically when rate_vibe is used.
 */
export async function updatePreferencesFromRating(
  vibeName: string,
  rating: number,
  feedback?: string
): Promise<void> {
  const data = await loadProfileData();

  const timestamp = new Date().toISOString().split("T")[0];
  const sentiment =
    rating >= 8
      ? "loved"
      : rating >= 6
        ? "liked"
        : rating >= 4
          ? "neutral"
          : "disliked";

  const entry = `- ${sentiment} **${vibeName}** (${rating}/10) — ${timestamp}${feedback ? `: "${feedback}"` : ""}`;

  const existingLines = data.colourPreferences
    ? data.colourPreferences.split("\n").filter((l) => l.startsWith("- "))
    : [];

  // Remove previous rating for same vibe
  const filtered = existingLines.filter(
    (l) => !l.includes(`**${vibeName}**`)
  );
  filtered.unshift(entry);
  const trimmed = filtered.slice(0, 30);
  data.colourPreferences = trimmed.join("\n");

  await saveProfileData(data);
}

/**
 * Note a saved vibe as a favourite in the profile.
 * Called automatically when save_vibe is used.
 */
export async function noteVibeAsFavourite(
  vibeName: string,
  description: string
): Promise<void> {
  const data = await loadProfileData();

  const timestamp = new Date().toISOString().split("T")[0];
  const entry = `- Saved **${vibeName}** as favourite — ${timestamp}: ${description}`;

  const existingLines = data.explicitPreferences
    ? data.explicitPreferences.split("\n").filter((l) => l.trim().length > 0)
    : [];

  // Don't duplicate
  const alreadyExists = existingLines.some((l) =>
    l.includes(`**${vibeName}**`)
  );
  if (!alreadyExists) {
    existingLines.push(entry);
    data.explicitPreferences = existingLines.join("\n");
    await saveProfileData(data);
  }
}

/**
 * Generate the initial profile by reading existing data.
 */
export async function generateInitialProfile(): Promise<void> {
  const data: ProfileData = {
    lightInventory: "",
    roomMappings: "",
    colourPreferences: "",
    timeOfDayPatterns: "",
    vibeHistory: "",
    explicitPreferences: "",
    evolutionNotes: "",
  };

  // Read existing saved vibes
  try {
    const savedVibes = await listSavedVibes();
    if (savedVibes.length > 0) {
      const vibeEntries = savedVibes
        .map(
          (v) =>
            `- **${v.name}**: ${v.description} (saved ${v.created_at.split("T")[0]})`
        )
        .join("\n");
      data.explicitPreferences = `Previously saved vibes:\n${vibeEntries}`;
    }
  } catch {
    // Non-critical
  }

  // Read existing feedback
  try {
    const feedback = await getVibeFeedback({ sort_by_rating: true });
    if (feedback.length > 0) {
      const feedbackEntries = feedback
        .filter((f) => f.rating !== undefined)
        .map((f) => {
          const sentiment =
            f.rating! >= 8
              ? "loved"
              : f.rating! >= 6
                ? "liked"
                : f.rating! >= 4
                  ? "neutral"
                  : "disliked";
          return `- ${sentiment} **${f.vibe_name}** (${f.rating}/10)${f.feedback ? `: "${f.feedback}"` : ""}`;
        })
        .join("\n");
      if (feedbackEntries) {
        data.colourPreferences = feedbackEntries;
      }
    }
  } catch {
    // Non-critical
  }

  await saveProfileData(data);
}
