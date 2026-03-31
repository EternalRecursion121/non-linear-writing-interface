<script lang="ts">
	import { Plus, LayoutGrid, FileText } from 'lucide-svelte';
	import { uiStore } from '$lib/stores/ui.svelte';

	interface Props {
		onAutoLayout: () => void;
		onAddNode: () => void;
	}

	let { onAutoLayout, onAddNode }: Props = $props();
</script>

<div
	class="absolute right-4 top-4 flex flex-col gap-1.5"
>
	<button
		class="shell-button primary shell-icon-button"
		onclick={onAddNode}
		title="Add new node"
	>
		<Plus size={16} strokeWidth={2.5} />
	</button>

	<button
		class="shell-button shell-icon-button"
		onclick={onAutoLayout}
		title="Auto-layout nodes"
	>
		<LayoutGrid size={15} strokeWidth={2} />
	</button>

	<button
		class="shell-button shell-icon-button"
		onclick={() => uiStore.openCompileModal()}
		title="Compile story"
	>
		<FileText size={15} strokeWidth={2} />
	</button>
</div>
