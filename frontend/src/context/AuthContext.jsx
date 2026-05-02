import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiUrl } from '../lib/api';

const AuthContext = createContext(undefined);

function mapBackendUser(profile) {
  const displayName =
    (profile?.username && String(profile.username).trim()) ||
    (profile?.email && String(profile.email).split('@')[0]) ||
    'Researcher';
  return {
    id: profile?.id,
    name: displayName,
    email: profile?.email || '',
    role: profile?.is_superuser || profile?.is_staff ? 'admin' : 'student',
    is_staff: !!profile?.is_staff,
    is_superuser: !!profile?.is_superuser,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const logActivity = (type, details, targetUser = null) => {
    const activeUser = targetUser || user;
    if (!activeUser) return;

    const newActivity = {
      id: `act-${Date.now()}`,
      userId: activeUser.id,
      userName: activeUser.name,
      userRole: activeUser.role,
      type,
      details,
      timestamp: new Date().toISOString(),
    };

    setActivities((prev) => {
      const updated = [newActivity, ...prev];
      localStorage.setItem('research_activities', JSON.stringify(updated));
      return updated;
    });
  };

  const fetchProfile = async (accessToken) => {
    const response = await fetch(apiUrl('/profile/'), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.detail || 'Failed to fetch profile');
    }
    return mapBackendUser(data);
  };

  const fetchAdminUsers = async (accessToken) => {
    try {
      const response = await fetch(apiUrl('/admin/users/'), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) return;
      const data = await response.json().catch(() => []);
      const rows = Array.isArray(data) ? data : [];
      setAllUsers(
        rows.map((u) => ({
          id: u.id,
          name: u.username || (u.email ? String(u.email).split('@')[0] : 'User'),
          email: u.email,
          role: u.is_superuser || u.is_staff ? 'admin' : 'student',
        }))
      );
    } catch {
      // Keep UI functional even if admin list API fails.
    }
  };

  const loginWithTokens = async (access, refresh) => {
    localStorage.setItem('access', access);
    localStorage.setItem('refresh', refresh);
    const backendUser = await fetchProfile(access);
    setUser(backendUser);
    localStorage.setItem('research_user', JSON.stringify(backendUser));
    if (backendUser.role === 'admin') {
      fetchAdminUsers(access);
    } else {
      setAllUsers([backendUser]);
    }
    logActivity('login', 'User logged in via backend', backendUser);
    return { success: true, user: backendUser };
  };

  useEffect(() => {
    const savedActivities = localStorage.getItem('research_activities');
    if (savedActivities) {
      try {
        setActivities(JSON.parse(savedActivities));
      } catch {
        setActivities([]);
      }
    }

    const access = localStorage.getItem('access');
    const refresh = localStorage.getItem('refresh');
    if (!access || !refresh) return;

    loginWithTokens(access, refresh).catch(() => {
      setUser(null);
      setAllUsers([]);
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('research_user');
    });
  }, []);

  const register = async (name, email, password) => {
    const username = String(name || '')
      .trim()
      .replace(/\s+/g, '_')
      .toLowerCase();

    const response = await fetch(apiUrl('/register/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        message: data?.error || data?.detail || JSON.stringify(data?.errors || {}) || 'Registration failed',
      };
    }
    return { success: true, data };
  };

  const login = async (email, password) => {
    const response = await fetch(apiUrl('/login/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        message: data?.error || data?.detail || JSON.stringify(data?.errors || {}) || 'Login failed',
      };
    }
    return loginWithTokens(data.access, data.refresh);
  };

  const logout = () => {
    logActivity('logout', 'User logged out');
    setUser(null);
    setAllUsers([]);
    localStorage.removeItem('research_user');
    localStorage.removeItem('research_token');
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithTokens,
        register,
        logout,
        logActivity,
        activities,
        allUsers,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

