import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { tripService } from '../services/tripService';
import { communityService } from '../services/communityService';
import { 
  Users, 
  MapPin, 
  Compass, 
  BarChart3, 
  Search, 
  SlidersHorizontal,
  Mail,
  Calendar,
  Wallet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar 
} from 'recharts';
import { CardSkeleton } from '../components/ui/Loader';

const COLORS = ['#0f766e', '#f97316', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];

export default function Admin() {
  const { user, isDemoMode } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState('users'); // users, cities, activities, analytics
  const [loading, setLoading] = useState(true);
  
  // Data lists
  const [trips, setTrips] = useState([]);
  const [publicTrips, setPublicTrips] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      addToast("Access denied. Admin privileges required.", "error");
      navigate('/dashboard');
    }
  }, [user, loading, navigate, addToast]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tripsPromise = tripService.getTrips();
        const communityPromise = communityService.getPublicTrips();

        const [tripsData, communityData] = await Promise.all([
          tripsPromise.catch(() => []),
          communityPromise.catch(() => [])
        ]);

        const unwrappedPublic = Array.isArray(communityData) 
          ? communityData 
          : (communityData.data || communityData.trips || []);

        setTrips(tripsData);
        setPublicTrips(unwrappedPublic);
      } catch (err) {
        console.error("Failed to load admin stats:", err);
        addToast("Error fetching platform metrics. Using fallbacks.", "warning");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addToast]);

  // DERIVE MANAGE USERS LIST
  const derivedUsers = React.useMemo(() => {
    const userMap = {};
    
    // Add public trips authors
    publicTrips.forEach(t => {
      if (t.user && t.user.id) {
        userMap[t.user.id] = {
          ...t.user,
          tripsCount: (userMap[t.user.id]?.tripsCount || 0) + 1,
          createdAt: t.user.createdAt || new Date().toISOString()
        };
      }
    });

    // Add current user
    if (user) {
      userMap[user.id] = {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city || 'Home City',
        country: user.country || 'Home Country',
        profilePic: user.avatar || user.profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80',
        tripsCount: (userMap[user.id]?.tripsCount || 0) + trips.length,
        createdAt: user.createdAt || new Date().toISOString()
      };
    }

    return Object.values(userMap);
  }, [publicTrips, trips, user]);

  // DERIVE POPULAR CITIES
  const derivedCities = React.useMemo(() => {
    const cityMap = {};
    [...trips, ...publicTrips].forEach(t => {
      t.stops?.forEach(s => {
        if (s.city) {
          const key = `${s.city}, ${s.country}`;
          cityMap[key] = (cityMap[key] || 0) + 1;
        }
      });
    });
    return Object.entries(cityMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [trips, publicTrips]);

  // DERIVE POPULAR ACTIVITIES
  const derivedActivities = React.useMemo(() => {
    const actMap = {};
    [...trips, ...publicTrips].forEach(t => {
      // Look inside mapped itineraries
      t.itinerary?.forEach(item => {
        const title = item.activityName || item.title;
        if (title) {
          actMap[title] = {
            count: (actMap[title]?.count || 0) + 1,
            cost: item.cost || item.expense || 0,
            category: item.category || 'Activities'
          };
        }
      });
    });
    return Object.entries(actMap)
      .map(([name, details]) => ({ name, ...details }))
      .sort((a, b) => b.count - a.count);
  }, [trips, publicTrips]);

  // DERIVE ANALYTICS DATA
  const analyticsData = React.useMemo(() => {
    const all = [...trips, ...publicTrips];
    
    // Country Pie Chart
    const countryCounts = {};
    all.forEach(t => {
      t.stops?.forEach(s => {
        if (s.country) {
          countryCounts[s.country] = (countryCounts[s.country] || 0) + 1;
        }
      });
    });
    const pieData = Object.entries(countryCounts)
      .map(([name, value]) => ({ name, value }))
      .slice(0, 5); // top 5 countries

    // Line Chart (month trends)
    const monthCounts = {};
    all.forEach(t => {
      if (t.startDate) {
        const d = new Date(t.startDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[key] = (monthCounts[key] || 0) + 1;
      }
    });
    const lineData = Object.entries(monthCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, value]) => ({ name, value }));

    // Bar Chart (budget comparisons)
    const barData = all
      .filter(t => t.budget)
      .map(t => ({
        name: (t.name || 'Trip').substring(0, 10),
        budget: t.budget || 0
      }))
      .slice(0, 6);

    return { pieData, lineData, barData };
  }, [trips, publicTrips]);

  // Search & Filter lists
  const filteredUsers = derivedUsers.filter(u => {
    const q = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const filteredCities = derivedCities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActivities = derivedActivities.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in font-sans">
        <div className="h-10 bg-stone-200 rounded-md w-1/4 animate-pulse" />
        <CardSkeleton />
      </div>
    );
  }

  // Double check admin guard
  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans text-sm">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text-dark tracking-tight">
            Admin Panel
          </h1>
          <p className="text-text-muted mt-1 text-xs">
            Platform metrics, user directories, popular trends, and analytics calculations.
          </p>
        </div>
      </div>

      {/* Control row */}
      <div className="bg-white border border-stone-200 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'users' ? 'users' : activeTab === 'cities' ? 'cities' : 'activities'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={activeTab === 'analytics'}
            className="w-full pl-9 pr-4 py-2.5 bg-bg-warm border border-stone-200 rounded-xl text-stone-850 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-semibold"
          />
        </div>

        {/* Filter / Sort buttons */}
        <div className="flex flex-wrap gap-3 items-center justify-end w-full md:w-auto">
          <button
            onClick={() => addToast("Filtering options are fully computed client-side.", "info")}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-bg-warm border border-stone-200 rounded-xl text-xs font-bold text-stone-700 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" />
            Filter
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="border-b border-stone-200">
        <nav className="flex gap-6">
          {[
            { id: 'users', label: 'Manage Users', icon: Users },
            { id: 'cities', label: 'Popular Cities', icon: MapPin },
            { id: 'activities', label: 'Popular Activities', icon: Compass },
            { id: 'analytics', label: 'User Trends and Analytics', icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                className={`flex items-center gap-1.5 pb-4 font-bold text-xs border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Admin Content */}
      <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs min-h-[400px]">
        {/* TAB 1: MANAGE USERS */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-extrabold text-base text-stone-900">User Directory</h2>
              <p className="text-text-muted text-xs mt-0.5">Manage accounts, view user locations, and track trip statistics.</p>
            </div>
            
            {filteredUsers.length === 0 ? (
              <div className="text-center py-10 text-xs text-text-muted">No users found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map(u => (
                  <div key={u.id} className="border border-stone-200 p-5 rounded-2xl flex items-center gap-4 bg-bg-warm/10 hover:border-stone-300 transition-colors">
                    <img
                      src={u.profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'}
                      alt={u.name}
                      className="w-12 h-12 rounded-full object-cover border border-stone-200 shrink-0"
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="font-bold text-stone-900 truncate flex items-center gap-1.5">
                        {u.name}
                        {u.id === user?.id && (
                          <span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-extrabold">You</span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-muted flex items-center gap-1">
                        <Mail className="w-3 h-3 text-stone-400" />
                        {u.email}
                      </div>
                      <div className="text-[11px] text-stone-500 font-semibold flex items-center gap-3">
                        <span>{u.city ? `${u.city}, ${u.country || ''}` : 'Location unknown'}</span>
                        <span className="text-stone-300">•</span>
                        <span>{u.tripsCount} trips</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: POPULAR CITIES */}
        {activeTab === 'cities' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-extrabold text-base text-stone-900">Popular Destinations</h2>
              <p className="text-text-muted text-xs mt-0.5">Top cities where users are scheduling trips based on stop metrics.</p>
            </div>

            {filteredCities.length === 0 ? (
              <div className="text-center py-10 text-xs text-text-muted">No cities found.</div>
            ) : (
              <div className="space-y-3 max-w-xl">
                {filteredCities.map((city, idx) => (
                  <div key={city.name} className="flex items-center justify-between p-4 bg-bg-warm/20 border border-stone-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center font-bold text-xs bg-primary/10 text-primary rounded-full">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-stone-850">{city.name}</span>
                    </div>
                    <span className="text-xs font-extrabold bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">
                      {city.count} {city.count === 1 ? 'visit' : 'visits'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: POPULAR ACTIVITIES */}
        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-extrabold text-base text-stone-900">Popular Local Activities</h2>
              <p className="text-text-muted text-xs mt-0.5">Top itinerary items scheduled across active user trips.</p>
            </div>

            {filteredActivities.length === 0 ? (
              <div className="text-center py-10 text-xs text-text-muted">No activities found.</div>
            ) : (
              <div className="space-y-3 max-w-xl">
                {filteredActivities.map((act, idx) => (
                  <div key={act.name} className="flex items-center justify-between p-4 bg-bg-warm/20 border border-stone-100 rounded-xl">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center font-bold text-[10px] bg-secondary/15 text-secondary rounded-full shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-stone-850 truncate">{act.name}</span>
                      </div>
                      <div className="text-[10px] text-text-muted font-bold pl-7 uppercase tracking-wider">{act.category}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full">
                        Cost: {act.cost > 0 ? `$${act.cost}` : 'Free'}
                      </span>
                      <span className="text-[10px] font-semibold text-stone-500 block mt-1">{act.count} schedules</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ANALYTICS & CHARTS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div>
              <h2 className="font-display font-extrabold text-base text-stone-900">User Trends and Analytics</h2>
              <p className="text-text-muted text-xs mt-0.5">Real-time visualizations and aggregates derived from platform metrics.</p>
            </div>

            {/* Statistics counter panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="border border-stone-200 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Total Platform Trips</span>
                <span className="block text-2xl font-extrabold text-stone-850 mt-1">{trips.length + publicTrips.length}</span>
              </div>
              <div className="border border-stone-200 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Indexed Users</span>
                <span className="block text-2xl font-extrabold text-stone-850 mt-1">{derivedUsers.length}</span>
              </div>
              <div className="border border-stone-200 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Platform Cities visited</span>
                <span className="block text-2xl font-extrabold text-stone-850 mt-1">{derivedCities.length}</span>
              </div>
            </div>

            {/* Recharts grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pie Chart: Destination distribution */}
              <div className="border border-stone-200 p-5 rounded-2xl">
                <h3 className="font-bold text-xs text-stone-700 uppercase mb-4 tracking-wider">Top Travel Destinations</h3>
                {analyticsData.pieData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-xs text-text-muted">No travel records.</div>
                ) : (
                  <div className="h-64 flex flex-col md:flex-row items-center justify-around">
                    <ResponsiveContainer width="50%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analyticsData.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-1.5 mt-4 md:mt-0 text-xs">
                      {analyticsData.pieData.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="font-semibold text-stone-700 truncate max-w-[120px]">{d.name}</span>
                          <span className="text-stone-400">({d.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Line Chart: Monthly Creations */}
              <div className="border border-stone-200 p-5 rounded-2xl">
                <h3 className="font-bold text-xs text-stone-700 uppercase mb-4 tracking-wider">Creation Growth Trend</h3>
                {analyticsData.lineData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-xs text-text-muted">No trend data available.</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.lineData} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2.5} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Bar Chart: Budget Allocations */}
              <div className="border border-stone-200 p-5 rounded-2xl lg:col-span-2">
                <h3 className="font-bold text-xs text-stone-700 uppercase mb-4 tracking-wider">Trip Budget Analysis</h3>
                {analyticsData.barData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-xs text-text-muted">No budget allocations found.</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.barData} margin={{ left: -10, top: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Bar dataKey="budget" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={45} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
