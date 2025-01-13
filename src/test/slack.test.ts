import { setSlackEnabled, setWebhookUrl, sendSlackMessage, notifyTaskComplete, notifyUserInputNeeded, notifyTaskFailed, notifyCommandExecution } from '../services/slack'

describe('Slack Notifications', () => {
    let mockFetch: jest.Mock

    beforeEach(() => {
        mockFetch = jest.fn()
        global.fetch = mockFetch
        setWebhookUrl('https://hooks.slack.com/services/test')
        setSlackEnabled(true)
    })

    afterEach(() => {
        jest.resetAllMocks()
        setSlackEnabled(false)
        setWebhookUrl('')
    })

    it('should send task completion notification', async () => {
        await notifyTaskComplete('Task completed successfully')
        expect(mockFetch).toHaveBeenCalledWith(
            'https://hooks.slack.com/services/test',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: '✅ Task Complete: Task completed successfully' })
            })
        )
    })

    it('should send user input needed notification', async () => {
        await notifyUserInputNeeded('What is your preference?')
        expect(mockFetch).toHaveBeenCalledWith(
            'https://hooks.slack.com/services/test',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: '❓ User Input Received: What is your preference?' })
            })
        )
    })

    it('should send task failed notification', async () => {
        await notifyTaskFailed('Error occurred')
        expect(mockFetch).toHaveBeenCalledWith(
            'https://hooks.slack.com/services/test',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: '❌ Task Failed: Error occurred' })
            })
        )
    })

    it('should not send notifications when disabled', async () => {
        setSlackEnabled(false)

        await notifyTaskComplete('Task completed')
        await notifyUserInputNeeded('Input needed')
        await notifyTaskFailed('Task failed')

        expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle fetch errors gracefully', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'))
        
        // These should not throw errors
        await expect(notifyTaskComplete('Task completed')).resolves.not.toThrow()
        await expect(notifyUserInputNeeded('Input needed')).resolves.not.toThrow()
        await expect(notifyTaskFailed('Task failed')).resolves.not.toThrow()
    })

    it('should not send message when webhook URL is not set', async () => {
        setWebhookUrl('')
        await sendSlackMessage('Test message')
        expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should send command execution notification', async () => {
        await notifyCommandExecution('npm install')
        expect(mockFetch).toHaveBeenCalledWith(
            'https://hooks.slack.com/services/test',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: '🔧 Command Requested: npm install' })
            })
        )
    })
})