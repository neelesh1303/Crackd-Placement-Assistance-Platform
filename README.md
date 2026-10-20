# Crackd — Placement Assistance Platform

Crackd is a MERN application for placement preparation. Students can explore companies, share interview experiences, generate and track study roadmaps, and ask an AI assistant questions grounded in available interview data.

## Features

- **Accounts:** registration for `@nie.ac.in` addresses, password hashing, JWT login, and protected pages and APIs.
- **Company explorer:** searchable company directory and company detail pages.
- **Interview experiences:** browse and submit interview experiences with rounds, questions, topics, tips, resources, and offer outcomes.
- **AI roadmaps:** generate a weekly study plan with Google Gemini using the target role, company, preparation duration, available hours, and selected strong/weak topics. If Gemini is not configured or generation fails, the API returns a template roadmap.
- **Progress tracking:** save one active roadmap per user, update checklist status, and view readiness and study streak information.
- **Preparation assistant:** ask questions about indexed interview experiences. Answers include source details when relevant data is available.
- **Analytics and problem APIs:** backend endpoints expose experience analytics and interview-problem data.

## Technology

| Area | Technologies |
|---|---|
| Frontend | React 19, React Router, Vite, Tailwind CSS, Axios |
| Backend | Node.js, Express 5, Mongoose, JWT, bcryptjs |
| Database | MongoDB |
| AI | Google Gemini API for roadmap generation, text generation, and embeddings |
| Optional cache | Redis |
| Testing | Node.js `node:test`, Jest, Supertest |
| CI | GitHub Actions |

## Application structure

```text
.
├── .github/workflows/ci.yml
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB and Redis setup
│   │   ├── controllers/     # API request handlers
│   │   ├── middleware/      # JWT and college-email checks
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # Express route modules
│   │   ├── services/        # Gemini and retrieval logic
│   │   ├── utils/           # Company seeding and experience indexing
│   │   ├── app.js           # Express app, exported for tests
│   │   └── server.js        # Database/cache connections and listener
│   ├── test/                # Unit and API integration tests
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/api.js
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
└── README.md
```

## Frontend pages

Public routes:

- `/` — landing page
- `/login` — sign in
- `/register` — create an account

Protected routes:

- `/dashboard` — preparation dashboard
- `/companies` — company directory
- `/companies/:slug` — company information and related interview experiences
- `/add-experience` — submit an interview experience
- `/roadmap` — generate a roadmap
- `/progress` — review tracker progress
- `/roadmap-details/:companySlug` — view saved roadmap details
- `/chat` — AI preparation assistant

The frontend stores the JWT in `localStorage` and attaches it as a Bearer token to API requests. In development, the API defaults to `http://localhost:5000/api`; configure `VITE_API_BASE_URL` to point to another backend.

## Backend API

All endpoints are mounted under `/api`. Protected endpoints require:

```http
Authorization: Bearer <JWT>
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | Check that the API is running |
| `POST` | `/api/auth/register` | Public | Register an NIE student |
| `POST` | `/api/auth/login` | Public | Authenticate and receive a JWT |
| `GET` | `/api/auth/me` | Protected | Get the current user |
| `GET` | `/api/companies` | Public | List companies; Redis may cache this result |
| `GET` | `/api/companies/:slug` | Public | Get one company by slug |
| `GET` | `/api/experiences` | Public | List experiences; optional `company`, `year`, and `role` query filters |
| `POST` | `/api/experiences` | Protected | Create an interview experience |
| `GET` | `/api/problems` | Protected | List problems; optional `company`, `difficulty`, `topic`, `role`, and `q` filters |
| `POST` | `/api/problems` | Protected | Add an interview problem |
| `POST` | `/api/roadmap/generate` | Protected | Generate a Gemini or fallback roadmap |
| `POST` | `/api/tracker/save-roadmap` | Protected | Save or replace the user's active roadmap |
| `GET` | `/api/tracker` | Protected | Get the active tracker |
| `PUT` | `/api/tracker/checklist` | Protected | Update a checklist item |
| `GET` | `/api/tracker/streak` | Protected | Get streak details |
| `GET` | `/api/tracker/readiness` | Protected | Get readiness details |
| `GET` | `/api/analytics/summary` | Protected | Get experience analytics |
| `POST` | `/api/chat` | Protected | Ask the preparation assistant a question |

### Generate a roadmap

`POST /api/roadmap/generate` accepts a JSON body such as:

```json
{
  "companySlug": "google",
  "role": "SWE Intern",
  "weeks": 8,
  "hoursPerDay": 3,
  "weakTopics": ["Dynamic Programming"],
  "strongTopics": ["Arrays"]
}
```

The response includes roadmap metadata, a `weeklyPlan`, a `checklist`, and `source`, which is `gemini` or `fallback`. Company problem topics are included when available.

### Chat

`POST /api/chat` accepts:

```json
{
  "question": "What interview topics have been reported for Google?"
}
```

The question is required and limited to 1,000 characters. The response contains an answer and any retrieved sources.

## AI and retrieval

Roadmap generation and the preparation assistant use the existing Gemini service configuration:

- `GEMINI_API_KEY` authenticates requests.
- `GEMINI_MODEL` selects the text-generation model.
- `GEMINI_EMBEDDING_MODEL` selects the embedding model.

When a new interview experience is submitted, the backend attempts to index it in the `KnowledgeChunk` collection using a Gemini embedding. The `ingest:knowledge` command can sync existing MongoDB experiences into that collection. There are currently no bundled Markdown/TXT knowledge files.

For chat questions, the service compares query embeddings with stored experience embeddings using cosine similarity. If semantic results are unavailable, it can look for experiences belonging to a company explicitly mentioned in the question. Gemini is used to formulate an answer from the retrieved context; if no context is found, the assistant reports that it has no matching interview knowledge.

The roadmap generator keeps successful responses in an in-memory cache for 10 minutes. Company-list results can be cached in Redis. Redis is optional: the backend continues without it if the connection is unavailable.

## Requirements

- Node.js 20 or newer
- npm
- MongoDB connection string
- Gemini API key for AI generation and embeddings
- Redis is optional

## Local development

### 1. Install dependencies

From the repository root:

```bash
cd backend
npm ci
```

In another terminal:

```bash
cd frontend
npm ci
```

### 2. Configure the backend

Copy `backend/.env.example` to `backend/.env` and set the required values:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_TIMEOUT_MS=60000
PORT=5000
```

Optionally configure Redis:

```env
REDIS_URL=redis://localhost:6379
```

Do not commit `.env` files or expose API keys and database credentials.

### 3. Start the backend

From `backend/`:

```bash
npm run dev
```

The API listens on the configured `PORT` (default `5000`).

### 4. Start the frontend

From `frontend/`:

```bash
npm run dev
```

Vite prints the local frontend URL in the terminal. To use a non-default backend, set `VITE_API_BASE_URL` in `frontend/.env`; for example, `http://localhost:5000`. The frontend adds `/api` unless the configured URL already ends in `/api`.

## Database utilities

Run these commands from `backend/`.

### Seed companies

```bash
npm run seed:companies
```

**Warning:** the seed script deletes all documents in the `companies` collection before inserting its built-in sample companies. Use only with a development/test database unless that replacement is intended.

### Index existing interview experiences

```bash
npm run ingest:knowledge
```

This connects to MongoDB and syncs stored experiences into the `KnowledgeChunk` collection, generating embeddings when Gemini is available.

## Tests

From `backend/`:

```bash
npm test
```

This runs:

- `npm run test:unit` — Node.js `node:test` coverage for JWT auth middleware and the college-email middleware.
- `npm run test:api` — Jest + Supertest integration tests for roadmap generation and company lookup by slug.

The API tests mock company database lookups and Gemini's HTTP response. They do not call Gemini or require production database access.

## Continuous integration

GitHub Actions workflow: `.github/workflows/ci.yml`

On pushes to `main` and pull requests targeting `main`, CI:

1. Installs frontend and backend dependencies using `npm ci`.
2. Runs frontend ESLint and a production build.
3. Runs backend unit tests and Jest/Supertest API tests as separate steps.
4. Checks that the backend Express app loads.

## Deployment

Deploy the frontend and backend as separate services or use another compatible deployment setup.

- **Frontend:** set `VITE_API_BASE_URL` to the public backend URL. The frontend appends `/api` automatically unless it is already present.
- **Backend:** configure `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, and `GEMINI_EMBEDDING_MODEL` in the hosting platform's secret/environment settings. `PORT` is typically provided by the host.
- **Redis:** optional; configure `REDIS_URL` only when using a Redis service.

The backend's health endpoint is `GET /api/health`.

## Security notes

- Passwords are hashed with `bcryptjs`.
- Protected API endpoints use JWT authentication.
- Registration is restricted to `@nie.ac.in` email addresses.
- Keep credentials in environment variables or managed deployment secrets.
- The current project does not configure rate limiting or a restrictive CORS origin policy; add production-specific controls before public deployment.

---

**Author:** Neelesh Kumar Tripathi · GitHub: [neelesh1303](https://github.com/neelesh1303) · Codolio: [neelesh1303](https://codolio.com/profile/neelesh1303)
