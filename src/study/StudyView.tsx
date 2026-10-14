import { useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import StudyBoard from './StudyBoard';
import StudyCalendar from './StudyCalendar';
import type { Block, Material, NewBlock, Status, Track } from './types';

type Props = {
  tracks: Track[];
  materials: Material[];
  /** materiais depois de aplicar busca, tipo e trilha */
  shown: Material[];
  blocks: Block[];
  track: string; setTrack: (v: string) => void;
  query: string; setQuery: (v: string) => void;
  filter: string; setFilter: (v: string) => void;
  totalMinutes: number;
  renderTimer: (id: string, name: string) => ReactNode;
  onNewTrack: () => void;
  onRenameTrack: (id: string, name: string) => void;
  onRemoveTrack: (id: string) => void;
  onNewMaterial: (status: Status) => void;
  onRenameMaterial: (id: string, name: string) => void;
  onRemoveMaterial: (id: string) => void;
  onMove: (id: string, status: Status) => void;
  onAddBlocks: (rows: NewBlock[]) => void;
  onPatchBlock: (id: string, patch: { date?: string; minutes?: number }) => void;
  onRemoveBlock: (id: string) => void;
};

export default function StudyView(p: Props) {
  const [view, setView] = useState<'board' | 'calendar'>('board');
  const count = (s: Status) => p.materials.filter(m => m.status === s).length;

  return (
    <>
      <div className="stats">
        <div className="stat"><span>No sprint</span><strong>{count('sprint')}</strong><small>Materiais com foco na semana</small></div>
        <div className="stat"><span>Em andamento</span><strong>{count('doing')}</strong><small>Estudando agora</small></div>
        <div className="stat"><span>Finalizados</span><strong>{count('done')}/{p.materials.length}</strong><small>Progresso total</small></div>
        <div className="stat"><span>Tempo registrado</span><strong>{p.totalMinutes} min</strong><small>Cronômetro livre</small></div>
      </div>

      <section className="panel">
        <div className="panelhead">
          <div>
            <h2>Plano de estudos</h2>
            <p>{view === 'board' ? 'Mova os cards entre as etapas' : 'Distribua os cursos pelos dias da semana'}</p>
          </div>
          <div className="seg" role="tablist">
            <button role="tab" aria-selected={view === 'board'} className={view === 'board' ? 'selected' : ''} onClick={() => setView('board')}>Quadro</button>
            <button role="tab" aria-selected={view === 'calendar'} className={view === 'calendar' ? 'selected' : ''} onClick={() => setView('calendar')}>Calendário</button>
          </div>
        </div>

        <div className="chips">
          <button className={p.track === 'Todas' ? 'selected' : ''} onClick={() => p.setTrack('Todas')}>Todas</button>
          {p.tracks.map(t => (
            <span className="track-chip-wrap" key={t.id}>
              <button className={p.track === t.name ? 'selected' : ''} onClick={() => p.setTrack(t.name)}>
                {t.name} · {p.materials.filter(m => m.track === t.name).length}
              </button>
              <button className="track-mini-action" title="Editar trilha" onClick={() => p.onRenameTrack(t.id, t.name)}>✎</button>
              <button className="track-mini-action danger" title="Excluir trilha" onClick={() => p.onRemoveTrack(t.id)}>×</button>
            </span>
          ))}
          <button className="secondary" onClick={p.onNewTrack}><Plus size={14} /> Nova trilha</button>
        </div>

        <div className="filters">
          <input placeholder="Buscar curso, tópico ou material…" value={p.query} onChange={e => p.setQuery(e.target.value)} />
          <select value={p.filter} onChange={e => p.setFilter(e.target.value)}>
            {['Todos', 'Curso', 'Artigo', 'Vídeo', 'Podcast', 'Documentação', 'Livro'].map(x => <option key={x}>{x}</option>)}
          </select>
        </div>

        <div className="study-body">
          {view === 'board' ? (
            <StudyBoard
              materials={p.shown}
              blocks={p.blocks}
              renderTimer={p.renderTimer}
              onNew={p.onNewMaterial}
              onMove={p.onMove}
              onRename={p.onRenameMaterial}
              onRemove={p.onRemoveMaterial}
            />
          ) : (
            <StudyCalendar
              materials={p.materials}
              tray={p.shown.filter(m => m.status !== 'done')}
              blocks={p.blocks}
              onAdd={p.onAddBlocks}
              onPatch={p.onPatchBlock}
              onRemove={p.onRemoveBlock}
            />
          )}
        </div>
      </section>
    </>
  );
}
