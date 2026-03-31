import type { CompilePath, ProjectGraph, WritingNode } from '$lib/types/project';
import { getNodeMap } from './graph';

export function getWordCount(text: string): number {
	return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
}

export function getRecursiveWordCount(graph: ProjectGraph): number {
	return graph.nodes.reduce((sum, node) => {
		const nestedCount = node.subProject ? getRecursiveWordCount(node.subProject) : 0;
		return sum + getWordCount(node.content) + nestedCount;
	}, 0);
}

export function topologicalSort(graph: ProjectGraph): string[] {
	const inDegree = new Map<string, number>();
	const adjacency = new Map<string, string[]>();

	for (const node of graph.nodes) {
		inDegree.set(node.id, 0);
		adjacency.set(node.id, []);
	}

	for (const edge of graph.edges) {
		if (!adjacency.has(edge.source) || !inDegree.has(edge.target)) {
			continue;
		}

		adjacency.get(edge.source)!.push(edge.target);
		inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
	}

	const queue = Array.from(inDegree.entries())
		.filter(([, degree]) => degree === 0)
		.map(([id]) => id);
	const sorted: string[] = [];

	while (queue.length > 0) {
		const current = queue.shift()!;
		sorted.push(current);

		for (const neighbor of adjacency.get(current) ?? []) {
			const nextDegree = (inDegree.get(neighbor) ?? 0) - 1;
			inDegree.set(neighbor, nextDegree);
			if (nextDegree === 0) {
				queue.push(neighbor);
			}
		}
	}

	if (sorted.length === graph.nodes.length) {
		return sorted;
	}

	const fallback = graph.nodes.map((node) => node.id);
	return [...sorted, ...fallback.filter((nodeId) => !sorted.includes(nodeId))];
}

export function findRoots(graph: ProjectGraph): WritingNode[] {
	const targets = new Set(graph.edges.map((edge) => edge.target));
	return graph.nodes.filter((node) => !targets.has(node.id));
}

export function findLeaves(graph: ProjectGraph): WritingNode[] {
	const sources = new Set(graph.edges.map((edge) => edge.source));
	return graph.nodes.filter((node) => !sources.has(node.id));
}

export function findAllPaths(
	graph: ProjectGraph,
	sourceId: string,
	sinkId: string
): string[][] {
	const adjacency = new Map<string, string[]>();

	for (const node of graph.nodes) {
		adjacency.set(node.id, []);
	}

	for (const edge of graph.edges) {
		(adjacency.get(edge.source) ?? []).push(edge.target);
	}

	const paths: string[][] = [];

	function visit(current: string, path: string[]) {
		if (current === sinkId) {
			paths.push([...path]);
			return;
		}

		for (const neighbor of adjacency.get(current) ?? []) {
			if (!path.includes(neighbor)) {
				path.push(neighbor);
				visit(neighbor, path);
				path.pop();
			}
		}
	}

	visit(sourceId, [sourceId]);
	return paths;
}

export function compilePath(graph: ProjectGraph, nodeIds: string[]): string {
	const nodeMap = getNodeMap(graph);
	return nodeIds
		.map((id) => nodeMap.get(id)?.content ?? '')
		.filter((content) => content.trim().length > 0)
		.join('\n\n');
}

export function getPathWordCount(graph: ProjectGraph, nodeIds: string[]): number {
	const nodeMap = getNodeMap(graph);
	return nodeIds.reduce((sum, nodeId) => {
		const content = nodeMap.get(nodeId)?.content ?? '';
		return sum + getWordCount(content);
	}, 0);
}

export function getCompilePaths(
	graph: ProjectGraph,
	sourceId: string,
	sinkId: string
): CompilePath[] {
	return findAllPaths(graph, sourceId, sinkId).map((nodeIds) => ({
		nodeIds,
		totalWords: getPathWordCount(graph, nodeIds)
	}));
}

export function getNextNodeId(graph: ProjectGraph, currentId: string): string | null {
	const sorted = topologicalSort(graph);
	const index = sorted.indexOf(currentId);
	if (index === -1 || index === sorted.length - 1) {
		return null;
	}
	return sorted[index + 1];
}

export function getPreviousNodeId(graph: ProjectGraph, currentId: string): string | null {
	const sorted = topologicalSort(graph);
	const index = sorted.indexOf(currentId);
	if (index <= 0) {
		return null;
	}
	return sorted[index - 1];
}

export function getPathToNode(graph: ProjectGraph, nodeId: string): string[] {
	const parents = new Map<string, string[]>();

	for (const edge of graph.edges) {
		const existing = parents.get(edge.target) ?? [];
		existing.push(edge.source);
		parents.set(edge.target, existing);
	}

	const path = [nodeId];
	let current = nodeId;

	while (true) {
		const currentParents = parents.get(current) ?? [];
		if (currentParents.length === 0) {
			break;
		}

		current = currentParents[0];
		path.unshift(current);
	}

	return path;
}
