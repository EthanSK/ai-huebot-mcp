# AI HueBot

[![npm version](https://img.shields.io/npm/v/ai-huebot.svg)](https://www.npmjs.com/package/ai-huebot)
[![license](https://img.shields.io/npm/l/ai-huebot.svg)](https://github.com/EthanSK/ai-huebot-mcp/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/ai-huebot.svg)](https://www.npmjs.com/package/ai-huebot)

An MCP server for controlling Philips Hue lights via the Hue Remote API (CLIP v2). Set vibes, control individual lights, activate scenes, and more -- all through any MCP-compatible AI client like Claude.

## Features

- **OAuth authentication** -- authorizes with Philips Hue via browser, tokens refresh automatically
- **Individual light control** -- set brightness, color, and on/off state per light
- **Bulk control** -- set all lights at once
- **Scene activation** -- activate any Hue scene by name
- **Vibe mode** -- describe a mood and let the AI pick the perfect colors

## Quick Start

### Install via npm (recommended)

```bash
npm install -g ai-huebot
```

Or run directly with npx:

```bash
npx ai-huebot
```

### Install from source

```bash
git clone https://github.com/EthanSK/ai-huebot-mcp.git
cd ai-huebot-mcp
npm install
npm run build
```

## Configure Environment (optional)

The server ships with built-in Hue developer credentials, so it works out of the box. If you want to use your own:

```bash
cp .env.example .env
# Edit .env with your credentials
```

| Variable | Description | Default |
|---|---|---|
| `HUE_CLIENT_ID` | Hue API client ID | built-in |
| `HUE_CLIENT_SECRET` | Hue API client secret | built-in |
| `HUE_CALLBACK_URL` | OAuth callback URL | `http://localhost:8989/callback` |

## Authorize with Philips Hue

On first use, call the `hue_auth` tool from your AI client. It will open your browser to authorize with Philips Hue and save tokens to `~/.ai-huebot/tokens.json`. Tokens refresh automatically after that.

## Client Configuration

### Claude Code (CLI)

```bash
claude mcp add ai-huebot -- npx ai-huebot
```

Or add to your MCP config at `~/.claude/.mcp.json`:

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

### Claude Desktop

Add to your Claude Desktop config at `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

### Other MCP Clients

Any MCP-compatible client that supports stdio transport can use AI HueBot:

- **Command:** `npx`
- **Args:** `["ai-huebot"]`
- **Transport:** stdio

## Available Tools

| Tool | Description |
|---|---|
| `hue_auth` | Start the OAuth authorization flow |
| `list_lights` | List all lights with current state (on/off, brightness, color) |
| `set_light` | Set a specific light's state (on/off, brightness, color) |
| `set_all_lights` | Set all lights to the same state |
| `set_scene` | Activate a Hue scene by name |
| `set_vibe` | Describe a vibe and let the AI pick the colors (auto-saves) |
| `save_vibe` | Save a light configuration as a named vibe |
| `list_saved_vibes` | List all previously saved vibes |
| `apply_saved_vibe` | Re-apply a saved vibe by name |
| `delete_saved_vibe` | Delete a saved vibe |

## Example Usage

Once configured, just talk to your AI naturally:

> "Set a cozy evening vibe"

> "Turn off all the lights"

> "Make the living room light blue at 50% brightness"

> "Activate the 'Movie Night' scene"

## Development

```bash
npm run dev    # run with tsx (auto-reload)
npm run build  # compile TypeScript
npm start      # run compiled output
```

## License

[MIT](LICENSE)
