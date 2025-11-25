import { GateType, Level } from './types';

export const GATE_CONFIG: Record<GateType, { inputs: number; outputs: number; color: string; symbol: string }> = {
  [GateType.AND]: { inputs: 2, outputs: 1, color: 'border-red-500', symbol: '&' },
  [GateType.OR]: { inputs: 2, outputs: 1, color: 'border-blue-500', symbol: '≥1' },
  [GateType.NOT]: { inputs: 1, outputs: 1, color: 'border-yellow-500', symbol: '1' },
  [GateType.XOR]: { inputs: 2, outputs: 1, color: 'border-purple-500', symbol: '=1' },
  [GateType.NAND]: { inputs: 2, outputs: 1, color: 'border-orange-500', symbol: '!&' },
  [GateType.INPUT]: { inputs: 0, outputs: 1, color: 'border-green-500', symbol: 'SW' },
  [GateType.OUTPUT]: { inputs: 1, outputs: 0, color: 'border-gray-200', symbol: 'LED' },
};

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "The Beginning",
    description: "Connect the Switch to the Output Light to verify the circuit works.",
    availableGates: [GateType.INPUT, GateType.OUTPUT],
    goal: "Make the light turn on when the switch is on.",
    inputs: 1,
    outputs: 1,
    truthTable: [
      { inputs: [false], outputs: [false] },
      { inputs: [true], outputs: [true] },
    ]
  },
  {
    id: 2,
    name: "Inverter",
    description: "The light should be OFF when the switch is ON, and vice versa.",
    availableGates: [GateType.INPUT, GateType.OUTPUT, GateType.NOT],
    goal: "Invert the signal.",
    inputs: 1,
    outputs: 1,
    truthTable: [
      { inputs: [false], outputs: [true] },
      { inputs: [true], outputs: [false] },
    ]
  },
  {
    id: 3,
    name: "Safety Interlock (AND)",
    description: "The machine (Light) should only start if both safety switches are ON.",
    availableGates: [GateType.INPUT, GateType.OUTPUT, GateType.AND],
    goal: "Implement AND logic.",
    inputs: 2,
    outputs: 1,
    truthTable: [
      { inputs: [false, false], outputs: [false] },
      { inputs: [false, true], outputs: [false] },
      { inputs: [true, false], outputs: [false] },
      { inputs: [true, true], outputs: [true] },
    ]
  },
  {
    id: 4,
    name: "Exclusive Decision (XOR)",
    description: "The light should be ON if either switch is ON, but NOT both.",
    availableGates: [GateType.INPUT, GateType.OUTPUT, GateType.AND, GateType.OR, GateType.NOT], // No XOR gate given!
    goal: "Build an XOR gate using basic gates.",
    inputs: 2,
    outputs: 1,
    truthTable: [
      { inputs: [false, false], outputs: [false] },
      { inputs: [false, true], outputs: [true] },
      { inputs: [true, false], outputs: [true] },
      { inputs: [true, true], outputs: [false] },
    ]
  }
];