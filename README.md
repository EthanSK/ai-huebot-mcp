# AI HueBot

An MCP server for controlling Philips Hue lights via the Hue Remote API (CLIP v2). Set vibes, control individual lights, activate scenes, and more -- all through any MCP-compatible AI client like Claude.

## Features

- **OAuth authentication** -- authorizes with Philips Hue via browser, tokens refresh automatically
- **Individual light control** -- set brightness, color, and on/off state per light
- **Bulk control** -- set all lights at once
- **Scene activation** -- activate any Hue scene by name
- **Vibe mode** -- describe a mood and let the AI pick the perfect colors

## Setup

### 1. Clone and build

```bash
git clone https://github.com/EthanSK/hue-vibes-mcp.git
cd hue-vibes-mcp
npm install
npm run build
```

### 2. Configure environment (optional)

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

### 3. Authorize with Philips Hue

On first use, call the `hue_auth` tool from your AI client. It will open your browser to authorize with Philips Hue and save tokens to `~/.ai-huebot/tokens.json`. Tokens refresh automatically after that.

## Client Configuration

### Claude Code (CLI)

Add to your global MCP config at `~/.claude/.mcp.json`:

```json
{
  "mcpServers": {
    "ai-huebot": {
      "command": "node",
      "args": ["/absolute/path/to/hue-vibes-mcp/dist/index.js"]
    }
  }
}
```

Or add it for a specific project by placing the same config in `<project-root>/.mcp.json`.

### Claude Desktop

Add to your Claude Desktop config at `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "ai-huebot": {
      "command": "node",
      "args": ["/absolute/path/to/hue-vibes-mcp/dist/index.js"]
    }
  }
}
```

### Other MCP Clients

Any MCP-compatible client that supports stdio transport can use AI HueBot. Point it at the built server:

- **Command:** `node`
- **Args:** `["/absolute/path/to/hue-vibes-mcp/dist/index.js"]`
- **Transport:** stdio

Replace `/absolute/path/to/hue-vibes-mcp` with the actual path where you cloned the repo.

### Global install (alternative)

If you install the package globally, you can reference it by name instead of path:

```bash
npm install -g .   # from the repo root
```

Then use in any MCP config:

```json
{
  "mcpServers": {
    "ai-huebot": {
      "command": "ai-huebot"
    }
  }
}
```

## Available Tools

| Tool | Description |
|---|---|
| `hue_auth` | Start the OAuth authorization flow |
| `list_lights` | List all lights with current state (on/off, brightness, color) |
| `set_light` | Set a specific light's state (on/off, brightness, color) |
| `set_all_lights` | Set all lights to the same state |
| `set_scene` | Activate a Hue scene by name |
| `set_vibe` | Describe a vibe and let the AI pick the colors |

## Development

```bash
npm run dev    # run with tsx (auto-reload)
npm run build  # compile TypeScript
npm start      # run compiled output
```

## License

MIT
