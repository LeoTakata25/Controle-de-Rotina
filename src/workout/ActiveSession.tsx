import { useEffect, useRef, useState } from 'react';
import { Clock3, Plus, X } from 'lucide-react';
import type { Coll } from '../data/useCollection';
import { clock, useNow } from '../useNow';
import type { ExLog, Session } from './types';

/** Treino em andamento: cronômetro, séries (repetições x carga) e observações. Salva sozinho enquanto você treina. */
export default function ActiveSession({ s, sessions }: { s: Session; sessions: Coll<Session> }) {
  const now = useNow();
  const [log, setLog] = useState<ExLog[]>(s.log || []);
  const [notes, setNotes] = useState(s.notes || '');
  const [newEx, setNewEx] = useState('');
  const first = useRef(true);

  // grava as séries e as observações poucos instantes depois da última alteração
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => { sessions.update(s.id, { log, notes }); }, 800);
    return () => clearTimeout(t);
  }, [log, notes]);

  const started = s.started_at ? new Date(s.started_at).getTime() : now;
  const seconds = Math.max(0, Math.floor((now - started) / 1000));
  const setsDone = log.reduce((n, e) => n + e.sets.filter(x => x.done).length, 0);
  const setsAll = log.reduce((n, e) => n + e.sets.length, 0);

  const patchSet = (i: number, j: number, v: Partial<ExLog['sets'][number]>) =>
    setLog(l => l.map((e, a) => (a !== i ? e : { ...e, sets: e.sets.map((x, b) => (b === j ? { ...x, ...v } : x)) })));

  async function finish() {
    await sessions.update(s.id, { status: 'done', ended_at: new Date().toISOString(), duration_seconds: seconds, log, notes });
  }
  async function cancel() {
    if (window.confirm('Cancelar este treino? O que foi anotado nele será descartado.')) await sessions.remove(s.id);
  }
  function addExercise() {
    const n = newEx.trim();
    if (!n) return;
    setLog(l => [...l, { name: n, sets: [{ reps: '', kg: '', done: false }] }]);
    setNewEx('');
  }

  return (
    <div className="wk-active">
      <div className="wk-clockrow">
        <div>
          <small>Treinando agora</small>
          <h3>{s.workout_name || 'Treino livre'}</h3>
        </div>
        <div className="wk-clock" aria-live="off"><Clock3 size={18} />{clock(seconds)}</div>
      </div>
      {setsAll > 0 && (
        <div className="wk-prog">
          <div className="bar"><i style={{ width: `${(setsDone / setsAll) * 100}%` }} /></div>
          <small>{setsDone} de {setsAll} séries concluídas</small>
        </div>
      )}

      {log.map((ex, i) => (
        <div className="wk-ex" key={i}>
          <div className="wk-exhead">
            <strong>{ex.name}</strong>
            <small>{ex.sets.filter(x => x.done).length}/{ex.sets.length}</small>
            <button type="button" aria-label={`Remover ${ex.name}`} onClick={() => setLog(l => l.filter((_, k) => k !== i))}><X size={12} /></button>
          </div>
          {ex.sets.map((st, j) => (
            <div className="wk-set" key={j}>
              <span>{j + 1}</span>
              <input aria-label={`Repetições da série ${j + 1}`} inputMode="numeric" placeholder="reps" value={st.reps} onChange={e => patchSet(i, j, { reps: e.target.value })} />
              <input aria-label={`Carga da série ${j + 1}`} inputMode="decimal" placeholder="kg" value={st.kg} onChange={e => patchSet(i, j, { kg: e.target.value })} />
              <button type="button" className={'check ' + (st.done ? 'checked' : '')} aria-label={`Série ${j + 1} concluída`} aria-pressed={st.done} onClick={() => patchSet(i, j, { done: !st.done })}>{st.done && '✓'}</button>
              <button type="button" className="wk-x" aria-label="Remover série" onClick={() => setLog(l => l.map((e, a) => (a === i ? { ...e, sets: e.sets.filter((_, b) => b !== j) } : e)))}><X size={11} /></button>
            </div>
          ))}
          <button type="button" className="link" onClick={() => setLog(l => l.map((e, a) => (a === i ? { ...e, sets: [...e.sets, { reps: e.sets[e.sets.length - 1]?.reps || '', kg: e.sets[e.sets.length - 1]?.kg || '', done: false }] } : e)))}>+ série</button>
        </div>
      ))}

      <div className="wk-addex">
        <input placeholder="Adicionar exercício ao treino de hoje" value={newEx} onChange={e => setNewEx(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addExercise(); } }} />
        <button type="button" className="secondary row-action" onClick={addExercise}><Plus size={12} /> Adicionar</button>
      </div>
      <textarea className="wk-notes" rows={2} placeholder="Observações do treino (opcional)" value={notes} onChange={e => setNotes(e.target.value)} />

      <div className="wk-finish">
        <button type="button" className="secondary danger row-action" onClick={cancel}>Cancelar treino</button>
        <button type="button" className="primary" onClick={finish}>Finalizar treino</button>
      </div>
    </div>
  );
}
