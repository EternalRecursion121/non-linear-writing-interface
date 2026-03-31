import { nanoid } from 'nanoid';
import type {
	FontFamily,
	FontSize,
	GraphPath,
	ProjectDocument,
	ProjectGraph,
	ProjectSettings,
	Theme,
	ViewState,
	WritingNode
} from '$lib/types/project';

const DEFAULT_FONT_FAMILY: FontFamily = 'literata';
const DEFAULT_THEME: Theme = 'sepia';
const DEFAULT_FONT_SIZE: FontSize = 'small';

export function createDefaultSettings(): ProjectSettings {
	return {
		fontFamily: DEFAULT_FONT_FAMILY,
		theme: DEFAULT_THEME,
		fontSize: DEFAULT_FONT_SIZE
	};
}

export function createDefaultViewState(): ViewState {
	return {
		zoom: 1,
		pan: { x: 0, y: 0 },
		selectedNodeId: null,
		projectPath: []
	};
}

export function createNode(partial: Partial<WritingNode> = {}): WritingNode {
	const now = Date.now();
	return {
		id: nanoid(),
		content: '',
		planContent: '',
		position: { x: 250, y: 100 },
		createdAt: now,
		updatedAt: now,
		...partial
	};
}

export function createEmptyGraph(): ProjectGraph {
	return {
		nodes: [createNode()],
		edges: []
	};
}

export function createProjectDocument(): ProjectDocument {
	const graph = createEmptyGraph();
	return {
		version: '2.0',
		name: 'Untitled Project',
		graph,
		settings: createDefaultSettings(),
		viewState: {
			...createDefaultViewState(),
			selectedNodeId: graph.nodes[0]?.id ?? null
		}
	};
}

export function cloneDocument(document: ProjectDocument): ProjectDocument {
	return JSON.parse(JSON.stringify(document)) as ProjectDocument;
}

export function getNodeDisplayTitle(node: WritingNode): string {
	if (node.title) return node.title;
	const firstLine = node.content.split('\n')[0]?.trim() ?? '';
	return firstLine.slice(0, 30) || 'Untitled';
}

export function getGraphAtPath(graph: ProjectGraph, path: GraphPath): ProjectGraph | null {
	let current = graph;

	for (const nodeId of path) {
		const node = current.nodes.find((candidate) => candidate.id === nodeId);
		if (!node?.subProject) {
			return null;
		}
		current = node.subProject;
	}

	return current;
}

export function updateGraphAtPath(
	graph: ProjectGraph,
	path: GraphPath,
	updater: (currentGraph: ProjectGraph) => ProjectGraph
): ProjectGraph {
	if (path.length === 0) {
		return updater(graph);
	}

	const [nodeId, ...rest] = path;

	return {
		...graph,
		nodes: graph.nodes.map((node) => {
			if (node.id !== nodeId || !node.subProject) {
				return node;
			}

			return {
				...node,
				subProject: updateGraphAtPath(node.subProject, rest, updater),
				updatedAt: Date.now()
			};
		})
	};
}

export function getActiveGraph(document: ProjectDocument): ProjectGraph {
	return getGraphAtPath(document.graph, document.viewState.projectPath) ?? document.graph;
}

export function getActiveNodes(document: ProjectDocument): WritingNode[] {
	return getActiveGraph(document).nodes;
}

export function getActiveEdges(document: ProjectDocument) {
	return getActiveGraph(document).edges;
}

export function getNodeById(graph: ProjectGraph, nodeId: string): WritingNode | null {
	return graph.nodes.find((node) => node.id === nodeId) ?? null;
}

export function getSelectedNode(document: ProjectDocument): WritingNode | null {
	const selectedNodeId = document.viewState.selectedNodeId;
	if (!selectedNodeId) {
		return null;
	}

	return getNodeById(getActiveGraph(document), selectedNodeId);
}

export function getNodeMap(graph: ProjectGraph): Map<string, WritingNode> {
	return new Map(graph.nodes.map((node) => [node.id, node]));
}

export function ensureSelection(document: ProjectDocument): ProjectDocument {
	const activeGraph = getActiveGraph(document);
	const hasSelection = activeGraph.nodes.some(
		(node) => node.id === document.viewState.selectedNodeId
	);

	if (hasSelection) {
		return document;
	}

	return {
		...document,
		viewState: {
			...document.viewState,
			selectedNodeId: activeGraph.nodes[0]?.id ?? null
		}
	};
}

export function getBreadcrumbPath(document: ProjectDocument): { id: string; title: string }[] {
	const breadcrumbs: { id: string; title: string }[] = [];
	let currentGraph = document.graph;

	for (const nodeId of document.viewState.projectPath) {
		const node = currentGraph.nodes.find((candidate) => candidate.id === nodeId);
		if (!node) {
			break;
		}

		breadcrumbs.push({
			id: node.id,
			title: getNodeDisplayTitle(node)
		});

		if (!node.subProject) {
			break;
		}

		currentGraph = node.subProject;
	}

	return breadcrumbs;
}
