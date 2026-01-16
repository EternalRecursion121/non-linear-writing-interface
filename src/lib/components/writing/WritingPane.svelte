<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import WritingEditor from './WritingEditor.svelte';
	import NodeBreadcrumb from './NodeBreadcrumb.svelte';
	import WordCountGoal from './WordCountGoal.svelte';

	interface Props {
		handleBranch: (cursorPosition: number) => void;
		setBranchCallback: (callback: (cursorPosition: number) => void) => void;
	}

	let { handleBranch, setBranchCallback }: Props = $props();
</script>

<div class="h-full flex flex-col" style="background-color: var(--bg-primary);">
	<!-- Breadcrumb -->
	{#if projectStore.selectedNode}
		<NodeBreadcrumb />
	{/if}

	<!-- Editor -->
	<div class="flex-1 overflow-hidden">
		{#if projectStore.selectedNode}
			<WritingEditor {handleBranch} {setBranchCallback} />
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
