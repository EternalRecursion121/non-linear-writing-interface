<script lang="ts">
	import { KEYBOARD_SHORTCUTS, formatShortcut } from '$lib/commands';
	import { uiStore } from '$lib/stores/ui.svelte';

	function getGroupedShortcuts() {
		const groups = new Map<string, typeof KEYBOARD_SHORTCUTS>();
		const seen = new Set<string>();

		for (const shortcut of KEYBOARD_SHORTCUTS) {
			if (seen.has(shortcut.commandId)) {
				continue;
			}
			seen.add(shortcut.commandId);

			const existing = groups.get(shortcut.category) ?? [];
			existing.push(shortcut);
			groups.set(shortcut.category, existing);
		}

		return groups;
	}

	const groupedShortcuts = getGroupedShortcuts();
	const categoryLabels: Record<string, string> = {
		navigation: 'Navigation',
		editing: 'Editing',
		view: 'View',
		project: 'Project'
	};
</script>

<svelte:window onkeydown={(event) => {
	if (event.key === 'Escape' || event.key === '?') {
		event.preventDefault();
		uiStore.closeShortcutOverlay();
	}
}} />

<div
	class="command-palette-backdrop fixed inset-0 z-50 flex items-center justify-center"
	style="background: rgba(0, 0, 0, 0.45);"
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<button
		type="button"
		class="absolute inset-0"
		style="background: transparent;"
		aria-label="Close shortcut overlay"
		onclick={() => uiStore.closeShortcutOverlay()}
	></button>

	<div
		class="shell-modal relative w-full max-w-2xl overflow-hidden rounded-[var(--radius-2xl)]"
		role="document"
	>
		<div
			class="px-6 py-4 border-b flex items-center justify-between"
			style="border-color: var(--border-color);"
		>
			<h2 style="font-weight: 650; font-size: 17px; letter-spacing: -0.025em; color: var(--text-primary);">Keyboard Shortcuts</h2>
			<button
				class="shell-button shell-icon-button ghost"
				onclick={() => uiStore.closeShortcutOverlay()}
				aria-label="Close"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div class="p-6 max-h-[70vh] overflow-auto">
			<div class="grid grid-cols-2 gap-8">
				{#each [...groupedShortcuts] as [category, shortcuts]}
					<div>
						<h3 class="shell-label mb-3">
							{categoryLabels[category] ?? category}
						</h3>
						<div class="space-y-1.5">
							{#each shortcuts as shortcut}
								<div class="flex items-center justify-between py-1">
									<span class="text-[12.5px]" style="color: var(--text-secondary);">{shortcut.description}</span>
									<kbd class="shell-kbd px-2 py-0.5 font-mono text-[10.5px]">
										{formatShortcut(shortcut)}
									</kbd>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div
			class="px-6 py-3 border-t text-[10.5px] text-center"
			style="border-color: var(--border-color); color: var(--text-muted);"
		>
			Press <kbd class="shell-kbd mx-0.5">?</kbd> or <kbd class="shell-kbd mx-0.5">Esc</kbd> to close
		</div>
	</div>
</div>
