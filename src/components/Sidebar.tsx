import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { COMPONENT_TEMPLATES, ComponentTemplate } from '../types/ComponentTypes';
import { PREBUILT_CIRCUITS } from '../data/prebuiltCircuits';
import { Zap, Cpu, Gauge } from 'lucide-react';

interface SidebarProps {
  onComponentDrag: (componentType: ComponentTemplate) => void;
  onCircuitLoad: (circuitId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onComponentDrag, onCircuitLoad }) => {
  const handleDragStart = (e: React.DragEvent, component: ComponentTemplate) => {
    e.dataTransfer.setData('application/json', JSON.stringify(component));
    onComponentDrag(component);
  };

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'resistor': return '⟱';
      case 'capacitor': return '‖';
      case 'inductor': return '∿';
      case 'switch': return '○/○';
      case 'voltage-source': return '⊕';
      case 'ac-source': return '∼';
      default: return '○';
    }
  };

  const getCircuitIcon = (id: string) => {
    switch (id) {
      case 'dc-circuit': return <Zap className="w-4 h-4" />;
      case 'ac-circuit': return <Cpu className="w-4 h-4" />;
      case 'ohms-law': return <Gauge className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-80 bg-card border-r border-border p-4 space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Circuit Simulator</h1>
        <p className="text-sm text-muted-foreground">Drag components to canvas</p>
      </div>

      {/* Components Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            Components
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {COMPONENT_TEMPLATES.map((component) => (
            <div
              key={component.type}
              draggable
              onDragStart={(e) => handleDragStart(e, component)}
              className="
                p-3 rounded-lg border border-border 
                hover:border-primary/50 hover:bg-accent/50 
                cursor-grab active:cursor-grabbing
                transition-all duration-200
                group
              "
            >
              <div className="flex items-center gap-3">
                <div className="
                  w-8 h-8 rounded-md flex items-center justify-center text-lg font-mono
                  bg-muted group-hover:bg-primary group-hover:text-primary-foreground
                  transition-colors duration-200
                ">
                  {getComponentIcon(component.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{component.name}</div>
                  <div className="text-sm text-muted-foreground">{component.value}</div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {/* Circuits Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Circuits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {PREBUILT_CIRCUITS.map((circuit) => (
            <Button
              key={circuit.id}
              variant="outline"
              className="w-full justify-start h-auto p-3"
              onClick={() => onCircuitLoad(circuit.id)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="text-primary">
                  {getCircuitIcon(circuit.id)}
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium">{circuit.name}</div>
                  <div className="text-sm text-muted-foreground">{circuit.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              Drag components to canvas
            </div>
            <div className="text-sm text-muted-foreground">
              Load pre-built circuits to get started
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
              <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
              Current flow animation active
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sidebar;