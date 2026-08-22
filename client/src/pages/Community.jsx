import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { communityService } from '../services/communityService';
import { tripService } from '../services/tripService';
import { MOCK_COMMUNITY_TRIPS } from '../utils/mockData';
import { 
  Users, 
  Search, 
  Calendar, 
  MapPin, 
  Copy, 
  ExternalLink, 
  Heart,
  TrendingUp,
  Wallet,
  AlertCircle
} from 'lucide-react';
import Loader, { CardSkeleton } from '../components/ui/Loader';

export default function Community() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isDemoMode } = useAuth();

  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [copyingId, setCopyingId] = useState(null);

  // Fetch community public trips
  const fetchCommunityTrips = async () => {
    try {
      if (isDemoMode) {
        setPosts(MOCK_COMMUNITY_TRIPS);
        setLoading(false);
        return;
      }

      const data = await communityService.getPublicTrips();
      setPosts(Array.isArray(data) ? data : data.posts || data.trips || []);
    } catch (err) {
      console.warn("Failed to fetch community trips from API, falling back to mock posts:", err);
      setPosts(MOCK_COMMUNITY_TRIPS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityTrips();
  }, [isDemoMode]);

  // Copy trip action
  const handleCopyTrip = async (e, tripId, tripName) => {
    e.preventDefault();
    e.stopPropagation();
    
    setCopyingId(tripId);
    try {
      if (isDemoMode) {
        // Find in mock data
        const sourceTrip = MOCK_COMMUNITY_TRIPS.find(t => t.id === tripId);
        
        // Form a new copied trip payload
        const newCopiedTrip = {
          id: `trip-copied-${Date.now()}`,
          name: `Copy of: ${tripName}`,
          startDate: sourceTrip?.startDate || '2026-06-01',
          endDate: sourceTrip?.endDate || '2026-06-10',
          budget: sourceTrip?.budget || 2000,
          isPublic: false,
          stops: sourceTrip?.stops?.map((s, idx) => ({
            id: `stop-${Date.now()}-${idx}`,
            city: s.city,
            country: s.country || 'Unknown',
            arrivalDate: '2026-06-01',
            departureDate: '2026-06-05',
            durationDays: s.durationDays,
            order: idx
          })) || [],
          itinerary: [],
          expenses: []
        };

        const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
        localStorage.setItem('demo_trips', JSON.stringify([...demoTrips, newCopiedTrip]));
        addToast(`Successfully duplicated: ${tripName}!`, 'success');
        navigate(`/trips/${newCopiedTrip.id}`);
      } else {
        const response = await tripService.copyTrip(tripId);
        addToast(`Successfully duplicated: ${tripName}!`, 'success');
        navigate(`/trips/${response.trip?.id || response.id}`);
      }
    } catch (err) {
      console.error("Failed to copy trip:", err);
      // Fallback
      const sourceTrip = MOCK_COMMUNITY_TRIPS.find(t => t.id === tripId);
      const newCopiedTrip = {
        id: `trip-copied-${Date.now()}`,
        name: `Copy of: ${tripName}`,
        startDate: sourceTrip?.startDate || '2026-06-01',
        endDate: sourceTrip?.endDate || '2026-06-10',
        budget: sourceTrip?.budget || 2000,
        isPublic: false,
        stops: sourceTrip?.stops?.map((s, idx) => ({
          id: `stop-${Date.now()}-${idx}`,
          city: s.city,
          country: s.country || 'Unknown',
          arrivalDate: '2026-06-01',
          departureDate: '2026-06-05',
          durationDays: s.durationDays,
          order: idx
        })) || [],
        itinerary: [],
        expenses: []
      };
      const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
      localStorage.setItem('demo_trips', JSON.stringify([...demoTrips, newCopiedTrip]));
      
      addToast(`Successfully duplicated (Offline Demo Mode): ${tripName}!`, 'success');
      navigate(`/trips/${newCopiedTrip.id}`);
    } finally {
      setCopyingId(null);
    }
  };

  // Filter posts based on search query
  const filteredPosts = posts.filter(post => {
    const query = searchQuery.toLowerCase();
    const matchesTitle = post.name.toLowerCase().includes(query);
    const matchesStops = post.stops?.some(s => s.city.toLowerCase().includes(query));
    return matchesTitle || matchesStops;
  });

  return (
    <div className="space-y-8 animate-fade-in font-sans text-sm">
      {/* Header and search banner */}
      <div className="bg-white border border-stone-200 p-6 md:p-8 rounded-3xl shadow-xs">
        <div className="max-w-xl">
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text-dark tracking-tight leading-none flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            Traveler Share Board
          </h1>
          <p className="text-text-muted mt-2.5 text-sm">
            Get inspired by travel plans from the community. Copy details to start building your own version.
          </p>

          <div className="mt-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shared trips by city name or route title..."
              className="w-full pl-11 pr-4 py-3 bg-bg-warm border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* Loading list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-white border border-stone-200 border-dashed rounded-3xl flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-stone-400 mb-2" />
          <p className="text-text-muted text-sm font-semibold">No shared journeys match your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts.map((post) => (
            <div 
              key={post.id}
              className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div className="p-6 space-y-4">
                {/* User card header */}
                <div className="flex items-center gap-3">
                  <img 
                    src={post.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'} 
                    alt={post.user?.name}
                    className="w-10 h-10 rounded-full border border-stone-200 object-cover shrink-0"
                  />
                  <div>
                    <div className="font-bold text-stone-900 text-sm leading-tight">{post.user?.name}</div>
                    <div className="text-xs text-text-muted mt-0.5">{post.user?.location || 'GlobeTrotter User'}</div>
                  </div>
                </div>

                {/* Trip name & description */}
                <div>
                  <h3 className="font-display font-bold text-lg text-text-dark group-hover:text-primary transition-colors leading-tight">
                    {post.name}
                  </h3>
                  <p className="text-xs text-text-muted mt-1.5 leading-relaxed line-clamp-2">
                    {post.description || 'Check out my custom travel itinerary, daily stops, and budget estimations.'}
                  </p>
                </div>

                {/* Info Pills */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-lg text-stone-600 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    {post.stops?.reduce((sum, s) => sum + s.durationDays, 0) || 5} Days
                  </div>
                  <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-lg text-stone-600 font-semibold">
                    <Wallet className="w-3.5 h-3.5 text-stone-400" />
                    Est. ${post.budget || post.estimatedCost}
                  </div>
                </div>

                {/* Stop badges */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Stops:</span>
                  {post.stops?.map((stop, i) => (
                    <span 
                      key={i}
                      className="inline-flex items-center gap-0.5 text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md"
                    >
                      <MapPin className="w-3 h-3" />
                      {stop.city}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons footer */}
              <div className="bg-stone-50/50 border-t border-stone-200/80 px-6 py-4 flex items-center justify-between gap-4">
                <span className="flex items-center gap-1 text-xs text-rose-500 font-bold">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  {post.likes || 12} Likes
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/public/trips/${post.id}`)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs rounded-lg transition-colors"
                  >
                    View Plan
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleCopyTrip(e, post.id, post.name)}
                    disabled={copyingId === post.id}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                  >
                    {copyingId === post.id ? 'Duplicating...' : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Trip
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
