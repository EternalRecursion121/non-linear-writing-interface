import type { KeyboardShortcut, CommandPaletteItem } from '$lib/types';
import { projectStore } from '$lib/stores/project.svelte';
import { uiStore } from '$lib/stores/ui.svelte';
import { getNextNode, getPreviousNode } from './dag';

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
	// Branching
	{
		key: 'l',
		modifiers: ['ctrl'],
		action: 'branch',
		description: 'Branch at cursor',
		category: 'editing'
	},
	{
		key: 'p',
		modifiers: ['ctrl'],
		action: 'parallelize',
		description: 'Parallelize at selection',
		category: 'editing'
	},

	// View shortcuts
	{
		key: 'b',
		modifiers: ['ctrl'],
		action: 'toggleFileBrowser',
		description: 'Toggle file browser',
		category: 'view'
	},
	{
		key: '1',
		modifiers: ['ctrl'],
		action: 'planningFull',
		description: 'Full-screen planning pane',
		category: 'view'
	},
	{
		key: '2',
		modifiers: ['ctrl'],
		action: 'writingFull',
		description: 'Full-screen writing pane',
		category: 'view'
	},
	{
		key: '3',
		modifiers: ['ctrl'],
		action: 'dagFull',
		description: 'Full-screen DAG view',
		category: 'view'
	},
	{
		key: '0',
		modifiers: ['ctrl'],
		action: 'sideBySide',
		description: 'Side-by-side layout',
		category: 'view'
	},

	// Export
	{
		key: 'e',
		modifiers: ['ctrl'],
		action: 'export',
		description: 'Export compiled story',
		category: 'export'
	},

	// Undo/Redo
	{
		key: 'z',
		modifiers: ['ctrl'],
		action: 'undo',
		description: 'Undo',
		category: 'editing'
	},
	{
		key: 'z',
		modifiers: ['ctrl', 'shift'],
		action: 'redo',
		description: 'Redo',
		category: 'editing'
	},

	// Navigation
	{
		key: 'Tab',
		modifiers: [],
		action: 'nextNode',
		description: 'Navigate to next node',
		category: 'navigation'
	},
	{
		key: 'Tab',
		modifiers: ['shift'],
		action: 'prevNode',
		description: 'Navigate to previous node',
		category: 'navigation'
	},
	{
		key: 'Enter',
		modifiers: [],
		action: 'editNode',
		description: 'Edit selected node',
		category: 'navigation'
	},
	{
		key: 'Escape',
		modifiers: [],
		action: 'deselect',
		description: 'Deselect / close panel',
		category: 'navigation'
	},

	// Delete
	{
		key: 'Delete',
		modifiers: [],
		action: 'deleteNode',
		description: 'Delete selected node',
		category: 'editing'
	},
	{
		key: 'Backspace',
		modifiers: ['ctrl'],
		action: 'deleteNode',
		description: 'Delete selected node',
		category: 'editing'
	},

	// Overlays
	{
		key: '?',
		modifiers: [],
		action: 'showHelp',
		description: 'Show shortcut overlay',
		category: 'view'
	},
	{
		key: 'k',
		modifiers: ['meta'],
		action: 'commandPalette',
		description: 'Open command palette',
		category: 'view'
	},
	{
		key: 'k',
		modifiers: ['ctrl'],
		action: 'commandPalette',
		description: 'Open command palette',
		category: 'view'
	},
	{
		key: '.',
		modifiers: ['meta'],
		action: 'focusMode',
		description: 'Toggle focus mode',
		category: 'view'
	},
	{
		key: '.',
		modifiers: ['ctrl'],
		action: 'focusMode',
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

export function matchShortcut(
	event: KeyboardEvent,
	shortcut: KeyboardShortcut
): boolean {
	// Check key match
	const keyMatch =
		event.key.toLowerCase() === shortcut.key.toLowerCase() ||
		event.key === shortcut.key;

	if (!keyMatch) return false;

	// Check shift and alt modifiers (exact match required)
	const shiftMatch = shortcut.modifiers.includes('shift') === event.shiftKey;
	const altMatch = shortcut.modifiers.includes('alt') === event.altKey;

	if (!shiftMatch || !altMatch) return false;

	// Check ctrl/meta modifiers
	const needsCtrl = shortcut.modifiers.includes('ctrl');
	const needsMeta = shortcut.modifiers.includes('meta');
	const hasCtrl = event.ctrlKey;
	const hasMeta = event.metaKey;

	if (needsCtrl || needsMeta) {
		// Shortcut requires ctrl or meta - accept either ctrl or meta key
		return hasCtrl || hasMeta;
	} else {
		// Shortcut doesn't require ctrl/meta - make sure neither is pressed
		return !hasCtrl && !hasMeta;
	}
}

export type ShortcutHandler = (event: KeyboardEvent) => void;

export function createKeyboardHandler(
	customHandlers: Partial<Record<string, ShortcutHandler>> = {}
): (event: KeyboardEvent) => void {
	return (event: KeyboardEvent) => {
		// Skip if in an input element (unless it's a global shortcut)
		const target = event.target as HTMLElement;
		const isInputElement =
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.isContentEditable;

		// These shortcuts are handled directly by the WritingEditor component
		// Don't process them globally at all when in an input element
		const editorHandledShortcuts = ['branch', 'parallelize'];

		for (const shortcut of KEYBOARD_SHORTCUTS) {
			if (matchShortcut(event, shortcut)) {
				// Skip editor-handled shortcuts when in input - let the editor handle them
				if (isInputElement && editorHandledShortcuts.includes(shortcut.action)) {
					return; // Exit completely, don't prevent default
				}

				// Allow certain shortcuts even in input elements
				const globalShortcuts = [
					'save',
					'commandPalette',
					'focusMode',
					'showHelp',
					'planningFull',
					'writingFull',
					'dagFull',
					'sideBySide',
					'toggleFileBrowser'
				];

				if (isInputElement && !globalShortcuts.includes(shortcut.action)) {
					continue;
				}

				event.preventDefault();
				event.stopPropagation();

				// Check for custom handler first
				if (customHandlers[shortcut.action]) {
					customHandlers[shortcut.action]!(event);
					return;
				}

				// Default handlers
				switch (shortcut.action) {
					case 'planningFull':
						uiStore.showPlanningFull();
						break;
					case 'writingFull':
						uiStore.showWritingFull();
						break;
					case 'dagFull':
						uiStore.showDAGFull();
						break;
					case 'sideBySide':
						uiStore.showSideBySide();
						break;
					case 'undo':
						projectStore.undo();
						break;
					case 'redo':
						projectStore.redo();
						break;
					case 'commandPalette':
						uiStore.toggleCommandPalette();
						break;
					case 'focusMode':
						uiStore.toggleFocusMode();
						break;
					case 'showHelp':
						uiStore.toggleShortcutOverlay();
						break;
					case 'nextNode': {
						const currentId = projectStore.viewState.selectedNodeId;
						if (currentId) {
							const nextId = getNextNode(currentId, projectStore.nodesMap, projectStore.edges);
							if (nextId) projectStore.selectNode(nextId);
						}
						break;
					}
					case 'prevNode': {
						const currentId = projectStore.viewState.selectedNodeId;
						if (currentId) {
							const prevId = getPreviousNode(currentId, projectStore.nodesMap, projectStore.edges);
							if (prevId) projectStore.selectNode(prevId);
						}
						break;
					}
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
					case 'editNode':
						if (projectStore.selectedNode && !uiStore.isEditing) {
							uiStore.setEditing(true);
						}
						break;
					case 'deleteNode': {
						const selectedId = projectStore.viewState.selectedNodeId;
						if (selectedId && projectStore.nodesMap.size > 1) {
							// Navigate to another node before deleting
							const nextId = getNextNode(selectedId, projectStore.nodesMap, projectStore.edges);
							const prevId = getPreviousNode(selectedId, projectStore.nodesMap, projectStore.edges);
							projectStore.deleteNode(selectedId);
							projectStore.selectNode(nextId || prevId || null);
							uiStore.showToast('Node deleted', 'info');
						}
						break;
					}
					case 'toggleFileBrowser':
						uiStore.toggleNodeBrowser();
						break;
				}

				return;
			}
		}
	};
}

export function getCommandPaletteItems(
	customActions: CommandPaletteItem[] = []
): CommandPaletteItem[] {
	const shortcutItems: CommandPaletteItem[] = KEYBOARD_SHORTCUTS.filter(
		(s, i, arr) => arr.findIndex((x) => x.action === s.action) === i // Dedupe
	).map((shortcut) => ({
		id: shortcut.action,
		label: shortcut.description,
		shortcut: formatShortcut(shortcut),
		category: shortcut.category,
		action: () => {
			const event = new KeyboardEvent('keydown', {
				key: shortcut.key,
				ctrlKey: shortcut.modifiers.includes('ctrl'),
				shiftKey: shortcut.modifiers.includes('shift'),
				altKey: shortcut.modifiers.includes('alt'),
				metaKey: shortcut.modifiers.includes('meta')
			});
			createKeyboardHandler()(event);
		}
	}));

	return [...shortcutItems, ...customActions];
}
