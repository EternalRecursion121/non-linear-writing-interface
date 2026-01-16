import type { Project } from '$lib/types';
import { projectStore } from '$lib/stores/project.svelte';
import { uiStore } from '$lib/stores/ui.svelte';

const PROJECT_VERSION = '1.0';

/**
 * Save project to the server (data/ directory)
 */
export async function saveProjectToFile(): Promise<void> {
	const project = projectStore.toProject();

	try {
		uiStore.setAutosaveStatus('saving');

		const response = await fetch('/api/project', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(project)
		});

		if (!response.ok) {
			throw new Error('Save failed');
		}

		uiStore.setAutosaveStatus('saved');
		uiStore.showToast('Project saved', 'success');
	} catch (err) {
		console.error('Save failed:', err);
		uiStore.setAutosaveStatus('unsaved');
		uiStore.showToast('Failed to save project', 'error');
	}
}

/**
 * Load project from the server (data/ directory)
 */
export async function loadProjectFromFile(): Promise<boolean> {
	try {
		const response = await fetch('/api/project');
		const data = await response.json();

		if (!data.exists) {
			return false;
		}

		if (data.project) {
			validateProject(data.project);
			projectStore.loadProject(data.project);
			uiStore.setAutosaveStatus('saved');
			uiStore.showToast('Project loaded', 'success');
			return true;
		}

		return false;
	} catch (err) {
		console.error('Load failed:', err);
		return false;
	}
}

/**
 * Validate project structure
 */
function validateProject(project: any): asserts project is Project {
	if (!project.version) {
		throw new Error('Invalid project: missing version');
	}
	if (!Array.isArray(project.nodes)) {
		throw new Error('Invalid project: missing nodes');
	}
	if (!Array.isArray(project.edges)) {
		throw new Error('Invalid project: missing edges');
	}
}

/**
 * Export compiled story as Markdown (downloads to user's computer)
 */
export function exportAsMarkdown(
	content: string,
	metadata: { title: string; author?: string; compiledAt: string }
): void {
	const frontmatter = `---
title: ${metadata.title}
${metadata.author ? `author: ${metadata.author}` : ''}
compiled: ${metadata.compiledAt}
generator: Non-Linear Writing Interface
---

`;

	const markdown = frontmatter + content;
	const blob = new Blob([markdown], { type: 'text/markdown' });

	const filename = `${metadata.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;

	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);

	uiStore.showToast('Story exported', 'success');
}

/**
 * Create debounced autosave function
 */
export function createAutosave(
	saveFunction: () => Promise<void>,
	delay: number = 2000
): () => void {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	return () => {
		uiStore.setAutosaveStatus('unsaved');

		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(async () => {
			uiStore.setAutosaveStatus('saving');
			try {
				await saveFunction();
				uiStore.setAutosaveStatus('saved');
			} catch (err) {
				console.error('Autosave failed:', err);
				uiStore.setAutosaveStatus('unsaved');
			}
		}, delay);
	};
}

/**
 * Save to localStorage (for browser persistence - backup)
 */
export function saveToLocalStorage(): void {
	const project = projectStore.toProject();
	localStorage.setItem('nlw-autosave', JSON.stringify(project));
}

/**
 * Load from localStorage
 */
export function loadFromLocalStorage(): boolean {
	const saved = localStorage.getItem('nlw-autosave');
	if (!saved) return false;

	try {
		const project = JSON.parse(saved) as Project;
		validateProject(project);
		projectStore.loadProject(project);
		return true;
	} catch (err) {
		console.error('Failed to load autosave:', err);
		return false;
	}
}

/**
 * Clear localStorage autosave
 */
export function clearLocalStorage(): void {
	localStorage.removeItem('nlw-autosave');
}
