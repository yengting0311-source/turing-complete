import React from 'react';
import { Connection, NodeData, Position } from '../types';
import { GATE_CONFIG } from '../constants';

interface WireProps {
  connection: Connection;
  nodes: NodeData[];
  onDelete?: (id: string) => void;
}

// Helper to calculate pin position relative to the canvas
const getPinPosition = (node: NodeData, pinIndex: number, isInput: boolean): Position => {
  const config = GATE_CONFIG[node.type];
  const count = isInput ? config.inputs : config.outputs;
  const percentage = (pinIndex + 1) / (count + 1);
  
  const width = 80; // Must match GateNode width
  const height = 60; // Must match GateNode height

  return {
    x: node.position.x + (isInput ? 0 : width),
    y: node.position.y + (height * percentage)
  };
};

const Wire: React.FC<WireProps> = ({ connection, nodes, onDelete }) => {
  const sourceNode = nodes.find(n => n.id === connection.sourceNodeId);
  const targetNode = nodes.find(n => n.id === connection.targetNodeId);

  if (!sourceNode || !targetNode) return null;

  const start = getPinPosition(sourceNode, connection.sourcePinIndex, false);
  const end = getPinPosition(targetNode, connection.targetPinIndex, true);

  // Bezier curve control points for smooth wiring
  const dist = Math.abs(end.x - start.x);
  const control1 = { x: start.x + dist * 0.5, y: start.y };
  const control2 = { x: end.x - dist * 0.5, y: end.y };

  const pathData = `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`;

  return (
    <g 
      className="group cursor-pointer"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete && onDelete(connection.id);
      }}
    >
      {/* Invisible thicker path for easier interaction (Hit Area) */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="15"
        fill="none"
      />
      
      {/* Background shadow for visibility */}
      <path
        d={pathData}
        stroke="#0f172a"
        strokeWidth="6"
        fill="none"
      />
      
      {/* The actual wire */}
      <path
        d={pathData}
        stroke={connection.state ? "#4ade80" : "#334155"}
        strokeWidth="3"
        fill="none"
        className="transition-colors duration-150 group-hover:stroke-yellow-400"
        style={{ filter: connection.state ? 'drop-shadow(0 0 3px #4ade80)' : 'none' }}
      />
    </g>
  );
};

export default Wire;