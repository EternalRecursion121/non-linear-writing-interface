<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import { getNextNode, getPreviousNode } from '$lib/utils/dag';
	import WritingEditor from './WritingEditor.svelte';
	import NodeBreadcrumb from './NodeBreadcrumb.svelte';
	import WordCountGoal from './WordCountGoal.svelte';
	import { Folder, FolderPlus, Trash2 } from 'lucide-svelte';

	interface Props {
		handleBranch: (cursorPosition: number) => void;
		setBranchCallback: (callback: (cursorPosition: number) => void) => void;
		handleParallelize: (selectionStart: number, selectionEnd: number) => void;
		setParallelizeCallback: (callback: (selectionStart: number, selectionEnd: number) => void) => void;
	}

	let { handleBranch, setBranchCallback, handleParallelize, setParallelizeCallback }: Props = $props();

	let localTitle = $state('');

	// Sync title with selected node
	$effect(() => {
		const node = projectStore.selectedNode;
		localTitle = node?.title || '';
	});

	function handleTitleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		localTitle = target.value;
		if (projectStore.selectedNode) {
			projectStore.renameNode(projectStore.selectedNode.id, localTitle);
			uiStore.setAutosaveStatus('unsaved');
		}
	}

	function handleDeleteNode() {
		const selectedId = projectStore.viewState.selectedNodeId;
		if (selectedId && projectStore.nodesMap.size > 1) {
			// Get next/previous node for navigation after delete
			const nextId = getNextNode(selectedId, projectStore.nodesMap, projectStore.edges);
			const prevId = getPreviousNode(selectedId, projectStore.nodesMap, projectStore.edges);

			// Check if node has children
			const children = projectStore.getChildren(selectedId);
			if (children.length > 0) {
				const confirmed = confirm(
					`This node has ${children.length} child node(s). Delete anyway?`
				);
				if (!confirmed) return;
			}

			projectStore.deleteNode(selectedId);
			projectStore.selectNode(nextId || prevId || null);
			uiStore.showToast('Node deleted', 'info');
		}
	}

	function handleCreateSubProject() {
		const selectedId = projectStore.viewState.selectedNodeId;
		if (selectedId && !projectStore.hasSubProject(selectedId)) {
			projectStore.createSubProject(selectedId);
			uiStore.showToast('Sub-project created', 'success');
		}
	}

	function handleDrillInto() {
		const selectedId = projectStore.viewState.selectedNodeId;
		if (selectedId && projectStore.hasSubProject(selectedId)) {
			projectStore.drillInto(selectedId);
		}
	}
</script>

<div class="h-full flex flex-col" style="background-color: var(--bg-primary);">
	<!-- Breadcrumb -->
	{#if projectStore.selectedNode}
		<NodeBreadcrumb />
	{/if}

	<!-- Title & Actions Header -->
	{#if projectStore.selectedNode}
		<div
			class="px-4 py-2 border-b flex items-center gap-2"
			style="border-color: var(--border-color);"
		>
			<!-- Title Input -->
			<input
				type="text"
				value={localTitle}
				oninput={handleTitleChange}
				placeholder="Node title (optional)"
				class="flex-1 px-2 py-1 text-sm rounded border"
				style="background-color: var(--bg-secondary);
				       border-color: var(--border-color);
				       color: var(--text-primary);"
			/>

			<!-- SubProject Actions -->
			{#if projectStore.hasSubProject(projectStore.selectedNode.id)}
				<button
					onclick={handleDrillInto}
					class="px-2 py-1 text-xs rounded border transition-colors hover:opacity-80 flex items-center gap-1"
					style="background-color: var(--accent-color);
					       border-color: var(--accent-color);
					       color: white;"
					title="Open sub-project"
				>
					<Folder size={12} /> Open
				</button>
			{:else}
				<button
					onclick={handleCreateSubProject}
					class="px-2 py-1 text-xs rounded border transition-colors hover:opacity-80"
					style="background-color: var(--bg-secondary);
					       border-color: var(--border-color);
					       color: var(--text-secondary);"
					title="Create sub-project inside this node"
				>
					<FolderPlus size={14} />
				</button>
			{/if}

			<!-- Delete Button -->
			{#if projectStore.nodesMap.size > 1}
				<button
					onclick={handleDeleteNode}
					class="px-2 py-1 text-xs rounded border transition-colors hover:opacity-80"
					style="background-color: var(--bg-secondary);
					       border-color: var(--border-color);
					       color: var(--error-color);"
					title="Delete node"
				>
					<Trash2 size={14} />
				</button>
			{/if}
		</div>
	{/if}

	<!-- Editor -->
	<div class="flex-1 overflow-hidden">
		{#if projectStore.selectedNode}
			<WritingEditor {handleBranch} {setBranchCallback} {handleParallelize} {setParallelizeCallback} />
		{:else}
			<div class="flex items-center justify-center h-full">
				<div class="text-center">
					<p style="color: var(--text-muted);" class="mb-2">
						No node selected
					</p>
					<p style="color: var(--text-muted);" class="text-sm">
						Click a node in the DAG view or press Tab to navigate
					</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Word Count Goal (if set) -->
	{#if projectStore.selectedNode?.wordCountGoal}
		<WordCountGoal />
	{/if}
</div>
