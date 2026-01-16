<script lang="ts">
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import { loadProjectFromFile, loadFromLocalStorage } from '$lib/utils/persistence';
	import { onMount } from 'svelte';

	onMount(async () => {
		// Try to load from server first, fall back to localStorage
		const loaded = await loadProjectFromFile();
		if (!loaded) {
			loadFromLocalStorage();
		}
	});
</script>

<svelte:head>
	<title>Non-Linear Writing Interface</title>
	<meta name="description" content="A keyboard-native, node-based writing interface with branching and DAG visualization" />
</svelte:head>

<AppShell />
