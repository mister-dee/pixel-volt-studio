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
      toast.success(`${circuit.name} loaded successfully!`);
    }
  };

  const handleClearCanvas = () => {
    setComponents([]);
    setWires([]);
    toast.info('Canvas cleared');
  };

  return (
    <div className="h-screen flex bg-background">
      <Sidebar 
        onComponentDrag={handleComponentDrag}
        onCircuitLoad={handleCircuitLoad}
      />
      <Canvas
        components={components}
        wires={wires}
        onComponentAdd={handleComponentAdd}
        onComponentMove={handleComponentMove}
        draggedComponent={draggedComponent}
      />
    </div>
  );
};

export default Index;
