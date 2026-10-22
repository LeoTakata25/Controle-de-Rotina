import { useState, type ReactNode } from 'react';
import { CalendarDays, GripVertical, Plus } from 'lucide-react';
import { COLUMNS } from './types';
import type { Block, Material, Status } from './types';
import { readDrag, startDrag } from './dnd';
import { fmtMin } from './dates';

type Props = {
  materials: Material[];
  blocks: Block[];
  renderTimer: (id: string, name: string) => ReactNode;
  onNew: (status: Status) => void;
  onMove: (id: string, status: Status) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
};

export default function StudyBoard({ materials, blocks, renderTimer, onNew, onMove, onEdit, onRemove }: Props) {
  const [over, setOver] = useState<Status | null>(null);

  return (
    <div className="kb">
      {COLUMNS.map(c => {
        const items = materials.filter(m => m.status === c.key);
        return (
          <section
            key={c.key}
            className={`kb-col kb-${c.key}${over === c.key ? ' over' : ''}`}
            onDragOver={e => { e.preventDefault(); setOver(c.key); }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null); }}
            onDrop={e => {
              e.preventDefault();
              setOver(null);
              const d = readDrag(e);
              if (d?.kind === 'material') onMove(d.id, c.key);
            }}
          >
            <div className="kb-head">
              <div>
                <h3>{c.label} <span>{items.length}</span></h3>
                <small>{c.hint}</small>
              </div>
              <button className="kb-add" title={`Adicionar em ${c.label}`} aria-label={`Adicionar em ${c.label}`} onClick={() => onNew(c.key)}>
                <Plus size={14} />
              </button>
            </div>

            <div className="kb-list">
              {items.map(m => {
                const mine = blocks.filter(b => b.materialId === m.id);
                const planned = mine.reduce((n, b) => n + b.minutes, 0);
                const days = new Set(mine.map(b => b.date)).size;
                const sub = [m.track, m.module, m.topic].filter(Boolean).join(' · ');
                return (
                  <article key={m.id} className="kb-card" draggable onDragStart={e => startDrag(e, { kind: 'material', id: m.id })}>
                    <div className="kb-top">
                      <GripVertical size={13} className="grip" />
                      <strong>{m.title}</strong>
                      <span className="tag">{m.type}</span>
                    </div>
                    {sub && <small>{sub}</small>}
                    {m.url && <a href={m.url} target="_blank" rel="noreferrer">Abrir material ↗</a>}

                    {(planned > 0 || m.minutes > 0) && (
                      <div className="kb-plan">
                        <CalendarDays size={12} />
                        <span>
                          {planned > 0 ? `${days} dia${days > 1 ? 's' : ''} · ${fmtMin(planned)}` : 'Sem dias agendados'}
                          {m.minutes > 0 && ` de ${fmtMin(m.minutes)}`}
                        </span>
                      </div>
                    )}
                    {m.minutes > 0 && (
                      <div className="bar"><i style={{ width: `${Math.min(100, (planned / m.minutes) * 100)}%` }} /></div>
                    )}

                    {renderTimer(m.id, m.title)}

                    <div className="kb-actions">
                      <select value={m.status} aria-label="Mover para" onChange={e => onMove(m.id, e.target.value as Status)}>
                        {COLUMNS.map(x => <option key={x.key} value={x.key}>{x.label}</option>)}
                      </select>
                      <button className="secondary row-action" onClick={() => onEdit(m.id)}>Editar</button>
                      <button className="secondary row-action danger" onClick={() => onRemove(m.id)}>Excluir</button>
                    </div>
                  </article>
                );
              })}
              {!items.length && <div className="kb-empty">Arraste um card para cá</div>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
