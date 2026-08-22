import React, { useEffect, useState, useRef } from 'react';
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
  Wallet,
  AlertCircle,
  TrendingUp,
  Clock,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import Loader, { CardSkeleton } from '../components/ui/Loader';

export default function Community() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user, isDemoMode } = useAuth();

  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'popular'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copyingId, setCopyingId] = useState(null);
  const [likingIds, setLikingIds] = useState(new Set());

  const searchTimerRef = useRef(null);

  // Debounce search input (400ms)
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch community public trips
  const fetchCommunityTrips = async () => {
    setLoading(true);
    setError(false);
    try {
      if (isDemoMode) {
        let result = [...MOCK_COMMUNITY_TRIPS];
        if (debouncedSearch.trim()) {
          const q = debouncedSearch.toLowerCase().trim();
          result = result.filter(t => 
            (t.name || t.title || '').toLowerCase().includes(q) ||
            t.stops?.some(s => (s.city || '').toLowerCase().includes(q))
          );
        }
        if (sortBy === 'popular') {
          result.sort((a, b) => (b.likes || b.likeCount || 0) - (a.likes || a.likeCount || 0));
        }
        setPosts(result);
        setLoading(false);
        return;
      }

      const params = {};
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (sortBy === 'popular') {
        params.sort = 'popular';
      }

      const response = await communityService.getPublicTrips(params);
      const tripsData = Array.isArray(response) ? response : (response.data || response.posts || response.trips || []);
      setPosts(tripsData);
    } catch (err) {
      console.warn("Failed to fetch community trips from API:", err);
      if (isDemoMode) {
        setPosts(MOCK_COMMUNITY_TRIPS);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityTrips();
  }, [debouncedSearch, sortBy, isDemoMode]);

  // Copy trip action
  const handleCopyTrip = async (e, shareIdOrId, tripTitle) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user && !isDemoMode) {
      addToast("Please log in to copy this trip to your account.", "info");
      navigate('/login');
      return;
    }
    
    setCopyingId(shareIdOrId);
    try {
      if (isDemoMode) {
        const sourceTrip = MOCK_COMMUNITY_TRIPS.find(t => (t.shareId || t.id) === shareIdOrId) || MOCK_COMMUNITY_TRIPS[0];
        
        const newCopiedTrip = {
          id: `trip-copied-${Date.now()}`,
          name: `Copy of: ${tripTitle}`,
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
            durationDays: s.durationDays || 4,
            order: idx
          })) || [],
          itinerary: [],
          expenses: []
        };

        const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
        localStorage.setItem('demo_trips', JSON.stringify([...demoTrips, newCopiedTrip]));
        addToast(`Successfully duplicated: ${tripTitle}!`, 'success');
        navigate(`/trips/${newCopiedTrip.id}`);
      } else {
        const response = await tripService.copyTrip(shareIdOrId);
        const copiedTrip = response.data || response.trip || response;
        addToast(`Successfully duplicated: ${tripTitle}!`, 'success');
        navigate(`/trips/${copiedTrip.id}`);
      }
    } catch (err) {
      console.error("Failed to copy trip:", err);
      addToast("Failed to copy trip. Please try again.", "error");
    } finally {
      setCopyingId(null);
    }
  };

  // Toggle Like action
  const handleLikeTrip = async (e, tripId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user && !isDemoMode) {
      addToast("Please log in to like community trips.", "info");
      navigate('/login');
      return;
    }

    if (likingIds.has(tripId)) return;
    setLikingIds(prev => new Set(prev).add(tripId));

    try {
      if (isDemoMode) {
        setPosts(prev => prev.map(p => {
          if (p.id === tripId) {
            const currentlyLiked = p.isLiked;
            const currentCount = p.likeCount ?? p.likes ?? 0;
            return {
              ...p,
              isLiked: !currentlyLiked,
              likeCount: currentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
              likes: currentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1
            };
          }
          return p;
        }));
      } else {
        const res = await communityService.toggleLike(tripId);
        const isLikedNow = res.data?.liked;
        setPosts(prev => prev.map(p => {
          if (p.id === tripId) {
            const prevCount = p.likeCount ?? p.likes ?? 0;
            return {
              ...p,
              isLiked: isLikedNow,
              likeCount: isLikedNow ? prevCount + 1 : Math.max(0, prevCount - 1),
              likes: isLikedNow ? prevCount + 1 : Math.max(0, prevCount - 1)
            };
          }
          return p;
        }));
        addToast(isLikedNow ? 'Liked trip!' : 'Unliked trip', 'success');
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
      addToast("Failed to update like status.", "error");
    } finally {
      setLikingIds(prev => {
        const next = new Set(prev);
        next.delete(tripId);
        return next;
      });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans text-sm">
      {/* Header and search banner */}
      <div className="bg-white border border-stone-200 p-6 md:p-8 rounded-3xl shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text-dark tracking-tight leading-none flex items-center gap-2.5">
              <Users className="w-8 h-8 text-primary" />
              Traveler Share Board
            </h1>
            <p className="text-text-muted mt-2 text-sm">
              Get inspired by public itineraries shared by travelers around the world.
            </p>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setSortBy('newest')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sortBy === 'newest' 
                  ? 'bg-white text-stone-900 shadow-xs' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Newest
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sortBy === 'popular' 
                  ? 'bg-white text-stone-900 shadow-xs' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
              Popular
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by city name, route, or itinerary title..."
            className="w-full pl-11 pr-10 py-3 bg-bg-warm border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
          />
          {searchQuery && (
            <button 
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 font-bold text-xs bg-stone-200 rounded-full w-5 h-5 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        /* Error State */
        <div className="text-center py-12 bg-white border border-stone-200 rounded-3xl p-8 flex flex-col items-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center border border-rose-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-display font-extrabold text-lg text-stone-900">Unable to load community trips</h3>
          <p className="text-text-muted text-xs">Please check your network connection or server status and try again.</p>
          <button
            onClick={fetchCommunityTrips}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      ) : posts.length === 0 ? (
        /* Empty State */
        <div className="text-center py-14 bg-white border border-stone-200 border-dashed rounded-3xl flex flex-col items-center p-8 space-y-3">
          <div className="w-12 h-12 bg-stone-50 text-stone-400 rounded-full flex items-center justify-center border border-stone-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-base text-stone-800">
            {debouncedSearch ? 'No matching shared journeys found' : 'No public trips available yet'}
          </h3>
          <p className="text-text-muted text-xs max-w-sm">
            {debouncedSearch ? `No trips match "${debouncedSearch}". Try clearing your search query.` : 'Be the first traveler to publish your itinerary to the share board!'}
          </p>
          {debouncedSearch && (
            <button
              onClick={handleClearSearch}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        /* Public Trips Feed */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => {
            const tripTitle = post.title || post.name || 'Untitled Journey';
            const tripBudget = post.totalBudget ?? post.budget ?? post.estimatedCost ?? 0;
            const tripLikes = post.likeCount ?? post.likes ?? 0;
            const userName = post.user?.name || 'Explorer';
            const userAvatar = post.user?.profilePic || post.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80';
            const userLocation = post.user?.city ? `${post.user.city}${post.user.country ? `, ${post.user.country}` : ''}` : (post.user?.location || 'GlobeTrotter Member');
            const targetShareId = post.shareId || post.id;
            const isLiked = Boolean(post.isLiked);

            return (
              <div 
                key={post.id}
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="p-6 space-y-4">
                  {/* User card header */}
                  <div className="flex items-center gap-3">
                    <img 
                      src={userAvatar} 
                      alt={userName}
                      className="w-10 h-10 rounded-full border border-stone-200 object-cover shrink-0"
                    />
                    <div>
                      <div className="font-bold text-stone-900 text-sm leading-tight">{userName}</div>
                      <div className="text-xs text-text-muted mt-0.5">{userLocation}</div>
                    </div>
                  </div>

                  {/* Trip name & description */}
                  <div>
                    <h3 className="font-display font-bold text-lg text-text-dark group-hover:text-primary transition-colors leading-tight">
                      {tripTitle}
                    </h3>
                    <p className="text-xs text-text-muted mt-1.5 leading-relaxed line-clamp-2">
                      {post.description || 'Check out my custom travel itinerary, daily stops, and budget estimations.'}
                    </p>
                  </div>

                  {/* Info Pills */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-lg text-stone-600 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      {post.stops?.reduce((sum, s) => sum + (s.durationDays || 1), 0) || (post.itemCount || 5)} Days
                    </div>
                    <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-lg text-stone-600 font-semibold">
                      <Wallet className="w-3.5 h-3.5 text-stone-400" />
                      Est. ${tripBudget}
                    </div>
                  </div>

                  {/* Stop badges */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-2">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Stops:</span>
                    {post.stops && post.stops.length > 0 ? (
                      post.stops.map((stop, i) => (
                        <span 
                          key={i}
                          className="inline-flex items-center gap-0.5 text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md"
                        >
                          <MapPin className="w-3 h-3" />
                          {stop.city}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-text-muted italic">Multi-city stops</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons footer */}
                <div className="bg-stone-50/50 border-t border-stone-200/80 px-6 py-4 flex items-center justify-between gap-4">
                  <button
                    onClick={(e) => handleLikeTrip(e, post.id)}
                    disabled={likingIds.has(post.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                      isLiked 
                        ? 'bg-rose-50 text-rose-600 border-rose-200' 
                        : 'bg-white hover:bg-stone-100 text-stone-600 border-stone-200'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}`} />
                    {tripLikes} {tripLikes === 1 ? 'Like' : 'Likes'}
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/public/trips/${targetShareId}`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs rounded-lg transition-colors"
                    >
                      View Plan
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleCopyTrip(e, targetShareId, tripTitle)}
                      disabled={copyingId === targetShareId}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                    >
                      {copyingId === targetShareId ? 'Duplicating...' : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Trip
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
