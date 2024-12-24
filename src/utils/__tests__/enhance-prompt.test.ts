import { enhancePrompt } from '../enhance-prompt'
import { buildApiHandler } from '../../api'
import { ApiConfiguration } from '../../shared/api'

// Mock the buildApiHandler function
jest.mock('../../api', () => ({
    buildApiHandler: jest.fn()
}))

describe('enhancePrompt', () => {
    const mockApiConfig: ApiConfiguration = {
        apiProvider: 'anthropic',
        apiKey: 'test-key',
        apiModelId: 'claude-3-5-sonnet-20241022'
    }

    const mockHandler = {
        completePrompt: jest.fn()
    }

    beforeEach(() => {
        jest.clearAllMocks()
        ;(buildApiHandler as jest.Mock).mockReturnValue(mockHandler)
    })

    it('should enhance a valid prompt', async () => {
        const inputPrompt = 'Write a function to sort an array'
        const enhancedPrompt = 'Write a TypeScript function that implements an efficient sorting algorithm for a generic array, including error handling and type safety'
        
        mockHandler.completePrompt.mockResolvedValue(enhancedPrompt)

        const result = await enhancePrompt(mockApiConfig, inputPrompt)

        expect(result).toBe(enhancedPrompt)
        expect(buildApiHandler).toHaveBeenCalledWith(mockApiConfig)
        expect(mockHandler.completePrompt).toHaveBeenCalledWith(
            expect.stringContaining(inputPrompt)
        )
    })

    it('should throw error when no prompt text is provided', async () => {
        await expect(enhancePrompt(mockApiConfig, '')).rejects.toThrow('No prompt text provided')
        expect(mockHandler.completePrompt).not.toHaveBeenCalled()
    })

    it('should pass through API errors', async () => {
        const inputPrompt = 'Test prompt'
        mockHandler.completePrompt.mockRejectedValue('API error')

        await expect(enhancePrompt(mockApiConfig, inputPrompt)).rejects.toBe('API error')
    })

    it('should pass the correct prompt format to the API', async () => {
        const inputPrompt = 'Test prompt'
        mockHandler.completePrompt.mockResolvedValue('Enhanced test prompt')
        
        await enhancePrompt(mockApiConfig, inputPrompt)

        expect(mockHandler.completePrompt).toHaveBeenCalledWith(
            'Generate an enhanced version of this prompt (reply with only the enhanced prompt, no other text or bullet points): Test prompt'
        )
    })
})