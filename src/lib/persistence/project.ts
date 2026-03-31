import type { ProjectDocument } from '$lib/types/project';
import { projectStore } from '$lib/stores/project.svelte';
import { uiStore } from '$lib/stores/ui.svelte';

function assertProjectDocument(project: unknown): asserts project is ProjectDocument {
	if (!project || typeof project !== 'object') {
		throw new Error('Invalid project payload');
	}

	const candidate = project as Partial<ProjectDocument>;
	if (candidate.version !== '2.0') {
		throw new Error('Invalid project version');
	}
	if (!candidate.graph || !Array.isArray(candidate.graph.nodes) || !Array.isArray(candidate.graph.edges)) {
		throw new Error('Invalid project graph');
	}
}

export async function loadProjectFromFile(): Promise<boolean> {
	try {
		const response = await fetch('/api/project');
		if (!response.ok) {
			throw new Error('Load failed');
		}

		const payload = await response.json();
		if (!payload.exists || !payload.project) {
			return false;
		}

		assertProjectDocument(payload.project);
		projectStore.loadProject(payload.project);
		uiStore.setAutosaveStatus('saved');
		uiStore.showToast('Project loaded', 'success');
		return true;
	} catch (error) {
		console.error('Load failed:', error);
		uiStore.showToast('Failed to load project', 'error');
		return false;
	}
}

export async function saveProjectToFile(): Promise<void> {
	const response = await fetch('/api/project', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(projectStore.project)
	});

	if (!response.ok) {
		throw new Error('Save failed');
	}
}

export function saveToLocalStorage(): void {
	localStorage.setItem('nlw-project-v2', JSON.stringify(projectStore.project));
}

export function loadFromLocalStorage(): boolean {
	const raw = localStorage.getItem('nlw-project-v2');
	if (!raw) {
		return false;
	}

	try {
		const project = JSON.parse(raw);
		assertProjectDocument(project);
		projectStore.loadProject(project);
		uiStore.setAutosaveStatus('saved');
		uiStore.showToast('Project loaded from local backup', 'success');
		return true;
	} catch (error) {
		console.error('Local load failed:', error);
		return false;
	}
}

export function createProjectPersistenceController() {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let lastRevision = projectStore.dirtyRevision;
	let intervalId: ReturnType<typeof setInterval> | null = null;

	function scheduleSave() {
		if (!projectStore.hydrated || projectStore.dirtyRevision === lastRevision) {
			return;
		}

		uiStore.setAutosaveStatus('unsaved');

		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(async () => {
			uiStore.setAutosaveStatus('saving');

			try {
				await saveProjectToFile();
				saveToLocalStorage();
				lastRevision = projectStore.dirtyRevision;
				uiStore.setAutosaveStatus('saved');
			} catch (error) {
				console.error('Autosave failed:', error);
				uiStore.setAutosaveStatus('unsaved');
				uiStore.showToast('Failed to save project', 'error');
			}
		}, 1000);
	}

	intervalId = setInterval(scheduleSave, 250);

	const stop = () => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		if (intervalId) {
			clearInterval(intervalId);
		}
	};

	return {
		stop
	};
}

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
	const anchor = document.createElement('a');

	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}
