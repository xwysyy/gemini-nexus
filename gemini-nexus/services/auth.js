
// services/auth.js
import { extractFromHTML } from '../lib/utils.js';

// Get 'at' (SNlM0e), 'bl' (cfb2h), and user index values
// Supports fetching from specific user index URL to get correct tokens for that account.
export async function fetchRequestParams(userIndex = '0') {
    // Based on user feedback, account URLs differ slightly:
    // Default (0): https://gemini.google.com/app
    // Others (X): https://gemini.google.com/u/X/app
    let url = 'https://gemini.google.com/app';
    if (userIndex && userIndex !== '0') {
        url = `https://gemini.google.com/u/${userIndex}/app`;
    }

    console.log(`Fetching Gemini credentials for index ${userIndex} via ${url}...`);
    
    const resp = await fetch(url, {
        method: 'GET'
    });
    const html = await resp.text();

    const atValue = extractFromHTML('SNlM0e', html);
    const blValue = extractFromHTML('cfb2h', html);

    // Scrape the latest web model IDs from Gemini app shell.
    // These IDs are used to build the `x-goog-ext-525001261-jspb` header.
    const webModelIds = extractWebModelIdsFromHTML(html);
    
    // Try to find the user index (authuser) to support multiple accounts
    // Usually found in the URL or implied, but scraping data-index is safer if available
    let authUserIndex = userIndex; // Default to requested index
    
    const authMatch = html.match(/data-index="(\d+)"/);
    if (authMatch) {
        authUserIndex = authMatch[1];
    }

    if (!atValue) {
        throw new Error(`Not logged in for account ${userIndex}. Please log in to gemini.google.com.`);
    }

    return { atValue, blValue, authUserIndex, webModelIds };
}

function uniqueInOrder(items) {
    const seen = new Set();
    const out = [];
    for (const item of items) {
        if (!item || seen.has(item)) continue;
        seen.add(item);
        out.push(item);
    }
    return out;
}

function extractHexesNearKey(html, key, maxLen = 800) {
    const markers = [`\\\\\"${key}\\\\\"`, `"${key}"`];
    let idx = -1;
    for (const marker of markers) {
        idx = html.indexOf(marker);
        if (idx !== -1) break;
    }
    if (idx === -1) return [];
    const slice = html.slice(idx, idx + maxLen);
    const matches = slice.match(/[0-9a-f]{16}/g) || [];
    return uniqueInOrder(matches);
}

function extractCsvNearKey(html, key, prefix, maxLen = 1000) {
    const markers = [`\\\\\"${key}\\\\\"`, `"${key}"`];
    let idx = -1;
    for (const marker of markers) {
        idx = html.indexOf(marker);
        if (idx !== -1) break;
    }
    if (idx === -1) return [];
    const slice = html.slice(idx, idx + maxLen);

    // Example (escaped inside Gemini HTML):
    // thinking\\\\u003d<id1>,<id2>,<id3>
    const re = new RegExp(`${prefix}\\\\\\\\+u003d([0-9a-f]{16}(?:,[0-9a-f]{16})*)`);
    const m = slice.match(re);
    if (!m) return [];
    return m[1].split(',').map(s => s.trim()).filter(Boolean);
}

function extractWebModelIdsFromHTML(html) {
    const ids = {};

    // Direct single-value keys (these have been stable across Gemini UI updates):
    // ... \"<hex>\",null,\"ctxsxd\" ...  (thinking/deep-think variant)
    // ... \"<hex>\",null,\"rKJhfc\" ...  (Pro variant)
    const thinkingMatch = html.match(/(?:\\\\\"|\")([0-9a-f]{16})(?:\\\\\"|\")\s*,\s*null\s*,\s*(?:\\\\\"|\")ctxsxd(?:\\\\\"|\")/);
    if (thinkingMatch) ids.thinking = thinkingMatch[1];

    const proMatch = html.match(/(?:\\\\\"|\")([0-9a-f]{16})(?:\\\\\"|\")\s*,\s*null\s*,\s*(?:\\\\\"|\")rKJhfc(?:\\\\\"|\")/);
    if (proMatch) ids.pro = proMatch[1];

    // Tier lists used by Gemini web UI (order can change; keep as list for fallbacks).
    const thinkingTiers = extractHexesNearKey(html, 'g9Ghwf');
    if (thinkingTiers.length > 0) ids.thinkingTiers = thinkingTiers;

    // Fast/Thinking buckets sometimes expose alternate IDs (useful when Google deprecates a version).
    const m3eThinking = extractCsvNearKey(html, 'm3eQte', 'thinking');
    if (m3eThinking.length > 0) ids.thinkingBuckets = m3eThinking;
    const m3eFast = extractCsvNearKey(html, 'm3eQte', 'fast');
    if (m3eFast.length > 0) ids.fastBuckets = m3eFast;

    ids.fetchedAt = Date.now();
    return ids;
}
