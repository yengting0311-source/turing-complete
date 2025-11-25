import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Actually, lets just use a simple random string for no-deps
import { NodeData, Connection, GateType, Position, DragItem, Level, SimulationStatus } from './types';
import { GATE_CONFIG, LEVELS } from './constants';
import { simulateCircuit } from './services/circuitLogic';
import GateNode from './components/GateNode';
import Wire from './components/Wire';
import LevelOverlay from './components/LevelOverlay';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [levelIndex, setLevelIndex] = useState(0);
  const currentLevel = LEVELS[levelIndex];

  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>('idle');
  
  // Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [drawingWire, setDrawingWire] = useState<{ sourceNodeId: string; sourcePin: number; currentPos: Position } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  // Initialize Level
  useEffect(() => {
    resetLevel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIndex]);

  const resetLevel = () => {
    const level = LEVELS[levelIndex];
    const initialNodes: NodeData[] = [];

    // Place Inputs
    for (let i = 0; i < level.inputs; i++) {
      initialNodes.push({
        id: generateId(),
        type: GateType.INPUT,
        position: { x: 50, y: 100 + i * 100 },
        state: false,
        inputs: [],
        outputs: [false],
        label: `IN ${i}`
      });
    }

    // Place Outputs
    for (let i = 0; i < level.outputs; i++) {
      initialNodes.push({
        id: generateId(),
        type: GateType.OUTPUT,
        position: { x: 800, y: 100 + i * 100 },
        state: false,
        inputs: [false],
        outputs: [],
        label: `OUT ${i}`
      });
    }

    setNodes(initialNodes);
    setConnections([]);
    setSimulationStatus('idle');
  };

  // Simulation Loop
  useEffect(() => {
    const tick = () => {
      const result = simulateCircuit(nodes, connections);
      
      // Check if visual state needs update to avoid excessive renders
      let hasChanges = false;
      const newNodes = result.nodes;
      const newConnections = result.connections;

      // Simple deep check (can be optimized)
      if (JSON.stringify(newNodes) !== JSON.stringify(nodes) || JSON.stringify(newConnections) !== JSON.stringify(connections)) {
        setNodes(newNodes);
        setConnections(newConnections);
        checkWinCondition(newNodes);
      }
    };

    const interval = setInterval(tick, 100); // 10Hz simulation
    return () => clearInterval(interval);
  }, [nodes, connections]);

  const checkWinCondition = (currentNodes: NodeData[]) => {
    if (simulationStatus === 'success') return;
  };
  
  const runVerification = async () => {
    setSimulationStatus('running');
    const inputNodes = nodes.filter(n => n.type === GateType.INPUT);
    const outputNodes = nodes.filter(n => n.type === GateType.OUTPUT);
    
    // Sort by Y position to match truth table order usually
    inputNodes.sort((a,b) => a.position.y - b.position.y);
    outputNodes.sort((a,b) => a.position.y - b.position.y);

    let allPassed = true;
    
    // Save current state
    const originalInputStates = inputNodes.map(n => n.state);

    // Run through truth table
    for (const testCase of currentLevel.truthTable) {
        // Set inputs
        const testNodes = nodes.map(n => {
            const index = inputNodes.findIndex(i => i.id === n.id);
            if (index !== -1) {
                return { ...n, state: testCase.inputs[index] };
            }
            return n;
        });

        // We need to settle the circuit (simulate a few ticks)
        let simNodes = testNodes;
        let simConnections = [...connections];
        
        // Propagate for 5 ticks to allow signal to travel
        for(let t=0; t<5; t++) {
             const res = simulateCircuit(simNodes, simConnections);
             simNodes = res.nodes;
             simConnections = res.connections;
        }

        // Check outputs
        const casePassed = testCase.outputs.every((val, idx) => {
            const outNode = outputNodes[idx];
            // Find the updated node in simNodes
            const simOutNode = simNodes.find(n => n.id === outNode.id);
            return simOutNode ? simOutNode.state === val : false;
        });

        if (!casePassed) {
            allPassed = false;
            break;
        }
    }

    // Restore UI state
    const restoredNodes = nodes.map(n => {
         const index = inputNodes.findIndex(i => i.id === n.id);
         if (index !== -1) return { ...n, state: originalInputStates[index] };
         return n;
    });
    setNodes(restoredNodes);

    if (allPassed) {
        setSimulationStatus('success');
    } else {
        alert("Verification Failed! Check your logic.");
        setSimulationStatus('idle');
    }
  };

  // Interactions
  const handleAddGate = (type: GateType) => {
    const newNode: NodeData = {
      id: generateId(),
      type,
      position: { x: 300, y: 300 },
      state: false,
      inputs: [],
      outputs: [false],
    };
    setNodes([...nodes, newNode]);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return; // Only left click
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setDraggingNodeId(nodeId);
      setDragOffset({
        x: e.clientX - node.position.x,
        y: e.clientY - node.position.y
      });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingNodeId) {
      setNodes(prev => prev.map(n => {
        if (n.id === draggingNodeId) {
          return {
            ...n,
            position: {
              x: e.clientX - dragOffset.x,
              y: e.clientY - dragOffset.y
            }
          };
        }
        return n;
      }));
    }

    if (drawingWire && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setDrawingWire(prev => prev ? {
        ...prev,
        currentPos: {
          x: e.clientX - rect.left, // SVG coords
          y: e.clientY - rect.top
        }
      } : null);
    }
  }, [draggingNodeId, dragOffset, drawingWire]);

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    // If we released the mouse and we were drawing a wire, cancel it
    // (unless it was handled by onInputMouseUp which fires first)
    if (drawingWire) {
        setDrawingWire(null);
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);

  // Wiring interactions
  const handleOutputMouseDown = (e: React.MouseEvent, nodeId: string, index: number) => {
    if (e.button !== 0) return;
    e.stopPropagation(); // Don't drag node
    if(svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDrawingWire({
        sourceNodeId: nodeId,
        sourcePin: index,
        currentPos: { x: e.clientX - rect.left, y: e.clientY - rect.top }
        });
    }
  };

  const handleInputMouseUp = (e: React.MouseEvent, nodeId: string, index: number) => {
    e.stopPropagation();
    if (drawingWire) {
      // Check if trying to connect to itself
      if (drawingWire.sourceNodeId === nodeId) return;

      // Create connection
      const newConnection: Connection = {
        id: generateId(),
        sourceNodeId: drawingWire.sourceNodeId,
        sourcePinIndex: drawingWire.sourcePin,
        targetNodeId: nodeId,
        targetPinIndex: index,
        state: false
      };
      // Remove existing connection to this specific input pin if any (logic gates usually have 1 wire per input)
      const filtered = connections.filter(c => !(c.targetNodeId === nodeId && c.targetPinIndex === index));
      setConnections([...filtered, newConnection]);
      setDrawingWire(null);
    }
  };

  const handleDeleteConnection = (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));
  };

  const handleDeleteNode = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    if (draggingNodeId === nodeId) {
        setDraggingNodeId(null);
    }
    
    // Remove connection attached to this node
    setConnections(prev => prev.filter(c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId));
    
    // Remove the node itself
    setNodes(prev => prev.filter(n => n.id !== nodeId));
  };

  const handleToggleSwitch = (nodeId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return { ...n, state: !n.state };
      }
      return n;
    }));
  };
  
  const handleNextLevel = () => {
    if (levelIndex < LEVELS.length - 1) {
        setLevelIndex(prev => prev + 1);
    } else {
        alert("You have completed all available levels!");
    }
  };

  // Render Wire Preview
  const renderTempWire = () => {
    if (!drawingWire || !svgRef.current) return null;
    
    // Find source position
    const sourceNode = nodes.find(n => n.id === drawingWire.sourceNodeId);
    if(!sourceNode) return null;
    
    const config = GATE_CONFIG[sourceNode.type];
    const percentage = (drawingWire.sourcePin + 1) / (config.outputs + 1);
    const startX = sourceNode.position.x + 80;
    const startY = sourceNode.position.y + (60 * percentage);

    const start = { x: startX, y: startY };
    const end = drawingWire.currentPos;

    // Bezier curve control points
    const dist = Math.abs(end.x - start.x);
    const control1 = { x: start.x + dist * 0.5, y: start.y };
    const control2 = { x: end.x - dist * 0.5, y: end.y };

    const pathData = `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`;

    return (
      <path 
        d={pathData} 
        stroke="#4ade80" 
        strokeWidth="4" 
        strokeDasharray="5,5" 
        fill="none" 
        className="opacity-70 pointer-events-none"
      />
    );
  };

  return (
    <div className="w-full h-screen bg-[#0f172a] text-white flex flex-col font-mono overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 border-b border-slate-700 bg-slate-900 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
            LOGIC ARCHITECT
          </div>
          <div className="px-3 py-1 bg-slate-800 rounded text-sm text-gray-400">
            Level {currentLevel.id}: <span className="text-white">{currentLevel.name}</span>
          </div>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={runVerification}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded shadow-[0_0_10px_rgba(74,222,128,0.3)] transition-all font-bold"
            >
                VERIFY CIRCUIT
            </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Palette */}
        <div className="w-64 bg-slate-900 border-r border-slate-700 p-4 flex flex-col gap-4 z-20 shadow-xl">
          <h3 className="text-gray-400 text-sm uppercase tracking-wider font-bold mb-2">Components</h3>
          <div className="grid grid-cols-2 gap-3">
            {currentLevel.availableGates.map(type => {
                if(type === GateType.INPUT || type === GateType.OUTPUT) return null; // Already on board
                const config = GATE_CONFIG[type];
                return (
                    <button
                        key={type}
                        onClick={() => handleAddGate(type)}
                        className={`p-3 rounded border border-slate-600 bg-slate-800 hover:border-white hover:bg-slate-700 transition-all flex flex-col items-center gap-2 group`}
                    >
                        <div className={`w-8 h-6 border-2 ${config.color} rounded flex items-center justify-center text-[10px] font-bold`}>
                            {config.symbol}
                        </div>
                        <span className="text-xs text-gray-300 group-hover:text-white">{type}</span>
                    </button>
                )
            })}
          </div>
          
          <div className="mt-auto p-3 bg-slate-800 rounded text-xs text-slate-400">
            <p className="mb-1">Controls:</p>
            <ul className="list-disc list-inside">
                <li>Drag components to move</li>
                <li>Drag Output to Input to wire</li>
                <li>Right-click component/wire to delete</li>
                <li>Click Switches to toggle</li>
            </ul>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative grid-bg cursor-default" onMouseDown={() => setDrawingWire(null)}> {/* Click bg to cancel wire */}
            
            {/* SVG Layer for Wires */}
            <svg 
                ref={svgRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
            >
                {connections.map(conn => (
                    <Wire key={conn.id} connection={conn} nodes={nodes} onDelete={handleDeleteConnection} />
                ))}
                {renderTempWire()}
            </svg>

            {/* Nodes Layer */}
            {nodes.map(node => (
                <GateNode 
                    key={node.id} 
                    node={node} 
                    onMouseDown={handleNodeMouseDown}
                    onInputMouseUp={handleInputMouseUp}
                    onOutputMouseDown={handleOutputMouseDown}
                    onToggleSwitch={handleToggleSwitch}
                    onDelete={handleDeleteNode}
                />
            ))}
            
            {/* Level Overlay / HUD */}
            <LevelOverlay 
                level={currentLevel} 
                status={simulationStatus}
                onNextLevel={handleNextLevel}
                onRetry={resetLevel}
            />
        </div>
      </div>
    </div>
  );
};

export default App;