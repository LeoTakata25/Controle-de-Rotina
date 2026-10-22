export type BookStatus = 'want' | 'reading' | 'finished';

export type Book = {
  id: string;
  title: string;
  author: string;
  total_pages: number;
  current_page: number;
  status: BookStatus;
  started_at: string | null;
  finished_at: string | null;
  notes: string;
};

/** Um registro de leitura: quantas páginas e quanto tempo em um dia. */
export type ReadLog = {
  id: string;
  book_id: string;
  log_date: string;
  pages: number;
  minutes: number;
};

export const STATUS_LABEL: Record<BookStatus, string> = {
  reading: 'Lendo',
  want: 'Quero ler',
  finished: 'Finalizado',
};
