<script lang="ts">
	import { uiStore } from '$lib/stores/ui.svelte';

	function getToastStyle(type: 'info' | 'success' | 'error'): string {
		switch (type) {
			case 'success':
				return 'background-color: var(--success-color); color: white;';
			case 'error':
				return 'background-color: var(--error-color); color: white;';
			default:
				return 'background-color: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color);';
		}
	}
</script>

{#if uiStore.toasts.length > 0}
	<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
		{#each uiStore.toasts as toast (toast.id)}
			<div
				class="px-4 py-2 rounded-lg shadow-lg text-sm toast-enter"
				style={getToastStyle(toast.type)}
			>
				{toast.message}
			</div>
		{/each}
	</div>
{/if}
