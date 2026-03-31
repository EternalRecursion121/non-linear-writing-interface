import type { GraphMutationResult, ProjectGraph } from '$lib/types/project';

function hasPath(graph: ProjectGraph, sourceId: string, targetId: string): boolean {
	const adjacency = new Map<string, string[]>();

	for (const node of graph.nodes) {
		adjacency.set(node.id, []);
	}

	for (const edge of graph.edges) {
		const existing = adjacency.get(edge.source) ?? [];
		existing.push(edge.target);
		adjacency.set(edge.source, existing);
	}

	const visited = new Set<string>();
	const queue = [sourceId];

	while (queue.length > 0) {
		const current = queue.shift()!;
		if (current === targetId) {
			return true;
		}

		for (const neighbor of adjacency.get(current) ?? []) {
			if (!visited.has(neighbor)) {
				visited.add(neighbor);
				queue.push(neighbor);
			}
		}
	}

	return false;
}

export function validateEdge(
	graph: ProjectGraph,
	sourceId: string,
	targetId: string
): GraphMutationResult {
	const nodeIds = new Set(graph.nodes.map((node) => node.id));

	if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) {
		return { ok: false, reason: 'missing-node' };
	}

	if (sourceId === targetId || hasPath(graph, targetId, sourceId)) {
		return { ok: false, reason: 'cycle' };
	}

	const duplicate = graph.edges.some(
		(edge) => edge.source === sourceId && edge.target === targetId
	);
	if (duplicate) {
		return { ok: false, reason: 'duplicate-edge' };
	}

	return { ok: true };
}
