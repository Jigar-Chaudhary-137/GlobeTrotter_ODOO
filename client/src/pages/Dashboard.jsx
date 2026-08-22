import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { tripService } from '../services/tripService';
import { MOCK_TRIPS } from '../utils/mockData';
import {
  Calendar,
  MapPin,
  Wallet,
  Plus,
  Search,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import Loader, { CardSkeleton } from '../components/ui/Loader';

export default function Dashboard() {
  const { isDemoMode } = useAuth();
  const { addToast } = useToast();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Search, filter, sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // All, Ongoing, Upcoming, Completed
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, name
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        if (isDemoMode) {
          const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
          setTrips(demoTrips);
          setLoading(false);
          return;
        }

        const data = await tripService.getTrips();
        setTrips(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load trips from API:", err);
        setError("Could not load trips from server.");
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [isDemoMode]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Search filtering
  const filteredTrips = trips.filter(trip => {
    const query = searchQuery.toLowerCase();
    const titleMatch = (trip.name || '').toLowerCase().includes(query);
    const stopsMatch = trip.stops?.some(stop =>
      (stop.city || '').toLowerCase().includes(query) ||
      (stop.country || '').toLowerCase().includes(query)
    );
    return titleMatch || stopsMatch;
  });

  // Status partitioning
  const ongoingTrips = filteredTrips.filter(t => {
    if (!t.startDate || !t.endDate) return false;
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  });

  const upcomingTrips = filteredTrips.filter(t => {
    if (!t.startDate) return false;
    const start = new Date(t.startDate);
    start.setHours(0, 0, 0, 0);
    return start > today;
  });

  const completedTrips = filteredTrips.filter(t => {
    if (!t.endDate) return false;
    const end = new Date(t.endDate);
    end.setHours(23, 59, 59, 999);
    return end < today;
  });

  // Apply sorting
  const sortList = (list) => {
    return [...list].sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      const dateA = new Date(a.startDate || 0);
      const dateB = new Date(b.startDate || 0);
      return sortBy === 'date_asc' ? dateA - dateB : dateB - dateA;
    });
  };

  const ongoingSorted = sortList(ongoingTrips);
  const upcomingSorted = sortList(upcomingTrips);
  const completedSorted = sortList(completedTrips);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in font-sans">
        <div className="h-10 bg-stone-200 rounded-md w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans text-sm">
      {/* Header section (title and plan trip button) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text-dark tracking-tight">
            User Trip Listing
          </h1>
          <p className="text-text-muted mt-1 text-xs">
            Review and organize all of your travel plans and historical memories.
          </p>
        </div>
        <Link 
          to="/create-trip"
          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-xs"
        >
          <Plus className="w-4.5 h-4.5" />
          Plan a Trip
        </Link>
      </div>

      {/* Search and Filter Control Row */}
      <div className="bg-white border border-stone-200 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search trips by destination city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-bg-warm border border-stone-200 rounded-xl text-stone-850 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-semibold"
          />
        </div>

        {/* Filters and Sorting Controls */}
        <div className="flex flex-wrap gap-3 items-center justify-end w-full md:w-auto">
          {/* Filter Status Selector */}
          <div className="relative">
            <button
              onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-bg-warm border border-stone-200 hover:border-stone-300 rounded-xl text-xs font-bold text-stone-700 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" />
              Filter: {activeFilter}
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-stone-200 rounded-xl shadow-md py-1.5 z-20 animate-scale-in">
                {['All', 'Ongoing', 'Upcoming', 'Completed'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setActiveFilter(opt); setShowFilterMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors hover:bg-stone-50 ${
                      activeFilter === opt ? 'text-primary bg-primary/5' : 'text-stone-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort By Selector */}
          <div className="relative">
            <button
              onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-bg-warm border border-stone-200 hover:border-stone-300 rounded-xl text-xs font-bold text-stone-700 transition-colors"
            >
              Sort by: {sortBy === 'date_desc' ? 'Newest First' : sortBy === 'date_asc' ? 'Oldest First' : 'Name A-Z'}
            </button>
            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-stone-200 rounded-xl shadow-md py-1.5 z-20 animate-scale-in">
                {[
                  { value: 'date_desc', label: 'Newest First' },
                  { value: 'date_asc', label: 'Oldest First' },
                  { value: 'name', label: 'Name A-Z' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors hover:bg-stone-50 ${
                      sortBy === opt.value ? 'text-primary bg-primary/5' : 'text-stone-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trip Categories Sections */}
      <div className="space-y-10">
        {/* SECTION 1: ONGOING */}
        {(activeFilter === 'All' || activeFilter === 'Ongoing') && (
          <div className="space-y-4">
            <h2 className="font-display font-extrabold text-lg text-text-dark flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              ONGOING
            </h2>
            {ongoingSorted.length === 0 ? (
              <div className="bg-white border border-stone-200 border-dashed p-6 rounded-2xl text-center text-xs text-text-muted">
                No active ongoing journeys at the moment.
              </div>
            ) : (
              <div className="space-y-4">
                {ongoingSorted.map(trip => (
                  <div key={trip.id} className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 uppercase tracking-wider">
                          Active Trip
                        </span>
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                          <Wallet className="w-3.5 h-3.5 text-stone-400" />
                          Budget: ${trip.budget}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-lg text-stone-900 leading-snug">{trip.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-text-muted font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          {trip.startDate} to {trip.endDate}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          Route: {trip.stops?.map(s => s.city).join(' → ') || 'No cities selected'}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/trips/${trip.id}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-5 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-stone-700 font-bold text-xs rounded-lg transition-all shadow-xs self-start md:self-auto shrink-0"
                    >
                      View
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: UP-COMING */}
        {(activeFilter === 'All' || activeFilter === 'Upcoming') && (
          <div className="space-y-4">
            <h2 className="font-display font-extrabold text-lg text-text-dark flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              UP-COMING
            </h2>
            {upcomingSorted.length === 0 ? (
              <div className="bg-white border border-stone-200 border-dashed p-6 rounded-2xl text-center text-xs text-text-muted">
                No upcoming trips planned yet.
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingSorted.map(trip => (
                  <div key={trip.id} className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-primary/10 text-primary uppercase tracking-wider">
                          Upcoming
                        </span>
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                          <Wallet className="w-3.5 h-3.5 text-stone-400" />
                          Budget: ${trip.budget}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-lg text-stone-900 leading-snug">{trip.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-text-muted font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          {trip.startDate} to {trip.endDate}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          Route: {trip.stops?.map(s => s.city).join(' → ') || 'No cities selected'}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/trips/${trip.id}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-5 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-stone-700 font-bold text-xs rounded-lg transition-all shadow-xs self-start md:self-auto shrink-0"
                    >
                      View
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: COMPLETED */}
        {(activeFilter === 'All' || activeFilter === 'Completed') && (
          <div className="space-y-4">
            <h2 className="font-display font-extrabold text-lg text-text-dark flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-400" />
              COMPLETED
            </h2>
            {completedSorted.length === 0 ? (
              <div className="bg-white border border-stone-200 border-dashed p-6 rounded-2xl text-center text-xs text-text-muted">
                No past completed journeys logged yet.
              </div>
            ) : (
              <div className="space-y-4">
                {completedSorted.map(trip => (
                  <div key={trip.id} className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-stone-300" />
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-500 uppercase tracking-wider">
                          Completed
                        </span>
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                          <Wallet className="w-3.5 h-3.5 text-stone-400" />
                          Budget: ${trip.budget}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-lg text-stone-900 leading-snug">{trip.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-text-muted font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          {trip.startDate} to {trip.endDate}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          Route: {trip.stops?.map(s => s.city).join(' → ') || 'No cities selected'}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/trips/${trip.id}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-5 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-stone-700 font-bold text-xs rounded-lg transition-all shadow-xs self-start md:self-auto shrink-0"
                    >
                      View
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
