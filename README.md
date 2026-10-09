# Minha Rotina — starter React + Supabase

Aplicação React + TypeScript + Vite, com interface responsiva em tema grafite/verde, PWA instalável, autenticação Supabase e base para sincronização dos dados. O cronômetro é livre (HH:MM:SS), por atividade, sem Pomodoro.

## Instalação no Windows
1. Instale Node.js LTS: https://nodejs.org/
2. Extraia este ZIP para uma pasta.
3. Copie `.env.example` para `.env.local`.
4. Em `.env.local`, preencha `VITE_SUPABASE_PUBLISHABLE_KEY` com a chave publishable do seu projeto. A URL já está configurada.
5. Abra o terminal na pasta do projeto e execute:

```bash
npm install
npm run dev
```

Abra o endereço local mostrado pelo Vite, normalmente `http://localhost:5173`.

## Banco Supabase
O app espera as tabelas `routine_items`, `habits`, `goals`, `study_tracks`, `study_materials` e `activity_time_entries`, com RLS habilitado e políticas para restringir os dados por `user_id = auth.uid()`.

Colunas esperadas no frontend: `routine_items(title, category, is_completed, sort_order)`, `habits(name, frequency, is_active)`, `goals(title, target_value, current_value, status)`, `study_tracks(name, description)`, `study_materials(title, material_type, track_id, module_name, topic_name, is_completed, url)` e `activity_time_entries(activity_type, activity_id, activity_name, started_at, ended_at, duration_seconds)`, além de `id`, `user_id` e `created_at` conforme apropriado.

**Importante:** os nomes de colunas do SQL que você executou anteriormente podem ser diferentes. Confira no Supabase Table Editor e alinhe o schema com esses nomes antes de usar. Não desative RLS para contornar erros. Os dados de demonstração são locais à sessão da página e não são enviados para a nuvem. O carregamento/salvamento em nuvem depende do schema corresponder.

A confirmação de e-mail pode estar habilitada no Supabase Auth; nesse caso, confirme o cadastro antes de entrar. Esta é uma base inicial para desenvolvimento, não uma versão de produção auditada.
