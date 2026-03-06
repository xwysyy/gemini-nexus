
// content/messages.js

(function() {
    class MessageRouter {
        constructor() {
            this.toolbarController = null;
            this.selectionOverlay = null;
            // Track capture source
            this.captureSource = null;
        }

        init(toolbarController, selectionOverlay) {
            this.toolbarController = toolbarController;
            this.selectionOverlay = selectionOverlay;
            
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                return this.handle(request, sender, sendResponse);
            });
        }

        handle(request, sender, sendResponse) {
            // Start Selection Mode (Screenshot received)
            if (request.action === "START_SELECTION") {
                this.captureSource = request.source; 

                // Hide floating UI to prevent self-capture artifacts
                if (this.toolbarController) {
                    this.toolbarController.hideAll();
                    if (request.mode) {
                        this.toolbarController.currentMode = request.mode;
                    }
                }
                
                this.selectionOverlay.start(request.image);
                sendResponse({status: "selection_started"});
                return true;
            }

            // Crop Result (Area selected)
            if (request.action === "CROP_SCREENSHOT") {
                if (this.captureSource === 'sidepanel') {
                    // Forward back to sidepanel via background
                    chrome.runtime.sendMessage({ 
                        action: "PROCESS_CROP_IN_SIDEPANEL", 
                        payload: request 
                    });
                    this.captureSource = null;
                } else {
                    // Handle locally
                    if (this.toolbarController) {
                        this.toolbarController.handleCropResult(request);
                    }
                }
                sendResponse({status: "ok"});
                return true;
            }

            // Generated Image Result
            if (request.action === "GENERATED_IMAGE_RESULT") {
                if (this.toolbarController) {
                    this.toolbarController.handleGeneratedImageResult(request);
                }
                sendResponse({status: "ok"});
                return true;
            }

            // Get Full Page Content
            if (request.action === "GET_PAGE_CONTENT") {
                this._getPageContent(sendResponse, request);
                return true;
            }
            
            return false;
        }

        _getPageContent(sendResponse, request = {}) {
            try {
                let text = document.body.innerText || "";
                text = text.replace(/\n{3,}/g, '\n\n');

                const payload = {
                    content: text,
                    title: document.title || "",
                    url: window.location.href
                };

                if (request.includeImages === true) {
                    payload.images = this._collectPageImageCandidates(request.maxCandidates || 15);
                }

                sendResponse(payload);
            } catch(e) {
                sendResponse({ content: "", error: e.message });
            }
        }

        _collectPageImageCandidates(maxCandidates = 15) {
            const seen = new Set();
            const candidates = [];
            const images = Array.from(document.images || []);

            for (const img of images) {
                const src = (img.currentSrc || img.src || "").trim();
                if (!src || seen.has(src) || src.startsWith('blob:')) continue;

                const rect = img.getBoundingClientRect();
                const style = window.getComputedStyle(img);
                if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;

                const renderWidth = Math.max(rect.width || 0, img.width || 0);
                const renderHeight = Math.max(rect.height || 0, img.height || 0);
                const naturalWidth = img.naturalWidth || renderWidth;
                const naturalHeight = img.naturalHeight || renderHeight;

                const effectiveWidth = Math.max(renderWidth, naturalWidth);
                const effectiveHeight = Math.max(renderHeight, naturalHeight);
                const minSide = Math.min(effectiveWidth, effectiveHeight);
                const area = effectiveWidth * effectiveHeight;

                if (minSide < 160 || area < 50000) continue;

                const inViewport =
                    rect.bottom > 0 &&
                    rect.right > 0 &&
                    rect.top < window.innerHeight &&
                    rect.left < window.innerWidth;

                const topBias = Number.isFinite(rect.top) ? Math.max(rect.top, 0) : window.innerHeight;
                const score =
                    (inViewport ? 1_000_000_000_000 : 0) +
                    Math.min(area, 100_000_000) -
                    Math.min(topBias, 10000) * 100;

                candidates.push({
                    url: src,
                    alt: img.alt || "",
                    width: naturalWidth,
                    height: naturalHeight,
                    score
                });
                seen.add(src);
            }

            candidates.sort((a, b) => b.score - a.score);
            return candidates.slice(0, Math.max(1, maxCandidates)).map(({ score, ...rest }) => rest);
        }
    }

    window.GeminiMessageRouter = new MessageRouter();
})();
