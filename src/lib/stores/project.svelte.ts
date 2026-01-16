import { nanoid } from 'nanoid';
import type { WritingNode, WritingEdge, Project, ProjectSettings, ViewState } from '$lib/types';

function createDefaultSettings(): ProjectSettings {
	return {
		fontFamily: 'literata',
		theme: 'light',
		fontSize: 'medium'
	};
}

function createDefaultViewState(): ViewState {
	return {
		zoom: 1,
		pan: { x: 0, y: 0 },
		selectedNodeId: null,
		layout: 'side-by-side'
	};
}

function createInitialNode(): WritingNode {
	return {
		id: nanoid(),
		content: '',
		planContent: '',
		position: { x: 250, y: 100 },
		createdAt: Date.now(),
		updatedAt: Date.now()
	};
}

class ProjectStore {
	// Using Map for O(1) lookups
	private _nodesMap = $state<Map<string, WritingNode>>(new Map());
	private _edges = $state<WritingEdge[]>([]);
	private _settings = $state<ProjectSettings>(createDefaultSettings());
	private _viewState = $state<ViewState>(createDefaultViewState());
	private _name = $state<string>('Untitled Project');
	private _undoStack = $state<{ nodes: WritingNode[]; edges: WritingEdge[] }[]>([]);
	private _redoStack = $state<{ nodes: WritingNode[]; edges: WritingEdge[] }[]>([]);

	constructor() {
		// Initialize with a single root node
		const initialNode = createInitialNode();
		this._nodesMap.set(initialNode.id, initialNode);
		this._viewState.selectedNodeId = initialNode.id;
	}

	// Getters
	get nodes(): WritingNode[] {
		return Array.from(this._nodesMap.values());
	}

	get nodesMap(): Map<string, WritingNode> {
		return this._nodesMap;
	}

	get edges(): WritingEdge[] {
		return this._edges;
	}

	get settings(): ProjectSettings {
		return this._settings;
	}

	get viewState(): ViewState {
		return this._viewState;
	}

	get name(): string {
		return this._name;
	}

	get selectedNode(): WritingNode | null {
		if (!this._viewState.selectedNodeId) return null;
		return this._nodesMap.get(this._viewState.selectedNodeId) ?? null;
	}

	get canUndo(): boolean {
		return this._undoStack.length > 0;
	}

	get canRedo(): boolean {
		return this._redoStack.length > 0;
	}

	// Save current state for undo
	private saveState(): void {
		this._undoStack.push({
			nodes: structuredClone(Array.from(this._nodesMap.values())),
			edges: structuredClone(this._edges)
		});
		// Limit undo stack size
		if (this._undoStack.length > 50) {
			this._undoStack.shift();
		}
		// Clear redo stack on new action
		this._redoStack = [];
	}

	// Node operations
	getNode(id: string): WritingNode | undefined {
		return this._nodesMap.get(id);
	}

	addNode(node: Partial<WritingNode> = {}): WritingNode {
		this.saveState();
		const newNode: WritingNode = {
			id: nanoid(),
			content: '',
			planContent: '',
			position: { x: 250, y: 200 },
			createdAt: Date.now(),
			updatedAt: Date.now(),
			...node
		};
		this._nodesMap.set(newNode.id, newNode);
		return newNode;
	}

	updateNode(id: string, updates: Partial<WritingNode>): void {
		const node = this._nodesMap.get(id);
		if (node) {
			const updatedNode = {
				...node,
				...updates,
				updatedAt: Date.now()
			};
			this._nodesMap.set(id, updatedNode);
		}
	}

	updateNodeContent(id: string, content: string): void {
		this.updateNode(id, { content });
	}

	updateNodePlanContent(id: string, planContent: string): void {
		this.updateNode(id, { planContent });
	}

	updateNodePosition(id: string, position: { x: number; y: number }): void {
		this.updateNode(id, { position });
	}

	updateNodeWordCountGoal(id: string, goal: number | undefined): void {
		this.updateNode(id, { wordCountGoal: goal });
	}

	deleteNode(id: string): void {
		this.saveState();
		this._nodesMap.delete(id);
		// Remove connected edges
		this._edges = this._edges.filter((e) => e.source !== id && e.target !== id);
		// Clear selection if deleted
		if (this._viewState.selectedNodeId === id) {
			this._viewState.selectedNodeId = null;
		}
	}

	// Edge operations
	addEdge(source: string, target: string): WritingEdge {
		this.saveState();
		const edge: WritingEdge = {
			id: `${source}-${target}`,
			source,
			target
		};
		this._edges.push(edge);
		return edge;
	}

	removeEdge(id: string): void {
		this.saveState();
		this._edges = this._edges.filter((e) => e.id !== id);
	}

	// Get children of a node
	getChildren(nodeId: string): WritingNode[] {
		const childIds = this._edges.filter((e) => e.source === nodeId).map((e) => e.target);
		return childIds.map((id) => this._nodesMap.get(id)!).filter(Boolean);
	}

	// Get parents of a node
	getParents(nodeId: string): WritingNode[] {
		const parentIds = this._edges.filter((e) => e.target === nodeId).map((e) => e.source);
		return parentIds.map((id) => this._nodesMap.get(id)!).filter(Boolean);
	}

	// Selection
	selectNode(id: string | null): void {
		this._viewState.selectedNodeId = id;
	}

	// Settings
	updateSettings(updates: Partial<ProjectSettings>): void {
		this._settings = { ...this._settings, ...updates };
	}

	// View state
	updateViewState(updates: Partial<ViewState>): void {
		this._viewState = { ...this._viewState, ...updates };
	}

	// Undo/Redo
	undo(): void {
		const state = this._undoStack.pop();
		if (state) {
			this._redoStack.push({
				nodes: structuredClone(Array.from(this._nodesMap.values())),
				edges: structuredClone(this._edges)
			});
			this._nodesMap = new Map(state.nodes.map((n) => [n.id, n]));
			this._edges = state.edges;
		}
	}

	redo(): void {
		const state = this._redoStack.pop();
		if (state) {
			this._undoStack.push({
				nodes: structuredClone(Array.from(this._nodesMap.values())),
				edges: structuredClone(this._edges)
			});
			this._nodesMap = new Map(state.nodes.map((n) => [n.id, n]));
			this._edges = state.edges;
		}
	}

	// Project management
	setName(name: string): void {
		this._name = name;
	}

	// Export project as serializable object
	toProject(): Project {
		return {
			version: '1.0',
			name: this._name,
			nodes: Array.from(this._nodesMap.values()),
			edges: this._edges,
			settings: this._settings,
			viewState: this._viewState
		};
	}

	// Load project from object
	loadProject(project: Project): void {
		this._name = project.name;
		this._nodesMap = new Map(project.nodes.map((n) => [n.id, n]));
		this._edges = project.edges;
		this._settings = project.settings;
		this._viewState = project.viewState;
		this._undoStack = [];
		this._redoStack = [];
	}

	// Reset to initial state
	reset(): void {
		this._nodesMap = new Map();
		this._edges = [];
		this._settings = createDefaultSettings();
		this._viewState = createDefaultViewState();
		this._name = 'Untitled Project';
		this._undoStack = [];
		this._redoStack = [];

		const initialNode = createInitialNode();
		this._nodesMap.set(initialNode.id, initialNode);
		this._viewState.selectedNodeId = initialNode.id;
	}

	// Get total word count
	get totalWordCount(): number {
		return this.nodes.reduce((sum, node) => sum + this.getWordCount(node.content), 0);
	}

	// Get word count for text
	getWordCount(text: string): number {
		return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
	}
}

export const projectStore = new ProjectStore();
