<script lang="ts">
	import { Folder } from 'lucide-svelte';
	import { projectStore } from '$lib/stores/project.svelte';

	const projectPath = $derived(projectStore.getBreadcrumbPath());

	function getNodePath() {
		const selectedNodeId = projectStore.selectedNode?.id;
		if (!selectedNodeId) {
			return [];
		}

		return projectStore.getNodePath(selectedNodeId).map((nodeId) => {
			const node = projectStore.activeNodes.find((candidate) => candidate.id === nodeId);
			return {
				id: nodeId,
				title: node ? projectStore.getNodeDisplayTitle(node) : 'Unknown'
			};
		});
	}

	const nodePath = $derived(getNodePath());
</script>

<div
	class="flex items-center gap-1 overflow-x-auto border-b px-4 py-1.5 text-[11px]"
	style="border-color: var(--border-color);"
>
	{#if projectPath.length > 0}
		<button
			class="shell-button ghost whitespace-nowrap px-2 py-1 text-[11px]"
			onclick={() => projectStore.drillToDepth(0)}
			title="Go to root project"
		>
			Root
		</button>

		{#each projectPath as crumb, index}
			<span class="shell-hint opacity-40">/</span>
			<button
				class="shell-button ghost flex items-center gap-1 whitespace-nowrap px-2 py-1 text-[11px]"
				onclick={() => projectStore.drillToDepth(index + 1)}
				title="Go to {crumb.title}"
			>
				<Folder size={11} />
				{crumb.title}
			</button>
		{/each}

		<span class="mx-1.5 h-3 w-px" style="background: var(--border-color);"></span>
	{/if}

	{#each nodePath as item, index}
		{#if index > 0}
			<span class="shell-hint opacity-40">→</span>
		{/if}
		<button
			class="shell-button whitespace-nowrap px-2 py-1 max-w-[120px] truncate text-[11px]"
			class:active={index === nodePath.length - 1}
			class:ghost={index !== nodePath.length - 1}
			onclick={() => projectStore.selectNode(item.id)}
			title={item.title}
		>
			{item.title}
		</button>
	{/each}
</div>
