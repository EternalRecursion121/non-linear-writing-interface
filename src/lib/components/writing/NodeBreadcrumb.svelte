<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import { getPathToNode } from '$lib/utils/dag';

	// Get path from root to current node
	function getPath(): { id: string; index: number }[] {
		const selectedId = projectStore.viewState.selectedNodeId;
		if (!selectedId) return [];

		const pathIds = getPathToNode(selectedId, projectStore.nodesMap, projectStore.edges);
		const allIds = Array.from(projectStore.nodesMap.keys());

		return pathIds.map((id) => ({
			id,
			index: allIds.indexOf(id) + 1
		}));
	}

	function selectNode(id: string) {
		projectStore.selectNode(id);
	}

	let path = $derived(getPath());
</script>

<div
	class="px-4 py-2 flex items-center gap-1 text-sm border-b overflow-x-auto"
	style="background-color: var(--bg-secondary); border-color: var(--border-color);"
>
	{#each path as item, i}
		{#if i > 0}
			<span style="color: var(--text-muted);">/</span>
		{/if}
		<button
			class="px-2 py-0.5 rounded hover:opacity-80 transition-opacity whitespace-nowrap"
			class:font-medium={i === path.length - 1}
			style="color: {i === path.length - 1 ? 'var(--accent-color)' : 'var(--text-secondary)'};
			       background-color: {i === path.length - 1 ? 'var(--bg-tertiary)' : 'transparent'};"
			onclick={() => selectNode(item.id)}
		>
			Node {item.index}
		</button>
	{/each}
</div>
