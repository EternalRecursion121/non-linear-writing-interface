import { describe, expect, it, beforeEach } from 'vitest';
import { projectStore } from './project.svelte';

describe('projectStore', () => {
	beforeEach(() => {
		projectStore.reset();
	});

	it('edits nested subprojects at the active graph depth', () => {
		const rootNode = projectStore.selectedNode;
		expect(rootNode).not.toBeNull();

		projectStore.createSubProject(rootNode!.id);
		projectStore.drillInto(rootNode!.id);

		expect(projectStore.selectedNode).not.toBeNull();

		projectStore.updateSelectedNodeContent('Nested content');
		projectStore.renameSelectedNode('Nested title');

		expect(projectStore.selectedNode?.content).toBe('Nested content');
		expect(projectStore.selectedNode?.title).toBe('Nested title');

		projectStore.drillUp();

		const updatedRoot = projectStore.activeNodes.find((node) => node.id === rootNode!.id);
		expect(updatedRoot?.subProject?.nodes[0]?.content).toBe('Nested content');
		expect(updatedRoot?.subProject?.nodes[0]?.title).toBe('Nested title');
	});

	it('rejects edges that would create cycles', () => {
		const rootNode = projectStore.selectedNode!;
		const childNode = projectStore.addNode({
			position: { x: 400, y: 250 }
		});

		expect(projectStore.connectNodes(rootNode.id, childNode.id)).toEqual({ ok: true });
		expect(projectStore.connectNodes(childNode.id, rootNode.id)).toEqual({
			ok: false,
			reason: 'cycle'
		});
	});

	it('undoes and redoes content edits', () => {
		projectStore.updateSelectedNodeContent('first draft');
		expect(projectStore.selectedNode?.content).toBe('first draft');

		projectStore.undo();
		expect(projectStore.selectedNode?.content).toBe('');

		projectStore.redo();
		expect(projectStore.selectedNode?.content).toBe('first draft');
	});
});
