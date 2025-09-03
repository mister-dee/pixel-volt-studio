import React, { useState, useRef, useEffect } from 'react';
import ComponentSidebar from '../components/ComponentSidebar';
import ControlSidebar from '../components/ControlSidebar';
import Canvas from '../components/Canvas';
import { Component, Wire, ComponentTemplate, createComponent } from '../types/ComponentTypes';
import { PREBUILT_CIRCUITS } from '../data/prebuiltCircuits';
import { computeCurrentMagnitude, SimParams } from '../simulation';
import { toast } from 'sonner';

const Index = () => {
  const [components, setComponents] = useState<Component[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [draggedComponent, setDraggedComponent] = useState<ComponentTemplate | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0.5);
  const [currentCircuit, setCurrentCircuit] = useState<string | null>(null);
  
  // Physics simulation parameters
  const [simParams, setSimParams] = useState<SimParams>({
    sourceType: 'DC',
    voltage: 9,
    frequency: 50,
    speedScale: 0.5
  });
  
  // Current magnitude for animation (use ref for RAF loop access)
  const currentMagnitudeRef = useRef<number>(0);

  // Update current magnitude when components or simulation params change
  useEffect(() => {
    const simComponents = components.map(comp => ({
      id: comp.id,
      type: comp.type,
      value: comp.value,
      numericValue: comp.numericValue,
      isOn: comp.type === 'switch' ? comp.switchState !== false : undefined
    }));
    
    currentMagnitudeRef.current = computeCurrentMagnitude(simComponents, {
      ...simParams,
      speedScale: currentSpeed
    });
  }, [components, simParams, currentSpeed]);

  // Update source type based on loaded circuit
  useEffect(() => {
    if (currentCircuit) {
      const hasACSource = components.some(comp => comp.type === 'ac-source');
      const hasVoltageSource = components.some(comp => comp.type === 'voltage-source');
      
      if (hasACSource) {
        setSimParams(prev => ({ ...prev, sourceType: 'AC' }));
      } else if (hasVoltageSource) {
        setSimParams(prev => ({ ...prev, sourceType: 'DC' }));
      }
    }
  }, [components, currentCircuit]);

  const handleComponentAdd = (component: Component) => {
    setComponents(prev => [...prev, component]);
  };

  const handleComponentMove = (id: string, x: number, y: number) => {
    setComponents(prev => 
      prev.map(comp => 
        comp.id === id ? { ...comp, x, y } : comp
      )
    );
  };

  const handleComponentDrag = (componentTemplate: ComponentTemplate) => {
    setDraggedComponent(componentTemplate);
  };

  const handleCircuitLoad = (circuitId: string) => {
    const circuit = PREBUILT_CIRCUITS.find(c => c.id === circuitId);
    if (circuit) {
      // Set default switch states and numeric values
      const processedComponents = circuit.components.map(comp => ({
        ...comp,
        switchState: comp.type === 'switch' ? true : comp.switchState,
        isSelected: false
      }));
      
      setComponents(processedComponents);
      setWires(circuit.wires);
      setCurrentCircuit(circuitId);
      toast.success(`${circuit.name} loaded successfully!`);
    }
  };

  const handleClearCanvas = () => {
    setComponents([]);
    setWires([]);
    setCurrentCircuit(null);
    toast.info('Canvas cleared');
  };

  const handleSwitchClick = (switchId: string) => {
    setComponents(prev => 
      prev.map(comp => 
        comp.id === switchId && comp.type === 'switch' 
          ? { ...comp, switchState: !comp.switchState }
          : comp
      )
    );
  };

  const handleComponentSelect = (componentId: string) => {
    setComponents(prev =>
      prev.map(comp => ({
        ...comp,
        isSelected: comp.id === componentId ? !comp.isSelected : false
      }))
    );
  };

  const handleDeleteSelected = () => {
    const selectedComponents = components.filter(comp => comp.isSelected);
    if (selectedComponents.length === 0) {
      toast.error('No component selected');
      return;
    }
    
    setComponents(prev => prev.filter(comp => !comp.isSelected));
    toast.success(`Deleted ${selectedComponents.length} component(s)`);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      handleDeleteSelected();
    }
  };

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [components]);

  const hasSelection = components.some(comp => comp.isSelected);

  return (
    <div className="h-screen flex bg-background">
      <ComponentSidebar onComponentDrag={handleComponentDrag} />
      
      <Canvas
        components={components}
        wires={wires}
        onComponentAdd={handleComponentAdd}
        onComponentMove={handleComponentMove}
        draggedComponent={draggedComponent}
        currentSpeed={currentSpeed}
        currentCircuit={currentCircuit}
        onSwitchClick={handleSwitchClick}
        onComponentSelect={handleComponentSelect}
        currentMagnitudeRef={currentMagnitudeRef}
      />
      
      <div className="hidden lg:block">
        <ControlSidebar
          onCircuitLoad={handleCircuitLoad}
          currentSpeed={currentSpeed}
          onSpeedChange={setCurrentSpeed}
          onDeleteSelected={handleDeleteSelected}
          hasSelection={hasSelection}
        />
      </div>
      
      {/* Mobile control panel */}
      <div className="lg:hidden fixed bottom-4 right-4 z-10">
        <ControlSidebar
          onCircuitLoad={handleCircuitLoad}
          currentSpeed={currentSpeed}
          onSpeedChange={setCurrentSpeed}
          onDeleteSelected={handleDeleteSelected}
          hasSelection={hasSelection}
        />
      </div>
    </div>
  );
};

export default Index;
