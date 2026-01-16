<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import type { FontFamily, FontSize } from '$lib/types';

	let isOpen = $state(false);

	const fonts: { id: FontFamily; name: string; description: string }[] = [
		{ id: 'literata', name: 'Literata', description: 'Modern, warm' },
		{ id: 'crimson-pro', name: 'Crimson Pro', description: 'Classic book feel' },
		{ id: 'source-serif-4', name: 'Source Serif', description: 'Clean, professional' },
		{ id: 'eb-garamond', name: 'EB Garamond', description: 'Historical elegance' }
	];

	const sizes: { id: FontSize; label: string }[] = [
		{ id: 'small', label: 'Small' },
		{ id: 'medium', label: 'Medium' },
		{ id: 'large', label: 'Large' },
		{ id: 'xlarge', label: 'X-Large' }
	];

	function selectFont(font: FontFamily) {
		projectStore.updateSettings({ fontFamily: font });
	}

	function selectSize(size: FontSize) {
		projectStore.updateSettings({ fontSize: size });
	}

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}

	function getCurrentFontName(): string {
		return fonts.find((f) => f.id === projectStore.settings.fontFamily)?.name ?? 'Font';
	}
</script>

<svelte:window onclick={(e) => {
	const target = e.target as HTMLElement;
	if (!target.closest('.font-selector')) {
		closeDropdown();
	}
}} />

<div class="font-selector relative">
	<button
		class="flex items-center gap-1 px-2 py-1 text-xs rounded border"
		style="background-color: var(--bg-primary);
		       border-color: var(--border-color);
		       color: var(--text-secondary);"
		onclick={toggleDropdown}
	>
		<span class="font-{projectStore.settings.fontFamily}">
			{getCurrentFontName()}
		</span>
		<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isOpen}
		<div
			class="absolute top-full left-0 mt-1 w-56 rounded-lg shadow-lg border z-50"
			style="background-color: var(--bg-primary); border-color: var(--border-color);"
		>
			<!-- Font Family -->
			<div class="p-2 border-b" style="border-color: var(--border-color);">
				<p class="text-xs font-medium mb-2" style="color: var(--text-muted);">Font Family</p>
				{#each fonts as font}
					<button
						class="w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between hover:opacity-80"
						class:font-medium={projectStore.settings.fontFamily === font.id}
						style="background-color: {projectStore.settings.fontFamily === font.id ? 'var(--bg-tertiary)' : 'transparent'};
						       color: var(--text-primary);"
						onclick={() => selectFont(font.id)}
					>
						<span class="font-{font.id}">{font.name}</span>
						<span class="text-xs" style="color: var(--text-muted);">{font.description}</span>
					</button>
				{/each}
			</div>

			<!-- Font Size -->
			<div class="p-2">
				<p class="text-xs font-medium mb-2" style="color: var(--text-muted);">Font Size</p>
				<div class="flex gap-1">
					{#each sizes as size}
						<button
							class="flex-1 px-2 py-1 rounded text-xs"
							style="background-color: {projectStore.settings.fontSize === size.id ? 'var(--accent-color)' : 'var(--bg-secondary)'};
							       color: {projectStore.settings.fontSize === size.id ? 'white' : 'var(--text-secondary)'};"
							onclick={() => selectSize(size.id)}
						>
							{size.label}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
