import type { DragEvent } from 'react';

export type Drag = { kind: 'material' | 'block'; id: string };

export const startDrag = (e: DragEvent, d: Drag) => {
  e.dataTransfer.setData('text/plain', JSON.stringify(d));
  e.dataTransfer.effectAllowed = 'move';
};

export const readDrag = (e: DragEvent): Drag | null => {
  try {
    const d = JSON.parse(e.dataTransfer.getData('text/plain'));
    return d && (d.kind === 'material' || d.kind === 'block') && d.id ? d : null;
  } catch {
    return null;
  }
};
