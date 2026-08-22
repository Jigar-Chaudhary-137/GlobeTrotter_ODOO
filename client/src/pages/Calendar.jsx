import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { tripService } from '../services/tripService';
import { MOCK_TRIPS } from '../utils/mockData';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { CardSkeleton } from '../components/ui/Loader';

export default function Calendar() {
  const { isDemoMode } = useAuth();
  const { addToast } = useToast();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Month state
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // All, Ongoing, Upcoming, Completed
  const [sortBy, setSortBy] = useState('date_desc');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        if (isDemoMode) {
          const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
          const all = [...demoTrips, ...MOCK_TRIPS];
          const unique = all.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          setTrips(unique);
          setLoading(false);
          return;
        }

        const data = await tripService.getTrips();
        setTrips(data);
      } catch (err) {
        console.error("Failed to load calendar trips:", err);
        const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
        const all = [...demoTrips, ...MOCK_TRIPS];
        const unique = all.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setTrips(unique);
        addToast("Server connection offline. Displaying cached sessions.", "warning");
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [isDemoMode, addToast]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calendar math
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  const totalSlots = cells.length;
  const remainingSlots = (7 - (totalSlots % 7)) % 7;
  for (let i = 0; i < remainingSlots; i++) {
    cells.push(null);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Search filtering
  const filteredTrips = trips.filter(trip => {
    const query = searchQuery.toLowerCase();
    const titleMatch = (trip.name || '').toLowerCase().includes(query);
    const stopsMatch = trip.stops?.some(stop => 
      (stop.city || '').toLowerCase().includes(query) || 
      (stop.country || '').toLowerCase().includes(query)
    );
    
    // Status check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(trip.startDate || 0);
    const end = new Date(trip.endDate || 0);
    
    let statusMatch = true;
    if (activeFilter === 'Ongoing') {
      statusMatch = today >= start && today <= end;
    } else if (activeFilter === 'Upcoming') {
      statusMatch = start > today;
    } else if (activeFilter === 'Completed') {
      statusMatch = end < today;
    }

    return (titleMatch || stopsMatch) && statusMatch;
  });

  const getTripsForDate = (date) => {
    if (!date) return [];
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return filteredTrips.filter(trip => {
      if (!trip.startDate || !trip.endDate) return false;
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return checkDate >= start && checkDate <= end;
    });
  };

  // Helper to color trip banners
  const getTripColorClass = (trip) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    
    if (today >= start && today <= end) {
      return 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600';
    }
    if (start > today) {
      return 'bg-primary hover:bg-primary-hover text-white border-primary-hover';
    }
    return 'bg-stone-400 hover:bg-stone-500 text-white border-stone-500';
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in font-sans">
        <div className="h-10 bg-stone-200 rounded-md w-1/4 animate-pulse" />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans text-sm">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text-dark tracking-tight">
            Calendar View
          </h1>
          <p className="text-text-muted mt-1 text-xs">
            Visualize your schedules, upcoming adventures, and historical memories in a monthly planner.
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

      {/* Control row */}
      <div className="bg-white border border-stone-200 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search calendar events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-bg-warm border border-stone-200 rounded-xl text-stone-850 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-semibold"
          />
        </div>

        {/* Filters/Sort */}
        <div className="flex flex-wrap gap-3 items-center justify-end w-full md:w-auto">
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

          <div className="relative">
            <button
              onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-bg-warm border border-stone-200 hover:border-stone-300 rounded-xl text-xs font-bold text-stone-700 transition-colors"
            >
              Sort by: {sortBy === 'date_desc' ? 'Newest' : sortBy === 'date_asc' ? 'Oldest' : 'Name'}
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

      {/* Main Calendar View Area */}
      <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs">
        {/* Calendar Heading Controls */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200">
          <h2 className="font-display font-extrabold text-lg text-text-dark">
            {monthNames[month]} {year}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg transition-colors"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg transition-colors"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of the Week headers */}
        <div className="grid grid-cols-7 border-b border-stone-100 bg-stone-50/50">
          {daysOfWeek.map((day) => (
            <div 
              key={day} 
              className="py-3 text-center text-xs font-bold text-stone-600 border-r border-stone-100 last:border-r-0 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Individual Date cells */}
        <div className="grid grid-cols-7 grid-rows-6 auto-rows-fr border-stone-200 bg-stone-100/30">
          {cells.map((date, index) => {
            const dateTrips = getTripsForDate(date);
            const isToday = date && date.toDateString() === new Date().toDateString();

            return (
              <div 
                key={index} 
                className={`min-h-[110px] md:min-h-[130px] p-2 bg-white border-r border-b border-stone-150/75 flex flex-col justify-between transition-colors ${
                  !date ? 'bg-stone-50/30' : ''
                } ${isToday ? 'bg-primary/2.5' : ''}`}
              >
                {date ? (
                  <div className="flex items-center justify-between">
                    <span 
                      className={`text-xs font-bold leading-none w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday 
                          ? 'bg-primary text-white font-extrabold' 
                          : 'text-stone-800'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>
                ) : (
                  <div />
                )}

                {/* Event items inside dates */}
                <div className="flex-1 flex flex-col justify-end mt-2 gap-1.5 overflow-hidden">
                  {date && dateTrips.slice(0, 2).map(trip => (
                    <Link
                      key={trip.id}
                      to={`/trips/${trip.id}`}
                      className={`block text-[10px] font-bold py-1 px-2 rounded-md truncate border select-none transition-all ${getTripColorClass(trip)}`}
                      title={trip.name}
                    >
                      {trip.name.toUpperCase()}
                    </Link>
                  ))}
                  {date && dateTrips.length > 2 && (
                    <span className="text-[9px] font-extrabold text-stone-500 pl-1">
                      + {dateTrips.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
