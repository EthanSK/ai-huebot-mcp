import { readFile, writeFile, readdir, unlink, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { SavedVibe, VibeLight } from "./types.js";

const VIBES_DIR = join(homedir(), ".ai-huebot", "saved-vibes");

/**
 * Slugify a vibe name for use as a filename.
 * Converts to lowercase, replaces non-alphanumeric chars with hyphens,
 * collapses multiple hyphens, and trims leading/trailing hyphens.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureVibesDir(): Promise<void> {
  if (!existsSync(VIBES_DIR)) {
    await mkdir(VIBES_DIR, { recursive: true });
  }
}

function vibeFilePath(slug: string): string {
  return join(VIBES_DIR, `${slug}.json`);
}

export async function saveVibe(
  name: string,
  description: string,
  lights: VibeLight[]
): Promise<SavedVibe> {
  await ensureVibesDir();

  const slug = slugify(name);
  if (!slug) {
    throw new Error("Invalid vibe name - must contain at least one alphanumeric character.");
  }

  const vibe: SavedVibe = {
    name,
    slug,
    description,
    lights,
    created_at: new Date().toISOString(),
  };

  await writeFile(vibeFilePath(slug), JSON.stringify(vibe, null, 2), "utf-8");
  return vibe;
}

export async function listSavedVibes(): Promise<SavedVibe[]> {
  await ensureVibesDir();

  const files = await readdir(VIBES_DIR);
  const vibes: SavedVibe[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const data = await readFile(join(VIBES_DIR, file), "utf-8");
      vibes.push(JSON.parse(data) as SavedVibe);
    } catch {
      // Skip invalid files
    }
  }

  // Sort by creation date, newest first
  vibes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return vibes;
}

export async function getSavedVibe(name: string): Promise<SavedVibe | null> {
  const slug = slugify(name);
  const filePath = vibeFilePath(slug);

  try {
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data) as SavedVibe;
  } catch {
    return null;
  }
}

export async function deleteSavedVibe(name: string): Promise<boolean> {
  const slug = slugify(name);
  const filePath = vibeFilePath(slug);

  try {
    await unlink(filePath);
    return true;
  } catch {
    return false;
  }
}
