import React, { useRef, useEffect, useState } from 'react';
import { Component, Wire, Point, ComponentTemplate, Circuit } from '../types/ComponentTypes';
import { PREBUILT_CIRCUITS } from '../data/prebuiltCircuits';
import { findNearestWirePoint } from '../utils/geometry';
import { getCurrentAnimationSpeed } from '../simulation';
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
  onComponentSelect: (componentId: string) => void;
  currentMagnitudeRef: React.MutableRefObject<number>;
}

const Canvas: React.FC<CanvasProps> = ({
  components,
  wires,
  onComponentAdd,
  onComponentMove,
  draggedComponent,
  currentSpeed,
  currentCircuit,
  onSwitchClick,
  onComponentSelect,
  currentMagnitudeRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedComponentId, setDraggedComponentId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Animation state - using refs to avoid re-render loops in RAF
  const animationIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const progressRef = useRef<number>(0); // Current position along path (0-1)
  const isAnimatingRef = useRef<boolean>(false);
  const pathRef = useRef<Point[]>([]);
  const pathLengthsRef = useRef<number[]>([]);

  // Build animation path from wires
  useEffect(() => {
    let fullPath: Point[] = [];
    
    if (wires.length === 0) {
      // Fallback path when no wires exist
      fullPath = [
        { x: 50, y: 50 },
        { x: 250, y: 50 }
      ];
    } else {
      // Simple path construction - just concatenate all wire paths
      wires.forEach(wire => {
        if (wire.path.length > 0) {
          fullPath.push(...wire.path);
        }
      });
    }

    // Calculate cumulative lengths for parametric traversal
    const lengths: number[] = [0];
    for (let i = 1; i < fullPath.length; i++) {
      const dx = fullPath[i].x - fullPath[i - 1].x;
      const dy = fullPath[i].y - fullPath[i - 1].y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);
      lengths.push(lengths[lengths.length - 1] + segmentLength);
    }

    pathRef.current = fullPath;
    pathLengthsRef.current = lengths;
  }, [wires]);

  // Stable RAF animation loop
  useEffect(() => {
    const animate = (currentTime: number) => {
      const dt = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = currentTime;

      const currentMagnitude = currentMagnitudeRef.current;
      const animationSpeed = getCurrentAnimationSpeed(currentMagnitude, currentSpeed);
      const pathPoints = pathRef.current;
      
      // Debug logging (development only)
      if (process.env.NODE_ENV === "development") {
        console.log("Current:", currentMagnitudeRef.current, "Path:", pathPoints.length, "Distance:", progressRef.current);
      }

      // Always animate if path exists, but freeze dot when current is too low
      const shouldAnimate = animationSpeed > 0 && pathPoints.length > 1;
      
      if (shouldAnimate) {
        isAnimatingRef.current = true;
        if (pathLengthsRef.current.length > 1) {
          const totalLength = pathLengthsRef.current[pathLengthsRef.current.length - 1];
          if (totalLength > 0) {
            const distance = animationSpeed * dt;
            progressRef.current = (progressRef.current + distance / totalLength) % 1;
          }
        }
      } else {
        // Freeze dot at first path point when current is too low
        isAnimatingRef.current = false;
        progressRef.current = 0;
      }

      // Continue animation loop (always running)
      animationIdRef.current = requestAnimationFrame(animate);
    };

    // Start animation loop
    lastTimeRef.current = performance.now();
    animationIdRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [currentSpeed]); // Re-start loop when speed changes

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

  const drawComponent = (ctx: CanvasRenderingContext2D, component: Component) => {
    const { x, y, width, height, type, value, switchState, isSelected } = component;
    
    // Selection highlight
    if (isSelected) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
      ctx.setLineDash([]);
    }
    
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
    
    // Component value with special handling for voltage sources
    ctx.font = '10px monospace';
    let displayValue = value;
    
    // For voltage sources, ensure voltage is displayed
    if (type === 'voltage-source' || type === 'ac-source') {
      if (!value || !value.includes('V')) {
        displayValue = type === 'voltage-source' ? '9V' : '120V';
      }
    }
    
    ctx.fillText(displayValue, centerX, centerY + 8);

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

  const drawCurrentFlow = (ctx: CanvasRenderingContext2D) => {
    if (pathRef.current.length < 2) return;

    const path = pathRef.current;
    const lengths = pathLengthsRef.current;
    const progress = progressRef.current;
    const totalLength = lengths[lengths.length - 1];
    
    if (totalLength <= 0) return;

    // Find position along path
    const targetDistance = progress * totalLength;
    let segmentIndex = 0;
    
    for (let i = 1; i < lengths.length; i++) {
      if (targetDistance <= lengths[i]) {
        segmentIndex = i - 1;
        break;
      }
    }
    
    if (segmentIndex >= path.length - 1) return;

    const segmentProgress = lengths[segmentIndex + 1] - lengths[segmentIndex];
    const localProgress = segmentProgress > 0 ? (targetDistance - lengths[segmentIndex]) / segmentProgress : 0;
    
    const start = path[segmentIndex];
    const end = path[segmentIndex + 1];
    
    const x = start.x + (end.x - start.x) * localProgress;
    const y = start.y + (end.y - start.y) * localProgress;

    // Draw current dot
    const currentMagnitude = currentMagnitudeRef.current;
    const intensity = Math.min(currentMagnitude / 2, 1);
    
    ctx.fillStyle = `rgba(239, 68, 68, ${0.8 + intensity * 0.2})`;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6 * (0.5 + intensity * 0.5);
    ctx.beginPath();
    ctx.arc(x, y, 3 + intensity, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
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
    });

    // Draw current flow
    drawCurrentFlow(ctx);

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

  // Redraw canvas when data changes
  useEffect(() => {
    const redraw = () => {
      drawCanvas();
    };
    
    // Use RAF to smooth re-draws
    const id = requestAnimationFrame(redraw);
    return () => cancelAnimationFrame(id);
  }, [components, wires, isDragOver, draggedComponent, currentCircuit]);

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

  // Drag and drop handlers with snap-to-wire
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
        const dropX = e.clientX - rect.left - 30; // Center the component
        const dropY = e.clientY - rect.top - 15;

        // Try to snap to nearest wire
        const nearestWire = findNearestWirePoint(dropX + 30, dropY + 15, wires, 20);
        
        let finalX = Math.max(0, Math.min(dropX, rect.width - 60));
        let finalY = Math.max(0, Math.min(dropY, rect.height - 30));
        let attachedWireId: string | undefined;
        let attachedT: number | undefined;

        if (nearestWire) {
          finalX = Math.max(0, Math.min(nearestWire.x - 30, rect.width - 60));
          finalY = Math.max(0, Math.min(nearestWire.y - 15, rect.height - 30));
          attachedWireId = nearestWire.wireId;
          attachedT = nearestWire.t;
          toast.success(`Component snapped to wire`);
        }

        const newComponent: Component = {
          id: `${componentData.type}-${Date.now()}`,
          type: componentData.type,
          x: finalX,
          y: finalY,
          value: componentData.value,
          width: 60,
          height: 30,
          switchState: componentData.type === 'switch' ? true : undefined,
          attachedWireId,
          attachedT,
          isSelected: false
        };

        onComponentAdd(newComponent);
        toast.success(`${componentData.name} added to circuit`);
      }
    } catch (error) {
      console.error('Error adding component:', error);
      toast.error('Failed to add component');
    }
  };

  // Mouse handlers for dragging and selecting components
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked component (search in reverse order to prioritize top components)
    const clickedComponent = [...components].reverse().find(comp => 
      x >= comp.x && x <= comp.x + comp.width &&
      y >= comp.y && y <= comp.y + comp.height
    );

    if (clickedComponent) {
      // Handle switch click (toggle)
      if (clickedComponent.type === 'switch') {
        onSwitchClick(clickedComponent.id);
        return;
      }
      
      // Handle component selection
      if (e.ctrlKey || e.metaKey) {
        // Multi-select with Ctrl/Cmd
        onComponentSelect(clickedComponent.id);
      } else {
        // Single select
        onComponentSelect(clickedComponent.id);
        
        // Start drag
        setDraggedComponentId(clickedComponent.id);
        setDragOffset({
          x: x - clickedComponent.x,
          y: y - clickedComponent.y
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedComponentId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    onComponentMove(draggedComponentId, 
      Math.max(0, Math.min(x, rect.width - 60)),
      Math.max(0, Math.min(y, rect.height - 30))
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
          <div>Current: {currentMagnitudeRef.current.toFixed(2)}A</div>
          <div>Animation: {isAnimatingRef.current ? 'Active' : 'Paused'}</div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isAnimatingRef.current ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
            Current flow
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canvas;