<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';
	import { projectStore } from '$lib/stores/project.svelte';
	import type { FontFamily, FontSize } from '$lib/types/project';

	let isOpen = $state(false);

	const fonts: { id: FontFamily; name: string; description: string }[] = [
		{ id: 'literata', name: 'Literata', description: 'Modern, warm' },
		{ id: 'crimson-pro', name: 'Crimson Pro', description: 'Classic book feel' },
		{ id: 'source-serif-4', name: 'Source Serif', description: 'Clean, professional' },
		{ id: 'eb-garamond', name: 'EB Garamond', description: 'Historical elegance' }
	];

	const sizes: { id: FontSize; label: string }[] = [
		{ id: 'small', label: 'S' },
		{ id: 'medium', label: 'M' },
		{ id: 'large', label: 'L' },
		{ id: 'xlarge', label: 'XL' }
	];
</script>

<svelte:window onclick={(event) => {
	const target = event.target as HTMLElement;
	if (!target.closest('.font-selector')) {
		isOpen = false;
	}
}} />

<div class="font-selector relative">
	<button
		class="shell-button text-xs"
		onclick={() => (isOpen = !isOpen)}
	>
		<span class="font-{projectStore.settings.fontFamily}">
			{fonts.find((font) => font.id === projectStore.settings.fontFamily)?.name ?? 'Font'}
		</span>
		<ChevronDown size={12} strokeWidth={2} />
	</button>

	{#if isOpen}
		<div
			class="shell-modal absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-[var(--radius-xl)]"
		>
			<div class="border-b p-3" style="border-color: var(--border-color);">
				<p class="shell-label mb-2.5">Font Family</p>
				<div class="space-y-0.5">
					{#each fonts as font}
						<button
							class="font-item flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-[12.5px]"
							class:active={projectStore.settings.fontFamily === font.id}
							onclick={() => projectStore.setFontFamily(font.id)}
						>
							<span class="font-{font.id}" style="color: var(--text-primary);">{font.name}</span>
							<span class="text-[10px]" style="color: var(--text-muted);">{font.description}</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="p-3">
				<p class="shell-label mb-2.5">Size</p>
				<div class="flex gap-1">
					{#each sizes as size}
						<button
							class="shell-button flex-1 py-1.5 text-[11px] font-medium"
							class:active={projectStore.settings.fontSize === size.id}
							onclick={() => projectStore.setFontSize(size.id)}
						>
							{size.label}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.font-item {
		transition: background-color 0.1s ease;
	}

	.font-item:hover {
		background-color: var(--accent-color-light);
	}

	.font-item.active {
		background-color: var(--accent-color);
		color: var(--accent-contrast);
	}

	.font-item.active span {
		color: var(--accent-contrast) !important;
	}
</style>
