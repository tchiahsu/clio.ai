# CLIO — AI-Powered Personal Finance Dashboard

Clio is a full-stack personal finance dashboard that parses bank statements, automatically categorizes transactions, and lets you ask natural language questions about your finances through an AI-powered chat interface.

---

## Features

- **PDF Statement Parsing** — Upload bank statement PDFs and have transactions automatically extracted and imported
- **Smart Transaction Classification** — Three-tier system using exact merchant matching, regex pattern rules, and Gemini AI as a fallback classifier
- **Spending Dashboard** — View income, expenses, net cash flow, and category breakdowns by statement
- **Budget Overview** — Compare income, spending, and savings across months
- **Merchant Management** — Rename merchants with per-user display name overrides
- **AI Chat** — Ask natural language questions about your finances and get answers backed by real data
- **Manual Corrections** — Reassign transaction categories and merchants after import

---

## Getting Backend Started

### Prerequisites

- Node.js v18+
- PostgreSQL 14+

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/clio.git
cd clio/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the `backend/` directory:

```env
PG_USER=postgres
PG_HOST=localhost
PG_DATABASE=clio
PG_PASSWORD=yourpassword
PG_PORT=5432

PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

GEMINI_API_KEY=your_gemini_api_key
```

Get a free Gemini API key at [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey).

### 4. Set up the database

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE clio;"

# Apply the schema
psql -U postgres -d clio -f schema.sql

# Seed with sample data (optional)
psql -U postgres -d clio -f seed.sql
```

### 5. Start the server

```bash
npm run dev
```

The server starts on `http://localhost:3000`. You should see:
```
Server running on port 3000
PostgreSQL connection verified successfully
```

---

## Getting Frontend Running

```bash
# change directory into 'frontend'
cd frontend

# install all Node.js/React dependencies
npm install

# run the React development server (via Vite)
npm run dev
```
The frontend will now be running at: **`http://localhost:5173`**


---

## API Overview

| Module | Base Path | Description |
|---|---|---|
| Auth | `/auth` | Register, login, logout, session check |
| Accounts | `/accounts` | Manage bank accounts |
| Statements | `/statement` | Upload and track PDF statements |
| Transactions | `/transaction` | View and manually correct transactions |
| Dashboard | `/dashboard` | Spending summaries and category breakdowns |
| Merchants | `/merchants` | View and rename merchants |
| Categories | `/categories` | Manage spending categories |
| Chat | `/chat` | AI-powered financial Q&A |

All endpoints except `/auth/login` and `/auth/register` require authentication via session cookie.

**Key Libraries**
- `pg` — PostgreSQL client
- `bcryptjs` — Password hashing
- `multer` — PDF file uploads
- `pdf-parse` — PDF text extraction
- `express-rate-limit` — Auth brute force protection

---

## How Transaction Classification Works

Transactions go through a three-tier classification pipeline:

1. **Exact Match** — ~150 known merchants mapped directly to categories with confidence scores (e.g. Starbucks → coffee, 0.98)
2. **Regex Patterns** — Keyword rules applied to the transaction description (e.g. `/restaurant|bistro|grill/` → dining_out)
3. **Gemini AI** — Unclassified transactions are batched and sent to Gemini after import for a final classification pass

Merchant names are normalized before classification — stripping payment processor prefixes (`SQ *`, `TST*`), corporate suffixes (`LLC`, `CORP`), store numbers, and phone numbers to extract clean merchant names.

---

## How the AI Chat Works

The chat sends user questions to Gemini along with the database schema and the last 10 messages for conversational context. Gemini generates a parameterized SQL query which the backend executes safely — `user_id` is always enforced server-side so the LLM can never access another user's data. Results are formatted into a natural language response and saved to the chat thread.

Questions outside the scope of personal finance are politely declined.

---

## Supported Statement Formats

The PDF parser currently supports **Chase and Capital One credit card** statement formats. Other banks and debit account statements may not parse correctly — they will be marked as `failed` with an error message.

---

## Seed Data

The seed file includes three demo users, all with password `password123`:

| Email | Name |
|---|---|
| demo@example.com | Demo User |
| admin@example.com | Admin User |

Each user has multiple bank accounts, statements, and transactions pre-populated for testing.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PG_USER` | Yes | PostgreSQL username |
| `PG_HOST` | Yes | PostgreSQL host |
| `PG_DATABASE` | Yes | Database name |
| `PG_PASSWORD` | Yes | PostgreSQL password |
| `PG_PORT` | No | PostgreSQL port (default: 5432) |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `development` or `production` |
| `CORS_ORIGIN` | No | Frontend URL for CORS (default: http://localhost:5173) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
