import { ClineProvider } from "../ClineProvider"
import { WebviewMessage } from "../../../shared/WebviewMessage"

export async function handleCustomInstructions(
	provider: ClineProvider,
	message: WebviewMessage & { type: "customInstructions" },
): Promise<void> {
	await provider.updateCustomInstructions(message.text)
}
