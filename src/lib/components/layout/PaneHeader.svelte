<script lang="ts">
	interface Props {
		title: string;
		subtitle?: string;
		actions?: { label: string; icon?: string; onclick: () => void }[];
	}

	let { title, subtitle = '', actions = [] }: Props = $props();
</script>

<div
	class="flex items-center justify-between border-b px-4 py-2.5"
	style="border-color: var(--border-color);"
>
	<div class="flex items-center gap-2.5">
		<h3 class="text-[13px] font-medium" style="color: var(--text-primary);">
			{title}
		</h3>
		{#if subtitle}
			<span class="text-[11px]" style="color: var(--text-muted);">
				{subtitle}
			</span>
		{/if}
	</div>

	{#if actions.length > 0}
		<div class="flex items-center gap-1">
			{#each actions as action}
				<button
					class="shell-button px-2 py-1 text-[11px]"
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
