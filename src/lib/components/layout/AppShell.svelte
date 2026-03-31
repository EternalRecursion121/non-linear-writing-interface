<script lang="ts">
	import { Check, Circle } from 'lucide-svelte';
	import { createKeyboardHandler } from '$lib/commands';
	import MainToolbar from '$lib/components/toolbar/MainToolbar.svelte';
	import CompilePanel from '$lib/components/dag/CompilePanel.svelte';
	import CommandPalette from '$lib/components/overlays/CommandPalette.svelte';
	import FocusMode from '$lib/components/overlays/FocusMode.svelte';
	import ShortcutOverlay from '$lib/components/overlays/ShortcutOverlay.svelte';
	import ToastContainer from '$lib/components/overlays/ToastContainer.svelte';
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import TwoPaneLayout from './TwoPaneLayout.svelte';

	const keyboardHandler = createKeyboardHandler();

	function handleKeydown(event: KeyboardEvent) {
		keyboardHandler(event);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="app-shell h-screen flex flex-col overflow-hidden"
>
	{#if !uiStore.focusModeActive}
		<MainToolbar />
	{/if}

	<div class="flex-1 overflow-hidden">
		<TwoPaneLayout />
	</div>

	{#if !uiStore.focusModeActive}
		<div
			class="shell-statusbar mx-3 mb-2.5 flex h-7 items-center justify-between rounded-[var(--radius-lg)] px-3.5 text-[10.5px]"
		>
			<div class="flex items-center gap-4">
				<span class="flex items-center gap-1.5 font-medium">
					{#if uiStore.autosaveState.status === 'saved'}
						<Check size={11} strokeWidth={2.5} class="text-[var(--success-color)]" />
						<span style="color: var(--text-muted);">Saved</span>
					{:else if uiStore.autosaveState.status === 'saving'}
						<Circle size={9} class="animate-pulse" style="color: var(--warning-color);" />
						<span style="color: var(--text-muted);">Saving...</span>
					{:else}
						<Circle size={9} style="color: var(--warning-color);" />
						<span style="color: var(--text-muted);">Unsaved</span>
					{/if}
				</span>

				{#if projectStore.selectedNode}
					<span class="shell-hint">
						Node {projectStore.activeNodes.findIndex((node) => node.id === projectStore.selectedNode?.id) + 1} of {projectStore.activeNodes.length}
					</span>
				{/if}
			</div>

			<div class="flex items-center gap-4">
				<span class="shell-hint tabular-nums">{projectStore.totalWordCount} words</span>
				<span class="shell-hint">Press <kbd class="shell-kbd ml-0.5">?</kbd> for shortcuts</span>
			</div>
		</div>
	{/if}
</div>

{#if uiStore.commandPaletteOpen}
	<CommandPalette />
{/if}

{#if uiStore.focusModeActive}
	<FocusMode />
{/if}

{#if uiStore.shortcutOverlayOpen}
	<ShortcutOverlay />
{/if}

{#if uiStore.compileModalOpen}
	<CompilePanel />
{/if}

<ToastContainer />
