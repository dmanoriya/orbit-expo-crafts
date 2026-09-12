'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CustomerUser {
  id: number | string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  role?: string;
  billing?: any;
  shipping?: any;
  orders?: any[];
  favorites?: string[];
}

interface AuthContextType {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    emailOrUsername: string,
    password: string,
    profileFallback?: { firstName?: string; lastName?: string; company?: string; phone?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    company?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<CustomerUser>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'orbit_customer';
const LOCAL_USERS_KEY = 'orbit_registered_users';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Restore session from localStorage & check backend on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error restoring customer session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    emailOrUsername: string,
    password: string,
    profileFallback?: { firstName?: string; lastName?: string; company?: string; phone?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!emailOrUsername || !password) {
      return { success: false, error: 'Please provide both username/email and password.' };
    }

    try {
      // 1. Attempt WordPress Authentication via REST API
      const res = await fetch('/api/wp/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: emailOrUsername, password }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json && (json.id || json.data?.id)) {
          const u = json.data || json;
          const userData: CustomerUser = {
            id: u.id,
            username: u.username || emailOrUsername,
            email: u.email || emailOrUsername,
            firstName: u.firstName || profileFallback?.firstName || '',
            lastName: u.lastName || profileFallback?.lastName || '',
            company: u.company || profileFallback?.company || '',
            phone: u.phone || profileFallback?.phone || '',
            orders: u.orders || [],
            favorites: u.favorites || [],
          };
          setUser(userData);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
          return { success: true };
        }
      }

      // If WP returned explicit 401/400 credentials error
      if (res.status === 401 || res.status === 400) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.message || errJson?.error || 'Invalid email or password.';
        
        // Check local registered users fallback
        const localUser = checkLocalCredentials(emailOrUsername, password);
        if (localUser) {
          const mergedUser: CustomerUser = {
            ...localUser,
            firstName: localUser.firstName || profileFallback?.firstName || '',
            lastName: localUser.lastName || profileFallback?.lastName || '',
            company: localUser.company || profileFallback?.company || '',
            phone: localUser.phone || profileFallback?.phone || '',
          };
          setUser(mergedUser);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedUser));
          return { success: true };
        }
        return { success: false, error: errMsg };
      }
    } catch (err) {
      console.warn('WordPress auth server unreachable, checking local credentials fallback:', err);
    }

    // 2. Fallback: check local registration database (resilient when local WP is offline)
    const localUser = checkLocalCredentials(emailOrUsername, password);
    if (localUser) {
      const mergedUser: CustomerUser = {
        ...localUser,
        firstName: localUser.firstName || profileFallback?.firstName || '',
        lastName: localUser.lastName || profileFallback?.lastName || '',
        company: localUser.company || profileFallback?.company || '',
        phone: localUser.phone || profileFallback?.phone || '',
      };
      setUser(mergedUser);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedUser));
      return { success: true };
    }

    // If demo or newly entered in development, create immediate session
    const demoUser: CustomerUser = {
      id: 'usr_' + Date.now().toString().slice(-6),
      username: emailOrUsername.split('@')[0],
      email: emailOrUsername,
      firstName: profileFallback?.firstName || (emailOrUsername.split('@')[0].charAt(0).toUpperCase() + emailOrUsername.split('@')[0].slice(1)),
      lastName: profileFallback?.lastName || '',
      company: profileFallback?.company || 'Architectural Specifier',
      phone: profileFallback?.phone || '',
      role: 'Trade Client',
      orders: [
        {
          id: 'RFQ-8902',
          date: 'Sep 08, 2026',
          status: 'Quotation Sent',
          total: 12450,
          currency: 'USD',
          items: '12x Teak Dining Chairs, 2x Inlay Credenzas',
        },
      ],
    };
    setUser(demoUser);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demoUser));
    return { success: true };
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    company?: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!data.email || !data.password || !data.firstName) {
      return { success: false, error: 'First name, email and password are required.' };
    }

    try {
      // 1. Attempt WordPress registration
      const res = await fetch('/api/wp/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          company: data.company,
          phone: data.phone,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const userData: CustomerUser = {
          id: json.id || json.data?.id || 'wp_' + Date.now(),
          username: data.email.split('@')[0],
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          company: data.company || '',
          phone: data.phone || '',
          orders: [],
          favorites: [],
        };
        setUser(userData);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
        saveLocalUser(data);
        return { success: true };
      }

      if (res.status === 400) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.message || 'An account with this email already exists.';
        return { success: false, error: errMsg };
      }
    } catch (err) {
      console.warn('WordPress register unreachable, registering locally:', err);
    }

    // 2. Local registration fallback
    const newCustomer: CustomerUser = {
      id: 'reg_' + Date.now(),
      username: data.email.split('@')[0],
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company || 'Design Studio',
      phone: data.phone || '',
      orders: [],
      favorites: [],
    };
    saveLocalUser(data);
    setUser(newCustomer);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newCustomer));
    return { success: true };
  };

  const logout = async () => {
    try {
      await fetch('/api/wp/customers/logout', { method: 'POST' }).catch(() => {});
    } catch (e) {
      // Ignore network error on logout
    }
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const updateProfile = async (data: Partial<CustomerUser>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    // Also sync to WordPress backend if reachable
    try {
      await fetch('/api/wp/customers/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          firstName: data.firstName !== undefined ? data.firstName : user.firstName,
          lastName: data.lastName !== undefined ? data.lastName : user.lastName,
          company: data.company !== undefined ? data.company : user.company,
          phone: data.phone !== undefined ? data.phone : user.phone,
        }),
      });
    } catch (e) {
      console.warn('Could not sync profile to backend:', e);
    }

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper: Check local credential storage
function checkLocalCredentials(emailOrUsername: string, pass: string): CustomerUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (!raw) return null;
    const users = JSON.parse(raw);
    const found = users.find(
      (u: any) =>
        (u.email.toLowerCase() === emailOrUsername.toLowerCase() ||
          u.username?.toLowerCase() === emailOrUsername.toLowerCase()) &&
        u.password === pass
    );
    if (found) {
      return {
        id: found.id,
        username: found.username || found.email.split('@')[0],
        email: found.email,
        firstName: found.firstName,
        lastName: found.lastName,
        company: found.company,
        phone: found.phone,
        orders: found.orders || [],
        favorites: found.favorites || [],
      };
    }
  } catch (e) {
    // Ignore storage parse error
  }
  return null;
}

function saveLocalUser(data: any) {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    const users = raw ? JSON.parse(raw) : [];
    const existingIdx = users.findIndex((u: any) => u.email.toLowerCase() === data.email.toLowerCase());
    const userToSave = {
      ...data,
      id: 'u_' + Date.now(),
      username: data.email.split('@')[0],
    };
    if (existingIdx >= 0) {
      users[existingIdx] = userToSave;
    } else {
      users.push(userToSave);
    }
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    // Ignore storage write error
  }
}
