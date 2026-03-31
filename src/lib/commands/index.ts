import { projectStore } from '$lib/stores/project.svelte';
import { uiStore } from '$lib/stores/ui.svelte';
import type { CommandDefinition, CommandId, KeyboardShortcut } from '$lib/types/ui';

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
	{
		key: 'Enter',
		modifiers: ['ctrl'],
		commandId: 'branch-selected-node',
		description: 'Branch at cursor',
		category: 'editing'
	},
	{
		key: '/',
		modifiers: ['ctrl'],
		commandId: 'parallelize-selected-node',
		description: 'Parallelize at selection',
		category: 'editing'
	},
	{
		key: 'b',
		modifiers: ['ctrl'],
		commandId: 'toggle-file-browser',
		description: 'Toggle file browser',
		category: 'view'
	},
	{
		key: '0',
		modifiers: ['ctrl'],
		commandId: 'show-side-by-side',
		description: 'Side-by-side layout',
		category: 'view'
	},
	{
		key: '1',
		modifiers: ['ctrl'],
		commandId: 'show-planning-full',
		description: 'Full-screen planning pane',
		category: 'view'
	},
	{
		key: '2',
		modifiers: ['ctrl'],
		commandId: 'show-writing-full',
		description: 'Full-screen writing pane',
		category: 'view'
	},
	{
		key: '3',
		modifiers: ['ctrl'],
		commandId: 'show-dag-full',
		description: 'Full-screen DAG view',
		category: 'view'
	},
	{
		key: 'e',
		modifiers: ['ctrl'],
		commandId: 'open-compile',
		description: 'Compile story',
		category: 'project'
	},
	{
		key: 'z',
		modifiers: ['ctrl'],
		commandId: 'undo',
		description: 'Undo',
		category: 'editing'
	},
	{
		key: 'z',
		modifiers: ['ctrl', 'shift'],
		commandId: 'redo',
		description: 'Redo',
		category: 'editing'
	},
	{
		key: 'Tab',
		modifiers: [],
		commandId: 'next-node',
		description: 'Next node',
		category: 'navigation'
	},
	{
		key: 'Tab',
		modifiers: ['shift'],
		commandId: 'previous-node',
		description: 'Previous node',
		category: 'navigation'
	},
	{
		key: 'Enter',
		modifiers: [],
		commandId: 'edit-node',
		description: 'Edit selected node',
		category: 'navigation'
	},
	{
		key: 'Escape',
		modifiers: [],
		commandId: 'deselect',
		description: 'Deselect / close panel',
		category: 'navigation'
	},
	{
		key: 'Delete',
		modifiers: [],
		commandId: 'delete-selected-node',
		description: 'Delete selected node',
		category: 'editing'
	},
	{
		key: 'Backspace',
		modifiers: ['ctrl'],
		commandId: 'delete-selected-node',
		description: 'Delete selected node',
		category: 'editing'
	},
	{
		key: '?',
		modifiers: [],
		commandId: 'toggle-shortcuts',
		description: 'Show keyboard shortcuts',
		category: 'view'
	},
	{
		key: 'k',
		modifiers: ['ctrl'],
		commandId: 'open-command-palette',
		description: 'Open command palette',
		category: 'view'
	},
	{
		key: 'k',
		modifiers: ['meta'],
		commandId: 'open-command-palette',
		description: 'Open command palette',
		category: 'view'
	},
	{
		key: '.',
		modifiers: ['ctrl'],
		commandId: 'toggle-focus-mode',
		description: 'Toggle focus mode',
		category: 'view'
	},
	{
		key: '.',
		modifiers: ['meta'],
		commandId: 'toggle-focus-mode',
		description: 'Toggle focus mode',
		category: 'view'
	}
];

export function formatShortcut(shortcut: KeyboardShortcut): string {
	const parts: string[] = [];

	if (shortcut.modifiers.includes('ctrl')) parts.push('Ctrl');
	if (shortcut.modifiers.includes('meta')) parts.push('Cmd');
	if (shortcut.modifiers.includes('shift')) parts.push('Shift');
	if (shortcut.modifiers.includes('alt')) parts.push('Alt');

	parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase());
	return parts.join('+');
}

export function matchShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
	const keyMatch =
		event.key.toLowerCase() === shortcut.key.toLowerCase() || event.key === shortcut.key;
	if (!keyMatch) {
		return false;
	}

	const shiftMatch = shortcut.modifiers.includes('shift') === event.shiftKey;
	const altMatch = shortcut.modifiers.includes('alt') === event.altKey;
	if (!shiftMatch || !altMatch) {
		return false;
	}

	const ctrlMatch = shortcut.modifiers.includes('ctrl') === event.ctrlKey;
	const metaMatch = shortcut.modifiers.includes('meta') === event.metaKey;
	return ctrlMatch && metaMatch;
}

function confirmDeleteSelectedNode(): boolean {
	const selectedNode = projectStore.selectedNode;
	if (!selectedNode) {
		return false;
	}

	const children = projectStore.getChildren(selectedNode.id);
	const hasSubProject = !!selectedNode.subProject;

	if (children.length === 0 && !hasSubProject) {
		return true;
	}

	return confirm(
		`This node has ${children.length} child node(s)${hasSubProject ? ' and a sub-project' : ''}. Delete anyway?`
	);
}

export function executeCommand(commandId: CommandId): void {
	switch (commandId) {
		case 'new-project':
			if (confirm('Create a new project? This will clear current work.')) {
				projectStore.reset();
				uiStore.showToast('New project created', 'success');
			}
			break;
		case 'toggle-file-browser':
			uiStore.toggleNodeBrowser();
			break;
		case 'show-side-by-side':
			uiStore.showSideBySide();
			break;
		case 'show-planning-full':
			uiStore.showPlanningFull();
			break;
		case 'show-writing-full':
			uiStore.showWritingFull();
			break;
		case 'show-dag-full':
			uiStore.showDAGFull();
			break;
		case 'open-command-palette':
			uiStore.toggleCommandPalette();
			break;
		case 'toggle-focus-mode':
			uiStore.toggleFocusMode();
			break;
		case 'toggle-shortcuts':
			uiStore.toggleShortcutOverlay();
			break;
		case 'open-compile':
			uiStore.openCompileModal();
			break;
		case 'undo':
			projectStore.undo();
			break;
		case 'redo':
			projectStore.redo();
			break;
		case 'next-node': {
			const selectedNode = projectStore.selectedNode;
			if (!selectedNode) break;
			const nextNodeId = projectStore.getNextNodeId(selectedNode.id);
			if (nextNodeId) {
				projectStore.selectNode(nextNodeId);
			}
			break;
		}
		case 'previous-node': {
			const selectedNode = projectStore.selectedNode;
			if (!selectedNode) break;
			const previousNodeId = projectStore.getPreviousNodeId(selectedNode.id);
			if (previousNodeId) {
				projectStore.selectNode(previousNodeId);
			}
			break;
		}
		case 'edit-node':
			if (projectStore.selectedNode) {
				uiStore.setEditing(true);
				uiStore.setRightPaneMode('writing');
			}
			break;
		case 'deselect':
			if (uiStore.commandPaletteOpen) {
				uiStore.closeCommandPalette();
			} else if (uiStore.shortcutOverlayOpen) {
				uiStore.closeShortcutOverlay();
			} else if (uiStore.focusModeActive) {
				uiStore.exitFocusMode();
			} else {
				projectStore.selectNode(null);
				uiStore.setEditing(false);
			}
			break;
		case 'delete-selected-node':
			if (projectStore.selectedNode && confirmDeleteSelectedNode() && projectStore.deleteSelectedNode()) {
				uiStore.showToast('Node deleted', 'info');
			}
			break;
		case 'branch-selected-node':
		case 'parallelize-selected-node':
			break;
	}
}

export function getCommandDefinitions(): CommandDefinition[] {
	const shortcuts = new Map<string, string>();

	for (const shortcut of KEYBOARD_SHORTCUTS) {
		if (!shortcuts.has(shortcut.commandId)) {
			shortcuts.set(shortcut.commandId, formatShortcut(shortcut));
		}
	}

	return [
		{
			id: 'new-project',
			label: 'New Project',
			category: 'project',
			run: () => executeCommand('new-project')
		},
		{
			id: 'toggle-file-browser',
			label: 'Toggle File Browser',
			category: 'view',
			shortcut: shortcuts.get('toggle-file-browser'),
			run: () => executeCommand('toggle-file-browser')
		},
		{
			id: 'show-side-by-side',
			label: 'Show Split View',
			category: 'view',
			shortcut: shortcuts.get('show-side-by-side'),
			run: () => executeCommand('show-side-by-side')
		},
		{
			id: 'show-planning-full',
			label: 'Show Planning View',
			category: 'view',
			shortcut: shortcuts.get('show-planning-full'),
			run: () => executeCommand('show-planning-full')
		},
		{
			id: 'show-writing-full',
			label: 'Show Writing View',
			category: 'view',
			shortcut: shortcuts.get('show-writing-full'),
			run: () => executeCommand('show-writing-full')
		},
		{
			id: 'show-dag-full',
			label: 'Show DAG View',
			category: 'view',
			shortcut: shortcuts.get('show-dag-full'),
			run: () => executeCommand('show-dag-full')
		},
		{
			id: 'open-compile',
			label: 'Compile Story',
			category: 'project',
			shortcut: shortcuts.get('open-compile'),
			run: () => executeCommand('open-compile')
		},
		{
			id: 'undo',
			label: 'Undo',
			category: 'editing',
			shortcut: shortcuts.get('undo'),
			run: () => executeCommand('undo'),
			isEnabled: () => projectStore.canUndo
		},
		{
			id: 'redo',
			label: 'Redo',
			category: 'editing',
			shortcut: shortcuts.get('redo'),
			run: () => executeCommand('redo'),
			isEnabled: () => projectStore.canRedo
		},
		{
			id: 'toggle-shortcuts',
			label: 'Show Keyboard Shortcuts',
			category: 'view',
			shortcut: shortcuts.get('toggle-shortcuts'),
			run: () => executeCommand('toggle-shortcuts')
		}
	];
}

export function createKeyboardHandler(): (event: KeyboardEvent) => void {
	return (event: KeyboardEvent) => {
		const target = event.target as HTMLElement;
		const isInputElement =
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.isContentEditable;

		const editorHandledCommands: CommandId[] = [
			'branch-selected-node',
			'parallelize-selected-node'
		];

		const globalCommands = new Set<CommandId>([
			'toggle-file-browser',
			'show-side-by-side',
			'show-planning-full',
			'show-writing-full',
			'show-dag-full',
			'open-command-palette',
			'toggle-focus-mode',
			'toggle-shortcuts',
			'open-compile'
		]);

		for (const shortcut of KEYBOARD_SHORTCUTS) {
			if (!matchShortcut(event, shortcut)) {
				continue;
			}

			if (isInputElement && editorHandledCommands.includes(shortcut.commandId)) {
				return;
			}

			if (isInputElement && !globalCommands.has(shortcut.commandId)) {
				continue;
			}

			event.preventDefault();
			event.stopPropagation();
			executeCommand(shortcut.commandId);
			return;
		}
	};
}
