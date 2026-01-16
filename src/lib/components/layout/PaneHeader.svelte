<script lang="ts">
	interface Props {
		title: string;
		subtitle?: string;
		actions?: { label: string; icon?: string; onclick: () => void }[];
	}

	let { title, subtitle = '', actions = [] }: Props = $props();
</script>

<div
	class="flex items-center justify-between px-4 py-2 border-b"
	style="background-color: var(--bg-tertiary); border-color: var(--border-color);"
>
	<div class="flex items-center gap-2">
		<h3 class="font-medium text-sm" style="color: var(--text-primary);">
			{title}
		</h3>
		{#if subtitle}
			<span class="text-xs" style="color: var(--text-muted);">
				{subtitle}
			</span>
		{/if}
	</div>

	{#if actions.length > 0}
		<div class="flex items-center gap-1">
			{#each actions as action}
				<button
					class="px-2 py-1 text-xs rounded hover:opacity-80 transition-opacity"
					style="background-color: var(--bg-secondary); color: var(--text-secondary);"
					onclick={action.onclick}
				>
					{#if action.icon}
						<span>{action.icon}</span>
					{/if}
					{action.label}
				</button>
			{/each}
		</div>
	{/if}
</div>
