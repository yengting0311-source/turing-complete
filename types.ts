export enum GateType {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  XOR = 'XOR',
  NAND = 'NAND',
  INPUT = 'INPUT',   // Switch
  OUTPUT = 'OUTPUT', // Light
}

export interface Position {
  x: number;
  y: number;
}

export interface NodeData {
  id: string;
  type: GateType;
  position: Position;
  state: boolean; // For Output nodes (is lit?), For Input nodes (is on?)
  inputs: boolean[]; // Current value at input pins
  outputs: boolean[]; // Current computed output value
  label?: string;
}

export interface Connection {
  id: string;
  sourceNodeId: string;
  sourcePinIndex: number;
  targetNodeId: string;
  targetPinIndex: number;
  state: boolean; // Is the wire high or low?
}

export interface Level {
  id: number;
  name: string;
  description: string;
  availableGates: GateType[];
  goal: string;
  inputs: number; // Number of required input switches
  outputs: number; // Number of required output lights
  truthTable: { inputs: boolean[]; outputs: boolean[] }[];
}

export type SimulationStatus = 'idle' | 'running' | 'success';

export interface DragItem {
  type: 'NEW_GATE' | 'EXISTING_NODE';
  gateType?: GateType;
  nodeId?: string;
  offset?: Position;
}