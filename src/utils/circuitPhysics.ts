import { Component, Wire, ComponentType } from '../types/ComponentTypes';

export interface PhysicsState {
  voltage: number;
  resistance: number;
  capacitance: number;
  inductance: number;
  current: number;
  capacitorCharge: number;
  lastCurrentChange: number;
}

export const calculateCircuitPhysics = (
  components: Component[],
  wires: Wire[],
  currentTime: number,
  previousState?: PhysicsState
): PhysicsState => {
  // Default circuit values
  let voltage = 9; // Default 9V from voltage source
  let totalResistance = 1; // Base resistance to prevent division by zero
  let totalCapacitance = 0;
  let totalInductance = 0;
  let capacitorCharge = previousState?.capacitorCharge || 0;
  let lastCurrentChange = previousState?.lastCurrentChange || currentTime;

  // Find voltage sources and update voltage
  const voltageSources = components.filter(comp => 
    comp.type === 'voltage-source' || comp.type === 'ac-source'
  );
  
  if (voltageSources.length > 0) {
    const source = voltageSources[0];
    if (source.type === 'ac-source') {
      // AC voltage varies sinusoidally
      voltage = parseFloat(source.value) * Math.sin(currentTime * 0.01);
    } else {
      voltage = parseFloat(source.value) || 9;
    }
  }

  // Calculate total component values
  components.forEach(component => {
    switch (component.type) {
      case 'resistor':
        totalResistance += parseFloat(component.value) || 10;
        break;
      case 'capacitor':
        totalCapacitance += parseFloat(component.value.replace('µF', '')) || 1;
        break;
      case 'inductor':
        totalInductance += parseFloat(component.value.replace('mH', '')) || 1;
        break;
    }
  });

  // Calculate current based on component physics
  let current = voltage / totalResistance; // Ohm's law base

  // Capacitor effects (RC circuit behavior)
  if (totalCapacitance > 0) {
    const timeConstant = totalResistance * totalCapacitance * 0.001; // Convert to proper units
    const chargingRate = 1 - Math.exp(-(currentTime - lastCurrentChange) * 0.001 / timeConstant);
    
    if (Math.abs(voltage) > 0.1) { // DC or significant AC
      capacitorCharge = voltage * chargingRate;
      current = current * (1 - chargingRate); // Reduces as capacitor charges
    } else {
      current = current * chargingRate; // AC behavior
    }
  }

  // Inductor effects (RL circuit behavior)
  if (totalInductance > 0 && previousState) {
    const timeConstant = totalInductance / totalResistance;
    const inductorFactor = 1 - Math.exp(-(currentTime - lastCurrentChange) * 0.001 / timeConstant);
    current = previousState.current + (current - previousState.current) * inductorFactor;
  }

  // Check for open switches (breaks circuit)
  const switches = components.filter(comp => comp.type === 'switch');
  const hasOpenSwitch = switches.some(sw => !sw.switchState);
  
  if (hasOpenSwitch) {
    current = 0;
  }

  return {
    voltage,
    resistance: totalResistance,
    capacitance: totalCapacitance,
    inductance: totalInductance,
    current: Math.max(0, current), // Ensure non-negative current
    capacitorCharge,
    lastCurrentChange
  };
};