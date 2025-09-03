import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { PREBUILT_CIRCUITS } from '../data/prebuiltCircuits';
import { Zap, Cpu, Gauge, Activity, Trash2 } from 'lucide-react';

interface ControlSidebarProps {
  onCircuitLoad: (circuitId: string) => void;
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
}

const ControlSidebar: React.FC<ControlSidebarProps> = ({ 
  onCircuitLoad, 
  currentSpeed, 
  onSpeedChange, 
  onDeleteSelected,
  hasSelection
}) => {
  const getCircuitIcon = (id: string) => {
    switch (id) {
      case 'dc-circuit': return <Zap className="w-4 h-4" />;
      case 'ac-circuit': return <Cpu className="w-4 h-4" />;
      case 'ohms-law': return <Gauge className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-80 bg-card border-l border-border p-4 space-y-4">
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

      <Separator />

      {/* Actions Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-primary" />
            Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant={hasSelection ? "destructive" : "outline"}
            className="w-full"
            onClick={onDeleteSelected}
            disabled={!hasSelection}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
          {!hasSelection && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Select a component first
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Simulation Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Simulation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Speed</span>
              <span>{Math.round(currentSpeed * 100)}%</span>
            </div>
            <Slider
              value={[currentSpeed]}
              onValueChange={(value) => onSpeedChange(value[0])}
              max={2}
              min={0.1}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Current animation</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ControlSidebar;