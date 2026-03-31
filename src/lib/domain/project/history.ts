import type { ProjectDocument } from '$lib/types/project';
import { cloneDocument } from './graph';

const HISTORY_LIMIT = 100;

export function pushHistory(
	history: ProjectDocument[],
	document: ProjectDocument
): ProjectDocument[] {
	const nextHistory = [...history, cloneDocument(document)];
	if (nextHistory.length <= HISTORY_LIMIT) {
		return nextHistory;
	}

	return nextHistory.slice(nextHistory.length - HISTORY_LIMIT);
}

export function undo(
	history: ProjectDocument[],
	current: ProjectDocument,
	future: ProjectDocument[]
): { history: ProjectDocument[]; document: ProjectDocument | null; future: ProjectDocument[] } {
	const previous = history.at(-1);
	if (!previous) {
		return { history, document: null, future };
	}

	return {
		history: history.slice(0, -1),
		document: cloneDocument(previous),
		future: [cloneDocument(current), ...future]
	};
}

export function redo(
	history: ProjectDocument[],
	current: ProjectDocument,
	future: ProjectDocument[]
): { history: ProjectDocument[]; document: ProjectDocument | null; future: ProjectDocument[] } {
	const next = future[0];
	if (!next) {
		return { history, document: null, future };
	}

	return {
		history: [...history, cloneDocument(current)],
		document: cloneDocument(next),
		future: future.slice(1)
	};
}
