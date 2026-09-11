# 16 — Developer Runbook

## Goal

Run the entire Nookly MVP locally.

## Components

- frontend
- FastAPI backend
- SQLite
- Qdrant
- Gemini API
- faster-whisper

## Environment variables

Example:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=
DATABASE_URL=sqlite:///./amenityos.db
QDRANT_URL=http://localhost:6333
APP_TIMEZONE=Asia/Kolkata
```

Never commit `.env`.

## Start Qdrant

Run Qdrant locally with Docker using the current official Qdrant instructions.

Expected endpoint:

```text
http://localhost:6333
```

## Backend

Create virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install:

```bash
pip install -r requirements.txt
```

Seed:

```bash
python scripts/seed.py
```

Ingest guidelines:

```bash
python scripts/ingest_guidelines.py
```

Run:

```bash
uvicorn app.main:app --reload
```

## Frontend

From the frontend directory:

```bash
npm install
npm run dev
```

## Demo sequence

### Demo 1 — Free booking

Say:

> Book Emerald Meeting Room today at 3 PM for five people.

Expected:

- room found
- availability confirmed
- booking created
- QR generated

### Demo 2 — Unavailable

Say:

> Book Emerald at 3 PM.

Expected:

- current slot unavailable
- valid alternatives returned

### Demo 3 — Paid amenity

Say:

> Book the gym at 6 PM.

Expected:

- availability
- cost
- current credit balance
- confirmation question

Then:

> Yes.

Expected:

- booking created
- credits deducted atomically
- confirmation returned

### Demo 4 — Insufficient credits

Use a user with insufficient credits.

Expected:
- no booking
- no credit deduction

### Demo 5 — Policy

Ask:

> Can external guests use Emerald?

Expected:
- policy retrieval
- concise grounded answer

### Demo 6 — Access

Open QR/access page and verify a valid and expired token.

## Debugging order

When an agent request fails:

1. inspect frontend request
2. inspect `/api/agent/chat`
3. inspect agent trace
4. inspect tool selection
5. inspect tool arguments
6. inspect backend tool result
7. inspect database state
8. inspect final model response

Do not change the system prompt first.

A deterministic backend bug should be fixed in deterministic code.
