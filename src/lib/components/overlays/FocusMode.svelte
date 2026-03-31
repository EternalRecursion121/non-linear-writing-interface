<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';

	let textareaRef = $state<HTMLTextAreaElement | null>(null);
	let localContent = $state('');

	$effect(() => {
		localContent = projectStore.selectedNode?.content ?? '';
	});

	function handleInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		localContent = target.value;
		projectStore.updateSelectedNodeContent(target.value);
	}

	onMount(() => {
		tick().then(() => textareaRef?.focus());
	});
</script>

<svelte:window onkeydown={(event) => {
	if (event.key === 'Escape' || ((event.ctrlKey || event.metaKey) && event.key === '.')) {
		event.preventDefault();
		uiStore.exitFocusMode();
	}
}} />

<div
	class="fixed inset-0 z-50 flex items-center justify-center focus-mode-backdrop"
	style="background-color: var(--bg-primary);"
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<button
		type="button"
		class="absolute inset-0"
		style="background: transparent;"
		aria-label="Exit focus mode"
		onclick={() => uiStore.exitFocusMode()}
	></button>

	<div class="absolute inset-0 focus-mode-overlay pointer-events-none"></div>

	<div class="relative w-full max-w-2xl mx-auto px-8 py-16 h-full flex flex-col">
		<div class="flex-1 overflow-auto">
			{#if projectStore.selectedNode}
				<textarea
					bind:this={textareaRef}
					bind:value={localContent}
					oninput={handleInput}
					placeholder="Start writing..."
					class="w-full h-full resize-none outline-none bg-transparent text-size-large font-{projectStore.settings.fontFamily}"
					style="color: var(--text-primary); line-height: 1.8;"
				></textarea>
			{:else}
				<div class="flex items-center justify-center h-full">
					<p style="color: var(--text-muted); font-weight: 500; font-size: 15px;">
						No node selected. Press Escape to exit focus mode.
					</p>
				</div>
			{/if}
		</div>

		<div class="mt-8 flex items-center justify-between text-[11px]" style="color: var(--text-muted);">
			<span class="tabular-nums">{projectStore.getWordCount(localContent)} words</span>
			<span>Press <kbd class="shell-kbd mx-0.5">Esc</kbd> or <kbd class="shell-kbd mx-0.5">Cmd+.</kbd> to exit</span>
		</div>
	</div>
</div>
