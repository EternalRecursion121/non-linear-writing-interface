<script lang="ts">
	import { uiStore } from '$lib/stores/ui.svelte';
	import { projectStore } from '$lib/stores/project.svelte';
	import { getCommandPaletteItems } from '$lib/utils/keyboard';
	import type { CommandPaletteItem } from '$lib/types';
	import { onMount, tick } from 'svelte';

	let searchInput: HTMLInputElement;
	let query = $state('');
	let selectedIndex = $state(0);

	// Get all available commands
	function getCommands(): CommandPaletteItem[] {
		const customActions: CommandPaletteItem[] = [
			{
				id: 'newProject',
				label: 'New Project',
				category: 'export',
				action: () => {
					if (confirm('Create a new project?')) {
						projectStore.reset();
					}
				}
			},
			{
				id: 'compile',
				label: 'Compile Story',
				shortcut: 'Ctrl+E',
				category: 'export',
				action: () => uiStore.openCompileModal()
			}
		];

		return getCommandPaletteItems(customActions);
	}

	// Filter commands based on query
	function getFilteredCommands(): CommandPaletteItem[] {
		const commands = getCommands();
		if (!query.trim()) return commands;

		const lowerQuery = query.toLowerCase();
		return commands.filter(
			(cmd) =>
				cmd.label.toLowerCase().includes(lowerQuery) ||
				cmd.category.toLowerCase().includes(lowerQuery) ||
				(cmd.shortcut && cmd.shortcut.toLowerCase().includes(lowerQuery))
		);
	}

	let filteredCommands = $derived(getFilteredCommands());

	// Reset selection when query changes
	$effect(() => {
		query;
		selectedIndex = 0;
	});

	function handleKeydown(e: KeyboardEvent) {
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, filteredCommands.length - 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, 0);
				break;
			case 'Enter':
				e.preventDefault();
				if (filteredCommands[selectedIndex]) {
					executeCommand(filteredCommands[selectedIndex]);
				}
				break;
			case 'Escape':
				e.preventDefault();
				uiStore.closeCommandPalette();
				break;
		}
	}

	function executeCommand(cmd: CommandPaletteItem) {
		uiStore.closeCommandPalette();
		cmd.action();
	}

	onMount(() => {
		tick().then(() => {
			searchInput?.focus();
		});
	});

	// Group commands by category
	function groupByCategory(commands: CommandPaletteItem[]): Map<string, CommandPaletteItem[]> {
		const groups = new Map<string, CommandPaletteItem[]>();
		for (const cmd of commands) {
			const existing = groups.get(cmd.category) ?? [];
			existing.push(cmd);
			groups.set(cmd.category, existing);
		}
		return groups;
	}

	let groupedCommands = $derived(groupByCategory(filteredCommands));
</script>

<!-- Backdrop -->
<div
	class="fixed inset-0 z-50 flex items-start justify-center pt-24 command-palette-backdrop"
	style="background-color: rgba(0, 0, 0, 0.5);"
	onclick={() => uiStore.closeCommandPalette()}
	onkeydown={handleKeydown}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<!-- Palette -->
	<div
		class="w-full max-w-lg rounded-lg shadow-2xl overflow-hidden"
		style="background-color: var(--bg-primary);"
		onclick={(e) => e.stopPropagation()}
		role="listbox"
	>
		<!-- Search input -->
		<div class="p-3 border-b" style="border-color: var(--border-color);">
			<input
				bind:this={searchInput}
				bind:value={query}
				type="text"
				placeholder="Type a command or search..."
				class="w-full bg-transparent outline-none text-sm"
				style="color: var(--text-primary);"
				onkeydown={handleKeydown}
			/>
		</div>

		<!-- Commands list -->
		<div class="max-h-80 overflow-auto">
			{#if filteredCommands.length === 0}
				<div class="p-4 text-center text-sm" style="color: var(--text-muted);">
					No commands found
				</div>
			{:else}
				{#each [...groupedCommands] as [category, commands]}
					<div class="px-3 py-2">
						<p class="text-xs font-medium uppercase tracking-wider mb-1" style="color: var(--text-muted);">
							{category}
						</p>
						{#each commands as cmd, i}
							{@const globalIndex = filteredCommands.indexOf(cmd)}
							<button
								class="w-full text-left px-3 py-2 rounded flex items-center justify-between text-sm"
								style="background-color: {selectedIndex === globalIndex ? 'var(--bg-tertiary)' : 'transparent'};
								       color: var(--text-primary);"
								onclick={() => executeCommand(cmd)}
								onmouseenter={() => selectedIndex = globalIndex}
								role="option"
								aria-selected={selectedIndex === globalIndex}
							>
								<span>{cmd.label}</span>
								{#if cmd.shortcut}
									<kbd
										class="px-1.5 py-0.5 text-xs rounded"
										style="background-color: var(--bg-secondary); color: var(--text-muted);"
									>
										{cmd.shortcut}
									</kbd>
								{/if}
							</button>
						{/each}
					</div>
				{/each}
			{/if}
		</div>

		<!-- Footer hint -->
		<div
			class="px-3 py-2 border-t text-xs flex items-center gap-4"
			style="border-color: var(--border-color); color: var(--text-muted);"
		>
			<span><kbd class="px-1 rounded" style="background-color: var(--bg-secondary);">↑↓</kbd> Navigate</span>
			<span><kbd class="px-1 rounded" style="background-color: var(--bg-secondary);">Enter</kbd> Select</span>
			<span><kbd class="px-1 rounded" style="background-color: var(--bg-secondary);">Esc</kbd> Close</span>
		</div>
	</div>
</div>
