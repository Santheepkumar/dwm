# Daily Work Management (DWM) WorkHub Documentation

Welcome to the comprehensive technical and operational documentation repository for the **Daily Work Management (DWM) WorkHub**.

---

## 📚 Documentation Index

| Document | Description | Key Topics |
| :--- | :--- | :--- |
| **[1. Architecture Document](ARCHITECTURE.md)** | End-to-end system architecture, security, and component design | Hybrid serverless architecture, Next.js 16 App Router, Appwrite Cloud BaaS, Multi-tenant RBAC model, dual-layer notification engine, Mermaid diagrams |
| **[2. Database Model & ERD](DATABASE_MODEL.md)** | Complete entity-relationship diagram and data dictionary | 5 normalized collections (`organizations`, `memberships`, `activities`, `activity_transitions`, `approval_requests`), data types, indexing, and automated schema provisioning script |
| **[3. PRD & Business Workflows](PRD_AND_BUSINESS_FLOWS.md)** | Product specifications and business lifecycle flows | User personas, 5 business pipelines (HR, Reports, Statutory, Payroll, Engagement), daily planning, plan vs actual variance, approval desks, aging rules (>3 days), Mermaid sequence diagrams |
| **[4. E2E Test Suites & Coverage](E2E_TEST_SUITES.md)** | End-to-end test matrix and validation procedures | 10 Playwright test suites (38 automated tests), test fixtures, multi-tenant isolation verification, CLI/UI test execution commands, CI/CD setup |

---

## 🚀 Quick Links & Setup Commands

- **Automated Database Setup**:
  ```bash
  npm run setup:appwrite
  ```
- **Run All End-to-End Tests**:
  ```bash
  npm run test:e2e
  ```
- **Launch Interactive Playwright UI Mode**:
  ```bash
  npm run test:e2e:ui
  ```
- **Start Local Development Server**:
  ```bash
  npm run dev
  ```
