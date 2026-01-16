import type { WritingNode, WritingEdge, CompilePath } from '$lib/types';

/**
 * Topological sort of nodes
 * Accepts either a Map or an array of WritingNodes
 */
export function topologicalSort(
	nodes: Map<string, WritingNode> | WritingNode[],
	edges: WritingEdge[]
): string[] {
	// Convert array to iterable if needed
	const nodeIterable = Array.isArray(nodes) ? nodes : nodes.values();

	const inDegree = new Map<string, number>();
	const adjList = new Map<string, string[]>();

	// Initialize
	for (const node of nodeIterable) {
		inDegree.set(node.id, 0);
		adjList.set(node.id, []);
	}

	// Build adjacency list and in-degrees
	for (const edge of edges) {
		if (!adjList.has(edge.source)) continue; // Skip edges to nodes not in current set
		const neighbors = adjList.get(edge.source) ?? [];
		neighbors.push(edge.target);
		adjList.set(edge.source, neighbors);
		inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
	}

	// Find all nodes with in-degree 0 (roots)
	const queue: string[] = [];
	for (const [id, degree] of inDegree) {
		if (degree === 0) {
			queue.push(id);
		}
	}

	const result: string[] = [];

	while (queue.length > 0) {
		const current = queue.shift()!;
		result.push(current);

		for (const neighbor of adjList.get(current) ?? []) {
			const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
			inDegree.set(neighbor, newDegree);
			if (newDegree === 0) {
				queue.push(neighbor);
			}
		}
	}

	return result;
}

/**
 * Find all paths from source to sink
 */
export function findAllPaths(
	sourceId: string,
	sinkId: string,
	nodes: Map<string, WritingNode>,
	edges: WritingEdge[]
): string[][] {
	const adjList = new Map<string, string[]>();

	for (const node of nodes.values()) {
		adjList.set(node.id, []);
	}

	for (const edge of edges) {
		const neighbors = adjList.get(edge.source) ?? [];
		neighbors.push(edge.target);
		adjList.set(edge.source, neighbors);
	}

	const paths: string[][] = [];

	function dfs(current: string, path: string[]): void {
		if (current === sinkId) {
			paths.push([...path]);
			return;
		}

		for (const neighbor of adjList.get(current) ?? []) {
			if (!path.includes(neighbor)) {
				path.push(neighbor);
				dfs(neighbor, path);
				path.pop();
			}
		}
	}

	dfs(sourceId, [sourceId]);
	return paths;
}

/**
 * Find root nodes (nodes with no parents)
 */
export function findRoots(
	nodes: Map<string, WritingNode>,
	edges: WritingEdge[]
): WritingNode[] {
	const hasParent = new Set(edges.map((e) => e.target));
	return Array.from(nodes.values()).filter((node) => !hasParent.has(node.id));
}

/**
 * Find leaf nodes (nodes with no children)
 */
export function findLeaves(
	nodes: Map<string, WritingNode>,
	edges: WritingEdge[]
): WritingNode[] {
	const hasChildren = new Set(edges.map((e) => e.source));
	return Array.from(nodes.values()).filter((node) => !hasChildren.has(node.id));
}

/**
 * Get ancestors of a node (all nodes that can reach it)
 */
export function getAncestors(
	nodeId: string,
	edges: WritingEdge[]
): Set<string> {
	const ancestors = new Set<string>();
	const parentMap = new Map<string, string[]>();

	for (const edge of edges) {
		const parents = parentMap.get(edge.target) ?? [];
		parents.push(edge.source);
		parentMap.set(edge.target, parents);
	}

	function collectAncestors(id: string): void {
		for (const parent of parentMap.get(id) ?? []) {
			if (!ancestors.has(parent)) {
				ancestors.add(parent);
				collectAncestors(parent);
			}
		}
	}

	collectAncestors(nodeId);
	return ancestors;
}

/**
 * Get descendants of a node (all nodes reachable from it)
 */
export function getDescendants(
	nodeId: string,
	edges: WritingEdge[]
): Set<string> {
	const descendants = new Set<string>();
	const childMap = new Map<string, string[]>();

	for (const edge of edges) {
		const children = childMap.get(edge.source) ?? [];
		children.push(edge.target);
		childMap.set(edge.source, children);
	}

	function collectDescendants(id: string): void {
		for (const child of childMap.get(id) ?? []) {
			if (!descendants.has(child)) {
				descendants.add(child);
				collectDescendants(child);
			}
		}
	}

	collectDescendants(nodeId);
	return descendants;
}

/**
 * Compile a path into concatenated text
 */
export function compilePath(
	nodeIds: string[],
	nodes: Map<string, WritingNode>
): string {
	return nodeIds
		.map((id) => nodes.get(id)?.content ?? '')
		.filter((content) => content.trim().length > 0)
		.join('\n\n');
}

/**
 * Calculate word count for a path
 */
export function getPathWordCount(
	nodeIds: string[],
	nodes: Map<string, WritingNode>
): number {
	return nodeIds.reduce((sum, id) => {
		const content = nodes.get(id)?.content ?? '';
		return sum + content.trim().split(/\s+/).filter((w) => w.length > 0).length;
	}, 0);
}

/**
 * Get compile paths with metadata
 */
export function getCompilePaths(
	sourceId: string,
	sinkId: string,
	nodes: Map<string, WritingNode>,
	edges: WritingEdge[]
): CompilePath[] {
	const paths = findAllPaths(sourceId, sinkId, nodes, edges);
	return paths.map((nodeIds) => ({
		nodeIds,
		totalWords: getPathWordCount(nodeIds, nodes)
	}));
}

/**
 * Navigate to next node in topological order
 */
export function getNextNode(
	currentId: string,
	nodes: Map<string, WritingNode>,
	edges: WritingEdge[]
): string | null {
	const sorted = topologicalSort(nodes, edges);
	const currentIndex = sorted.indexOf(currentId);
	if (currentIndex === -1 || currentIndex === sorted.length - 1) {
		return null;
	}
	return sorted[currentIndex + 1];
}

/**
 * Navigate to previous node in topological order
 */
export function getPreviousNode(
	currentId: string,
	nodes: Map<string, WritingNode>,
	edges: WritingEdge[]
): string | null {
	const sorted = topologicalSort(nodes, edges);
	const currentIndex = sorted.indexOf(currentId);
	if (currentIndex <= 0) {
		return null;
	}
	return sorted[currentIndex - 1];
}

/**
 * Get path from root to a node
 */
export function getPathToNode(
	nodeId: string,
	nodes: Map<string, WritingNode>,
	edges: WritingEdge[]
): string[] {
	const roots = findRoots(nodes, edges);
	if (roots.length === 0) return [nodeId];

	// BFS from roots to find shortest path
	const parentMap = new Map<string, string[]>();
	for (const edge of edges) {
		const parents = parentMap.get(edge.target) ?? [];
		parents.push(edge.source);
		parentMap.set(edge.target, parents);
	}

	// Backtrack from node to root
	const path: string[] = [nodeId];
	let current = nodeId;

	while (true) {
		const parents = parentMap.get(current) ?? [];
		if (parents.length === 0) break;
		current = parents[0]; // Take first parent for now
		path.unshift(current);
	}

	return path;
}
