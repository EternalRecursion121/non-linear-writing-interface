<script lang="ts">
	import { BookOpen, Moon, Sun } from 'lucide-svelte';
	import type { ComponentType } from 'svelte';
	import type { Theme } from '$lib/types/project';
	import { projectStore } from '$lib/stores/project.svelte';

	const themes: { id: Theme; icon: ComponentType; label: string }[] = [
		{ id: 'light', icon: Sun, label: 'Light' },
		{ id: 'dark', icon: Moon, label: 'Dark' },
		{ id: 'sepia', icon: BookOpen, label: 'Sepia' }
	];

	function cycleTheme() {
		const currentIndex = themes.findIndex((theme) => theme.id === projectStore.settings.theme);
		const nextTheme = themes[(currentIndex + 1) % themes.length] ?? themes[0];
		projectStore.setTheme(nextTheme.id);
	}
</script>

<button
	class="shell-button text-xs"
	onclick={cycleTheme}
	title="Toggle theme"
>
	<svelte:component
		this={themes.find((theme) => theme.id === projectStore.settings.theme)?.icon ?? themes[0].icon}
		size={13}
		strokeWidth={2}
	/>
	<span>{themes.find((theme) => theme.id === projectStore.settings.theme)?.label ?? themes[0].label}</span>
</button>
