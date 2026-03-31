<script lang="ts">
	import { executeCommand } from '$lib/commands';
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import FontSelector from './FontSelector.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { FolderOpen, Plus, HelpCircle } from 'lucide-svelte';

	function handleNameChange(event: Event) {
		const target = event.target as HTMLInputElement;
		projectStore.setName(target.value);
	}
</script>

<header
	class="shell-toolbar mx-3 mb-1.5 mt-3 flex h-11 items-center justify-between rounded-[var(--radius-xl)] px-1.5"
>
	<div class="flex items-center gap-1">
		<button
			class="shell-button text-xs"
			class:active={uiStore.nodeBrowserOpen}
			onclick={() => executeCommand('toggle-file-browser')}
			title="Toggle file browser (Ctrl+B)"
		>
			<FolderOpen size={13} strokeWidth={2} />
			Files
		</button>

		<div class="mx-1 h-4 w-px" style="background: var(--border-color);"></div>

		<input
			type="text"
			value={projectStore.name}
			oninput={handleNameChange}
			class="shell-input h-7.5 w-44 border-none bg-transparent px-2.5 text-sm shadow-none"
			style="font-weight: 600; font-size: 14px; letter-spacing: -0.02em;"
			placeholder="Project name"
		/>

		<button
			class="shell-button shell-icon-button"
			onclick={() => executeCommand('new-project')}
			title="New project"
		>
			<Plus size={15} strokeWidth={2} />
		</button>
	</div>

	<div class="flex items-center gap-0.5 rounded-[var(--radius-md)] p-[3px]" style="background: var(--surface-inset);">
		<button
			class="shell-button shell-tab text-xs"
			class:active={uiStore.layout === 'side-by-side'}
			onclick={() => executeCommand('show-side-by-side')}
			title="Side-by-side (Ctrl+0)"
		>
			Split
		</button>
		<button
			class="shell-button shell-tab text-xs"
			class:active={uiStore.layout === 'planning-full'}
			onclick={() => executeCommand('show-planning-full')}
			title="Planning only (Ctrl+1)"
		>
			Plan
		</button>
		<button
			class="shell-button shell-tab text-xs"
			class:active={uiStore.layout === 'writing-full'}
			onclick={() => executeCommand('show-writing-full')}
			title="Writing only (Ctrl+2)"
		>
			Write
		</button>
		<button
			class="shell-button shell-tab text-xs"
			class:active={uiStore.layout === 'dag-full'}
			onclick={() => executeCommand('show-dag-full')}
			title="DAG only (Ctrl+3)"
		>
			DAG
		</button>
	</div>

	<div class="flex items-center gap-1">
		<FontSelector />
		<ThemeToggle />

		<button
			class="shell-button shell-icon-button"
			onclick={() => executeCommand('toggle-shortcuts')}
			title="Keyboard shortcuts (?)"
		>
			<HelpCircle size={14} strokeWidth={2} />
		</button>
	</div>
</header>
