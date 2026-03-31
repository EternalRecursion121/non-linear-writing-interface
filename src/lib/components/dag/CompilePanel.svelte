<script lang="ts">
	import { X } from 'lucide-svelte';
	import { exportAsMarkdown } from '$lib/persistence/project';
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';

	let sourceNodeId = $state<string | null>(null);
	let sinkNodeId = $state<string | null>(null);
	let selectedPathIndex = $state(0);
	let previewContent = $state('');

	const roots = $derived(projectStore.findRoots());
	const leaves = $derived(projectStore.findLeaves());
	const paths = $derived(
		sourceNodeId && sinkNodeId ? projectStore.getCompilePaths(sourceNodeId, sinkNodeId) : []
	);

	$effect(() => {
		if (roots.length > 0 && !sourceNodeId) sourceNodeId = roots[0].id;
		if (leaves.length > 0 && !sinkNodeId) sinkNodeId = leaves[0].id;
	});

	$effect(() => {
		if (paths.length > 0 && selectedPathIndex < paths.length) {
			previewContent = projectStore.compilePath(paths[selectedPathIndex].nodeIds);
		} else {
			previewContent = '';
		}
	});

	function handleExport() {
		if (!previewContent) {
			return;
		}

		exportAsMarkdown(previewContent, {
			title: projectStore.name,
			compiledAt: new Date().toISOString()
		});

		uiStore.closeCompileModal();
		uiStore.showToast('Story exported', 'success');
	}

	function getNodeLabel(nodeId: string): string {
		return projectStore.getNodeDisplayTitle(
			projectStore.activeNodes.find((node) => node.id === nodeId) ?? {
				id: nodeId,
				content: '',
				planContent: '',
				position: { x: 0, y: 0 },
				createdAt: 0,
				updatedAt: 0
			}
		);
	}
</script>

<div
	class="command-palette-backdrop fixed inset-0 z-50 flex items-center justify-center"
	style="background: rgba(0, 0, 0, 0.4);"
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<button
		type="button"
		class="absolute inset-0"
		style="background: transparent;"
		aria-label="Close compile dialog"
		onclick={() => uiStore.closeCompileModal()}
	></button>

	<div
		class="shell-modal relative flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-2xl)]"
		role="document"
	>
		<div
			class="flex items-center justify-between border-b px-6 py-4"
			style="border-color: var(--border-color);"
		>
			<h2 style="font-weight: 650; font-size: 17px; letter-spacing: -0.025em; color: var(--text-primary);">Compile Story</h2>
			<button
				class="shell-button shell-icon-button ghost"
				onclick={() => uiStore.closeCompileModal()}
				aria-label="Close"
			>
				<X size={16} />
			</button>
		</div>

		<div class="flex-1 overflow-auto p-6">
			<div class="grid grid-cols-2 gap-6 mb-6">
				<div>
					<label for="source-select" class="shell-label mb-2 block">
						Start from
					</label>
					<select
						id="source-select"
						bind:value={sourceNodeId}
						class="shell-select w-full px-3 py-2 text-[13px]"
					>
						{#each roots as root}
							<option value={root.id}>{getNodeLabel(root.id)}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="sink-select" class="shell-label mb-2 block">
						End at
					</label>
					<select
						id="sink-select"
						bind:value={sinkNodeId}
						class="shell-select w-full px-3 py-2 text-[13px]"
					>
						{#each leaves as leaf}
							<option value={leaf.id}>{getNodeLabel(leaf.id)}</option>
						{/each}
					</select>
				</div>
			</div>

			{#if paths.length > 1}
				<div class="mb-6">
					<span class="shell-label mb-2 block">
						Choose path ({paths.length} available)
					</span>
					<div class="flex flex-wrap gap-1.5">
						{#each paths as path, index}
							<button
								class="shell-button px-3 py-1.5 text-[12px]"
								class:active={selectedPathIndex === index}
								onclick={() => (selectedPathIndex = index)}
							>
								Path {index + 1} <span class="opacity-50 ml-1">{path.totalWords}w</span>
							</button>
						{/each}
					</div>
				</div>
			{:else if paths.length === 0 && sourceNodeId && sinkNodeId}
				<p class="shell-hint mb-6 text-[12.5px]">
					No paths found between selected nodes.
				</p>
			{/if}

			{#if previewContent}
				<div>
					<span class="shell-label mb-2 block">Preview</span>
					<div
						class="h-56 overflow-auto rounded-[var(--radius-lg)] p-4 text-[13px] whitespace-pre-wrap leading-relaxed"
						style="background: var(--surface-inset); color: var(--text-secondary);"
					>
						{previewContent}
					</div>
				</div>
			{/if}
		</div>

		<div
			class="flex items-center justify-end gap-2.5 border-t px-6 py-4"
			style="border-color: var(--border-color);"
		>
			<button
				class="shell-button px-4 py-2 text-[12.5px]"
				onclick={() => uiStore.closeCompileModal()}
			>
				Cancel
			</button>
			<button
				class="shell-button primary px-4 py-2 text-[12.5px] font-medium disabled:opacity-50"
				onclick={handleExport}
				disabled={!previewContent}
			>
				Export as Markdown
			</button>
		</div>
	</div>
</div>
