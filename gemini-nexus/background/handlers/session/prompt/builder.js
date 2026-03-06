
// background/handlers/session/prompt/builder.js
import { getActiveTabContent } from '../utils.js';

export class PromptBuilder {
    async build(request) {
        let systemPreamble = "";

        if (request.includePageContext) {
            const pageContent = await getActiveTabContent();
            
            if (pageContent) {
                systemPreamble += `Webpage Context:\n\`\`\`text\n${pageContent}\n\`\`\`\n\n`;
            }
        }

        // Return separated components
        return {
            systemInstruction: systemPreamble,
            userPrompt: request.text
        };
    }
}
