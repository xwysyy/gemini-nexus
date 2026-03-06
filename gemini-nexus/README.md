<div align="center">
  <h1>Gemini Nexus</h1>
  <p>A powerful AI assistant Chrome Extension powered by Google Gemini.</p>
</div>

## Overview

Gemini Nexus integrates Google's Gemini models directly into your browsing experience. It focuses on side panel chat, page-context chat, image analysis, OCR, and screenshot translation.

## Architecture

*   **Side Panel**: The main chat interface (`sidepanel/`).
*   **Sandbox**: Secure iframe environment for rendering Markdown and handling logic (`sandbox/`).
*   **Content Scripts**: Page content extraction, image hover tools, and screenshot selection (`content/`).
*   **Background**: Service worker handling API calls and session management (`background/`).

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

Outputs a versioned ZIP under `release/` (e.g. `release/gemini-nexus-v4.2.5.zip`), with `manifest.json` at the ZIP root.

## GitHub Actions

This repo includes two workflows:

1. `Build & Release (Chrome Extension)` (`.github/workflows/release.yml`)
   - On tag push (e.g. `v4.2.5`): builds and uploads the ZIP to GitHub Releases.
   - On manual dispatch: builds and uploads the ZIP as a workflow artifact.

2. `Publish to Chrome Web Store` (`.github/workflows/chrome-webstore.yml`)
   - Manual dispatch only.
   - Requires repository secrets:
     - `CWS_EXTENSION_ID`
     - `CWS_CLIENT_ID`
     - `CWS_CLIENT_SECRET`
     - `CWS_REFRESH_TOKEN`

3. `Auto Release on Manifest Version Change` (`.github/workflows/auto-tag.yml`)
   - On push to `main`, if `gemini-nexus/manifest.json` `version` changed compared to the previous `main` head, it creates tag `v<version>` automatically.
   - The same workflow then runs `npm ci`, `npm run package`, uploads the ZIP as an artifact, and publishes a GitHub Release for that tag.
