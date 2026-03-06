export class ConnectionSection {
    constructor() {
        this.elements = {};
        this.queryElements();
        this.bindEvents();
    }

    queryElements() {
        const get = (id) => document.getElementById(id);
        this.elements = {
            providerSelect: get('provider-select'),
            apiKeyContainer: get('api-key-container'),
            officialFields: get('official-fields'),
            apiKeyInput: get('api-key-input'),
            thinkingLevelSelect: get('thinking-level-select'),
            openaiFields: get('openai-fields'),
            openaiBaseUrl: get('openai-base-url'),
            openaiApiKey: get('openai-api-key'),
            openaiModel: get('openai-model'),
        };
    }

    bindEvents() {
        const { providerSelect } = this.elements;
        if (providerSelect) {
            providerSelect.addEventListener('change', (e) => {
                this.updateVisibility(e.target.value);
            });
        }
    }

    setData(data) {
        const {
            providerSelect,
            apiKeyInput,
            thinkingLevelSelect,
            openaiBaseUrl,
            openaiApiKey,
            openaiModel,
        } = this.elements;

        const provider = data.provider || 'web';

        if (providerSelect) {
            providerSelect.value = provider;
            this.updateVisibility(provider);
        }

        if (apiKeyInput) apiKeyInput.value = data.apiKey || "";
        if (thinkingLevelSelect) thinkingLevelSelect.value = data.thinkingLevel || "low";
        if (openaiBaseUrl) openaiBaseUrl.value = data.openaiBaseUrl || "";
        if (openaiApiKey) openaiApiKey.value = data.openaiApiKey || "";
        if (openaiModel) openaiModel.value = data.openaiModel || "";
    }

    getData() {
        const {
            providerSelect,
            apiKeyInput,
            thinkingLevelSelect,
            openaiBaseUrl,
            openaiApiKey,
            openaiModel,
        } = this.elements;

        return {
            provider: providerSelect ? providerSelect.value : 'web',
            apiKey: apiKeyInput ? apiKeyInput.value.trim() : "",
            thinkingLevel: thinkingLevelSelect ? thinkingLevelSelect.value : "low",
            openaiBaseUrl: openaiBaseUrl ? openaiBaseUrl.value.trim() : "",
            openaiApiKey: openaiApiKey ? openaiApiKey.value.trim() : "",
            openaiModel: openaiModel ? openaiModel.value.trim() : "",
        };
    }

    updateVisibility(provider) {
        const { apiKeyContainer, officialFields, openaiFields } = this.elements;
        if (!apiKeyContainer) return;

        if (provider === 'web') {
            apiKeyContainer.style.display = 'none';
            return;
        }

        apiKeyContainer.style.display = 'flex';
        if (officialFields) officialFields.style.display = provider === 'official' ? 'flex' : 'none';
        if (openaiFields) openaiFields.style.display = provider === 'openai' ? 'flex' : 'none';
    }
}
