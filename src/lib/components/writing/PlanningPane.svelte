<script lang="ts">
	import PaneHeader from '$lib/components/layout/PaneHeader.svelte';
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';

	let localContent = $state('');

	$effect(() => {
		localContent = projectStore.selectedNode?.planContent ?? '';
	});

	function handleInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		localContent = target.value;
		projectStore.updateSelectedNodePlanContent(target.value);
		uiStore.setAutosaveStatus('unsaved');
	}
</script>

<div class="h-full flex flex-col">
	<PaneHeader
		title="Planning"
		subtitle={projectStore.selectedNode ? `Node ${projectStore.activeNodes.findIndex((node) => node.id === projectStore.selectedNode?.id) + 1}` : ''}
	/>

	<div class="flex-1 overflow-auto px-5 py-4">
		{#if projectStore.selectedNode}
			<textarea
				value={localContent}
				oninput={handleInput}
				placeholder="Write your planning notes here...

Ideas, outlines, character notes, plot points - anything that helps you write.

This content will be copied to child nodes when you branch."
				class="planning-editor shell-textarea plain h-full w-full px-0.5 py-0.5 outline-none font-{projectStore.settings.fontFamily} text-size-{projectStore.settings.fontSize}"
			></textarea>
		{:else}
			<div class="flex items-center justify-center h-full">
				<p class="shell-empty-state text-xs">Select a node to edit its planning notes</p>
			</div>
		{/if}
	</div>
</div>
