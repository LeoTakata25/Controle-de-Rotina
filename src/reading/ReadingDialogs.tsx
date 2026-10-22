import { useState } from 'react';
import Dialog from '../ui/Dialog';
import { iso } from '../study/dates';
import { STATUS_LABEL } from './types';
import type { Book, BookStatus, ReadLog } from './types';

/* ---------- Cadastrar / editar livro ---------- */
type BookValues = Omit<Book, 'id'>;

export function BookDialog({ initial, onClose, onSave }: {
  initial: Book | null;
  onClose: () => void;
  onSave: (v: BookValues) => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [author, setAuthor] = useState(initial?.author || '');
  const [total, setTotal] = useState(String(initial?.total_pages || ''));
  const [current, setCurrent] = useState(String(initial?.current_page || 0));
  const [status, setStatus] = useState<BookStatus>(initial?.status || 'reading');
  const [started, setStarted] = useState(initial?.started_at || '');
  const [finished, setFinished] = useState(initial?.finished_at || '');
  const [notes, setNotes] = useState(initial?.notes || '');

  function submit() {
    const t = Math.max(0, Math.round(Number(total)) || 0);
    let c = Math.max(0, Math.round(Number(current)) || 0);
    if (t > 0) c = Math.min(c, t);
    if (status === 'finished' && t > 0) c = t;
    const today = iso(new Date());
    onSave({
      title: title.trim(),
      author: author.trim(),
      total_pages: t,
      current_page: status === 'want' ? 0 : c,
      status,
      started_at: status === 'want' ? null : started || today,
      finished_at: status === 'finished' ? finished || today : null,
      notes: notes.trim(),
    });
  }

  return (
    <Dialog title={initial ? 'Editar livro' : 'Novo livro'} onClose={onClose} onSubmit={submit}>
      <label>Título
        <input required autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome do livro" />
      </label>
      <label>Autor
        <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Opcional" />
      </label>
      <div className="formtwo">
        <label>Total de páginas
          <input type="number" min={0} value={total} onChange={e => setTotal(e.target.value)} placeholder="Ex.: 320" />
        </label>
        <label>Página atual
          <input type="number" min={0} value={current} onChange={e => setCurrent(e.target.value)} disabled={status === 'want'} />
        </label>
      </div>
      <label>Situação
        <select value={status} onChange={e => setStatus(e.target.value as BookStatus)}>
          {(Object.keys(STATUS_LABEL) as BookStatus[]).map(k => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
        </select>
      </label>
      {status !== 'want' && (
        <div className="formtwo">
          <label>Comecei em
            <input type="date" value={started} onChange={e => setStarted(e.target.value)} />
          </label>
          {status === 'finished' && (
            <label>Terminei em
              <input type="date" value={finished} onChange={e => setFinished(e.target.value)} />
            </label>
          )}
        </div>
      )}
      <label>Anotações
        <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" />
      </label>
    </Dialog>
  );
}

/* ---------- Registrar / editar uma leitura ---------- */
export type LogValues = { date: string; pages: number; minutes: number };

export function LogDialog({ book, log, minutes: initMinutes, onClose, onSave }: {
  book: Book;
  log?: ReadLog;
  minutes?: number;
  onClose: () => void;
  onSave: (v: LogValues) => void;
}) {
  const base = log ? book.current_page - log.pages : book.current_page;   // página antes desta leitura
  const [date, setDate] = useState(log?.log_date || iso(new Date()));
  const [pages, setPages] = useState(log ? String(log.pages) : '');
  const [stopped, setStopped] = useState(log ? String(book.current_page) : '');
  const [minutes, setMinutes] = useState(log ? String(log.minutes) : initMinutes ? String(initMinutes) : '');

  // "páginas lidas" e "parei na página" andam juntos
  function changePages(v: string) {
    setPages(v);
    const n = Math.max(0, Math.round(Number(v)) || 0);
    setStopped(v === '' ? '' : String(book.total_pages > 0 ? Math.min(book.total_pages, base + n) : base + n));
  }
  function changeStopped(v: string) {
    setStopped(v);
    setPages(v === '' ? '' : String(Math.max(0, (Math.round(Number(v)) || 0) - base)));
  }

  function submit() {
    onSave({
      date,
      pages: Math.max(0, Math.round(Number(pages)) || 0),
      minutes: Math.max(0, Math.round(Number(minutes)) || 0),
    });
  }

  return (
    <Dialog title={log ? 'Editar leitura' : 'Registrar leitura'} onClose={onClose} onSubmit={submit}>
      <p className="muted rd-dlgbook"><b>{book.title}</b>{book.total_pages ? ` · página ${base} de ${book.total_pages}` : ''}</p>
      <label>Data
        <input type="date" required value={date} onChange={e => setDate(e.target.value)} />
      </label>
      <div className="formtwo">
        <label>Páginas lidas
          <input type="number" min={0} autoFocus value={pages} onChange={e => changePages(e.target.value)} placeholder="Ex.: 20" />
        </label>
        <label>Parei na página
          <input type="number" min={0} value={stopped} onChange={e => changeStopped(e.target.value)} placeholder={String(base)} />
        </label>
      </div>
      <label>Tempo de leitura (minutos)
        <input type="number" min={0} value={minutes} onChange={e => setMinutes(e.target.value)} placeholder="Ex.: 30" />
      </label>
    </Dialog>
  );
}
