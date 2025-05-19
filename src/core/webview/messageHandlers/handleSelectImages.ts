import { ClineProvider } from "../ClineProvider"
import { WebviewMessage } from "../../../shared/WebviewMessage"
import { selectImages } from "../../../integrations/misc/process-images"

export async function handleSelectImages(
	provider: ClineProvider,
	_message: WebviewMessage & { type: "selectImages" },
): Promise<void> {
	const images = await selectImages()
	await provider.postMessageToWebview({ type: "selectedImages", images })
}
