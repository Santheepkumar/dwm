import { Client, Databases, Account } from 'appwrite';
import { AppwriteConfig } from './types';

// Read config from env or localStorage if set in browser
export const getAppwriteConfig = (): AppwriteConfig => {
  const defaultCollections = {
    organizations: 'organizations',
    memberships: 'memberships',
    activities: 'activities',
    activity_transitions: 'activity_transitions',
    approval_requests: 'approval_requests',
  };

  if (typeof window !== 'undefined') {
    if (localStorage.getItem('dwm_test_mode') === 'true') {
      return {
        endpoint: '',
        projectId: '',
        databaseId: 'dwm_database',
        collectionId: 'activities',
        collections: defaultCollections,
        isConfigured: false,
      };
    }

    const localEndpoint = localStorage.getItem('dwm_appwrite_endpoint');
    const localProject = localStorage.getItem('dwm_appwrite_project_id');
    const localDb = localStorage.getItem('dwm_appwrite_db_id');
    const localCol = localStorage.getItem('dwm_appwrite_collection_id');

    const envDb =
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
      process.env.NEXT_PUBLIC_APPWRITE_DB_ID ||
      process.env.APPWRITE_DATABASE_ID ||
      process.env.APPWRITE_DB_ID ||
      'dwm_database';
    const envCol =
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID ||
      process.env.APPWRITE_COLLECTION_ID ||
      'activities';

    if (localEndpoint && localProject) {
      return {
        endpoint: localEndpoint,
        projectId: localProject,
        databaseId: localDb || envDb,
        collectionId: localCol || envCol,
        collections: {
          organizations: localStorage.getItem('dwm_appwrite_col_organizations') || 'organizations',
          memberships: localStorage.getItem('dwm_appwrite_col_memberships') || 'memberships',
          activities: localCol || envCol,
          activity_transitions: localStorage.getItem('dwm_appwrite_col_transitions') || 'activity_transitions',
          approval_requests: localStorage.getItem('dwm_appwrite_col_approvals') || 'approval_requests',
        },
        isConfigured: true,
      };
    }
  }

  const endpoint =
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
    process.env.APPWRITE_ENDPOINT ||
    '';
  const projectId =
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
    process.env.APPWRITE_PROJECT_ID ||
    '';
  const databaseId =
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_DB_ID ||
    process.env.APPWRITE_DATABASE_ID ||
    process.env.APPWRITE_DB_ID ||
    'dwm_database';
  const collectionId =
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID ||
    process.env.APPWRITE_COLLECTION_ID ||
    'activities';

  return {
    endpoint,
    projectId,
    databaseId,
    collectionId,
    collections: defaultCollections,
    isConfigured: Boolean(endpoint && projectId),
  };
};

export const createClient = () => {
  const config = getAppwriteConfig();
  const client = new Client();
  if (config.endpoint && config.projectId) {
    client.setEndpoint(config.endpoint).setProject(config.projectId);
  }
  return client;
};

export const getDatabases = () => {
  const client = createClient();
  return new Databases(client);
};

export const getAccount = () => {
  const client = createClient();
  return new Account(client);
};
