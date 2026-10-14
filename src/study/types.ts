export type Status = 'backlog' | 'sprint' | 'doing' | 'done';

export type Material = {
  id: string;
  title: string;
  type: string;
  track: string;
  module: string;
  topic: string;
  done: boolean;
  url: string;
  status: Status;
  /** duração estimada do material, em minutos (0 = não informado) */
  minutes: number;
};

/** Um bloco de estudo: "este material, neste dia, por X minutos". */
export type Block = {
  id: string;
  materialId: string;
  /** data local no formato YYYY-MM-DD */
  date: string;
  minutes: number;
};

export type NewBlock = Omit<Block, 'id'>;

export type Track = { id: string; name: string };

export const COLUMNS: { key: Status; label: string; hint: string }[] = [
  { key: 'backlog', label: 'Backlog', hint: 'Para estudar mais tarde' },
  { key: 'sprint', label: 'Sprint', hint: 'Foco desta semana' },
  { key: 'doing', label: 'Em andamento', hint: 'Estudando agora' },
  { key: 'done', label: 'Finalizado', hint: 'Concluídos' },
];
