import React, { useRef, useEffect, useState } from 'react';
import { Component, Wire, Point, CurrentFlow, ComponentTemplate, Circuit } from '../types/ComponentTypes';
import { PREBUILT_CIRCUITS } from '../data/prebuiltCircuits';
import { toast } from 'sonner';

interface CanvasProps {
  components: Component[];
  wires: Wire[];
  onComponentAdd: (component: Component) => void;
  onComponentMove: (id: string, x: number, y: number) => void;
  draggedComponent: ComponentTemplate | null;
  currentSpeed: number;
  currentCircuit: string | null;
  onSwitchClick: (switchId: string) => void;
}

const Canvas: React.FC<CanvasProps> = ({
  components,
  wires,
  onComponentAdd,
  onComponentMove,
  draggedComponent,
  currentSpeed,
  currentCircuit,
  onSwitchClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFlows, setCurrentFlows] = useState<CurrentFlow[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedComponentId, setDraggedComponentId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Component symbols and colors
  const getComponentColor = (type: string): string => {
    switch (type) {
      case 'resistor': return '#f97316'; // orange
      case 'capacitor': return '#3b82f6'; // blue
      case 'inductor': return '#10b981'; // green
      case 'switch': return '#6b7280'; // gray
      case 'voltage-source': return '#dc2626'; // red
      case 'ac-source': return '#7c3aed'; // purple
      default: return '#6b7280';
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;

    const gridSize = 20;
    
    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  };

  // Snap component to nearest wire point
  const snapToWire = (x: number, y: number): { x: number, y: number } => {
    const snapDistance = 30;
    let closestPoint = { x, y };
    let minDistance = snapDistance;

    wires.forEach(wire => {
      wire.path.forEach(point => {
        const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = { x: point.x - 30, y: point.y - 15 }; // Offset for component center
        }
      });
    });

    return closestPoint;
  };

  const drawComponent = (ctx: CanvasRenderingContext2D, component: Component) => {
    const { x, y, width, height, type, value, switchState } = component;
    
    // Component background
    ctx.fillStyle = getComponentColor(type);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);

    // Component symbol
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = x + width / 2;
    const centerY = y + height / 2;

    let symbol = '';
    switch (type) {
      case 'resistor': symbol = '⟱'; break;
      case 'capacitor': symbol = '‖'; break;
      case 'inductor': symbol = '∿'; break;
      case 'switch': symbol = switchState ? '○─○' : '○/○'; break;
      case 'voltage-source': symbol = '+/-'; break;
      case 'ac-source': symbol = '∼'; break;
    }

    ctx.fillText(symbol, centerX, centerY - 5);
    
    // Component value
    ctx.font = '10px monospace';
    ctx.fillText(value, centerX, centerY + 8);

    // Connection points
    ctx.fillStyle = '#10b981';
    const pointRadius = 3;
    
    // Left connection point
    ctx.beginPath();
    ctx.arc(x, y + height / 2, pointRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Right connection point
    ctx.beginPath();
    ctx.arc(x + width, y + height / 2, pointRadius, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawWire = (ctx: CanvasRenderingContext2D, wire: Wire) => {
    if (wire.path.length < 2) return;

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(wire.path[0].x, wire.path[0].y);
    
    for (let i = 1; i < wire.path.length; i++) {
      ctx.lineTo(wire.path[i].x, wire.path[i].y);
    }
    
    ctx.stroke();
  };

  // Check if current should flow (all switches in circuit must be closed)
  const shouldAnimateCurrent = (): boolean => {
    const switchComponents = components.filter(comp => comp.type === 'switch');
    return switchComponents.length === 0 || switchComponents.every(comp => comp.switchState);
  };

  const drawCurrentFlow = (ctx: CanvasRenderingContext2D, wire: Wire, flows: CurrentFlow[]) => {
    if (!shouldAnimateCurrent()) return;
    
    const wireFlows = flows.filter(f => f.wireId === wire.id);
    
    wireFlows.forEach(flow => {
      if (wire.path.length < 2) return;

      // Calculate position along the wire path
      const totalSegments = wire.path.length - 1;
      const segmentIndex = Math.floor(flow.position * totalSegments);
      const segmentProgress = (flow.position * totalSegments) % 1;

      if (segmentIndex >= totalSegments) return;

      const start = wire.path[segmentIndex];
      const end = wire.path[segmentIndex + 1];

      const x = start.x + (end.x - start.x) * segmentProgress;
      const y = start.y + (end.y - start.y) * segmentProgress;

      // Draw current dot
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  };

  // Draw circuit description block
  const drawCircuitDescription = (ctx: CanvasRenderingContext2D) => {
    if (!currentCircuit) return;
    
    const circuit = PREBUILT_CIRCUITS.find(c => c.id === currentCircuit);
    if (!circuit || !circuit.descriptionPosition) return;

    const { x, y } = circuit.descriptionPosition;
    const padding = 12;
    const lineHeight = 18;
    const maxWidth = 200;

    // Background
    ctx.fillStyle = '#1f2937';
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, maxWidth, lineHeight * 3 + padding * 2);
    ctx.strokeRect(x, y, maxWidth, lineHeight * 3 + padding * 2);

    // Text
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    ctx.fillText(circuit.name, x + padding, y + padding);
    ctx.font = '12px monospace';
    ctx.fillStyle = '#9ca3af';
    
    // Wrap description text
    const words = circuit.description.split(' ');
    let line = '';
    let lineY = y + padding + lineHeight;
    
    words.forEach(word => {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth - padding * 2 && line !== '') {
        ctx.fillText(line.trim(), x + padding, lineY);
        line = word + ' ';
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    });
    ctx.fillText(line.trim(), x + padding, lineY);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);

    // Draw wires first (behind components)
    wires.forEach(wire => {
      drawWire(ctx, wire);
      drawCurrentFlow(ctx, wire, currentFlows);
    });

    // Draw components
    components.forEach(component => {
      drawComponent(ctx, component);
    });

    // Draw circuit description
    drawCircuitDescription(ctx);

    // Draw drop zone indication when dragging
    if (isDragOver && draggedComponent) {
      ctx.strokeStyle = '#3b82f6';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      ctx.setLineDash([]);
    }
  };

  // Animation loop for current flow
  useEffect(() => {
    if (wires.length === 0) return;

    // Initialize current flows for each wire
    const flows: CurrentFlow[] = wires.map(wire => ({
      id: `flow-${wire.id}`,
      wireId: wire.id,
      position: 0,
      direction: 1
    }));

    setCurrentFlows(flows);

    const animationInterval = setInterval(() => {
      setCurrentFlows(prevFlows => 
        prevFlows.map(flow => ({
          ...flow,
          position: (flow.position + 0.01 * currentSpeed * flow.direction) % 1
        }))
      );
    }, 50);

    return () => clearInterval(animationInterval);
  }, [wires, currentSpeed]);

  // Redraw canvas when data changes
  useEffect(() => {
    drawCanvas();
  }, [components, wires, currentFlows, isDragOver, draggedComponent]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        drawCanvas();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const componentData = JSON.parse(e.dataTransfer.getData('application/json'));
      const rect = canvasRef.current?.getBoundingClientRect();
      
      if (rect) {
        const x = e.clientX - rect.left - 30; // Center the component
        const y = e.clientY - rect.top - 15;

        // Snap to wire if close enough
        const snappedPosition = snapToWire(x, y);

        const newComponent: Component = {
          id: `${componentData.type}-${Date.now()}`,
          type: componentData.type,
          x: Math.max(0, Math.min(snappedPosition.x, rect.width - 60)),
          y: Math.max(0, Math.min(snappedPosition.y, rect.height - 30)),
          value: componentData.value,
          width: 60,
          height: 30,
          switchState: componentData.type === 'switch' ? true : undefined
        };

        onComponentAdd(newComponent);
        toast.success(`${componentData.name} added to circuit`);
      }
    } catch (error) {
      console.error('Error adding component:', error);
      toast.error('Failed to add component');
    }
  };

  // Mouse handlers for dragging components
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked component
    const clickedComponent = components.find(comp => 
      x >= comp.x && x <= comp.x + comp.width &&
      y >= comp.y && y <= comp.y + comp.height
    );

    if (clickedComponent) {
      // Handle switch click
      if (clickedComponent.type === 'switch') {
        onSwitchClick(clickedComponent.id);
        return;
      }
      
      setDraggedComponentId(clickedComponent.id);
      setDragOffset({
        x: x - clickedComponent.x,
        y: y - clickedComponent.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedComponentId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    // Snap to wire if close enough during drag
    const snappedPosition = snapToWire(x, y);

    onComponentMove(draggedComponentId, 
      Math.max(0, Math.min(snappedPosition.x, rect.width - 60)),
      Math.max(0, Math.min(snappedPosition.y, rect.height - 30))
    );
  };

  const handleMouseUp = () => {
    setDraggedComponentId(null);
  };

  return (
    <div className="flex-1 bg-canvas-bg relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {/* Canvas info overlay */}
      <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm p-3 rounded-lg border border-border">
        <div className="text-sm text-muted-foreground space-y-1">
          <div>Components: {components.length}</div>
          <div>Wires: {wires.length}</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
            Current flowing
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canvas;