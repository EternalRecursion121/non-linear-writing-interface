<script lang="ts">
	import { uiStore } from '$lib/stores/ui.svelte';
	import { KEYBOARD_SHORTCUTS, formatShortcut } from '$lib/utils/keyboard';

	function handleClose() {
		uiStore.closeShortcutOverlay();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' || e.key === '?') {
			e.preventDefault();
			handleClose();
		}
	}

	// Group shortcuts by category
	function getGroupedShortcuts() {
		const groups = new Map<string, typeof KEYBOARD_SHORTCUTS>();

		// Dedupe shortcuts (some have both ctrl and meta versions)
		const seen = new Set<string>();
		for (const shortcut of KEYBOARD_SHORTCUTS) {
			if (seen.has(shortcut.action)) continue;
			seen.add(shortcut.action);

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
		export: 'Save & Export'
	};
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center command-palette-backdrop"
	style="background-color: rgba(0, 0, 0, 0.5);"
	onclick={handleClose}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<!-- Modal -->
	<div
		class="w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden"
		style="background-color: var(--bg-primary);"
		onclick={(e) => e.stopPropagation()}
		role="document"
	>
		<!-- Header -->
		<div
			class="px-6 py-4 border-b flex items-center justify-between"
			style="border-color: var(--border-color);"
		>
			<h2 class="text-lg font-semibold" style="color: var(--text-primary);">
				Keyboard Shortcuts
			</h2>
			<button
				class="p-1 rounded hover:opacity-70"
				style="color: var(--text-muted);"
				onclick={handleClose}
				aria-label="Close"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Content -->
		<div class="p-6 max-h-[70vh] overflow-auto">
			<div class="grid grid-cols-2 gap-6">
				{#each [...groupedShortcuts] as [category, shortcuts]}
					<div>
						<h3 class="text-xs font-medium uppercase tracking-wider mb-3" style="color: var(--text-muted);">
							{categoryLabels[category] ?? category}
						</h3>
						<div class="space-y-2">
							{#each shortcuts as shortcut}
								<div class="flex items-center justify-between">
									<span class="text-sm" style="color: var(--text-secondary);">
										{shortcut.description}
									</span>
									<kbd
										class="px-2 py-1 text-xs rounded font-mono"
										style="background-color: var(--bg-secondary); color: var(--text-muted);"
									>
										{formatShortcut(shortcut)}
									</kbd>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Footer -->
		<div
			class="px-6 py-3 border-t text-xs text-center"
			style="border-color: var(--border-color); color: var(--text-muted);"
		>
			Press <kbd class="px-1 rounded" style="background-color: var(--bg-secondary);">?</kbd> or <kbd class="px-1 rounded" style="background-color: var(--bg-secondary);">Esc</kbd> to close
		</div>
	</div>
</div>
