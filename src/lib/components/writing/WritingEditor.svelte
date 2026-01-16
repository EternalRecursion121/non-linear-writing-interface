<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import { onMount, tick } from 'svelte';

	interface Props {
		handleBranch: (cursorPosition: number) => void;
		setBranchCallback: (callback: (cursorPosition: number) => void) => void;
	}

	let { handleBranch, setBranchCallback }: Props = $props();

	let editorRef: HTMLTextAreaElement;
	let localContent = $state('');
	let cursorPosition = $state(0);

	// Sync content with selected node
	$effect(() => {
		const node = projectStore.selectedNode;
		if (node) {
			localContent = node.content;
		} else {
			localContent = '';
		}
	});

	// Register branch callback
	$effect(() => {
		setBranchCallback((pos: number) => {
			handleBranch(pos);
		});
	});

	function handleInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		localContent = target.value;
		cursorPosition = target.selectionStart;

		if (projectStore.selectedNode) {
			projectStore.updateNodeContent(projectStore.selectedNode.id, localContent);
			uiStore.setAutosaveStatus('unsaved');
		}
	}

	function handleSelect(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		cursorPosition = target.selectionStart;
	}

	function handleKeydown(e: KeyboardEvent) {
		// Handle Ctrl+L for branching
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
			e.preventDefault();
			e.stopPropagation();

			if (editorRef) {
				const pos = editorRef.selectionStart;
				handleBranch(pos);
			}
			return;
		}
	}

	// Focus editor when editing starts
	$effect(() => {
		if (uiStore.isEditing && editorRef) {
			tick().then(() => {
				editorRef.focus();
			});
		}
	});

	// Get font and size classes
	function getFontClass(): string {
		return `font-${projectStore.settings.fontFamily}`;
	}

	function getSizeClass(): string {
		return `text-size-${projectStore.settings.fontSize}`;
	}

	// Calculate word count
	function getWordCount(): number {
		if (!localContent) return 0;
		return localContent.trim().split(/\s+/).filter((w) => w.length > 0).length;
	}

	onMount(() => {
		// Auto-focus on mount
		if (editorRef) {
			editorRef.focus();
		}
	});
</script>

<div class="h-full flex flex-col">
	<div class="flex-1 overflow-auto p-6">
		<textarea
			bind:this={editorRef}
			value={localContent}
			oninput={handleInput}
			onselect={handleSelect}
			onkeydown={handleKeydown}
			placeholder="Start writing...

Press Ctrl+L to branch at the cursor position."
			class="writing-editor w-full h-full resize-none {getFontClass()} {getSizeClass()}"
			style="background-color: transparent; color: var(--text-primary);"
			data-placeholder="Start writing..."
		></textarea>
	</div>

	<!-- Word count for current node -->
	<div
		class="px-6 py-2 text-xs border-t flex items-center justify-between"
		style="border-color: var(--border-color); color: var(--text-muted);"
	>
		<span>{getWordCount()} words in this node</span>
		<span class="opacity-50">Ctrl+L to branch</span>
	</div>
</div>
