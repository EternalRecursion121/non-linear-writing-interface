<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import PaneHeader from '$lib/components/layout/PaneHeader.svelte';

	let textareaRef: HTMLTextAreaElement;
	let localContent = $state('');

	// Sync with selected node's plan content
	$effect(() => {
		const node = projectStore.selectedNode;
		if (node) {
			localContent = node.planContent;
		} else {
			localContent = '';
		}
	});

	function handleInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		localContent = target.value;

		if (projectStore.selectedNode) {
			projectStore.updateNodePlanContent(projectStore.selectedNode.id, localContent);
			uiStore.setAutosaveStatus('unsaved');
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		// Ctrl+L for branching is handled globally
		// Allow normal text editing here
	}

	// Get font and size classes
	function getFontClass(): string {
		return `font-${projectStore.settings.fontFamily}`;
	}

	function getSizeClass(): string {
		return `text-size-${projectStore.settings.fontSize}`;
	}
</script>

<div class="h-full flex flex-col">
	<PaneHeader
		title="Planning"
		subtitle={projectStore.selectedNode ? `Node ${Array.from(projectStore.nodesMap.keys()).indexOf(projectStore.selectedNode.id) + 1}` : ''}
	/>

	<div class="flex-1 overflow-auto p-4">
		{#if projectStore.selectedNode}
			<textarea
				bind:this={textareaRef}
				value={localContent}
				oninput={handleInput}
				onkeydown={handleKeydown}
				placeholder="Write your planning notes here...

Ideas, outlines, character notes, plot points - anything that helps you write.

This content will be copied to child nodes when you branch."
				class="w-full h-full resize-none outline-none {getFontClass()} {getSizeClass()}"
				style="background-color: transparent; color: var(--text-primary);"
			></textarea>
		{:else}
			<div class="flex items-center justify-center h-full">
				<p style="color: var(--text-muted);">
					Select a node to edit its planning notes
				</p>
			</div>
		{/if}
	</div>
</div>
