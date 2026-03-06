
// content.js v4.2.9 -> content/index.js

console.log("%c Gemini Nexus v4.2.9 Ready ", "background: #333; color: #00ff00; font-size: 16px");

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

})();
