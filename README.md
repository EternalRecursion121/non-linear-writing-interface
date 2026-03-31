# Non-Linear Writing Interface

A keyboard-native, node-based writing app for branching narratives. The app is built with SvelteKit, TypeScript, Tailwind CSS, and `@xyflow/svelte`.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run check
npm run lint
npm run test
npm run verify
```

## Project Shape

Projects are stored in `data/project.nlw.json` and use the `2.0` document shape:

```ts
type ProjectDocument = {
	version: '2.0';
	name: string;
	graph: ProjectGraph;
	settings: ProjectSettings;
	viewState: ViewState;
};

type ProjectGraph = {
	nodes: WritingNode[];
	edges: WritingEdge[];
};
```

The root project and every nested subproject use the same `ProjectGraph` structure, so path-aware editing works the same way at every depth.

## Architecture

```text
src/lib/
├── commands/             # Shared command registry for keyboard and palette actions
├── components/           # Svelte UI
├── domain/project/       # Pure project graph, actions, history, compile, validation
├── persistence/          # Hydration, autosave, export
├── stores/               # Thin reactive stores
├── types/                # Project and UI type definitions
└── utils/layout.ts       # DAG layout helper
```

## Current Behaviors

- Branch the selected node with `Ctrl+Enter`
- Parallelize the selected node with `Ctrl+/`
- Drill into nested subprojects from the browser, DAG node, or writing pane
- Auto-save to `data/project.nlw.json` with a localStorage fallback
- Compile the active graph into Markdown

## Notes

- Saved data from the previous pre-`2.0` shape is intentionally unsupported.
- Autosave is silent on success and visible on failure through the status bar and toast notifications.
