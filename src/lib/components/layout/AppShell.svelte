<script lang="ts">
	import { nanoid } from 'nanoid';
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
	import { branchAtCursor, parallelizeAtSelection } from '$lib/utils/branching';
	import { saveProjectToFile, saveToLocalStorage } from '$lib/utils/persistence';
	import { onMount } from 'svelte';
	import { Check, Circle } from 'lucide-svelte';

	let branchCallback: ((cursorPosition: number) => void) | null = null;
	let parallelizeCallback: ((selectionStart: number, selectionEnd: number) => void) | null = null;
	let autosaveTimeout: ReturnType<typeof setTimeout> | null = null;

	function setBranchCallback(callback: (cursorPosition: number) => void) {
		branchCallback = callback;
	}

	function setParallelizeCallback(callback: (selectionStart: number, selectionEnd: number) => void) {
		parallelizeCallback = callback;
	}

	function handleBranch(cursorPosition: number) {
		console.log('[AppShell] handleBranch called with position:', cursorPosition);
		const selectedNode = projectStore.selectedNode;
		if (!selectedNode) {
			console.log('[AppShell] No selected node, returning');
			return;
		}
		console.log('[AppShell] Selected node:', selectedNode.id);
		console.log('[AppShell] Content:', JSON.stringify(selectedNode.content));
		console.log('[AppShell] Content length:', selectedNode.content.length);
		console.log('[AppShell] Text BEFORE cursor:', JSON.stringify(selectedNode.content.slice(0, cursorPosition)));
		console.log('[AppShell] Text AFTER cursor:', JSON.stringify(selectedNode.content.slice(cursorPosition)));

		const result = branchAtCursor(selectedNode, cursorPosition, selectedNode.position);

		console.log('[AppShell] Branch result:');
		console.log('  - Original node content:', JSON.stringify(result.originalNode.content));
		console.log('  - Continuation node content:', JSON.stringify(result.continuationNode.content));
		console.log('  - Branch node content:', JSON.stringify(result.branchNode.content));

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

	function handleParallelize(selectionStart: number, selectionEnd: number) {
		console.log('[AppShell] handleParallelize called');
		console.log('[AppShell] selectionStart:', selectionStart, 'selectionEnd:', selectionEnd);

		const selectedNode = projectStore.selectedNode;
		if (!selectedNode) {
			console.log('[AppShell] No selected node');
			return;
		}

		console.log('[AppShell] Content:', JSON.stringify(selectedNode.content));
		console.log('[AppShell] Selected text:', JSON.stringify(selectedNode.content.slice(selectionStart, selectionEnd)));

		// If there's a selection, create one new branch with highlighted text removed
		if (selectionStart !== selectionEnd) {
			console.log('[AppShell] Has selection, creating branch without highlighted text');
			const result = parallelizeAtSelection(
				selectedNode,
				selectionStart,
				selectionEnd,
				selectedNode.position
			);

			console.log('[AppShell] Parallelize result:');
			console.log('  - Original content:', JSON.stringify(result.originalNode.content));
			console.log('  - New branch content:', JSON.stringify(result.selectedPathNode.content));

			// Original stays unchanged (no update needed)

			// Add the new branch node
			const branchNode = projectStore.addNode(result.selectedPathNode);

			// Add edge from original to new branch
			projectStore.addEdge(result.originalNode.id, branchNode.id);

			// Don't change selection - stay on original node to preserve cursor
			uiStore.showToast('Branch created (highlighted text removed)', 'success');
		} else {
			// No selection - create a copy of the full content as a new branch
			// Original stays unchanged
			console.log('[AppShell] No selection, creating full copy branch');

			const branchPosition = {
				x: selectedNode.position.x + 150,
				y: selectedNode.position.y + 150
			};

			const branchNode = projectStore.addNode({
				id: nanoid(),
				content: selectedNode.content, // Full copy
				planContent: selectedNode.planContent,
				position: branchPosition,
				createdAt: Date.now(),
				updatedAt: Date.now()
			});

			// Add edge from original to new branch
			projectStore.addEdge(selectedNode.id, branchNode.id);

			// Don't change selection - stay on original node
			uiStore.showToast('Branch created (full copy)', 'success');
		}
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

<!-- Use Svelte 5 syntax for window events -->
<svelte:window onkeydown={handleKeydown} />

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
		<TwoPaneLayout {handleBranch} {setBranchCallback} {handleParallelize} {setParallelizeCallback} />
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
						<Check size={12} class="text-green-500" /> Saved
					{:else if uiStore.autosaveState.status === 'saving'}
						<Circle size={10} class="animate-pulse" /> Saving...
					{:else}
						<Circle size={10} class="text-yellow-500" /> Unsaved
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
