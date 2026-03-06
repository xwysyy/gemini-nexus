
// content.js v4.2.5 -> content/index.js

console.log("%c Gemini Nexus v4.2.5 Ready ", "background: #333; color: #00ff00; font-size: 16px");

(function() {
    // Dependencies (Loaded via manifest order)
    const router = window.GeminiMessageRouter;
    const Overlay = window.GeminiNexusOverlay;
    const Controller = window.GeminiToolbarController;

    // Initialize Helpers
    const selectionOverlay = new Overlay();
    const floatingToolbar = new Controller(); 

    // Initialize Router
    router.init(floatingToolbar, selectionOverlay);

    // Handle initial settings that don't fit in dedicated modules yet
    chrome.storage.local.get(['geminiImageToolsEnabled'], (result) => {
        const imageToolsEnabled = result.geminiImageToolsEnabled !== false;
        if (floatingToolbar) {
            floatingToolbar.setImageToolsEnabled(imageToolsEnabled);
        }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            if (changes.geminiImageToolsEnabled) {
                 const enabled = changes.geminiImageToolsEnabled.newValue !== false;
                 if (floatingToolbar) floatingToolbar.setImageToolsEnabled(enabled);
            }
        }
    });

})();
