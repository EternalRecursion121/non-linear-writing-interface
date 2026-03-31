<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';

	function getProgress(): { current: number; goal: number; percentage: number; color: string } {
		const node = projectStore.selectedNode;
		if (!node || !node.wordCountGoal) {
			return { current: 0, goal: 0, percentage: 0, color: 'gray' };
		}

		const current = projectStore.getWordCount(node.content);
		const goal = node.wordCountGoal;
		const percentage = Math.min((current / goal) * 100, 120);

		let color = 'gray';
		if (percentage >= 120) {
			color = 'red';
		} else if (percentage >= 100) {
			color = 'green';
		} else if (percentage >= 50) {
			color = 'yellow';
		}

		return { current, goal, percentage, color };
	}

	let progress = $derived(getProgress());
</script>

<div
	class="border-t px-6 py-3.5"
	style="border-color: var(--border-color);"
>
	<div class="flex items-center justify-between mb-1.5 text-[11px]">
		<span class="font-medium" style="color: var(--text-secondary);">
			Word count goal
		</span>
		<span class="tabular-nums" style="color: var(--text-muted);">
			{progress.current} / {progress.goal}
		</span>
	</div>

	<div class="h-1.5 overflow-hidden rounded-full" style="background-color: var(--surface-inset);">
		<div
			class="h-full rounded-full progress-{progress.color}"
			style="width: {Math.min(progress.percentage, 100)}%; transition: width 0.4s var(--ease-out);"
		></div>
	</div>

	{#if progress.percentage >= 100}
		<p class="text-[10.5px] mt-1.5 font-medium" style="color: {progress.color === 'red' ? 'var(--error-color)' : 'var(--success-color)'};">
			{#if progress.percentage >= 120}
				Over goal by {progress.current - progress.goal} words
			{:else}
				Goal reached!
			{/if}
		</p>
	{/if}
</div>
