
// background/handlers/session/prompt_handler.js
import { appendAiMessage } from '../../managers/history_manager.js';
import { PromptBuilder } from './prompt/builder.js';

export class PromptHandler {
    constructor(sessionManager, imageHandler) {
        this.sessionManager = sessionManager;
        this.builder = new PromptBuilder(imageHandler);
        this.isCancelled = false;
    }

    cancel() {
        this.isCancelled = true;
    }

    handle(request, sendResponse) {
        this.isCancelled = false;

        (async () => {
            const onUpdate = (partialText, partialThoughts) => {
                // Catch errors if receiver (UI) is closed/unavailable
                chrome.runtime.sendMessage({
                    action: "GEMINI_STREAM_UPDATE",
                    text: partialText,
                    thoughts: partialThoughts
                }).catch(() => {}); 
            };

            try {
                // 1. Build Initial Prompt (with Context separated)
                const buildResult = await this.builder.build(request);
                const mergedFiles = [
                    ...(Array.isArray(request.files) ? request.files : []),
                    ...(Array.isArray(buildResult.contextFiles) ? buildResult.contextFiles : [])
                ];

                const result = await this.sessionManager.handleSendPrompt({
                    ...request,
                    text: buildResult.userPrompt,
                    systemInstruction: buildResult.systemInstruction,
                    files: mergedFiles
                }, onUpdate);

                if (this.isCancelled) return;

                if (!result || result.status !== 'success') {
                    if (result) chrome.runtime.sendMessage(result).catch(() => {});
                    return;
                }

                if (request.sessionId) {
                    await appendAiMessage(request.sessionId, result);
                }

                chrome.runtime.sendMessage(result).catch(() => {});

            } catch (e) {
                console.error("Prompt loop error:", e);
                chrome.runtime.sendMessage({
                    action: "GEMINI_REPLY",
                    text: "Error: " + e.message,
                    status: "error"
                }).catch(() => {});
            } finally {
                sendResponse({ status: "completed" });
            }
        })();
        return true;
    }
}
