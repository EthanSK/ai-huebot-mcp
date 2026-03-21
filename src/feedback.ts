import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { slugify } from "./saved-vibes.js";

const DATA_DIR = join(homedir(), ".ai-huebot");
const FEEDBACK_PATH = join(DATA_DIR, "feedback.json");
const CONFIG_PATH = join(DATA_DIR, "config.json");

// --- Types ---

export interface VibeFeedbackEntry {
  vibe_name: string;
  vibe_slug: string;
  rating?: number;
  feedback?: string;
  timestamp: string;
  times_shown: number;
}

interface FeedbackData {
  entries: VibeFeedbackEntry[];
}

interface AppConfig {
  hint_acknowledged: boolean;
}

// --- Helpers ---

async function ensureDataDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

async function loadFeedbackData(): Promise<FeedbackData> {
  try {
    const data = await readFile(FEEDBACK_PATH, "utf-8");
    return JSON.parse(data) as FeedbackData;
  } catch {
    return { entries: [] };
  }
}

async function saveFeedbackData(data: FeedbackData): Promise<void> {
  await ensureDataDir();
  await writeFile(FEEDBACK_PATH, JSON.stringify(data, null, 2), "utf-8");
}

async function loadConfig(): Promise<AppConfig> {
  try {
    const data = await readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(data) as AppConfig;
  } catch {
    return { hint_acknowledged: false };
  }
}

async function saveConfig(config: AppConfig): Promise<void> {
  await ensureDataDir();
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

// --- Find or create entry for a vibe ---

function findEntry(
  data: FeedbackData,
  vibeSlug: string
): VibeFeedbackEntry | undefined {
  return data.entries.find((e) => e.vibe_slug === vibeSlug);
}

// --- Public API ---

/**
 * Rate a vibe and/or leave feedback. At least one of rating or feedback must be provided.
 */
export async function rateVibe(
  vibeName: string,
  rating?: number,
  feedback?: string
): Promise<VibeFeedbackEntry> {
  if (rating === undefined && (feedback === undefined || feedback === "")) {
    throw new Error("At least one of rating or feedback must be provided.");
  }

  if (rating !== undefined && (rating < 1 || rating > 10)) {
    throw new Error("Rating must be between 1 and 10.");
  }

  const slug = slugify(vibeName);
  if (!slug) {
    throw new Error(
      "Invalid vibe name - must contain at least one alphanumeric character."
    );
  }

  const data = await loadFeedbackData();
  let entry = findEntry(data, slug);

  if (entry) {
    if (rating !== undefined) entry.rating = rating;
    if (feedback !== undefined && feedback !== "") entry.feedback = feedback;
    entry.timestamp = new Date().toISOString();
  } else {
    entry = {
      vibe_name: vibeName,
      vibe_slug: slug,
      rating,
      feedback: feedback || undefined,
      timestamp: new Date().toISOString(),
      times_shown: 0,
    };
    data.entries.push(entry);
  }

  await saveFeedbackData(data);
  return entry;
}

/**
 * Increment the times_shown counter for a vibe.
 */
export async function incrementTimesShown(vibeName: string): Promise<void> {
  const slug = slugify(vibeName);
  if (!slug) return;

  const data = await loadFeedbackData();
  let entry = findEntry(data, slug);

  if (entry) {
    entry.times_shown++;
  } else {
    entry = {
      vibe_name: vibeName,
      vibe_slug: slug,
      timestamp: new Date().toISOString(),
      times_shown: 1,
    };
    data.entries.push(entry);
  }

  await saveFeedbackData(data);
}

/**
 * Get all feedback entries, optionally filtered and sorted.
 */
export async function getVibeFeedback(options?: {
  min_rating?: number;
  sort_by_rating?: boolean;
}): Promise<VibeFeedbackEntry[]> {
  const data = await loadFeedbackData();
  let entries = data.entries;

  if (options?.min_rating !== undefined) {
    entries = entries.filter(
      (e) => e.rating !== undefined && e.rating >= options.min_rating!
    );
  }

  if (options?.sort_by_rating) {
    entries.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }

  return entries;
}

/**
 * Get top-rated vibes (rating >= 7 by default).
 */
export async function getFavorites(
  minRating: number = 7
): Promise<VibeFeedbackEntry[]> {
  const data = await loadFeedbackData();
  return data.entries
    .filter((e) => e.rating !== undefined && e.rating >= minRating)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
}

/**
 * Get the user hint if not yet acknowledged.
 */
export async function getUserHint(): Promise<string | null> {
  const config = await loadConfig();
  if (config.hint_acknowledged) {
    return null;
  }
  return (
    "You can rate your vibes and give feedback to help me learn your preferences. " +
    "You can also ask me to use your favorite past vibes. For example: " +
    "'Set my highest rated vibe' or 'Give me something similar to the vibe I rated highest.'"
  );
}

/**
 * Acknowledge the hint so it won't be shown again.
 */
export async function acknowledgeHint(): Promise<void> {
  const config = await loadConfig();
  config.hint_acknowledged = true;
  await saveConfig(config);
}
