# QuizForge

**QuizForge** is an enterprise-grade technical assessment platform and coding workspace featuring automated grading, sandboxed in-browser code execution, cloud workspace integration, and tamper-resistant compliance audit logs.

---

## Features

- **Quiz Management**: Create, edit, and orchestrate technical evaluations with multiple-choice questions and interactive coding challenges.
- **Role-Based Access Control (RBAC)**: Distinct administrator management panel and student/candidate workspace with server-enforced route permissions.
- **Timed Quizzes & Attempt Limits**: Server-side countdown timers with automated submission on expiration and configurable attempt limits.
- **Instant Auto-Grading**: Deterministic scoring evaluation for both standard questions and code submissions with full question-by-question answer breakdowns.
- **Monaco Coding Workspace**: In-browser code editor with syntax highlighting, line numbering, instant test suite runner, and optional full cloud container IDE integration (Coder).
- **Audit Logging**: Immutable, filterable audit trails tracking authentication, quiz creation, attempt submissions, and administrative events.
- **Analytics Dashboard**: Cohort metrics on participant attempts, pass benchmarks, and average score distributions.
- **CSV Export**: One-click structured exports of student grade books, detailed attempt results, and security audit log streams.

---

## Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Lucide React, Monaco Editor
- **Backend**: Node.js, Express, Better-SQLite3 (WAL mode)
- **Authentication**: Bcrypt password hashing, token-based session verification

---

## Project Structure

```
QuizForge/
├── server/
│   ├── db.js             # SQLite initialization with better-sqlite3 & WAL mode
│   ├── seed.js           # Seeds admin, student, sample quizzes & coding challenges
│   └── index.js          # Express API server (port 4000)
├── src/
│   ├── components/       # UI components (Navbar, Sidebar, Card, Button, Table, Badge, CodingWorkspace, Modal)
│   ├── context/          # AuthContext with token management, user state, and RBAC
│   ├── lib/              # Centralized API client calling backend routes
│   ├── pages/
│   │   ├── Landing.tsx   # Minimalist Coder-inspired landing page with Monaco demo
│   │   ├── Login.tsx     # Sign-in page with quick seed account fill
│   │   ├── admin/        # Admin management panel (/admin, quizzes, attempts, audit logs, analytics)
│   │   └── user/         # Student portal (/app, take quiz, coding workspace, history)
│   ├── App.tsx           # React Router configuration
│   └── main.tsx          # Client entry point
├── vite.config.ts        # Vite configuration with /api proxy to backend (port 4000)
├── index.html            # Entry HTML with custom QuizForge SVG favicon and typography
└── package.json          # Scripts to run frontend and backend simultaneously
```

---

## Getting Started

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- npm

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Copy the example environment file and configure variables as needed:
```bash
cp .env.example .env
```
Default configuration:
- `VITE_CODER_URL`: `http://localhost:3000` (optional external Coder server)
- `PORT`: `4000` (backend Express server)

### 4. Development
Start both the backend API and frontend Vite server concurrently:
```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:4000](http://localhost:4000)
- The frontend automatically proxies all `/api` requests to `http://127.0.0.1:4000`.

### 5. Production Build
```bash
npm run build
```

---

## Seed Accounts

For quick local testing and evaluation, the database initializes with two pre-configured accounts:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Admin** | `admin@quizforge.com` | `Admin@123` | Full admin panel, create/edit quizzes, review all attempts, security audit logs |
| **Student** | `user@quizforge.com` | `User@123` | Student portal, take quizzes, built-in coding workspace, attempt history |

---

## License

MIT
