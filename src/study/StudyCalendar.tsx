import { useMemo, useState, type DragEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Minus, Plus, X } from 'lucide-react';
import type { Block, Material, NewBlock, Status } from './types';
import { readDrag, startDrag } from './dnd';
import { addDays, fmtMin, fmtShort, iso, parse, weekStart } from './dates';

type Props = {
  /** todos os materiais (para achar o nome de cada bloco) */
  materials: Material[];
  /** materiais que podem ser agendados (já filtrados) */
  tray: Material[];
  blocks: Block[];
  onAdd: (rows: NewBlock[]) => void;
  onPatch: (id: string, patch: { date?: string; minutes?: number }) => void;
  onRemove: (id: string) => void;
};

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const STEP = 15;
const MIN = 15;
const MAX = 600;
const DEFAULT = 60;
const RANK: Record<Status, number> = { doing: 0, sprint: 1, backlog: 2, done: 3 };

export default function StudyCalendar({ materials, tray, blocks, onAdd, onPatch, onRemove }: Props) {
  const today = iso(new Date());
  const [ws, setWs] = useState(() => weekStart(today));
  const [over, setOver] = useState<string | null>(null);
  const [plan, setPlan] = useState<{ materialId: string; date: string } | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const byId = useMemo(() => new Map(materials.map(m => [m.id, m])), [materials]);
  const weekTotal = blocks.filter(b => b.date >= days[0] && b.date <= days[6]).reduce((n, b) => n + b.minutes, 0);

  // "Dia 2/3": posição de cada bloco dentro do plano do seu material
  const seq = useMemo(() => {
    const groups = new Map<string, Block[]>();
    blocks.forEach(b => groups.set(b.materialId, [...(groups.get(b.materialId) || []), b]));
    const out = new Map<string, { i: number; n: number }>();
    groups.forEach(list => {
      [...list].sort((a, b) => a.date.localeCompare(b.date)).forEach((b, i) => out.set(b.id, { i: i + 1, n: list.length }));
    });
    return out;
  }, [blocks]);

  const sortedTray = useMemo(() => [...tray].sort((a, b) => RANK[a.status] - RANK[b.status]), [tray]);
  const defaultDate = today >= days[0] && today <= days[6] ? today : days[0];

  function drop(e: DragEvent, date: string) {
    e.preventDefault();
    setOver(null);
    const d = readDrag(e);
    if (!d) return;
    if (d.kind === 'material') onAdd([{ materialId: d.id, date, minutes: DEFAULT }]);
    else onPatch(d.id, { date });
  }

  return (
    <div className="cal">
      <div className="cal-bar">
        <div className="cal-nav">
          <button className="secondary" aria-label="Semana anterior" onClick={() => setWs(addDays(ws, -7))}><ChevronLeft size={14} /></button>
          <button className="secondary" onClick={() => setWs(weekStart(today))}>Hoje</button>
          <button className="secondary" aria-label="Próxima semana" onClick={() => setWs(addDays(ws, 7))}><ChevronRight size={14} /></button>
          <strong>{fmtShort(days[0])} – {fmtShort(days[6])}</strong>
        </div>
        <span className="cal-total">{weekTotal ? `${fmtMin(weekTotal)} planejadas na semana` : 'Nada planejado nesta semana'}</span>
      </div>

      <div className="cal-layout">
        <aside className="cal-tray">
          <h3>Para agendar</h3>
          <p>Arraste para um dia ou use “Planejar” para espalhar em vários dias.</p>
          {sortedTray.map(m => {
            const planned = blocks.filter(b => b.materialId === m.id).reduce((n, b) => n + b.minutes, 0);
            return (
              <div key={m.id} className={`cal-chip st-${m.status}`} draggable onDragStart={e => startDrag(e, { kind: 'material', id: m.id })}>
                <strong>{m.title}</strong>
                <small>{[m.track, m.module].filter(Boolean).join(' · ')}</small>
                {m.minutes > 0 && (
                  <>
                    <div className="bar"><i style={{ width: `${Math.min(100, (planned / m.minutes) * 100)}%` }} /></div>
                    <small>{fmtMin(planned)} de {fmtMin(m.minutes)} planejadas</small>
                  </>
                )}
                <button className="secondary row-action" onClick={() => setPlan({ materialId: m.id, date: defaultDate })}>
                  <CalendarDays size={12} /> Planejar
                </button>
              </div>
            );
          })}
          {!sortedTray.length && <div className="kb-empty">Nenhum material pendente. Adicione no quadro.</div>}
        </aside>

        <div className="cal-week">
          {days.map((d, i) => {
            const list = blocks.filter(b => b.date === d);
            const total = list.reduce((n, b) => n + b.minutes, 0);
            return (
              <div
                key={d}
                className={`cal-day${d === today ? ' today' : ''}${over === d ? ' over' : ''}`}
                onDragOver={e => { e.preventDefault(); setOver(d); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null); }}
                onDrop={e => drop(e, d)}
              >
                <div className="cal-dayhead">
                  <span>{WEEKDAYS[i]}</span>
                  <b>{parse(d).getDate()}</b>
                </div>
                {list.map(b => {
                  const m = byId.get(b.materialId);
                  if (!m) return null;
                  const s = seq.get(b.id);
                  return (
                    <div key={b.id} className={`cal-block st-${m.status}`} draggable onDragStart={e => startDrag(e, { kind: 'block', id: b.id })}>
                      <strong title={m.title}>{m.title}</strong>
                      <small>{m.track}{s && s.n > 1 ? ` · dia ${s.i} de ${s.n}` : ''}</small>
                      <div className="cal-ctrl">
                        <button aria-label="Menos 15 minutos" onClick={() => onPatch(b.id, { minutes: Math.max(MIN, b.minutes - STEP) })}><Minus size={11} /></button>
                        <span>{fmtMin(b.minutes)}</span>
                        <button aria-label="Mais 15 minutos" onClick={() => onPatch(b.id, { minutes: Math.min(MAX, b.minutes + STEP) })}><Plus size={11} /></button>
                        <button className="ext" title="Repetir no dia seguinte" onClick={() => onAdd([{ materialId: b.materialId, date: addDays(b.date, 1), minutes: b.minutes }])}>+1 dia</button>
                        <button aria-label="Remover do calendário" onClick={() => onRemove(b.id)}><X size={11} /></button>
                      </div>
                    </div>
                  );
                })}
                {!list.length && <div className="cal-drop">Solte aqui</div>}
                {total > 0 && <div className="cal-daytotal">{fmtMin(total)}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {plan && (
        <PlanDialog
          tray={sortedTray}
          materials={materials}
          initial={plan}
          onClose={() => setPlan(null)}
          onSave={rows => { onAdd(rows); setPlan(null); }}
        />
      )}
    </div>
  );
}

function PlanDialog({ tray, materials, initial, onClose, onSave }: {
  tray: Material[];
  materials: Material[];
  initial: { materialId: string; date: string };
  onClose: () => void;
  onSave: (rows: NewBlock[]) => void;
}) {
  const [materialId, setMaterialId] = useState(initial.materialId);
  const [start, setStart] = useState(initial.date);
  const [minutes, setMinutes] = useState(60);
  const [count, setCount] = useState(3);
  const [skip, setSkip] = useState(false);
  const m = materials.find(x => x.id === materialId);

  const rows = useMemo(() => {
    const out: NewBlock[] = [];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return out;
    let d = start;
    for (let guard = 0; out.length < count && guard < 400; guard++) {
      const wd = parse(d).getDay();
      if (!(skip && (wd === 0 || wd === 6))) out.push({ materialId, date: d, minutes });
      d = addDays(d, 1);
    }
    return out;
  }, [materialId, start, minutes, count, skip]);

  const last = rows[rows.length - 1];

  return (
    <div className="backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="dialog" onSubmit={e => { e.preventDefault(); if (rows.length) onSave(rows); }}>
        <div className="dialoghead">
          <h2>Planejar em vários dias</h2>
          <button type="button" onClick={onClose} aria-label="Fechar"><X size={17} /></button>
        </div>

        <label>Material
          <select value={materialId} onChange={e => setMaterialId(e.target.value)}>
            {tray.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}
          </select>
        </label>
        <div className="formtwo">
          <label>Começa em
            <input type="date" required value={start} onChange={e => setStart(e.target.value)} />
          </label>
          <label>Tempo por dia
            <select value={minutes} onChange={e => setMinutes(Number(e.target.value))}>
              {[30, 45, 60, 90, 120, 180, 240].map(x => <option key={x} value={x}>{fmtMin(x)}</option>)}
            </select>
          </label>
        </div>
        <div className="formtwo">
          <label>Quantos dias
            <input type="number" min={1} max={60} value={count} onChange={e => setCount(Math.max(1, Math.min(60, Number(e.target.value) || 1)))} />
          </label>
          <label className="check-line">
            <input type="checkbox" checked={skip} onChange={e => setSkip(e.target.checked)} />
            Pular sábado e domingo
          </label>
        </div>

        <p className="muted">
          {rows.length
            ? `${rows.length} dia${rows.length > 1 ? 's' : ''} · ${fmtMin(rows.length * minutes)}${m && m.minutes > 0 ? ` de ${fmtMin(m.minutes)} estimadas` : ''} · termina em ${fmtShort(last.date)}`
            : 'Escolha uma data de início.'}
        </p>
        {m && m.minutes > 0 && (
          <button type="button" className="link" onClick={() => setCount(Math.max(1, Math.min(60, Math.ceil(m.minutes / minutes))))}>
            Ajustar dias para cobrir as {fmtMin(m.minutes)} estimadas
          </button>
        )}

        <div className="dialogactions">
          <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
          <button className="primary" disabled={!rows.length}>Agendar</button>
        </div>
      </form>
    </div>
  );
}
