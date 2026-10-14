ai-expense-tracker/
│
├── docker-compose.yml
├── README.md
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # Application entrypoint & FastAPI routes
│   │   ├── database.py          # SQLAlchemy engine & session setup
│   │   ├── models.py            # Database tables schema
│   │   ├── schemas.py           # Pydantic request/response validation
│   │   ├── auth.py              # JWT generation & password hashing
│   │   └── ai_service.py        # Gemini API integration & receipt validation
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .dockerignore
│
└── frontend/
    ├── src/
    │   ├── components/          # Reusable UI modules (Navbar, UploadModal, etc.)
    │   ├── pages/               # Dashboard, Login, Register, Expenses
    │   ├── services/            # Axios API client
    │   ├── App.jsx
    │   └── main.# AI Expense Scanner & Tracker

An intelligent full-stack expense tracking web application that automates receipt management. Users can upload receipt images to instantly extract line items, amounts, categories, and tax information via Google's Gemini Vision API. The application validates mathematical consistency across extracted entries, authenticates users securely, and delivers a containerized microservices architecture ready for deployment.

---

## Features

- **Automated Receipt Parsing:** Uses Google Gemini API (`gemini-3.5-flash-lite` / multimodal vision) to parse complex receipt photos into structured expense records.
- **Math Consistency Checks:** Automatically compares individual line items against subtotals, tax rates, and final amounts to flag calculation discrepancies.
- **Secure Authentication:** Implements JWT-based access tokens and OAuth 2.0 flow for protected user endpoints and expense isolation.
- **Responsive Dashboard:** React frontend built with Bootstrap for receipt uploads, ledger views, expense analytics, and category filtering.
- **Relational Data Storage:** SQLAlchemy ORM integrated with MySQL for ACID-compliant tracking of receipts, line items, and audit logs.
- **Containerized Architecture:** Fully dockerized services (Frontend, Backend, Database) orchestrated with Docker Compose for single-command portability.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React.js (Vite), Bootstrap, Axios / Fetch API |
| **Backend** | Python 3.11, FastAPI, Uvicorn, Pydantic |
| **AI / Machine Learning** | Google Gemini API (Multimodal Vision), Pillow (PIL) |
| **Database & ORM** | MySQL 8.0, SQLAlchemy, PyMySQL |
| **Authentication** | JWT (JSON Web Tokens), OAuth 2.0 Password Flow, Passlib/Bcrypt |
| **DevOps & Containerization** | Docker, Docker Compose, Nginx |

---

## System Architecture

```text
       Browser (Client)
              │
       [Port 3000:80]
              ▼
   ┌─────────────────────┐
   │  React + Nginx      │ (Frontend Container)
   └──────────┬──────────┘
              │ REST API Calls
       [Port 8000:8000]
              ▼
   ┌─────────────────────┐
   │  FastAPI (Uvicorn)  │ (Backend Container)
   └─────┬─────────┬─────┘
         │         │
         │         ▼
         │  ┌──────────────────────┐
         │  │ Google Gemini API    │ (Vision & Math Extraction)
         │  └──────────────────────┘
         ▼
   ┌─────────────────────┐
   │  MySQL 8.0 Database │ (Database Container)
   └─────────────────────┘
