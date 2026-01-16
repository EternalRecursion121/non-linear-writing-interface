<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';

	interface Props {
		id: string;
		data: {
			content: string;
			planContent: string;
			wordCount: number;
			wordCountGoal?: number;
			isSelected: boolean;
		};
	}

	let { id, data }: Props = $props();

	// Get preview text (first 100 chars)
	function getPreview(): string {
		if (!data.content) return 'Empty node';
		const text = data.content.slice(0, 100);
		return text.length < data.content.length ? text + '...' : text;
	}

	// Get word count goal progress color
	function getGoalColor(): string {
		if (!data.wordCountGoal) return '';
		const percentage = (data.wordCount / data.wordCountGoal) * 100;
		if (percentage >= 120) return 'var(--error-color)';
		if (percentage >= 100) return 'var(--success-color)';
		if (percentage >= 50) return 'var(--warning-color)';
		return 'var(--text-muted)';
	}

	function handleDoubleClick() {
		projectStore.selectNode(id);
		uiStore.setEditing(true);
		uiStore.setRightPaneMode('writing');
	}

	// Check if this node has children (branches)
	function hasBranches(): boolean {
		return projectStore.getChildren(id).length > 1;
	}
</script>

<div
	class="dag-node px-3 py-2 rounded-lg min-w-[180px] max-w-[220px] cursor-pointer"
	class:selected={data.isSelected}
	style="background-color: var(--bg-primary);
	       border: 1px solid {data.isSelected ? 'var(--accent-color)' : 'var(--border-color)'};
	       box-shadow: {data.isSelected ? '0 0 0 2px var(--accent-color)' : '0 2px 4px rgba(0,0,0,0.1)'};"
	ondblclick={handleDoubleClick}
>
	<!-- Handles for connections -->
	<Handle type="target" position={Position.Top} />
	<Handle type="source" position={Position.Bottom} />

	<!-- Content preview -->
	<p
		class="text-xs leading-relaxed mb-2 line-clamp-3"
		style="color: {data.content ? 'var(--text-primary)' : 'var(--text-muted)'};"
	>
		{getPreview()}
	</p>

	<!-- Footer with metadata -->
	<div class="flex items-center justify-between text-xs" style="color: var(--text-muted);">
		<span class="flex items-center gap-1">
			{data.wordCount} words
			{#if data.wordCountGoal}
				<span
					class="w-2 h-2 rounded-full"
					style="background-color: {getGoalColor()};"
				></span>
			{/if}
		</span>

		{#if hasBranches()}
			<span
				class="px-1.5 py-0.5 rounded text-[10px] font-medium"
				style="background-color: var(--accent-color); color: white;"
			>
				Branches
			</span>
		{/if}
	</div>

	<!-- Plan indicator -->
	{#if data.planContent}
		<div
			class="absolute -top-1 -right-1 w-3 h-3 rounded-full"
			style="background-color: var(--warning-color);"
			title="Has planning notes"
		></div>
	{/if}
</div>

<style>
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
