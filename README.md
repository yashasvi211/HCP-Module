# 🧠 AI-First HCP CRM Module

This is a complete AI-first CRM module designed for managing interactions with Healthcare Professionals (HCPs). The system supports both structured form-based inputs and advanced AI-driven interactions using natural language, built on a modern full-stack architecture.

---

## 📌 Project Summary (6-Line Overview)

This CRM module empowers users to record and manage HCP interactions using both forms and natural language.
It supports AI-assisted data entry, contextual summaries, and intelligent queries.
LangGraph and Groq/Gemini LLMs power NLP tasks for summaries, updates, and planning.
Users can interact with AI to prepare for meetings or answer questions like visit counts.
A clear separation between form-fill and general chat ensures usability.
All AI tools are integrated securely with backend API keys preconfigured.

---

## 🚀 Core Features

* ✍️ **Log HCP Interactions** via:

  * Structured manual forms
  * Natural language input interpreted by the AI Assistant

* 🧠 **AI Assistant Capabilities**:

  * Fill structured forms from long free-text descriptions
  * Summarize or extract specific information from logs
  * Perform intelligent updates to existing records (NLP-based)
  * Query records conversationally, e.g.:

    * “How many people did I visit this week?”
    * “Tell me about Dr. Pooja Sharma and the sample she gave”
    * “Summarize last interaction with Dr. Sharma”

* 📊 **HCP Profiling & Interaction Planning**:

  * Review and summarize a doctor's history and prepare for upcoming meetings using AI context awareness

* 📈 **Natural Language DB Querying**:

  * Execute database-level queries through natural prompts

> ❌ Note: The **AI Update** feature is currently **not working** in the latest build but **is functional in the first commit**. This issue is known and under resolution.

---

## 🔹 How to Use AI Buttons

* 🧠 **Chat with AI** button:

  * Use this for general natural language questions such as summaries, counts, queries, etc.
  * Example: "How many HCPs did I meet last week?"

* 🗋 **Fill Form** button:

  * Use this for converting free-text inputs into structured interaction data fields.
  * Example: Paste your meeting notes, and AI will fill the form fields like HCP Name, Sentiment, etc.

> This design prevents confusion between prompts intended for structured form filling and those meant for general data interrogation.

---

## 📄 Tech Stack with Logos

| Layer    | Stack                                          | Logo                                                                                                                                                                                                                 |
| -------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | React + Redux                                  | ![React](https://img.shields.io/badge/React-20232A?logo=react\&logoColor=61DAFB\&style=flat-square) ![Redux](https://img.shields.io/badge/Redux-593D88?logo=redux\&logoColor=white\&style=flat-square)               |
| Backend  | FastAPI                                        | ![FastAPI](https://img.shields.io/badge/FastAPI-005571?logo=fastapi\&logoColor=white\&style=flat-square)                                                                                                             |
| AI/LLM   | LangGraph, Groq (gemma2-9b-it), Gemini 2.5 Pro | ![LangChain](https://img.shields.io/badge/LangChain-000000?logo=langchain\&logoColor=white\&style=flat-square) ![Gemini](https://img.shields.io/badge/Gemini-4285F4?logo=google\&logoColor=white\&style=flat-square) |
| Database | MySQL or PostgreSQL                            | ![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql\&logoColor=white\&style=flat-square) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql\&logoColor=white\&style=flat-square) |
| Hosting  | Localhost (Dev)                                | 💻                                                                                                                                                                                                                   |

> 📅 API keys for all LLMs have already been **configured** securely in the FastAPI backend.

---

## 🖼️ Screenshots

### 1. AI Form Fill & Chat Assistant

<img width="1918" height="1072" alt="image" src="https://github.com/user-attachments/assets/6ffbb542-201b-4f87-b0d1-51920b5a46dc" />


### 2. Complex Query Natural Language  

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/fe8d5bec-acb6-4eef-9f14-8a5fd20d80b5" />


### 3. NLP Query Answer – HCP Count for This Week

<img width="1390" height="783" alt="image" src="https://github.com/user-attachments/assets/df4e4bc3-2072-494c-bb1e-a91f9ad078ad" />


> 🔹 Save the images into a folder called `/screenshots` in the root directory.

---

## 📁 Project Structure

```
HCP-Module/
├── client/                   # React frontend
│   ├── components/
│   └── App.js
├── server/                   # FastAPI backend
│   ├── main.py
│   ├── db.py
│   └── routers/
│       ├── interaction.py
│       └── ai_tools.py
├── screenshots/              # Project screenshots
│   ├── ai-form-fill.png
│   ├── dr-sharma-summary.png
│   └── visit-count.png
├── requirements.txt
└── README.md
```

---

## ⚙️ Setup Instructions

### Backend (FastAPI)

```bash
cd server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend (React)

```bash
cd client
npm install
npm start
```

---

## 💡 Prompt Examples

| Prompt Example                                                 | Feature                |
| -------------------------------------------------------------- | ---------------------- |
| “How many HCPs did I visit this week?”                         | AI query to DB         |
| “Summarize all past interactions with Dr. Sharma”              | HCP profile            |
| “Update Dr. Pooja’s interaction to include Phase 2 trial info” | AI NLP update          |
| “Prepare for my next meeting with Dr. Sameer”                  | Context-aware planning |

---

## 📄 License

MIT License — Use this project freely with attribution.

---

## 🙌 Acknowledgements

* OpenAI, Gemini, and Groq for language model support
* LangChain & LangGraph for agent orchestration
* FastAPI for backend framework
* React + Redux for a responsive frontend experience
