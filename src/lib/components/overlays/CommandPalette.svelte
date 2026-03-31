<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { getCommandDefinitions } from '$lib/commands';
	import type { CommandDefinition } from '$lib/types/ui';
	import { uiStore } from '$lib/stores/ui.svelte';

	let searchInput: HTMLInputElement;
	let query = $state('');
	let selectedIndex = $state(0);

	function getFilteredCommands(): CommandDefinition[] {
		const commands = getCommandDefinitions().filter((command) => command.isEnabled?.() ?? true);
		if (!query.trim()) {
			return commands;
		}

		const lowerQuery = query.toLowerCase();
		return commands.filter(
			(command) =>
				command.label.toLowerCase().includes(lowerQuery) ||
				command.category.toLowerCase().includes(lowerQuery) ||
				command.shortcut?.toLowerCase().includes(lowerQuery)
		);
	}

	const filteredCommands = $derived(getFilteredCommands());

	$effect(() => {
		query;
		selectedIndex = 0;
	});

	function executeCommand(command: CommandDefinition) {
		uiStore.closeCommandPalette();
		command.run();
	}

	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, filteredCommands.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, 0);
				break;
			case 'Enter':
				event.preventDefault();
				if (filteredCommands[selectedIndex]) {
					executeCommand(filteredCommands[selectedIndex]);
				}
				break;
			case 'Escape':
				event.preventDefault();
				uiStore.closeCommandPalette();
				break;
		}
	}

	function groupByCategory(commands: CommandDefinition[]): Map<string, CommandDefinition[]> {
		const groups = new Map<string, CommandDefinition[]>();
		for (const command of commands) {
			const existing = groups.get(command.category) ?? [];
			existing.push(command);
			groups.set(command.category, existing);
		}
		return groups;
	}

	const groupedCommands = $derived(groupByCategory(filteredCommands));

	onMount(() => {
		tick().then(() => searchInput?.focus());
	});
</script>

<div
	class="command-palette-backdrop fixed inset-0 z-50 flex items-start justify-center pt-[18vh]"
	style="background: rgba(0, 0, 0, 0.4);"
	onkeydown={handleKeydown}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<button
		type="button"
		class="absolute inset-0"
		style="background: transparent;"
		aria-label="Close command palette"
		onclick={() => uiStore.closeCommandPalette()}
	></button>

	<div
		class="shell-modal relative w-full max-w-lg overflow-hidden rounded-[var(--radius-2xl)]"
	>
		<div class="border-b px-5 py-4" style="border-color: var(--border-color);">
			<input
				bind:this={searchInput}
				bind:value={query}
				type="text"
				placeholder="Type a command..."
				class="shell-input w-full border-none bg-transparent px-0 text-[14px] shadow-none outline-none"
				style="font-weight: 450;"
				onkeydown={handleKeydown}
			/>
		</div>

		<div class="max-h-72 overflow-auto py-1" role="listbox" tabindex="0" aria-label="Command results">
			{#if filteredCommands.length === 0}
				<div class="px-5 py-6 text-center text-sm" style="color: var(--text-muted);">
					No commands found
				</div>
			{:else}
				{#each [...groupedCommands] as [category, commands]}
					<div class="px-2 py-2">
						<p class="shell-label mb-1.5 px-3">
							{category}
						</p>
						{#each commands as command}
							{@const globalIndex = filteredCommands.indexOf(command)}
							<button
								class="command-item flex w-full items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-left text-[13px]"
								class:active={selectedIndex === globalIndex}
								onclick={() => executeCommand(command)}
								onmouseenter={() => (selectedIndex = globalIndex)}
								role="option"
								aria-selected={selectedIndex === globalIndex}
							>
								<span style="color: var(--text-primary);">{command.label}</span>
								{#if command.shortcut}
									<kbd class="shell-kbd px-1.5 py-0.5">
										{command.shortcut}
									</kbd>
								{/if}
							</button>
						{/each}
					</div>
				{/each}
			{/if}
		</div>

		<div
			class="flex items-center gap-4 border-t px-5 py-2.5 text-[10.5px]"
			style="border-color: var(--border-color);"
		>
			<span class="shell-hint"><kbd class="shell-kbd">↑↓</kbd> Navigate</span>
			<span class="shell-hint"><kbd class="shell-kbd">Enter</kbd> Select</span>
			<span class="shell-hint"><kbd class="shell-kbd">Esc</kbd> Close</span>
		</div>
	</div>
</div>

<style>
	.command-item {
		transition: background-color 0.1s ease;
	}

	.command-item:hover,
	.command-item.active {
		background-color: var(--accent-color-light);
	}
</style>
