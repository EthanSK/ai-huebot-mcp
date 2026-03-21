# AI HueBot

[![npm version](https://img.shields.io/npm/v/ai-huebot.svg)](https://www.npmjs.com/package/ai-huebot)
[![license](https://img.shields.io/npm/l/ai-huebot.svg)](https://github.com/EthanSK/ai-huebot-mcp/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/ai-huebot.svg)](https://www.npmjs.com/package/ai-huebot)

**Control your Philips Hue lights with AI.** Set vibes, save favorites, and let it learn your preferences over time.

An [MCP](https://modelcontextprotocol.io) server that connects any AI client (Claude, etc.) to your Hue lights. Just describe the mood you want.

## Features

- **Vibe mode** -- say "cozy evening" or "deep focus" and the AI picks colors and brightness for every light
- **Saved vibes** -- every vibe is auto-saved and can be re-applied later
- **Ratings & feedback** -- rate vibes 1-10 so the AI learns what you like
- **Favorites** -- quickly access your top-rated vibes
- **Individual & bulk control** -- set any light or all lights at once
- **Scene activation** -- trigger any Hue scene by name
- **Smart hints** -- gently introduces the feedback system to new users
- **Zero config auth** -- built-in OAuth credentials, just authorize in your browser once

## Quick Start

```bash
npx ai-huebot
```

That's it. Add it to your AI client (see below), then just ask:

> "Set a cozy evening vibe"

> "Make the bedroom warm orange at 40%"

> "Rate that vibe 9 out of 10"

> "Apply my highest rated vibe"

## Setup

### Claude Code

```bash
claude mcp add ai-huebot -- npx ai-huebot
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "ai-huebot": {
      "command": "npx",
      "args": ["ai-huebot"]
    }
  }
}
```

### Any MCP Client

- **Command:** `npx`
- **Args:** `["ai-huebot"]`
- **Transport:** stdio

### First Run

Call the `hue_auth` tool from your AI client. It opens your browser to authorize with Philips Hue. Tokens are saved to `~/.ai-huebot/tokens.json` and refresh automatically.

## Tools

| Tool | Description |
|---|---|
| `hue_auth` | Authorize with Philips Hue (browser OAuth) |
| `list_lights` | List all lights with current state |
| `set_light` | Control a single light (on/off, brightness, color) |
| `set_all_lights` | Set all lights to the same state |
| `set_scene` | Activate a Hue scene by name |
| `set_vibe` | Describe a mood -- AI picks colors for each light (auto-saves) |
| `save_vibe` | Manually save a light configuration as a named vibe |
| `list_saved_vibes` | List all saved vibes |
| `apply_saved_vibe` | Re-apply a saved vibe |
| `delete_saved_vibe` | Delete a saved vibe |
| `rate_vibe` | Rate a vibe (1-10) and/or leave text feedback |
| `get_vibe_feedback` | View all feedback, filterable by rating |
| `get_favorites` | Get your top-rated vibes (rating >= 7) |
| `get_user_hint` | Get a one-time hint about the feedback system |
| `acknowledge_hint` | Dismiss the hint permanently |

## How It Works

**Auth:** OAuth 2.0 against the Hue Remote API (CLIP v2). Built-in credentials work out of the box -- or set `HUE_CLIENT_ID`, `HUE_CLIENT_SECRET`, and `HUE_CALLBACK_URL` env vars to use your own.

**Vibes:** When you describe a vibe, the AI chooses hex colors and brightness for each light. The configuration is automatically saved to `~/.ai-huebot/saved-vibes/` as JSON so you can re-apply it anytime.

**Feedback loop:** Rate vibes and leave feedback. The AI uses this history to suggest vibes you'll like and avoid ones you didn't. Favorites (rating >= 7) are surfaced on request.

## Development

```bash
git clone https://github.com/EthanSK/ai-huebot-mcp.git
cd ai-huebot-mcp
npm install
npm run build   # compile TypeScript
npm run dev     # run with tsx (auto-reload)
```

## License

[MIT](LICENSE)
