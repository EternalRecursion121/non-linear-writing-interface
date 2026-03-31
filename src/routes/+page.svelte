<script lang="ts">
	import { onMount } from 'svelte';
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import {
		createProjectPersistenceController,
		loadFromLocalStorage,
		loadProjectFromFile
	} from '$lib/persistence/project';

	onMount(() => {
		let stopAutosave: (() => void) | null = null;

		async function hydrate() {
			const loaded = await loadProjectFromFile();
			if (!loaded) {
				loadFromLocalStorage();
				projectStore.markHydrated();
			}

			uiStore.setAutosaveStatus('saved');
			stopAutosave = createProjectPersistenceController().stop;
		}

		void hydrate();

		return () => {
			stopAutosave?.();
		};
	});

	$effect(() => {
		document.body.setAttribute('data-theme', projectStore.settings.theme);
	});
</script>

<svelte:head>
	<title>Non-Linear Writing Interface</title>
	<meta
		name="description"
		content="A keyboard-native, node-based writing interface with branching and DAG visualization"
	/>
</svelte:head>

<AppShell />
