export type HomeTask = {
  id: string;
  title: string;
  notes: string;
  category: string;
  /** dia em que a tarefa deve ser feita (YYYY-MM-DD) */
  due_date: string;
  done: boolean;
  done_at: string | null;
};

export const HOME_CATEGORIES = ['Casa', 'Limpeza', 'Cozinha', 'Compras', 'Contas', 'Manutenção', 'Pets', 'Outros'];
