import { Moon, Sun } from 'lucide-react';
import type { Theme } from './theme';

type Props = { theme: Theme; onToggle: () => void; floating?: boolean };

export default function ThemeToggle({ theme, onToggle, floating = false }: Props) {
  const toLight = theme === 'dark';
  const label = toLight ? 'Tema claro' : 'Tema escuro';
  return (
    <button
      type="button"
      className={'theme-toggle' + (floating ? ' floating' : '')}
      onClick={onToggle}
      aria-label={`Ativar ${label.toLowerCase()}`}
      title={`Ativar ${label.toLowerCase()}`}
    >
      {toLight ? <Sun size={15} /> : <Moon size={15} />}
      <em>{label}</em>
    </button>
  );
}
