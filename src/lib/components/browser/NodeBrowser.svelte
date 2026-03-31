<script lang="ts">
	import { Search } from 'lucide-svelte';
	import { topologicalSort } from '$lib/domain/project/compile';
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import NodeBrowserItem from './NodeBrowserItem.svelte';
	import { ArrowUp } from 'lucide-svelte';

	let searchQuery = $state('');

	const sortedNodes = $derived.by(() => {
		const nodeIds = topologicalSort(projectStore.activeGraph);
		let nodes = nodeIds
			.map((nodeId) => projectStore.activeNodes.find((node) => node.id === nodeId))
			.filter((node): node is NonNullable<typeof node> => !!node);

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			nodes = nodes.filter((node) => {
				const title = projectStore.getNodeDisplayTitle(node).toLowerCase();
				return title.includes(query) || node.content.toLowerCase().includes(query);
			});
		}

		return nodes;
	});

	const sortedNodeIds = $derived.by(() => sortedNodes.map((node) => node.id));
	const breadcrumbPath = $derived(projectStore.getBreadcrumbPath());

	function handleAddNode() {
		projectStore.addChildNode();
		uiStore.showToast('Node added', 'success');
	}
</script>

<div class="h-full flex flex-col">
	<div
		class="flex items-center justify-between border-b px-4 py-2.5"
		style="border-color: var(--border-color);"
	>
		<span class="shell-label">Files</span>
		<button
			onclick={handleAddNode}
			class="shell-button primary px-2.5 py-1 text-[11px]"
			title="Add new node"
		>
			+ New
		</button>
	</div>

	{#if breadcrumbPath.length > 0}
		<div
			class="flex items-center gap-1 overflow-x-auto border-b px-4 py-1.5 text-[11px]"
			style="border-color: var(--border-color);"
		>
			<button
				onclick={() => projectStore.drillToDepth(0)}
				class="shell-button ghost px-2 py-1 text-[11px]"
			>
				Root
			</button>
			{#each breadcrumbPath as crumb, index}
				<span class="shell-hint opacity-40">/</span>
				<button
					onclick={() => projectStore.drillToDepth(index + 1)}
					class="shell-button truncate px-2 py-1 text-[11px]"
					class:primary={index !== breadcrumbPath.length - 1}
					class:ghost={index === breadcrumbPath.length - 1}
					title={crumb.title}
				>
					{crumb.title}
				</button>
			{/each}
		</div>
	{/if}

	<div class="border-b px-3.5 py-2" style="border-color: var(--border-color);">
		<div class="relative">
			<Search size={12} class="absolute left-2 top-1/2 -translate-y-1/2" style="color: var(--text-muted);" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search nodes..."
				class="shell-input plain h-7 w-full pl-7 pr-1 text-[11.5px]"
			/>
		</div>
	</div>

	<div class="flex-1 overflow-y-auto">
		{#if !projectStore.isAtRoot}
			<button
				onclick={() => projectStore.drillUp()}
				class="flex w-full items-center gap-2 border-b px-4 py-2 text-left text-[11px] transition-colors"
				style="border-color: var(--border-color); color: var(--text-secondary);"
				onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-color-light)'}
				onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
			>
				<ArrowUp size={13} />
				<span>Go up to parent</span>
			</button>
		{/if}

		{#each sortedNodes as node}
			<NodeBrowserItem {node} sortedNodeIds={sortedNodeIds} />
		{/each}

		{#if sortedNodes.length === 0}
			<div class="shell-empty-state px-4 py-8 text-[11px]">
				{searchQuery ? 'No matching nodes' : 'No nodes yet'}
			</div>
		{/if}
	</div>

	<div
		class="flex items-center gap-1.5 border-t px-4 py-2.5 text-[10px]"
		style="border-color: var(--border-color);"
	>
		{#if uiStore.hasMultiSelection}
			<span class="shell-pill accent">{uiStore.selectedNodeIds.size} selected</span>
		{/if}
		<span class="shell-hint tabular-nums">{sortedNodes.length} node{sortedNodes.length !== 1 ? 's' : ''}</span>
		<span class="shell-hint opacity-30">·</span>
		<span class="shell-hint tabular-nums">{projectStore.totalWordCount} words</span>
	</div>
</div>
