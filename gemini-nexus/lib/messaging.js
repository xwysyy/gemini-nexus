
// lib/messaging.js

export function sendToBackground(payload) {
    window.parent.postMessage({
        action: 'FORWARD_TO_BACKGROUND',
        payload: payload
    }, '*');
}

export function saveSessionsToStorage(sessions) {
    window.parent.postMessage({
        action: 'SAVE_SESSIONS',
        payload: sessions
    }, '*');
}

export function requestThemeFromStorage() {
    window.parent.postMessage({ action: 'GET_THEME' }, '*');
}

export function saveThemeToStorage(theme) {
    window.parent.postMessage({
        action: 'SAVE_THEME',
        payload: theme
    }, '*');
}

export function requestLanguageFromStorage() {
    window.parent.postMessage({ action: 'GET_LANGUAGE' }, '*');
}

export function saveLanguageToStorage(lang) {
    window.parent.postMessage({
        action: 'SAVE_LANGUAGE',
        payload: lang
    }, '*');
}

export function requestPageContextImagesFromStorage() {
    window.parent.postMessage({ action: 'GET_PAGE_CONTEXT_IMAGES' }, '*');
}

export function savePageContextImagesToStorage(enabled) {
    window.parent.postMessage({
        action: 'SAVE_PAGE_CONTEXT_IMAGES',
        payload: enabled
    }, '*');
}

export function requestToolPromptsFromStorage() {
    window.parent.postMessage({ action: 'GET_TOOL_PROMPTS' }, '*');
}

export function saveToolPromptsToStorage(prompts) {
    window.parent.postMessage({
        action: 'SAVE_TOOL_PROMPTS',
        payload: prompts
    }, '*');
}

export function saveSidebarBehaviorToStorage(behavior) {
    window.parent.postMessage({
        action: 'SAVE_SIDEBAR_BEHAVIOR',
        payload: behavior
    }, '*');
}

export function requestAccountIndicesFromStorage() {
    window.parent.postMessage({ action: 'GET_ACCOUNT_INDICES' }, '*');
}

export function saveAccountIndicesToStorage(indices) {
    window.parent.postMessage({
        action: 'SAVE_ACCOUNT_INDICES',
        payload: indices
    }, '*');
}

export function requestConnectionSettingsFromStorage() {
    window.parent.postMessage({ action: 'GET_CONNECTION_SETTINGS' }, '*');
}

export function saveConnectionSettingsToStorage(data) {
    window.parent.postMessage({
        action: 'SAVE_CONNECTION_SETTINGS',
        payload: data
    }, '*');
}
