import { ClineProvider } from "../ClineProvider"
import { WebviewMessage } from "../../../shared/WebviewMessage"
import { GetModelsOptions, ModelRecord, RouterName } from "../../../shared/api"
import { flushModels, getModels } from "../../../api/providers/fetchers/modelCache"

export async function handleRequestProviderModels(
	provider: ClineProvider,
	message: WebviewMessage & { type: "requestProviderModels" },
): Promise<void> {
	const optionsFromPayload = message.payload as any // Check payload structure first

	if (
		typeof optionsFromPayload !== "object" ||
		optionsFromPayload === null ||
		typeof optionsFromPayload.provider !== "string" ||
		!optionsFromPayload.provider
	) {
		const providerNameForError =
			typeof optionsFromPayload?.provider === "string" && optionsFromPayload.provider
				? (optionsFromPayload.provider as RouterName)
				: ("unknown" as RouterName)

		provider.postMessageToWebview({
			type: "providerModelsResponse",
			payload: {
				provider: providerNameForError,
				error: "Invalid payload for requestProviderModels: payload must be an object with a valid 'provider' string property.",
			},
		})
		return
	}

	const options = optionsFromPayload as GetModelsOptions // Now cast to GetModelsOptions

	let models: ModelRecord = {}
	let error: string | undefined

	try {
		await flushModels(options.provider)
		models = await getModels(options)
	} catch (e: any) {
		error =
			e.message ||
			`Failed to fetch models in webviewMessageHandler requestProviderModels for ${options.provider}. Check console for details.`
		models = {}
	}

	provider.postMessageToWebview({
		type: "providerModelsResponse",
		payload: { provider: options.provider, models, error },
	})
}
