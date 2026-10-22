import { addDays } from '../study/dates';
import type { ReadLog } from './types';

/** Dias seguidos com leitura registrada. Se hoje ainda não teve, a contagem parte de ontem. */
export function readingStreak(logs: ReadLog[], today: string) {
  const days = new Set(logs.filter(l => l.pages > 0 || l.minutes > 0).map(l => l.log_date));
  let d = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(d)) { n++; d = addDays(d, -1); }
  return n;
}
