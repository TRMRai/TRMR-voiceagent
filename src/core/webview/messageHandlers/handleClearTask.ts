import { ClineProvider } from "../ClineProvider"
import { WebviewMessage } from "../../../shared/WebviewMessage"
import { t } from "../../../i18n"

export async function handleClearTask(
	provider: ClineProvider,
	_message: WebviewMessage & { type: "clearTask" },
): Promise<void> {
	// clear task resets the current session and allows for a new task to be started, if this session is a subtask - it allows the parent task to be resumed
	await provider.finishSubTask(t("common:tasks.canceled"))
	await provider.postStateToWebview()
}
