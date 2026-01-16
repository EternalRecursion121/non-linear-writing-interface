import { nanoid } from 'nanoid';
import type { WritingNode, WritingEdge, BranchResult, ParallelizeResult } from '$lib/types';

/**
 * Split a node at the cursor position, creating two children:
 * - Continuation node: contains FULL content (text before + after cursor)
 * - Branch node: contains text before cursor (for alternative continuation)
 *
 * Original node becomes a checkpoint with only text before cursor.
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

	// Update original node to only contain text before cursor (checkpoint)
	const updatedOriginal: WritingNode = {
		...node,
		content: textBefore,
		updatedAt: Date.now()
	};

	// Create continuation node with FULL content (preserves original path)
	const continuationNode: WritingNode = {
		id: nanoid(),
		content: textBefore + textAfter, // Full original content
		planContent: node.planContent,
		position: continuationPosition,
		createdAt: Date.now(),
		updatedAt: Date.now()
	};

	// Create branch node with text before cursor (for alternative continuation)
	const branchNode: WritingNode = {
		id: nanoid(),
		content: textBefore, // Copy text before cursor
		planContent: node.planContent,
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

/**
 * Parallelize at selection - creates ONE new branch with highlighted text removed:
 *
 * With selection: "The quick [brown] fox" becomes:
 *   Original: "The quick brown fox" (unchanged)
 *      ↓
 *   New branch: "The quick  fox" (highlighted removed)
 *
 * Original stays unchanged, new branch has highlighted text removed.
 */
export function parallelizeAtSelection(
	node: WritingNode,
	selectionStart: number,
	selectionEnd: number,
	nodePosition: { x: number; y: number }
): ParallelizeResult {
	const textBefore = node.content.slice(0, selectionStart);
	const textAfter = node.content.slice(selectionEnd);
	const contentWithoutSelection = textBefore + textAfter;

	// Position for the new branch (below original)
	const branchPosition = {
		x: nodePosition.x + 150,
		y: nodePosition.y + 150
	};

	// Original stays unchanged
	const updatedOriginal: WritingNode = {
		...node,
		// Keep original content unchanged
		updatedAt: Date.now()
	};

	// Create new branch with highlighted text removed
	const branchNode: WritingNode = {
		id: nanoid(),
		content: contentWithoutSelection, // Content with highlighted part removed
		planContent: node.planContent,
		position: branchPosition,
		createdAt: Date.now(),
		updatedAt: Date.now()
	};

	// Create edge from original to new branch
	const newEdges: WritingEdge[] = [
		{
			id: `${node.id}-${branchNode.id}`,
			source: node.id,
			target: branchNode.id
		}
	];

	// Return with minimal structure (reusing existing type)
	return {
		originalNode: updatedOriginal,
		selectedPathNode: branchNode, // The new branch
		emptyPathNode: branchNode,    // Same node (not used)
		continuationNode: branchNode, // Same node (not used)
		newEdges
	};
}

/**
 * Simple parallelize at cursor (no selection) - inserts optional parallel node.
 * Creates: current → [existing_child, new_path_with_content] → (continuation stays as-is)
 * The new path gets a copy of the current node's content.
 */
export function parallelizeAtCursor(
	node: WritingNode,
	cursorPosition: number,
	nodePosition: { x: number; y: number },
	existingChildren: WritingNode[],
	edges: WritingEdge[]
): { emptyPathNode: WritingNode; newEdges: WritingEdge[]; removedEdges: string[] } | null {
	// If there's no child, use regular branch instead
	if (existingChildren.length === 0) {
		return null;
	}

	// Create alternative path that also connects to the first child
	const firstChild = existingChildren[0];

	const newPathPosition = {
		x: nodePosition.x + 150,
		y: (nodePosition.y + firstChild.position.y) / 2
	};

	// New path gets copy of current node's content
	const emptyPathNode: WritingNode = {
		id: nanoid(),
		content: node.content, // Copy full content for alternative editing
		planContent: node.planContent,
		position: newPathPosition,
		createdAt: Date.now(),
		updatedAt: Date.now()
	};

	// Create edge from current node to new path
	// Create edge from new path to first child
	const newEdges: WritingEdge[] = [
		{
			id: `${node.id}-${emptyPathNode.id}`,
			source: node.id,
			target: emptyPathNode.id
		},
		{
			id: `${emptyPathNode.id}-${firstChild.id}`,
			source: emptyPathNode.id,
			target: firstChild.id
		}
	];

	return {
		emptyPathNode,
		newEdges,
		removedEdges: [] // Don't remove any edges, just add parallel path
	};
}
