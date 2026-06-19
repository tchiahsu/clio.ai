# CLIO — AI-Powered Personal Finance Dashboard

Clio is a full-stack personal finance dashboard. Upload your bank statement PDFs and Clio extracts the transactions, automatically categorizes them, and lets you explore your money through dashboards, budgets, and a natural-language AI chat that answers questions like *"where does most of my money go?"* or *"how much do I spend on coffee?"* — backed by your real data.

---

## Overview

Clio is a monorepo with three parts:

| Folder | What it is | Stack |
|---|---|---|
| `backend/` | REST API, auth, statement parsing, and all LLM calls | Node.js · TypeScript · Express · PostgreSQL (`pg`) |
| `frontend/` | Single-page dashboard UI | React · TypeScript · Vite · Tailwind |
| `database/` | Schema migrations and demo seed data | PostgreSQL SQL scripts |

The frontend talks to the backend over `/api/*` (proxied by Vite in development). The backend owns the database and is the only thing that calls the LLM.

---

## Features

- **PDF Statement Parsing** — Upload bank statement PDFs and have transactions automatically extracted and imported
- **Smart Transaction Classification** — Exact merchant matching, regex pattern rules, and Gemini AI as a fallback classifier
- **Spending Dashboard** — Income, expenses, net cash flow, and category breakdowns per statement
- **Budget Overview** — Compare income, spending, and savings across months
- **AI Chat** — Ask natural-language questions about your finances and get answers backed by real data
- **Manual Corrections** — Reassign transaction categories and rename merchants after import

---

## Prerequisites

- **Node.js** v18+
- **PostgreSQL** 14+ (or Docker)
- A **Google Gemini API key** — get one free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

---

## Environment Variables

Create a `.env` file in the **project root** (the backend loads it from there):

```env
# Database
PG_USER=postgres
PG_HOST=localhost
PG_DATABASE=clio
PG_PASSWORD=yourpassword
PG_PORT=5432

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# LLM
GEMINI_API_KEY=your_gemini_api_key

# Optional — which seeded account the "View demo" button logs into
DEMO_EMAIL=demo@example.com
```

| Variable | Required | Description |
|---|---|---|
| `PG_USER` / `PG_HOST` / `PG_DATABASE` / `PG_PASSWORD` | Yes | PostgreSQL connection |
| `PG_PORT` | No | PostgreSQL port (default `5432`) |
| `PORT` | No | Backend port (default `3000`) |
| `NODE_ENV` | No | `development` or `production` |
| `CORS_ORIGIN` | No | Frontend origin for CORS (default `http://localhost:5173`) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `DEMO_EMAIL` | No | Account used by the "View demo" button (default `demo@example.com`) |

---

## Running the Database

The schema lives in `database/db_migrations.sql` (creates the `clio` schema and all tables) and demo data in `database/db_seeding.sql`. Run the commands below from the **project root**.

### Option A — local PostgreSQL

```bash
# 1. Create the database (name must match PG_DATABASE in .env)
psql -U postgres -c "CREATE DATABASE clio;"

# 2. Apply the schema (creates the `clio` schema + tables; drops existing ones first)
psql -U postgres -d clio -f database/db_migrations.sql

# 3. Load demo data (truncates and re-seeds — safe to re-run anytime)
psql -U postgres -d clio -f database/db_seeding.sql
```

### Option B — Docker

```bash
docker run -d --name clio-db \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=clio \
  -p 5432:5432 postgres:16

docker exec -i clio-db psql -U postgres -d clio < database/db_migrations.sql
docker exec -i clio-db psql -U postgres -d clio < database/db_seeding.sql
```

> Re-running `db_seeding.sql` resets all demo data. It's deterministic (`setseed`), so you get the same dataset each time: two users, two accounts each, and six months of realistic transactions (Jan–Jun 2026).

---

## Running the Backend

```bash
cd backend
npm install
npm start
```

`npm start` compiles the TypeScript (`prestart` → `tsc`) and runs `dist/server.js`. The API starts on `http://localhost:3000`. On boot it verifies the database connection and reconciles any statements left mid-processing by a previous crash. You should see:

```
Server running on port 3000
PostgreSQL connection verified successfully
```

---

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at **`http://localhost:5173`**. Vite proxies all `/api/*` requests to the backend at `http://localhost:3000`, so session cookies work without extra CORS setup.

---

## Logging In

Authentication is enforced — visiting the app redirects you to `/login`. You can:

- **Click "View demo"** to instantly sign into the demo account (`demo@example.com`) and explore the seeded data.
- **Log in or sign up** with the form.

Seeded users (password: **`password123`**):

| Email | Name | Notes |
|---|---|---|
| `demo@example.com` | Demo User | Used by the "View demo" button; fully populated |
| `casey.lin@example.com` | Casey Lin | Second sample user with its own accounts & data |

---

## Data Pipeline

When a PDF statement is uploaded, it flows through an asynchronous processing pipeline. The upload request returns immediately; the frontend polls `/statement/status` while the work happens in the background.

```
Upload PDF ──► insert statement row (status: queued)
                         │
                         ▼   (async, not awaited)
              dataParsing(statementId, file)
                         │
   status: processing ──►├─ 1. pdf-parse → raw text
                         ├─ 2. extract account metadata (bank, number, period)
                         ├─ 3. upsert the account row
   status: parsed ──────►├─ 4. update statement with parsed metadata
                         ├─ 5. extract transactions from the text
                         ├─ 6. classify + insert each transaction
                         ├─ 7. write the statement summary (income/expenses)
   status: complete ────►└─ 8. fire-and-forget batch LLM classification pass
                         
   (any error at steps 1–7) ──► status: failed (+ error message)
```

**Transaction classification** runs in tiers as each transaction is imported:

1. **Exact match** — known merchants mapped directly to a category with a confidence score (e.g. Starbucks → `coffee`, 0.98)
2. **Regex patterns** — keyword rules on the cleaned description (e.g. `/restaurant|bistro|grill/` → `dining_out`)
3. **Gemini AI (fallback)** — anything still unclassified after import is batched and sent to Gemini for a final pass, then written back

Merchant names are normalized before classification — stripping payment-processor prefixes (`SQ *`, `TST*`), corporate suffixes (`LLC`, `CORP`), store numbers, and phone numbers.

Because parsing is in-process and fire-and-forget, a server restart mid-parse would orphan a statement; on startup the backend marks any `queued`/`processing` statements as `failed` so the UI never spins forever.

---

## How the LLM Is Used

Clio uses **Google Gemini (`gemini-2.5-flash`)** for two distinct jobs, both isolated in `backend/src/gemini/gemini.ts`.

### 1. AI Chat — natural language → SQL → answer

When you ask a question in chat:

1. The backend sends Gemini a **system prompt** containing the database schema, today's date, the category taxonomy, and strict SQL rules, plus the **last 10 messages** for conversational context.
2. Gemini returns a small JSON object: a **parameterized `SELECT`**, its params, a natural-language `answer_template`, and an empty-result message.
3. The backend executes the query **safely** — only `SELECT` is allowed, and `user_id` is always injected server-side as `$1`, so the model can never read another user's data.
4. The rows are formatted into the answer template and saved to the chat thread.

The prompt is built to:
- **Understand varied phrasing** — casual, indirect, or abbreviated questions map to the same intent.
- **Answer abstract questions** — totals, averages, trends, top-N, comparisons, and ratios like savings rate.
- **Stay time-general** — it queries all data by default and only applies date filters when you mention a timeframe.
- **Exclude transfers** — savings transfers and card payments are treated as money movement, not spending or income.
- **Ask for clarification** when a finance question is genuinely ambiguous, and only fall back to a canned reply once it's confident the question isn't finance-related.

### 2. Batch transaction classification

After a statement is marked `complete`, any transactions the rule engine couldn't categorize are sent to Gemini in a single batch. Gemini returns a clean merchant name plus a category/subcategory and confidence for each, which are written back to the database. This runs in the background so newly uploaded data is visible immediately.

---

## API Overview

| Module | Base Path | Description |
|---|---|---|
| Auth | `/auth` | Register, login, logout, demo login, session check |
| Accounts | `/accounts` | Manage bank accounts |
| Statements | `/statement` | Upload and track PDF statements |
| Transactions | `/transaction` | View and manually correct transactions |
| Dashboard | `/dashboard` | Spending summaries and category breakdowns |
| Merchants | `/merchants` | View and rename merchants |
| Categories | `/categories` | Manage spending categories |
| Budgets | `/budgets` | Per-statement category budgets |
| Goals | `/goals` | Savings goals |
| Chat | `/chat` | AI-powered financial Q&A |

All routes except `/auth/login`, `/auth/register`, and `/auth/demo` require a valid session cookie.

**Key backend libraries:** `pg` (PostgreSQL), `bcryptjs` (password hashing), `multer` (PDF uploads), `pdf-parse` (PDF text extraction), `express-rate-limit` (auth brute-force protection).

---

## Supported Statement Formats

The PDF parser currently targets **Chase and Capital One credit card** statement layouts. Other banks and debit formats may not parse correctly and will be marked `failed` with an error message.
