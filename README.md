# hue-vibes-mcp

An MCP server for controlling Philips Hue lights via the Hue Remote API (CLIP v2). Set vibes, control individual lights, activate scenes, and more -- all from Claude.

## Installation

```bash
git clone https://github.com/EthanSK/hue-vibes-mcp.git
cd hue-vibes-mcp
npm install
cp .env.example .env   # edit if you have your own Hue developer credentials
npm run build
```

## Configuration

Copy `.env.example` to `.env` and fill in your Hue developer credentials if you have your own. The defaults work out of the box.

| Variable | Description | Default |
|---|---|---|
| `HUE_CLIENT_ID` | Hue API client ID | built-in |
| `HUE_CLIENT_SECRET` | Hue API client secret | built-in |
| `HUE_CALLBACK_URL` | OAuth callback URL | `http://localhost:8989/callback` |

## Authorization

On first use, call the `hue_auth` tool. It will open your browser to authorize with Philips Hue and save tokens to `~/.hue-vibes/tokens.json`. Tokens refresh automatically.

## Available Tools

| Tool | Description |
|---|---|
| `hue_auth` | Start the OAuth authorization flow |
| `list_lights` | List all lights with current state (on/off, brightness, color) |
| `set_light` | Set a specific light's state (on/off, brightness, color) |
| `set_all_lights` | Set all lights to the same state |
| `set_scene` | Activate a Hue scene by name |
| `set_vibe` | Apply a vibe -- provide a description and Claude picks the colors |

## Claude Desktop Configuration

Add this to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "hue-vibes": {
      "command": "node",
      "args": ["/absolute/path/to/hue-vibes-mcp/dist/index.js"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "hue-vibes": {
      "command": "hue-vibes-mcp"
    }
  }
}
```

## Development

```bash
npm run dev    # run with tsx (auto-reload)
npm run build  # compile TypeScript
npm start      # run compiled output
```
