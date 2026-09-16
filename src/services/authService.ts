import { getAccount, getAppwriteConfig } from '@/lib/appwrite';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: boolean;
  registrationDate?: string;
}

const LOCAL_USER_KEY = 'dwm_auth_user';

export const authService = {
  isConfigured(): boolean {
    const config = getAppwriteConfig();
    return config.isConfigured;
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_USER_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
      if (localStorage.getItem('dwm_test_mode') === 'true') {
        return null;
      }
    }

    const config = getAppwriteConfig();
    if (!config.isConfigured) {
      return null;
    }

    try {
      const account = getAccount();
      const user = await account.get();
      const authUser: AuthUser = {
        id: user.$id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        phone: user.phone,
        status: user.status,
        registrationDate: user.registration,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
      }
      return authUser;
    } catch (err: any) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_USER_KEY);
      }
      return null;
    }
  },

  async login(email: string, password: string): Promise<AuthUser> {
    const config = getAppwriteConfig();

    if (typeof window !== 'undefined' && localStorage.getItem('dwm_test_mode') === 'true') {
      if (!email || !password) {
        throw new Error('Please provide both email and password.');
      }
      const mockUser: AuthUser = {
        id: `user_${Date.now()}`,
        name: email.split('@')[0].toUpperCase(),
        email,
        status: true,
      };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      return mockUser;
    }

    if (!config.isConfigured) {
      if (!email || !password) {
        throw new Error('Please provide both email and password.');
      }
      const demoUser: AuthUser = {
        id: 'demo_user_01',
        name: email.split('@')[0].toUpperCase(),
        email,
        status: true,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoUser));
      }
      return demoUser;
    }

    const account = getAccount();

    try {
      try {
        await account.deleteSession('current');
      } catch {}

      await account.createEmailPasswordSession(email, password);

      const user = await account.get();
      const authUser: AuthUser = {
        id: user.$id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        phone: user.phone,
        status: user.status,
        registrationDate: user.registration,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
      }
      return authUser;
    } catch (err: any) {
      let friendlyMessage = err.message || 'Login failed. Please check your credentials.';
      if (err.code === 401 || err.type === 'user_invalid_credentials') {
        friendlyMessage = 'Invalid email or password. Please verify your credentials in Appwrite.';
      } else if (err.code === 400 || err.type === 'password_recently_used') {
        friendlyMessage = 'Password must be at least 8 characters.';
      } else if (err.code === 429) {
        friendlyMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
      }
      throw new Error(friendlyMessage);
    }
  },

  async logout(): Promise<void> {
    const config = getAppwriteConfig();

    if (config.isConfigured) {
      try {
        const account = getAccount();
        await account.deleteSession('current');
      } catch (err) {
        console.warn('Appwrite session delete error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  },
};
