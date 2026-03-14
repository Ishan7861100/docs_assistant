# DocMind – Ask Your Docs Assistant

A production-ready RAG (Retrieval-Augmented Generation) web application. Upload PDFs, DOCX, or TXT files and ask natural-language questions — get instant, cited answers powered by OpenAI + LangChain.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, TailwindCSS |
| Backend | Node.js, Express, TypeScript |
| AI / RAG | LangChain, OpenAI API |
| Vectors | Custom JSON vector store (cosine similarity) |
| Storage | Local filesystem + JSON |

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9 (or pnpm / yarn)
- **OpenAI API key** — get one at https://platform.openai.com

---

## Project Structure

```
docs-assistant/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/        # Auth & upload middleware
│   │   ├── routes/            # Express route definitions
│   │   ├── services/          # Business logic (vector, document, auth)
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Data store, text extractor
│   │   └── index.ts           # Entry point
│   ├── data/                  # Auto-created: users, docs metadata, vectors
│   ├── uploads/               # Auto-created: uploaded files
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/        # Sidebar, ChatInterface, MessageBubble, etc.
    │   ├── context/           # AuthContext
    │   ├── hooks/             # useDocuments, useChat
    │   ├── pages/             # Dashboard, Login, Register, Settings
    │   ├── services/          # API client (axios)
    │   ├── types/             # TypeScript types & helpers
    │   └── lib/               # Tailwind utility (cn)
    ├── .env.example
    └── package.json
```

---

## Setup & Run

### 1. Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and set:
#   JWT_SECRET=any-random-long-string
#   OPENAI_API_KEY=sk-your-key-here

# Start development server
npm run dev
# Runs at http://localhost:3001
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Runs at http://localhost:5173
```

### 3. Open app

Navigate to **http://localhost:5173**, create an account, and start uploading documents.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3001` |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:5173` |
| `JWT_SECRET` | JWT signing secret | **required** |
| `OPENAI_API_KEY` | OpenAI key (fallback) | — |
| `OPENAI_MODEL` | LLM model | `gpt-4o-mini` |
| `OPENAI_EMBEDDING_MODEL` | Embedding model | `text-embedding-3-small` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend base URL (leave blank to use Vite proxy) | — |

---

## API Endpoints

```
POST   /auth/register          Register new user
POST   /auth/login             Login, returns JWT
GET    /auth/me                Get current user (auth required)

POST   /documents/upload       Upload file (multipart/form-data, field: "file")
GET    /documents              List user's documents
GET    /documents/:id          Get document by ID
DELETE /documents/:id          Delete document + vectors
POST   /documents/:id/reprocess  Re-embed a document

POST   /chat                   Send message, get RAG answer
                               Body: { documentId?, message, conversationHistory? }

GET    /settings               Get user settings
PUT    /settings               Update settings (apiKey, model, systemPrompt)
POST   /settings/reset         Reset settings to defaults
```

---

## How RAG Works

1. **Upload** → File saved to `uploads/`, metadata saved to `data/documents.json`
2. **Process** → Text extracted (pdf-parse / mammoth / fs), split into ~1000-char chunks
3. **Embed** → Each chunk embedded with `text-embedding-3-small` via OpenAI
4. **Store** → Embeddings saved to `data/vectors/{documentId}.json`
5. **Query** → User question embedded, cosine similarity search finds top-5 chunks
6. **Answer** → Context + question sent to GPT-4o-mini via LangChain, response streamed back

---

## Per-User API Keys

Users can provide their own OpenAI API key in **Settings**. If set, it's used for both document processing and chat. Otherwise, the server's `OPENAI_API_KEY` env var is used.

---

## Production Build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
# Serve dist/ with any static host or nginx
```
