import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Coll } from '../data/useCollection';
import { addDays, fmtMin, iso, parse, weekStart } from '../study/dates';
import ActiveSession from './ActiveSession';
import { SessionDialog, WorkoutDialog } from './WorkoutDialogs';
import { DOW, MON_FIRST } from './types';
import type { ExLog, Session, Workout } from './types';

type Props = { workouts: Coll<Workout>; sessions: Coll<Session> };

const longDate = (d: string) => parse(d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
const shortDate = (d: string) => parse(d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace(/\./g, '');
const minutesOf = (s: Session) => Math.round(s.duration_seconds / 60);

export default function WorkoutView({ workouts, sessions }: Props) {
  const today = iso(new Date());
  const todayDow = new Date().getDay();
  const [weekOf, setWeekOf] = useState(() => weekStart(today));
  const [wDialog, setWDialog] = useState<Workout | 'new' | null>(null);
  const [sDialog, setSDialog] = useState<{ session: Session | null; date: string } | null>(null);
  const [pick, setPick] = useState('');
  const [freeName, setFreeName] = useState('');
  const [showAll, setShowAll] = useState(false);

  const list = useMemo(() => [...workouts.items].sort((a, b) => a.position - b.position), [workouts.items]);
  const planned = list.filter(w => w.weekdays.includes(todayDow));
  const active = sessions.items.find(s => s.status === 'active') || null;
  const todays = sessions.items.filter(s => s.session_date === today && s.status !== 'active');
  const selected = list.some(w => w.id === pick) || pick === 'free' ? pick : planned[0]?.id || list[0]?.id || 'free';

  const history = useMemo(
    () => sessions.items.filter(s => s.status !== 'active').sort((a, b) => (b.session_date + (b.started_at || '')).localeCompare(a.session_date + (a.started_at || ''))),
    [sessions.items],
  );

  // carga usada na última vez em que o exercício foi feito (para já vir preenchida)
  function lastKg(exercise: string, setIndex: number) {
    for (const s of history) {
      if (s.status !== 'done') continue;
      const e = (s.log || []).find(x => x.name === exercise);
      const kg = e?.sets[setIndex]?.kg || e?.sets[e.sets.length - 1]?.kg;
      if (kg) return kg;
    }
    return '';
  }

  async function start() {
    const w = list.find(x => x.id === selected);
    const log: ExLog[] = w
      ? w.exercises.map(e => ({
          name: e.name,
          sets: Array.from({ length: Math.max(1, e.sets) }, (_, i) => ({ reps: e.reps, kg: lastKg(e.name, i), done: false })),
        }))
      : [];
    await sessions.add({
      workout_id: w?.id || null,
      workout_name: w ? w.name : freeName.trim() || 'Treino livre',
      session_date: today,
      status: 'active',
      started_at: new Date().toISOString(),
      ended_at: null,
      duration_seconds: 0,
      notes: '',
      log,
    });
    setFreeName('');
  }

  async function skipToday() {
    await sessions.add({
      workout_id: null,
      workout_name: planned[0]?.name || '',
      session_date: today,
      status: 'skipped',
      started_at: null,
      ended_at: null,
      duration_seconds: 0,
      notes: '',
      log: [],
    });
  }

  async function saveWorkout(v: Omit<Workout, 'id' | 'position'>) {
    if (wDialog && wDialog !== 'new') await workouts.update(wDialog.id, v);
    else await workouts.add({ ...v, position: list.length });
    setWDialog(null);
  }

  async function saveSession(v: Omit<Session, 'id' | 'log'>) {
    const cur = sDialog?.session;
    if (cur) await sessions.update(cur.id, v);
    else await sessions.add({ ...v, log: [] });
    setSDialog(null);
  }

  async function removeSession(s: Session) {
    if (window.confirm('Excluir este registro? Esta ação não pode ser desfeita.')) await sessions.remove(s.id);
  }
  async function removeWorkout(w: Workout) {
    if (window.confirm(`Excluir o treino "${w.name}"? Os registros já feitos continuam no histórico.`)) await workouts.remove(w.id);
  }

  // ----- números do mês e da semana -----
  const month = today.slice(0, 7);
  const monthDone = sessions.items.filter(s => s.status === 'done' && s.session_date.startsWith(month));
  const monthSkipped = sessions.items.filter(s => s.status === 'skipped' && s.session_date.startsWith(month)).length;
  const timed = monthDone.filter(s => s.duration_seconds > 0);
  const totalMin = timed.reduce((n, s) => n + minutesOf(s), 0);
  const avgMin = timed.length ? Math.round(totalMin / timed.length) : 0;
  const thisWeek = weekStart(today);
  const weekDone = sessions.items.filter(s => s.status === 'done' && s.session_date >= thisWeek && s.session_date <= addDays(thisWeek, 6)).length;
  const plannedDays = new Set(list.flatMap(w => w.weekdays)).size;

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekOf, i));
  const shownHistory = showAll ? history : history.slice(0, 8);

  return (
    <>
      <div className="stats">
        <div className="stat"><span>Treinos no mês</span><strong>{monthDone.length}</strong><small>{monthSkipped} falta{monthSkipped === 1 ? '' : 's'} registrada{monthSkipped === 1 ? '' : 's'}</small></div>
        <div className="stat"><span>Esta semana</span><strong>{weekDone}</strong><small>{plannedDays ? `de ${plannedDays} dia${plannedDays > 1 ? 's' : ''} planejado${plannedDays > 1 ? 's' : ''}` : 'Planeje seus dias abaixo'}</small></div>
        <div className="stat"><span>Tempo médio</span><strong>{avgMin ? fmtMin(avgMin) : '—'}</strong><small>Por treino no mês</small></div>
        <div className="stat"><span>Tempo no mês</span><strong>{totalMin ? fmtMin(totalMin) : '—'}</strong><small>Somando os treinos</small></div>
      </div>

      <section className="panel wk-today">
        <div className="panelhead">
          <div>
            <h2>Treino de hoje</h2>
            <p>{longDate(today)}{planned.length ? ` · Planejado: ${planned.map(w => w.name).join(', ')}` : ''}</p>
          </div>
        </div>
        <div className="wk-body">
          {active ? (
            <ActiveSession key={active.id} s={active} sessions={sessions} />
          ) : (
            <>
              {todays.map(s => (
                <div className={'wk-result ' + s.status} key={s.id}>
                  <span className="wk-dot">{s.status === 'done' ? '✓' : '✕'}</span>
                  <div>
                    <strong>{s.status === 'done' ? `Treino feito${s.workout_name ? ': ' + s.workout_name : ''}` : `Não fui hoje${s.workout_name ? ' (' + s.workout_name + ')' : ''}`}</strong>
                    <small>{s.status === 'done' ? `${s.started_at ? new Date(s.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' · ' : ''}${minutesOf(s)} min` : s.notes || 'Sem motivo informado'}</small>
                  </div>
                  <button className="secondary row-action" onClick={() => setSDialog({ session: s, date: today })}>Editar</button>
                </div>
              ))}
              <div className="wk-start">
                <label>
                  {todays.some(s => s.status === 'done') ? 'Fazer outro treino' : 'Qual treino vai fazer?'}
                  <select value={selected} onChange={e => setPick(e.target.value)}>
                    {list.map(w => <option key={w.id} value={w.id}>{w.name}{w.weekdays.includes(todayDow) ? ' (hoje)' : ''}</option>)}
                    <option value="free">Treino livre</option>
                  </select>
                </label>
                {selected === 'free' && (
                  <label>Nome do treino
                    <input value={freeName} onChange={e => setFreeName(e.target.value)} placeholder="Ex.: Peito e ombro" />
                  </label>
                )}
                <div className="wk-startbtns">
                  <button className="primary" onClick={start}>Iniciar treino</button>
                  {!todays.length && <button className="secondary" onClick={skipToday}>Não fui hoje</button>}
                </div>
              </div>
              {!list.length && <p className="muted">Dica: crie seus treinos em “Meus treinos” para já vir com os exercícios e a carga da última vez.</p>}
            </>
          )}
        </div>
      </section>

      <div className="grid wk-grid">
        <section className="panel">
          <div className="panelhead">
            <div><h2>Semana</h2><p>Toque em um dia para registrar ou corrigir</p></div>
            <div className="wk-weeknav">
              <button className="secondary row-action" aria-label="Semana anterior" onClick={() => setWeekOf(addDays(weekOf, -7))}><ChevronLeft size={13} /></button>
              <button className="secondary row-action" onClick={() => setWeekOf(weekStart(today))}>Hoje</button>
              <button className="secondary row-action" aria-label="Próxima semana" onClick={() => setWeekOf(addDays(weekOf, 7))}><ChevronRight size={13} /></button>
            </div>
          </div>
          <div className="wk-week">
            {days.map((d, i) => {
              const dow = MON_FIRST[i];
              const day = sessions.items.filter(s => s.session_date === d && s.status !== 'active');
              const done = day.find(s => s.status === 'done');
              const skipped = day.find(s => s.status === 'skipped');
              const plan = list.filter(w => w.weekdays.includes(dow));
              return (
                <button
                  key={d}
                  className={'wk-day' + (d === today ? ' today' : '') + (done ? ' done' : skipped ? ' skipped' : '')}
                  onClick={() => setSDialog({ session: done || skipped || null, date: d })}
                  aria-label={`${DOW[dow]} ${parse(d).getDate()}: ${done ? 'treino feito' : skipped ? 'não fui' : 'sem registro'}`}
                >
                  <span>{DOW[dow]}</span>
                  <b>{parse(d).getDate()}</b>
                  <i>{done ? '✓' : skipped ? '✕' : d < today ? '–' : ''}</i>
                  <small>{done ? `${done.workout_name || 'Treino'}${done.duration_seconds ? ' · ' + fmtMin(minutesOf(done)) : ''}` : plan.map(w => w.name).join(', ')}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel">
          <div className="panelhead">
            <div><h2>Meus treinos</h2><p>Monte seus treinos e os dias da semana</p></div>
            <button className="secondary row-action" onClick={() => setWDialog('new')}><Plus size={12} /> Novo treino</button>
          </div>
          {list.map(w => (
            <div className="row" key={w.id}>
              <div className="rowcopy">
                <strong>{w.name}</strong>
                <small>{w.weekdays.length ? MON_FIRST.filter(d => w.weekdays.includes(d)).map(d => DOW[d]).join(' · ') : 'Sem dia fixo'} · {w.exercises.length} exercício{w.exercises.length === 1 ? '' : 's'}</small>
              </div>
              <button className="secondary row-action" onClick={() => setWDialog(w)}>Editar</button>
              <button className="secondary row-action danger" onClick={() => removeWorkout(w)}>Excluir</button>
            </div>
          ))}
          {!list.length && <div className="empty">Nenhum treino cadastrado ainda.</div>}
        </section>
      </div>

      <section className="panel">
        <div className="panelhead">
          <div><h2>Histórico</h2><p>Todos os dias que você foi (ou não) à academia</p></div>
          <button className="secondary row-action" onClick={() => setSDialog({ session: null, date: today })}><Plus size={12} /> Registrar treino</button>
        </div>
        {shownHistory.map(s => (
          <div className="row" key={s.id}>
            <span className={'wk-dot ' + s.status}>{s.status === 'done' ? '✓' : '✕'}</span>
            <div className="rowcopy">
              <strong>{s.workout_name || (s.status === 'done' ? 'Treino' : 'Não fui')}</strong>
              <small>
                {shortDate(s.session_date)}
                {s.status === 'done' ? ` · ${s.started_at ? new Date(s.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' · ' : ''}${fmtMin(minutesOf(s))}` : ' · não fui'}
                {s.log?.length ? ` · ${s.log.length} exercício${s.log.length > 1 ? 's' : ''}` : ''}
                {s.notes ? ` · ${s.notes}` : ''}
              </small>
            </div>
            <button className="secondary row-action" onClick={() => setSDialog({ session: s, date: s.session_date })}>Editar</button>
            <button className="secondary row-action danger" onClick={() => removeSession(s)}>Excluir</button>
          </div>
        ))}
        {!history.length && <div className="empty">Ainda não há registros de treino.</div>}
        {history.length > 8 && (
          <button className="secondary wide" onClick={() => setShowAll(v => !v)}>{showAll ? 'Mostrar menos' : `Mostrar todos (${history.length})`}</button>
        )}
      </section>

      {wDialog && <WorkoutDialog initial={wDialog === 'new' ? null : wDialog} onClose={() => setWDialog(null)} onSave={saveWorkout} />}
      {sDialog && <SessionDialog initial={sDialog.session} date={sDialog.date} workouts={list} onClose={() => setSDialog(null)} onSave={saveSession} />}
    </>
  );
}
