import { autoLayout, centerNodes } from '$lib/utils/layout';
import type {
	GraphPath,
	GraphMutationResult,
	ProjectDocument,
	ProjectGraph,
	ProjectSettings,
	ViewState,
	WritingEdge,
	WritingNode
} from '$lib/types/project';
import {
	createNode,
	ensureSelection,
	getActiveGraph,
	getGraphAtPath,
	getNodeById,
	getSelectedNode,
	updateGraphAtPath
} from './graph';
import { validateEdge } from './validation';

function updateActiveGraph(
	document: ProjectDocument,
	updater: (graph: ProjectGraph) => ProjectGraph
): ProjectDocument {
	return ensureSelection({
		...document,
		graph: updateGraphAtPath(document.graph, document.viewState.projectPath, updater)
	});
}

export function updateProjectName(document: ProjectDocument, name: string): ProjectDocument {
	return {
		...document,
		name
	};
}

export function updateSettings(
	document: ProjectDocument,
	updates: Partial<ProjectSettings>
): ProjectDocument {
	return {
		...document,
		settings: {
			...document.settings,
			...updates
		}
	};
}

export function updateViewState(
	document: ProjectDocument,
	updates: Partial<ViewState>
): ProjectDocument {
	return ensureSelection({
		...document,
		viewState: {
			...document.viewState,
			...updates
		}
	});
}

export function selectNode(document: ProjectDocument, nodeId: string | null): ProjectDocument {
	return {
		...document,
		viewState: {
			...document.viewState,
			selectedNodeId: nodeId
		}
	};
}

export function updateSelectedNode(
	document: ProjectDocument,
	updates: Partial<WritingNode>
): ProjectDocument {
	const selectedNodeId = document.viewState.selectedNodeId;
	if (!selectedNodeId) {
		return document;
	}

	return updateNode(document, selectedNodeId, updates);
}

export function updateNode(
	document: ProjectDocument,
	nodeId: string,
	updates: Partial<WritingNode>
): ProjectDocument {
	return updateActiveGraph(document, (graph) => ({
		...graph,
		nodes: graph.nodes.map((node) =>
			node.id === nodeId
				? {
						...node,
						...updates,
						updatedAt: Date.now()
					}
				: node
		)
	}));
}

export function addNode(
	document: ProjectDocument,
	partial: Partial<WritingNode> = {}
): { document: ProjectDocument; node: WritingNode } {
	const node = createNode(partial);
	const nextDocument = updateActiveGraph(document, (graph) => ({
		...graph,
		nodes: [...graph.nodes, node]
	}));

	return {
		document: selectNode(nextDocument, node.id),
		node
	};
}

export function connectNodes(
	document: ProjectDocument,
	sourceId: string,
	targetId: string
): { document: ProjectDocument; result: GraphMutationResult } {
	const activeGraph = getActiveGraph(document);
	const result = validateEdge(activeGraph, sourceId, targetId);
	if (!result.ok) {
		return { document, result };
	}

	const edge: WritingEdge = {
		id: `${sourceId}-${targetId}`,
		source: sourceId,
		target: targetId
	};

	return {
		document: updateActiveGraph(document, (graph) => ({
			...graph,
			edges: [...graph.edges, edge]
		})),
		result
	};
}

export function deleteNode(document: ProjectDocument, nodeId: string): ProjectDocument {
	const activeGraph = getActiveGraph(document);
	const nextEdges = activeGraph.edges.filter(
		(edge) => edge.source !== nodeId && edge.target !== nodeId
	);
	const nextNodes = activeGraph.nodes.filter((node) => node.id !== nodeId);

	let nextDocument = updateActiveGraph(document, () => ({
		nodes: nextNodes,
		edges: nextEdges
	}));

	const nextSelectedId =
		nextNodes.find((node) => node.id === document.viewState.selectedNodeId)?.id ??
		nextNodes[0]?.id ??
		null;

	nextDocument = selectNode(nextDocument, nextSelectedId);
	return ensureSelection(nextDocument);
}

export function createSubProject(document: ProjectDocument, nodeId: string): ProjectDocument {
	return updateNode(document, nodeId, {
		subProject: {
			nodes: [createNode()],
			edges: []
		}
	});
}

export function drillInto(document: ProjectDocument, nodeId: string): ProjectDocument {
	const activeGraph = getActiveGraph(document);
	const node = getNodeById(activeGraph, nodeId);
	if (!node?.subProject) {
		return document;
	}

	return ensureSelection({
		...document,
		viewState: {
			...document.viewState,
			projectPath: [...document.viewState.projectPath, nodeId],
			selectedNodeId: node.subProject.nodes[0]?.id ?? null
		}
	});
}

export function drillUp(document: ProjectDocument): ProjectDocument {
	if (document.viewState.projectPath.length === 0) {
		return document;
	}

	const currentPath = document.viewState.projectPath;
	const parentId = currentPath.at(-1) ?? null;

	return ensureSelection({
		...document,
		viewState: {
			...document.viewState,
			projectPath: currentPath.slice(0, -1),
			selectedNodeId: parentId
		}
	});
}

export function drillToDepth(document: ProjectDocument, depth: number): ProjectDocument {
	const currentPath = document.viewState.projectPath;
	if (depth < 0 || depth > currentPath.length) {
		return document;
	}

	const nextPath = currentPath.slice(0, depth);
	let selectedNodeId: string | null = null;

	if (depth > 0) {
		selectedNodeId = nextPath.at(-1) ?? null;
	} else {
		selectedNodeId = document.graph.nodes[0]?.id ?? null;
	}

	return ensureSelection({
		...document,
		viewState: {
			...document.viewState,
			projectPath: nextPath,
			selectedNodeId
		}
	});
}

export function branchSelectedNode(
	document: ProjectDocument,
	cursorPosition: number
): { document: ProjectDocument; branchNodeId: string | null } {
	const selectedNode = getSelectedNode(document);
	if (!selectedNode) {
		return { document, branchNodeId: null };
	}

	const textBefore = selectedNode.content.slice(0, cursorPosition);
	const textAfter = selectedNode.content.slice(cursorPosition);

	let nextDocument = updateNode(document, selectedNode.id, {
		content: textBefore
	});

	const continuationNode = createNode({
		content: textBefore + textAfter,
		planContent: selectedNode.planContent,
		position: {
			x: selectedNode.position.x - 150,
			y: selectedNode.position.y + 150
		}
	});

	const branchNode = createNode({
		content: textBefore,
		planContent: selectedNode.planContent,
		position: {
			x: selectedNode.position.x + 150,
			y: selectedNode.position.y + 150
		}
	});

	nextDocument = updateActiveGraph(nextDocument, (graph) => ({
		...graph,
		nodes: [...graph.nodes, continuationNode, branchNode],
		edges: [
			...graph.edges,
			{
				id: `${selectedNode.id}-${continuationNode.id}`,
				source: selectedNode.id,
				target: continuationNode.id
			},
			{
				id: `${selectedNode.id}-${branchNode.id}`,
				source: selectedNode.id,
				target: branchNode.id
			}
		]
	}));

	return {
		document: selectNode(nextDocument, branchNode.id),
		branchNodeId: branchNode.id
	};
}

export function parallelizeSelectedNode(
	document: ProjectDocument,
	selectionStart: number,
	selectionEnd: number
): { document: ProjectDocument; branchNodeId: string | null } {
	const selectedNode = getSelectedNode(document);
	if (!selectedNode) {
		return { document, branchNodeId: null };
	}

	const branchNode = createNode({
		content:
			selectionStart === selectionEnd
				? selectedNode.content
				: selectedNode.content.slice(0, selectionStart) +
					selectedNode.content.slice(selectionEnd),
		planContent: selectedNode.planContent,
		position: {
			x: selectedNode.position.x + 150,
			y: selectedNode.position.y + 150
		}
	});

	const nextDocument = updateActiveGraph(document, (graph) => ({
		...graph,
		nodes: [...graph.nodes, branchNode],
		edges: [
			...graph.edges,
			{
				id: `${selectedNode.id}-${branchNode.id}`,
				source: selectedNode.id,
				target: branchNode.id
			}
		]
	}));

	return {
		document: selectNode(nextDocument, selectedNode.id),
		branchNodeId: branchNode.id
	};
}

export function autoLayoutActiveGraph(document: ProjectDocument): ProjectDocument {
	const activeGraph = getActiveGraph(document);
	const positions = centerNodes(autoLayout(activeGraph.nodes, activeGraph.edges), 400, 300);

	return updateActiveGraph(document, (graph) => ({
		...graph,
		nodes: graph.nodes.map((node) => ({
			...node,
			position: positions.get(node.id) ?? node.position,
			updatedAt: Date.now()
		}))
	}));
}

export function getChildren(document: ProjectDocument, nodeId: string): WritingNode[] {
	const graph = getActiveGraph(document);
	const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));
	const childIds = graph.edges
		.filter((edge) => edge.source === nodeId)
		.map((edge) => edge.target);

	return childIds
		.map((childId) => nodeMap.get(childId) ?? null)
		.filter((node): node is WritingNode => node !== null);
}

export function getParents(document: ProjectDocument, nodeId: string): WritingNode[] {
	const graph = getActiveGraph(document);
	const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));
	const parentIds = graph.edges
		.filter((edge) => edge.target === nodeId)
		.map((edge) => edge.source);

	return parentIds
		.map((parentId) => nodeMap.get(parentId) ?? null)
		.filter((node): node is WritingNode => node !== null);
}

export function removeEdge(document: ProjectDocument, edgeId: string): ProjectDocument {
	return updateActiveGraph(document, (graph) => ({
		...graph,
		edges: graph.edges.filter((edge) => edge.id !== edgeId)
	}));
}

export function resetProject(): ProjectDocument {
	const nextDocument = {
		version: '2.0',
		name: 'Untitled Project',
		graph: {
			nodes: [createNode()],
			edges: []
		},
		settings: {
			fontFamily: 'literata',
			theme: 'sepia',
			fontSize: 'small'
		},
		viewState: {
			zoom: 1,
			pan: { x: 0, y: 0 },
			selectedNodeId: null,
			projectPath: []
		}
	} satisfies ProjectDocument;

	return ensureSelection(nextDocument);
}

export function getGraphForPath(document: ProjectDocument, path: GraphPath): ProjectGraph | null {
	return getGraphAtPath(document.graph, path);
}
