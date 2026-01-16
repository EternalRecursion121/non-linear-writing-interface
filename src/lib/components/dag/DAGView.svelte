<script lang="ts">
	import {
		SvelteFlow,
		Controls,
		MiniMap,
		Background,
		type Node,
		type Edge,
		type NodeTypes,
		type OnNodeClick,
		type OnConnect,
		type OnNodesChange,
		type OnEdgesChange,
		useSvelteFlow
	} from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';

	import { projectStore } from '$lib/stores/project.svelte';
	import { uiStore } from '$lib/stores/ui.svelte';
	import { autoLayout, centerNodes } from '$lib/utils/layout';
	import WritingFlowNode from './WritingFlowNode.svelte';
	import DAGControls from './DAGControls.svelte';

	const nodeTypes: NodeTypes = {
		writing: WritingFlowNode
	};

	// Convert project nodes to flow nodes (supports nested projects)
	function getFlowNodes(): Node[] {
		const activeNodes = projectStore.getActiveNodes();
		return activeNodes.map((node) => ({
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
				isSelected: projectStore.viewState.selectedNodeId === node.id
			},
			selected: projectStore.viewState.selectedNodeId === node.id
		}));
	}

	// Convert project edges to flow edges (supports nested projects)
	function getFlowEdges(): Edge[] {
		const activeEdges = projectStore.getActiveEdges();
		return activeEdges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			type: 'smoothstep',
			animated: projectStore.viewState.selectedNodeId === edge.source ||
			          projectStore.viewState.selectedNodeId === edge.target
		}));
	}

	let nodes = $state<Node[]>(getFlowNodes());
	let edges = $state<Edge[]>(getFlowEdges());

	// Update nodes/edges when project changes
	$effect(() => {
		nodes = getFlowNodes();
	});

	$effect(() => {
		edges = getFlowEdges();
	});

	const onNodeClick: OnNodeClick = (event, node) => {
		projectStore.selectNode(node.id);
	};

	const onNodesChange: OnNodesChange = (changes) => {
		// Handle node position changes
		for (const change of changes) {
			if (change.type === 'position' && change.position && !change.dragging) {
				projectStore.updateNodePosition(change.id, change.position);
			}
		}
	};

	const onConnect: OnConnect = (connection) => {
		if (connection.source && connection.target && connection.source !== connection.target) {
			projectStore.addEdge(connection.source, connection.target);
		}
	};

	function handlePaneClick() {
		projectStore.selectNode(null);
	}

	function handleAutoLayout() {
		const activeNodes = projectStore.getActiveNodes();
		const activeEdges = projectStore.getActiveEdges();
		const positions = autoLayout(activeNodes, activeEdges);
		const centered = centerNodes(positions, 400, 300);

		for (const [id, pos] of centered) {
			projectStore.updateNodePosition(id, pos);
		}

		uiStore.showToast('Layout applied', 'info');
	}

	function handleAddNode() {
		const selectedNode = projectStore.selectedNode;
		const position = selectedNode
			? { x: selectedNode.position.x + 50, y: selectedNode.position.y + 150 }
			: { x: 250, y: 100 };

		const newNode = projectStore.addNode({ position });

		if (selectedNode) {
			projectStore.addEdge(selectedNode.id, newNode.id);
		}

		projectStore.selectNode(newNode.id);
		uiStore.showToast('Node added', 'success');
	}
</script>

<div class="h-full w-full relative">
	<SvelteFlow
		bind:nodes
		bind:edges
		{nodeTypes}
		fitView
		{onNodeClick}
		{onNodesChange}
		{onConnect}
		onpaneclick={handlePaneClick}
		defaultEdgeOptions={{ type: 'smoothstep' }}
	>
		<Background />
		<Controls />
		<MiniMap />
	</SvelteFlow>

	<!-- Custom Controls -->
	<DAGControls onAutoLayout={handleAutoLayout} onAddNode={handleAddNode} />
</div>
