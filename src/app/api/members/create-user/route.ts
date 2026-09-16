import { NextRequest, NextResponse } from 'next/server';
import { Client, Users, Databases, ID, Query } from 'node-appwrite';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId,
      userName,
      userEmail,
      password,
      role = 'member',
      department = 'Operations',
      designation = 'Specialist',
    } = body;

    if (!tenantId || !userName || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, userName, and userEmail are required.' },
        { status: 400 }
      );
    }

    if (password && password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const endpoint =
      body.endpoint ||
      process.env.APPWRITE_ENDPOINT ||
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
      'https://cloud.appwrite.io/v1';

    const projectId =
      body.projectId ||
      process.env.APPWRITE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

    const apiKey =
      body.apiKey ||
      process.env.APPWRITE_API_KEY ||
      process.env.API_KEY;

    const databaseId =
      body.databaseId ||
      process.env.APPWRITE_DB_ID ||
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
      '6aa9ac740019ac7c6840';

    const collectionId =
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_MEMBERSHIPS || 'memberships';

    // If server credentials are missing or in offline/demo mode
    if (!projectId || !apiKey) {
      const mockId = `user_${Date.now()}`;
      return NextResponse.json({
        success: true,
        offline: true,
        user: {
          id: mockId,
          name: userName,
          email: userEmail,
        },
        membership: {
          id: `mem_${Date.now()}`,
          tenantId,
          userId: mockId,
          userName,
          userEmail,
          role,
          department,
          designation,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        message: 'Member created in local mode (Appwrite API Key not configured on server).',
      });
    }

    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    const users = new Users(client);
    const databases = new Databases(client);

    // 1. Create or Find Appwrite Auth User
    let appwriteUserId = '';
    let isExistingUser = false;

    try {
      const createdUser = await users.create(
        ID.unique(),
        userEmail,
        undefined, // phone
        password || `Dwm${Date.now()}!#`,
        userName
      );
      appwriteUserId = createdUser.$id;
    } catch (userErr: any) {
      if (userErr.code === 409 || userErr.type === 'user_already_exists') {
        isExistingUser = true;
        const listRes = await users.list([Query.equal('email', userEmail)]);
        if (listRes.total > 0) {
          appwriteUserId = listRes.users[0].$id;
        } else {
          appwriteUserId = `user_${Date.now()}`;
        }
      } else {
        throw userErr;
      }
    }

    // 2. Create Membership Document
    const membershipDoc = await databases.createDocument(
      databaseId,
      collectionId,
      ID.unique(),
      {
        tenantId,
        userId: appwriteUserId,
        userName,
        userEmail,
        role,
        department,
        designation,
        isActive: true,
      }
    );

    return NextResponse.json({
      success: true,
      isExistingUser,
      user: {
        id: appwriteUserId,
        name: userName,
        email: userEmail,
      },
      membership: {
        ...membershipDoc,
        id: membershipDoc.$id,
      },
      message: isExistingUser
        ? `Existing Appwrite user ${userEmail} was mapped to the organization.`
        : `New Appwrite Auth user and organization membership created successfully!`,
    });
  } catch (err: any) {
    console.error('Error in /api/members/create-user:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create member and auth account.' },
      { status: 500 }
    );
  }
}
