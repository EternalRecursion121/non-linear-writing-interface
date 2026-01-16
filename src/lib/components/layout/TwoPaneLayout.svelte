<script lang="ts">
	import { uiStore } from '$lib/stores/ui.svelte';
	import PlanningPane from '$lib/components/writing/PlanningPane.svelte';
	import WritingPane from '$lib/components/writing/WritingPane.svelte';
	import DAGView from '$lib/components/dag/DAGView.svelte';

	interface Props {
		handleBranch: (cursorPosition: number) => void;
		setBranchCallback: (callback: (cursorPosition: number) => void) => void;
	}

	let { handleBranch, setBranchCallback }: Props = $props();

	let containerRef: HTMLDivElement;
	let isDragging = $state(false);

	function startDrag(e: MouseEvent) {
		isDragging = true;
		document.addEventListener('mousemove', onDrag);
		document.addEventListener('mouseup', stopDrag);
		e.preventDefault();
	}

	function onDrag(e: MouseEvent) {
		if (!isDragging || !containerRef) return;

		const rect = containerRef.getBoundingClientRect();
		const newWidth = e.clientX - rect.left;
		uiStore.setPlanePaneWidth(newWidth);
	}

	function stopDrag() {
		isDragging = false;
		document.removeEventListener('mousemove', onDrag);
		document.removeEventListener('mouseup', stopDrag);
	}

	// Determine what to show based on layout mode
	function getLayoutConfig() {
		const layout = uiStore.layout;

		if (layout === 'planning-full') {
			return { showPlanning: true, showRight: false, planningFull: true };
		}
		if (layout === 'writing-full') {
			return { showPlanning: false, showRight: true, rightFull: true };
		}
		if (layout === 'dag-full') {
			return { showPlanning: false, showRight: true, rightFull: true, showDag: true };
		}
		// side-by-side
		return { showPlanning: true, showRight: true };
	}

	let config = $derived(getLayoutConfig());
</script>

<div
	bind:this={containerRef}
	class="flex h-full overflow-hidden"
	class:no-select={isDragging}
>
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

	<!-- Resize Handle -->
	{#if config.showPlanning && config.showRight}
		<div
			class="resize-handle w-1 hover:w-1.5 flex-shrink-0 transition-all"
			style="background-color: var(--border-color);"
			onmousedown={startDrag}
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
					<WritingPane {handleBranch} {setBranchCallback} />
				{/if}
			</div>
		</div>
	{/if}
</div>
