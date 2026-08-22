import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { tripService } from '../services/tripService';
import { MOCK_TRIPS, MOCK_CITIES } from '../utils/mockData';
import { 
  Calendar, 
  MapPin, 
  Wallet, 
  Plus, 
  Compass, 
  ArrowRight,
  TrendingUp,
  Map,
  DollarSign
} from 'lucide-react';
import Loader, { CardSkeleton } from '../components/ui/Loader';

export default function Dashboard() {
  const { user, isDemoMode } = useAuth();
  const { addToast } = useToast();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        if (isDemoMode) {
          // Use isolated mock data in demo mode
          setTrips(MOCK_TRIPS);
          setLoading(false);
          return;
        }

        const data = await tripService.getTrips();
        // Backend returns response, set it
        setTrips(Array.isArray(data) ? data : data.trips || []);
      } catch (err) {
        console.error("Failed to load trips from API:", err);
        setError("Could not load trips from server.");
        // Fallback to mock data on network error so the UI remains interactive
        if (err.message === 'Network Error' || err.response?.status === 404) {
          setTrips(MOCK_TRIPS);
          addToast("Server connection offline. Displaying demo trips.", "warning");
          setError(null); // Resolve error to show dashboard
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [isDemoMode, addToast]);

  // Aggregate trip statistics
  const totalTrips = trips.length;
  const totalBudget = trips.reduce((sum, t) => sum + (t.budget || 0), 0);
  const totalCitiesCount = trips.reduce((sum, t) => sum + (t.stops?.length || 0), 0);
  
  // Find active and upcoming trips
  const today = new Date();
  const activeTrip = trips.find(t => {
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    return today >= start && today <= end;
  });

  const upcomingTrips = trips
    .filter(t => new Date(t.startDate) > today)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  const pastTrips = trips
    .filter(t => new Date(t.endDate) < today)
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-10 bg-stone-200 rounded-md w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-text-dark tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-text-muted mt-1 text-sm md:text-base">
            Where is your next adventure taking you?
          </p>
        </div>
        <Link 
          to="/create-trip"
          className="inline-flex items-center justify-center gap-2 py-3 px-5 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition-all shadow-md self-start md:self-auto hover:-translate-y-0.5 duration-200"
        >
          <Plus className="w-5 h-5" />
          Plan a New Trip
        </Link>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface border border-stone-200 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Trips</div>
            <div className="text-2xl font-bold text-text-dark">{totalTrips}</div>
          </div>
        </div>
        <div className="bg-surface border border-stone-200 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Stops Visited</div>
            <div className="text-2xl font-bold text-text-dark">{totalCitiesCount}</div>
          </div>
        </div>
        <div className="bg-surface border border-stone-200 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Stored Budget</div>
            <div className="text-2xl font-bold text-text-dark">${totalBudget.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Active/Upcoming Trips & Sidebar Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Active & Upcoming Trips */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Trip Banner */}
          {activeTrip && (
            <div className="bg-gradient-to-br from-primary-dark to-primary text-white p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
              <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -ml-10 -mb-10" />
              
              <div className="relative z-10 space-y-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
                  Currently Traveling ✈️
                </span>
                <h2 className="font-display font-bold text-2xl md:text-3xl tracking-tight">{activeTrip.name}</h2>
                <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-white/80 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {activeTrip.startDate} to {activeTrip.endDate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {activeTrip.stops?.map(s => s.city).join(' → ') || 'No stops added'}
                  </span>
                </div>
                <div className="pt-2">
                  <Link
                    to={`/trips/${activeTrip.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary font-bold text-sm rounded-xl hover:bg-stone-50 transition-colors shadow-xs"
                  >
                    Manage Itinerary
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Trips List */}
          <div>
            <h2 className="font-display font-bold text-xl text-text-dark mb-4 flex items-center gap-2">
              Upcoming Adventures
              {upcomingTrips.length > 0 && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                  {upcomingTrips.length}
                </span>
              )}
            </h2>
            
            {upcomingTrips.length === 0 && !activeTrip ? (
              <div className="bg-surface border border-stone-200 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
                  <Compass className="w-8 h-8" />
                </div>
                <h3 className="font-display font-bold text-lg text-text-dark">No upcoming trips</h3>
                <p className="text-text-muted text-sm max-w-sm mt-1 mb-6">
                  You haven't scheduled any upcoming trips. Create a multi-city plan now!
                </p>
                <Link
                  to="/create-trip"
                  className="py-2.5 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Create Trip
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {upcomingTrips.map((trip) => (
                  <div 
                    key={trip.id}
                    className="bg-surface border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col justify-between"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Upcoming
                        </span>
                        <span className="text-sm font-bold text-emerald-600 flex items-center gap-0.5">
                          <Wallet className="w-4 h-4" />
                          ${trip.budget}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-lg text-text-dark group-hover:text-primary transition-colors line-clamp-1">
                        {trip.name}
                      </h3>
                      <p className="text-xs text-text-muted mt-1 font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {trip.startDate}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {trip.stops?.map((stop, i) => (
                          <span 
                            key={i}
                            className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-medium"
                          >
                            {stop.city}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-stone-50/50 border-t border-stone-100 px-5 py-3.5 flex justify-end">
                      <Link
                        to={`/trips/${trip.id}`}
                        className="text-primary hover:text-primary-hover font-bold text-sm inline-flex items-center gap-1 transition-colors"
                      >
                        View Trip
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mini-explore & Past Trips */}
        <div className="space-y-8">
          {/* Quick Stats/Tip Card */}
          <div className="bg-surface border border-stone-200 p-6 rounded-3xl shadow-xs">
            <h3 className="font-display font-bold text-lg text-text-dark mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Traveler Insights
            </h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Explore destinations, add day-wise activities, and allocate budgets for each item. GlobeTrotter tracks budget health dynamically!
            </p>
            <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
              <span className="text-xs text-text-muted font-medium">Explore trending sites</span>
              <Link to="/explore" className="text-xs text-secondary hover:text-secondary-hover font-bold flex items-center gap-0.5">
                Explore Destinations
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Past Trips Section */}
          <div>
            <h3 className="font-display font-bold text-lg text-text-dark mb-4">Past Memories</h3>
            {pastTrips.length === 0 ? (
              <p className="text-text-muted text-sm italic">No completed journeys logged yet.</p>
            ) : (
              <div className="space-y-4">
                {pastTrips.slice(0, 3).map(trip => (
                  <Link 
                    to={`/trips/${trip.id}`} 
                    key={trip.id}
                    className="flex items-center justify-between p-4 bg-surface border border-stone-200/60 rounded-xl hover:border-stone-300 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-text-dark truncate">{trip.name}</div>
                      <div className="text-xs text-text-muted mt-0.5">{trip.startDate}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popular Cities Inspiration Carousel */}
      <div className="pt-4">
        <h2 className="font-display font-bold text-2xl text-text-dark mb-5">Popular Destinations</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {MOCK_CITIES.map(city => (
            <Link
              key={city.id}
              to="/explore"
              className="group relative h-48 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-stone-200/50"
            >
              <img 
                src={city.image} 
                alt={city.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-4">
                <span className="text-white font-bold text-sm leading-tight font-display">{city.name}</span>
                <span className="text-white/70 text-xs mt-0.5">{city.country}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
