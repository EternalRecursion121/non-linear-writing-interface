import { nanoid } from 'nanoid';
import type { WritingNode, WritingEdge, BranchResult } from '$lib/types';

/**
 * Split a node at the cursor position, creating two children:
 * - Continuation node: contains text after cursor
 * - Branch node: empty, for new writing direction
 *
 * Plan content is copied to both children.
 */
export function branchAtCursor(
	node: WritingNode,
	cursorPosition: number,
	nodePosition: { x: number; y: number }
): BranchResult {
	const textBefore = node.content.slice(0, cursorPosition);
	const textAfter = node.content.slice(cursorPosition);

	// Calculate positions for new nodes (below and spread horizontally)
	const continuationPosition = {
		x: nodePosition.x - 150,
		y: nodePosition.y + 150
	};

	const branchPosition = {
		x: nodePosition.x + 150,
		y: nodePosition.y + 150
	};

	// Update original node to only contain text before cursor
	const updatedOriginal: WritingNode = {
		...node,
		content: textBefore,
		updatedAt: Date.now()
	};

	// Create continuation node with text after cursor
	const continuationNode: WritingNode = {
		id: nanoid(),
		content: textAfter,
		planContent: node.planContent, // Copy plan content
		position: continuationPosition,
		createdAt: Date.now(),
		updatedAt: Date.now()
	};

	// Create empty branch node for new direction
	const branchNode: WritingNode = {
		id: nanoid(),
		content: '',
		planContent: node.planContent, // Copy plan content
		position: branchPosition,
		createdAt: Date.now(),
		updatedAt: Date.now()
	};

	// Create edges from original to both children
	const newEdges: WritingEdge[] = [
		{
			id: `${node.id}-${continuationNode.id}`,
			source: node.id,
			target: continuationNode.id
		},
		{
			id: `${node.id}-${branchNode.id}`,
			source: node.id,
			target: branchNode.id
		}
	];

	return {
		originalNode: updatedOriginal,
		continuationNode,
		branchNode,
		newEdges
	};
}

/**
 * Create a simple child node without branching
 */
export function createChildNode(
	parentNode: WritingNode,
	content: string = ''
): { node: WritingNode; edge: WritingEdge } {
	const node: WritingNode = {
		id: nanoid(),
		content,
		planContent: parentNode.planContent,
		position: {
			x: parentNode.position.x,
			y: parentNode.position.y + 150
		},
		createdAt: Date.now(),
		updatedAt: Date.now()
	};

	const edge: WritingEdge = {
		id: `${parentNode.id}-${node.id}`,
		source: parentNode.id,
		target: node.id
	};

	return { node, edge };
}

/**
 * Merge two sibling nodes (if they have the same parent)
 */
export function canMergeNodes(
	node1Id: string,
	node2Id: string,
	edges: WritingEdge[]
): boolean {
	const parents1 = edges.filter((e) => e.target === node1Id).map((e) => e.source);
	const parents2 = edges.filter((e) => e.target === node2Id).map((e) => e.source);

	// Check if they share at least one parent
	return parents1.some((p) => parents2.includes(p));
}
