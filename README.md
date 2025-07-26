# Dew Time Tracker

A full-stack, role-based time tracking and approval system built with React, FastAPI, and PostgreSQL.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Security & Best Practices](#security--best-practices)
- [License](#license)

---

## Features

- Role-based dashboards for Consultants, Managers, and Admins
- Timesheet creation, editing, and submission workflow
- Manager approvals and notifications (email + in-app)
- Time off requests and approvals
- Responsive, modern UI
- Secure authentication (JWT)
- Email notifications via SMTP
- Audit logging

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Material UI, Recharts
- **Backend:** FastAPI (Python 3.8+), SQLModel, Alembic
- **Database:** PostgreSQL
- **Authentication:** JWT (stateless, secure)
- **Email:** SMTP (SendGrid)

---

## Architecture Overview

- **Frontend:** SPA built with React, using Material UI for consistent design and Recharts for data visualization.
- **Backend:** REST API built with FastAPI, using SQLModel for ORM and Pydantic for validation.
- **Separation of Concerns:** Models, schemas, endpoints, and utilities are all separated for maintainability.
- **Role-based Access:** Both frontend and backend enforce user roles for security and clarity.

---

## Project Structure

```
DewTimeTracker/
├── backend/
│   ├── app/
│   │   ├── api/        # API endpoints (routes)
│   │   ├── core/       # DB/session/config utilities
│   │   ├── models/     # SQLModel DB models
│   │   ├── schemas/    # Pydantic schemas for validation
│   │   ├── utils/      # Email, auth, access control
│   │   └── main.py     # FastAPI app entry
│   ├── requirements.txt
│   └── env.example
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Main app pages
│   │   ├── services/   # API service functions
│   │   ├── layouts/    # Main layout (header/sidebar)
│   │   ├── utils/      # Auth context, helpers
│   │   └── theme.ts    # Material UI theme
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env
# Edit .env with your DB and SMTP settings
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Docs: http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

- App: http://localhost:3000

---

## Usage

### Role-Based Access

**Consultants:**

- **Dashboard:** View personal statistics and upcoming time-off
- **Timesheets:** Create, edit, and submit weekly timesheets
- **Time Off:** Request and view time-off status

**Client Managers:**

- **Dashboard:** View team statistics and pending approvals
- **Approvals:** Review and approve/reject timesheets and time-off requests

**DEW Admins:**

- **Dashboard:** View organization-wide statistics
- **Employee Management:** Complete employee lifecycle management including:
  - Add new employees
  - View employee profiles and history
  - Edit timesheets directly (advanced editing with time entries and breaks)
  - Approve/reject timesheets and time-off requests
  - Manage employee roles and client assignments

### Key Features

- **Advanced Admin Capabilities:** DEW admins can edit timesheets with full time entry and break management
- **Role-based Navigation:** Streamlined interface showing only relevant pages for each role
- **Email Notifications:** Automated notifications for approvals, rejections, and submissions
- **Real-time Updates:** Immediate UI updates after actions
- **Comprehensive Audit Logging:** Complete activity tracking for compliance

### Workflow

1. **Consultants** create and submit timesheets through the Timesheets page
2. **Client Managers** review and approve submissions through the Approvals page
3. **DEW Admins** manage everything through the Employee Management interface
4. **Email notifications** keep all parties informed of status changes

---

## Security & Best Practices

- JWT authentication and role-based access control
- Passwords are securely hashed
- All data validated with Pydantic schemas
- CORS enabled for trusted origins only
- Parameterized queries via SQLModel ORM
- Email notifications sent securely via SMTP

---

## License

[MIT](LICENSE) (or your chosen license)
