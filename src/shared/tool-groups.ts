// Tool name types for type safety
export type ToolName =
	| "execute_command"
	| "read_file"
	| "write_to_file"
	| "apply_diff"
	| "insert_code_block"
	| "search_and_replace"
	| "search_files"
	| "list_files"
	| "list_code_definition_names"
	| "browser_action"
	| "use_mcp_tool"
	| "access_mcp_resource"
	| "ask_followup_question"
	| "attempt_completion"

// Define available tool groups
export const TOOL_GROUPS: Record<string, ToolGroupValues> = {
	read: ["read_file", "search_files", "list_files", "list_code_definition_names"],
	edit: ["write_to_file", "apply_diff", "insert_code_block", "search_and_replace"],
	browser: ["browser_action"],
	command: ["execute_command"],
	mcp: ["use_mcp_tool", "access_mcp_resource"],
}

export type ToolGroup = keyof typeof TOOL_GROUPS

// Define tool group values
export type ToolGroupValues = readonly ToolGroup[]

// Tools that are always available to all modes
export const ALWAYS_AVAILABLE_TOOLS = ["ask_followup_question", "attempt_completion"] as const

// Tool helper functions
export function getToolName(toolConfig: string | readonly [ToolName, ...any[]]): ToolName {
	return typeof toolConfig === "string" ? (toolConfig as ToolName) : toolConfig[0]
}

export function getToolOptions(toolConfig: string | readonly [ToolName, ...any[]]): any {
	return typeof toolConfig === "string" ? undefined : toolConfig[1]
}

// Display names for groups in UI
export const GROUP_DISPLAY_NAMES: Record<ToolGroup, string> = {
	read: "Read Files",
	edit: "Edit Files",
	browser: "Use Browser",
	command: "Run Commands",
	mcp: "Use MCP",
}
