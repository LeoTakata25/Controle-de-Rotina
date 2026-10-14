// Datas são tratadas como texto local "YYYY-MM-DD" para evitar problemas de fuso horário.
export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (s: string, n: number) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};

/** Segunda-feira da semana que contém a data. */
export const weekStart = (s: string) => {
  const d = parse(s);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return iso(d);
};

export const fmtShort = (s: string) =>
  parse(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');

export const fmtMin = (m: number) => {
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r}min`;
  return r ? `${h}h${String(r).padStart(2, '0')}` : `${h}h`;
};
