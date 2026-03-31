import {
	addNode,
	autoLayoutActiveGraph,
	branchSelectedNode,
	connectNodes,
	createSubProject,
	deleteNode,
	drillInto,
	drillToDepth,
	drillUp,
	getChildren,
	getParents,
	parallelizeSelectedNode,
	removeEdge,
	resetProject,
	selectNode,
	updateNode,
	updateProjectName,
	updateSelectedNode,
	updateSettings,
	updateViewState
} from '$lib/domain/project/actions';
import {
	getBreadcrumbPath,
	getNodeDisplayTitle,
	getNodeMap,
	getSelectedNode
} from '$lib/domain/project/graph';
import {
	compilePath,
	findLeaves,
	findRoots,
	getCompilePaths,
	getNextNodeId,
	getPathToNode,
	getPreviousNodeId,
	getRecursiveWordCount,
	getWordCount
} from '$lib/domain/project/compile';
import { pushHistory, redo, undo } from '$lib/domain/project/history';
import type {
	CompilePath,
	FontSize,
	FontFamily,
	GraphMutationResult,
	ProjectDocument,
	ProjectGraph,
	ProjectSettings,
	Theme,
	WritingNode
} from '$lib/types/project';
import { createProjectDocument, getActiveEdges, getActiveGraph, getActiveNodes } from '$lib/domain/project/graph';

class ProjectStore {
	private _project = $state<ProjectDocument>(createProjectDocument());
	private _hydrated = $state(false);
	private _dirtyRevision = $state(0);
	private _history = $state<ProjectDocument[]>([]);
	private _future = $state<ProjectDocument[]>([]);

	private commit(
		nextProject: ProjectDocument,
		options: { trackHistory?: boolean; markDirty?: boolean } = {}
	): void {
		const { trackHistory = true, markDirty = true } = options;

		if (trackHistory) {
			this._history = pushHistory(this._history, this._project);
			this._future = [];
		}

		this._project = nextProject;

		if (markDirty) {
			this._dirtyRevision += 1;
		}
	}

	get project(): ProjectDocument {
		return this._project;
	}

	get hydrated(): boolean {
		return this._hydrated;
	}

	get dirtyRevision(): number {
		return this._dirtyRevision;
	}

	get canUndo(): boolean {
		return this._history.length > 0;
	}

	get canRedo(): boolean {
		return this._future.length > 0;
	}

	get name(): string {
		return this._project.name;
	}

	get settings(): ProjectSettings {
		return this._project.settings;
	}

	get viewState() {
		return this._project.viewState;
	}

	get activeGraph(): ProjectGraph {
		return getActiveGraph(this._project);
	}

	get activeNodes(): WritingNode[] {
		return getActiveNodes(this._project);
	}

	get activeEdges() {
		return getActiveEdges(this._project);
	}

	get nodesMap(): Map<string, WritingNode> {
		return getNodeMap(this.activeGraph);
	}

	get selectedNode(): WritingNode | null {
		return getSelectedNode(this._project);
	}

	get totalWordCount(): number {
		return getRecursiveWordCount(this._project.graph);
	}

	get projectPath(): string[] {
		return this._project.viewState.projectPath;
	}

	get isAtRoot(): boolean {
		return this.projectPath.length === 0;
	}

	loadProject(project: ProjectDocument): void {
		this._project = project;
		this._hydrated = true;
		this._dirtyRevision = 0;
		this._history = [];
		this._future = [];
	}

	markHydrated(): void {
		this._hydrated = true;
	}

	reset(): void {
		this.commit(resetProject());
		this._hydrated = true;
	}

	setName(name: string): void {
		this.commit(updateProjectName(this._project, name));
	}

	updateSettings(updates: Partial<ProjectSettings>): void {
		this.commit(updateSettings(this._project, updates));
	}

	setFontFamily(fontFamily: FontFamily): void {
		this.updateSettings({ fontFamily });
	}

	setFontSize(fontSize: FontSize): void {
		this.updateSettings({ fontSize });
	}

	setTheme(theme: Theme): void {
		this.updateSettings({ theme });
	}

	selectNode(nodeId: string | null): void {
		this.commit(selectNode(this._project, nodeId), {
			trackHistory: false,
			markDirty: false
		});
	}

	updateSelectedNodeContent(content: string): void {
		this.commit(updateSelectedNode(this._project, { content }));
	}

	updateSelectedNodePlanContent(planContent: string): void {
		this.commit(updateSelectedNode(this._project, { planContent }));
	}

	renameSelectedNode(title: string): void {
		this.commit(updateSelectedNode(this._project, { title: title || undefined }));
	}

	updateNodeWordCountGoal(nodeId: string, goal: number | undefined): void {
		this.commit(updateNode(this._project, nodeId, { wordCountGoal: goal }));
	}

	updateNodePosition(nodeId: string, position: { x: number; y: number }): void {
		this.commit(updateNode(this._project, nodeId, { position }));
	}

	addNode(partial: Partial<WritingNode> = {}): WritingNode {
		const result = addNode(this._project, partial);
		this.commit(result.document);
		return result.node;
	}

	addChildNode(): WritingNode {
		const selectedNode = this.selectedNode;
		const newNode = this.addNode({
			position: selectedNode
				? {
						x: selectedNode.position.x + 50,
						y: selectedNode.position.y + 150
					}
				: { x: 250, y: 100 }
		});

		if (selectedNode) {
			this.connectNodes(selectedNode.id, newNode.id);
		}

		return newNode;
	}

	connectNodes(sourceId: string, targetId: string): GraphMutationResult {
		const result = connectNodes(this._project, sourceId, targetId);
		if (result.result.ok) {
			this.commit(result.document);
		}
		return result.result;
	}

	deleteSelectedNode(): boolean {
		const selectedNode = this.selectedNode;
		if (!selectedNode || this.activeNodes.length <= 1) {
			return false;
		}

		this.commit(deleteNode(this._project, selectedNode.id));
		return true;
	}

	deleteNode(nodeId: string): boolean {
		if (this.activeNodes.length <= 1) {
			return false;
		}

		this.commit(deleteNode(this._project, nodeId));
		return true;
	}

	removeEdge(edgeId: string): void {
		this.commit(removeEdge(this._project, edgeId));
	}

	createSubProject(nodeId: string): void {
		this.commit(createSubProject(this._project, nodeId));
	}

	hasSubProject(nodeId: string): boolean {
		return this.activeNodes.some((node) => node.id === nodeId && !!node.subProject);
	}

	drillInto(nodeId: string): void {
		this.commit(drillInto(this._project, nodeId), {
			trackHistory: false,
			markDirty: false
		});
	}

	drillIntoSelectedNode(): void {
		if (this.selectedNode) {
			this.drillInto(this.selectedNode.id);
		}
	}

	drillUp(): void {
		this.commit(drillUp(this._project), {
			trackHistory: false,
			markDirty: false
		});
	}

	drillToDepth(depth: number): void {
		this.commit(drillToDepth(this._project, depth), {
			trackHistory: false,
			markDirty: false
		});
	}

	branchSelectedNode(cursorPosition: number): boolean {
		const result = branchSelectedNode(this._project, cursorPosition);
		if (!result.branchNodeId) {
			return false;
		}

		this.commit(result.document);
		return true;
	}

	parallelizeSelectedNode(selectionStart: number, selectionEnd: number): boolean {
		const result = parallelizeSelectedNode(this._project, selectionStart, selectionEnd);
		if (!result.branchNodeId) {
			return false;
		}

		this.commit(result.document);
		return true;
	}

	autoLayoutActiveGraph(): void {
		this.commit(autoLayoutActiveGraph(this._project));
	}

	undo(): void {
		const result = undo(this._history, this._project, this._future);
		if (!result.document) {
			return;
		}

		this._history = result.history;
		this._future = result.future;
		this._project = result.document;
	}

	redo(): void {
		const result = redo(this._history, this._project, this._future);
		if (!result.document) {
			return;
		}

		this._history = result.history;
		this._future = result.future;
		this._project = result.document;
	}

	getActiveNodes(): WritingNode[] {
		return this.activeNodes;
	}

	getActiveEdges() {
		return this.activeEdges;
	}

	getChildren(nodeId: string): WritingNode[] {
		return getChildren(this._project, nodeId);
	}

	getParents(nodeId: string): WritingNode[] {
		return getParents(this._project, nodeId);
	}

	getNodeDisplayTitle(node: WritingNode): string {
		return getNodeDisplayTitle(node);
	}

	getWordCount(text: string): number {
		return getWordCount(text);
	}

	getBreadcrumbPath(): { id: string; title: string }[] {
		return getBreadcrumbPath(this._project);
	}

	getNextNodeId(currentId: string): string | null {
		return getNextNodeId(this.activeGraph, currentId);
	}

	getPreviousNodeId(currentId: string): string | null {
		return getPreviousNodeId(this.activeGraph, currentId);
	}

	getNodePath(nodeId: string): string[] {
		return getPathToNode(this.activeGraph, nodeId);
	}

	findRoots(): WritingNode[] {
		return findRoots(this.activeGraph);
	}

	findLeaves(): WritingNode[] {
		return findLeaves(this.activeGraph);
	}

	getCompilePaths(sourceId: string, sinkId: string): CompilePath[] {
		return getCompilePaths(this.activeGraph, sourceId, sinkId);
	}

	compilePath(nodeIds: string[]): string {
		return compilePath(this.activeGraph, nodeIds);
	}

	updateViewState(updates: Partial<ProjectDocument['viewState']>): void {
		this.commit(updateViewState(this._project, updates), {
			trackHistory: false,
			markDirty: false
		});
	}
}

export const projectStore = new ProjectStore();
