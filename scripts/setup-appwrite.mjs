import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Load .env.local or .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envLocalPath = path.resolve(__dirname, '../.env.local');
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY || process.env.API_KEY;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DB_ID || '6aa9ac740019ac7c6840';

console.log('\n🚀 Starting Automated Multi-Tenant Appwrite Provisioning...');
console.log(`- Endpoint:    ${endpoint}`);
console.log(`- Project ID:  ${projectId || '(not set)'}`);
console.log(`- Database ID: ${databaseId}`);

if (!projectId || !apiKey) {
  console.error('\n❌ ERROR: Missing APPWRITE_PROJECT_ID or APPWRITE_API_KEY / API_KEY.');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const collectionsSchema = [
  {
    id: 'organizations',
    name: 'Organizations (Tenants)',
    stringAttrs: [
      { key: 'name', size: 100, required: true },
      { key: 'slug', size: 50, required: true },
      { key: 'plan', size: 30, required: false, default: 'enterprise' },
      { key: 'logoUrl', size: 500, required: false },
      { key: 'ownerId', size: 50, required: false },
      { key: 'ownerEmail', size: 100, required: false },
      { key: 'settings', size: 5000, required: false },
    ],
    floatAttrs: [],
    boolAttrs: [],
    intAttrs: [],
  },
  {
    id: 'memberships',
    name: 'Memberships (User Tenant Mapping)',
    stringAttrs: [
      { key: 'tenantId', size: 50, required: true },
      { key: 'userId', size: 50, required: true },
      { key: 'userName', size: 100, required: true },
      { key: 'userEmail', size: 100, required: true },
      { key: 'role', size: 30, required: true },
      { key: 'department', size: 50, required: false },
      { key: 'designation', size: 100, required: false },
    ],
    floatAttrs: [],
    boolAttrs: [{ key: 'isActive', default: true }],
    intAttrs: [],
  },
  {
    id: 'activities',
    name: 'Activities (DWM Core)',
    stringAttrs: [
      { key: 'tenantId', size: 50, required: false, default: 'org_default' },
      { key: 'title', size: 255, required: true },
      { key: 'description', size: 1000, required: false },
      { key: 'category', size: 50, required: true },
      { key: 'stage', size: 50, required: true },
      { key: 'status', size: 50, required: true },
      { key: 'priority', size: 20, required: true },
      { key: 'plannedDate', size: 20, required: true },
      { key: 'plannedStartTime', size: 10, required: false },
      { key: 'actualNotes', size: 2000, required: false },
      { key: 'reminderTime', size: 50, required: false },
      { key: 'earlierReminderTime', size: 50, required: false },
      { key: 'deadline', size: 50, required: false },
      { key: 'createdById', size: 50, required: false },
      { key: 'assignedToId', size: 50, required: false },
      { key: 'assignedToName', size: 100, required: false },
      { key: 'approverId', size: 50, required: false },
      { key: 'approverName', size: 100, required: false },
      { key: 'approverRole', size: 100, required: false },
      { key: 'approverEmail', size: 100, required: false },
      { key: 'approvalStatus', size: 30, required: false, default: 'none' },
      { key: 'approvalNotes', size: 2000, required: false },
      { key: 'approvalDecisionDate', size: 50, required: false },
      { key: 'postponeReason', size: 1000, required: false },
      { key: 'originalPlannedDate', size: 20, required: false },
      { key: 'metadata', size: 5000, required: false },
    ],
    floatAttrs: [
      { key: 'plannedHours', required: false, default: 1.0 },
      { key: 'actualHours', required: false, default: 0.0 },
    ],
    boolAttrs: [{ key: 'hasReminder', default: true }],
    intAttrs: [{ key: 'postponeCount', min: 0, max: 99999, default: 0 }],
  },
  {
    id: 'activity_transitions',
    name: 'Activity State Transitions (Audit Trail)',
    stringAttrs: [
      { key: 'tenantId', size: 50, required: true },
      { key: 'activityId', size: 50, required: true },
      { key: 'fromStatus', size: 50, required: true },
      { key: 'toStatus', size: 50, required: true },
      { key: 'fromStage', size: 50, required: false },
      { key: 'toStage', size: 50, required: false },
      { key: 'changedById', size: 50, required: false },
      { key: 'changedByName', size: 100, required: false },
      { key: 'changedByEmail', size: 100, required: false },
      { key: 'reason', size: 1000, required: false },
      { key: 'transitionDate', size: 50, required: false },
    ],
    floatAttrs: [],
    boolAttrs: [],
    intAttrs: [],
  },
  {
    id: 'approval_requests',
    name: 'Approval Requests (Review Workflow)',
    stringAttrs: [
      { key: 'tenantId', size: 50, required: true },
      { key: 'activityId', size: 50, required: true },
      { key: 'activityTitle', size: 255, required: false },
      { key: 'requesterId', size: 50, required: false },
      { key: 'requesterName', size: 100, required: false },
      { key: 'approverId', size: 50, required: false },
      { key: 'approverName', size: 100, required: false },
      { key: 'approverRole', size: 100, required: false },
      { key: 'approverEmail', size: 100, required: false },
      { key: 'status', size: 30, required: false, default: 'pending' },
      { key: 'deadline', size: 50, required: false },
      { key: 'decisionNotes', size: 2000, required: false },
      { key: 'decisionDate', size: 50, required: false },
    ],
    floatAttrs: [],
    boolAttrs: [],
    intAttrs: [],
  },
];

async function provision() {
  try {
    // 1. Create Database if not exists
    console.log(`\n1️⃣ Checking / Creating Database '${databaseId}'...`);
    try {
      await databases.get(databaseId);
      console.log(`   ✅ Database '${databaseId}' already exists.`);
    } catch (err) {
      if (err.code === 404) {
        await databases.create(databaseId, 'DWM Database');
        console.log(`   ✅ Database '${databaseId}' created successfully!`);
      } else {
        throw err;
      }
    }

    // 2. Provision each collection
    for (const col of collectionsSchema) {
      console.log(`\n📦 Checking / Provisioning Collection '${col.id}' (${col.name})...`);
      try {
        await databases.getCollection(databaseId, col.id);
        console.log(`   ✅ Collection '${col.id}' exists.`);
      } catch (err) {
        if (err.code === 404) {
          await databases.createCollection(
            databaseId,
            col.id,
            col.name,
            [
              Permission.read(Role.any()),
              Permission.create(Role.any()),
              Permission.update(Role.any()),
              Permission.delete(Role.any()),
            ]
          );
          console.log(`   ✅ Collection '${col.id}' created!`);
          await delay(250);
        } else {
          throw err;
        }
      }

      // Fetch existing attributes
      const existingAttrRes = await databases.listAttributes(databaseId, col.id);
      const existingKeys = new Set(existingAttrRes.attributes.map((a) => a.key));

      // String Attributes
      for (const attr of col.stringAttrs) {
        if (!existingKeys.has(attr.key)) {
          try {
            await databases.createStringAttribute(
              databaseId,
              col.id,
              attr.key,
              attr.size,
              attr.required,
              attr.default
            );
            console.log(`   ➕ [${col.id}] Created String attribute '${attr.key}'`);
            await delay(150);
          } catch (e) {
            console.warn(`   ⚠️ [${col.id}] Could not create '${attr.key}': ${e.message}`);
          }
        }
      }

      // Float Attributes
      for (const attr of col.floatAttrs) {
        if (!existingKeys.has(attr.key)) {
          try {
            await databases.createFloatAttribute(
              databaseId,
              col.id,
              attr.key,
              attr.required,
              undefined,
              undefined,
              attr.default
            );
            console.log(`   ➕ [${col.id}] Created Float attribute '${attr.key}'`);
            await delay(150);
          } catch (e) {
            console.warn(`   ⚠️ [${col.id}] Could not create '${attr.key}': ${e.message}`);
          }
        }
      }

      // Boolean Attributes
      for (const attr of col.boolAttrs) {
        if (!existingKeys.has(attr.key)) {
          try {
            await databases.createBooleanAttribute(
              databaseId,
              col.id,
              attr.key,
              false,
              attr.default
            );
            console.log(`   ➕ [${col.id}] Created Boolean attribute '${attr.key}'`);
            await delay(150);
          } catch (e) {
            console.warn(`   ⚠️ [${col.id}] Could not create '${attr.key}': ${e.message}`);
          }
        }
      }

      // Integer Attributes
      for (const attr of col.intAttrs) {
        if (!existingKeys.has(attr.key)) {
          try {
            await databases.createIntegerAttribute(
              databaseId,
              col.id,
              attr.key,
              false,
              attr.min,
              attr.max,
              attr.default
            );
            console.log(`   ➕ [${col.id}] Created Integer attribute '${attr.key}'`);
            await delay(150);
          } catch (e) {
            console.warn(`   ⚠️ [${col.id}] Could not create '${attr.key}': ${e.message}`);
          }
        }
      }
    }

    console.log('\n🎉 ALL 5 COLLECTIONS AND ATTRIBUTES PROVISIONED SUCCESSFULLY!');
    console.log('1. organizations');
    console.log('2. memberships');
    console.log('3. activities');
    console.log('4. activity_transitions');
    console.log('5. approval_requests\n');
  } catch (err) {
    console.error('\n❌ Provisioning failed:', err.message);
  }
}

provision();

