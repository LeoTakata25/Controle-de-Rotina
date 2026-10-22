import { useState } from 'react';
import Dialog from '../ui/Dialog';
import { HOME_CATEGORIES } from './types';
import type { HomeTask } from './types';

type Values = Pick<HomeTask, 'title' | 'notes' | 'category' | 'due_date'>;

export default function HomeDialog({ initial, date, onClose, onSave }: {
  initial: HomeTask | null;
  date: string;
  onClose: () => void;
  onSave: (v: Values) => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [category, setCategory] = useState(initial?.category || 'Casa');
  const [due, setDue] = useState(initial?.due_date || date);

  return (
    <Dialog
      title={initial ? 'Editar afazer' : 'Novo afazer'}
      onClose={onClose}
      onSubmit={() => onSave({ title: title.trim(), notes: notes.trim(), category: category.trim() || 'Casa', due_date: due })}
    >
      <label>O que precisa ser feito
        <input required autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex.: Lavar a louça" />
      </label>
      <div className="formtwo">
        <label>Categoria
          <input list="home-cats" value={category} onChange={e => setCategory(e.target.value)} />
          <datalist id="home-cats">{HOME_CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
        </label>
        <label>Dia
          <input type="date" required value={due} onChange={e => setDue(e.target.value)} />
        </label>
      </div>
      <label>Observações
        <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" />
      </label>
    </Dialog>
  );
}
