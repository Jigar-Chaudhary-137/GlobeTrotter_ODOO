import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullScreenLoader } from '../components/ui/Loader';
import Layout from '../components/layout/Layout';

// Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Explore from '../pages/Explore';
import CreateTrip from '../pages/CreateTrip';
import TripBuilder from '../pages/TripBuilder';
import Community from '../pages/Community';
import PublicTrip from '../pages/PublicTrip';
import Profile from '../pages/Profile';

// Protected Route Guard
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public Route Guard (Redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />

      {/* Public Shareable Trip Route (No sidebar layout for non-logged-in access, or can show custom view) */}
      <Route path="/public/trips/:shareId" element={<PublicTrip />} />

      {/* Protected Main App Routes */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/explore" 
        element={
          <PrivateRoute>
            <Explore />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/create-trip" 
        element={
          <PrivateRoute>
            <CreateTrip />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/trips/:id" 
        element={
          <PrivateRoute>
            <TripBuilder />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/community" 
        element={
          <PrivateRoute>
            <Community />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } 
      />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
