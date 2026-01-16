<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import { getPathToNode } from '$lib/utils/dag';
	import { Folder } from 'lucide-svelte';

	// Get project nesting path (when inside subprojects)
	const projectPath = $derived(projectStore.getBreadcrumbPath());
	const isNested = $derived(projectPath.length > 0);

	// Get path from root to current node within current level
	function getNodePath(): { id: string; title: string }[] {
		const selectedId = projectStore.viewState.selectedNodeId;
		if (!selectedId) return [];

		// Get active nodes and edges at current level
		const activeNodes = projectStore.getActiveNodes();
		const activeEdges = projectStore.getActiveEdges();

		// Create a map for quick lookup
		const nodeMap = new Map(activeNodes.map((n) => [n.id, n]));

		// Find path to current node
		const pathIds = getPathToNode(selectedId, nodeMap, activeEdges);

		return pathIds.map((id) => {
			const node = nodeMap.get(id);
			return {
				id,
				title: node ? projectStore.getNodeDisplayTitle(node) : 'Unknown'
			};
		});
	}

	function selectNode(id: string) {
		projectStore.selectNode(id);
	}

	function drillToDepth(depth: number) {
		projectStore.drillToDepth(depth);
	}

	let nodePath = $derived(getNodePath());
</script>

<div
	class="px-4 py-2 flex items-center gap-1 text-sm border-b overflow-x-auto"
	style="background-color: var(--bg-secondary); border-color: var(--border-color);"
>
	<!-- Project nesting path (if inside subprojects) -->
	{#if isNested}
		<button
			class="px-2 py-0.5 rounded hover:opacity-80 transition-opacity whitespace-nowrap"
			style="color: var(--accent-color); background-color: transparent;"
			onclick={() => drillToDepth(0)}
			title="Go to root project"
		>
			Root
		</button>

		{#each projectPath as crumb, i}
			<span style="color: var(--text-muted);">/</span>
			<button
				class="px-2 py-0.5 rounded hover:opacity-80 transition-opacity whitespace-nowrap flex items-center gap-1"
				style="color: var(--accent-color); background-color: transparent;"
				onclick={() => drillToDepth(i + 1)}
				title="Go to {crumb.title}"
			>
				<Folder size={12} />
				{crumb.title}
			</button>
		{/each}

		<!-- Separator between project path and node path -->
		<span style="color: var(--border-color);" class="mx-1">|</span>
	{/if}

	<!-- Node path within current level -->
	{#each nodePath as item, i}
		{#if i > 0}
			<span style="color: var(--text-muted);">→</span>
		{/if}
		<button
			class="px-2 py-0.5 rounded hover:opacity-80 transition-opacity whitespace-nowrap max-w-[120px] truncate"
			class:font-medium={i === nodePath.length - 1}
			style="color: {i === nodePath.length - 1 ? 'var(--accent-color)' : 'var(--text-secondary)'};
			       background-color: {i === nodePath.length - 1 ? 'var(--bg-tertiary)' : 'transparent'};"
			onclick={() => selectNode(item.id)}
			title={item.title}
		>
			{item.title}
		</button>
	{/each}
</div>
