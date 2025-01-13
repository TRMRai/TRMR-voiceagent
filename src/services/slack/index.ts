import * as vscode from 'vscode'

let isSlackEnabled = false
let webhookUrl = ''

/**
 * Set slack notification configuration
 * @param enabled boolean
 */
export const setSlackEnabled = (enabled: boolean): void => {
  isSlackEnabled = enabled
}

/**
 * Set slack webhook URL
 * @param url string
 */
export const setWebhookUrl = (url: string): void => {
  webhookUrl = url
}

/**
 * Send a slack message
 * @param text string
 * @return Promise<void>
 */
export const sendSlackMessage = async (text: string): Promise<void> => {
  try {
    if (!isSlackEnabled) {
      return
    }

    if (!webhookUrl) {
      return
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    })

    if (!response.ok) {
      throw new Error(`Failed to send Slack message: ${response.statusText} (${response.status})`)
    }
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to send Slack notification: ${error.message}`)
  }
}

/**
 * Notify task completion via Slack
 * @param taskDescription string
 */
export const notifyTaskComplete = async (taskDescription: string): Promise<void> => {
  await sendSlackMessage(`✅ Task Complete: ${taskDescription}`)
}

/**
 * Notify user input needed via Slack
 * @param question string
 */
export const notifyUserInputNeeded = async (question: string): Promise<void> => {
  await sendSlackMessage(`❓ User Input Received: ${question}`)
}

/**
 * Notify task failure via Slack
 * @param error string
 */
export const notifyTaskFailed = async (error: string): Promise<void> => {
  await sendSlackMessage(`❌ Task Failed: ${error}`)
}

/**
 * Notify command execution request via Slack
 * @param command string
 */
export const notifyCommandExecution = async (command: string): Promise<void> => {
  await sendSlackMessage(`🔧 Command Requested: ${command}`)
}