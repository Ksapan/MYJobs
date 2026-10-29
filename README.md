# 🚀 MyJobs Portal — End-to-End AI & ATS Job Hunting Platform

An intelligent, full-stack career platform designed to help job seekers land high-growth tech opportunities in the Indian IT market and global remote spaces.

Instead of building generic resumes from scratch, **MyJobs** employs a **Deterministic Injection Engine**: it preserves the candidate's authentic employment history while mathematically identifying missing skill gaps against specific Job Descriptions and dynamically injecting missing skills, keywords, and quantified impact bullets into a tailored ATS-compliant PDF resume.

---

## 🌟 The End-to-End User Journey (How It Gets You Hired)

```
[Step 1: Sign Up / Sign In]
   │
   ▼
[Step 2: Upload Base Resume (One-Time Gated Onboarding)]
   ├── Groq Llama 3 parses your resume into structured categories
   ├── Stores verified background (Companies, Titles, Degrees) in MongoDB Atlas
   └── Calculates your primary ATS Quality Score
   │
   ▼
[Step 3: Discover Tailored Jobs in Top Indian IT Hubs]
   ├── Dual-layer scraper pulls live openings from LinkedIn India & Remote/Freelance
   ├── JSearch RapidAPI queries Google Jobs & major platforms
   └── Filter by Bengaluru, Hyderabad, Pune, Mumbai, Delhi NCR, Remote, etc.
   │
   ▼
[Step 4: Click "Create ATS Resume Free" on Any Job Card]
   ├── Deterministic Math Engine analyzes the Job Description
   ├── Shows: Current ATS Match % vs. Optimized ATS Match %
   └── Flags Missing Critical Skills (e.g., Redis, Docker, CI/CD)
   │
   ▼
[Step 5: Deterministic Patch Script Execution]
   ├── Locks candidate's genuine employment and education history
   ├── Injects missing skill checkpoints into Technical Competencies
   └── Appends metric-driven action bullets into recent work experience
   │
   ▼
[Step 6: One-Click ATS PDF Resume Download]
   └── Generates a clean 1-column serif PDF ready for submission to ATS scanners
```

---

## 🛠️ Architecture & Core Features

- **Frontend**: React 19 + Vite, custom Black & Light Green high-contrast UI, Lucide icons, `html2pdf.js` client-side document rendering.
- **Backend API**: Node.js, Express (ES Modules), JWT Authentication, bcryptjs password hashing.
- **Database**: MongoDB Atlas with categorized models for Users and Structured Resume Analyses.
- **AI Intelligence**: Groq SDK (`llama-3.3-70b-versatile`) for category-wise resume parsing and targeted bullet generation.
- **Scraper Engine**:
  - Native LinkedIn India live job scraper (public guest API endpoints).
  - Native Remote / Freelance tech scraper.
  - RapidAPI JSearch integration.

---

## 🔒 Security & Privacy (Ready for Public GitHub)

All sensitive keys, database credentials, and secrets are strictly isolated in `.env` files and excluded from Git tracking via `.gitignore`. 

> **Important**: Never commit your `.env` file to GitHub. A template is provided in [`backend/.env.example`](backend/.env.example).

---

## 🚀 Quickstart Guide

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/myjobs.git
cd myjobs
```

### 2. Configure Environment Variables
Inside `backend/`, copy `.env.example` to `.env`:
```bash
cd backend
cp .env.example .env
```
Fill in your own credentials:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=jsearch.p.rapidapi.com
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Run Development Servers
- **Start Backend**:
  ```bash
  cd backend
  npm run dev
  ```
  *(API runs at `http://localhost:5000`)*

- **Start Frontend**:
  ```bash
  cd frontend
  npm run dev
  ```
  *(UI opens at `http://localhost:5173`)*

---

## 📄 License
MIT License. Free for personal and commercial career development.

