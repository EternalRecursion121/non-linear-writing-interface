# Non-Linear Writing Interface

A keyboard-native, node-based writing application for crafting branching narratives. Built with SvelteKit, TypeScript, and Tailwind CSS.

![Writing Interface](docs/screenshots/Screenshot%202026-01-17%20at%2010.50.45.png)

![DAG View](docs/screenshots/Screenshot%202026-01-17%20at%2010.51.05.png)

## Features

### Branching & Parallelization
- **Branch (Ctrl+Enter)**: Split your writing at the cursor to explore alternative directions
  - Original node becomes a checkpoint
  - Creates two child nodes: one with full content, one for alternative writing
- **Parallelize (Ctrl+/)**: Create a branch with highlighted text removed
  - Original stays unchanged
  - New branch contains content without the selected text

### DAG Visualization
- Visual directed acyclic graph showing your narrative structure
- Drag to connect nodes and define story flow
- Auto-layout with dagre algorithm
- Minimap for navigation in large projects
- Compile paths through your DAG to export linear stories

### Two-Pane Layout
- Planning pane for notes and outlines
- Writing pane with distraction-free editing
- Resizable panes with keyboard shortcuts for quick switching
- Full-screen modes for each view

### Nested Projects (Subprojects)
- Any node can contain its own sub-project
- Drill down into nested narrative structures
- Breadcrumb navigation between levels

### Node Browser
- File explorer-style sidebar showing all nodes
- Search, rename, and delete nodes
- Visual indicators for nodes with subprojects

### Keyboard-First Design

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Branch at cursor |
| `Ctrl+/` | Parallelize (create branch with highlighted text removed) |
| `Ctrl+1` | Full-screen planning pane |
| `Ctrl+2` | Full-screen writing pane |
| `Ctrl+3` | Full-screen DAG view |
| `Ctrl+0` | Side-by-side layout |
| `Ctrl+B` | Toggle file browser |
| `Ctrl+E` | Export/compile |
| `Ctrl+K` | Command palette |
| `Ctrl+.` | Focus mode |
| `Tab` | Navigate to next node |
| `Shift+Tab` | Navigate to previous node |
| `?` | Show all shortcuts |

### Themes & Typography
- Three themes: Light, Dark, Sepia (default)
- Four carefully selected fonts:
  - Literata (default)
  - Crimson Pro
  - Source Serif 4
  - EB Garamond
- Adjustable font sizes

### Persistence
- Auto-save to local storage
- Export/import as JSON files
- Compile narratives to Markdown

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
npm run build
npm run preview
```

## Tech Stack

- **Framework**: SvelteKit with Svelte 5 (runes)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **DAG Visualization**: @xyflow/svelte
- **Layout Algorithm**: @dagrejs/dagre
- **Icons**: Lucide Svelte

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── browser/      # Node browser sidebar
│   │   ├── dag/          # DAG visualization
│   │   ├── layout/       # App shell, panes
│   │   ├── overlays/     # Command palette, focus mode
│   │   ├── toolbar/      # Main toolbar
│   │   └── writing/      # Editor components
│   ├── stores/           # Svelte stores (project, UI)
│   ├── types/            # TypeScript interfaces
│   └── utils/            # Branching, DAG, keyboard utilities
├── routes/               # SvelteKit routes
└── app.css               # Global styles
```

## License

MIT
