<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import { Folder, FileText } from 'lucide-svelte';

	interface Props {
		id: string;
		data: {
			title?: string;
			content: string;
			planContent: string;
			wordCount: number;
			wordCountGoal?: number;
			hasSubProject: boolean;
			isSelected: boolean;
		};
	}

	let { id, data }: Props = $props();

	// Get display title
	function getDisplayTitle(): string {
		if (data.title) return data.title;
		const firstLine = data.content.split('\n')[0].trim();
		return firstLine.slice(0, 25) || 'Untitled';
	}

	// Get preview text (first 100 chars)
	function getPreview(): string {
		if (!data.content) return 'Empty node';
		const text = data.content.slice(0, 80);
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
		// If node has subproject, drill into it
		if (data.hasSubProject) {
			projectStore.drillInto(id);
		} else {
			projectStore.selectNode(id);
			uiStore.setEditing(true);
			uiStore.setRightPaneMode('writing');
		}
	}

	// Check if this node has children (branches)
	function hasBranches(): boolean {
		return projectStore.getChildren(id).length > 1;
	}
</script>

<div
	class="dag-node px-3 py-2 rounded-lg min-w-[180px] max-w-[220px] cursor-pointer relative"
	class:selected={data.isSelected}
	style="background-color: var(--bg-primary);
	       border: 1px solid {data.isSelected ? 'var(--accent-color)' : 'var(--border-color)'};
	       box-shadow: {data.isSelected ? '0 0 0 2px var(--accent-color)' : '0 2px 4px rgba(0,0,0,0.1)'};"
	ondblclick={handleDoubleClick}
	role="button"
	tabindex="0"
>
	<!-- Handles for connections -->
	<Handle type="target" position={Position.Top} />
	<Handle type="source" position={Position.Bottom} />

	<!-- Title header with subproject indicator -->
	<div class="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b" style="border-color: var(--border-color);">
		{#if data.hasSubProject}
			<span title="Contains sub-project (double-click to open)"><Folder size={12} /></span>
		{:else}
			<span class="opacity-50"><FileText size={12} /></span>
		{/if}
		<span
			class="text-xs font-medium truncate flex-1"
			style="color: var(--text-primary);"
			title={getDisplayTitle()}
		>
			{getDisplayTitle()}
		</span>
	</div>

	<!-- Content preview -->
	<p
		class="text-xs leading-relaxed mb-2 line-clamp-2"
		style="color: {data.content ? 'var(--text-secondary)' : 'var(--text-muted)'};"
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
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
