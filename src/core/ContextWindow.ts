import { Anthropic } from "@anthropic-ai/sdk"
import { ModelInfo } from "../shared/api"

// Rough estimate: 1 token ≈ 4 characters (this varies by model and content but works as a conservative estimate)
export const CHARS_PER_TOKEN = 4

export class ContextWindow {
    private modelInfo: ModelInfo
    private systemPromptSize: number

    constructor(modelInfo: ModelInfo, systemPromptSize: number) {
        this.modelInfo = modelInfo
        this.systemPromptSize = systemPromptSize
    }

    /**
     * Calculates the estimated token size of content blocks
     */
    calculateMessageSize(content: Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam | Anthropic.ToolUseBlockParam | Anthropic.ToolResultBlockParam>): number {
        return content.reduce<number>((total, block) => {
            switch (block.type) {
                case "text": {
                    // Rough estimate: 1 token ≈ 4 characters
                    const textBlock = block as Anthropic.TextBlockParam
                    return total + Math.ceil(textBlock.text.length / CHARS_PER_TOKEN)
                }
                case "tool_use": {
                    // Tool use blocks include name and parameters
                    const toolBlock = block as Anthropic.ToolUseBlockParam
                    const paramSize = Object.entries(toolBlock.input || {}).reduce<number>((sum, [key, value]) => 
                        sum + Math.ceil((key + String(value)).length / CHARS_PER_TOKEN), 0)
                    return total + Math.ceil(toolBlock.name.length / CHARS_PER_TOKEN) + paramSize + 100 // Extra tokens for structure
                }
                case "tool_result": {
                    // Tool results can be string or array of blocks
                    const toolBlock = block as Anthropic.ToolResultBlockParam
                    if (typeof toolBlock.content === "string") {
                        return total + Math.ceil(toolBlock.content.length / CHARS_PER_TOKEN)
                    }
                    if (Array.isArray(toolBlock.content)) {
                        return total + toolBlock.content.reduce<number>((sum, contentBlock) => {
                            if (contentBlock.type === "text") {
                                return sum + Math.ceil(contentBlock.text.length / CHARS_PER_TOKEN)
                            }
                            return sum + 500 // Base size for non-text content blocks
                        }, 0)
                    }
                    return total + 500 // Default size for unknown content
                }
                case "image":
                default:
                    // Conservative estimate for images and unknown types
                    return total + 500
            }
        }, 0)
    }

    /**
     * Gets the maximum allowed message size based on context window and other constraints
     */
    private getMaxAllowedSize(): number {
        const contextWindow = this.modelInfo.contextWindow || 128_000
        const responseBuffer = this.modelInfo.maxTokens ?? 4000
        return contextWindow - this.systemPromptSize - responseBuffer
    }

    /**
     * Checks if a message would exceed the context window limits
     * Returns an error message if the message is too large, undefined otherwise
     */
    validateMessageSize(messageSize: number): string | undefined {
        const maxAllowedSize = this.getMaxAllowedSize()

        if (messageSize >= maxAllowedSize) {
            return `The message is too large for the model's available space (${messageSize} estimated tokens > ${maxAllowedSize} tokens, where ${this.systemPromptSize} tokens are used by system prompt and ${this.modelInfo.maxTokens ?? 4000} tokens reserved for response). Please hit Cancel and try breaking up the task into smaller steps.`
        }

        return undefined
    }

    /**
     * Checks if the conversation history size exceeds the context window
     * Returns true if truncation is needed
     */
    shouldTruncateHistory(messages: Array<Anthropic.MessageParam>): boolean {
        let totalSize = 0
        for (const message of messages) {
            if (Array.isArray(message.content)) {
                totalSize += this.calculateMessageSize(message.content)
            } else {
                totalSize += Math.ceil(message.content.length / CHARS_PER_TOKEN)
            }
        }
        
        const maxAllowedSize = this.getMaxAllowedSize()
        
        // Truncate when total size exceeds available space
        return totalSize >= maxAllowedSize
    }
}