<div align="center">

# 💼 MyJobs Portal
### *AI-Powered Career Matching & Deterministic Vector ATS Optimization*

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=22C55E&center=true&vCenter=true&width=550&lines=Targeted+Jobs+in+India+IT+Hubs;AI+Resume+Analysis+with+Zero+Data+Loss;Vector+Semantic+ATS+Tailoring;One-Click+ATS+Compliant+PDF+Downloads" alt="Typing SVG" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stack-MERN%20Stack-000000?style=for-the-badge&logo=react&logoColor=22C55E" />
  <img src="https://img.shields.io/badge/AI-Groq%20Llama%203.3-000000?style=for-the-badge&logo=fastapi&logoColor=22C55E" />
  <img src="https://img.shields.io/badge/Scraper-LinkedIn%20India%20%2B%20Remote-000000?style=for-the-badge&logo=linkedin&logoColor=22C55E" />
  <img src="https://img.shields.io/badge/Database-MongoDB%20Atlas-000000?style=for-the-badge&logo=mongodb&logoColor=22C55E" />
  <img src="https://img.shields.io/badge/License-MIT-000000?style=for-the-badge&logo=github&logoColor=22C55E" />
</p>

---

</div>

## ⚡ Key Highlights at a Glance

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🎯 1. Zero-Loss Resume Parsing</h3>
      <p>Powered by <b>Groq Llama 3.3 70B</b>. Captures 100% of candidate data without hallucination or truncation: projects, live/github links, certifications, tech stacks, soft skills, and career timeline.</p>
    </td>
    <td width="50%" valign="top">
      <h3>🚀 2. India IT Hubs & Remote Scraping</h3>
      <p>Dual-layer scraping pipeline pulling real-time openings across <b>Bengaluru, Hyderabad, Pune, Mumbai, Delhi NCR, and Remote / Freelance</b> direct from LinkedIn and JSearch.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🧠 3. Semantic Vector Injection</h3>
      <p>Cosine similarity matches specific Job Descriptions to the most relevant role/project, injecting critical missing keywords into a tailored <b>Environment Tech Stack</b>.</p>
    </td>
    <td width="50%" valign="top">
      <h3>📄 4. Universal ATS PDF Generator</h3>
      <p>Produces a clean single-column serif PDF that passes strict ATS parsers (Greenhouse, Lever, Workday, Taleo) with <b>zero duplicate bullets</b>.</p>
    </td>
  </tr>
</table>

---

## 🔄 User Journey & Workflow

```mermaid
graph LR
    A[📄 Upload Base Resume] --> B[🧠 Groq Zero-Loss Parser]
    B --> C[(MongoDB Atlas)]
    C --> D[🔍 India & Remote Scraper]
    D --> E[📊 Math Match Engine]
    E --> F[🎯 Vector Bullet Injection]
    F --> G[📥 ATS Compliant PDF]
    
    style A fill:#000000,stroke:#22C55E,stroke-width:2px,color:#fff
    style B fill:#000000,stroke:#22C55E,stroke-width:2px,color:#fff
    style C fill:#000000,stroke:#22C55E,stroke-width:2px,color:#fff
    style D fill:#000000,stroke:#22C55E,stroke-width:2px,color:#fff
    style E fill:#000000,stroke:#22C55E,stroke-width:2px,color:#fff
    style F fill:#000000,stroke:#22C55E,stroke-width:2px,color:#fff
    style G fill:#000000,stroke:#22C55E,stroke-width:2px,color:#fff
```

### 🎯 The 3-Step Formula
$$\mathbf{Tailored\ ATS\ Resume} = \mathbf{Verified\ Base\ History} + \mathbf{Injected\ Skill\ Gaps} + \mathbf{Vector\ Targeted\ Bullets}$$

---

## 🛠️ Tech Stack & Architecture

```
MYJobs/
├── backend/
│   ├── models/            # User & Zero-Loss Resume Schemas
│   ├── routes/            # Auth, Resume, Jobs, and ATS API
│   ├── scrapers/          # Native LinkedIn India & Remote scraper
│   ├── utils/             # Vector Cosine Similarity & Deduplication
│   └── server.js          # Express & MongoDB Atlas connection
└── frontend/
    ├── src/
    │   ├── components/    # ResumeSection, MyJobsSection, AtsResumeModal
    │   ├── pages/         # High-contrast Split-Screen AuthPage
    │   └── styles/        # Black & Light Green aesthetic design tokens
    └── index.html         # Custom branded favicon & job icon
```

---

## 🚀 Quick Setup & Run

### 1️⃣ Clone & Configure
```bash
git clone https://github.com/Ksapan/MYJobs.git
cd MYJobs
```

Create `backend/.env` from template:
```bash
cp backend/.env.example backend/.env
```
*(Add your MongoDB Atlas URI, Groq API key, and RapidAPI key)*

### 2️⃣ Install & Run
```bash
# Terminal 1: Backend
cd backend && npm install && npm run dev

# Terminal 2: Frontend
cd frontend && npm install && npm run dev
```

Open **`http://localhost:5173`** to access your dashboard.

---

<div align="center">

### Built with 💚 for ambitious engineers across India & global tech markets.

[![GitHub Stars](https://img.shields.io/github/stars/Ksapan/MYJobs?style=social)](https://github.com/Ksapan/MYJobs)

</div>
