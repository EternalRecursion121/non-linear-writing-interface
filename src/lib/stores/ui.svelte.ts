import type { LayoutMode, RightPaneMode, AutosaveState } from '$lib/types';

class UIStore {
	// Layout
	private _layout = $state<LayoutMode>('side-by-side');
	private _rightPaneMode = $state<RightPaneMode>('writing');
	private _planePaneWidth = $state<number>(300);

	// Node Browser
	private _nodeBrowserOpen = $state<boolean>(true);
	private _nodeBrowserWidth = $state<number>(200);

	// Multi-select state
	private _selectedNodeIds = $state<Set<string>>(new Set());
	private _lastSelectedNodeId = $state<string | null>(null);

	// Overlays
	private _commandPaletteOpen = $state<boolean>(false);
	private _focusModeActive = $state<boolean>(false);
	private _shortcutOverlayOpen = $state<boolean>(false);
	private _compileModalOpen = $state<boolean>(false);

	// Autosave
	private _autosaveState = $state<AutosaveState>({
		status: 'saved',
		lastSaved: null
	});

	// Editing state
	private _isEditing = $state<boolean>(false);
	private _editingPlanContent = $state<boolean>(false);

	// Toast notifications
	private _toasts = $state<{ id: string; message: string; type: 'info' | 'success' | 'error' }[]>(
		[]
	);

	// Layout getters/setters
	get layout(): LayoutMode {
		return this._layout;
	}

	setLayout(layout: LayoutMode): void {
		this._layout = layout;
	}

	get rightPaneMode(): RightPaneMode {
		return this._rightPaneMode;
	}

	setRightPaneMode(mode: RightPaneMode): void {
		this._rightPaneMode = mode;
	}

	get planePaneWidth(): number {
		return this._planePaneWidth;
	}

	setPlanePaneWidth(width: number): void {
		this._planePaneWidth = Math.max(200, Math.min(600, width));
	}

	// Node Browser getters/setters
	get nodeBrowserOpen(): boolean {
		return this._nodeBrowserOpen;
	}

	toggleNodeBrowser(): void {
		this._nodeBrowserOpen = !this._nodeBrowserOpen;
	}

	openNodeBrowser(): void {
		this._nodeBrowserOpen = true;
	}

	closeNodeBrowser(): void {
		this._nodeBrowserOpen = false;
	}

	get nodeBrowserWidth(): number {
		return this._nodeBrowserWidth;
	}

	setNodeBrowserWidth(width: number): void {
		this._nodeBrowserWidth = Math.max(150, Math.min(400, width));
	}

	// Multi-select getters/methods
	get selectedNodeIds(): Set<string> {
		return this._selectedNodeIds;
	}

	get lastSelectedNodeId(): string | null {
		return this._lastSelectedNodeId;
	}

	isNodeSelected(nodeId: string): boolean {
		return this._selectedNodeIds.has(nodeId);
	}

	get hasMultiSelection(): boolean {
		return this._selectedNodeIds.size > 1;
	}

	// Clear multi-selection
	clearMultiSelection(): void {
		this._selectedNodeIds = new Set();
		this._lastSelectedNodeId = null;
	}

	// Toggle a single node in selection (Ctrl+click)
	toggleNodeSelection(nodeId: string): void {
		const newSet = new Set(this._selectedNodeIds);
		if (newSet.has(nodeId)) {
			newSet.delete(nodeId);
		} else {
			newSet.add(nodeId);
		}
		this._selectedNodeIds = newSet;
		this._lastSelectedNodeId = nodeId;
	}

	// Select a range of nodes (Ctrl+Shift+click)
	selectNodeRange(nodeId: string, sortedNodeIds: string[]): void {
		if (!this._lastSelectedNodeId) {
			// No previous selection, just select this one
			this._selectedNodeIds = new Set([nodeId]);
			this._lastSelectedNodeId = nodeId;
			return;
		}

		const lastIndex = sortedNodeIds.indexOf(this._lastSelectedNodeId);
		const currentIndex = sortedNodeIds.indexOf(nodeId);

		if (lastIndex === -1 || currentIndex === -1) {
			// Node not in list, just select this one
			this._selectedNodeIds = new Set([nodeId]);
			this._lastSelectedNodeId = nodeId;
			return;
		}

		const startIndex = Math.min(lastIndex, currentIndex);
		const endIndex = Math.max(lastIndex, currentIndex);

		const newSet = new Set(this._selectedNodeIds);
		for (let i = startIndex; i <= endIndex; i++) {
			newSet.add(sortedNodeIds[i]);
		}
		this._selectedNodeIds = newSet;
		// Keep lastSelectedNodeId as is for range selection anchor
	}

	// Set single selection (regular click)
	setSingleSelection(nodeId: string): void {
		this._selectedNodeIds = new Set([nodeId]);
		this._lastSelectedNodeId = nodeId;
	}

	// Overlay getters/setters
	get commandPaletteOpen(): boolean {
		return this._commandPaletteOpen;
	}

	toggleCommandPalette(): void {
		this._commandPaletteOpen = !this._commandPaletteOpen;
	}

	openCommandPalette(): void {
		this._commandPaletteOpen = true;
	}

	closeCommandPalette(): void {
		this._commandPaletteOpen = false;
	}

	get focusModeActive(): boolean {
		return this._focusModeActive;
	}

	toggleFocusMode(): void {
		this._focusModeActive = !this._focusModeActive;
	}

	exitFocusMode(): void {
		this._focusModeActive = false;
	}

	get shortcutOverlayOpen(): boolean {
		return this._shortcutOverlayOpen;
	}

	toggleShortcutOverlay(): void {
		this._shortcutOverlayOpen = !this._shortcutOverlayOpen;
	}

	closeShortcutOverlay(): void {
		this._shortcutOverlayOpen = false;
	}

	get compileModalOpen(): boolean {
		return this._compileModalOpen;
	}

	openCompileModal(): void {
		this._compileModalOpen = true;
	}

	closeCompileModal(): void {
		this._compileModalOpen = false;
	}

	// Autosave
	get autosaveState(): AutosaveState {
		return this._autosaveState;
	}

	setAutosaveStatus(status: AutosaveState['status']): void {
		this._autosaveState.status = status;
		if (status === 'saved') {
			this._autosaveState.lastSaved = Date.now();
		}
	}

	// Editing state
	get isEditing(): boolean {
		return this._isEditing;
	}

	setEditing(editing: boolean): void {
		this._isEditing = editing;
	}

	get editingPlanContent(): boolean {
		return this._editingPlanContent;
	}

	setEditingPlanContent(editing: boolean): void {
		this._editingPlanContent = editing;
	}

	// Toast notifications
	get toasts() {
		return this._toasts;
	}

	showToast(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
		const id = Math.random().toString(36).slice(2);
		this._toasts.push({ id, message, type });

		// Auto-remove after 3 seconds
		setTimeout(() => {
			this.removeToast(id);
		}, 3000);
	}

	removeToast(id: string): void {
		this._toasts = this._toasts.filter((t) => t.id !== id);
	}

	// Layout shortcuts
	showPlanningFull(): void {
		this._layout = 'planning-full';
	}

	showWritingFull(): void {
		this._layout = 'writing-full';
		this._rightPaneMode = 'writing';
	}

	showDAGFull(): void {
		this._layout = 'dag-full';
		this._rightPaneMode = 'dag';
	}

	showSideBySide(): void {
		this._layout = 'side-by-side';
	}

	// Close all overlays
	closeAllOverlays(): void {
		this._commandPaletteOpen = false;
		this._shortcutOverlayOpen = false;
		this._focusModeActive = false;
		this._compileModalOpen = false;
	}
}

export const uiStore = new UIStore();
