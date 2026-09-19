# Crackd — AI-Powered Placement Assistance Platform

> A full-stack MERN platform designed to help students prepare for technical placements through real interview experiences, company-specific preparation, AI-generated roadmaps, and progress tracking.

## 🚀 Overview

**Crackd** brings the major parts of placement preparation into one platform.

Students can:

- Explore companies and company-specific interview information
- Read and submit real interview experiences
- Review interview rounds and coding problems
- Generate personalized placement-preparation roadmaps
- Track preparation using checklists, readiness percentage, and study streaks
- View analytics based on collected interview experiences
- Access protected features through JWT authentication

The platform is built with a **React + Node.js + Express + MongoDB** architecture, with **Hugging Face** used for AI-powered roadmap generation and **Redis** available as a caching layer.

---

## ✨ Key Features

### 🔐 Authentication & Access Control
- User registration and login
- JWT-based authentication
- Protected frontend routes
- Protected backend APIs
- Password hashing with `bcryptjs`
- NIE college-email restriction using `@nie.ac.in`

### 🏢 Company Explorer
- Browse companies available on the platform
- Company-specific difficulty information
- Company detail pages
- Company-specific interview preparation data
- Company slugs for clean URLs

### 📝 Interview Experience Sharing
Users can contribute interview experiences containing information such as:

- Company
- Role
- Year
- Interview rounds
- Round type
- Questions/problems
- Preparation tips
- Offer outcome

This creates a shared knowledge base for future candidates.

### 🤖 AI-Powered Roadmap Generator
The roadmap generator creates a preparation plan based on:

- Target company
- Target role
- Number of preparation weeks
- Daily study hours
- Weak topics
- Strong topics
- Company-specific problem topics

The backend uses the **Hugging Face Inference API** to generate weekly plans.

To make the feature reliable, the application also includes:

- AI response normalization
- Safe JSON parsing
- In-memory roadmap caching
- Request timeout handling
- Automatic fallback roadmap generation when AI is unavailable

### 📈 Progress Tracking
Students can track:

- Weekly preparation plan
- Topic checklist
- `todo` / `in-progress` / `done` states
- Readiness percentage
- Completed topics
- Current streak
- Longest streak
- Last activity date

### 📊 Analytics Dashboard
The backend calculates analytics from interview experiences, including:

- Company-wise experience counts
- Offer rates
- Interview round frequency
- Year-wise experience trends
- Most common roles

MongoDB aggregation pipelines are used for these calculations.

### ⚡ Redis Caching
Redis is supported as an optional caching layer.

If Redis is unavailable, the backend continues running without cache instead of failing application startup.

### 🔄 CI Pipeline
GitHub Actions automatically checks the project on pushes and pull requests to `main`.

The frontend CI performs:

- Dependency installation
- ESLint checks
- Production build verification

The backend CI performs:

- Dependency installation
- Application-load verification

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

### Database
- MongoDB

### AI
- Hugging Face Inference API
- Default model: `mistralai/Mistral-7B-Instruct-v0.3`

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
                        │  React Router       │
                        │  Axios              │
                        │  Tailwind CSS       │
                        └──────────┬──────────┘
                                   │ REST API
                                   ▼
                        ┌─────────────────────┐
                        │ Express.js Backend  │
                        │                     │
                        │ Routes              │
                        │ Controllers         │
                        │ Middleware          │
                        └──────┬───────┬──────┘
                               │       │
                 ┌─────────────┘       └─────────────┐
                 ▼                                   ▼
        ┌─────────────────┐                 ┌─────────────────┐
        │    MongoDB      │                 │ Hugging Face    │
        │   + Mongoose    │                 │ Inference API   │
        └─────────────────┘                 └─────────────────┘
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
│   │   │   ├── companyController.js
│   │   │   ├── experienceController.js
│   │   │   ├── problemController.js
│   │   │   ├── roadmapController.js
│   │   │   └── trackerController.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── collegeEmail.js
│   │   │
│   │   ├── models/
│   │   │   ├── Company.js
│   │   │   ├── Experience.js
│   │   │   ├── Problem.js
│   │   │   ├── Tracker.js
│   │   │   └── User.js
│   │   │
│   │   ├── routes/
│   │   │   ├── analyticsRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── companyRoutes.js
│   │   │   ├── experienceRoutes.js
│   │   │   ├── problemRoutes.js
│   │   │   ├── roadmapRoutes.js
│   │   │   └── trackerRoutes.js
│   │   │
│   │   ├── utils/
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
| Health | `/api/health` | Backend health check |

---

## 🔑 Authentication Flow

Crackd uses JWT-based authentication.

```text
User
 │
 ├── Register/Login
 │
 ▼
Backend
 │
 ├── Validate credentials
 ├── Hash/check password
 └── Generate JWT
 │
 ▼
Frontend
 │
 └── Sends:
     Authorization: Bearer <token>
 │
 ▼
Auth Middleware
 │
 ├── Extract token
 ├── Verify JWT
 └── Attach user information to request
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

The roadmap controller also caches successful AI-generated results temporarily to avoid unnecessary repeated AI requests for identical inputs.

---

## 📊 Progress Calculation

### Readiness

Readiness is calculated from completed checklist topics:

```text
Readiness % =
(completed topics / total topics) × 100
```

### Study Streak

The application checks the user's last activity date:

```text
Activity today
      │
      ├── Already active today → keep streak
      │
      ├── Active yesterday → increment streak
      │
      └── Otherwise → reset to 1
```

The platform also maintains the user's longest streak.

---

## ⚙️ Environment Variables

Create a `.env` file inside the `backend` directory.

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

HF_API_TOKEN=your_huggingface_token
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.3
HF_TIMEOUT_MS=5000

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

### 3. Configure backend environment variables

Create:

```text
backend/.env
```

and add the required MongoDB, JWT, Hugging Face, and optional Redis configuration.

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

---

## 🌱 Seed Companies

The backend includes a company seeding utility.

From the `backend` directory:

```bash
npm run seed:companies
```

---

## 🧪 CI / GitHub Actions

The project uses GitHub Actions through:

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

The project includes several security-oriented mechanisms:

- Password hashing using `bcryptjs`
- JWT authentication
- Protected API routes
- Protected frontend routes
- College email validation
- Request validation using `express-validator`
- Environment variables for secrets
- CORS configuration
- Redis support for caching

For production deployment, additional hardening such as stricter CORS policies, secure cookie/token strategies, rate limiting, logging, and secret management should be configured according to the deployment environment.

---

## 🌐 Deployment

The application can be deployed as separate frontend and backend services.

### Frontend
Suitable platforms include:

- Vercel
- Netlify
- Render

### Backend
Suitable platforms include:

- Render
- Railway
- AWS
- Other Node.js-compatible hosting platforms

### Database
- MongoDB Atlas

### Cache
- Redis-compatible managed service

Make sure the deployed frontend points to the deployed backend API and that all required environment variables are configured in the hosting platform.

---

## 🔮 Future Improvements

Potential improvements include:

- Real-time collaborative interview preparation
- More detailed company-wise question analytics
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

