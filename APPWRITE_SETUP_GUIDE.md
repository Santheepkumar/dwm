# Complete Appwrite Real Database Setup Guide for DWM App

This guide walks you through setting up a live database on **Appwrite** (Cloud or Self-Hosted) and connecting it to your **DWM (Daily Work Management)** application.

---

## 📋 Table of Contents
1. [⚡ Option A: 1-Click Automated Setup (No Manual Column Creation)](#1-option-a-1-click-automated-setup-recommended)
2. [🛠️ Option B: Manual Console Setup Step-by-Step](#2-option-b-manual-console-setup-step-by-step)
3. [Step 1: Get Appwrite Credentials (Account & Project)](#3-step-1-get-appwrite-credentials-account--project)
4. [Step 2: Add Web Platform for CORS](#4-step-2-add-web-platform-for-cors-important)
5. [Step 3: Create Database and Collection](#5-step-3-create-database-and-collection)
6. [Step 4: Create Collection Attributes (Schema)](#6-step-4-create-collection-attributes-schema)
7. [Step 5: Set Collection Permissions](#7-step-5-set-collection-permissions)
8. [Step 6: Connect Appwrite to the DWM App](#8-step-6-connect-appwrite-to-the-dwm-app)
9. [Step 7: Test and Verify Connection](#9-step-7-test-and-verify-connection)
10. [Troubleshooting & Common Errors](#10-troubleshooting--common-errors)

---

## 1. ⚡ Option A: 1-Click Automated Setup (Recommended)

**You do NOT need to create 25 columns manually!** We have provided two automated ways to create the entire database, collection, and schema:

### Way 1: From the Web UI (Fastest)
1. Go to Appwrite Console &rarr; **Project Settings** &rarr; **View API Keys** &rarr; Click **"Create API Key"**.
   - Name: `DWM Auto Setup`
   - Scopes: Select `databases.write`, `collections.write`, `attributes.write`, `documents.write`.
   - Copy the generated Secret Key.
2. Open your DWM app at **`http://localhost:3001/settings`**.
3. In the **"1-Click Auto-Provision"** box, paste your API Secret Key.
4. Click **"⚡ Auto-Create All 25 Columns & Database"**.
5. Appwrite will create the database, collection, and all 25 columns in under 5 seconds!

### Way 2: Via Terminal Command
Run the setup script with your API key:
```bash
APPWRITE_API_KEY=your_secret_api_key npm run setup:appwrite
```

---

## 2. 🛠️ Option B: Manual Console Setup Step-by-Step

If you prefer to configure everything manually by clicking in the Appwrite Web Console, follow the detailed steps below:

### Method A: Environment File (`.env.local`) — *Recommended for Production / Development*
Create a file named `.env.local` in the root of your project:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=6720fxxxxxxxxxxxxxxx
NEXT_PUBLIC_APPWRITE_DATABASE_ID=dwm_database
NEXT_PUBLIC_APPWRITE_COLLECTION_ID=activities
```

### Method B: Website In-App Settings — *Quick Browser-Based Setup*
1. Open the running DWM app in your browser: `http://localhost:3001/settings`
2. Enter your **Endpoint**, **Project ID**, **Database ID**, and **Collection ID** directly into the input fields.
3. Click **"Save Credentials"** and **"Test Connection"**.

---

## 2. Step 1: Get Appwrite Credentials (Account & Project)

1. Go to [https://cloud.appwrite.io](https://cloud.appwrite.io) and log in or sign up for a free account.
2. Click **"Create Project"** (or select an existing project).
   - Project Name: `DWM App` (or any name you prefer).
3. Once in your Project Dashboard, navigate to **Settings** (left sidebar):
   - **API Endpoint**: Usually `https://cloud.appwrite.io/v1` (or your self-hosted domain).
   - **Project ID**: Copy the string (e.g., `6720fa39001b9a218d6e`).

---

## 3. Step 2: Add Web Platform for CORS (Important!)

Appwrite blocks browser requests that are not registered as valid platforms.

1. In the Appwrite Console, go to **Overview** &rarr; scroll to **Integrations / Platforms**.
2. Click **"Add Platform"** &rarr; select **"Web App"**.
3. Fill in:
   - **Name**: `DWM Web Client`
   - **Hostname**:
     - For local testing: `localhost`
     - For production: your custom domain (e.g. `dwm.yourdomain.com`)
4. Click **"Next"** / **"Create"**.

> ⚠️ **Note:** If you run on a specific port like `http://localhost:3001`, registering `localhost` as the hostname covers all local ports.

---

## 4. Step 3: Create Database and Collection

1. In the Appwrite sidebar, click **Databases**.
2. Click **"Create Database"**:
   - **Database ID**: `dwm_database` (or click custom ID and enter `dwm_database`)
   - **Database Name**: `DWM Database`
3. Click into your newly created `dwm_database`.
4. Click **"Create Collection"**:
   - **Collection ID**: `activities` (or click custom ID and enter `activities`)
   - **Collection Name**: `Activities`

---

## 5. Step 4: Create Collection Attributes (Schema)

In Appwrite, go to your **`activities`** collection and click on the **Attributes** tab. Add the following attributes:

| # | Attribute Key | Type | Size | Required | Default Value | Description / Purpose |
|---|---|---|---|---|---|---|
| 1 | `title` | **String** | `255` | **Yes** | - | Title of the activity |
| 2 | `description` | **String** | `1000` | No | `null` | Detailed description / notes |
| 3 | `category` | **String** | `50` | **Yes** | - | `candidate_sourcing`, `reports`, `statutory`, `payroll`, `engagement`, `general` |
| 4 | `stage` | **String** | `50` | **Yes** | - | Workflow stage (e.g. `sourcing`, `yet_to_prepare`, `addition`, etc.) |
| 5 | `status` | **String** | `50` | **Yes** | - | `planned`, `under_processing`, `waiting_approval`, `completed`, `postponed` |
| 6 | `priority` | **String** | `20` | **Yes** | - | `low`, `medium`, `high`, `urgent` |
| 7 | `plannedDate` | **String** | `20` | **Yes** | - | Date format: `YYYY-MM-DD` |
| 8 | `plannedStartTime` | **String** | `10` | No | `null` | Time format: `HH:mm` (e.g. `10:00`) |
| 9 | `plannedHours` | **Float** | - | No | `1.0` | Estimated hours |
| 10 | `actualHours` | **Float** | - | No | `0.0` | Actual hours spent |
| 11 | `actualNotes` | **String** | `2000` | No | `null` | Work done remarks / notes |
| 12 | `hasReminder` | **Boolean** | - | No | `true` | Whether reminder alert is active |
| 13 | `reminderTime` | **String** | `50` | No | `null` | Reminder trigger timestamp |
| 14 | `earlierReminderTime` | **String** | `50` | No | `null` | Advance reminder for postponed tasks |
| 15 | `deadline` | **String** | `50` | No | `null` | Processing deadline SLA timestamp |
| 16 | `approverName` | **String** | `100` | No | `null` | Top-level approver name |
| 17 | `approverRole` | **String** | `100` | No | `null` | Approver designation / role |
| 18 | `approverEmail` | **String** | `100` | No | `null` | Approver email |
| 19 | `approvalStatus` | **String** | `30` | No | `none` | `none`, `pending`, `approved`, `rejected`, `changes_requested` |
| 20 | `approvalNotes` | **String** | `2000` | No | `null` | Approver sign-off comments |
| 21 | `approvalDecisionDate` | **String** | `50` | No | `null` | Decision ISO date |
| 22 | `postponeCount` | **Integer** | - | No | `0` | Number of times postponed |
| 23 | `postponeReason` | **String** | `1000` | No | `null` | Reason for postponement |
| 24 | `originalPlannedDate` | **String** | `20` | No | `null` | Original date before postponement |
| 25 | `metadata` | **String** | `5000` | No | `null` | JSON stringified custom category attributes |

> 💡 **Tip:** While attributes are being created, Appwrite marks their status as `Processing` for a few seconds. Wait until all attributes show `Available`.

---

## 6. Step 5: Set Collection Permissions

To allow the frontend application to read and write activities:

1. Inside your `activities` collection, click on the **Settings** tab.
2. Scroll to the **Permissions** section.
3. Click **"Add Role"** and select **"Any"** (or **"All Users (Users)"** if you use Appwrite Auth).
4. Check the following permissions for `Any`:
   - ✅ **Create**
   - ✅ **Read**
   - ✅ **Update**
   - ✅ **Delete**
5. Click **"Update"** at the bottom of the page to save.

---

## 7. Step 6: Connect Appwrite to the DWM App

### Option 1: Using `.env.local`
1. In your project directory (`/Users/santheep/Desktop/personal/activity/`), create or edit `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in your exact IDs:
   ```env
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=6720fa39001b9a218d6e
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=dwm_database
   NEXT_PUBLIC_APPWRITE_COLLECTION_ID=activities
   ```
3. Restart your dev server:
   ```bash
   npm run dev -- -p 3001
   ```

### Option 2: Using the In-App Settings UI
1. Open `http://localhost:3001/settings` in your browser.
2. Paste your **API Endpoint**, **Project ID**, **Database ID**, and **Collection ID**.
3. Click **"Save Credentials"**.

---

## 8. Step 7: Test and Verify Connection

1. On the **Settings** page (`http://localhost:3001/settings`), click the **"Test Connection"** button.
   - If successful, you will see a green banner: `Connected successfully to Appwrite Database & Collection!`.
   - The status badge on the top right Navbar will display: `Appwrite Live 🟢`.
2. Go to the **Daily Plan** page (`/`) and click **"Plan Activity"**.
3. Create a test activity (e.g. *Candidate Sourcing: Frontend Lead*).
4. Check your Appwrite Console under **Databases &rarr; dwm_database &rarr; activities &rarr; Documents** — you will see the new record created in real time!

---

## 9. Troubleshooting & Common Errors

| Error Message / Symptom | Cause | Resolution |
|---|---|---|
| **`Network request failed` / `CORS error`** | Your domain / localhost is not registered in Appwrite. | Go to Appwrite Console &rarr; Overview &rarr; Platforms &rarr; Add Web Platform &rarr; Hostname: `localhost`. |
| **`User (role: guests) missing scope (documents.read)`** | Collection permissions are missing. | Go to `activities` Collection &rarr; Settings &rarr; Permissions &rarr; Add role `Any` &rarr; Check Create, Read, Update, Delete. |
| **`Database with requested ID could not be found`** | Typo in Database ID. | Check if the Database ID matches `dwm_database` or what you created in the console. |
| **`Collection with requested ID could not be found`** | Typo in Collection ID. | Verify the Collection ID matches `activities` in Appwrite Console. |
| **`Attribute not found in schema`** | An attribute was omitted when configuring the collection. | Verify all 25 attributes listed in [Step 4](#5-step-4-create-collection-attributes-schema) have been added in Appwrite. |
