<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import type { Theme } from '$lib/types';

	const themes: { id: Theme; icon: string; label: string }[] = [
		{ id: 'light', icon: '☀️', label: 'Light' },
		{ id: 'dark', icon: '🌙', label: 'Dark' },
		{ id: 'sepia', icon: '📜', label: 'Sepia' }
	];

	function cycleTheme() {
		const currentIndex = themes.findIndex((t) => t.id === projectStore.settings.theme);
		const nextIndex = (currentIndex + 1) % themes.length;
		projectStore.updateSettings({ theme: themes[nextIndex].id });
	}

	function getCurrentTheme() {
		return themes.find((t) => t.id === projectStore.settings.theme) ?? themes[0];
	}
</script>

<button
	class="flex items-center gap-1 px-2 py-1 text-xs rounded border"
	style="background-color: var(--bg-primary);
	       border-color: var(--border-color);
	       color: var(--text-secondary);"
	onclick={cycleTheme}
	title="Toggle theme"
>
	<span>{getCurrentTheme().icon}</span>
	<span>{getCurrentTheme().label}</span>
</button>
