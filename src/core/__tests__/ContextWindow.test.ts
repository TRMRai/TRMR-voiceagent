import { ContextWindow } from '../ContextWindow'
import { ModelInfo } from '../../shared/api'
import { Anthropic } from '@anthropic-ai/sdk'

describe('ContextWindow', () => {
    let contextWindow: ContextWindow
    let mockModelInfo: ModelInfo

    beforeEach(() => {
        mockModelInfo = {
            contextWindow: 128000,
            maxTokens: 4000,
            supportsComputerUse: true,
            supportsPromptCache: false,
            supportsImages: true,
            inputPrice: 0,
            outputPrice: 0,
        }

        // System prompt is 2000 tokens
        const systemPromptSize = 2000
        contextWindow = new ContextWindow(mockModelInfo, systemPromptSize)
    })

    describe('Message Size Calculation', () => {
        it('should correctly estimate token size for text content', () => {
            const content: Anthropic.TextBlockParam[] = [{
                type: 'text',
                text: 'a'.repeat(4000) // Should be roughly 1000 tokens
            }]

            const size = contextWindow.calculateMessageSize(content)
            expect(size).toBe(1000)
        })

        it('should handle non-text content blocks appropriately', () => {
            const content: Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam> = [
                {
                    type: 'text',
                    text: 'Regular text' // 11 chars ≈ 3 tokens
                },
                {
                    type: 'image',
                    source: {
                        type: 'base64',
                        data: 'test-image-data',
                        media_type: 'image/jpeg'
                    }
                }
            ]

            const size = contextWindow.calculateMessageSize(content)
            // 3 tokens for text + 500 tokens base size for image
            expect(size).toBe(503)
        })
    })

    describe('Message Size Validation', () => {
        it('should accept messages within context window limits', () => {
            const content: Anthropic.TextBlockParam[] = [{
                type: 'text',
                text: 'a'.repeat(4000) // Should be roughly 1000 tokens
            }]

            const size = contextWindow.calculateMessageSize(content)
            const error = contextWindow.validateMessageSize(size)
            expect(error).toBeUndefined()
        })

        it('should reject messages that exceed context window limits', () => {
            // Available space = context window (128000) - system prompt (2000) - response buffer (4000) = 122000
            // So a message of 123000 tokens should be rejected
            const size = 123000
            const error = contextWindow.validateMessageSize(size)
            expect(error).toBeDefined()
            expect(error).toContain('too large')
            expect(error).toContain('system prompt')
            expect(error).toContain('reserved for response')
        })
    })

    describe('History Truncation', () => {
        it('should recommend truncation when message size exceeds available space', () => {
            // Available space = context window (128000) - system prompt (2000) - response buffer (4000) = 122000
            const messages: Anthropic.MessageParam[] = [
                { role: "user", content: 'a'.repeat(400000) }, // ~100k tokens
                { role: "assistant", content: 'b'.repeat(100000) } // ~25k tokens
            ]
            const shouldTruncate = contextWindow.shouldTruncateHistory(messages)
            expect(shouldTruncate).toBe(true)
        })

        it('should not recommend truncation for normal message sizes', () => {
            const messages: Anthropic.MessageParam[] = [
                { role: "user", content: 'a'.repeat(4000) }, // ~1k tokens
                { role: "assistant", content: 'b'.repeat(4000) } // ~1k tokens
            ]
            const shouldTruncate = contextWindow.shouldTruncateHistory(messages)
            expect(shouldTruncate).toBe(false)
        })

        it('should handle array content in messages', () => {
            const messages: Anthropic.MessageParam[] = [
                {
                    role: "user",
                    content: [
                        { type: "text", text: 'a'.repeat(400000) } as Anthropic.TextBlockParam, // ~100k tokens
                        { type: "text", text: 'b'.repeat(100000) } as Anthropic.TextBlockParam  // ~25k tokens
                    ]
                }
            ]
            const shouldTruncate = contextWindow.shouldTruncateHistory(messages)
            expect(shouldTruncate).toBe(true)
        })

        it('should handle empty history', () => {
            const shouldTruncate = contextWindow.shouldTruncateHistory([])
            expect(shouldTruncate).toBe(false)
        })
    })

    describe('Different Model Configurations', () => {
        it('should handle models with smaller context windows', () => {
            const smallModelInfo = {
                ...mockModelInfo,
                contextWindow: 8000,
                maxTokens: 1000
            }
            const smallContextWindow = new ContextWindow(smallModelInfo, 2000)

            // Available space = context window (8000) - system prompt (2000) - response buffer (1000) = 5000
            // So a message of 6000 tokens should be rejected
            const size = 6000
            const error = smallContextWindow.validateMessageSize(size)
            expect(error).toBeDefined()
            expect(error).toContain('too large')
        })

        it('should handle models with larger response buffers', () => {
            const largeBufferModelInfo = {
                ...mockModelInfo,
                maxTokens: 8000
            }
            const largeBufferContextWindow = new ContextWindow(largeBufferModelInfo, 2000)

            // Available space = context window (128000) - system prompt (2000) - response buffer (8000) = 118000
            // So a message of 119000 tokens should be rejected
            const size = 119000
            const error = largeBufferContextWindow.validateMessageSize(size)
            expect(error).toBeDefined()
            expect(error).toContain('reserved for response')
        })
    })
})