import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  wide?: boolean;
  children: ReactNode;
};

/** Janela de formulário padrão (mesmo visual das janelas de criar/editar do app). */
export default function Dialog({ title, onClose, onSubmit, submitLabel = 'Salvar', wide = false, children }: Props) {
  return (
    <div className="backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form className={'dialog' + (wide ? ' wide' : '')} onSubmit={e => { e.preventDefault(); onSubmit(); }}>
        <div className="dialoghead">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar"><X size={17} /></button>
        </div>
        {children}
        <div className="dialogactions">
          <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
          <button className="primary">{submitLabel}</button>
        </div>
      </form>
    </div>
  );
}
