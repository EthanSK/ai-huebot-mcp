# AI HueBot — PLAN (canonical project log)

## Project

- Name: **AI HueBot** (formerly hue-vibes-mcp)
- Repo: [github.com/EthanSK/ai-huebot-mcp](https://github.com/EthanSK/ai-huebot-mcp)
- npm: [ai-huebot](https://www.npmjs.com/package/ai-huebot)
- Goal: MCP server for controlling Philips Hue lights with AI. Describe a mood/vibe and the AI picks colors and brightness for every light. Saves favorites, learns preferences over time.
- Stack: TypeScript, Node.js, MCP SDK, Philips Hue Remote API (CLIP v2 + v1 fallback)
- License: MIT
- Author: Ethan SK

---

## Timeline

### Session 1 — 2026-03-21 ~21:00 UTC — Project creation and initial auth

**Context:** Ethan wanted to build an MCP server to control his Philips Hue lights via AI. The initial name was "hue-vibes-mcp".

**Auth setup:**
- Navigated to Hue developer portal to register the app under "My Apps"
- Hue Remote API is cloud-based — OAuth redirect to localhost only needs to happen on the machine running the server (Mac mini). The Hue bridge does not need to be on the same network.
- Used Playwright to complete the Hue OAuth flow: navigated to login page, clicked "Continue with Google", selected Ethan's bridge ("[redacted bridge name]"), granted permission.
- Auth callback server runs on port 8989. Tokens saved to `~/.ai-huebot/tokens.json` and auto-refresh.

**Initial commit:** `7205c14` — Philips Hue MCP server with basic tools (hue_auth, list_lights, set_light, set_all_lights, set_scene, set_vibe).

**First light test:** Set all 11 lights to red successfully. However, this was done via the v1 API — CLIP v2 returned 403 immediately. The session discovered that the v2 API requires an additional `hue-application-key` header (a whitelisted bridge username), which was not part of the initial implementation.

---

### Session 2 — 2026-03-21 ~22:00 UTC — Rename, features, publishing

**Rename to AI HueBot:**
- Ethan requested rename from "hue-vibes-mcp" to "AI HueBot"
- All references updated: package name, README, repo description
- GitHub repo renamed to `ai-huebot-mcp`
- Commit: `99ed22a` — Rename project from hue-vibes-mcp to AI HueBot

**Saved vibes feature:**
- New file: `src/saved-vibes.ts` — saves/loads/deletes vibe JSON files from `~/.ai-huebot/saved-vibes/`
- Vibe names are slugified for filenames
- 4 new MCP tools: `save_vibe`, `list_saved_vibes`, `apply_saved_vibe`, `delete_saved_vibe`
- `set_vibe` now auto-saves every vibe after applying, so users build a collection over time without manual saving
- Commit: `74fac9b`

**Color theory design system:**
- Research subagent created `docs/color-theory-design-system.md` with:
  - Color theory for ambient lighting (analogous, complementary, split-complementary, monochromatic harmonies)
  - Color temperature as primary axis with mirek values for Hue API
  - 7 golden rules for premium vs. gaudy palettes
  - 8 vibe categories with 42 preset definitions
  - Adaptive intelligence (time-of-day, activity keywords, seasonal bias)
  - TypeScript type definitions for implementation
- Decision: The 42 presets should NOT be baked into the codebase. The design doc is a reference for the LLM, but the saved vibes system handles user-created presets.
- Commit: `693792c`

**Feedback and rating system:**
- New file: `src/feedback.ts` — handles rating persistence and hint system
- 5 new MCP tools: `rate_vibe`, `get_vibe_feedback`, `get_favorites`, `get_user_hint`, `acknowledge_hint`
- Usage tracking: `set_vibe` and `apply_saved_vibe` now call `incrementTimesShown()` after applying
- Storage: `~/.ai-huebot/feedback.json` for ratings, `~/.ai-huebot/config.json` for hint acknowledgement
- Commit: `4d8e427`

**README rewrite:**
- Leads with value ("Set vibes, save favorites, learn your preferences")
- Complete feature coverage of all 15 tools
- Cut from 141 lines to 112 while adding content
- Better quick start with `npx ai-huebot` one-liner
- Commit: `6fdfdfe`

**Production-ready release and npm publish:**
- Added MIT LICENSE, CHANGELOG.md
- Updated package.json with all npm publishing fields: main, files, repository, homepage, bugs, engines (>=18), author, keywords, prepublishOnly script, mcpName for Official MCP Registry
- Added hex color input validation in `hexToXy()`
- Confirmed `ai-huebot` name available on npm
- Used Playwright to log into npm, generated access token with 2FA bypass
- Published `ai-huebot@1.0.0` to npm
- Commit: `2bf791a`, `a4b58b8`

**MCP marketplace submissions:**
- PRs created:
  - punkpeye/awesome-mcp-servers (14k+ stars): PR #3665 — Home Automation section
  - appcypher/awesome-mcp-servers: PR #678 — IoT section
- Issues created:
  - Cline MCP Marketplace: issue #1011
  - mcp.so (18k+ servers): issue #1098
- Manual submissions still needed:
  - mcpservers.org (web form)
  - Official MCP Registry (via mcp-publisher CLI after npm publish)
  - PulseMCP (auto-ingests from Official Registry, or web form)
  - Glama.ai (auto-discovers from awesome lists)
  - Smithery.ai (needs Streamable HTTP transport adapter — server uses stdio)
  - MCP Market (web form)

**LinkedIn promotion:**
- Ethan set a reminder to post AI HueBot on LinkedIn on 2026-03-22

---

### Session 3 — 2026-03-23 ~22:00 UTC — Gitignore cleanup

- Added `PLAN.md` and `plan.md` to `.gitignore` in this repo (proactive — PLAN.md was never tracked here)
- Also cleaned up PLAN.md tracking in other repos (producer-player, 3000ad-alignment-course, heyboy-voice-assistant, ai-find-words-in-videos)
- Commit: `97778cd`

---

### Session 4 — 2026-03-24 ~12:00 UTC — CLIP v2 auth fix and v1 fallback

**Problem:** After a power cut and session restart, the AI HueBot MCP server was configured in `.mcp.json` but tools were not loading. The server started fine standalone (`"AI HueBot server running on stdio"`) but would not connect during Claude Code session initialization.

**CLIP v2 403 investigation:**
- Deep investigation confirmed CLIP v2 PUT requests had NEVER worked in this project's history
- Every successful light control had been done via the v1 API (`/route/api/{username}/lights/{id}/state`)
- Root cause: CLIP v2 requires a `hue-application-key` header containing a whitelisted bridge username. The code only sent `Authorization: Bearer` and `Content-Type`.
- The username `[REDACTED]` (name: "hue_vibes_mcp") was created on March 21 via v1 API linkbutton + POST flow, but was never saved to tokens.json.

**Fix applied:**
1. Added `username?: string` field to `HueTokens` interface in `src/types.ts`
2. Updated `src/auth.ts`: after getting tokens, automatically presses remote link button and creates whitelisted username; `getValidAccessToken()` now returns `{ accessToken, username }`
3. Updated `src/hue-api.ts`: sends `hue-application-key` header on every CLIP v2 request; added v1 fallback for 403 responses
4. Added username to `~/.ai-huebot/tokens.json`
5. Commits: `5a7cab2`, `33b3598`, `9f7cebe`, `035cb03`

**Audit findings and additional fixes:**
- v1 fallback had a bug: used v2 UUIDs as v1 light IDs (v1 expects numeric IDs like "1", "2") and passed v2 body format (`{"on":{"on":true}}`) instead of v1 format (`{"on":true}`)
- v1 API returned HTTP 200 with error objects in the array; code treated any 200 array response as success
- Fix: Added v1 error detection in array responses; added v2-to-v1 body format conversion (`mapV2BodyToV1`)
- Token refresh username preservation was fragile — fixed to save username before refresh call
- Commit: `11454c4`

**Verification results (all passing):**

| Endpoint | Status |
|---|---|
| CLIP v2 GET /light | 200 |
| CLIP v2 GET /scene | 200 |
| CLIP v2 PUT /light/{id} | 200 (no longer 403 with valid username) |
| CLIP v2 PUT /scene/{id} (recall) | 200 |
| v1 GET /lights | 200 |
| v1 PUT /lights/{id}/state | 200 |

---

## Architecture

### Source files
- `src/index.ts` — MCP server setup and all 15 tool definitions
- `src/hue-api.ts` — Hue API calls (CLIP v2 primary + v1 fallback), hex-to-XY color conversion with gamma correction
- `src/auth.ts` — OAuth 2.0 flow, token management, whitelisted username creation
- `src/types.ts` — TypeScript interfaces (HueTokens, SavedVibe, etc.)
- `src/saved-vibes.ts` — Saved vibe persistence to `~/.ai-huebot/saved-vibes/`
- `src/feedback.ts` — Rating/feedback system with filtering and sorting

### MCP tools (15 total)
1. `hue_auth` — Authorize with Philips Hue (browser OAuth)
2. `list_lights` — List all lights with current state
3. `set_light` — Control a single light (on/off, brightness, color)
4. `set_all_lights` — Set all lights to the same state
5. `set_scene` — Activate a Hue scene by name
6. `set_vibe` — Describe a mood, AI picks colors for each light (auto-saves)
7. `save_vibe` — Manually save a light configuration as a named vibe
8. `list_saved_vibes` — List all saved vibes
9. `apply_saved_vibe` — Re-apply a saved vibe
10. `delete_saved_vibe` — Delete a saved vibe
11. `rate_vibe` — Rate a vibe (1-10) and/or leave text feedback
12. `get_vibe_feedback` — View all feedback, filterable by rating
13. `get_favorites` — Get top-rated vibes (rating >= 7)
14. `get_user_hint` — Get a one-time hint about the feedback system
15. `acknowledge_hint` — Dismiss the hint permanently

### Data storage
- `~/.ai-huebot/tokens.json` — OAuth tokens + whitelisted bridge username
- `~/.ai-huebot/saved-vibes/` — JSON files for each saved vibe (slugified names)
- `~/.ai-huebot/feedback.json` — Vibe ratings and feedback entries
- `~/.ai-huebot/config.json` — User preferences (hint acknowledgement)

### Bridge info
- Bridge model: BSB002
- Firmware: 1976081000 (API version 1.76.0)
- 11 lights total
- Auth via Hue Remote API (cloud-based, bridge does not need to be on same network)

---

## Known issues and future work

### Open items
- Manual marketplace submissions still pending: mcpservers.org, Official MCP Registry, PulseMCP, Glama.ai, MCP Market
- Smithery.ai requires Streamable HTTP transport (server uses stdio) — would need a transport adapter
- Generic v1 fallback in `hueRequest` still uses v2 UUIDs as v1 IDs for scenes. For lights, `setLightState` has its own proper fallback with numeric ID lookup. For scenes, v2 currently works so this is not a practical issue.
- The `scope` field from the Hue token response is preserved in `tokens.json` but not declared in the `HueTokens` type (harmless)

### Design decisions
- Color theory presets (42 in the design doc) are NOT baked into the codebase — the design doc at `docs/color-theory-design-system.md` serves as LLM reference material. The saved vibes system handles user-created presets.
- Built-in OAuth credentials work out of the box. Users can override with `HUE_CLIENT_ID`, `HUE_CLIENT_SECRET`, `HUE_CALLBACK_URL` env vars.
- CLIP v2 is the primary API with automatic v1 fallback on 403 errors. Auto-recovery includes force token refresh and username re-creation if needed.
