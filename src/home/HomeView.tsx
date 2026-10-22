import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Coll } from '../data/useCollection';
import { addDays, iso, parse } from '../study/dates';
import HomeDialog from './HomeDialog';
import { HOME_CATEGORIES } from './types';
import type { HomeTask } from './types';

const label = (d: string, today: string) =>
  d === today ? 'Hoje' : d === addDays(today, 1) ? 'Amanhã' : d === addDays(today, -1) ? 'Ontem'
    : parse(d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
const short = (d: string) => parse(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');

export default function HomeView({ tasks }: { tasks: Coll<HomeTask> }) {
  const today = iso(new Date());
  const [day, setDay] = useState(today);
  const [dlg, setDlg] = useState<HomeTask | 'new' | null>(null);
  const [quick, setQuick] = useState('');
  const [cat, setCat] = useState('Casa');
  const [showDone, setShowDone] = useState(false);

  const all = tasks.items;
  const ofDay = all.filter(t => t.due_date === day);
  const todo = ofDay.filter(t => !t.done);
  const done = ofDay.filter(t => t.done);
  const overdue = day === today ? all.filter(t => !t.done && t.due_date < today).sort((a, b) => a.due_date.localeCompare(b.due_date)) : [];
  const upcoming = day === today ? all.filter(t => !t.done && t.due_date > today).sort((a, b) => a.due_date.localeCompare(b.due_date)) : [];
  const before = day === today ? all.filter(t => t.done && t.due_date < today).sort((a, b) => (b.done_at || '').localeCompare(a.done_at || '')).slice(0, 10) : [];
  const pct = ofDay.length ? Math.round((done.length / ofDay.length) * 100) : 0;

  async function toggle(t: HomeTask) {
    await tasks.update(t.id, { done: !t.done, done_at: t.done ? null : new Date().toISOString() });
  }
  async function remove(t: HomeTask) {
    if (window.confirm('Excluir este afazer? Esta ação não pode ser desfeita.')) await tasks.remove(t.id);
  }
  async function quickAdd() {
    const title = quick.trim();
    if (!title) return;
    await tasks.add({ title, notes: '', category: cat, due_date: day, done: false, done_at: null });
    setQuick('');
  }
  async function save(v: Pick<HomeTask, 'title' | 'notes' | 'category' | 'due_date'>) {
    if (dlg && dlg !== 'new') await tasks.update(dlg.id, v);
    else await tasks.add({ ...v, done: false, done_at: null });
    setDlg(null);
  }

  const row = (t: HomeTask, late = false) => (
    <div className={'row hm-row' + (t.done ? ' is-done' : '')} key={t.id}>
      <button className={'check ' + (t.done ? 'checked' : '')} aria-label={t.done ? 'Marcar como pendente' : 'Marcar como feito'} aria-pressed={t.done} onClick={() => toggle(t)}>{t.done && <Check size={13} />}</button>
      <div className="rowcopy">
        <strong>{t.title}</strong>
        <small>
          {t.category}
          {late || t.due_date !== day ? ` · ${short(t.due_date)}` : ''}
          {t.done && t.done_at ? ` · feito às ${new Date(t.done_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
          {t.notes ? ` · ${t.notes}` : ''}
        </small>
      </div>
      {!t.done && t.due_date !== today && <button className="secondary row-action" onClick={() => tasks.update(t.id, { due_date: today })}>Para hoje</button>}
      <button className="secondary row-action" onClick={() => setDlg(t)}>Editar</button>
      <button className="secondary row-action danger" onClick={() => remove(t)}>Excluir</button>
    </div>
  );

  return (
    <>
      <div className="stats">
        <div className="stat"><span>{label(day, today)}</span><strong>{done.length}/{ofDay.length}</strong><small>Afazeres concluídos</small></div>
        <div className="stat"><span>A fazer</span><strong>{todo.length}</strong><small>Ainda pendentes neste dia</small></div>
        <div className="stat"><span>Atrasados</span><strong>{all.filter(t => !t.done && t.due_date < today).length}</strong><small>De dias anteriores</small></div>
        <div className="stat"><span>Próximos dias</span><strong>{all.filter(t => !t.done && t.due_date > today).length}</strong><small>Já agendados</small></div>
      </div>

      <section className="panel">
        <div className="panelhead">
          <div><h2>{label(day, today)[0].toUpperCase() + label(day, today).slice(1)}</h2><p>{parse(day).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div>
          <div className="wk-weeknav">
            <button className="secondary row-action" aria-label="Dia anterior" onClick={() => setDay(addDays(day, -1))}><ChevronLeft size={13} /></button>
            <button className="secondary row-action" onClick={() => setDay(today)}>Hoje</button>
            <button className="secondary row-action" aria-label="Próximo dia" onClick={() => setDay(addDays(day, 1))}><ChevronRight size={13} /></button>
          </div>
        </div>
        {ofDay.length > 0 && <div className="hm-prog"><div className="bar"><i style={{ width: `${pct}%` }} /></div><small>{pct}% do dia concluído</small></div>}

        <form className="hm-quick" onSubmit={e => { e.preventDefault(); void quickAdd(); }}>
          <input aria-label="Novo afazer" placeholder="Anotar um afazer e apertar Enter…" value={quick} onChange={e => setQuick(e.target.value)} />
          <select aria-label="Categoria" value={cat} onChange={e => setCat(e.target.value)}>{HOME_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
          <button className="primary"><Plus size={14} /> Adicionar</button>
          <button type="button" className="secondary" onClick={() => setDlg('new')}>Detalhado…</button>
        </form>

        {overdue.length > 0 && (
          <>
            <div className="hm-sec late">Atrasados · {overdue.length}</div>
            {overdue.map(t => row(t, true))}
          </>
        )}

        <div className="hm-sec">A fazer · {todo.length}</div>
        {todo.map(t => row(t))}
        {!todo.length && <div className="empty">{ofDay.length ? 'Tudo certo por aqui. Nada pendente neste dia.' : 'Nenhum afazer anotado para este dia.'}</div>}

        {done.length > 0 && (
          <>
            <div className="hm-sec ok">Feito · {done.length}</div>
            {done.map(t => row(t))}
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <div className="hm-sec">Próximos dias · {upcoming.length}</div>
            {upcoming.map(t => row(t))}
          </>
        )}

        {before.length > 0 && (
          <>
            <button className="secondary wide hm-more" onClick={() => setShowDone(v => !v)}>{showDone ? 'Ocultar feitos de dias anteriores' : `Ver feitos de dias anteriores (${before.length})`}</button>
            {showDone && before.map(t => row(t, true))}
          </>
        )}
      </section>

      {dlg && <HomeDialog initial={dlg === 'new' ? null : dlg} date={day} onClose={() => setDlg(null)} onSave={save} />}
    </>
  );
}
