import { ClineProvider } from "../ClineProvider"
import { WebviewMessage } from "../../../shared/WebviewMessage"

export async function handleNewTask(
	provider: ClineProvider,
	message: WebviewMessage & { type: "newTask" },
): Promise<void> {
	// Initializing new instance of Cline will make sure that any
	// agentically running promises in old instance don't affect our new
	// task. This essentially creates a fresh slate for the new task.
	await provider.initClineWithTask(message.text, message.images)
}
