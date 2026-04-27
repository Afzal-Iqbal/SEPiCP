import React, { createContext, useContext, useState, useEffect } from 'react';

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

  const login = (email, password, role) => {
    // Admin Validation
    if (role === 'admin') {
      if (email === 'nedscholar@gmail.com' && password === '123456') {
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
      return { success: false, message: 'Invalid administrator credentials.' };
    }

    // Check Registered Users first
    const registeredUser = registeredUsers.find(u => u.email === email && u.password === password);
    if (registeredUser) {
      setUser(registeredUser);
      localStorage.setItem('research_user', JSON.stringify(registeredUser));
      localStorage.setItem('research_token', 'student-token-abc');
      logActivity('login', 'User logged in via credentials', registeredUser);
      return { success: true };
    }

    // Student Validation (Simulated fallback)
    if (role === 'student') {
      const studentUser = {
        id: `stu-${Math.floor(Math.random() * 1000)}`,
        name: email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        email: email,
        role: 'student',
        department: 'Undergraduate Statistics',
      };
      setUser(studentUser);
      localStorage.setItem('research_user', JSON.stringify(studentUser));
      localStorage.setItem('research_token', 'student-token-abc');
      logActivity('login', 'User logged in via simulation', studentUser);
      return { success: true };
    }

    return { success: false, message: 'Select a valid role.' };
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

