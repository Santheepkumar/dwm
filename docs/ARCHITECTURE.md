# System Architecture Document

## 1. Executive Architecture Summary

The **Daily Work Management (DWM) WorkHub** is an enterprise multi-tenant task orchestration and activity management platform. It enables organizations to plan daily work, enforce governance workflows, monitor aging work items, and streamline cross-functional approvals across HR, Payroll, Compliance, and Operations pipelines.

The platform is built using a modern **hybrid cloud serverless architecture**:
- **Client Application**: Next.js 16.3 (React 19, Tailwind CSS, TypeScript, Turbopack).
- **Backend-as-a-Service (BaaS)**: Appwrite Cloud (`fra.cloud.appwrite.io`) providing Session Authentication, JSON Document Databases, and File Storage.
- **Serverless API Routes**: Next.js App Router route handlers for privileged server-side orchestration (e.g. 1-step user account creation, automated database schema provisioning via `node-appwrite`).
- **Offline & Local Fallback**: Client-side reactive persistence ensuring offline resiliency and immediate UI responsiveness.

---

## 2. High-Level Architecture Diagram

```mermaid
graph TB
    subgraph ClientLayer["Client Layer (Browser / PWA)"]
        UI["Next.js 16 UI / React 19 Components"]
        SW["Service Worker (PWA & Desktop Notifications)"]
        Context["Context Layer (AuthContext, TenantContext)"]
        LocalStorage["Local Storage (Offline Cache & State Fallback)"]
    end

    subgraph ServerLayer["Serverless Next.js API Layer (Node.js)"]
        API_Provision["/api/appwrite/provision<br/>(1-Click DB & Schema Engine)"]
        API_CreateUser["/api/members/create-user<br/>(Privileged 1-Step User Provisioning)"]
    end

    subgraph AppwriteCloud["Appwrite Cloud Platform (BaaS)"]
        AuthService["Appwrite Auth Service<br/>(Users, Sessions, Passwords)"]
        DBService["Appwrite Databases Service<br/>(ID: 6aa9ac740019ac7c6840)"]
        
        subgraph NormalizedCollections["Normalized Relational Collections"]
            C_Orgs["organizations<br/>(Tenant Metadata & Workspaces)"]
            C_Members["memberships<br/>(User-Tenant RBAC Roles)"]
            C_Activities["activities<br/>(Core DWM Tasks & Pipeline Data)"]
            C_Transitions["activity_transitions<br/>(Immutable Audit Trail)"]
            C_Approvals["approval_requests<br/>(Approval Queue Desks)"]
        end
    end

    UI --> Context
    UI --> SW
    Context --> LocalStorage
    Context -->|Client SDK / Session Token| AuthService
    Context -->|Client SDK Queries| DBService
    
    UI -->|Admin Actions| ServerLayer
    API_Provision -->|Server API Key / node-appwrite| DBService
    API_CreateUser -->|Server API Key / node-appwrite| AuthService
    API_CreateUser -->|Server API Key / node-appwrite| C_Members

    DBService --> C_Orgs
    DBService --> C_Members
    DBService --> C_Activities
    DBService --> C_Transitions
    DBService --> C_Approvals
```

---

## 3. Core Architectural Components

### 3.1 Frontend Layer (Next.js 16 App Router)
- **App Router Architecture**:
  - `/` — Today's Daily Work Plan, completion tracker, quick filters, and interactive modals.
  - `/plan-vs-actual` — Variance analysis, hour logging, and CSV audit export.
  - `/approvals` — Dedicated multi-tier approval desk (Pending, Approved, Changes Requested).
  - `/schedule` — 7-Day rolling forward agenda with upcoming activity scheduler.
  - `/analytics` — Aging analysis (Long Pending >3 Days, Stalled Processing >2 Days), status distribution.
  - `/settings` — **Super Admin Only** infrastructure settings, credentials form, 1-click database provisioning.
  - `/login` — Credential-based authentication with Appwrite session initialization.
- **Styling & UI Components**: Tailwind CSS v4, Lucide React icons, accessible dialogs, and responsive mobile dock navigation.

### 3.2 Security & Multi-Tenant Role-Based Access Control (RBAC)

The application enforces a multi-tier authorization hierarchy both in the UI and at the service/API layers:

```mermaid
graph TD
    SuperAdmin["Super Admin<br/>(developer.santheep@gmail.com)"]
    OrgAdmin["Organization Admin<br/>(role: 'admin')"]
    Manager["Manager<br/>(role: 'manager')"]
    Approver["Approver<br/>(role: 'approver')"]
    Member["Member<br/>(role: 'member')"]

    SuperAdmin -->|Can create & switch all| Tenants["Tenant Organizations"]
    SuperAdmin -->|Full Access| Settings["/settings & Appwrite Config"]
    SuperAdmin -->|Can manage all| OrgAdmin

    OrgAdmin -->|Scoped to Tenant| TenantOrg["Assigned Organization"]
    OrgAdmin -->|Can add & remove| TenantMembers["Team Members & Roles"]
    OrgAdmin -.->|Blocked| Settings
    OrgAdmin -.->|Blocked| CreateOrg["Create New Organization"]

    Manager -->|Can plan, assign & oversee| ActivityPipeline["Activity Pipelines"]
    Approver -->|Can review, approve & reject| ApprovalDesk["Processing & Approval Desk"]
    Member -->|Can execute, log hours & complete| Tasks["Daily Tasks & Actuals"]
```

#### Authorization Matrix:
| Feature / Action | Super Admin | Organization Admin | Manager | Approver | Member |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Create New Organization** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Switch Between Organizations** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Access `/settings` (Backend Config)**| ✅ | ❌ | ❌ | ❌ | ❌ |
| **Manage Team Members (Invite/Remove)**| ✅ | ✅ | ❌ | ❌ | ❌ |
| **Assign Roles (`admin`, `manager`, etc.)**| ✅ | ✅ | ❌ | ❌ | ❌ |
| **Create / Edit Planned Activities** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Submit Activity to Approvals** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Approve / Reject Requests** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Log Actual Hours & Complete Tasks** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 4. Multi-Tenant Data Isolation Strategy

Data isolation across tenants is achieved through logical multi-tenancy enforced at the query and service levels:

1. **Every record contains `tenantId`**:
   - Every document created in `activities`, `memberships`, `activity_transitions`, and `approval_requests` carries a `tenantId` attribute referencing the parent organization slug/ID.
2. **Context-Bound Queries**:
   - `TenantContext` maintains the currently selected `currentTenant`.
   - All `activityService` operations inject `Query.equal('tenantId', activeTenantId)`.
3. **Audit Trail Immutability**:
   - State transitions write to `activity_transitions` with `tenantId`, actor ID, from/to states, and reasons. Records in this collection are append-only.

```mermaid
sequenceDiagram
    autonumber
    actor User as Authenticated User
    participant Context as TenantContext
    participant Service as activityService
    participant Appwrite as Appwrite Databases

    User->>Context: Selects Organization 'Acme Global' (org_default)
    Context->>Service: set activeTenantId = 'org_default'
    User->>Service: getActivities(today)
    Service->>Appwrite: listDocuments(db, 'activities', [Query.equal('tenantId', 'org_default')])
    Appwrite-->>Service: Return isolated tenant documents
    Service-->>User: Render today's activities for Acme Global only
```

---

## 5. Notification & Background Reminder Engine

DWM features a **dual-layer notification engine**:
1. **In-App Reminder Banner ([src/components/ReminderBanner.tsx](file:///Users/santheep/Desktop/personal/activity/src/components/ReminderBanner.tsx))**:
   - Polls active activities every 30 seconds.
   - Calculates time remaining until planned start time and triggers earlier reminders (e.g. 10m, 15m, 30m, 1h in advance).
   - Provides 1-click **Postpone to Tomorrow** and **Acknowledge** actions.
2. **Web Push / Desktop Notification Service ([public/sw.js](file:///Users/santheep/Desktop/personal/activity/public/sw.js))**:
   - Service Worker registered on app initialization.
   - Dispatches native OS-level desktop notifications even when the browser tab is in the background.

---

## 6. Deployment & Environment Strategy

| Component | Target Runtime | Configuration |
| :--- | :--- | :--- |
| **Frontend & API Routes** | Next.js Server / Vercel / Node.js Container | Port 3000, Turbopack, Node 20+ |
| **Database & Auth** | Appwrite Cloud | Endpoint: `https://fra.cloud.appwrite.io/v1`<br/>Project: `6aa99c9c00092ebcef4e`<br/>Database: `6aa9ac740019ac7c6840` |
| **Automation Scripts** | Node.js CLI | `npm run setup:appwrite` |
| **Automated Testing** | Playwright Test Runner | Chromium, Headless & UI Modes |
