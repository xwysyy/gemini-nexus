
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
            imageToolsToggle: get('image-tools-toggle'),
            pageContextImagesToggle: get('page-context-images-toggle'),
            accountIndicesInput: get('account-indices-input'),
            sidebarRadios: document.querySelectorAll('input[name="sidebar-behavior"]')
        };
    }

    bindEvents() {
        const { imageToolsToggle, pageContextImagesToggle, sidebarRadios } = this.elements;

        if (imageToolsToggle) {
            imageToolsToggle.addEventListener('change', (e) => this.fire('onImageToolsChange', e.target.checked));
        }
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

    setToggles(imageTools, pageContextImages) {
        if (this.elements.imageToolsToggle) this.elements.imageToolsToggle.checked = imageTools;
        if (this.elements.pageContextImagesToggle) this.elements.pageContextImagesToggle.checked = pageContextImages === true;
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
        const { imageToolsToggle, pageContextImagesToggle, accountIndicesInput } = this.elements;
        return {
            imageTools: imageToolsToggle ? imageToolsToggle.checked : true,
            pageContextImages: pageContextImagesToggle ? pageContextImagesToggle.checked : false,
            accountIndices: accountIndicesInput ? accountIndicesInput.value : "0"
        };
    }

    fire(event, data) {
        if (this.callbacks[event]) this.callbacks[event](data);
    }
}
