export type SourceType = 'DC' | 'AC';

export interface SimParams {
  sourceType: SourceType;   // 'DC' or 'AC'
  voltage: number;          // volts
  frequency?: number;       // Hz (AC only, default 50)
  speedScale?: number;      // multiplier from UI slider
}

export interface Component {
  id: string;
  type: string;
  value: string;
  numericValue?: number;
  isOn?: boolean; // for switches
}

const parseNumericValue = (value: string, defaultValue: number): number => {
  // Extract numeric value from strings like "100Ω", "1µF", "10mH", etc.
  const match = value.match(/([0-9]*\.?[0-9]+)/);
  if (!match) return defaultValue;
  
  const num = parseFloat(match[1]);
  if (value.includes('µ') || value.includes('u')) return num * 1e-6; // microfarads
  if (value.includes('m')) return num * 1e-3; // millihenries
  if (value.includes('k') || value.includes('K')) return num * 1e3; // kilo
  
  return num || defaultValue;
};

export function computeCurrentMagnitude(components: Component[], simParams: SimParams): number {
  const epsilon = 1e-6;
  
  // Check for open switches first
  const switches = components.filter(comp => comp.type === 'switch');
  const hasOpenSwitch = switches.some(sw => sw.isOn === false);
  if (hasOpenSwitch) return 0;

  // Get source voltage and type
  const voltageSources = components.filter(comp => 
    comp.type === 'voltage-source' || comp.type === 'ac-source'
  );
  
  const voltage = simParams.voltage || 9;
  const frequency = simParams.frequency || 50;
  
  // Calculate component values
  let totalResistance = epsilon; // Prevent division by zero
  let totalCapacitance = 0;
  let totalInductance = 0;
  
  components.forEach(component => {
    const numValue = component.numericValue || parseNumericValue(component.value, 0);
    
    switch (component.type) {
      case 'resistor':
        totalResistance += numValue || 100; // Default 100 ohms
        break;
      case 'capacitor':
        totalCapacitance += numValue || 1e-6; // Default 1µF
        break;
      case 'inductor':
        totalInductance += numValue || 0.01; // Default 10mH
        break;
    }
  });

  let currentMagnitude: number;
  
  if (simParams.sourceType === 'DC') {
    // DC: If any capacitor is present, treat as open at steady state
    if (totalCapacitance > epsilon) {
      return 0; // Capacitor blocks DC at steady state
    }
    
    // Inductor acts as short for DC
    currentMagnitude = voltage / totalResistance;
  } else {
    // AC: Calculate impedance
    const omega = 2 * Math.PI * frequency;
    const Xl = omega * totalInductance; // Inductive reactance
    const Xc = totalCapacitance > epsilon ? 1 / (omega * totalCapacitance) : 0; // Capacitive reactance
    
    const impedanceMagnitude = Math.sqrt(totalResistance * totalResistance + (Xl - Xc) * (Xl - Xc));
    currentMagnitude = voltage / Math.max(impedanceMagnitude, epsilon);
  }
  
  // Clamp to reasonable range
  return Math.max(0, Math.min(currentMagnitude, 10)); // Max 10A for visualization
}

export function getCurrentAnimationSpeed(currentMagnitude: number, speedScale: number = 1): number {
  const k = 120; // px/sec per amp
  const baseSpeed = k * currentMagnitude;
  const speed = baseSpeed * speedScale;
  
  // Clamp animation speed to reasonable range
  return Math.max(Math.min(speed, 600), currentMagnitude > 1e-6 ? 10 : 0);
}