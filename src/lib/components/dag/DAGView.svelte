<script lang="ts">
	import '@xyflow/svelte/dist/style.css';
	import {
		Background,
		Controls,
		MiniMap,
		SvelteFlow,
		type Edge,
		type Node,
		type NodeTypes
	} from '@xyflow/svelte';
	import WritingFlowNode from './WritingFlowNode.svelte';
	import DAGControls from './DAGControls.svelte';
	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';

	const nodeTypes: NodeTypes = {
		writing: WritingFlowNode
	};

	function getFlowNodes(): Node[] {
		return projectStore.activeNodes.map((node) => ({
			id: node.id,
			type: 'writing',
			position: node.position,
			data: {
				title: node.title,
				content: node.content,
				planContent: node.planContent,
				wordCount: projectStore.getWordCount(node.content),
				wordCountGoal: node.wordCountGoal,
				hasSubProject: !!node.subProject,
				isSelected: projectStore.selectedNode?.id === node.id
			},
			selected: projectStore.selectedNode?.id === node.id
		}));
	}

	function getFlowEdges(): Edge[] {
		return projectStore.activeEdges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			type: 'smoothstep',
			animated:
				projectStore.selectedNode?.id === edge.source ||
				projectStore.selectedNode?.id === edge.target
		}));
	}

	let nodes = $state<Node[]>(getFlowNodes());
	let edges = $state<Edge[]>(getFlowEdges());

	$effect(() => {
		nodes = getFlowNodes();
	});

	$effect(() => {
		edges = getFlowEdges();
	});

	function handleNodeClick(event: { node: Node }) {
		projectStore.selectNode(event.node.id);
		uiStore.setSingleSelection(event.node.id);
	}

	function handleConnect(connection: { source?: string | null; target?: string | null }) {
		if (!connection.source || !connection.target) {
			return;
		}

		const result = projectStore.connectNodes(connection.source, connection.target);
		if (!result.ok) {
			uiStore.showToast(
				result.reason === 'cycle'
					? 'That connection would create a cycle'
					: result.reason === 'duplicate-edge'
						? 'That connection already exists'
						: 'Unable to connect nodes',
				'error'
			);
		}
	}

	function handleAddNode() {
		projectStore.addChildNode();
		uiStore.showToast('Node added', 'success');
	}

	function handleAutoLayout() {
		projectStore.autoLayoutActiveGraph();
		uiStore.showToast('Layout applied', 'info');
	}

	$effect(() => {
		nodes;

		for (const flowNode of nodes) {
			const storedNode = projectStore.activeNodes.find((node) => node.id === flowNode.id);
			if (
				storedNode &&
				(storedNode.position.x !== flowNode.position.x ||
					storedNode.position.y !== flowNode.position.y)
			) {
				projectStore.updateNodePosition(flowNode.id, flowNode.position);
			}
		}
	});
</script>

<div class="relative h-full w-full overflow-hidden rounded-[1.4rem]">
	<SvelteFlow
		bind:nodes
		bind:edges
		{nodeTypes}
		fitView
		onnodeclick={handleNodeClick}
		onconnect={handleConnect}
		onpaneclick={() => projectStore.selectNode(null)}
		defaultEdgeOptions={{ type: 'smoothstep' }}
	>
		<Background />
		<Controls />
		<MiniMap />
	</SvelteFlow>

	<DAGControls onAutoLayout={handleAutoLayout} onAddNode={handleAddNode} />
</div>
