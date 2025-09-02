import { Circuit, createComponent, createWire } from '../types/ComponentTypes';

// Pre-built circuit configurations
export const DC_CIRCUIT: Circuit = {
  id: 'dc-circuit',
  name: 'DC Circuit',
  description: 'Basic DC circuit with voltage source, resistor, and switch',
  components: [
    { ...createComponent('voltage-source', 100, 200), id: 'dc-source' },
    { ...createComponent('resistor', 250, 200), id: 'dc-resistor' },
    { ...createComponent('switch', 400, 200), id: 'dc-switch' }
  ],
  wires: [
    createWire('dc-source', 'dc-resistor', 'right', 'left', [
      { x: 160, y: 215 },
      { x: 250, y: 215 }
    ]),
    createWire('dc-resistor', 'dc-switch', 'right', 'left', [
      { x: 310, y: 215 },
      { x: 400, y: 215 }
    ]),
    createWire('dc-switch', 'dc-source', 'right', 'left', [
      { x: 460, y: 215 },
      { x: 500, y: 215 },
      { x: 500, y: 300 },
      { x: 100, y: 300 },
      { x: 100, y: 230 }
    ])
  ]
};

export const AC_CIRCUIT: Circuit = {
  id: 'ac-circuit',
  name: 'AC Circuit',
  description: 'AC circuit with RLC components in series',
  components: [
    { ...createComponent('ac-source', 100, 200), id: 'ac-source' },
    { ...createComponent('resistor', 250, 200), id: 'ac-resistor' },
    { ...createComponent('capacitor', 400, 200), id: 'ac-capacitor' },
    { ...createComponent('inductor', 550, 200), id: 'ac-inductor' }
  ],
  wires: [
    createWire('ac-source', 'ac-resistor', 'right', 'left', [
      { x: 160, y: 215 },
      { x: 250, y: 215 }
    ]),
    createWire('ac-resistor', 'ac-capacitor', 'right', 'left', [
      { x: 310, y: 215 },
      { x: 400, y: 215 }
    ]),
    createWire('ac-capacitor', 'ac-inductor', 'right', 'left', [
      { x: 460, y: 215 },
      { x: 550, y: 215 }
    ]),
    createWire('ac-inductor', 'ac-source', 'right', 'left', [
      { x: 610, y: 215 },
      { x: 650, y: 215 },
      { x: 650, y: 300 },
      { x: 100, y: 300 },
      { x: 100, y: 230 }
    ])
  ]
};

export const OHMS_LAW_CIRCUIT: Circuit = {
  id: 'ohms-law',
  name: "Ohm's Law Demo",
  description: 'Simple circuit demonstrating V = I × R',
  components: [
    { ...createComponent('voltage-source', 200, 200), id: 'ohm-source', value: '9V' },
    { ...createComponent('resistor', 400, 200), id: 'ohm-resistor', value: '3Ω' }
  ],
  wires: [
    createWire('ohm-source', 'ohm-resistor', 'right', 'left', [
      { x: 260, y: 215 },
      { x: 400, y: 215 }
    ]),
    createWire('ohm-resistor', 'ohm-source', 'right', 'left', [
      { x: 460, y: 215 },
      { x: 500, y: 215 },
      { x: 500, y: 300 },
      { x: 200, y: 300 },
      { x: 200, y: 230 }
    ])
  ]
};

export const PREBUILT_CIRCUITS = [DC_CIRCUIT, AC_CIRCUIT, OHMS_LAW_CIRCUIT];