# 🛡️ Internshield

**AI-Powered Internship Verification & Career Accelerator**

Internshield is a state-of-the-art full-stack platform designed to protect students from the growing threat of fraudulent internship offers. By combining Agentic AI (Google Gemini) with real-time community intelligence (Reddit & Glassdoor), Internshield provides a robust "Trust Score" for internship offers and helps users optimize their career profiles for modern recruitment systems.

---

## 🌟 Key Features

### 🔍 1. AI-Driven Verification Engine
- **Offer Letter Parsing:** Native PDF text extraction using `pdf-parse`.
- **Hybrid Security Analysis:** A multi-layered analysis that combines deterministic heuristic guardrails with Large Language Models (LLMs) to detect scam patterns.
- **Visual Verdicts:** Instant feedback with "Suspicious", "Needs Review", or "Likely Safe" statuses, accompanied by detailed risk factors.

### 📄 2. ATS Resume Optimization
- **Smart Scoring:** Get a comprehensive ATS compatibility score (0-100) across readability, formatting, and keyword matching.
- **Keyword Gap Analysis:** Automatically identifies missing skills based on optional job descriptions.
- **Actionable Suggestions:** Direct, AI-generated feedback to improve resume performance in automated screening systems.

### 🌐 3. Real-Time Community Intelligence
- **External Signal Fetching:** Integration with **RapidAPI** to aggregate the latest community discussions from **Reddit** and **Glassdoor**.
- **Sentiment Mapping:** Maps community feedback to "Danger", "Warning", or "Positive" sentiments for better decision-making.

### 📊 4. Premium Dashboard
- **Modern UI/UX:** Built with **Next.js 15**, **Tailwind CSS v4**, and **Framer Motion** for a smooth, glassmorphic interactive experience.
- **History & Stats:** Track your previous scans, verification history, and community contributions in one centralized hub.

---

## 🏗️ Technical Architecture

Internshield follows a modern Client-Server architecture with a specialized AI integration layer.

```mermaid
graph TD
    %% Frontend Layer
    subgraph Frontend [Next.js Client (UI)]
        A[User Dashboard]
        B[Resume Upload Dropzone]
        C[Review Submission Form]
        D[Verification UI]
    end

    %% Backend Layer
    subgraph Backend [Next.js API Routes (Node.js)]
        E[Auth Controller / JWT]
        F[File Parser (pdf-parse)]
        G[Review Controller]
        H[RapidAPI Integration]
    end

    %% AI API Layer
    subgraph AI_Layer [Google Gemini API]
        I[JSON Structured Output Engine]
        J[Sentiment Analysis]
        K[ATS Rule Engine]
    end

    %% Database Layer
    subgraph Database [MongoDB]
        L[(Users Collection)]
        M[(Reviews Collection)]
        N[(Verified Credentials)]
        O[(Resume Scans)]
    end

    %% Flow Connections
    A --> E
    B --> F
    C --> G
    F -- "Raw Text + Strict Prompt" --> I
    I -- "JSON Assessment" --> Backend
    G -- "Raw Review String" --> J
    J -- "Toxicity Check" --> G
    H -- "Reddit/Glassdoor Data" --> Backend
    Backend --> Database
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/) |
| **Database** | [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) |
| **AI** | [Google Gemini](https://ai.google.dev/) (Flash 1.5) |
| **State** | [Zustand](https://github.com/pmndrs/zustand) |
| **Auth** | JWT (`jose`), `bcryptjs` |
| **External APIs** | RapidAPI (Reddit & Glassdoor) |

---

## 🚦 Getting Started

### 1. Prerequisites
- **Node.js:** 18.17 or later
- **MongoDB:** A running instance (local or Atlas)
- **API Keys:** Google AI (Gemini) and RapidAPI (for community signals)

### 2. Installation
```bash
git clone https://github.com/your-username/Internshield.git
cd Internshield
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Auth
JWT_SECRET=your_long_random_string

# AI
GEMINI_API_KEY=your_google_ai_key

# Community Signals
RAPIDAPI_KEY=your_rapidapi_key
```

### 4. Run Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the result.

---

## 🛡️ Safety & Guardrails
Internshield implements **Hybrid Verification**. While AI provides narrative reviews, the final "Trust Status" is cross-referenced with deterministic heuristic rules to prevent "AI Hallucinations" and ensure that high-risk signals (like upfront payment requests) are never overlooked.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
