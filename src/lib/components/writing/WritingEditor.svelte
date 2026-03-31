<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';

	let editorRef: HTMLTextAreaElement;
	let localContent = $state('');

	$effect(() => {
		localContent = projectStore.selectedNode?.content ?? '';
	});

	function handleInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		localContent = target.value;
		projectStore.updateSelectedNodeContent(target.value);
		uiStore.setAutosaveStatus('unsaved');
	}

	function handleKeydown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
			event.preventDefault();
			event.stopPropagation();

			if (editorRef && projectStore.branchSelectedNode(editorRef.selectionStart)) {
				uiStore.setEditing(true);
				uiStore.showToast('Branch created', 'success');
			}
			return;
		}

		if ((event.ctrlKey || event.metaKey) && event.key === '/') {
			event.preventDefault();
			event.stopPropagation();

			if (
				editorRef &&
				projectStore.parallelizeSelectedNode(
					editorRef.selectionStart,
					editorRef.selectionEnd
				)
			) {
				uiStore.showToast(
					editorRef.selectionStart === editorRef.selectionEnd
						? 'Branch created (full copy)'
						: 'Branch created (highlighted text removed)',
					'success'
				);
			}
		}
	}

	$effect(() => {
		if (uiStore.isEditing && editorRef) {
			tick().then(() => editorRef.focus());
		}
	});

	onMount(() => {
		editorRef?.focus();
	});
</script>

<div class="h-full flex flex-col">
	<div class="flex-1 overflow-auto px-6 py-5">
		<textarea
			bind:this={editorRef}
			value={localContent}
			oninput={handleInput}
			onkeydown={handleKeydown}
			placeholder="Start writing...

Press Ctrl+Enter to branch, Ctrl+/ to parallelize."
			class="writing-editor shell-textarea plain h-full w-full px-0.5 py-0.5 font-{projectStore.settings.fontFamily} text-size-{projectStore.settings.fontSize}"
		></textarea>
	</div>

	<div
		class="flex items-center justify-between border-t px-6 py-2.5 text-[10.5px]"
		style="border-color: var(--border-color);"
	>
		<span class="shell-hint tabular-nums">{projectStore.getWordCount(localContent)} words in this node</span>
		<span class="shell-hint">
			<kbd class="shell-kbd">Ctrl+Enter</kbd> branch
			<span class="mx-1.5 opacity-30">|</span>
			<kbd class="shell-kbd">Ctrl+/</kbd> parallelize
		</span>
	</div>
</div>
