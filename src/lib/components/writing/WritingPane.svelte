<script lang="ts">
	import { executeCommand } from '$lib/commands';
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import NodeBreadcrumb from './NodeBreadcrumb.svelte';
	import WordCountGoal from './WordCountGoal.svelte';
	import WritingEditor from './WritingEditor.svelte';
	import { Folder, FolderPlus, Trash2 } from 'lucide-svelte';

	let localTitle = $state('');

	$effect(() => {
		localTitle = projectStore.selectedNode?.title ?? '';
	});

	function handleTitleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		localTitle = target.value;
		projectStore.renameSelectedNode(target.value);
		uiStore.setAutosaveStatus('unsaved');
	}

	function handleCreateSubProject() {
		if (!projectStore.selectedNode) {
			return;
		}

		projectStore.createSubProject(projectStore.selectedNode.id);
		uiStore.showToast('Sub-project created', 'success');
	}

	function handleDrillInto() {
		projectStore.drillIntoSelectedNode();
	}
</script>

<div class="h-full flex flex-col">
	{#if projectStore.selectedNode}
		<NodeBreadcrumb />
	{/if}

	{#if projectStore.selectedNode}
		<div
			class="flex items-center gap-2 border-b px-4 py-2"
			style="border-color: var(--border-color);"
		>
			<input
				type="text"
				value={localTitle}
				oninput={handleTitleChange}
				placeholder="Node title (optional)"
				class="shell-input plain h-8 flex-1 px-1 text-sm"
				style="font-weight: 600; font-size: 14px; letter-spacing: -0.02em;"
			/>

			{#if projectStore.selectedNode.subProject}
				<button
					onclick={handleDrillInto}
					class="shell-button primary px-2.5 py-1 text-xs"
					title="Open sub-project"
				>
					<Folder size={12} /> Open
				</button>
			{:else}
				<button
					onclick={handleCreateSubProject}
					class="shell-button shell-icon-button"
					title="Create sub-project inside this node"
				>
					<FolderPlus size={14} />
				</button>
			{/if}

			{#if projectStore.activeNodes.length > 1}
				<button
					onclick={() => executeCommand('delete-selected-node')}
					class="shell-button shell-icon-button danger"
					title="Delete node"
				>
					<Trash2 size={14} />
				</button>
			{/if}
		</div>
	{/if}

	<div class="flex-1 overflow-hidden">
		{#if projectStore.selectedNode}
			<WritingEditor />
		{:else}
			<div class="flex items-center justify-center h-full">
				<div class="shell-empty-state px-8">
					<p class="mb-2" style="font-weight: 600; font-size: 15px; letter-spacing: -0.02em; color: var(--text-secondary);">No node selected</p>
					<p class="text-xs" style="color: var(--text-muted);">
						Click a node in the DAG view or press Tab to navigate
					</p>
				</div>
			</div>
		{/if}
	</div>

	{#if projectStore.selectedNode?.wordCountGoal}
		<WordCountGoal />
	{/if}
</div>
