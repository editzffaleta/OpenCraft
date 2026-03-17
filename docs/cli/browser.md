---
summary: "CLI reference for `opencraft browser` (profiles, tabs, actions, Chrome MCP, and CDP)"
read_when:
  - You use `opencraft browser` and want examples for common tasks
  - You want to control a browser running on another machine via a node host
  - You want to attach to your local signed-in Chrome via Chrome MCP
title: "browser"
---

# `opencraft browser`

Manage OpenCraft’s browser control server and run browser actions (tabs, snapshots, screenshots, navigation, clicks, typing).

Related:

- Browser tool + API: [Browser tool](/tools/browser)

## Common flags

- `--url <gatewayWsUrl>`: Gateway WebSocket URL (defaults to config).
- `--token <token>`: Gateway token (if required).
- `--timeout <ms>`: request timeout (ms).
- `--browser-profile <name>`: choose a browser profile (default from config).
- `--json`: machine-readable output (where supported).

## Quick start (local)

```bash
opencraft browser profiles
opencraft browser --browser-profile opencraft start
opencraft browser --browser-profile opencraft open https://example.com
opencraft browser --browser-profile opencraft snapshot
```

## Profiles

Profiles are named browser routing configs. In practice:

- `opencraft`: launches or attaches to a dedicated OpenCraft-managed Chrome instance (isolated user data dir).
- `user`: controls your existing signed-in Chrome session via Chrome DevTools MCP.
- custom CDP profiles: point at a local or remote CDP endpoint.

```bash
opencraft browser profiles
opencraft browser create-profile --name work --color "#FF5A36"
opencraft browser create-profile --name chrome-live --driver existing-session
opencraft browser delete-profile --name work
```

Use a specific profile:

```bash
opencraft browser --browser-profile work tabs
```

## Tabs

```bash
opencraft browser tabs
opencraft browser open https://docs.opencraft.ai
opencraft browser focus <targetId>
opencraft browser close <targetId>
```

## Snapshot / screenshot / actions

Snapshot:

```bash
opencraft browser snapshot
```

Screenshot:

```bash
opencraft browser screenshot
```

Navigate/click/type (ref-based UI automation):

```bash
opencraft browser navigate https://example.com
opencraft browser click <ref>
opencraft browser type <ref> "hello"
```

## Existing Chrome via MCP

Use the built-in `user` profile, or create your own `existing-session` profile:

```bash
opencraft browser --browser-profile user tabs
opencraft browser create-profile --name chrome-live --driver existing-session
opencraft browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
opencraft browser --browser-profile chrome-live tabs
```

This path is host-only. For Docker, headless servers, Browserless, or other remote setups, use a CDP profile instead.

## Remote browser control (node host proxy)

If the Gateway runs on a different machine than the browser, run a **node host** on the machine that has Chrome/Brave/Edge/Chromium. The Gateway will proxy browser actions to that node (no separate browser control server required).

Use `gateway.nodes.browser.mode` to control auto-routing and `gateway.nodes.browser.node` to pin a specific node if multiple are connected.

Security + remote setup: [Browser tool](/tools/browser), [Remote access](/gateway/remote), [Tailscale](/gateway/tailscale), [Security](/gateway/security)
