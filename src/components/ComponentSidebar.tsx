import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { COMPONENT_TEMPLATES, ComponentTemplate } from '../types/ComponentTypes';
import { Cpu } from 'lucide-react';

interface ComponentSidebarProps {
  onComponentDrag: (componentType: ComponentTemplate) => void;
}

const ComponentSidebar: React.FC<ComponentSidebarProps> = ({ onComponentDrag }) => {
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

      {/* Info Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              Drag components to canvas
            </div>
            <div className="text-sm text-muted-foreground">
              Components snap to nearby wires
            </div>
            <div className="text-sm text-muted-foreground">
              Click to select, Delete key to remove
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComponentSidebar;