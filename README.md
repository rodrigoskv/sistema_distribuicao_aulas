
# Timely — Sistema de **Distribuição de Aulas**

Este repositório contém um sistema completo para **planejamento e geração de horários escolares** (fundamental/anos iniciais e finais), composto por **Backend (Node.js + TypeORM + MySQL)** e **Frontend (React + Vite)**.

O objetivo é **organizar as aulas por turma e turno**, considerando **cargas horárias semanais**, **disponibilidade de professores**, **janelas de tempo (timeslots)** e **regras básicas** (evitar choques, cumprir carga por disciplina, etc.).
 
**VIDEO DO PROJETO**
https://youtu.be/5b7P37c2lnc

> Documentações específicas:  
> • Backend: [`BACKEND-README.md`] (.backend/README.md)  
> • Frontend: [`FRONTEND-README.md`] (.frontend/README.md)  

---

## ✨ Principais recursos
- **Cadastro e edição** de **disciplinas**, **professores**, **turmas** e **cargas semanais** por turma.  
- **Geração automática** de **horários** por turma (alocação de aulas em **timeslots**), evitando conflitos básicos.  
- **Aplicação de cargas padrão** por série (ex.: BNCC — 1º a 9º ano).  
- **Importação/Exportação em lote** (CSV/XLSX) para facilitar carga de dados.  
- **Exportação do horário consolidado** em **Excel** e **PDF**.  
- **Interface web** simples para operar todo o fluxo.

---

## 🧠 Como funciona (visão geral)
O sistema modela os elementos essenciais da grade escolar:

- **Subject (Disciplina)**: código e nome (ex.: `MAT`, `PORT`, `HIST`).  
- **Teacher (Professor)**: dados do docente e suas **disciplinas** (habilitações) e **disponibilidade**.  
- **SchoolClass (Turma)**: ano/série, nome e **turno** (matutino/vespertino) + opcional de **contraturno**.  
- **WeeklyLoad (Carga Semanal)**: horas/semana de cada disciplina **por turma**.  
- **Timeslot**: janelas de tempo pré-cadastradas (1ª, 2ª, 3ª aula, recreio, etc.).  
- **Schedule/Lesson (Horário/Aula)**: resultado final da alocação (turma × disciplina × professor × timeslot).

A geração de horário é feita por um **serviço de agendamento** (por ex. *NaiveScheduler*), que:
1. **Valida pré-condições** (existem turmas, professores, cargas e timeslots?).  
2. **Distribui aulas** respeitando **carga semanal** da turma e **evitando conflitos** comuns:  
   - Mesmo professor em **dois lugares** no mesmo timeslot.  
   - **Carga insuficiente/excedente** por disciplina.  
   - **Turma com aula duplicada** no mesmo timeslot.  
3. Opcionalmente, permite **parâmetros de geração** (ex.: tamanho de população, gerações, taxa de mutação) quando houver heurística evolutiva; em implementações mais simples, usa **estratégias gananciosas/iterativas**.

> O resultado pode ser refeito a qualquer momento: **limpe** o horário atual e **gere** novamente.

---

## 🏗 Arquitetura
**Monorepo** com dois pacotes principais:

```
distribuicao-aulas/
├── backend/        # API REST (Node.js + Express + TypeORM + MySQL)
│   ├── src/
│   │   ├── models/            # Entidades (Subject, Teacher, SchoolClass, WeeklyLoad, Timeslot, Lesson, Schedule)
│   │   ├── routes/            # Rotas REST (subjects, teachers, classes, schedule, import/export)
│   │   ├── services/          # NaiveScheduler, ExportService (Excel/PDF), etc.
│   │   ├── db/                # DataSource TypeORM
│   │   └── migrations/        # Criação de schema + seeds
│   ├── .env.example
│   └── package.json
└── frontend/       # SPA (React + Vite)
    ├── src/
    │   ├── components/        # CRUDs, import/export, gerador e visualizador de horários
    │   ├── pages/             # Index (tabs/abas)
    │   └── lib/api.ts         # Helper de chamadas à API
    └── package.json
```

**Tecnologias:**  
- Backend: **Node 18+/20 LTS**, **Express**, **TypeORM 0.3.x**, **MySQL 8** (`mysql2`) — opcional **SQLite**.  
- Frontend: **React 18**, **Vite**, **TypeScript**.

---

## ⚙️ Requisitos
- **Node.js 18+** (recomendado **20 LTS**)
- **MySQL 8** (local ou Docker)  
  > Alternativa: **SQLite** (instale `sqlite3` e ajuste `DB_TYPE=sqlite`).

---

## 🚀 Executar rapidamente (dev)

### 1) Backend
1. Copie as variáveis de ambiente e configure o banco:
   ```bash
   cd backend
   cp .env.example .env
   # Edite .env para apontar seu MySQL local (DB_HOST, DB_USER, DB_PASS, DB_NAME)
   ```
2. Instale e rode as **migrations**:
   ```bash
   npm install
   npm run db:run    # cria tabelas e insere seeds básicos (ex.: timeslots/subjects)
   npm run dev       # sobe a API em http://localhost:4000/api
   ```

### 2) Frontend
1. Configure a URL da API (se necessário):
   ```bash
   cd ../frontend
   echo "VITE_API_URL=http://localhost:4000/api" > .env
   ```
2. Instale e rode:
   ```bash
   npm install
   npm run dev       # http://localhost:5173
   ```

> Fluxo mínimo de uso: **cadastrar/ajustar** disciplinas, professores, turmas e **cargas** → **gerar horário** → **exportar** (Excel/PDF).

---

## 📥 Importar/Exportar dados
- **Templates (CSV)** por entidade: baixe pelo frontend (aba *Importar*) ou via backend: `GET /api/templates/:entity`.  
- **Importar (CSV/XLSX)**: envie arquivo via frontend ou `POST /api/import/:entity` (multipart).  
- **Exportar (CSV)**: menus do frontend ou `GET /api/export/:entity`.  
- **Exportar horário consolidado**: `GET /api/export/excel` e `GET /api/export/pdf`.

---

## 🩺 Troubleshooting
- **“Table 'timetabling.timeslot' doesn't exist”** → rode `npm run db:run` no backend (migrations).  
- **MySQL 8 (`ER_NOT_SUPPORTED_AUTH_MODE`)** → troque para `mysql_native_password`:
  ```sql
  ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'sua_senha';
  FLUSH PRIVILEGES;
  ```
- **CORS** (front não conversa com a API) → confira `VITE_API_URL` e se o backend está ativo em `PORT`.  
- Portas ocupadas → ajuste `PORT` no backend e `server.port` no `vite.config.ts` do frontend.

---


