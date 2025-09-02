import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Canvas from '../components/Canvas';
import { Component, Wire, ComponentTemplate, createComponent } from '../types/ComponentTypes';
import { PREBUILT_CIRCUITS } from '../data/prebuiltCircuits';
import { toast } from 'sonner';

const Index = () => {
  const [components, setComponents] = useState<Component[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [draggedComponent, setDraggedComponent] = useState<ComponentTemplate | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0.5);
  const [currentCircuit, setCurrentCircuit] = useState<string | null>(null);

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
      setComponents(circuit.components);
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

  return (
    <div className="h-screen flex bg-background">
      <Sidebar 
        onComponentDrag={handleComponentDrag}
        onCircuitLoad={handleCircuitLoad}
        currentSpeed={currentSpeed}
        onSpeedChange={setCurrentSpeed}
      />
      <Canvas
        components={components}
        wires={wires}
        onComponentAdd={handleComponentAdd}
        onComponentMove={handleComponentMove}
        draggedComponent={draggedComponent}
        currentSpeed={currentSpeed}
        currentCircuit={currentCircuit}
        onSwitchClick={handleSwitchClick}
      />
    </div>
  );
};

export default Index;
