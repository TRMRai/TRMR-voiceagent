import { ApiConfiguration } from "../shared/api"
import { buildApiHandler } from "../api"
import { SingleCompletionHandler } from "../api"

/**
 * Enhances a prompt using the API without creating a full Cline instance or task history.
 * This is a lightweight alternative that only uses the API's completion functionality.
 */
export async function enhancePrompt(apiConfiguration: ApiConfiguration, promptText: string): Promise<string> {
    if (!promptText) {
        throw new Error("No prompt text provided")
    }
    // Create a minimal handler that only has completePrompt capability
    const handler: SingleCompletionHandler = buildApiHandler(apiConfiguration)
    const prompt = `Generate an enhanced version of this prompt (reply with only the enhanced prompt, no other text or bullet points): ${promptText}`
    return handler.completePrompt(prompt)
}