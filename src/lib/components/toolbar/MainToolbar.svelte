<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import FontSelector from './FontSelector.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	function handleNew() {
		if (confirm('Create a new project? This will clear current work.')) {
			projectStore.reset();
			uiStore.showToast('New project created', 'success');
		}
	}

	function handleHelp() {
		uiStore.toggleShortcutOverlay();
	}

	function handleNameChange(e: Event) {
		const target = e.target as HTMLInputElement;
		projectStore.setName(target.value);
	}
</script>

<header
	class="h-12 flex items-center justify-between px-4 border-b"
	style="background-color: var(--bg-secondary); border-color: var(--border-color);"
>
	<!-- Left section: Project name and file operations -->
	<div class="flex items-center gap-3">
		<input
			type="text"
			value={projectStore.name}
			oninput={handleNameChange}
			class="bg-transparent border-none outline-none font-medium text-sm w-40"
			style="color: var(--text-primary);"
			placeholder="Project name"
		/>

		<button
			class="p-1.5 rounded hover:opacity-70 transition-opacity border-l pl-3"
			style="color: var(--text-secondary); border-color: var(--border-color);"
			onclick={handleNew}
			title="New project"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
		</button>
	</div>

	<!-- Center section: View controls -->
	<div class="flex items-center gap-1">
		<button
			class="px-3 py-1 text-xs rounded transition-colors"
			class:font-medium={uiStore.layout === 'side-by-side'}
			style="background-color: {uiStore.layout === 'side-by-side' ? 'var(--accent-color)' : 'transparent'};
			       color: {uiStore.layout === 'side-by-side' ? 'white' : 'var(--text-secondary)'};"
			onclick={() => uiStore.showSideBySide()}
			title="Side-by-side (Ctrl+0)"
		>
			Split
		</button>
		<button
			class="px-3 py-1 text-xs rounded transition-colors"
			class:font-medium={uiStore.layout === 'planning-full'}
			style="background-color: {uiStore.layout === 'planning-full' ? 'var(--accent-color)' : 'transparent'};
			       color: {uiStore.layout === 'planning-full' ? 'white' : 'var(--text-secondary)'};"
			onclick={() => uiStore.showPlanningFull()}
			title="Planning only (Ctrl+1)"
		>
			Plan
		</button>
		<button
			class="px-3 py-1 text-xs rounded transition-colors"
			class:font-medium={uiStore.layout === 'writing-full'}
			style="background-color: {uiStore.layout === 'writing-full' ? 'var(--accent-color)' : 'transparent'};
			       color: {uiStore.layout === 'writing-full' ? 'white' : 'var(--text-secondary)'};"
			onclick={() => uiStore.showWritingFull()}
			title="Writing only (Ctrl+2)"
		>
			Write
		</button>
		<button
			class="px-3 py-1 text-xs rounded transition-colors"
			class:font-medium={uiStore.layout === 'dag-full'}
			style="background-color: {uiStore.layout === 'dag-full' ? 'var(--accent-color)' : 'transparent'};
			       color: {uiStore.layout === 'dag-full' ? 'white' : 'var(--text-secondary)'};"
			onclick={() => uiStore.showDAGFull()}
			title="DAG only (Ctrl+3)"
		>
			DAG
		</button>
	</div>

	<!-- Right section: Settings -->
	<div class="flex items-center gap-3">
		<FontSelector />
		<ThemeToggle />

		<button
			class="p-1.5 rounded hover:opacity-70 transition-opacity"
			style="color: var(--text-secondary);"
			onclick={handleHelp}
			title="Keyboard shortcuts (?)"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		</button>
	</div>
</header>
