import { addDays, iso, weekStart } from './dates';
import type { Block } from './types';

/** Blocos de exemplo para o modo demonstração (semana atual). */
export const demoBlocks = (): Block[] => {
  const w = weekStart(iso(new Date()));
  return [
    { id: 'b1', materialId: 'm2', date: w, minutes: 60 },
    { id: 'b2', materialId: 'm2', date: addDays(w, 1), minutes: 60 },
    { id: 'b3', materialId: 'm2', date: addDays(w, 2), minutes: 90 },
    { id: 'b4', materialId: 'm3', date: addDays(w, 3), minutes: 45 },
    { id: 'b5', materialId: 'm4', date: addDays(w, 4), minutes: 60 },
  ];
};
