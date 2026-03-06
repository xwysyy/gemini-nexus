
// background/handlers/session/prompt/builder.js
import { getActiveTabContext } from '../utils.js';

export class PromptBuilder {
    constructor(imageHandler) {
        this.imageHandler = imageHandler;
    }

    async build(request) {
        let systemPreamble = "";
        let contextFiles = [];

        if (request.includePageContext) {
            const pageContext = await getActiveTabContext({
                includeImages: request.includePageImagesContext === true,
                maxImages: 10,
                maxCandidates: 30
            }, this.imageHandler);
            
            if (pageContext?.url) {
                systemPreamble += `[Current Page URL]: ${pageContext.url}\n`;
            }

            if (pageContext?.title) {
                systemPreamble += `[Current Page Title]: ${pageContext.title}\n`;
            }

            if (pageContext?.text) {
                systemPreamble += `\nWebpage Context:\n\`\`\`text\n${pageContext.text}\n\`\`\`\n\n`;
            }

            if (Array.isArray(pageContext?.images) && pageContext.images.length > 0) {
                contextFiles = pageContext.images;
                systemPreamble += `[Attached Page Images]: ${pageContext.images.length} compressed image(s) from the current webpage are attached as additional context.\n\n`;
            }
        }

        // Return separated components
        return {
            systemInstruction: systemPreamble,
            userPrompt: request.text,
            contextFiles,
            contextImageCount: contextFiles.length
        };
    }
}
