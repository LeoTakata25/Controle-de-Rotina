import { addDays, iso, weekStart } from './study/dates';
import type { Session, Workout } from './workout/types';
import type { Book, ReadLog } from './reading/types';
import type { HomeTask } from './home/types';

/** Exemplos do modo demonstração (quando o Supabase não está configurado). */
const day = (n: number) => addDays(iso(new Date()), n);

export const demoWorkouts = (): Workout[] => [
  { id: 'w1', name: 'Peito + Tríceps', weekdays: [1, 4], position: 0, exercises: [
    { name: 'Supino reto', sets: 4, reps: '8-10' }, { name: 'Supino inclinado', sets: 3, reps: '10' },
    { name: 'Crucifixo', sets: 3, reps: '12' }, { name: 'Tríceps corda', sets: 3, reps: '12' }] },
  { id: 'w2', name: 'Costas + Bíceps', weekdays: [2, 5], position: 1, exercises: [
    { name: 'Puxada frontal', sets: 4, reps: '10' }, { name: 'Remada curvada', sets: 3, reps: '10' },
    { name: 'Rosca direta', sets: 3, reps: '12' }] },
  { id: 'w3', name: 'Pernas + Ombro', weekdays: [3, 6], position: 2, exercises: [
    { name: 'Agachamento', sets: 4, reps: '8' }, { name: 'Leg press', sets: 3, reps: '12' },
    { name: 'Desenvolvimento', sets: 3, reps: '10' }] },
];

export const demoSessions = (): Session[] => {
  const w = weekStart(iso(new Date()));
  const at = (d: string, hm: string) => new Date(`${d}T${hm}:00`).toISOString();
  return [
    { id: 's1', workout_id: 'w1', workout_name: 'Peito + Tríceps', session_date: w, status: 'done', started_at: at(w, '18:30'), ended_at: at(w, '19:25'), duration_seconds: 3300, notes: '', log: [] },
    { id: 's2', workout_id: null, workout_name: 'Costas + Bíceps', session_date: addDays(w, 1), status: 'skipped', started_at: null, ended_at: null, duration_seconds: 0, notes: 'Trabalho até tarde', log: [] },
  ];
};

export const demoBooks = (): Book[] => [
  { id: 'b1', title: 'Hábitos Atômicos', author: 'James Clear', total_pages: 320, current_page: 140, status: 'reading', started_at: day(-12), finished_at: null, notes: '' },
  { id: 'b2', title: 'O Programador Pragmático', author: 'Hunt e Thomas', total_pages: 352, current_page: 0, status: 'want', started_at: null, finished_at: null, notes: '' },
  { id: 'b3', title: 'Essencialismo', author: 'Greg McKeown', total_pages: 272, current_page: 272, status: 'finished', started_at: day(-60), finished_at: day(-35), notes: '' },
];

export const demoLogs = (): ReadLog[] => [
  { id: 'l1', book_id: 'b1', log_date: day(-3), pages: 25, minutes: 35 },
  { id: 'l2', book_id: 'b1', log_date: day(-2), pages: 30, minutes: 40 },
  { id: 'l3', book_id: 'b1', log_date: day(-1), pages: 20, minutes: 30 },
];

export const demoTasks = (): HomeTask[] => [
  { id: 'c1', title: 'Lavar a louça do jantar', notes: '', category: 'Cozinha', due_date: day(0), done: true, done_at: new Date().toISOString() },
  { id: 'c2', title: 'Colocar roupa para lavar', notes: '', category: 'Limpeza', due_date: day(0), done: false, done_at: null },
  { id: 'c3', title: 'Comprar café e leite', notes: 'Mercado da esquina', category: 'Compras', due_date: day(0), done: false, done_at: null },
  { id: 'c4', title: 'Pagar conta de luz', notes: '', category: 'Contas', due_date: day(-1), done: false, done_at: null },
  { id: 'c5', title: 'Limpar o banheiro', notes: '', category: 'Limpeza', due_date: day(2), done: false, done_at: null },
];
