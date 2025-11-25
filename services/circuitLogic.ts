import { GateType, NodeData, Connection } from '../types';

export const evaluateGate = (type: GateType, inputs: boolean[], nodeState: boolean): boolean[] => {
  const a = inputs[0] || false;
  const b = inputs[1] || false;

  switch (type) {
    case GateType.INPUT:
      return [nodeState]; // Input nodes emit their internal state (toggled by user)
    case GateType.OUTPUT:
      return []; // Output nodes have no output pins
    case GateType.AND:
      return [a && b];
    case GateType.OR:
      return [a || b];
    case GateType.NOT:
      return [!a];
    case GateType.XOR:
      return [a !== b];
    case GateType.NAND:
      return [!(a && b)];
    default:
      return [false];
  }
};

export const simulateCircuit = (nodes: NodeData[], connections: Connection[]): { nodes: NodeData[]; connections: Connection[] } => {
  // Create a map for quick access
  const nodeMap = new Map(nodes.map(n => [n.id, { ...n }]));
  const connectionMap = connections.map(c => ({ ...c }));

  // Basic simulation step (one tick propagation)
  // 1. Reset inputs for all gates (except source switches)
  nodeMap.forEach(node => {
    if (node.type !== GateType.INPUT) {
      // Initialize inputs array with false based on expected input count
      // This is a simplification; in a real continuous sim we'd keep state.
      // But for a game tick, we re-evaluate from wire states.
    }
  });

  // 2. Propagate values through wires
  connectionMap.forEach(conn => {
    const sourceNode = nodeMap.get(conn.sourceNodeId);
    if (sourceNode && sourceNode.outputs[conn.sourcePinIndex] !== undefined) {
      conn.state = sourceNode.outputs[conn.sourcePinIndex];
      
      const targetNode = nodeMap.get(conn.targetNodeId);
      if (targetNode) {
        // Ensure inputs array exists and is large enough
        if (!targetNode.inputs) targetNode.inputs = [];
        targetNode.inputs[conn.targetPinIndex] = conn.state;
      }
    }
  });

  // 3. Evaluate gates based on new inputs
  nodeMap.forEach(node => {
    // Input nodes state is controlled by user interaction, not wires
    const computedOutputs = evaluateGate(node.type, node.inputs || [], node.state);
    
    // For output nodes, update their visual state based on their input pin
    if (node.type === GateType.OUTPUT) {
      node.state = node.inputs[0] || false; 
    } else {
      node.outputs = computedOutputs;
    }
  });

  return {
    nodes: Array.from(nodeMap.values()),
    connections: connectionMap
  };
};