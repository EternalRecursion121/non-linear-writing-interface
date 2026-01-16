<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import { topologicalSort } from '$lib/utils/dag';
	import NodeBrowserItem from './NodeBrowserItem.svelte';
	import { ArrowUp } from 'lucide-svelte';

	let searchQuery = $state('');

	// Get nodes in topological order for display
	const sortedNodes = $derived(() => {
		const activeNodes = projectStore.getActiveNodes();
		const activeEdges = projectStore.getActiveEdges();
		const sortedIds = topologicalSort(activeNodes, activeEdges);

		let nodes = sortedIds
			.map((id) => activeNodes.find((n) => n.id === id))
			.filter((n): n is NonNullable<typeof n> => !!n);

		// Filter by search query if present
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			nodes = nodes.filter((node) => {
				const title = projectStore.getNodeDisplayTitle(node).toLowerCase();
				const content = node.content.toLowerCase();
				return title.includes(query) || content.includes(query);
			});
		}

		return nodes;
	});

	// Get sorted node IDs for multi-select range calculation
	const sortedNodeIds = $derived(() => sortedNodes().map((n) => n.id));

	// Breadcrumb for nested navigation
	const breadcrumbPath = $derived(projectStore.getBreadcrumbPath());

	function handleDrillUp() {
		projectStore.drillUp();
	}

	function handleDrillToDepth(depth: number) {
		projectStore.drillToDepth(depth);
	}

	function handleAddNode() {
		const selectedNode = projectStore.selectedNode;
		const position = selectedNode
			? { x: selectedNode.position.x + 50, y: selectedNode.position.y + 150 }
			: { x: 250, y: 100 };

		const newNode = projectStore.addNode({ position });

		if (selectedNode) {
			projectStore.addEdge(selectedNode.id, newNode.id);
		}

		projectStore.selectNode(newNode.id);
		uiStore.showToast('Node added', 'success');
	}
</script>

<div class="h-full flex flex-col" style="background-color: var(--bg-secondary);">
	<!-- Header -->
	<div
		class="px-3 py-2 border-b flex items-center justify-between"
		style="border-color: var(--border-color);"
	>
		<span class="text-xs font-medium" style="color: var(--text-secondary);">
			Files
		</span>
		<button
			onclick={handleAddNode}
			class="text-xs px-1.5 py-0.5 rounded transition-colors hover:opacity-80"
			style="background-color: var(--accent-color); color: white;"
			title="Add new node"
		>
			+ New
		</button>
	</div>

	<!-- Nested Navigation Breadcrumb -->
	{#if breadcrumbPath.length > 0}
		<div
			class="px-3 py-1.5 border-b flex items-center gap-1 text-xs overflow-x-auto"
			style="border-color: var(--border-color);"
		>
			<button
				onclick={() => handleDrillToDepth(0)}
				class="hover:underline"
				style="color: var(--accent-color);"
			>
				Root
			</button>
			{#each breadcrumbPath as crumb, i}
				<span style="color: var(--text-muted);">/</span>
				<button
					onclick={() => handleDrillToDepth(i + 1)}
					class="hover:underline truncate max-w-[80px]"
					style="color: {i === breadcrumbPath.length - 1 ? 'var(--text-primary)' : 'var(--accent-color)'};"
					title={crumb.title}
				>
					{crumb.title}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Search -->
	<div class="px-2 py-2 border-b" style="border-color: var(--border-color);">
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search nodes..."
			class="w-full px-2 py-1 text-xs rounded border"
			style="background-color: var(--bg-primary);
			       border-color: var(--border-color);
			       color: var(--text-primary);"
		/>
	</div>

	<!-- Node List -->
	<div class="flex-1 overflow-y-auto">
		{#if !projectStore.isAtRoot}
			<button
				onclick={handleDrillUp}
				class="w-full px-3 py-2 text-xs text-left flex items-center gap-2 border-b transition-colors hover:bg-black/5"
				style="border-color: var(--border-color); color: var(--accent-color);"
			>
				<ArrowUp size={14} />
				<span>Go up to parent</span>
			</button>
		{/if}

		{#each sortedNodes() as node}
			<NodeBrowserItem {node} sortedNodeIds={sortedNodeIds()} />
		{/each}

		{#if sortedNodes().length === 0}
			<div class="px-3 py-4 text-xs text-center" style="color: var(--text-muted);">
				{searchQuery ? 'No matching nodes' : 'No nodes yet'}
			</div>
		{/if}
	</div>

	<!-- Footer Stats -->
	<div
		class="px-3 py-2 border-t text-[10px]"
		style="border-color: var(--border-color); color: var(--text-muted);"
	>
		{#if uiStore.hasMultiSelection}
			<span style="color: var(--accent-color);">{uiStore.selectedNodeIds.size} selected</span> •
		{/if}
		{sortedNodes().length} node{sortedNodes().length !== 1 ? 's' : ''} •
		{projectStore.totalWordCount} words total
	</div>
</div>
