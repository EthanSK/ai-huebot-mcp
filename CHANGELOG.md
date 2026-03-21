# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-03-21

### Added

- OAuth authentication with Philips Hue Remote API (CLIP v2)
- Automatic token refresh
- `hue_auth` tool -- browser-based OAuth flow
- `list_lights` tool -- list all lights with current state
- `set_light` tool -- control individual lights (on/off, brightness, color)
- `set_all_lights` tool -- bulk control all lights at once
- `set_scene` tool -- activate Hue scenes by name
- `set_vibe` tool -- describe a mood and apply colors/brightness per light (auto-saves)
- `save_vibe` tool -- save light configurations as named vibes
- `list_saved_vibes` tool -- list all saved vibes
- `apply_saved_vibe` tool -- re-apply a saved vibe by name
- `delete_saved_vibe` tool -- delete a saved vibe
- Hex color to CIE xy coordinate conversion
- Hex color input validation
- Tokens stored at `~/.ai-huebot/tokens.json`
- Built-in Hue developer credentials for zero-config setup
