<script lang="ts">
	import { uiStore } from '$lib/stores/ui.svelte';
	import PlanningPane from '$lib/components/writing/PlanningPane.svelte';
	import WritingPane from '$lib/components/writing/WritingPane.svelte';
	import DAGView from '$lib/components/dag/DAGView.svelte';
	import NodeBrowser from '$lib/components/browser/NodeBrowser.svelte';

	interface Props {
		handleBranch: (cursorPosition: number) => void;
		setBranchCallback: (callback: (cursorPosition: number) => void) => void;
		handleParallelize: (selectionStart: number, selectionEnd: number) => void;
		setParallelizeCallback: (callback: (selectionStart: number, selectionEnd: number) => void) => void;
	}

	let { handleBranch, setBranchCallback, handleParallelize, setParallelizeCallback }: Props = $props();

	let containerRef: HTMLDivElement;
	let isDraggingPlanning = $state(false);
	let isDraggingBrowser = $state(false);

	function startDragPlanning(e: MouseEvent) {
		isDraggingPlanning = true;
		document.addEventListener('mousemove', onDragPlanning);
		document.addEventListener('mouseup', stopDragPlanning);
		e.preventDefault();
	}

	function onDragPlanning(e: MouseEvent) {
		if (!isDraggingPlanning || !containerRef) return;

		const rect = containerRef.getBoundingClientRect();
		// Account for browser pane width if it's open
		const browserWidth = uiStore.nodeBrowserOpen ? uiStore.nodeBrowserWidth : 0;
		const newWidth = e.clientX - rect.left - browserWidth - 4; // 4px for resize handle
		uiStore.setPlanePaneWidth(newWidth);
	}

	function stopDragPlanning() {
		isDraggingPlanning = false;
		document.removeEventListener('mousemove', onDragPlanning);
		document.removeEventListener('mouseup', stopDragPlanning);
	}

	function startDragBrowser(e: MouseEvent) {
		isDraggingBrowser = true;
		document.addEventListener('mousemove', onDragBrowser);
		document.addEventListener('mouseup', stopDragBrowser);
		e.preventDefault();
	}

	function onDragBrowser(e: MouseEvent) {
		if (!isDraggingBrowser || !containerRef) return;

		const rect = containerRef.getBoundingClientRect();
		const newWidth = e.clientX - rect.left;
		uiStore.setNodeBrowserWidth(newWidth);
	}

	function stopDragBrowser() {
		isDraggingBrowser = false;
		document.removeEventListener('mousemove', onDragBrowser);
		document.removeEventListener('mouseup', stopDragBrowser);
	}

	const isDragging = $derived(isDraggingPlanning || isDraggingBrowser);

	// Determine what to show based on layout mode
	function getLayoutConfig() {
		const layout = uiStore.layout;

		if (layout === 'planning-full') {
			return { showBrowser: false, showPlanning: true, showRight: false, planningFull: true };
		}
		if (layout === 'writing-full') {
			return { showBrowser: false, showPlanning: false, showRight: true, rightFull: true };
		}
		if (layout === 'dag-full') {
			return { showBrowser: false, showPlanning: false, showRight: true, rightFull: true, showDag: true };
		}
		// side-by-side - show browser if enabled
		return { showBrowser: uiStore.nodeBrowserOpen, showPlanning: true, showRight: true };
	}

	let config = $derived(getLayoutConfig());
</script>

<div
	bind:this={containerRef}
	class="flex h-full overflow-hidden"
	class:no-select={isDragging}
>
	<!-- Node Browser Pane -->
	{#if config.showBrowser}
		<div
			class="flex-shrink-0 overflow-hidden flex flex-col border-r"
			style="width: {uiStore.nodeBrowserWidth}px;
			       background-color: var(--bg-secondary);
			       border-color: var(--border-color);"
		>
			<NodeBrowser />
		</div>

		<!-- Browser Resize Handle -->
		<div
			class="resize-handle w-1 hover:w-1.5 flex-shrink-0 transition-all cursor-col-resize"
			style="background-color: var(--border-color);"
			onmousedown={startDragBrowser}
			role="separator"
			aria-orientation="vertical"
			tabindex="-1"
		></div>
	{/if}

	<!-- Planning Pane -->
	{#if config.showPlanning}
		<div
			class="flex-shrink-0 overflow-hidden flex flex-col border-r"
			style="width: {config.planningFull ? '100%' : `${uiStore.planePaneWidth}px`};
			       background-color: var(--bg-secondary);
			       border-color: var(--border-color);"
		>
			<PlanningPane />
		</div>
	{/if}

	<!-- Planning Resize Handle -->
	{#if config.showPlanning && config.showRight}
		<div
			class="resize-handle w-1 hover:w-1.5 flex-shrink-0 transition-all cursor-col-resize"
			style="background-color: var(--border-color);"
			onmousedown={startDragPlanning}
			role="separator"
			aria-orientation="vertical"
			tabindex="-1"
		></div>
	{/if}

	<!-- Right Pane (Writing or DAG) -->
	{#if config.showRight}
		<div class="flex-1 overflow-hidden flex flex-col">
			<!-- Pane toggle tabs (only in side-by-side) -->
			{#if uiStore.layout === 'side-by-side'}
				<div
					class="flex border-b"
					style="background-color: var(--bg-secondary); border-color: var(--border-color);"
				>
					<button
						class="px-4 py-2 text-sm font-medium transition-colors"
						class:active={uiStore.rightPaneMode === 'writing'}
						style="color: {uiStore.rightPaneMode === 'writing' ? 'var(--accent-color)' : 'var(--text-secondary)'};
						       border-bottom: 2px solid {uiStore.rightPaneMode === 'writing' ? 'var(--accent-color)' : 'transparent'};"
						onclick={() => uiStore.setRightPaneMode('writing')}
					>
						Writing
					</button>
					<button
						class="px-4 py-2 text-sm font-medium transition-colors"
						class:active={uiStore.rightPaneMode === 'dag'}
						style="color: {uiStore.rightPaneMode === 'dag' ? 'var(--accent-color)' : 'var(--text-secondary)'};
						       border-bottom: 2px solid {uiStore.rightPaneMode === 'dag' ? 'var(--accent-color)' : 'transparent'};"
						onclick={() => uiStore.setRightPaneMode('dag')}
					>
						DAG
					</button>
				</div>
			{/if}

			<!-- Content -->
			<div class="flex-1 overflow-hidden">
				{#if uiStore.layout === 'dag-full' || (uiStore.layout === 'side-by-side' && uiStore.rightPaneMode === 'dag')}
					<DAGView />
				{:else}
					<WritingPane {handleBranch} {setBranchCallback} {handleParallelize} {setParallelizeCallback} />
				{/if}
			</div>
		</div>
	{/if}
</div>
