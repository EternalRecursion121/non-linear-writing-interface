export interface WritingEdge {
	id: string;
	source: string;
	target: string;
}

export interface ProjectGraph {
	nodes: WritingNode[];
	edges: WritingEdge[];
}

export interface WritingNode {
	id: string;
	title?: string;
	content: string;
	planContent: string;
	position: { x: number; y: number };
	wordCountGoal?: number;
	subProject?: ProjectGraph;
	createdAt: number;
	updatedAt: number;
}

export interface ProjectSettings {
	fontFamily: FontFamily;
	theme: Theme;
	fontSize: FontSize;
}

export interface ViewState {
	zoom: number;
	pan: { x: number; y: number };
	selectedNodeId: string | null;
	projectPath: GraphPath;
}

export interface ProjectDocument {
	version: '2.0';
	name: string;
	graph: ProjectGraph;
	settings: ProjectSettings;
	viewState: ViewState;
}

export type GraphPath = string[];

export type FontFamily = 'literata' | 'crimson-pro' | 'source-serif-4' | 'eb-garamond';
export type Theme = 'light' | 'dark' | 'sepia';
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface CompilePath {
	nodeIds: string[];
	totalWords: number;
}

export type GraphMutationResult =
	| { ok: true }
	| { ok: false; reason: 'duplicate-edge' | 'cycle' | 'missing-node' };
