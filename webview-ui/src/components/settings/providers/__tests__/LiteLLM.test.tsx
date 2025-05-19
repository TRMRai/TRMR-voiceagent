import React from "react"
import { render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import i18next from "i18next"

import { LiteLLM, LiteLLMProps } from "../LiteLLM"
import { vscode } from "@/utils/vscode"

// Minimal i18n instance for testing
const testI18n = i18next.createInstance()
testI18n.init({
	fallbackLng: "en",
	debug: false,
	resources: {
		en: {
			translation: {
				"settings:providers.refreshModels.label": "Refresh Models",
				"settings:providers.refreshModels.missingConfig": "API key or base URL missing.",
			},
		},
	},
	interpolation: {
		escapeValue: false, // Not needed for React
	},
})

// Mock vscode API
jest.mock("@/utils/vscode", () => ({
	vscode: {
		postMessage: jest.fn(),
	},
}))

// Mock VSCodeTextField
jest.mock("@vscode/webview-ui-toolkit/react", () => ({
	VSCodeTextField: ({ children, value, onInput, type }: any) => (
		<div>
			{children}
			<input
				type={type || "text"}
				value={value}
				onChange={(e) => onInput && onInput({ target: { value: e.target.value } })}
			/>
		</div>
	),
}))

// Mock ModelPicker
jest.mock("../../ModelPicker", () => ({
	ModelPicker: () => <div data-testid="model-picker-mock">ModelPicker</div>,
}))

const mockT = jest.fn((key) => key) // Simple t mock

jest.mock("@/i18n/TranslationContext", () => ({
	useAppTranslation: () => ({
		t: mockT,
	}),
}))

const defaultProps: LiteLLMProps = {
	apiConfiguration: { litellmApiKey: "", litellmBaseUrl: "" },
	setApiConfigurationField: jest.fn(),
	routerModels: {
		litellm: {},
		glama: {},
		openrouter: {},
		unbound: {},
		requesty: {},
	},
}

const renderLiteLLM = (props?: Partial<LiteLLMProps>) => {
	return render(
		<I18nextProvider i18n={testI18n}>
			<LiteLLM {...defaultProps} {...props} />
		</I18nextProvider>,
	)
}

describe("LiteLLM Component", () => {
	beforeEach(() => {
		jest.clearAllMocks()
		// Reset the ref module-level if needed, but usually refs are instance-based.
		// For this test, we rely on fresh mounts giving fresh refs.
	})

	it("does not attempt initial model refresh if API key is missing", () => {
		renderLiteLLM({
			apiConfiguration: {
				...defaultProps.apiConfiguration,
				litellmBaseUrl: "http://localhost:4000",
				litellmApiKey: "",
			},
		})
		expect(vscode.postMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "requestProviderModels" }))
	})

	it("does not attempt initial model refresh if base URL is missing", () => {
		renderLiteLLM({
			apiConfiguration: { ...defaultProps.apiConfiguration, litellmApiKey: "test-key", litellmBaseUrl: "" },
		})
		expect(vscode.postMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "requestProviderModels" }))
	})

	it("attempts initial model refresh once if API key and base URL are present on mount", () => {
		renderLiteLLM({
			apiConfiguration: {
				...defaultProps.apiConfiguration,
				litellmApiKey: "test-key",
				litellmBaseUrl: "http://localhost:4000",
			},
		})
		expect(vscode.postMessage).toHaveBeenCalledTimes(1)
		expect(vscode.postMessage).toHaveBeenCalledWith({
			type: "requestProviderModels",
			payload: {
				provider: "litellm",
				apiKey: "test-key",
				baseUrl: "http://localhost:4000",
			},
		})
	})

	it("does not re-attempt initial refresh if props change but refresh was already done", () => {
		const { rerender } = renderLiteLLM({
			apiConfiguration: {
				...defaultProps.apiConfiguration,
				litellmApiKey: "test-key",
				litellmBaseUrl: "http://localhost:4000",
			},
		})
		expect(vscode.postMessage).toHaveBeenCalledTimes(1) // Initial call

		// Re-render with different routerModels (a prop that might change)
		rerender(
			<I18nextProvider i18n={testI18n}>
				<LiteLLM
					{...defaultProps}
					apiConfiguration={{
						...defaultProps.apiConfiguration,
						litellmApiKey: "test-key", // Same key
						litellmBaseUrl: "http://localhost:4000", // Same URL
					}}
					routerModels={{
						litellm: { "new-model": { contextWindow: 4096, supportsPromptCache: false } },
						glama: {},
						openrouter: {},
						unbound: {},
						requesty: {},
					}}
				/>
			</I18nextProvider>,
		)
		// Should still only be 1 call from the initial refresh
		expect(vscode.postMessage).toHaveBeenCalledTimes(1)
	})

	it("manual refresh button is disabled if API key is missing", () => {
		renderLiteLLM({
			apiConfiguration: {
				...defaultProps.apiConfiguration,
				litellmBaseUrl: "http://localhost:4000",
				litellmApiKey: "",
			},
		})
		const refreshButton = screen.getByText("settings:providers.refreshModels.label").closest("button")
		expect(refreshButton).toBeDisabled()
	})

	it("manual refresh button is disabled if base URL is missing", () => {
		renderLiteLLM({
			apiConfiguration: { ...defaultProps.apiConfiguration, litellmApiKey: "test-key", litellmBaseUrl: "" },
		})
		const refreshButton = screen.getByText("settings:providers.refreshModels.label").closest("button")
		expect(refreshButton).toBeDisabled()
	})
})
