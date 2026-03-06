
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
                const root = this._getPrimaryContentRoot();
                const text = this._extractPrimaryContentText(root);

                const payload = {
                    content: text,
                    title: document.title || "",
                    url: window.location.href
                };

                if (request.includeImages === true) {
                    payload.images = this._collectPageImageCandidates(root, request.maxCandidates || 15);
                }

                sendResponse(payload);
            } catch(e) {
                sendResponse({ content: "", error: e.message });
            }
        }

        _getPrimaryContentRoot() {
            const body = document.body;
            if (!body) return document.documentElement;

            const explicitSelectors = [
                'article',
                'main',
                '[role="main"]',
                '.post',
                '.post-content',
                '.post-body',
                '.article',
                '.article-content',
                '.entry',
                '.entry-content',
                '.content',
                '.content-body',
                '.markdown-body',
                '.prose',
                '.docs-content',
                '.doc-content',
                '.theme-default-content',
                '.vp-doc',
                '.blog-post'
            ];

            const candidates = [];
            const seen = new Set();
            const addCandidate = (el) => {
                if (!(el instanceof Element) || seen.has(el)) return;
                const textLength = this._normalizeText(el.innerText || "").length;
                if (textLength < 200) return;
                seen.add(el);
                candidates.push(el);
            };

            explicitSelectors.forEach((selector) => {
                document.querySelectorAll(selector).forEach(addCandidate);
            });

            Array.from(body.children || []).forEach(addCandidate);
            addCandidate(body);

            let best = body;
            let bestScore = -Infinity;

            for (const candidate of candidates) {
                const score = this._scoreContentRoot(candidate);
                if (score > bestScore) {
                    bestScore = score;
                    best = candidate;
                }
            }

            return best || body;
        }

        _scoreContentRoot(element) {
            const text = this._normalizeText(element.innerText || "");
            const textLength = text.length;
            const rect = element.getBoundingClientRect();
            const area = Math.max(rect.width || 0, element.clientWidth || 0) * Math.max(rect.height || 0, element.clientHeight || 0);
            const paragraphCount = element.querySelectorAll('p').length;
            const headingCount = element.querySelectorAll('h1, h2, h3').length;
            const mediaCount = element.querySelectorAll('img, svg, figure, pre, code').length;
            const linkTextLength = Array.from(element.querySelectorAll('a'))
                .slice(0, 200)
                .reduce((sum, link) => sum + Math.min((link.innerText || "").trim().length, 400), 0);
            const linkDensity = linkTextLength / Math.max(textLength, 1);
            const identity = `${element.tagName} ${element.id || ""} ${element.className || ""}`.toLowerCase();

            let score =
                Math.min(textLength, 25000) +
                paragraphCount * 350 +
                headingCount * 700 +
                mediaCount * 120 +
                Math.min(area, 2_000_000) / 200;

            if (/(article|post|entry|markdown|content|docs|doc|blog|read|main)/.test(identity)) {
                score += 5000;
            }
            if (/(nav|menu|header|footer|sidebar|aside|comment|related|recommend|share|social|search|breadcrumb|pagination|toolbar)/.test(identity)) {
                score -= 7000;
            }
            if (element.tagName === 'ARTICLE') score += 4000;
            if (element.tagName === 'MAIN') score += 3000;
            if (textLength < 800) score -= 4000;
            if (linkDensity > 0.45) score -= Math.round(linkDensity * 12000);

            return score;
        }

        _extractPrimaryContentText(root) {
            const target = root || document.body;
            if (!target) return "";

            const clone = target.cloneNode(true);
            if (clone.querySelectorAll) {
                clone.querySelectorAll(
                    'script, style, noscript, nav, footer, aside, form, button, .sidebar, .toc, .table-of-contents, .breadcrumb, .breadcrumbs, .related, .share, .social, .recommend, .comments, .comment, .pagination, .pager, .search, .advertisement, .ads'
                ).forEach((node) => node.remove());
            }

            return this._normalizeText(clone.innerText || target.innerText || "");
        }

        _normalizeText(text) {
            return (text || "")
                .replace(/[ \t]+\n/g, '\n')
                .replace(/\n[ \t]+/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
        }

        _isHiddenVisual(element) {
            const style = window.getComputedStyle(element);
            return style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0;
        }

        _isExcludedVisual(element, root) {
            const excluded = element.closest('nav, footer, aside, .sidebar, .toc, .table-of-contents, .breadcrumb, .breadcrumbs, .related, .share, .social, .recommend, .comments, .comment, .pagination, .pager, .search, .advertisement, .ads');
            return !!(excluded && root && root.contains(excluded) && excluded !== root);
        }

        _buildVisualCandidate(url, alt, width, height, rect) {
            const minSide = Math.min(width, height);
            const area = width * height;

            if (!url || minSide < 160 || area < 50000) return null;

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

            return {
                url,
                alt: alt || "",
                width,
                height,
                score
            };
        }

        _extractBackgroundImageUrls(backgroundImage) {
            if (!backgroundImage || backgroundImage === 'none') return [];

            const urls = [];
            const regex = /url\((['"]?)(.*?)\1\)/g;
            let match;
            while ((match = regex.exec(backgroundImage)) !== null) {
                const url = (match[2] || "").trim();
                if (url && !url.startsWith('blob:')) {
                    urls.push(url);
                }
            }
            return urls;
        }

        _collectPageImageCandidates(root, maxCandidates = 15) {
            const seen = new Set();
            const candidates = [];
            const scope = root || document.body;
            const images = Array.from(scope.querySelectorAll('img') || []);
            const svgs = Array.from(scope.querySelectorAll('svg') || []);
            const backgroundElements = [scope, ...Array.from(scope.querySelectorAll('*') || [])];

            for (const img of images) {
                if (this._isExcludedVisual(img, scope) || this._isHiddenVisual(img)) continue;

                const src = (img.currentSrc || img.src || "").trim();
                if (!src || seen.has(src) || src.startsWith('blob:')) continue;

                const rect = img.getBoundingClientRect();
                const renderWidth = Math.max(rect.width || 0, img.width || 0);
                const renderHeight = Math.max(rect.height || 0, img.height || 0);
                const naturalWidth = img.naturalWidth || renderWidth;
                const naturalHeight = img.naturalHeight || renderHeight;

                const effectiveWidth = Math.max(renderWidth, naturalWidth);
                const effectiveHeight = Math.max(renderHeight, naturalHeight);
                const candidate = this._buildVisualCandidate(src, img.alt || "", effectiveWidth, effectiveHeight, rect);
                if (!candidate) continue;

                candidates.push(candidate);
                seen.add(src);
            }

            for (const svg of svgs) {
                if (!svg || (svg.parentElement && svg.parentElement.closest('svg'))) continue;
                if (this._isExcludedVisual(svg, scope) || this._isHiddenVisual(svg)) continue;

                const rect = svg.getBoundingClientRect();
                const width = rect.width || 0;
                const height = rect.height || 0;

                const cloned = svg.cloneNode(true);
                if (!cloned.getAttribute('xmlns')) {
                    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                }

                const serialized = new XMLSerializer().serializeToString(cloned);
                const encoded = btoa(unescape(encodeURIComponent(serialized)));
                const dataUrl = `data:image/svg+xml;base64,${encoded}`;
                if (seen.has(dataUrl)) continue;

                const candidate = this._buildVisualCandidate(
                    dataUrl,
                    svg.getAttribute('aria-label') || svg.getAttribute('title') || "",
                    width,
                    height,
                    rect
                );
                if (!candidate) continue;

                candidates.push(candidate);
                seen.add(dataUrl);
            }

            for (const element of backgroundElements) {
                if (!(element instanceof Element)) continue;
                if (element === document.body || element === document.documentElement) continue;
                if (this._isExcludedVisual(element, scope) || this._isHiddenVisual(element)) continue;

                const rect = element.getBoundingClientRect();
                const width = rect.width || 0;
                const height = rect.height || 0;
                const urls = this._extractBackgroundImageUrls(window.getComputedStyle(element).backgroundImage);
                if (urls.length === 0) continue;

                const alt =
                    element.getAttribute('aria-label') ||
                    element.getAttribute('title') ||
                    (element.textContent || "").trim().slice(0, 80);

                for (const url of urls) {
                    if (!url || seen.has(url)) continue;
                    const candidate = this._buildVisualCandidate(url, alt, width, height, rect);
                    if (!candidate) continue;

                    candidates.push(candidate);
                    seen.add(url);
                }
            }

            candidates.sort((a, b) => b.score - a.score);
            return candidates.slice(0, Math.max(1, maxCandidates)).map(({ score, ...rest }) => rest);
        }
    }

    window.GeminiMessageRouter = new MessageRouter();
})();
