export function projectPointToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const vx = x2 - x1, vy = y2 - y1;
  const wx = px - x1, wy = py - y1;
  const len2 = vx * vx + vy * vy || 1;
  let t = (wx * vx + wy * vy) / len2;
  t = Math.max(0, Math.min(1, t));
  return { x: x1 + t * vx, y: y1 + t * vy, t };
}

export function findNearestWirePoint(
  px: number, 
  py: number, 
  wires: Array<{ id: string; path: Array<{ x: number; y: number }> }>,
  threshold = 20
): { x: number; y: number; distance: number; wireId: string; t: number } | null {
  let nearestPoint: { x: number; y: number; distance: number; wireId: string; t: number } | null = null;
  let minDistance = threshold;

  wires.forEach(wire => {
    for (let i = 0; i < wire.path.length - 1; i++) {
      const p1 = wire.path[i];
      const p2 = wire.path[i + 1];
      const projection = projectPointToSegment(px, py, p1.x, p1.y, p2.x, p2.y);
      const distance = Math.sqrt(Math.pow(px - projection.x, 2) + Math.pow(py - projection.y, 2));
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = {
          x: projection.x,
          y: projection.y,
          distance,
          wireId: wire.id,
          t: projection.t
        };
      }
    }
  });

  return nearestPoint;
}