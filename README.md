# Dew Time Tracker

A full-stack time tracking application for DEW Software consultancy, built with React, FastAPI, and PostgreSQL.

## Project Overview

This application allows:

- **Consultants/Employees** to log their hours and submit timesheets
- **Client Managers** to approve/reject timesheets via email or portal
- **Dew Admins** to manage all data and generate reports

## Tech Stack

- **Frontend**: React 18 + TypeScript + Ant Design
- **Backend**: FastAPI + Python 3.8+
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **Email**: SMTP (SendGrid/Mailtrap)

## Project Structure

```
DewTimeTracker/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core utilities
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── utils/          # Utility functions
│   │   ├── config.py       # Configuration
│   │   └── main.py         # FastAPI app
│   ├── requirements.txt    # Python dependencies
│   └── env.example         # Environment variables template
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   ├── App.tsx         # Main app component
│   │   └── index.tsx       # Entry point
│   ├── package.json        # Node dependencies
│   └── tsconfig.json       # TypeScript config
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Copy environment template:

   ```bash
   cp env.example .env
   ```

5. Update `.env` with your configuration

6. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

