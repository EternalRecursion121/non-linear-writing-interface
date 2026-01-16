<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import { onMount, tick } from 'svelte';

	let textareaRef: HTMLTextAreaElement;
	let localContent = $state('');

	// Sync with selected node
	$effect(() => {
		const node = projectStore.selectedNode;
		if (node) {
			localContent = node.content;
		}
	});

	function handleInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		localContent = target.value;

		if (projectStore.selectedNode) {
			projectStore.updateNodeContent(projectStore.selectedNode.id, localContent);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		// Exit on Escape or Ctrl+.
		if (e.key === 'Escape' || ((e.ctrlKey || e.metaKey) && e.key === '.')) {
			e.preventDefault();
			uiStore.exitFocusMode();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		// Only exit if clicking on the actual backdrop, not the content area
		const target = e.target as HTMLElement;
		if (target.classList.contains('focus-mode-backdrop')) {
			uiStore.exitFocusMode();
		}
	}

	function getWordCount(): number {
		if (!localContent) return 0;
		return localContent.trim().split(/\s+/).filter((w) => w.length > 0).length;
	}

	function getFontClass(): string {
		return `font-${projectStore.settings.fontFamily}`;
	}

	function getSizeClass(): string {
		// Use larger size in focus mode
		const sizeMap: Record<string, string> = {
			small: 'text-size-medium',
			medium: 'text-size-large',
			large: 'text-size-xlarge',
			xlarge: 'text-size-xlarge'
		};
		return sizeMap[projectStore.settings.fontSize] ?? 'text-size-large';
	}

	onMount(() => {
		tick().then(() => {
			textareaRef?.focus();
		});
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="fixed inset-0 z-50 flex items-center justify-center focus-mode-backdrop"
	style="background-color: var(--bg-primary);"
	onclick={handleBackdropClick}
	role="dialog"
	aria-modal="true"
>
	<!-- Vignette overlay -->
	<div class="absolute inset-0 focus-mode-overlay pointer-events-none"></div>

	<!-- Content container -->
	<div class="relative w-full max-w-3xl mx-auto px-8 py-12 h-full flex flex-col">
		<!-- Editor area -->
		<div class="flex-1 overflow-auto">
			{#if projectStore.selectedNode}
				<textarea
					bind:this={textareaRef}
					bind:value={localContent}
					oninput={handleInput}
					placeholder="Start writing..."
					class="w-full h-full resize-none outline-none bg-transparent {getFontClass()} {getSizeClass()}"
					style="color: var(--text-primary);"
				></textarea>
			{:else}
				<div class="flex items-center justify-center h-full">
					<p style="color: var(--text-muted);">
						No node selected. Press Escape to exit focus mode.
					</p>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="mt-8 flex items-center justify-between text-sm" style="color: var(--text-muted);">
			<span>{getWordCount()} words</span>
			<span class="text-xs">Press <kbd class="px-1 py-0.5 rounded" style="background-color: var(--bg-secondary);">Esc</kbd> or <kbd class="px-1 py-0.5 rounded" style="background-color: var(--bg-secondary);">Cmd+.</kbd> to exit</span>
		</div>
	</div>
</div>
