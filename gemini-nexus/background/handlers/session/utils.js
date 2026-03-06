
// background/handlers/session/utils.js

import { dataUrlToBlob } from '../../../lib/utils.js';

const PAGE_CONTEXT_IMAGE_MAX_IMAGES = 5;
const PAGE_CONTEXT_IMAGE_MAX_CANDIDATES = 15;
const PAGE_CONTEXT_IMAGE_MAX_SIDE = 1280;
const PAGE_CONTEXT_IMAGE_QUALITY = 0.75;
const PAGE_CONTEXT_IMAGE_MAX_BYTES = 500 * 1024;
const PAGE_CONTEXT_IMAGE_MAX_TOTAL_BYTES = 2 * 1024 * 1024;

async function getTargetTab(specificTabId = null) {
    if (specificTabId) {
        try {
            return await chrome.tabs.get(specificTabId);
        } catch (e) {
            return null;
        }
    }

    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tabs[0] || null;
}

function isRestrictedTab(tab) {
    return !tab || !tab.id || (tab.url && (
        tab.url.startsWith('chrome://') || 
        tab.url.startsWith('edge://') || 
        tab.url.startsWith('chrome-extension://') || 
        tab.url.startsWith('about:') ||
        tab.url.startsWith('view-source:') ||
        tab.url.startsWith('https://chrome.google.com/webstore') ||
        tab.url.startsWith('https://chromewebstore.google.com')
    ));
}

function estimateDataUrlBytes(dataUrl) {
    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex === -1) return 0;
    const base64 = dataUrl.slice(commaIndex + 1);
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

async function blobToDataUrl(blob) {
    if (typeof FileReader !== 'undefined') {
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    const buffer = new Uint8Array(await blob.arrayBuffer());
    const chunkSize = 0x8000;
    let binary = '';

    for (let i = 0; i < buffer.length; i += chunkSize) {
        binary += String.fromCharCode(...buffer.subarray(i, i + chunkSize));
    }

    return `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`;
}

function getTargetDimensions(width, height, maxSide) {
    const longestSide = Math.max(width, height);
    if (!longestSide || longestSide <= maxSide) {
        return [Math.max(1, Math.round(width)), Math.max(1, Math.round(height))];
    }

    const scale = maxSide / longestSide;
    return [
        Math.max(1, Math.round(width * scale)),
        Math.max(1, Math.round(height * scale))
    ];
}

async function resizeImageDataUrl(dataUrl, { maxSide, quality, type = 'image/jpeg' }) {
    const blob = await dataUrlToBlob(dataUrl);
    const bitmap = await createImageBitmap(blob);

    try {
        const [targetWidth, targetHeight] = getTargetDimensions(bitmap.width, bitmap.height, maxSide);
        const canvas = new OffscreenCanvas(targetWidth, targetHeight);
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

        const outputBlob = await canvas.convertToBlob({ type, quality });
        return await blobToDataUrl(outputBlob);
    } finally {
        if (typeof bitmap.close === 'function') {
            bitmap.close();
        }
    }
}

async function compressPageContextImage(dataUrl, maxBytes) {
    let maxSide = PAGE_CONTEXT_IMAGE_MAX_SIDE;
    let quality = PAGE_CONTEXT_IMAGE_QUALITY;
    let best = null;

    for (let attempt = 0; attempt < 4; attempt++) {
        const compressed = await resizeImageDataUrl(dataUrl, { maxSide, quality });
        const bytes = estimateDataUrlBytes(compressed);
        best = { dataUrl: compressed, bytes };

        if (bytes <= maxBytes) {
            return best;
        }

        maxSide = Math.max(512, Math.round(maxSide * 0.85));
        quality = Math.max(0.45, quality - 0.1);
    }

    return best;
}

async function collectPageContextImages(candidates, imageHandler, maxImages = PAGE_CONTEXT_IMAGE_MAX_IMAGES) {
    if (!imageHandler || !Array.isArray(candidates) || candidates.length === 0) {
        return [];
    }

    const files = [];
    let totalBytes = 0;

    for (const candidate of candidates) {
        if (!candidate || !candidate.url) continue;
        if (files.length >= maxImages) break;

        try {
            const fetched = await imageHandler.fetchImage(candidate.url);
            if (!fetched || fetched.error || !fetched.base64) continue;

            const compressed = await compressPageContextImage(fetched.base64, PAGE_CONTEXT_IMAGE_MAX_BYTES);
            if (!compressed || !compressed.dataUrl || compressed.bytes > PAGE_CONTEXT_IMAGE_MAX_BYTES) continue;
            if (totalBytes + compressed.bytes > PAGE_CONTEXT_IMAGE_MAX_TOTAL_BYTES) break;

            totalBytes += compressed.bytes;
            files.push({
                base64: compressed.dataUrl,
                type: 'image/jpeg',
                name: `page-context-${files.length + 1}.jpg`,
                sourceUrl: candidate.url,
                alt: candidate.alt || ""
            });
        } catch (error) {
            console.warn("Failed to attach page context image:", candidate.url, error);
        }
    }

    return files;
}

export async function getActiveTabContext(options = {}, imageHandler = null) {
    try {
        const tab = await getTargetTab(options.specificTabId || null);
        if (isRestrictedTab(tab)) return null;

        const includeImages = options.includeImages === true;

        try {
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: "GET_PAGE_CONTENT",
                includeImages,
                maxCandidates: options.maxCandidates || PAGE_CONTEXT_IMAGE_MAX_CANDIDATES
            });

            const text = response ? (response.content || "") : "";
            const context = {
                text,
                title: response?.title || tab.title || "",
                url: response?.url || tab.url || "",
                images: []
            };

            if (includeImages) {
                context.images = await collectPageContextImages(
                    response?.images || [],
                    imageHandler,
                    options.maxImages || PAGE_CONTEXT_IMAGE_MAX_IMAGES
                );
            }

            return context;
        } catch (e) {
            console.log("Content script unavailable, attempting fallback injection...");
            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => ({
                        content: document.body ? document.body.innerText : "",
                        title: document.title || "",
                        url: window.location.href
                    })
                });

                const result = results?.[0]?.result || null;
                return {
                    text: result?.content || "",
                    title: result?.title || tab.title || "",
                    url: result?.url || tab.url || "",
                    images: []
                };
            } catch (injErr) {
                console.error("Fallback injection failed:", injErr);
                return null;
            }
        }
    } catch (e) {
        console.error("Failed to get page context:", e);
        return null;
    }
}

export async function getActiveTabContent(specificTabId = null) {
    const context = await getActiveTabContext({ specificTabId }, null);
    return context ? context.text : null;
}
