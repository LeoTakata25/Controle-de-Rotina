import { useMemo, useState } from 'react';
import { Clock3, Plus } from 'lucide-react';
import type { Coll } from '../data/useCollection';
import { addDays, fmtMin, iso, weekStart } from '../study/dates';
import { clock, useNow } from '../useNow';
import { BookDialog, LogDialog } from './ReadingDialogs';
import type { LogValues } from './ReadingDialogs';
import { readingStreak } from './stats';
import { STATUS_LABEL } from './types';
import type { Book, BookStatus, ReadLog } from './types';

type Props = { books: Coll<Book>; logs: Coll<ReadLog> };
type Tab = BookStatus | 'all';

const TIMER_KEY = 'rotina-reading-timer';
const WEEK = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function loadTimer(): { bookId: string; startedAt: number } | null {
  try {
    const v = JSON.parse(localStorage.getItem(TIMER_KEY) || 'null');
    return v && v.bookId && v.startedAt ? v : null;
  } catch {
    return null;
  }
}
function saveTimer(v: { bookId: string; startedAt: number } | null) {
  try {
    if (v) localStorage.setItem(TIMER_KEY, JSON.stringify(v));
    else localStorage.removeItem(TIMER_KEY);
  } catch { /* sem armazenamento: o cronômetro vale só nesta aba */ }
}

export default function ReadingView({ books, logs }: Props) {
  const today = iso(new Date());
  const [tab, setTab] = useState<Tab>('reading');
  const [bookDlg, setBookDlg] = useState<Book | 'new' | null>(null);
  const [logDlg, setLogDlg] = useState<{ book: Book; log?: ReadLog; minutes?: number } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [timer, setTimer] = useState(loadTimer);
  const now = useNow(!!timer);

  const todayLogs = logs.items.filter(l => l.log_date === today);
  const pagesToday = todayLogs.reduce((n, l) => n + l.pages, 0);
  const minutesToday = todayLogs.reduce((n, l) => n + l.minutes, 0);
  const readToday = pagesToday > 0 || minutesToday > 0;
  const streak = readingStreak(logs.items, today);
  const ws = weekStart(today);
  const week = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const weekPages = logs.items.filter(l => l.log_date >= ws && l.log_date <= addDays(ws, 6)).reduce((n, l) => n + l.pages, 0);
  const year = today.slice(0, 4);
  const finishedYear = books.items.filter(b => b.status === 'finished' && (b.finished_at || '').startsWith(year)).length;

  const counts: Record<Tab, number> = {
    all: books.items.length,
    reading: books.items.filter(b => b.status === 'reading').length,
    want: books.items.filter(b => b.status === 'want').length,
    finished: books.items.filter(b => b.status === 'finished').length,
  };
  const shown = useMemo(() => books.items.filter(b => tab === 'all' || b.status === tab), [books.items, tab]);

  /* ----- livros ----- */
  async function saveBook(v: Omit<Book, 'id'>) {
    if (bookDlg && bookDlg !== 'new') await books.update(bookDlg.id, v);
    else await books.add(v);
    setBookDlg(null);
  }
  async function removeBook(b: Book) {
    if (!window.confirm(`Excluir "${b.title}" e todo o histórico de leitura dele?`)) return;
    if (timer?.bookId === b.id) { saveTimer(null); setTimer(null); }
    if (await books.remove(b.id)) logs.drop(l => l.book_id === b.id);   // o banco apaga os registros em cascata
  }
  const startReading = (b: Book) => books.update(b.id, { status: 'reading', started_at: b.started_at || today, finished_at: null });
  const finishBook = (b: Book) =>
    books.update(b.id, { status: 'finished', finished_at: today, current_page: b.total_pages > 0 ? b.total_pages : b.current_page, started_at: b.started_at || today });

  /* ----- registros de leitura (mantêm a página atual do livro em dia) ----- */
  async function adjustBook(b: Book, delta: number, date: string) {
    const max = b.total_pages > 0 ? b.total_pages : Infinity;
    const cur = Math.min(max, Math.max(0, b.current_page + delta));
    const patch: Partial<Omit<Book, 'id'>> = { current_page: cur };
    if (b.status === 'want') { patch.status = 'reading'; patch.started_at = date; }
    if (b.total_pages > 0 && cur >= b.total_pages) { patch.status = 'finished'; patch.finished_at = date; }
    else if (b.status === 'finished') { patch.status = 'reading'; patch.finished_at = null; }
    await books.update(b.id, patch);
  }
  async function saveLog(v: LogValues) {
    if (!logDlg) return;
    const { book, log } = logDlg;
    if (log) {
      await logs.update(log.id, { log_date: v.date, pages: v.pages, minutes: v.minutes });
      await adjustBook(book, v.pages - log.pages, v.date);
    } else {
      await logs.add({ book_id: book.id, log_date: v.date, pages: v.pages, minutes: v.minutes });
      await adjustBook(book, v.pages, v.date);
    }
    setLogDlg(null);
  }
  async function removeLog(b: Book, l: ReadLog) {
    if (!window.confirm('Excluir este registro de leitura?')) return;
    await logs.remove(l.id);
    await adjustBook(b, -l.pages, today);
  }

  /* ----- cronômetro de leitura ----- */
  function toggleTimer(b: Book) {
    if (timer?.bookId === b.id) {
      const minutes = Math.max(1, Math.round((Date.now() - timer.startedAt) / 60000));
      saveTimer(null); setTimer(null);
      setLogDlg({ book: b, minutes });
    } else {
      const t = { bookId: b.id, startedAt: Date.now() };
      saveTimer(t); setTimer(t);
      if (b.status === 'want') void startReading(b);
    }
  }

  return (
    <>
      <div className="stats">
        <div className="stat"><span>Li hoje?</span><strong>{readToday ? 'Sim' : 'Ainda não'}</strong><small>{readToday ? `${pagesToday} pág · ${minutesToday} min` : 'Registre sua leitura do dia'}</small></div>
        <div className="stat"><span>Sequência</span><strong>{streak} dia{streak === 1 ? '' : 's'}</strong><small>Dias seguidos lendo</small></div>
        <div className="stat"><span>Páginas na semana</span><strong>{weekPages}</strong><small>Segunda a domingo</small></div>
        <div className="stat"><span>Livros finalizados</span><strong>{finishedYear}</strong><small>Em {year}</small></div>
      </div>

      <section className="panel">
        <div className="panelhead">
          <div><h2>Leitura da semana</h2><p>Os dias em que você leu</p></div>
          <button className="primary" onClick={() => setBookDlg('new')}><Plus size={14} /> Novo livro</button>
        </div>
        <div className="rd-week">
          {week.map((d, i) => {
            const day = logs.items.filter(l => l.log_date === d);
            const p = day.reduce((n, l) => n + l.pages, 0);
            const m = day.reduce((n, l) => n + l.minutes, 0);
            const did = p > 0 || m > 0;
            return (
              <div key={d} className={'rd-day' + (did ? ' did' : '') + (d === today ? ' today' : '')} aria-label={`${WEEK[i]}: ${did ? `${p} páginas` : 'sem leitura'}`}>
                <span>{WEEK[i]}</span>
                <i>{did ? '✓' : d < today ? '–' : ''}</i>
                <small>{did ? `${p} pág` : ''}</small>
              </div>
            );
          })}
        </div>
        <div className="chips">
          {(['reading', 'want', 'finished', 'all'] as Tab[]).map(t => (
            <button key={t} className={tab === t ? 'selected' : ''} onClick={() => setTab(t)}>
              {t === 'all' ? 'Todos' : STATUS_LABEL[t]} · {counts[t]}
            </button>
          ))}
        </div>

        <div className="rd-grid">
          {shown.map(b => {
            const mine = logs.items.filter(l => l.book_id === b.id).sort((a, c) => c.log_date.localeCompare(a.log_date));
            const todayBook = mine.filter(l => l.log_date === today);
            const pT = todayBook.reduce((n, l) => n + l.pages, 0);
            const mT = todayBook.reduce((n, l) => n + l.minutes, 0);
            const pct = b.total_pages > 0 ? Math.min(100, Math.round((b.current_page / b.total_pages) * 100)) : 0;
            const recent = mine.filter(l => l.log_date >= addDays(today, -13) && l.pages > 0);
            const readDays = new Set(recent.map(l => l.log_date)).size;
            const pace = readDays ? recent.reduce((n, l) => n + l.pages, 0) / readDays : 0;
            const left = Math.max(0, b.total_pages - b.current_page);
            const eta = b.status === 'reading' && pace > 0 && left > 0 ? Math.ceil(left / pace) : 0;
            const running = timer?.bookId === b.id;
            const secs = running ? Math.max(0, Math.floor((now - timer!.startedAt) / 1000)) : 0;
            return (
              <article className={'rd-card st-' + b.status} key={b.id}>
                <div className="rd-top">
                  <div>
                    <strong>{b.title}</strong>
                    <small>{b.author || 'Autor não informado'}</small>
                  </div>
                  <span className="tag">{STATUS_LABEL[b.status]}</span>
                </div>

                {b.status !== 'want' && (
                  <>
                    <div className="bar"><i style={{ width: `${pct}%` }} /></div>
                    <div className="rd-meta">
                      <span>{b.total_pages > 0 ? `${b.current_page} de ${b.total_pages} páginas (${pct}%)` : `Página ${b.current_page}`}</span>
                      {b.status === 'reading' && <span className={pT || mT ? 'ok' : ''}>{pT || mT ? `Hoje: ${pT} pág · ${mT} min` : 'Ainda não li hoje'}</span>}
                      {b.status === 'finished' && b.finished_at && <span>Terminado em {new Date(b.finished_at + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                      {eta > 0 && <span>~{eta} dia{eta > 1 ? 's' : ''} para terminar neste ritmo</span>}
                    </div>
                  </>
                )}
                {b.status === 'want' && b.total_pages > 0 && <div className="rd-meta"><span>{b.total_pages} páginas</span></div>}
                {b.notes && <p className="rd-notes">{b.notes}</p>}

                <div className="rd-actions">
                  {b.status === 'want' && <button className="primary row-action" onClick={() => startReading(b)}>Começar a ler</button>}
                  {b.status !== 'want' && (
                    <>
                      {b.status === 'reading' && <button className="primary row-action" onClick={() => setLogDlg({ book: b })}>Registrar leitura</button>}
                      {b.status === 'reading' && (
                        <span className="timer">
                          {running && <span className="live"><Clock3 size={13} />{clock(secs)}</span>}
                          <button className={running ? 'stop' : 'start'} onClick={() => toggleTimer(b)}>{running ? 'Parar' : 'Ler agora'}</button>
                        </span>
                      )}
                      {b.status === 'reading' && <button className="secondary row-action" onClick={() => finishBook(b)}>Finalizei</button>}
                      {b.status === 'finished' && <button className="secondary row-action" onClick={() => startReading(b)}>Reler</button>}
                    </>
                  )}
                  <button className="secondary row-action" onClick={() => setOpenId(openId === b.id ? null : b.id)} aria-expanded={openId === b.id}>Histórico ({mine.length})</button>
                  <button className="secondary row-action" onClick={() => setBookDlg(b)}>Editar</button>
                  <button className="secondary row-action danger" onClick={() => removeBook(b)}>Excluir</button>
                </div>

                {openId === b.id && (
                  <div className="rd-history">
                    {mine.map(l => (
                      <div className="rd-log" key={l.id}>
                        <span>{new Date(l.log_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                        <span>{l.pages} pág</span>
                        <span>{l.minutes ? fmtMin(l.minutes) : '—'}</span>
                        <button className="link" onClick={() => setLogDlg({ book: b, log: l })}>Editar</button>
                        <button className="link danger" onClick={() => removeLog(b, l)}>Excluir</button>
                      </div>
                    ))}
                    {!mine.length && <small>Nenhuma leitura registrada.</small>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
        {!shown.length && <div className="empty">{books.items.length ? 'Nenhum livro nesta lista.' : 'Cadastre seu primeiro livro para começar.'}</div>}
      </section>

      {bookDlg && <BookDialog initial={bookDlg === 'new' ? null : bookDlg} onClose={() => setBookDlg(null)} onSave={saveBook} />}
      {logDlg && <LogDialog book={logDlg.book} log={logDlg.log} minutes={logDlg.minutes} onClose={() => setLogDlg(null)} onSave={saveLog} />}
    </>
  );
}
