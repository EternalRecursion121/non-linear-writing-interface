<script lang="ts">
	import { Check, AlertCircle, Info } from 'lucide-svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
</script>

{#if uiStore.toasts.length > 0}
	<div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
		{#each uiStore.toasts as toast (toast.id)}
			<div
				class="toast-enter flex items-center gap-2 rounded-[var(--radius-md)] px-3.5 py-2.5 text-[12.5px] font-medium"
				style="background-color: var(--surface-overlay); color: var(--text-primary); border: 1px solid var(--border-color); box-shadow: var(--shadow-lg);"
			>
				{#if toast.type === 'success'}
					<Check size={14} strokeWidth={2.5} style="color: var(--success-color);" />
				{:else if toast.type === 'error'}
					<AlertCircle size={14} strokeWidth={2.5} style="color: var(--error-color);" />
				{:else}
					<Info size={14} strokeWidth={2.5} style="color: var(--text-muted);" />
				{/if}
				{toast.message}
			</div>
		{/each}
	</div>
{/if}
