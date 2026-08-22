import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Initialize and check current user
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('globetrotter_token');
      const savedUser = localStorage.getItem('globetrotter_user');
      const demoFlag = localStorage.getItem('globetrotter_demo_mode') === 'true';

      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
        setIsDemoMode(demoFlag);
        
        if (!demoFlag) {
          try {
            // Validate token with backend
            const profile = await authService.getProfile();
            setUser(profile.user);
            localStorage.setItem('globetrotter_user', JSON.stringify(profile.user));
          } catch (err) {
            console.warn("Could not sync profile with server, using cached session", err);
            // If server returned 401, it will have cleared local token via api.js interceptor
          }
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen for unauthorized events from api.js response interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setIsDemoMode(false);
      localStorage.removeItem('globetrotter_token');
      localStorage.removeItem('globetrotter_user');
      localStorage.removeItem('globetrotter_demo_mode');
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login({ email, password });
      setUser(data.user);
      setIsDemoMode(false);
      localStorage.setItem('globetrotter_token', data.token);
      localStorage.setItem('globetrotter_user', JSON.stringify(data.user));
      localStorage.setItem('globetrotter_demo_mode', 'false');
      setLoading(false);
      return { success: true, message: 'Logged in successfully.' };
    } catch (err) {
      console.error("Login API failed:", err);
      // Fallback for demo when backend is offline
      if (err.message === 'Network Error' || (err.response && err.response.status === 404)) {
        console.warn("Backend offline or auth API not found. Activating offline demo fallback.");
        const mockUser = {
          id: 'user-demo',
          name: 'Demo Traveler',
          email: email,
          city: 'Paris',
          country: 'France',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'
        };
        setUser(mockUser);
        setIsDemoMode(true);
        localStorage.setItem('globetrotter_token', 'demo-jwt-token');
        localStorage.setItem('globetrotter_user', JSON.stringify(mockUser));
        localStorage.setItem('globetrotter_demo_mode', 'true');
        setLoading(false);
        return { success: true, isDemo: true, message: 'Connected in Offline Demo Mode.' };
      }
      
      const errMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      setError(errMsg);
      setLoading(false);
      throw new Error(errMsg);
    }
  };

  const register = async (name, email, password, phone, city, country, additionalInfo, avatar) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.register({ name, email, password, phone, city, country, additionalInfo, avatar });
      setUser(data.user);
      setIsDemoMode(false);
      localStorage.setItem('globetrotter_token', data.token);
      localStorage.setItem('globetrotter_user', JSON.stringify(data.user));
      localStorage.setItem('globetrotter_demo_mode', 'false');
      setLoading(false);
      return { success: true, message: 'Account registered successfully.' };
    } catch (err) {
      console.error("Registration API failed:", err);
      // Fallback for demo when backend is offline
      if (err.message === 'Network Error' || (err.response && err.response.status === 404)) {
        console.warn("Backend offline or auth API not found. Activating offline demo fallback.");
        const mockUser = {
          id: 'user-demo',
          name: name,
          email: email,
          phone: phone,
          city: city || 'Mumbai',
          country: country || 'India',
          bio: additionalInfo,
          avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'
        };
        setUser(mockUser);
        setIsDemoMode(true);
        localStorage.setItem('globetrotter_token', 'demo-jwt-token');
        localStorage.setItem('globetrotter_user', JSON.stringify(mockUser));
        localStorage.setItem('globetrotter_demo_mode', 'true');
        setLoading(false);
        return { success: true, isDemo: true, message: 'Account created in Offline Demo Mode.' };
      }

      const errMsg = err.response?.data?.message || 'Registration failed.';
      setError(errMsg);
      setLoading(false);
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    setUser(null);
    setIsDemoMode(false);
    localStorage.removeItem('globetrotter_token');
    localStorage.removeItem('globetrotter_user');
    localStorage.removeItem('globetrotter_demo_mode');
  };

  const updateProfile = async (profileData) => {
    if (isDemoMode) {
      const updated = { ...user, ...profileData };
      setUser(updated);
      localStorage.setItem('globetrotter_user', JSON.stringify(updated));
      return { user: updated };
    }
    
    const response = await authService.updateProfile(profileData);
    const updatedUser = response.data || response.user || response;
    const finalUser = {
      ...user,
      ...updatedUser,
      avatar: updatedUser.profilePic || updatedUser.avatar || user?.avatar,
    };
    setUser(finalUser);
    localStorage.setItem('globetrotter_user', JSON.stringify(finalUser));
    return response;
  };

  const uploadProfilePhoto = async (file) => {
    if (isDemoMode) {
      const mockUrl = URL.createObjectURL(file);
      const updated = { ...user, profilePic: mockUrl, avatar: mockUrl };
      setUser(updated);
      localStorage.setItem('globetrotter_user', JSON.stringify(updated));
      return { success: true, user: updated, message: 'Photo updated in demo mode.' };
    }

    const response = await authService.uploadProfilePhoto(file);
    const updatedUser = response.data || response.user || response;
    const finalUser = {
      ...user,
      ...updatedUser,
      profilePic: updatedUser.profilePic,
      avatar: updatedUser.profilePic || updatedUser.avatar,
    };
    setUser(finalUser);
    localStorage.setItem('globetrotter_user', JSON.stringify(finalUser));
    return { success: true, user: finalUser, message: 'Profile photo uploaded successfully.' };
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, isDemoMode, login, register, logout, updateProfile, uploadProfilePhoto }}>
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
