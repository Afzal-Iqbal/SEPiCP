import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiUrl } from '../lib/api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('research_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const savedUsers = localStorage.getItem('registered_users');
    if (savedUsers) {
      setRegisteredUsers(JSON.parse(savedUsers));
    }

    const savedActivities = localStorage.getItem('research_activities');
    if (savedActivities) {
      setActivities(JSON.parse(savedActivities));
    }
  }, []);

  const logActivity = (type, details, targetUser = null) => {
    const activeUser = targetUser || user;
    if (!activeUser) return;

    const newActivity = {
      id: `act-${Date.now()}`,
      userId: activeUser.id,
      userName: activeUser.name,
      userRole: activeUser.role,
      type, // 'login', 'logout', 'analysis', 'upload'
      details,
      timestamp: new Date().toISOString(),
    };

    const updatedActivities = [newActivity, ...activities];
    setActivities(updatedActivities);
    localStorage.setItem('research_activities', JSON.stringify(updatedActivities));
  };

  const register = (name, email, password) => {
    if (registeredUsers.find(u => u.email === email)) {
      return { success: false, message: 'User already exists.' };
    }

    const newUser = {
      id: `stu-${Math.floor(Math.random() * 1000)}`,
      name,
      email,
      password,
      role: 'student',
      department: 'Undergraduate Statistics',
    };

    const updatedUsers = [...registeredUsers, newUser];
    setRegisteredUsers(updatedUsers);
    localStorage.setItem('registered_users', JSON.stringify(updatedUsers));

    // Automatically log in after registration
    setUser(newUser);
    localStorage.setItem('research_user', JSON.stringify(newUser));
    localStorage.setItem('research_token', 'student-token-abc');
    logActivity('login', 'New user registered and logged in', newUser);

    return { success: true };
  };

  const login = async (email, password, role) => {
    // Quick demo bypass for nedscholar demo admin
    if (role === 'admin' && email === 'nedscholar@gmail.com' && password === '123456') {
      try {
        const tokenRes = await fetch(apiUrl('/login/'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          localStorage.setItem("access", tokenData.access);
          localStorage.setItem("refresh", tokenData.refresh);
        }
      } catch (_) {}
      const adminUser = {
        id: 'admin-001',
        name: 'Principal Administrator',
        email: 'nedscholar@gmail.com',
        role: 'admin',
        department: 'Executive Research Board',
      };
      setUser(adminUser);
      localStorage.setItem('research_user', JSON.stringify(adminUser));
      localStorage.setItem('research_token', 'admin-token-xyz');
      logActivity('login', 'Admin logged into dashboard', adminUser);
      return { success: true };
    }

    // JWT login — fetch profile to get role
    try {
      console.log("Login Payload Sent:", { email, password });
      
      const tokenRes = await fetch(apiUrl('/login/'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        return { success: false, message: tokenData.detail || "Login failed." };
      }
      localStorage.setItem("access", tokenData.access);
      localStorage.setItem("refresh", tokenData.refresh);

      // Fetch profile to get role
      const profileRes = await fetch(apiUrl('/profile/'), {
        headers: { Authorization: `Bearer ${tokenData.access}` },
      });
      const profileData = await profileRes.json();

      const userRole = profileData.is_superuser ? 'admin' : (profileData.role || 'student');

      const loggedInUser = {
        id:    profileData.id,
        name:  profileData.first_name || profileData.username,
        email: profileData.email,
        role:  userRole,
      };
      setUser(loggedInUser);
      localStorage.setItem('research_user', JSON.stringify(loggedInUser));
      logActivity('login', 'User logged in via JWT', loggedInUser);
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Server error. Please try again.' };
    }
  };

  const logout = () => {
    logActivity('logout', 'User logged out');
    setUser(null);
    localStorage.removeItem('research_user');
    localStorage.removeItem('research_token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      logActivity,
      activities,
      allUsers: registeredUsers,
      isAuthenticated: !!user
    }}>
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

