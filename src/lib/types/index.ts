// Core data types for the non-linear writing interface

export interface WritingNode {
	id: string;
	title?: string; // Optional title for display (defaults to first line of content)
	content: string;
	planContent: string;
	position: { x: number; y: number };
	wordCountGoal?: number;
	subProject?: SubProject; // Embedded sub-project for nested structure
	createdAt: number;
	updatedAt: number;
}

// Embedded project structure for nested/recursive projects
export interface SubProject {
	nodes: WritingNode[];
	edges: WritingEdge[];
}

export interface WritingEdge {
	id: string;
	source: string;
	target: string;
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
	layout: LayoutMode;
	projectPath: string[]; // Array of node IDs for nested project navigation
}

export interface Project {
	version: string;
	name: string;
	nodes: WritingNode[];
	edges: WritingEdge[];
	settings: ProjectSettings;
	viewState: ViewState;
}

export type FontFamily = 'literata' | 'crimson-pro' | 'source-serif-4' | 'eb-garamond';
export type Theme = 'light' | 'dark' | 'sepia';
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type LayoutMode = 'side-by-side' | 'planning-full' | 'writing-full' | 'dag-full';
export type RightPaneMode = 'writing' | 'dag';

export interface BranchResult {
	originalNode: WritingNode;
	continuationNode: WritingNode;
	branchNode: WritingNode;
	newEdges: WritingEdge[];
}

// Result of parallelizing at selection (creates diamond pattern)
export interface ParallelizeResult {
	originalNode: WritingNode;
	selectedPathNode: WritingNode; // Contains selected text
	emptyPathNode: WritingNode; // Empty alternative path
	continuationNode: WritingNode; // Text after selection (rejoin point)
	newEdges: WritingEdge[];
}

export interface KeyboardShortcut {
	key: string;
	modifiers: ('ctrl' | 'shift' | 'alt' | 'meta')[];
	action: string;
	description: string;
	category: 'navigation' | 'editing' | 'view' | 'export';
}

export interface CommandPaletteItem {
	id: string;
	label: string;
	description?: string;
	shortcut?: string;
	category: string;
	action: () => void;
}

export interface CompilePath {
	nodeIds: string[];
	totalWords: number;
}

export interface AutosaveState {
	status: 'saved' | 'saving' | 'unsaved';
	lastSaved: number | null;
}
