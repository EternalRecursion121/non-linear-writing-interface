import dagre from '@dagrejs/dagre';
import type { WritingNode, WritingEdge } from '$lib/types';

export interface LayoutOptions {
	direction: 'TB' | 'LR' | 'BT' | 'RL';
	nodeWidth: number;
	nodeHeight: number;
	rankSep: number;
	nodeSep: number;
}

const DEFAULT_OPTIONS: LayoutOptions = {
	direction: 'TB',
	nodeWidth: 200,
	nodeHeight: 100,
	rankSep: 80,
	nodeSep: 50
};

/**
 * Apply Dagre auto-layout to nodes
 */
export function autoLayout(
	nodes: WritingNode[],
	edges: WritingEdge[],
	options: Partial<LayoutOptions> = {}
): Map<string, { x: number; y: number }> {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	const g = new dagre.graphlib.Graph();

	g.setGraph({
		rankdir: opts.direction,
		ranksep: opts.rankSep,
		nodesep: opts.nodeSep
	});

	g.setDefaultEdgeLabel(() => ({}));

	// Add nodes
	for (const node of nodes) {
		g.setNode(node.id, {
			width: opts.nodeWidth,
			height: opts.nodeHeight
		});
	}

	// Add edges
	for (const edge of edges) {
		g.setEdge(edge.source, edge.target);
	}

	// Run layout
	dagre.layout(g);

	// Extract positions
	const positions = new Map<string, { x: number; y: number }>();

	for (const node of nodes) {
		const dagreNode = g.node(node.id);
		if (dagreNode) {
			positions.set(node.id, {
				x: dagreNode.x - opts.nodeWidth / 2,
				y: dagreNode.y - opts.nodeHeight / 2
			});
		}
	}

	return positions;
}

/**
 * Center nodes around a specific point
 */
export function centerNodes(
	positions: Map<string, { x: number; y: number }>,
	centerX: number,
	centerY: number
): Map<string, { x: number; y: number }> {
	if (positions.size === 0) return positions;

	// Calculate current center
	let minX = Infinity,
		maxX = -Infinity;
	let minY = Infinity,
		maxY = -Infinity;

	for (const pos of positions.values()) {
		minX = Math.min(minX, pos.x);
		maxX = Math.max(maxX, pos.x);
		minY = Math.min(minY, pos.y);
		maxY = Math.max(maxY, pos.y);
	}

	const currentCenterX = (minX + maxX) / 2;
	const currentCenterY = (minY + maxY) / 2;

	const offsetX = centerX - currentCenterX;
	const offsetY = centerY - currentCenterY;

	// Apply offset
	const centered = new Map<string, { x: number; y: number }>();
	for (const [id, pos] of positions) {
		centered.set(id, {
			x: pos.x + offsetX,
			y: pos.y + offsetY
		});
	}

	return centered;
}

/**
 * Calculate bounding box of nodes
 */
export function getBoundingBox(
	positions: Map<string, { x: number; y: number }>,
	nodeWidth: number,
	nodeHeight: number
): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
	if (positions.size === 0) {
		return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
	}

	let minX = Infinity,
		maxX = -Infinity;
	let minY = Infinity,
		maxY = -Infinity;

	for (const pos of positions.values()) {
		minX = Math.min(minX, pos.x);
		maxX = Math.max(maxX, pos.x + nodeWidth);
		minY = Math.min(minY, pos.y);
		maxY = Math.max(maxY, pos.y + nodeHeight);
	}

	return {
		minX,
		minY,
		maxX,
		maxY,
		width: maxX - minX,
		height: maxY - minY
	};
}

/**
 * Calculate zoom to fit all nodes in viewport
 */
export function calculateFitZoom(
	positions: Map<string, { x: number; y: number }>,
	nodeWidth: number,
	nodeHeight: number,
	viewportWidth: number,
	viewportHeight: number,
	padding: number = 50
): { zoom: number; x: number; y: number } {
	const bounds = getBoundingBox(positions, nodeWidth, nodeHeight);

	if (bounds.width === 0 || bounds.height === 0) {
		return { zoom: 1, x: 0, y: 0 };
	}

	const availableWidth = viewportWidth - padding * 2;
	const availableHeight = viewportHeight - padding * 2;

	const zoomX = availableWidth / bounds.width;
	const zoomY = availableHeight / bounds.height;
	const zoom = Math.min(zoomX, zoomY, 1); // Don't zoom in beyond 1

	const x = (viewportWidth - bounds.width * zoom) / 2 - bounds.minX * zoom;
	const y = (viewportHeight - bounds.height * zoom) / 2 - bounds.minY * zoom;

	return { zoom, x, y };
}
