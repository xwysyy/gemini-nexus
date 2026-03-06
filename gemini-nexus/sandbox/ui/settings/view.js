
// sandbox/ui/settings/view.js
import { ConnectionSection } from './sections/connection.js';
import { GeneralSection } from './sections/general.js';
import { AppearanceSection } from './sections/appearance.js';
import { AboutSection } from './sections/about.js';

export class SettingsView {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        this.elements = {};
        
        // Initialize Sections
        this.connection = new ConnectionSection();
        
        this.general = new GeneralSection({
            onPageContextImagesChange: (val) => this.fire('onPageContextImagesChange', val),
            onSidebarBehaviorChange: (val) => this.fire('onSidebarBehaviorChange', val)
        });
        
        this.appearance = new AppearanceSection({
            onThemeChange: (val) => this.fire('onThemeChange', val),
            onLanguageChange: (val) => this.fire('onLanguageChange', val)
        });

        this.about = new AboutSection({
            onDownloadLogs: () => this.fire('onDownloadLogs')
        });

        this.queryElements();
        this.bindEvents();
    }

    queryElements() {
        const get = (id) => document.getElementById(id);
        
        this.elements = {
            modal: get('settings-modal'),
            btnClose: get('close-settings'),
            btnSave: get('save-settings')
        };
    }

    bindEvents() {
        const { modal, btnClose, btnSave } = this.elements;

        // Modal actions
        if (btnClose) btnClose.addEventListener('click', () => this.close());
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.close();
            });
        }

        // Action Buttons
        if (btnSave) btnSave.addEventListener('click', () => this.handleSave());

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.classList.contains('visible')) {
                this.close();
            }
        });
    }

    handleSave() {
        const connectionData = this.connection.getData();
        const generalData = this.general.getData();
        
        const data = {
            connection: connectionData,
            pageContextImages: generalData.pageContextImages,
            toolPrompts: generalData.toolPrompts,
            accountIndices: generalData.accountIndices
        };
        
        this.fire('onSave', data);
        this.close();
    }

    // --- Public API ---

    open() {
        if (this.elements.modal) {
            this.elements.modal.classList.add('visible');
            this.fire('onOpen');
        }
    }

    close() {
        if (this.elements.modal) {
            this.elements.modal.classList.remove('visible');
        }
    }

    // Delegation to Appearance
    setThemeValue(theme) {
        this.appearance.setTheme(theme);
    }

    setLanguageValue(lang) {
        this.appearance.setLanguage(lang);
    }
    
    applyVisualTheme(theme) {
        this.appearance.applyVisualTheme(theme);
    }

    // Delegation to General
    setToggles(pageContextImages) {
        this.general.setToggles(pageContextImages);
    }

    setToolPrompts(prompts) {
        this.general.setToolPrompts(prompts);
    }
    
    setSidebarBehavior(behavior) {
        this.general.setSidebarBehavior(behavior);
    }

    setAccountIndices(val) {
        this.general.setAccountIndices(val);
    }

    // Delegation to Connection
    setConnectionSettings(data) {
        this.connection.setData(data);
    }

    // Delegation to About
    displayStars(count) {
        this.about.displayStars(count);
    }

    hasFetchedStars() {
        return this.about.hasFetchedStars();
    }

    getCurrentVersion() {
        return this.about.getCurrentVersion();
    }

    displayUpdateStatus(latest, current, isUpdateAvailable) {
        this.about.displayUpdateStatus(latest, current, isUpdateAvailable);
    }

    fire(event, data) {
        if (this.callbacks[event]) this.callbacks[event](data);
    }
}
