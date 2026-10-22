export type Exercise = { name: string; sets: number; reps: string };

/** Modelo de treino (ex.: "Peito e tríceps") com os dias da semana em que costuma ser feito. */
export type Workout = {
  id: string;
  name: string;
  /** 0 = domingo ... 6 = sábado */
  weekdays: number[];
  exercises: Exercise[];
  position: number;
};

export type SetLog = { reps: string; kg: string; done: boolean };
export type ExLog = { name: string; sets: SetLog[] };

export type SessionStatus = 'active' | 'done' | 'skipped';

/** Um dia de academia: treino feito, treino em andamento ou falta. */
export type Session = {
  id: string;
  workout_id: string | null;
  workout_name: string;
  session_date: string;
  status: SessionStatus;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
  notes: string;
  log: ExLog[];
};

export const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
/** Ordem de exibição da semana (segunda primeiro), como índices de getDay(). */
export const MON_FIRST = [1, 2, 3, 4, 5, 6, 0];
export const MUSCLES = ['Peito', 'Ombro', 'Tríceps', 'Costas', 'Bíceps', 'Pernas', 'Glúteo', 'Abdômen', 'Cardio'];
