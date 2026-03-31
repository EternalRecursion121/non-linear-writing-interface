export type LayoutMode = 'side-by-side' | 'planning-full' | 'writing-full' | 'dag-full';
export type RightPaneMode = 'writing' | 'dag';

export interface AutosaveState {
	status: 'saved' | 'saving' | 'unsaved';
	lastSaved: number | null;
}

export type CommandId =
	| 'new-project'
	| 'toggle-file-browser'
	| 'show-side-by-side'
	| 'show-planning-full'
	| 'show-writing-full'
	| 'show-dag-full'
	| 'open-command-palette'
	| 'toggle-focus-mode'
	| 'toggle-shortcuts'
	| 'open-compile'
	| 'undo'
	| 'redo'
	| 'next-node'
	| 'previous-node'
	| 'edit-node'
	| 'deselect'
	| 'delete-selected-node'
	| 'branch-selected-node'
	| 'parallelize-selected-node';

export interface KeyboardShortcut {
	key: string;
	modifiers: ('ctrl' | 'shift' | 'alt' | 'meta')[];
	commandId: CommandId;
	description: string;
	category: 'navigation' | 'editing' | 'view' | 'project';
}

export interface CommandDefinition {
	id: CommandId;
	label: string;
	description?: string;
	category: KeyboardShortcut['category'];
	shortcut?: string;
	run: () => void;
	isEnabled?: () => boolean;
}
