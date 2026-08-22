import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Compass, 
  Map, 
  Users, 
  User, 
  LogOut, 
  Menu, 
  X, 
  PlaneTakeoff,
  Plus,
  Calendar
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, isDemoMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Map },
    { name: 'My Trips', path: '/trips', icon: PlaneTakeoff },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Community', path: '/community', icon: Users },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg-warm font-sans flex flex-col md:flex-row text-text-dark">
      {/* Mobile Header */}
      <header className="md:hidden h-16 bg-surface border-b border-stone-200 flex items-center justify-between px-4 sticky top-0 z-40">
        <Link to="/dashboard" className="flex items-center gap-2">
          <PlaneTakeoff className="w-6 h-6 text-primary" />
          <span className="font-display font-bold text-lg tracking-tight text-primary">GlobeTrotter</span>
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="p-1 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <Menu className="w-6 h-6 text-stone-700" />
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 md:hidden flex justify-end">
          <div className="w-72 bg-surface h-full p-6 flex flex-col justify-between shadow-2xl animate-slide-left">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <PlaneTakeoff className="w-5 h-5 text-primary" />
                  <span className="font-display font-bold text-lg text-primary">GlobeTrotter</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5 text-stone-600" />
                </button>
              </div>

              {/* Offline Demo Banner for Mobile */}
              {isDemoMode && (
                <div className="mb-6 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-semibold flex items-center justify-center">
                  Offline Demo Mode
                </div>
              )}

              {/* Action Button */}
              <Link 
                to="/create-trip"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 mb-6 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Plan a Trip
              </Link>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-1.5">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                        isActive 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User Profile & Logout */}
            <div className="border-t border-stone-100 pt-4">
              <div className="flex items-center gap-3 mb-4 px-2">
                <img 
                  src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'} 
                  alt={user?.name}
                  className="w-10 h-10 rounded-full border border-stone-200 object-cover"
                />
                <div>
                  <div className="font-semibold text-sm leading-tight text-stone-900">{user?.name}</div>
                  <div className="text-xs text-stone-500 truncate max-w-[150px]">{user?.email}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl font-medium transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-surface border-r border-stone-200 flex-col justify-between p-6 sticky top-0 h-screen shrink-0 z-30">
        <div>
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 px-2 mb-8">
            <PlaneTakeoff className="w-7 h-7 text-primary" />
            <span className="font-display font-extrabold text-xl tracking-tight text-primary">GlobeTrotter</span>
          </Link>

          {/* Offline Demo Banner for Desktop */}
          {isDemoMode && (
            <div className="mb-6 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-semibold text-center select-none">
              Offline Demo Mode
            </div>
          )}

          {/* Action Button */}
          <Link 
            to="/create-trip"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 mb-6 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Plan a Trip
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all ${
                    isActive 
                      ? 'bg-primary/10 text-primary shadow-xs' 
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className="border-t border-stone-200 pt-4">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img 
              src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'} 
              alt={user?.name}
              className="w-10 h-10 rounded-full border border-stone-200 object-cover"
            />
            <div className="min-w-0">
              <div className="font-semibold text-sm leading-tight text-stone-900 truncate">{user?.name}</div>
              <div className="text-xs text-stone-500 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <main className="flex-1 min-w-0 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout;
