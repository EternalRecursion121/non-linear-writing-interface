<script lang="ts">
	import { uiStore } from '$lib/stores/ui.svelte';
	import NodeBrowser from '$lib/components/browser/NodeBrowser.svelte';
	import DAGView from '$lib/components/dag/DAGView.svelte';
	import PlanningPane from '$lib/components/writing/PlanningPane.svelte';
	import WritingPane from '$lib/components/writing/WritingPane.svelte';

	let containerRef: HTMLDivElement;
	let isDraggingPlanning = $state(false);
	let isDraggingBrowser = $state(false);

	function startDragPlanning(event: MouseEvent) {
		isDraggingPlanning = true;
		document.addEventListener('mousemove', onDragPlanning);
		document.addEventListener('mouseup', stopDragPlanning);
		event.preventDefault();
	}

	function onDragPlanning(event: MouseEvent) {
		if (!isDraggingPlanning || !containerRef) {
			return;
		}

		const rect = containerRef.getBoundingClientRect();
		const browserWidth = uiStore.nodeBrowserOpen ? uiStore.nodeBrowserWidth : 0;
		uiStore.setPlanePaneWidth(event.clientX - rect.left - browserWidth - 4);
	}

	function stopDragPlanning() {
		isDraggingPlanning = false;
		document.removeEventListener('mousemove', onDragPlanning);
		document.removeEventListener('mouseup', stopDragPlanning);
	}

	function startDragBrowser(event: MouseEvent) {
		isDraggingBrowser = true;
		document.addEventListener('mousemove', onDragBrowser);
		document.addEventListener('mouseup', stopDragBrowser);
		event.preventDefault();
	}

	function onDragBrowser(event: MouseEvent) {
		if (!isDraggingBrowser || !containerRef) {
			return;
		}

		const rect = containerRef.getBoundingClientRect();
		uiStore.setNodeBrowserWidth(event.clientX - rect.left);
	}

	function stopDragBrowser() {
		isDraggingBrowser = false;
		document.removeEventListener('mousemove', onDragBrowser);
		document.removeEventListener('mouseup', stopDragBrowser);
	}

	const isDragging = $derived(isDraggingPlanning || isDraggingBrowser);

	function getLayoutConfig() {
		switch (uiStore.layout) {
			case 'planning-full':
				return { showBrowser: false, showPlanning: true, showRight: false, planningFull: true };
			case 'writing-full':
				return { showBrowser: false, showPlanning: false, showRight: true };
			case 'dag-full':
				return { showBrowser: false, showPlanning: false, showRight: true, forceDag: true };
			default:
				return {
					showBrowser: uiStore.nodeBrowserOpen,
					showPlanning: true,
					showRight: true
				};
		}
	}

	const config = $derived(getLayoutConfig());
</script>

<div bind:this={containerRef} class="flex h-full gap-2.5 overflow-hidden px-3 pb-1.5" class:no-select={isDragging}>
	{#if config.showBrowser}
		<div
			class="shell-panel-muted flex flex-shrink-0 flex-col overflow-hidden rounded-[var(--radius-xl)]"
			style="width: {uiStore.nodeBrowserWidth}px;"
		>
			<NodeBrowser />
		</div>

		<button
			type="button"
			class="resize-handle my-8 w-[3px] flex-shrink-0 rounded-full"
			onmousedown={startDragBrowser}
			aria-label="Resize browser pane"
			tabindex="-1"
		></button>
	{/if}

	{#if config.showPlanning}
		<div
			class="shell-panel-muted flex flex-shrink-0 flex-col overflow-hidden rounded-[var(--radius-xl)]"
			style="width: {config.planningFull ? '100%' : `${uiStore.planePaneWidth}px`};"
		>
			<PlanningPane />
		</div>
	{/if}

	{#if config.showPlanning && config.showRight}
		<button
			type="button"
			class="resize-handle my-8 w-[3px] flex-shrink-0 rounded-full"
			onmousedown={startDragPlanning}
			aria-label="Resize planning pane"
			tabindex="-1"
		></button>
	{/if}

	{#if config.showRight}
		<div class="shell-panel flex flex-1 flex-col overflow-hidden rounded-[var(--radius-xl)]">
			{#if uiStore.layout === 'side-by-side'}
				<div
					class="flex items-center gap-1 border-b px-3 py-2"
					style="border-color: var(--border-color);"
				>
					<button
						class="shell-button shell-tab text-[12.5px] font-medium"
						class:active={uiStore.rightPaneMode === 'writing'}
						onclick={() => uiStore.setRightPaneMode('writing')}
					>
						Writing
					</button>
					<button
						class="shell-button shell-tab text-[12.5px] font-medium"
						class:active={uiStore.rightPaneMode === 'dag'}
						onclick={() => uiStore.setRightPaneMode('dag')}
					>
						DAG
					</button>
				</div>
			{/if}

			<div class="flex-1 overflow-hidden">
				{#if config.forceDag || (uiStore.layout === 'side-by-side' && uiStore.rightPaneMode === 'dag')}
					<DAGView />
				{:else}
					<WritingPane />
				{/if}
			</div>
		</div>
	{/if}
</div>
