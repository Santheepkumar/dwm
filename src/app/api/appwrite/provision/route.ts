import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Permission, Role } from 'node-appwrite';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

export async function POST(req: NextRequest) {
  try {
    const {
      endpoint,
      projectId,
      apiKey,
      databaseId = '6aa9ac740019ac7c6840',
    } = await req.json();

    if (!endpoint || !projectId || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameters: endpoint, projectId, or apiKey' },
        { status: 400 }
      );
    }

    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    const databases = new Databases(client);
    const logs: string[] = [];

    // 1. Create Database if not exists
    try {
      await databases.get(databaseId);
      logs.push(`Database '${databaseId}' already exists.`);
    } catch (err: any) {
      if (err.code === 404) {
        await databases.create(databaseId, 'DWM Database');
        logs.push(`Created database '${databaseId}'.`);
      } else {
        throw err;
      }
    }

    // 2. Loop collections
    for (const col of collectionsSchema) {
      try {
        await databases.getCollection(databaseId, col.id);
        logs.push(`Collection '${col.id}' (${col.name}) exists.`);
      } catch (err: any) {
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
          logs.push(`Created collection '${col.id}'.`);
          await delay(200);
        } else {
          throw err;
        }
      }

      const existingAttrRes = await databases.listAttributes(databaseId, col.id);
      const existingKeys = new Set(existingAttrRes.attributes.map((a: any) => a.key));

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
            logs.push(`[${col.id}] Added attribute: ${attr.key}`);
            await delay(120);
          } catch (e: any) {
            logs.push(`[${col.id}] Note on '${attr.key}': ${e.message}`);
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
            logs.push(`[${col.id}] Added attribute: ${attr.key}`);
            await delay(120);
          } catch (e: any) {
            logs.push(`[${col.id}] Note on '${attr.key}': ${e.message}`);
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
            logs.push(`[${col.id}] Added attribute: ${attr.key}`);
            await delay(120);
          } catch (e: any) {}
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
            logs.push(`[${col.id}] Added attribute: ${attr.key}`);
            await delay(120);
          } catch (e: any) {}
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'All 5 Normalized Appwrite Collections and Schema attributes provisioned successfully!',
      logs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to auto-provision Appwrite schema' },
      { status: 500 }
    );
  }
}

