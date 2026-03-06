
export const GeneralSettingsTemplate = `
<div class="setting-group">
    <h4 data-i18n="general">General</h4>

    <div class="shortcut-row" style="margin-bottom: 12px;">
        <div style="flex: 1;">
            <label data-i18n="pageContextImagesToggle" style="font-weight: 500; display: block; margin-bottom: 2px;">Attach Page Images in Page Chat</label>
            <span class="setting-desc" data-i18n="pageContextImagesToggleDesc">When page chat is enabled, attach up to 10 compressed images from the current page as temporary context.</span>
        </div>
        <input type="checkbox" id="page-context-images-toggle" style="width: 20px; height: 20px; cursor: pointer;">
    </div>

    <div class="setting-group" style="margin-top: 16px;">
        <h5 data-i18n="commonPrompts" style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: var(--text-primary);">Common Prompts</h5>

        <div style="display: flex; flex-direction: column; gap: 12px;">
            <div>
                <label data-i18n="pageContextPromptLabel" style="font-weight: 500; display: block; margin-bottom: 4px;">Page</label>
                <textarea id="page-context-prompt-input" class="shortcut-input" rows="2" style="width: 100%; text-align: left; box-sizing: border-box; resize: vertical;" data-i18n-placeholder="pageContextPromptPlaceholder" placeholder="Optional default prompt when enabling page chat."></textarea>
            </div>
            <div>
                <label data-i18n="ocrPromptLabel" style="font-weight: 500; display: block; margin-bottom: 4px;">OCR</label>
                <textarea id="ocr-prompt-input" class="shortcut-input" rows="2" style="width: 100%; text-align: left; box-sizing: border-box; resize: vertical;" data-i18n-placeholder="ocrPromptPlaceholder" placeholder="Optional override for OCR prompt."></textarea>
            </div>
            <div>
                <label data-i18n="screenshotTranslatePromptLabel" style="font-weight: 500; display: block; margin-bottom: 4px;">Screenshot Translate</label>
                <textarea id="screenshot-translate-prompt-input" class="shortcut-input" rows="2" style="width: 100%; text-align: left; box-sizing: border-box; resize: vertical;" data-i18n-placeholder="screenshotTranslatePromptPlaceholder" placeholder="Optional override for screenshot translation prompt."></textarea>
            </div>
            <div>
                <label data-i18n="snipPromptLabel" style="font-weight: 500; display: block; margin-bottom: 4px;">Snip</label>
                <textarea id="snip-prompt-input" class="shortcut-input" rows="2" style="width: 100%; text-align: left; box-sizing: border-box; resize: vertical;" data-i18n-placeholder="snipPromptPlaceholder" placeholder="Optional default prompt for screenshot analysis."></textarea>
            </div>
        </div>
    </div>

    <div class="shortcut-row" style="margin-bottom: 12px; align-items: flex-start;">
        <div style="flex: 1; margin-right: 12px;">
            <label data-i18n="accountIndices" style="font-weight: 500; display: block; margin-bottom: 2px;">Account Indices</label>
            <span class="setting-desc" data-i18n="accountIndicesDesc">Comma-separated user indices (e.g., 0, 1, 2) for polling.</span>
        </div>
        <input type="text" id="account-indices-input" class="shortcut-input" style="width: 100px; text-align: left;" placeholder="0">
    </div>

    <div style="margin-top: 16px;">
        <h5 data-i18n="sidebarBehavior" style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: var(--text-primary);">When Sidebar Reopens</h5>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <label style="display: flex; align-items: flex-start; gap: 8px; cursor: pointer;">
                <input type="radio" name="sidebar-behavior" value="auto" style="margin-top: 3px;">
                <div>
                    <div data-i18n="sidebarBehaviorAuto" style="font-weight: 500; font-size: 14px; color: var(--text-primary);">Auto restore or restart</div>
                    <div data-i18n="sidebarBehaviorAutoDesc" style="font-size: 12px; color: var(--text-tertiary);">Restore if opened within 10 mins, otherwise start new chat.</div>
                </div>
            </label>
            
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="radio" name="sidebar-behavior" value="restore">
                <span data-i18n="sidebarBehaviorRestore" style="font-size: 14px; color: var(--text-primary);">Always restore previous chat</span>
            </label>
            
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="radio" name="sidebar-behavior" value="new">
                <span data-i18n="sidebarBehaviorNew" style="font-size: 14px; color: var(--text-primary);">Always start new chat</span>
            </label>
        </div>
    </div>
</div>`;
