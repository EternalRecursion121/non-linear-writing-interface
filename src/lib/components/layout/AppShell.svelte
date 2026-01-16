<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import MainToolbar from '$lib/components/toolbar/MainToolbar.svelte';
	import TwoPaneLayout from './TwoPaneLayout.svelte';
	import CommandPalette from '$lib/components/overlays/CommandPalette.svelte';
	import FocusMode from '$lib/components/overlays/FocusMode.svelte';
	import ShortcutOverlay from '$lib/components/overlays/ShortcutOverlay.svelte';
	import CompilePanel from '$lib/components/dag/CompilePanel.svelte';
	import ToastContainer from '$lib/components/overlays/ToastContainer.svelte';
	import { createKeyboardHandler } from '$lib/utils/keyboard';
	import { branchAtCursor } from '$lib/utils/branching';
	import { saveProjectToFile, saveToLocalStorage } from '$lib/utils/persistence';
	import { onMount } from 'svelte';

	let branchCallback: ((cursorPosition: number) => void) | null = null;
	let autosaveTimeout: ReturnType<typeof setTimeout> | null = null;

	function setBranchCallback(callback: (cursorPosition: number) => void) {
		branchCallback = callback;
	}

	function handleBranch(cursorPosition: number) {
		const selectedNode = projectStore.selectedNode;
		if (!selectedNode) return;

		const result = branchAtCursor(selectedNode, cursorPosition, selectedNode.position);

		// Update original node
		projectStore.updateNode(result.originalNode.id, {
			content: result.originalNode.content
		});

		// Add new nodes
		const contNode = projectStore.addNode(result.continuationNode);
		const branchNode = projectStore.addNode(result.branchNode);

		// Add edges
		projectStore.addEdge(result.originalNode.id, contNode.id);
		projectStore.addEdge(result.originalNode.id, branchNode.id);

		// Select the new branch node
		projectStore.selectNode(branchNode.id);
		uiStore.setEditing(true);
		uiStore.showToast('Branch created', 'success');
	}

	const keyboardHandler = createKeyboardHandler({
		branch: () => {
			if (branchCallback) {
				// Get cursor position from editor
				const selection = window.getSelection();
				if (selection && selection.rangeCount > 0) {
					const range = selection.getRangeAt(0);
					// This will be handled by the editor component
				}
			}
		},
		export: () => uiStore.openCompileModal()
	});

	function handleKeydown(event: KeyboardEvent) {
		keyboardHandler(event);
	}

	// Debounced autosave function
	function triggerAutosave() {
		uiStore.setAutosaveStatus('unsaved');

		if (autosaveTimeout) {
			clearTimeout(autosaveTimeout);
		}

		autosaveTimeout = setTimeout(async () => {
			await saveProjectToFile();
			saveToLocalStorage(); // Also save to localStorage as backup
		}, 1000); // Save 1 second after last change
	}

	// Watch for project changes and trigger autosave
	$effect(() => {
		// Access reactive properties to track changes
		const nodes = projectStore.nodes;
		const edges = projectStore.edges;
		const name = projectStore.name;
		const settings = projectStore.settings;

		// Trigger autosave (skip on initial load)
		if (nodes.length > 0) {
			triggerAutosave();
		}
	});

	// Get theme class
	$effect(() => {
		document.body.setAttribute('data-theme', projectStore.settings.theme);
	});

	// Get font class
	function getFontClass(font: string): string {
		return `font-${font}`;
	}

	function getSizeClass(size: string): string {
		return `text-size-${size}`;
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div
	class="h-screen flex flex-col overflow-hidden"
	style="background-color: var(--bg-primary); color: var(--text-primary);"
>
	<!-- Main Toolbar -->
	{#if !uiStore.focusModeActive}
		<MainToolbar />
	{/if}

	<!-- Main Content -->
	<div class="flex-1 overflow-hidden">
		<TwoPaneLayout {handleBranch} {setBranchCallback} />
	</div>

	<!-- Status Bar -->
	{#if !uiStore.focusModeActive}
		<div
			class="h-7 flex items-center justify-between px-4 text-xs border-t"
			style="background-color: var(--bg-secondary); border-color: var(--border-color); color: var(--text-muted);"
		>
			<div class="flex items-center gap-4">
				<!-- Save Status -->
				<span class="flex items-center gap-1">
					{#if uiStore.autosaveState.status === 'saved'}
						<span class="text-green-500">✓</span> Saved
					{:else if uiStore.autosaveState.status === 'saving'}
						<span class="animate-pulse">●</span> Saving...
					{:else}
						<span class="text-yellow-500">●</span> Unsaved
					{/if}
				</span>

				<!-- Node info -->
				{#if projectStore.selectedNode}
					<span>
						Node {Array.from(projectStore.nodesMap.keys()).indexOf(projectStore.selectedNode.id) + 1} of {projectStore.nodesMap.size}
					</span>
				{/if}
			</div>

			<div class="flex items-center gap-4">
				<!-- Word count -->
				<span>
					{projectStore.totalWordCount} words
				</span>

				<!-- Keyboard hint -->
				<span class="opacity-50">
					Press ? for shortcuts
				</span>
			</div>
		</div>
	{/if}
</div>

<!-- Overlays -->
{#if uiStore.commandPaletteOpen}
	<CommandPalette />
{/if}

{#if uiStore.focusModeActive}
	<FocusMode />
{/if}

{#if uiStore.shortcutOverlayOpen}
	<ShortcutOverlay />
{/if}

{#if uiStore.compileModalOpen}
	<CompilePanel />
{/if}

<ToastContainer />
