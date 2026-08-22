import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Lock, Eye, EyeOff, Loader2, Compass } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateForm = () => {
    const errors = {};
    if (!username.trim()) {
      errors.username = 'Username is required';
    } else if (!/\S+@\S+\.\S+/.test(username)) {
      errors.username = 'Please enter a valid email address';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      // Map username to the first parameter (email) of the login handler
      const result = await login(username, password);
      addToast(result.message, 'success');
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.message || 'Login failed. Please check your credentials.');
      addToast(err.message || 'Login failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-warm flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-3 shadow-xs">
          <Compass className="w-9 h-9" />
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-text-dark tracking-tight">
          GlobeTrotter
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Your personal travel map & memory journal.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Card Container */}
        <div className="bg-surface py-8 px-6 border border-stone-200/80 shadow-2xl rounded-3xl sm:px-10 transition-all hover:shadow-primary/5">
          {/* Photo/profile visual */}
          <div className="relative w-24 h-24 mx-auto mb-6 group">
            <div className="absolute inset-0 rounded-full bg-linear-to-tr from-primary to-secondary animate-pulse opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img
              src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=120&h=120&q=80"
              alt="Traveler Profile"
              className="relative w-full h-full rounded-full border-4 border-surface shadow-md object-cover transform transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {apiError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-sm font-medium transition-all">
                {apiError}
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-text-dark">
                Username
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  disabled={isSubmitting}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (formErrors.username) setFormErrors({ ...formErrors, username: '' });
                  }}
                  className={`block w-full pl-11 pr-4 py-2.5 bg-bg-warm border rounded-xl text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm ${
                    formErrors.username ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-stone-200'
                  }`}
                  placeholder="traveler@globetrotter.com"
                />
              </div>
              {formErrors.username && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.username}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-semibold text-text-dark">
                  Password
                </label>
              </div>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
                  }}
                  className={`block w-full pl-11 pr-10 py-2.5 bg-bg-warm border rounded-xl text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm ${
                    formErrors.password ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-stone-200'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all hover:shadow-lg active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          {/* Demo Accounts */}
          <div className="mt-5">
            <div className="relative flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-stone-200/80" />
              <span className="text-xs font-semibold text-text-muted uppercase tracking-widest whitespace-nowrap">
                Demo Accounts
              </span>
              <div className="flex-1 h-px bg-stone-200/80" />
            </div>
            <p className="text-xs text-text-muted text-center mb-3">
              Click a card to fill credentials instantly
            </p>
            <div className="grid grid-cols-2 gap-2">
              {/* Demo User */}
              <button
                type="button"
                id="demo-user-btn"
                onClick={() => {
                  setUsername('demo@globetrotter.com');
                  setPassword('Demo@123');
                  setFormErrors({});
                  setApiError('');
                }}
                className="group flex flex-col items-start p-3 rounded-xl border border-stone-200 bg-bg-warm hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
              >
                <span className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">U</span>
                  <span className="text-xs font-semibold text-text-dark group-hover:text-primary transition-colors">Demo User</span>
                </span>
                <span className="text-[10px] text-text-muted font-mono leading-tight">demo@globetrotter.com</span>
                <span className="text-[10px] text-text-muted font-mono">Demo@123</span>
              </button>
              {/* Demo Admin */}
              <button
                type="button"
                id="demo-admin-btn"
                onClick={() => {
                  setUsername('admin@globetrotter.com');
                  setPassword('Admin@123');
                  setFormErrors({});
                  setApiError('');
                }}
                className="group flex flex-col items-start p-3 rounded-xl border border-stone-200 bg-bg-warm hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
              >
                <span className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-bold">A</span>
                  <span className="text-xs font-semibold text-text-dark group-hover:text-primary transition-colors">Demo Admin</span>
                </span>
                <span className="text-[10px] text-text-muted font-mono leading-tight">admin@globetrotter.com</span>
                <span className="text-[10px] text-text-muted font-mono">Admin@123</span>
              </button>
            </div>
          </div>

          {/* Navigation to Register */}
          <div className="mt-6 border-t border-stone-200/80 pt-6 text-center">
            <p className="text-sm text-text-muted font-sans">
              New to GlobeTrotter?{' '}
              <Link to="/register" className="font-semibold text-primary hover:text-primary-hover transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
