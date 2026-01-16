<script lang="ts">
	import type { WritingNode } from '$lib/types';
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import { getNextNode, getPreviousNode } from '$lib/utils/dag';
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

	const isPrimarySelected = $derived(projectStore.viewState.selectedNodeId === node.id);
	const isMultiSelected = $derived(uiStore.isNodeSelected(node.id));
	const isSelected = $derived(isPrimarySelected || isMultiSelected);
	const hasSubProject = $derived(!!node.subProject);
	const wordCount = $derived(projectStore.getWordCount(node.content));
	const displayTitle = $derived(projectStore.getNodeDisplayTitle(node));

	function handleClick(e: MouseEvent) {
		const ctrlOrMeta = e.ctrlKey || e.metaKey;

		if (ctrlOrMeta && e.shiftKey) {
			// Ctrl+Shift+click: range selection
			uiStore.selectNodeRange(node.id, sortedNodeIds);
		} else if (ctrlOrMeta) {
			// Ctrl+click: toggle selection
			uiStore.toggleNodeSelection(node.id);
		} else {
			// Regular click: single selection, clear multi-select
			uiStore.clearMultiSelection();
			projectStore.selectNode(node.id);
			uiStore.setSingleSelection(node.id);
			uiStore.setRightPaneMode('writing');
		}
	}

	function handleDoubleClick() {
		if (hasSubProject) {
			projectStore.drillInto(node.id);
		} else {
			startRename();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			// Simulate regular click behavior for keyboard
			uiStore.clearMultiSelection();
			projectStore.selectNode(node.id);
			uiStore.setSingleSelection(node.id);
			uiStore.setRightPaneMode('writing');
		}
	}

	function toggleExpand(e: MouseEvent) {
		e.stopPropagation();
		isExpanded = !isExpanded;
	}

	function startRename(e?: MouseEvent) {
		e?.stopPropagation();
		isRenaming = true;
		renameValue = node.title || '';
	}

	function finishRename() {
		if (isRenaming) {
			projectStore.renameNode(node.id, renameValue);
			uiStore.setAutosaveStatus('unsaved');
			isRenaming = false;
		}
	}

	function handleRenameKeydown(e: KeyboardEvent) {
		e.stopPropagation();
		if (e.key === 'Enter') {
			finishRename();
		} else if (e.key === 'Escape') {
			isRenaming = false;
		}
	}

	function handleDelete(e: MouseEvent) {
		e.stopPropagation();
		if (projectStore.nodesMap.size > 1) {
			const children = projectStore.getChildren(node.id);
			if (children.length > 0 || hasSubProject) {
				const confirmed = confirm(
					`This node has ${children.length} child node(s)${hasSubProject ? ' and a sub-project' : ''}. Delete anyway?`
				);
				if (!confirmed) return;
			}

			const nextId = getNextNode(node.id, projectStore.nodesMap, projectStore.edges);
			const prevId = getPreviousNode(node.id, projectStore.nodesMap, projectStore.edges);
			projectStore.deleteNode(node.id);
			projectStore.selectNode(nextId || prevId || null);
			uiStore.showToast('Node deleted', 'info');
		}
	}

	function handleCreateSubProject(e: MouseEvent) {
		e.stopPropagation();
		if (!hasSubProject) {
			projectStore.createSubProject(node.id);
			uiStore.showToast('Sub-project created', 'success');
		}
	}
</script>

<div
	class="node-browser-item"
	class:selected={isSelected}
	style="padding-left: {12 + depth * 16}px;"
>
	<!-- Main row as a focusable div -->
	<div
		class="w-full flex items-center gap-1.5 py-1.5 pr-2 text-left transition-colors cursor-pointer"
		style="background-color: {isPrimarySelected ? 'var(--accent-color-light)' : isMultiSelected ? 'var(--bg-tertiary)' : 'transparent'};"
		onclick={handleClick}
		ondblclick={handleDoubleClick}
		onkeydown={handleKeydown}
		role="button"
		tabindex="0"
	>
		<!-- Expand button for subprojects -->
		{#if hasSubProject}
			<button
				onclick={toggleExpand}
				class="w-4 h-4 flex items-center justify-center text-xs opacity-60 hover:opacity-100"
				type="button"
			>
				{isExpanded ? '▼' : '▶'}
			</button>
		{:else}
			<span class="w-4"></span>
		{/if}

		<!-- Icon -->
		<span class="opacity-70">
			{#if hasSubProject}
				<Folder size={12} />
			{:else}
				<FileText size={12} />
			{/if}
		</span>

		<!-- Title (editable when renaming) -->
		{#if isRenaming}
			<!-- svelte-ignore a11y_autofocus -->
			<input
				type="text"
				bind:value={renameValue}
				onblur={finishRename}
				onkeydown={handleRenameKeydown}
				onclick={(e) => e.stopPropagation()}
				class="flex-1 text-xs px-1 py-0.5 rounded border"
				style="background-color: var(--bg-primary);
				       border-color: var(--border-color);
				       color: var(--text-primary);"
				autofocus
			/>
		{:else}
			<span
				class="flex-1 text-xs truncate"
				style="color: {isSelected ? 'var(--accent-color)' : 'var(--text-primary)'};"
				title={displayTitle}
			>
				{displayTitle}
			</span>
		{/if}

		<!-- Word count -->
		<span class="text-[10px] opacity-50 mr-1">{wordCount}</span>

		<!-- Actions (show on hover via CSS) -->
		<div class="node-actions flex items-center gap-0.5 opacity-0 transition-opacity">
			{#if !hasSubProject}
				<button
					onclick={handleCreateSubProject}
					class="p-0.5 rounded hover:bg-black/10"
					title="Create sub-project"
					type="button"
				>
					<FolderPlus size={12} />
				</button>
			{/if}
			<button
				onclick={startRename}
				class="p-0.5 rounded hover:bg-black/10"
				title="Rename"
				type="button"
			>
				<Pencil size={12} />
			</button>
			{#if projectStore.nodesMap.size > 1}
				<button
					onclick={handleDelete}
					class="p-0.5 rounded hover:bg-black/10"
					title="Delete"
					style="color: var(--error-color);"
					type="button"
				>
					<Trash2 size={12} />
				</button>
			{/if}
		</div>
	</div>

	<!-- Expanded subproject nodes (preview) -->
	{#if hasSubProject && isExpanded && node.subProject}
		<div class="subproject-preview pl-4 border-l ml-4" style="border-color: var(--border-color);">
			{#each node.subProject.nodes.slice(0, 5) as subNode}
				<div
					class="text-xs py-1 px-2 truncate opacity-60 flex items-center gap-1"
					style="color: var(--text-secondary);"
					title={projectStore.getNodeDisplayTitle(subNode)}
				>
					<FileText size={10} /> {projectStore.getNodeDisplayTitle(subNode)}
				</div>
			{/each}
			{#if node.subProject.nodes.length > 5}
				<div class="text-xs py-1 px-2 opacity-40" style="color: var(--text-muted);">
					+{node.subProject.nodes.length - 5} more...
				</div>
			{/if}
			<button
				onclick={() => projectStore.drillInto(node.id)}
				class="text-xs py-1 px-2 w-full text-left"
				style="color: var(--accent-color);"
				type="button"
			>
				Open sub-project →
			</button>
		</div>
	{/if}
</div>

<style>
	.node-browser-item:hover .node-actions {
		opacity: 1;
	}
</style>
