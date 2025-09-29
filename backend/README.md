# Timely — **Backend** (Node + TypeORM)

Este backend expõe uma API REST para **cadastrar disciplinas, professores, turmas, cargas semanais e gerar horários** automaticamente. Baseado em **Node.js + Express + TypeORM** e preparado para **MySQL 8** (padrão) — com suporte opcional a SQLite (ver nota).

> Versão do projeto: `2.0.0` (do `package.json`)

---

## 📦 Stack
- **Node.js** (recomendado: 20 LTS)
- **Express** (`src/app.ts`)
- **TypeORM 0.3.x** (`src/db/data-source.ts`, `src/migrations/*`)
- **MySQL 8** + `mysql2` (padrão) | **Opcional**: SQLite (*requer instalar `sqlite3`*)
- Outras libs: `multer` (upload CSV/XLSX), `csv-parse`, `xlsx`, `pdfkit`, `cors`, `dotenv`

## 🗂 Estrutura principal
```
backend/
  src/
    index.ts            # boot: start API + seed básico
    app.ts              # Express e rotas
    config.ts           # PORT e config de DB via .env
    db/data-source.ts   # TypeORM DataSource + entidades
    migrations/         # 0001*, 0002*, 1759* (schema + seed)
    models/             # Subject, Teacher, SchoolClass, WeeklyLoad, Timeslot, Lesson, Schedule
    routes/             # subjects, teachers, classes, schedule, import/export
    services/           # NaiveScheduler, ExportService, etc.
    seed.ts             # preenche básicos (subjects + timeslots)
  .env.example          # exemplo de configuração
  package.json          # scripts de build/dev/migrations
  tsconfig.json
```

## 🔧 Pré‑requisitos
- **Node.js 18+ (recomendado 20 LTS)**
- **MySQL 8** rodando localmente (ou em container) **e** um schema criado (ex.: `timetabling`)

> **SQLite (opcional):** o código suporta `DB_TYPE=sqlite`, porém a dependência **não está no package.json**. Para usar: `npm i sqlite3 --save` e **não** usar MySQL. Ver seção “SQLite” no final.

## ⚙️ Configuração (.env)

Copie o exemplo e ajuste credenciais do MySQL:
```bash
cd backend
cp .env.example .env
```

Conteúdo padrão:
```env
PORT=4000
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=timetabling
```

Crie o banco (se necessário):
```sql
CREATE DATABASE timetabling CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
GRANT ALL ON timetabling.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

## 🚀 Instalação e Execução (MySQL)

```bash
cd backend
npm install

# 1) Compilar TS (feito automaticamente pelos scripts abaixo)
# 2) Rodar MIGRATIONS (cria tabelas e popula dados iniciais)
npm run db:run

# 3) Subir servidor em modo dev (ts-node-dev)
npm run dev
# API: http://localhost:4000/api
```

### Scripts disponíveis
| Script | O que faz |
|---|---|
| `npm run dev` | Inicia em modo desenvolvimento (`ts-node-dev` em `src/index.ts`) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Executa a versão compilada (`dist/index.js`) |
| `npm run db:show` | Lista migrations pendentes (usa `dist/db/data-source.js`) |
| `npm run db:run` | Executa migrations (cria/ajusta schema e insere seeds) |
| `npm run db:rev` | Reverte a última migration |

> **Importante:** o erro “`Table 'timetabling.timeslot' doesn't exist`” ocorre quando o servidor sobe **antes** de rodar as migrations. Sempre execute **`npm run db:run`** após configurar o `.env`.

## 🌐 Endpoints principais

> Base: **`/api`** (ver `src/app.ts`).

### Disciplinas
- `GET /api/subjects` — listar
- `POST /api/subjects` — criar `{ code, name, active }`
- `PUT /api/subjects/:id` — atualizar
- `DELETE /api/subjects/:id` — remover
- `POST /api/subjects/seed-defaults` — inserir defaults BNCC

### Professores
- `GET /api/teachers`
- `POST /api/teachers`
- `PUT /api/teachers/:id`
- `DELETE /api/teachers/:id`

### Turmas e Cargas
- `GET /api/classes`
- `POST /api/classes` — `{ name, gradeYear, shift, hasContraturno }`
- `PUT /api/classes/:id`
- `DELETE /api/classes/:id`
- `GET /api/classes/:id/loads` — cargas semanais por disciplina
- `PUT /api/classes/:id/loads` — salvar cargas `{ subjectCode, hoursPerWeek }[]`
- `POST /api/classes/:id/apply-default-loads` — aplica carga padrão por série
- `POST /api/classes/apply-default-loads/all` — aplica para todas as turmas

### Importar/Exportar
- **Templates (CSV):** `GET /api/templates/:entity` (`subjects|teachers|classes|loads`)
- **Exportar (CSV):** `GET /api/export/:entity`
- **Importar (CSV/XLSX):** `POST /api/import/:entity` (via `multipart/form-data` com `file`)

### Horários (Schedule)
- `GET /api/schedule/preflight` — checagens antes de gerar (ex.: se há turmas, cargas, professores e timeslots)
- `GET /api/schedule` — retorna **último** horário gerado + aulas
- `POST /api/schedule/generate` — gera horários `{ population?, generations?, mutation? }`
- `POST /api/schedule/clear` — apaga horário/aulas atuais

### Export de Horário
- `GET /api/export/excel` — planilha consolidada
- `GET /api/export/pdf` — PDF consolidado

## 🧪 Fluxo sugerido (mínimo)
1. **Rodar migrations**: `npm run db:run`
2. **Subir server**: `npm run dev`
3. **Cadastrar** disciplinas (ou usar `POST /subjects/seed-defaults`), **professores**, **turmas**;
4. **Definir cargas** por turma (`/classes/:id/loads`) — ou aplicar padrão por série;
5. **Gerar** horários (`POST /schedule/generate`);
6. **Visualizar/baixar** (`/api/export/excel` ou `/api/export/pdf`).

## 🩺 Solução de problemas
- **`Table 'timetabling.timeslot' doesn't exist`** → Execute `npm run db:run` no schema correto.
- **`ER_NOT_SUPPORTED_AUTH_MODE` (MySQL 8)** → Ajuste o usuário para `mysql_native_password`.
  ```sql
  ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'sua_senha';
  FLUSH PRIVILEGES;
  ```
- **Porta ocupada (4000)** → Mude `PORT` no `.env`.
- **CORS no front** → O backend já usa `cors()` padrão (ver `src/app.ts`).

## 🗃️ Opcional: SQLite em vez de MySQL
1. Instale: `npm i sqlite3 --save`
2. No `.env`: `DB_TYPE=sqlite` (demais variáveis são ignoradas)
3. Rode migrations: `npm run db:run`
4. Dev: `npm run dev`

> O arquivo será criado como `db.sqlite` na raiz do backend (ver `data-source.ts`).
