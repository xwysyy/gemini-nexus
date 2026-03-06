
// sandbox/ui/settings/sections/general.js

export class GeneralSection {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        this.elements = {};
        this.queryElements();
        this.bindEvents();
    }

    queryElements() {
        const get = (id) => document.getElementById(id);
        this.elements = {
            pageContextImagesToggle: get('page-context-images-toggle'),
            pageContextPromptInput: get('page-context-prompt-input'),
            ocrPromptInput: get('ocr-prompt-input'),
            screenshotTranslatePromptInput: get('screenshot-translate-prompt-input'),
            snipPromptInput: get('snip-prompt-input'),
            accountIndicesInput: get('account-indices-input'),
            sidebarRadios: document.querySelectorAll('input[name="sidebar-behavior"]')
        };
    }

    bindEvents() {
        const { pageContextImagesToggle, sidebarRadios } = this.elements;

        if (pageContextImagesToggle) {
            pageContextImagesToggle.addEventListener('change', (e) => this.fire('onPageContextImagesChange', e.target.checked));
        }
        if (sidebarRadios) {
            sidebarRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if(e.target.checked) this.fire('onSidebarBehaviorChange', e.target.value);
                });
            });
        }
    }

    setToggles(pageContextImages) {
        if (this.elements.pageContextImagesToggle) this.elements.pageContextImagesToggle.checked = pageContextImages === true;
    }

    setToolPrompts(prompts = {}) {
        const {
            pageContextPromptInput,
            ocrPromptInput,
            screenshotTranslatePromptInput,
            snipPromptInput
        } = this.elements;

        if (pageContextPromptInput) pageContextPromptInput.value = prompts.pageContextPrompt || "";
        if (ocrPromptInput) ocrPromptInput.value = prompts.ocrPrompt || "";
        if (screenshotTranslatePromptInput) screenshotTranslatePromptInput.value = prompts.screenshotTranslatePrompt || "";
        if (snipPromptInput) snipPromptInput.value = prompts.snipPrompt || "";
    }

    setAccountIndices(val) {
        if (this.elements.accountIndicesInput) this.elements.accountIndicesInput.value = val || "0";
    }

    setSidebarBehavior(behavior) {
        if (this.elements.sidebarRadios) {
            const val = behavior || 'auto';
            this.elements.sidebarRadios.forEach(radio => {
                radio.checked = (radio.value === val);
            });
        }
    }

    getData() {
        const {
            pageContextImagesToggle,
            pageContextPromptInput,
            ocrPromptInput,
            screenshotTranslatePromptInput,
            snipPromptInput,
            accountIndicesInput
        } = this.elements;
        return {
            pageContextImages: pageContextImagesToggle ? pageContextImagesToggle.checked : false,
            toolPrompts: {
                pageContextPrompt: pageContextPromptInput ? pageContextPromptInput.value.trim() : "",
                ocrPrompt: ocrPromptInput ? ocrPromptInput.value.trim() : "",
                screenshotTranslatePrompt: screenshotTranslatePromptInput ? screenshotTranslatePromptInput.value.trim() : "",
                snipPrompt: snipPromptInput ? snipPromptInput.value.trim() : ""
            },
            accountIndices: accountIndicesInput ? accountIndicesInput.value : "0"
        };
    }

    fire(event, data) {
        if (this.callbacks[event]) this.callbacks[event](data);
    }
}
