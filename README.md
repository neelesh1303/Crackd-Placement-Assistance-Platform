# Crackd — AI-Powered Placement Assistance Platform

> A full-stack MERN platform for technical-placement preparation using real interview experiences, company-specific preparation, AI-generated roadmaps, progress tracking, analytics, and a RAG-powered preparation assistant.

## 🚀 Overview

**Crackd** brings the major parts of placement preparation into one platform.

Students can:

- Explore companies and company-specific interview information
- Read and submit real interview experiences
- Review interview rounds and coding problems
- Generate personalized placement-preparation roadmaps
- Track preparation using checklists, readiness percentage, and study streaks
- Analyze interview trends collected from the platform
- Ask placement-preparation questions through an AI assistant
- Get AI answers grounded in embedded study notes and live MongoDB interview data
- Access protected features through JWT authentication

The platform uses a **React + Node.js + Express + MongoDB** architecture.

AI functionality is split across two workflows:

- **Hugging Face Inference API** → AI roadmap generation
- **Google Gemini API** → RAG embeddings and AI-powered preparation assistant

**Redis** is supported as an optional caching layer.

---

## ✨ Key Features

### 🔐 Authentication & Access Control

- User registration and login
- JWT-based authentication
- Protected frontend routes
- Protected backend APIs
- Password hashing with `bcryptjs`
- NIE college-email restriction using `@nie.ac.in`
- Request validation using `express-validator`

### 🏢 Company Explorer

- Browse companies available on the platform
- Company-specific difficulty information
- Company detail pages
- Company-specific interview preparation data
- Company slugs for clean URLs

### 📝 Interview Experience Sharing

Users can contribute interview experiences containing:

- Company
- Role
- Year
- Interview rounds
- Round type
- Questions/problems
- Preparation tips
- Offer outcome

This creates a shared interview-preparation knowledge base.

### 🤖 AI-Powered Roadmap Generator

The roadmap generator creates a preparation plan using:

- Target company
- Target role
- Number of preparation weeks
- Daily study hours
- Weak topics
- Strong topics
- Company-specific problem topics

The backend sends the preparation context to the **Hugging Face Inference API** and normalizes the returned roadmap.

Reliability mechanisms include:

- Strict JSON-only prompting
- Safe JSON extraction/parsing
- Response normalization
- In-memory roadmap caching
- Request timeout handling
- Automatic fallback roadmap generation when AI is unavailable

#### Roadmap fallback

If AI generation fails, Crackd can still construct a roadmap by combining:

- User-provided weak topics
- Company-specific topics
- Default preparation topics

This keeps roadmap generation functional even when the AI service is unavailable.

---

## 🧠 RAG-Powered Preparation Assistant

Crackd includes a simple **Retrieval-Augmented Generation (RAG)** chatbot for placement preparation.

The assistant combines two sources of context:

1. **Embedded study notes**
2. **Live MongoDB interview data**

### RAG pipeline

```text
                    User Question
                          │
                          ▼
                 Gemini Embedding API
                          │
                          ▼
                  Query Embedding
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
     KnowledgeChunk DB          MongoDB Interview Data
             │                         │
             │                  Topic / Year Filtering
             │                         │
             ▼                         ▼
     Cosine Similarity          Problems + Experiences
             │                         │
             └────────────┬────────────┘
                          ▼
                   Retrieved Context
                          │
                          ▼
                     Gemini LLM
                          │
                          ▼
                  Grounded Answer
                          │
                          ▼
                     Sources
```

### Knowledge-base ingestion

Study material is stored in:

```text
backend/src/data/knowledge/
```

Current knowledge files include:

```text
binary-search.md
interview-preparation.md
```

The ingestion utility:

1. Reads `.md` / `.txt` knowledge files
2. Splits text into chunks of up to 300 words
3. Generates Gemini embeddings
4. Stores chunks and embeddings in MongoDB
5. Makes them available for semantic retrieval

Run ingestion from the `backend` directory:

```bash
npm run ingest:knowledge
```

### Semantic retrieval

For a user question:

1. Gemini creates a query embedding.
2. Stored knowledge embeddings are loaded from MongoDB.
3. Crackd calculates **cosine similarity** between the query and stored chunks.
4. The top 4 matching chunks are retrieved.
5. Matching interview problems and experiences are also retrieved from MongoDB.
6. Both contexts are provided to Gemini.
7. Gemini generates the final answer.

The chatbot also returns retrieved sources with similarity scores where available.

### Database-aware retrieval

The assistant can detect supported topics and requested years from the question.

Supported topic aliases currently include:

- Binary Search
- Greedy
- Dynamic Programming
- Sliding Window
- Two Pointers
- Linked List
- Arrays
- Strings
- Trees
- Graphs

This allows questions about interview data to be filtered using the actual MongoDB records instead of relying only on generated knowledge.

The assistant is explicitly instructed not to invent companies, years, or interview questions when matching database records do not exist.

---

## 📈 Progress Tracking

Students can track:

- Weekly preparation plan
- Topic checklist
- `todo` / `in-progress` / `done` states
- Readiness percentage
- Completed topics
- Current streak
- Longest streak
- Last activity date

### Readiness

```text
Readiness % =
(completed topics / total topics) × 100
```

### Study streak

```text
Activity today
      │
      ├── Already active today → keep streak
      │
      ├── Active yesterday → increment streak
      │
      └── Otherwise → reset to 1
```

---

## 📊 Analytics Dashboard

The backend calculates analytics from interview experiences, including:

- Company-wise experience counts
- Offer rates
- Interview round frequency
- Year-wise experience trends
- Most common roles

MongoDB aggregation pipelines are used for these calculations.

---

## ⚡ Redis Caching

Redis is supported as an optional caching layer.

The application can continue running when Redis is unavailable instead of failing backend startup.

The roadmap controller also maintains a temporary in-memory cache for repeated AI roadmap requests with identical inputs.

---

## 🔄 CI Pipeline

GitHub Actions runs on:

- Pushes to `main`
- Pull requests targeting `main`

### Frontend CI

- Installs dependencies with `npm ci`
- Runs ESLint
- Runs the production build

### Backend CI

- Installs dependencies with `npm ci`
- Verifies that `src/app.js` loads successfully

Workflow:

```text
.github/workflows/ci.yml
```

---

## 🛠️ Tech Stack

### Frontend

- React 19
- React Router
- Vite
- Tailwind CSS
- Axios
- React Hot Toast

### Backend

- Node.js
- Express.js
- Mongoose
- JWT
- bcryptjs
- Express Validator
- Redis
- OpenAI SDK dependency
- Hugging Face Inference API
- Google Gemini API

### Database

- MongoDB

### AI

**Roadmap generation**

- Hugging Face Inference API
- Configurable model through `HF_MODEL`

**RAG / chatbot**

- Gemini generative model through `GEMINI_MODEL`
- Gemini Embeddings through `GEMINI_EMBEDDING_MODEL`
- 768-dimensional stored embeddings
- Cosine-similarity retrieval

### DevOps / Tooling

- Git
- GitHub
- GitHub Actions
- ESLint
- Nodemon

---

## 🏗️ Architecture

```text
                         ┌─────────────────────┐
                         │       Student       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   React Frontend    │
                         │ React Router / Axios │
                         │     Tailwind CSS    │
                         └──────────┬──────────┘
                                    │ REST API
                                    ▼
                         ┌─────────────────────┐
                         │  Express.js Backend │
                         │                     │
                         │ Routes              │
                         │ Controllers         │
                         │ Middleware          │
                         │ Services            │
                         └──────┬───────┬──────┘
                                │       │
               ┌────────────────┘       └─────────────────┐
               ▼                                          ▼
      ┌─────────────────┐                       ┌──────────────────┐
      │     MongoDB     │                       │   AI Services    │
      │                 │                       │                  │
      │ Users           │                       │ Hugging Face     │
      │ Companies       │                       │ Gemini           │
      │ Experiences     │                       │                  │
      │ Problems        │                       └──────────────────┘
      │ Trackers        │
      │ KnowledgeChunks │
      └────────┬────────┘
               │
               ▼
      ┌─────────────────┐
      │      Redis      │
      │ Optional Cache  │
      └─────────────────┘
```

---

## 📁 Project Structure

```text
Crackd-Placement-Assistance-Platform/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── redis.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── analyticsController.js
│   │   │   ├── authController.js
│   │   │   ├── chatController.js
│   │   │   ├── companyController.js
│   │   │   ├── experienceController.js
│   │   │   ├── problemController.js
│   │   │   ├── roadmapController.js
│   │   │   └── trackerController.js
│   │   │
│   │   ├── data/
│   │   │   └── knowledge/
│   │   │       ├── binary-search.md
│   │   │       └── interview-preparation.md
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── collegeEmail.js
│   │   │
│   │   ├── models/
│   │   │   ├── Company.js
│   │   │   ├── Experience.js
│   │   │   ├── KnowledgeChunk.js
│   │   │   ├── Problem.js
│   │   │   ├── Tracker.js
│   │   │   └── User.js
│   │   │
│   │   ├── routes/
│   │   │   ├── analyticsRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── chatRoutes.js
│   │   │   ├── companyRoutes.js
│   │   │   ├── experienceRoutes.js
│   │   │   ├── problemRoutes.js
│   │   │   ├── roadmapRoutes.js
│   │   │   └── trackerRoutes.js
│   │   │
│   │   ├── services/
│   │   │   └── ragService.js
│   │   │
│   │   ├── utils/
│   │   │   ├── ingestKnowledge.js
│   │   │   └── seedCompanies.js
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   │   ├── Chat.jsx
│   │   │   ├── Companies.jsx
│   │   │   ├── CompanyDetail.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ProgressDashboard.jsx
│   │   │   ├── RoadmapDetailsPage.jsx
│   │   │   └── RoadmapGenerator.jsx
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 🔌 API Modules

The backend exposes REST APIs under `/api`.

| Module | Base Route | Purpose |
|---|---|---|
| Authentication | `/api/auth` | Register and login |
| Companies | `/api/companies` | Company data |
| Experiences | `/api/experiences` | Interview experiences |
| Problems | `/api/problems` | Interview/coding problems |
| Roadmap | `/api/roadmap` | AI roadmap generation |
| Tracker | `/api/tracker` | Preparation progress |
| Analytics | `/api/analytics` | Placement analytics |
| Chat | `/api/chat` | RAG-powered preparation assistant |
| Health | `/api/health` | Backend health check |

### Chat endpoint

```text
POST /api/chat
```

The route is protected by JWT authentication.

Request:

```json
{
  "question": "How should I prepare binary search for interviews?"
}
```

The endpoint validates the question, retrieves relevant context, generates the answer, and returns the answer with retrieved sources.

---

## 🔑 Authentication Flow

```text
User
 │
 ├── Register / Login
 │
 ▼
Backend
 │
 ├── Validate credentials
 ├── Hash / check password
 └── Generate JWT
 │
 ▼
Frontend
 │
 └── Authorization: Bearer <token>
 │
 ▼
Auth Middleware
 │
 ├── Extract token
 ├── Verify JWT
 └── Attach user information
 │
 ▼
Protected Controller
```

---

## 🤖 AI Roadmap Flow

```text
User Inputs
    │
    ├── Company
    ├── Role
    ├── Weeks
    ├── Hours/day
    ├── Weak topics
    └── Strong topics
          │
          ▼
   Backend Validation
          │
          ▼
   Find Company Topics
          │
          ▼
   Hugging Face API
          │
          ▼
   Parse + Normalize JSON
          │
          ├───────────────┐
          │               │
       Success          Failure
          │               │
          ▼               ▼
   AI Roadmap        Fallback Roadmap
          │               │
          └───────┬───────┘
                  ▼
             Save Tracker
                  │
                  ▼
          Progress Dashboard
```

The roadmap controller caches successful AI-generated results temporarily for repeated identical inputs.

---

## 🧩 RAG Ingestion Flow

```text
Markdown / TXT files
        │
        ▼
   Split into chunks
   (up to 300 words)
        │
        ▼
 Gemini Embedding API
        │
        ▼
  768-D embeddings
        │
        ▼
 MongoDB KnowledgeChunk
```

Run:

```bash
npm run ingest:knowledge
```

This recreates the knowledge chunks and embeddings from the files under `backend/src/data/knowledge/`.

---

## 🧮 RAG Retrieval Flow

```text
Question
   │
   ▼
Gemini query embedding
   │
   ▼
Cosine similarity
   │
   ▼
Top 4 knowledge chunks
   │
   ├───────────────┐
   │               │
   ▼               ▼
Study notes    MongoDB interview data
   │               │
   └───────┬───────┘
           ▼
     Context prompt
           │
           ▼
       Gemini model
           │
           ▼
      Final answer
           │
           ▼
   Retrieved sources
```

---

## ⚙️ Environment Variables

Create a `.env` file inside `backend`.

Example:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

HF_API_TOKEN=your_huggingface_token
HF_MODEL=meta-llama/Llama-3.1-8B-Instruct
HF_TIMEOUT_MS=60000

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

PORT=5000
```

If Redis is configured, add:

```env
REDIS_URL=your_redis_connection_url
```

> Never commit `.env` files or API keys to GitHub.

---

## 💻 Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/neelesh1303/Crackd-Placement-Assistance-Platform.git
cd Crackd-Placement-Assistance-Platform
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create:

```text
backend/.env
```

and configure MongoDB, JWT, Hugging Face, Gemini, and optional Redis settings.

### 4. Start the backend

Development mode:

```bash
npm run dev
```

Production-style start:

```bash
npm start
```

### 5. Install frontend dependencies

Open another terminal:

```bash
cd frontend
npm install
```

### 6. Start the frontend

```bash
npm run dev
```

Vite will provide the local development URL in the terminal.

### 7. Build the RAG knowledge base

After configuring `GEMINI_API_KEY` and MongoDB:

```bash
cd backend
npm run ingest:knowledge
```

This step is required to populate `KnowledgeChunk` documents for semantic retrieval.

---

## 🌱 Seed Companies

The backend includes a company seeding utility.

From the `backend` directory:

```bash
npm run seed:companies
```

---

## 🧪 CI / GitHub Actions

The project uses:

```text
.github/workflows/ci.yml
```

On pushes and pull requests targeting `main`, the pipeline:

1. Installs frontend dependencies with `npm ci`
2. Runs frontend ESLint
3. Runs the frontend production build
4. Installs backend dependencies with `npm ci`
5. Verifies that the Express application loads successfully

---

## 🔒 Security Considerations

The project includes:

- Password hashing using `bcryptjs`
- JWT authentication
- Protected API routes
- Protected frontend routes
- College-email validation
- Request validation using `express-validator`
- Environment variables for secrets
- CORS configuration
- Optional Redis caching
- Input-length validation for chat requests

For production deployment, additional hardening such as stricter CORS policies, secure cookie/token strategies, rate limiting, logging, and managed secret storage should be configured according to the deployment environment.

---

## 🌐 Deployment

The application can be deployed as separate frontend and backend services.

### Frontend

Possible platforms include:

- Vercel
- Netlify
- Render

### Backend

Possible platforms include:

- Render
- Railway
- AWS
- Other Node.js-compatible hosting platforms

### Database

- MongoDB Atlas

### AI Services

- Hugging Face Inference API
- Google Gemini API

### Cache

- Redis-compatible managed service

Make sure the deployed frontend points to the deployed backend API and that all required environment variables are configured in the hosting platform.

---

## 🔮 Future Improvements

Potential improvements include:

- Vector database for scalable semantic retrieval
- More advanced chunking strategies
- Metadata filtering for RAG retrieval
- Reranking retrieved chunks
- Streaming chatbot responses
- Conversation history
- Resume analysis and job matching
- AI-powered mock interviews
- AI-generated interview question explanations
- Email notifications for preparation milestones
- More granular role-specific roadmaps
- Persistent distributed caching
- Automated API tests
- More comprehensive observability and error tracking

---

## 👨‍💻 Author

**Neelesh Kumar Tripathi**

- GitHub: [neelesh1303](https://github.com/neelesh1303)
- Codolio: [neelesh1303](https://codolio.com/profile/neelesh1303)

---

## ⭐ Support

If you find Crackd useful, consider giving the repository a ⭐ on GitHub.
