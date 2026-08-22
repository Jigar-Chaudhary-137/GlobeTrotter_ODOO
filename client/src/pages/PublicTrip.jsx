import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { communityService } from '../services/communityService';
import { tripService } from '../services/tripService';
import { MOCK_TRIPS } from '../utils/mockData';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Wallet, 
  Copy, 
  Heart,
  Globe,
  PlaneTakeoff,
  AlertCircle,
  Compass
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip
} from 'recharts';
import Loader from '../components/ui/Loader';

const CATEGORIES = ['Transport', 'Accommodation', 'Activities', 'Meals', 'Other'];
const COLORS = ['#0d9488', '#f97316', '#3b82f6', '#ec4899', '#8b5cf6'];

export default function PublicTrip() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user, isDemoMode } = useAuth();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);

  // Fetch shared trip details
  const fetchSharedTrip = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      if (isDemoMode) {
        const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
        let found = demoTrips.find(t => t.id === shareId || t.shareId === shareId);
        if (!found) found = MOCK_TRIPS.find(t => t.id === shareId || t.shareId === shareId);
        
        if (found) {
          setTrip(found);
          setLikes(found?.likes || 24);
        } else {
          setErrorStatus('NOT_FOUND');
        }
        setLoading(false);
        return;
      }

      const response = await communityService.getPublicTripById(shareId);
      const tripData = response.data || response.trip || response;
      
      if (tripData) {
        setTrip(tripData);
        setLikes(tripData._count?.communityLikes ?? tripData.likes ?? 0);
        setLiked(Boolean(tripData.isLiked));
      } else {
        setErrorStatus('NOT_FOUND');
      }
    } catch (err) {
      console.warn("Public trip API failed:", err);
      // Fallback search in local cache
      const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
      let found = demoTrips.find(t => t.id === shareId || t.shareId === shareId);
      if (!found) found = MOCK_TRIPS.find(t => t.id === shareId || t.shareId === shareId);
      
      if (found) {
        setTrip(found);
        setLikes(found?.likes || 24);
      } else {
        const status = err.response?.status === 403 ? 'PRIVATE' : 'NOT_FOUND';
        setErrorStatus(status);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shareId) {
      fetchSharedTrip();
    }
  }, [shareId, isDemoMode]);

  // Copy trip action
  const handleCopyTrip = async () => {
    if (!user && !isDemoMode) {
      addToast("Please log in to copy this trip to your account.", "info");
      navigate('/login');
      return;
    }

    setCopying(true);
    try {
      if (isDemoMode) {
        const newCopiedTrip = {
          id: `trip-copied-${Date.now()}`,
          name: `Copy of: ${trip.title || trip.name}`,
          startDate: trip.startDate,
          endDate: trip.endDate,
          budget: trip.totalBudget || trip.budget,
          isPublic: false,
          stops: trip.stops?.map((s, idx) => ({ ...s, id: `stop-${Date.now()}-${idx}` })) || [],
          itinerary: trip.itineraryItems || trip.itinerary || [],
          expenses: trip.expenses || []
        };

        const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
        localStorage.setItem('demo_trips', JSON.stringify([...demoTrips, newCopiedTrip]));
        addToast("Trip copied successfully to your dashboard!", "success");
        navigate(`/trips/${newCopiedTrip.id}`);
      } else {
        const targetShareId = trip?.shareId || shareId;
        const response = await tripService.copyTrip(targetShareId);
        const copiedTrip = response.data || response.trip || response;
        addToast("Trip copied successfully to your dashboard!", "success");
        navigate(`/trips/${copiedTrip.id}`);
      }
    } catch (err) {
      console.error("Failed to copy trip:", err);
      addToast("Failed to copy trip. Please try again.", "error");
    } finally {
      setCopying(false);
    }
  };

  // Toggle Like action
  const handleLike = async () => {
    if (!user && !isDemoMode) {
      addToast("Please log in to support and like trips.", "info");
      navigate('/login');
      return;
    }

    if (!trip || liking) return;
    setLiking(true);

    try {
      if (isDemoMode) {
        setLiked(prev => !prev);
        setLikes(prev => (liked ? Math.max(0, prev - 1) : prev + 1));
      } else {
        const res = await communityService.toggleLike(trip.id);
        const isLikedNow = res.data?.liked;
        setLiked(isLikedNow);
        setLikes(prev => (isLikedNow ? prev + 1 : Math.max(0, prev - 1)));
        addToast(isLikedNow ? "Thanks for supporting!" : "Unliked trip", "success");
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
      addToast("Failed to update like status.", "error");
    } finally {
      setLiking(false);
    }
  };

  // Generate itinerary days
  const getTripDays = () => {
    if (!trip || !trip.startDate || !trip.endDate) return [];
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    
    const days = [];
    let current = new Date(start);

    while (current <= end) {
      const dateString = current.toISOString().split('T')[0];
      const activeStop = trip.stops?.find(s => {
        if (!s.arrivalDate || !s.departureDate) return false;
        const stopStart = new Date(s.arrivalDate);
        const stopEnd = new Date(s.departureDate);
        return current >= stopStart && current <= stopEnd;
      });

      days.push({
        date: dateString,
        label: current.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        stop: activeStop || null
      });
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  // Group chart data
  const getChartData = () => {
    if (!trip) return [];
    const groups = {};
    CATEGORIES.forEach(cat => { groups[cat] = 0; });

    const items = trip.itineraryItems || trip.itinerary || [];
    items.forEach(item => {
      const cat = item.category === 'Culture/Museums' || item.category === 'Attractions' ? 'Activities' :
                 item.category === 'Food/Restaurants' ? 'Meals' : item.category;
      const amount = item.expense || item.cost || 0;
      if (groups[cat] !== undefined) groups[cat] += amount;
      else groups['Other'] += amount;
    });

    (trip.expenses || []).forEach(exp => {
      const cat = exp.category;
      const amount = exp.amount || 0;
      if (groups[cat] !== undefined) groups[cat] += amount;
      else groups['Other'] += amount;
    });

    return Object.keys(groups)
      .map(key => ({ name: key, value: groups[key] }))
      .filter(item => item.value > 0);
  };

  const expenseSum = () => {
    if (!trip) return 0;
    const items = trip.itineraryItems || trip.itinerary || [];
    const itSum = items.reduce((sum, item) => sum + (item.expense || item.cost || 0), 0);
    const exSum = (trip.expenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);
    return itSum + exSum;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-warm flex flex-col items-center justify-center p-8">
        <Loader size="lg" />
        <span className="text-text-muted mt-3 text-xs font-semibold animate-pulse">Loading Public Itinerary...</span>
      </div>
    );
  }

  if (errorStatus || !trip) {
    return (
      <div className="min-h-screen bg-bg-warm flex flex-col items-center justify-center p-6">
        <div className="bg-white border border-stone-200 p-8 rounded-3xl max-w-md w-full text-center space-y-4 shadow-sm animate-fade-in">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="font-display font-extrabold text-xl text-stone-900">
            {errorStatus === 'PRIVATE' ? 'Trip No Longer Public' : 'Public Trip Not Found'}
          </h2>
          <p className="text-text-muted text-xs leading-relaxed">
            {errorStatus === 'PRIVATE' 
              ? 'This travel plan has been set to private by its creator.' 
              : 'This itinerary may have been removed by its creator or the public share URL is invalid.'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link 
              to="/explore" 
              className="w-full sm:w-auto px-4 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-hover transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Compass className="w-4 h-4" />
              Explore Destinations
            </Link>
            <Link 
              to="/dashboard" 
              className="w-full sm:w-auto px-4 py-2.5 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tripTitle = trip.title || trip.name || 'Shared Trip';
  const tripBudget = trip.totalBudget ?? trip.budget ?? 0;
  const tripDays = getTripDays();
  const totalCost = expenseSum();
  const chartData = getChartData();
  const userName = trip.user?.name || 'GlobeTrotter Explorer';
  const userAvatar = trip.user?.profilePic || trip.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80';

  return (
    <div className="min-h-screen bg-bg-warm font-sans text-sm flex flex-col">
      {/* Top Header */}
      <header className="h-16 bg-surface border-b border-stone-200 flex items-center justify-between px-6 sticky top-0 z-40">
        <Link to="/dashboard" className="flex items-center gap-2">
          <PlaneTakeoff className="w-5 h-5 text-primary" />
          <span className="font-display font-extrabold text-lg tracking-tight text-primary">GlobeTrotter</span>
        </Link>
        
        {user ? (
          <Link to="/dashboard" className="text-stone-700 hover:text-stone-900 font-bold text-xs">
            Go to Dashboard →
          </Link>
        ) : (
          <Link to="/login" className="px-4 py-1.5 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary-hover transition-colors">
            Login / Register
          </Link>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 space-y-8">
        {/* Banner Section */}
        <div className="bg-white border border-stone-200 p-6 md:p-8 rounded-3xl shadow-xs space-y-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full blur-xl -mr-6 -mt-6" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 uppercase tracking-wide">
                  <Globe className="w-3 h-3" />
                  Public Share
                </span>
                <span className="text-stone-300">•</span>
                <div className="flex items-center gap-2">
                  <img src={userAvatar} alt={userName} className="w-5 h-5 rounded-full border border-stone-200 object-cover" />
                  <span className="text-xs text-text-muted font-bold">Creator: {userName}</span>
                </div>
              </div>
              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text-dark tracking-tight leading-none">
                {tripTitle}
              </h1>
              <div className="flex flex-wrap gap-y-1.5 gap-x-4 items-center text-xs text-text-muted font-semibold">
                {trip.startDate && (
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {new Date(trip.startDate).toLocaleDateString()} {trip.endDate ? `to ${new Date(trip.endDate).toLocaleDateString()}` : ''}
                  </span>
                )}
                {trip.stops && trip.stops.length > 0 && (
                  <>
                    <span className="text-stone-300">•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {trip.stops.map(s => s.city).join(' → ')}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Interactions buttons */}
            <div className="flex gap-2.5 items-center shrink-0">
              <button
                onClick={handleLike}
                disabled={liking}
                className={`inline-flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold transition-all ${
                  liked 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
                {likes} {likes === 1 ? 'Like' : 'Likes'}
              </button>

              <button
                onClick={handleCopyTrip}
                disabled={copying}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-extrabold transition-colors shadow-sm disabled:opacity-50"
              >
                <Copy className="w-4 h-4" />
                {copying ? 'Copying...' : 'Copy Trip to My Plans'}
              </button>
            </div>
          </div>
        </div>

        {/* Read-only Content Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Itinerary Details */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-display font-bold text-lg text-text-dark border-b border-stone-200 pb-3">Itinerary Details</h2>
            
            <div className="space-y-6">
              {tripDays.length > 0 ? (
                tripDays.map((day, idx) => {
                  const items = trip.itineraryItems || trip.itinerary || [];
                  const dayActivities = items.filter(item => {
                    if (!item.date) return item.dayNumber === (idx + 1);
                    return new Date(item.date).toISOString().split('T')[0] === day.date;
                  });

                  return (
                    <div key={day.date} className="flex gap-4">
                      {/* Minimal Day marker */}
                      <div className="w-20 shrink-0 text-right">
                        <div className="text-xs font-extrabold text-primary uppercase">Day {idx + 1}</div>
                        <div className="text-[11px] font-bold text-stone-500 mt-0.5 truncate">{day.label}</div>
                        {day.stop && (
                          <div className="text-[10px] font-semibold text-text-muted mt-1 truncate">{day.stop.city}</div>
                        )}
                      </div>

                      <div className="w-0.5 bg-stone-200 shrink-0 relative">
                        <div className="absolute top-1.5 -left-1 w-2.5 h-2.5 rounded-full bg-primary/20 border-2 border-primary" />
                      </div>

                      {/* Day activities list */}
                      <div className="flex-1 space-y-2">
                        {dayActivities.length === 0 ? (
                          <p className="text-xs text-text-muted italic py-1 pl-2">No planned activities for this date.</p>
                        ) : (
                          dayActivities.map(act => (
                            <div 
                              key={act.id} 
                              className="bg-white border border-stone-200 p-3.5 rounded-xl flex items-center justify-between gap-4"
                            >
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-stone-900 text-xs">{act.time || '09:00'}</span>
                                  <span className="font-semibold text-text-dark text-xs">{act.title || act.activityName}</span>
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-stone-50 border border-stone-100 text-stone-600 uppercase">
                                    {act.category}
                                  </span>
                                </div>
                                {(act.description || act.notes) && (
                                  <p className="text-xs text-text-muted italic mt-1 leading-relaxed">{act.description || act.notes}</p>
                                )}
                              </div>
                              <span className="font-bold text-xs text-emerald-600 shrink-0">
                                {(act.expense || act.cost) > 0 ? `$${act.expense || act.cost}` : 'Free'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white border border-stone-200 p-6 rounded-2xl text-center">
                  <p className="text-text-muted text-xs font-semibold">No day-wise itinerary items created yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Cost and Route Summaries */}
          <div className="space-y-8">
            {/* Budget Summary Card */}
            <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-4">
              <h3 className="font-display font-bold text-base text-text-dark">Cost Statistics</h3>
              
              <div className="grid grid-cols-2 gap-4 border-b border-stone-100 pb-4">
                <div>
                  <span className="text-xs text-text-muted block font-medium">Estimated Budget</span>
                  <span className="font-bold text-lg text-text-dark">${tripBudget.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-text-muted block font-medium">Accumulated Expenses</span>
                  <span className={`font-bold text-lg ${totalCost > tripBudget && tripBudget > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ${totalCost.toLocaleString()}
                  </span>
                </div>
              </div>

              {chartData.length > 0 ? (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-text-muted text-xs italic text-center py-4">No expense breakdown recorded.</p>
              )}
            </div>

            {/* Route Stops Recap */}
            <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-4">
              <h3 className="font-display font-bold text-base text-text-dark">Route Summary</h3>
              {trip.stops && trip.stops.length > 0 ? (
                <div className="space-y-3">
                  {trip.stops.map((stop, sIdx) => (
                    <div key={stop.id || sIdx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {sIdx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-stone-900 text-xs truncate">{stop.city}{stop.country ? `, ${stop.country}` : ''}</div>
                        {stop.arrivalDate && stop.departureDate && (
                          <div className="text-[10px] text-text-muted mt-0.5">
                            {new Date(stop.arrivalDate).toLocaleDateString()} - {new Date(stop.departureDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-xs italic">No route stops recorded.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
