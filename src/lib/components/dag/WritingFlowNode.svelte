<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import { Folder, FileText } from 'lucide-svelte';
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';

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

	function getDisplayTitle(): string {
		if (data.title) return data.title;
		const firstLine = data.content.split('\n')[0].trim();
		return firstLine.slice(0, 25) || 'Untitled';
	}

	function getPreview(): string {
		if (!data.content) return 'Empty node';
		const text = data.content.slice(0, 80);
		return text.length < data.content.length ? text + '...' : text;
	}

	function getGoalColor(): string {
		if (!data.wordCountGoal) return '';
		const percentage = (data.wordCount / data.wordCountGoal) * 100;
		if (percentage >= 120) return 'var(--error-color)';
		if (percentage >= 100) return 'var(--success-color)';
		if (percentage >= 50) return 'var(--warning-color)';
		return 'var(--text-muted)';
	}

	function handleDoubleClick() {
		if (data.hasSubProject) {
			projectStore.drillInto(id);
		} else {
			projectStore.selectNode(id);
			uiStore.setEditing(true);
			uiStore.setRightPaneMode('writing');
		}
	}
</script>

<div
	class="dag-node relative min-w-[190px] max-w-[220px] cursor-pointer px-4 py-3"
	class:selected={data.isSelected}
	style="
		background-color: var(--surface-overlay);
		border: 1px solid {data.isSelected ? 'var(--accent-color)' : 'var(--border-color)'};
		border-radius: var(--radius-lg);
		box-shadow: {data.isSelected ? '0 0 0 2px var(--accent-color-light), var(--shadow-md)' : 'var(--shadow-sm)'};
		transition: box-shadow 0.2s ease, border-color 0.2s ease;
	"
	ondblclick={handleDoubleClick}
	role="button"
	tabindex="0"
>
	<Handle type="target" position={Position.Top} />
	<Handle type="source" position={Position.Bottom} />

	<div class="mb-2 flex items-center gap-1.5 border-b pb-2" style="border-color: var(--border-color);">
		{#if data.hasSubProject}
			<span style="color: var(--accent-color);" title="Contains sub-project (double-click to open)"><Folder size={12} /></span>
		{:else}
			<span style="color: var(--text-muted);"><FileText size={12} /></span>
		{/if}
		<span class="text-[11.5px] font-medium truncate flex-1" style="color: var(--text-primary);" title={getDisplayTitle()}>
			{getDisplayTitle()}
		</span>
	</div>

	<p class="line-clamp-2 mb-2.5 text-[11px] leading-relaxed" style="color: {data.content ? 'var(--text-secondary)' : 'var(--text-muted)'};">
		{getPreview()}
	</p>

	<div class="flex items-center justify-between text-[10.5px]" style="color: var(--text-muted);">
		<span class="flex items-center gap-1 tabular-nums">
			{data.wordCount} words
			{#if data.wordCountGoal}
				<span class="w-1.5 h-1.5 rounded-full" style="background-color: {getGoalColor()};"></span>
			{/if}
		</span>

		{#if projectStore.getChildren(id).length > 1}
			<span
				class="shell-pill accent px-1.5 py-0.5 text-[9px] font-semibold"
			>
				Branches
			</span>
		{/if}
	</div>

	{#if data.planContent}
		<div
			class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
			style="background-color: var(--warning-color); box-shadow: 0 0 0 2px var(--surface-overlay);"
			title="Has planning notes"
		></div>
	{/if}
</div>

<style>
	.line-clamp-2 {
		line-clamp: 2;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
