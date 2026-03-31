<script lang="ts">
	import { tick } from 'svelte';
	import type { WritingNode } from '$lib/types/project';
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import { Folder, FileText, FolderPlus, Pencil, Trash2 } from 'lucide-svelte';

	interface Props {
		node: WritingNode;
		depth?: number;
		sortedNodeIds?: string[];
	}

	let { node, depth = 0, sortedNodeIds = [] }: Props = $props();

	let isRenaming = $state(false);
	let renameValue = $state('');
	let isExpanded = $state(false);
	let renameInput = $state<HTMLInputElement | null>(null);

	const isPrimarySelected = $derived(projectStore.selectedNode?.id === node.id);
	const isMultiSelected = $derived(uiStore.isNodeSelected(node.id));
	const isSelected = $derived(isPrimarySelected || isMultiSelected);
	const displayTitle = $derived(projectStore.getNodeDisplayTitle(node));
	const wordCount = $derived(projectStore.getWordCount(node.content));

	function handleClick(event: MouseEvent) {
		const ctrlOrMeta = event.ctrlKey || event.metaKey;

		if (ctrlOrMeta && event.shiftKey) {
			uiStore.selectNodeRange(node.id, sortedNodeIds);
		} else if (ctrlOrMeta) {
			uiStore.toggleNodeSelection(node.id);
		} else {
			uiStore.clearMultiSelection();
			projectStore.selectNode(node.id);
			uiStore.setSingleSelection(node.id);
			uiStore.setRightPaneMode('writing');
		}
	}

	function handleDoubleClick() {
		if (node.subProject) {
			projectStore.drillInto(node.id);
		} else {
			startRename();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			uiStore.clearMultiSelection();
			projectStore.selectNode(node.id);
			uiStore.setSingleSelection(node.id);
			uiStore.setRightPaneMode('writing');
		}
	}

	function startRename(event?: MouseEvent) {
		event?.stopPropagation();
		isRenaming = true;
		renameValue = node.title ?? '';
	}

	$effect(() => {
		if (isRenaming && renameInput) {
			tick().then(() => renameInput?.focus());
		}
	});

	function finishRename() {
		if (!isRenaming) {
			return;
		}

		projectStore.selectNode(node.id);
		projectStore.renameSelectedNode(renameValue);
		uiStore.setAutosaveStatus('unsaved');
		isRenaming = false;
	}

	function handleDelete(event: MouseEvent) {
		event.stopPropagation();
		projectStore.selectNode(node.id);

		const children = projectStore.getChildren(node.id);
		if (children.length > 0 || node.subProject) {
			const confirmed = confirm(
				`This node has ${children.length} child node(s)${node.subProject ? ' and a sub-project' : ''}. Delete anyway?`
			);
			if (!confirmed) {
				return;
			}
		}

		if (projectStore.deleteNode(node.id)) {
			uiStore.showToast('Node deleted', 'info');
		}
	}

	function handleCreateSubProject(event: MouseEvent) {
		event.stopPropagation();
		projectStore.createSubProject(node.id);
		uiStore.showToast('Sub-project created', 'success');
	}
</script>

<div class="node-browser-item" class:selected={isSelected} style="padding-left: {12 + depth * 16}px;">
	<div
		class="node-browser-row flex w-full cursor-pointer items-center gap-1.5 py-1.5 pr-2.5 text-left"
		class:primary-selected={isPrimarySelected}
		class:multi-selected={isMultiSelected}
		onclick={handleClick}
		ondblclick={handleDoubleClick}
		onkeydown={handleKeydown}
		role="button"
		tabindex="0"
	>
		{#if node.subProject}
			<button
				onclick={(event) => {
					event.stopPropagation();
					isExpanded = !isExpanded;
				}}
				class="w-4 h-4 flex items-center justify-center text-[9px] opacity-50 hover:opacity-100 transition-opacity"
				type="button"
			>
				{isExpanded ? '▼' : '▶'}
			</button>
		{:else}
			<span class="w-4"></span>
		{/if}

		<span style="color: {node.subProject ? 'var(--accent-color)' : 'var(--text-muted)'};">
			{#if node.subProject}
				<Folder size={12} />
			{:else}
				<FileText size={12} />
			{/if}
		</span>

		{#if isRenaming}
			<input
				bind:this={renameInput}
				type="text"
				bind:value={renameValue}
				onblur={finishRename}
				onkeydown={(event) => {
					event.stopPropagation();
					if (event.key === 'Enter') finishRename();
					if (event.key === 'Escape') isRenaming = false;
				}}
				onclick={(event) => event.stopPropagation()}
				class="shell-input h-6 flex-1 px-2 text-[11px]"
			/>
		{:else}
			<span
				class="flex-1 truncate text-[11.5px]"
				style="color: {isPrimarySelected ? 'var(--accent-color)' : 'var(--text-primary)'}; font-weight: {isPrimarySelected ? '550' : '400'};"
				title={displayTitle}
			>
				{displayTitle}
			</span>
		{/if}

		<span class="mr-1 text-[9.5px] tabular-nums" style="color: var(--text-muted); opacity: 0.6;">{wordCount}</span>

		<div class="node-actions flex items-center gap-0.5 opacity-0 transition-opacity">
			{#if !node.subProject}
				<button
					onclick={handleCreateSubProject}
					class="shell-button shell-icon-button h-5.5 w-5.5"
					title="Create sub-project"
					type="button"
				>
					<FolderPlus size={11} />
				</button>
			{/if}
			<button
				onclick={startRename}
				class="shell-button shell-icon-button h-5.5 w-5.5"
				title="Rename"
				type="button"
			>
				<Pencil size={11} />
			</button>
			{#if projectStore.activeNodes.length > 1}
				<button
					onclick={handleDelete}
					class="shell-button shell-icon-button danger h-5.5 w-5.5"
					title="Delete"
					type="button"
				>
					<Trash2 size={11} />
				</button>
			{/if}
		</div>
	</div>

	{#if node.subProject && isExpanded}
		<div class="subproject-preview ml-4 border-l pl-3" style="border-color: var(--border-color);">
			{#each node.subProject.nodes.slice(0, 5) as subNode}
				<div
					class="flex items-center gap-1.5 truncate px-2 py-1 text-[10.5px]"
					style="color: var(--text-muted);"
					title={projectStore.getNodeDisplayTitle(subNode)}
				>
					<FileText size={10} /> {projectStore.getNodeDisplayTitle(subNode)}
				</div>
			{/each}
			{#if node.subProject.nodes.length > 5}
				<div class="text-[10.5px] py-1 px-2" style="color: var(--text-muted); opacity: 0.6;">
					+{node.subProject.nodes.length - 5} more...
				</div>
			{/if}
			<button
				onclick={() => projectStore.drillInto(node.id)}
				class="shell-button ghost mt-1 w-full justify-start px-2 py-1 text-[11px]"
				type="button"
			>
				Open sub-project →
			</button>
		</div>
	{/if}
</div>

<style>
	.node-browser-row {
		background-color: transparent;
		border-radius: var(--radius-sm);
		transition: background-color 0.1s ease;
	}

	.node-browser-row.primary-selected {
		background-color: var(--accent-color-light);
	}

	.node-browser-row.multi-selected:not(.primary-selected) {
		background-color: color-mix(in srgb, var(--surface-inset) 60%, transparent);
	}

	.node-browser-row:hover {
		background-color: color-mix(in srgb, var(--surface-inset) 50%, transparent);
	}

	.node-browser-row.primary-selected:hover {
		background-color: var(--accent-color-light);
	}

	.node-browser-item:hover .node-actions {
		opacity: 1;
	}
</style>
