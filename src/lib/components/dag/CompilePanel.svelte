<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import { findRoots, findLeaves, getCompilePaths, compilePath } from '$lib/utils/dag';
	import { exportAsMarkdown } from '$lib/utils/persistence';

	let sourceNodeId = $state<string | null>(null);
	let sinkNodeId = $state<string | null>(null);
	let selectedPathIndex = $state<number>(0);
	let previewContent = $state<string>('');

	// Get available source nodes (roots)
	function getRoots() {
		return findRoots(projectStore.nodesMap, projectStore.edges);
	}

	// Get available sink nodes (leaves)
	function getLeaves() {
		return findLeaves(projectStore.nodesMap, projectStore.edges);
	}

	// Get paths between selected source and sink
	function getPaths() {
		if (!sourceNodeId || !sinkNodeId) return [];
		return getCompilePaths(sourceNodeId, sinkNodeId, projectStore.nodesMap, projectStore.edges);
	}

	let roots = $derived(getRoots());
	let leaves = $derived(getLeaves());
	let paths = $derived(getPaths());

	// Auto-select first root and leaf
	$effect(() => {
		if (roots.length > 0 && !sourceNodeId) {
			sourceNodeId = roots[0].id;
		}
		if (leaves.length > 0 && !sinkNodeId) {
			sinkNodeId = leaves[0].id;
		}
	});

	// Update preview when path selection changes
	$effect(() => {
		if (paths.length > 0 && selectedPathIndex < paths.length) {
			previewContent = compilePath(paths[selectedPathIndex].nodeIds, projectStore.nodesMap);
		} else {
			previewContent = '';
		}
	});

	function handleExport() {
		if (!previewContent) return;

		exportAsMarkdown(previewContent, {
			title: projectStore.name,
			compiledAt: new Date().toISOString()
		});

		uiStore.closeCompileModal();
	}

	function handleClose() {
		uiStore.closeCompileModal();
	}

	function getNodeLabel(id: string): string {
		const allIds = Array.from(projectStore.nodesMap.keys());
		return `Node ${allIds.indexOf(id) + 1}`;
	}
</script>

<!-- Backdrop -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center command-palette-backdrop"
	style="background-color: rgba(0, 0, 0, 0.5);"
	onclick={handleClose}
	onkeydown={(e) => e.key === 'Escape' && handleClose()}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<!-- Modal -->
	<div
		class="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-lg shadow-2xl flex flex-col"
		style="background-color: var(--bg-primary);"
		onclick={(e) => e.stopPropagation()}
		role="document"
	>
		<!-- Header -->
		<div
			class="px-6 py-4 border-b flex items-center justify-between"
			style="border-color: var(--border-color);"
		>
			<h2 class="text-lg font-semibold" style="color: var(--text-primary);">
				Compile Story
			</h2>
			<button
				class="p-1 rounded hover:opacity-70"
				style="color: var(--text-muted);"
				onclick={handleClose}
				aria-label="Close"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-auto p-6">
			<div class="grid grid-cols-2 gap-6 mb-6">
				<!-- Source selection -->
				<div>
					<label for="source-select" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
						Start from
					</label>
					<select
						id="source-select"
						bind:value={sourceNodeId}
						class="w-full px-3 py-2 rounded border text-sm"
						style="background-color: var(--bg-secondary); border-color: var(--border-color); color: var(--text-primary);"
					>
						{#each roots as root}
							<option value={root.id}>{getNodeLabel(root.id)}</option>
						{/each}
					</select>
				</div>

				<!-- Sink selection -->
				<div>
					<label for="sink-select" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
						End at
					</label>
					<select
						id="sink-select"
						bind:value={sinkNodeId}
						class="w-full px-3 py-2 rounded border text-sm"
						style="background-color: var(--bg-secondary); border-color: var(--border-color); color: var(--text-primary);"
					>
						{#each leaves as leaf}
							<option value={leaf.id}>{getNodeLabel(leaf.id)}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Path selection -->
			{#if paths.length > 1}
				<div class="mb-6">
					<span class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
						Choose path ({paths.length} available)
					</span>
					<div class="flex flex-wrap gap-2">
						{#each paths as path, i}
							<button
								class="px-3 py-1.5 rounded text-sm transition-colors"
								style="background-color: {selectedPathIndex === i ? 'var(--accent-color)' : 'var(--bg-secondary)'};
								       color: {selectedPathIndex === i ? 'white' : 'var(--text-secondary)'};
								       border: 1px solid {selectedPathIndex === i ? 'var(--accent-color)' : 'var(--border-color)'};"
								onclick={() => selectedPathIndex = i}
							>
								Path {i + 1} ({path.totalWords} words)
							</button>
						{/each}
					</div>
				</div>
			{:else if paths.length === 0 && sourceNodeId && sinkNodeId}
				<p class="text-sm mb-6" style="color: var(--text-muted);">
					No paths found between selected nodes.
				</p>
			{/if}

			<!-- Preview -->
			{#if previewContent}
				<div>
					<span class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
						Preview
					</span>
					<div
						class="h-64 overflow-auto rounded border p-4 text-sm whitespace-pre-wrap"
						style="background-color: var(--bg-secondary); border-color: var(--border-color); color: var(--text-primary);"
					>
						{previewContent}
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div
			class="px-6 py-4 border-t flex items-center justify-end gap-3"
			style="border-color: var(--border-color);"
		>
			<button
				class="px-4 py-2 rounded text-sm"
				style="background-color: var(--bg-secondary); color: var(--text-secondary);"
				onclick={handleClose}
			>
				Cancel
			</button>
			<button
				class="px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
				style="background-color: var(--accent-color); color: white;"
				onclick={handleExport}
				disabled={!previewContent}
			>
				Export as Markdown
			</button>
		</div>
	</div>
</div>
