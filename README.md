# DWM (Daily Work Management) Application

An enterprise Daily Work Management web application built with **Next.js (App Router)**, **Tailwind CSS**, and **Appwrite**.

---

## 🌟 Key Features

1. **Daily Activity Plan (with Reminders)**: Daily action board with reminders and audio/desktop alerts.
2. **Activity Plan vs Actual Work Done**: Comprehensive variance analysis, time utilization, and execution tracking with CSV export.
3. **Postpone Activity with Earlier Reminders**: Postpone tasks to tomorrow or any date with advance reminder alerts and audit logs.
4. **Processing & Top-Level Approvals**: Track works under processing with SLA countdown and top-level sign-off (MD, VP HR, CFO, Operations Director).
5. **Weekly & Monthly Summaries with Aging Analytics**: Executive dashboard highlighting completed tasks, **Long Pending (>3 days)** items, and **Long Under Processing** items.
6. **Schedule Upcoming Days**: 7-day rolling forward agenda board to pre-schedule future tasks.
7. **5 Specialized HR/Operations Pipelines**: Candidate Sourcing, Reports, Statutory, Payroll, and Engagement Activities.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Appwrite Database
Follow the step-by-step setup guide:
👉 **[Appwrite Database Setup Guide](./APPWRITE_SETUP_GUIDE.md)**

Copy the example environment file:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your Appwrite details:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_APPWRITE_DATABASE_ID=dwm_database
NEXT_PUBLIC_APPWRITE_COLLECTION_ID=activities
```

*(Note: If you run without Appwrite credentials, the app automatically runs in offline demo mode using browser local storage pre-seeded with sample activities!)*

### 3. Run Development Server
```bash
npm run dev -- -p 3001
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 📚 Documentation & Technical Specifications

Detailed architecture, database designs, and business flow specifications are located in the **[`docs/`](./docs/README.md)** directory:

- 🏛️ **[Architecture Document](./docs/ARCHITECTURE.md)**: System architecture, multi-tenant RBAC, Appwrite Cloud integration, and notification engine.
- 🗄️ **[Database Model & ERD](./docs/DATABASE_MODEL.md)**: Normalized database schema (5 collections), Mermaid ERD diagram, and data dictionary.
- 📋 **[PRD & Business Workflows](./docs/PRD_AND_BUSINESS_FLOWS.md)**: Product requirements, user personas, 5 business pipelines, and workflow diagrams.
- 🧪 **[End-to-End Test Suites](./docs/E2E_TEST_SUITES.md)**: Coverage matrix of all 10 Playwright E2E test suites (38 tests) and execution guide.
- ⚙️ **[Appwrite Database Setup Guide](./APPWRITE_SETUP_GUIDE.md)**: Step-by-step Appwrite cloud configuration.

- [Unified Activity Service](./src/services/activityService.ts)
