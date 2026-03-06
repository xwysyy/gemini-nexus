
// sandbox/ui/settings.js
import { saveThemeToStorage, saveLanguageToStorage, saveSidebarBehaviorToStorage, saveImageToolsToStorage, requestImageToolsFromStorage, savePageContextImagesToStorage, requestPageContextImagesFromStorage, saveAccountIndicesToStorage, requestAccountIndicesFromStorage, saveConnectionSettingsToStorage, requestConnectionSettingsFromStorage, sendToBackground } from '../../lib/messaging.js';
import { setLanguagePreference, getLanguagePreference } from '../core/i18n.js';
import { SettingsView } from './settings/view.js';

export class SettingsController {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        
        this.imageToolsEnabled = true;
        this.pageContextImagesEnabled = true;
        this.accountIndices = "0";
        
        // Connection State
        this.connectionData = {
            provider: 'web',
            useOfficialApi: false, // Legacy support
            apiKey: "",
            thinkingLevel: "low",
            openaiBaseUrl: "",
            openaiApiKey: "",
            openaiModel: ""
        };

        // Initialize View
        this.view = new SettingsView({
            onOpen: () => this.handleOpen(),
            onSave: (data) => this.saveSettings(data),
            
            onThemeChange: (theme) => this.setTheme(theme),
            onLanguageChange: (lang) => this.setLanguage(lang),
            
            onImageToolsChange: (val) => { this.imageToolsEnabled = (val === 'on' || val === true); saveImageToolsToStorage(this.imageToolsEnabled); },
            onPageContextImagesChange: (val) => { this.pageContextImagesEnabled = (val === 'on' || val === true); savePageContextImagesToStorage(this.pageContextImagesEnabled); },
            onSidebarBehaviorChange: (val) => saveSidebarBehaviorToStorage(val),
            onDownloadLogs: () => this.downloadLogs()
        });
        
        // External Trigger Binding
        const trigger = document.getElementById('settings-btn');
        if(trigger) {
            trigger.addEventListener('click', () => {
                this.open();
                if (this.callbacks.onOpen) this.callbacks.onOpen();
            });
        }
        
        // Listen for log data
        window.addEventListener('message', (e) => {
            if (e.data.action === 'BACKGROUND_MESSAGE' && e.data.payload && e.data.payload.logs) {
                this.saveLogFile(e.data.payload.logs);
            }
        });
    }

    open() {
        this.view.open();
    }

    close() {
        this.view.close();
    }

    handleOpen() {
        // Sync state to view
        this.view.setLanguageValue(getLanguagePreference());
        this.view.setToggles(this.imageToolsEnabled, this.pageContextImagesEnabled);
        this.view.setAccountIndices(this.accountIndices);
        this.view.setConnectionSettings(this.connectionData);
        
        // Refresh from storage
        requestImageToolsFromStorage();
        requestPageContextImagesFromStorage();
        requestAccountIndicesFromStorage();
        requestConnectionSettingsFromStorage();
        
        this.fetchGithubData();
    }

    saveSettings(data) {
        this.imageToolsEnabled = data.imageTools;
        saveImageToolsToStorage(this.imageToolsEnabled);

        this.pageContextImagesEnabled = data.pageContextImages === true;
        savePageContextImagesToStorage(this.pageContextImagesEnabled);
        
        // Accounts
        let val = data.accountIndices.trim();
        if (!val) val = "0";
        this.accountIndices = val;
        const cleaned = val.replace(/[^0-9,]/g, '');
        saveAccountIndicesToStorage(cleaned);
        
        // Connection
        this.connectionData = {
            provider: data.connection.provider,
            apiKey: data.connection.apiKey,
            thinkingLevel: data.connection.thinkingLevel,
            openaiBaseUrl: data.connection.openaiBaseUrl,
            openaiApiKey: data.connection.openaiApiKey,
            openaiModel: data.connection.openaiModel
        };
        
        saveConnectionSettingsToStorage(this.connectionData);

        // Notify app of critical setting changes
        if (this.callbacks.onSettingsChanged) {
            this.callbacks.onSettingsChanged(this.connectionData);
        }
    }

    downloadLogs() {
        sendToBackground({ action: 'GET_LOGS' });
    }
    
    saveLogFile(logs) {
        if (!logs || logs.length === 0) {
            alert("No logs to download.");
            return;
        }
        
        const text = logs.map(l => {
            const time = new Date(l.timestamp).toISOString();
            const dataStr = l.data ? ` | Data: ${JSON.stringify(l.data)}` : '';
            return `[${time}] [${l.level}] [${l.context}] ${l.message}${dataStr}`;
        }).join('\n');
        
        // Send to parent to handle download (Sandbox restriction workaround)
        window.parent.postMessage({
            action: 'DOWNLOAD_LOGS',
            payload: {
                text: text,
                filename: `gemini-nexus-logs-${Date.now()}.txt`
            }
        }, '*');
    }

    // --- State Updates (From View or Storage) ---

    setTheme(theme) {
        this.view.applyVisualTheme(theme);
        saveThemeToStorage(theme);
    }
    
    updateTheme(theme) {
        this.view.setThemeValue(theme);
    }
    
    setLanguage(newLang) {
        setLanguagePreference(newLang);
        saveLanguageToStorage(newLang);
        document.dispatchEvent(new CustomEvent('gemini-language-changed'));
    }
    
    updateLanguage(lang) {
        setLanguagePreference(lang);
        this.view.setLanguageValue(lang);
        document.dispatchEvent(new CustomEvent('gemini-language-changed'));
    }

    updateImageTools(enabled) {
        this.imageToolsEnabled = enabled;
        this.view.setToggles(this.imageToolsEnabled, this.pageContextImagesEnabled);
    }

    updatePageContextImages(enabled) {
        this.pageContextImagesEnabled = enabled === true;
        this.view.setToggles(this.imageToolsEnabled, this.pageContextImagesEnabled);
    }
    
    updateConnectionSettings(settings) {
        this.connectionData = { ...this.connectionData, ...settings };
        
        // Legacy compat: If provider missing but useOfficialApi is true, set to official
        if (!this.connectionData.provider) {
            if (settings.useOfficialApi) this.connectionData.provider = 'official';
            else this.connectionData.provider = 'web';
        }
        
        this.view.setConnectionSettings(this.connectionData);
    }
    
    updateSidebarBehavior(behavior) {
        this.view.setSidebarBehavior(behavior);
    }

    updateAccountIndices(indicesString) {
        this.accountIndices = indicesString || "0";
        this.view.setAccountIndices(this.accountIndices);
    }

    async fetchGithubData() {
        if (this.view.hasFetchedStars()) return; 

        try {
            const [starRes, releaseRes] = await Promise.all([
                fetch('https://api.github.com/repos/xwysyy/gemini-nexus'),
                fetch('https://api.github.com/repos/xwysyy/gemini-nexus/releases/latest')
            ]);

            if (starRes.ok) {
                const data = await starRes.json();
                this.view.displayStars(data.stargazers_count);
            }

            if (releaseRes.ok) {
                const data = await releaseRes.json();
                const latestVersion = data.tag_name; // e.g. "v4.2.0"
                const currentVersion = this.view.getCurrentVersion() || "v0.0.0";
                
                const isNewer = this.compareVersions(latestVersion, currentVersion) > 0;
                this.view.displayUpdateStatus(latestVersion, currentVersion, isNewer);
            }
        } catch (e) {
            console.warn("GitHub fetch failed", e);
            this.view.displayStars(null);
        }
    }

    compareVersions(v1, v2) {
        // Remove 'v' prefix
        const clean1 = v1.replace(/^v/, '');
        const clean2 = v2.replace(/^v/, '');
        
        const parts1 = clean1.split('.').map(Number);
        const parts2 = clean2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const num1 = parts1[i] || 0;
            const num2 = parts2[i] || 0;
            if (num1 > num2) return 1;
            if (num1 < num2) return -1;
        }
        return 0;
    }
}
