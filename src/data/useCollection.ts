import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';

/** Lista de registros de uma tabela, com carregar/adicionar/editar/excluir.
 *  Sem usuário logado (modo demonstração) tudo fica só na memória. */
export type Coll<T extends { id: string }> = {
  items: T[];
  loading: boolean;
  add: (item: Omit<T, 'id'>) => Promise<T | null>;
  update: (id: string, patch: Partial<Omit<T, 'id'>>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  /** tira da lista local (sem tocar no banco), p. ex. registros apagados em cascata */
  drop: (match: (x: T) => boolean) => void;
};

// colunas controladas pelo banco nunca são enviadas
const clean = (o: any) => {
  const { id: _id, user_id: _u, created_at: _c, ...rest } = o;
  return rest;
};

export function useCollection<T extends { id: string }>(
  table: string,
  user: { id: string } | null,
  demo: () => T[],
  notify: (m: string) => void,
  order?: string,
): Coll<T> {
  const [items, setItems] = useState<T[]>(demo);
  const [loading, setLoading] = useState(false);
  const say = useRef(notify);
  say.current = notify;

  useEffect(() => {
    if (!user) return;
    let off = false;
    setLoading(true);
    (async () => {
      let q: any = supabase.from(table).select('*');
      if (order) q = q.order(order, { ascending: true });
      const r = await q;
      if (off) return;
      if (r.error) say.current(`Falha ao carregar "${table}": ${r.error.message}`);
      else setItems((r.data || []) as T[]);
      setLoading(false);
    })();
    return () => { off = true; };
  }, [user?.id, table, order]);

  async function add(item: Omit<T, 'id'>) {
    if (!user) {
      const n = { ...item, id: crypto.randomUUID() } as T;
      setItems(p => [...p, n]);
      return n;
    }
    const r = await supabase.from(table).insert({ ...clean(item), user_id: user.id }).select().single();
    if (r.error) { notify('Erro ao salvar: ' + r.error.message); return null; }
    setItems(p => [...p, r.data as T]);
    return r.data as T;
  }

  async function update(id: string, patch: Partial<Omit<T, 'id'>>) {
    if (user) {
      const r = await supabase.from(table).update(clean(patch)).eq('id', id);
      if (r.error) { notify('Erro ao salvar: ' + r.error.message); return false; }
    }
    setItems(p => p.map(x => (x.id === id ? { ...x, ...patch } : x)));
    return true;
  }

  async function remove(id: string) {
    if (user) {
      const r = await supabase.from(table).delete().eq('id', id);
      if (r.error) { notify('Erro ao excluir: ' + r.error.message); return false; }
    }
    setItems(p => p.filter(x => x.id !== id));
    return true;
  }

  const drop = (match: (x: T) => boolean) => setItems(p => p.filter(x => !match(x)));

  return { items, loading, add, update, remove, drop };
}
