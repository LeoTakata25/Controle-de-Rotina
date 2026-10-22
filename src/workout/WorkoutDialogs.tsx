import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Dialog from '../ui/Dialog';
import { DOW, MON_FIRST, MUSCLES } from './types';
import type { Exercise, Session, Workout } from './types';

/* ---------- Criar / editar um modelo de treino ---------- */
type WorkoutValues = Omit<Workout, 'id' | 'position'>;

export function WorkoutDialog({ initial, onClose, onSave }: {
  initial: Workout | null;
  onClose: () => void;
  onSave: (v: WorkoutValues) => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [days, setDays] = useState<number[]>(initial?.weekdays || []);
  const [ex, setEx] = useState<Exercise[]>(initial?.exercises?.length ? initial.exercises : [{ name: '', sets: 3, reps: '10' }]);

  const addMuscle = (m: string) =>
    setName(n => {
      const parts = n.split('+').map(s => s.trim()).filter(Boolean);
      return parts.includes(m) ? n : [...parts, m].join(' + ');
    });
  const toggleDay = (d: number) => setDays(p => (p.includes(d) ? p.filter(x => x !== d) : [...p, d]));
  const patch = (i: number, v: Partial<Exercise>) => setEx(p => p.map((e, k) => (k === i ? { ...e, ...v } : e)));
  const swap = (i: number, j: number) =>
    setEx(p => {
      if (j < 0 || j >= p.length) return p;
      const c = [...p];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  function submit() {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      weekdays: [...days].sort(),
      exercises: ex
        .filter(e => e.name.trim())
        .map(e => ({ name: e.name.trim(), sets: Math.max(1, Math.round(Number(e.sets)) || 1), reps: e.reps.trim() || '10' })),
    });
  }

  return (
    <Dialog title={initial ? 'Editar treino' : 'Novo treino'} onClose={onClose} onSubmit={submit} wide>
      <label>Nome do treino
        <input required autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Peito + Tríceps" />
      </label>
      <div className="wk-pick">
        <small>Grupos musculares (toque para adicionar ao nome)</small>
        <div className="wk-chips">
          {MUSCLES.map(m => <button type="button" key={m} onClick={() => addMuscle(m)}>{m}</button>)}
        </div>
      </div>
      <div className="wk-pick">
        <small>Dias da semana em que costuma treinar</small>
        <div className="wk-chips">
          {MON_FIRST.map(d => (
            <button type="button" key={d} className={days.includes(d) ? 'on' : ''} aria-pressed={days.includes(d)} onClick={() => toggleDay(d)}>{DOW[d]}</button>
          ))}
        </div>
      </div>

      <div className="wk-pick">
        <small>Exercícios</small>
        {ex.map((e, i) => (
          <div className="wk-exrow" key={i}>
            <input aria-label="Exercício" placeholder="Exercício" value={e.name} onChange={ev => patch(i, { name: ev.target.value })} />
            <input aria-label="Séries" type="number" min={1} max={20} value={e.sets} onChange={ev => patch(i, { sets: Number(ev.target.value) })} />
            <input aria-label="Repetições" placeholder="Reps" value={e.reps} onChange={ev => patch(i, { reps: ev.target.value })} />
            <div className="wk-exbtns">
              <button type="button" aria-label="Subir" onClick={() => swap(i, i - 1)}>↑</button>
              <button type="button" aria-label="Descer" onClick={() => swap(i, i + 1)}>↓</button>
              <button type="button" aria-label="Remover exercício" onClick={() => setEx(p => p.filter((_, k) => k !== i))}><X size={12} /></button>
            </div>
          </div>
        ))}
        <button type="button" className="secondary row-action" onClick={() => setEx(p => [...p, { name: '', sets: 3, reps: '10' }])}>
          <Plus size={12} /> Adicionar exercício
        </button>
      </div>
    </Dialog>
  );
}

/* ---------- Registrar / editar um dia de academia (fui, não fui, horário, duração) ---------- */
type SessionValues = Omit<Session, 'id' | 'log'>;

const hhmm = (iso: string | null) => {
  if (!iso) return '18:00';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function SessionDialog({ initial, date, workouts, onClose, onSave }: {
  initial: Session | null;
  date: string;
  workouts: Workout[];
  onClose: () => void;
  onSave: (v: SessionValues) => void;
}) {
  const [status, setStatus] = useState<'done' | 'skipped'>(initial?.status === 'skipped' ? 'skipped' : 'done');
  const [d, setD] = useState(initial?.session_date || date);
  const [wid, setWid] = useState(initial?.workout_id || '');
  const [name, setName] = useState(initial?.workout_name || '');
  const [time, setTime] = useState(hhmm(initial?.started_at || null));
  const [minutes, setMinutes] = useState(String(initial?.duration_seconds ? Math.round(initial.duration_seconds / 60) : 60));
  const [notes, setNotes] = useState(initial?.notes || '');

  function pick(id: string) {
    setWid(id);
    const w = workouts.find(x => x.id === id);
    if (w) setName(w.name);
  }

  function submit() {
    const base = { workout_id: wid || null, workout_name: name.trim(), session_date: d, notes: notes.trim() };
    if (status === 'skipped') {
      onSave({ ...base, status: 'skipped', started_at: null, ended_at: null, duration_seconds: 0 });
      return;
    }
    const min = Math.max(1, Math.round(Number(minutes)) || 1);
    const start = new Date(`${d}T${time || '18:00'}:00`);
    onSave({
      ...base,
      status: 'done',
      started_at: start.toISOString(),
      ended_at: new Date(start.getTime() + min * 60000).toISOString(),
      duration_seconds: min * 60,
    });
  }

  return (
    <Dialog title={initial ? 'Editar registro' : 'Registrar treino'} onClose={onClose} onSubmit={submit}>
      <div className="formtwo">
        <label>Situação
          <select value={status} onChange={e => setStatus(e.target.value as 'done' | 'skipped')}>
            <option value="done">Fui treinar</option>
            <option value="skipped">Não fui</option>
          </select>
        </label>
        <label>Data
          <input type="date" required value={d} onChange={e => setD(e.target.value)} />
        </label>
      </div>
      <label>Treino
        <select value={wid} onChange={e => pick(e.target.value)}>
          <option value="">Outro / livre</option>
          {workouts.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </label>
      <label>Nome do treino
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Peito e ombro" />
      </label>
      {status === 'done' && (
        <div className="formtwo">
          <label>Horário de início
            <input type="time" value={time} onChange={e => setTime(e.target.value)} />
          </label>
          <label>Duração (minutos)
            <input type="number" min={1} max={600} value={minutes} onChange={e => setMinutes(e.target.value)} />
          </label>
        </div>
      )}
      <label>Observações
        <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder={status === 'skipped' ? 'Motivo (opcional)' : 'Como foi o treino?'} />
      </label>
    </Dialog>
  );
}
