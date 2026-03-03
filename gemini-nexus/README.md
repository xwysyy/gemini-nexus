<div align="center">
  <h1>Gemini Nexus</h1>
  <p>A powerful AI assistant Chrome Extension powered by Google Gemini.</p>
</div>

## Overview

Gemini Nexus integrates Google's Gemini models directly into your browsing experience. It features a side panel for chat, a floating toolbar for quick actions, and image analysis capabilities.

## Architecture

*   **Side Panel**: The main chat interface (`sidepanel/`).
*   **Sandbox**: Secure iframe environment for rendering Markdown and handling logic (`sandbox/`).
*   **Content Scripts**: Floating toolbar and page interaction (`content/`).
*   **Background**: Service worker handling API calls and session management (`background/`).

## External MCP Tools (Remote Servers)

Gemini Nexus can optionally connect to an external MCP server (via **SSE** or **WebSocket**) and execute its tools inside the existing tool loop.

1. Start an MCP server/proxy endpoint (example from MCP SuperAssistant proxy: `http://127.0.0.1:3006/sse`).
2. In **Settings → Connection → External MCP Tools**, enable it and set the Server URL.
3. Ask normally; if the model needs a tool it will output a JSON tool block like:

```json
{ "tool": "tool_name", "args": { "key": "value" } }
```

## Run Locally

**Prerequisites:** Node.js

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Build the extension (creates a Chrome-loadable `dist/`):
    ```bash
    npm run build:extension
    ```

3.  Load into Chrome:
    *   Open `chrome://extensions/`
    *   Enable "Developer mode"
    *   Click "Load unpacked"
    *   Select the `dist` folder.

## Package (ZIP for Releases / Chrome Web Store)

```bash
npm run package
```

Outputs a versioned ZIP under `release/` (e.g. `release/gemini-nexus-v4.2.3.zip`), with `manifest.json` at the ZIP root.

## GitHub Actions

This repo includes two workflows:

1. `Build & Release (Chrome Extension)` (`.github/workflows/release.yml`)
   - On tag push (e.g. `v4.2.3`): builds and uploads the ZIP to GitHub Releases.
   - On manual dispatch: builds and uploads the ZIP as a workflow artifact.

2. `Publish to Chrome Web Store` (`.github/workflows/chrome-webstore.yml`)
   - Manual dispatch only.
   - Requires repository secrets:
     - `CWS_EXTENSION_ID`
     - `CWS_CLIENT_ID`
     - `CWS_CLIENT_SECRET`
     - `CWS_REFRESH_TOKEN`

3. `Auto Tag on Version Commit` (`.github/workflows/auto-tag.yml`)
   - On push to `main`, if the **head commit message** contains `vX.Y.Z` (example: `chore(release): v4.2.3`), it creates the tag automatically.
   - The tag will then trigger the release workflow above.
