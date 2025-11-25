import React from 'react';
import { NodeData, GateType } from '../types';
import { GATE_CONFIG } from '../constants';

interface GateNodeProps {
  node: NodeData;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onInputMouseUp: (e: React.MouseEvent, nodeId: string, index: number) => void;
  onOutputMouseDown: (e: React.MouseEvent, nodeId: string, index: number) => void;
  onToggleSwitch?: (nodeId: string) => void;
  onDelete?: (e: React.MouseEvent, nodeId: string) => void;
}

const GateNode: React.FC<GateNodeProps> = ({ node, onMouseDown, onInputMouseUp, onOutputMouseDown, onToggleSwitch, onDelete }) => {
  const config = GATE_CONFIG[node.type];
  
  // Dynamic styles based on state
  const isInputOn = node.type === GateType.INPUT && node.state;
  const isOutputOn = node.type === GateType.OUTPUT && node.state;
  
  const bodyColor = isInputOn || isOutputOn ? 'bg-slate-700' : 'bg-slate-800';
  const borderColor = isOutputOn ? 'border-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : config.color;

  return (
    <div
      className={`absolute group cursor-move select-none flex flex-col items-center justify-center rounded-md border-2 ${borderColor} ${bodyColor} w-[80px] h-[60px] z-10 transition-shadow hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]`}
      style={{ left: node.position.x, top: node.position.y }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Prevent deleting input/output nodes which are part of level structure
        if (node.type !== GateType.INPUT && node.type !== GateType.OUTPUT && onDelete) {
           onDelete(e, node.id);
        }
      }}
    >
      {/* Label/Symbol */}
      <div className="text-white font-bold text-lg pointer-events-none">
        {node.type === GateType.NOT ? (
          <div className="flex items-center">
            <span className="mr-1">▷</span>
            <div className="w-2 h-2 rounded-full border border-white bg-transparent"></div>
          </div>
        ) : (
          config.symbol
        )}
      </div>
      
      {/* Node specific interactions */}
      {node.type === GateType.INPUT && (
        <button 
          className={`absolute bottom-1 w-8 h-4 rounded-full transition-colors ${node.state ? 'bg-green-500' : 'bg-red-900'}`}
          onMouseDown={(e) => { e.stopPropagation(); onToggleSwitch && onToggleSwitch(node.id); }}
        >
           <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${node.state ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      )}

      {/* Inputs (Left side) */}
      {Array.from({ length: config.inputs }).map((_, i) => (
        <div
          key={`in-${i}`}
          className="absolute w-4 h-4 -left-2 bg-blue-500 rounded-full hover:scale-150 hover:bg-blue-400 transition-all cursor-crosshair border border-white z-20 flex items-center justify-center"
          style={{ top: `${((i + 1) / (config.inputs + 1)) * 100}%`, transform: 'translateY(-50%)' }}
          onMouseUp={(e) => { 
            e.stopPropagation(); 
            onInputMouseUp(e, node.id, i); 
          }}
          title={`Input ${i}`}
        >
           <div className="w-1 h-1 bg-white rounded-full opacity-50 pointer-events-none"></div>
        </div>
      ))}

      {/* Outputs (Right side) */}
      {Array.from({ length: config.outputs }).map((_, i) => (
        <div
          key={`out-${i}`}
          className="absolute w-4 h-4 -right-2 bg-green-500 rounded-full hover:scale-150 hover:bg-green-400 transition-all cursor-crosshair border border-white z-20 flex items-center justify-center"
          style={{ top: `${((i + 1) / (config.outputs + 1)) * 100}%`, transform: 'translateY(-50%)' }}
          onMouseDown={(e) => { 
            e.stopPropagation(); 
            onOutputMouseDown(e, node.id, i); 
          }}
          title={`Output ${i}`}
        >
             <div className="w-1 h-1 bg-white rounded-full opacity-50 pointer-events-none"></div>
        </div>
      ))}
      
      {node.label && <div className="absolute -bottom-6 text-xs text-gray-400 whitespace-nowrap bg-slate-900/50 px-1 rounded">{node.label}</div>}
    </div>
  );
};

export default GateNode;