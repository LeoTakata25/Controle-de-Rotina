export type Theme = 'dark' | 'light';

const KEY = 'rotina-theme';
const BAR: Record<Theme, string> = { dark: '#111315', light: '#eef0ef' };

/** Tema salvo no navegador. Sem escolha salva, mantém o escuro (padrão do app). */
export function getTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[t]);
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* navegação privada: a escolha só vale nesta sessão */
  }
}
