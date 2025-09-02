export type ComponentType = 'resistor' | 'capacitor' | 'inductor' | 'switch' | 'voltage-source' | 'ac-source';

export interface Component {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  value: string;
  width: number;
  height: number;
  rotation?: number;
  switchState?: boolean; // for switch components
}

export interface Wire {
  id: string;
  startComponent: string;
  endComponent: string;
  startPort: string;
  endPort: string;
  path: Point[];
}

export interface Point {
  x: number;
  y: number;
}

export interface Circuit {
  id: string;
  name: string;
  description: string;
  components: Component[];
  wires: Wire[];
  descriptionPosition?: Point; // position for description block on canvas
}

export interface CurrentFlow {
  id: string;
  wireId: string;
  position: number; // 0 to 1, position along the wire
  direction: 1 | -1;
}

// Component library for sidebar
export interface ComponentTemplate {
  type: ComponentType;
  name: string;
  value: string;
  symbol: string;
  description: string;
}

// Pre-built circuits
export const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  {
    type: 'resistor',
    name: 'Resistor',
    value: '10Ω',
    symbol: 'R',
    description: 'Resistor - 10 Ohms'
  },
  {
    type: 'capacitor',
    name: 'Capacitor',
    value: '1µF',
    symbol: 'C',
    description: 'Capacitor - 1 microFarad'
  },
  {
    type: 'inductor',
    name: 'Inductor',
    value: '1mH',
    symbol: 'L',
    description: 'Inductor - 1 milliHenry'
  },
  {
    type: 'switch',
    name: 'Switch',
    value: 'ON',
    symbol: 'S',
    description: 'Switch - Open/Close'
  },
  {
    type: 'voltage-source',
    name: 'DC Source',
    value: '9V',
    symbol: 'V',
    description: 'DC Voltage Source - 9 Volts'
  },
  {
    type: 'ac-source',
    name: 'AC Source',
    value: '120V',
    symbol: '~',
    description: 'AC Voltage Source - 120V RMS'
  }
];

// Helper functions
export const createComponent = (type: ComponentType, x: number, y: number): Component => {
  const template = COMPONENT_TEMPLATES.find(t => t.type === type);
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    x,
    y,
    value: template?.value || '',
    width: 60,
    height: 30,
    rotation: 0
  };
};

export const createWire = (
  startComponent: string,
  endComponent: string,
  startPort: string,
  endPort: string,
  path: Point[]
): Wire => ({
  id: `wire-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  startComponent,
  endComponent,
  startPort,
  endPort,
  path
});