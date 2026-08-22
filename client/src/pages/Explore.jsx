import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exploreService } from '../services/exploreService';
import { tripService } from '../services/tripService';
import { MOCK_CITIES, MOCK_ACTIVITIES } from '../utils/mockData';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  MapPin, 
  Compass, 
  Star, 
  Clock, 
  Plus, 
  DollarSign, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import Loader, { CardSkeleton } from '../components/ui/Loader';
import Modal from '../components/ui/Modal';

const FALLBACK_CITY_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';

export default function Explore() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isDemoMode } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [loading, setLoading] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [trips, setTrips] = useState([]);
  
  // Add activity to trip modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedActivityToAdd, setSelectedActivityToAdd] = useState(null);
  const [targetTripId, setTargetTripId] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('09:00');
  const [targetNotes, setTargetNotes] = useState('');
  const [submittingActivity, setSubmittingActivity] = useState(false);

  // Search cities handler
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSelectedCity(null);
    setActivities([]);
    try {
      if (isDemoMode) {
        // Mock search logic
        const query = searchQuery.toLowerCase();
        const filtered = MOCK_CITIES.filter(
          c => c.name.toLowerCase().includes(query) || c.country.toLowerCase().includes(query)
        );
        setCities(filtered);
        setLoading(false);
        return;
      }

      const results = await exploreService.searchCities(searchQuery);
      setCities(Array.isArray(results) ? results : results.cities || []);
    } catch (err) {
      console.warn("City search API failed, falling back to mock search:", err);
      // Fallback
      const query = searchQuery.toLowerCase();
      const filtered = MOCK_CITIES.filter(
        c => c.name.toLowerCase().includes(query) || c.country.toLowerCase().includes(query)
      );
      setCities(filtered);
    } finally {
      setLoading(false);
    }
  };

  // Select city handler
  const handleSelectCity = async (city) => {
    setSelectedCity(city);
    setLoadingActivities(true);
    setActivities([]);
    setSelectedCategory('All');
    
    try {
      if (isDemoMode) {
        // Fetch from MOCK_ACTIVITIES Map
        const mockActs = MOCK_ACTIVITIES[city.id] || MOCK_ACTIVITIES[city.name.toLowerCase()] || [];
        setActivities(mockActs);
        setLoadingActivities(false);
        return;
      }

      const results = await exploreService.searchActivities(city.name);
      setActivities(Array.isArray(results) ? results : results.activities || []);
    } catch (err) {
      console.warn("Activities search API failed, loading mock attractions:", err);
      const mockActs = MOCK_ACTIVITIES[city.id] || MOCK_ACTIVITIES[city.name.toLowerCase()] || [];
      setActivities(mockActs);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Open "Add Activity" Modal
  const handleOpenAddModal = async (activity) => {
    setSelectedActivityToAdd(activity);
    setIsAddModalOpen(true);
    
    // Fetch upcoming trips to select from
    try {
      const data = isDemoMode ? require('../utils/mockData').MOCK_TRIPS : await tripService.getTrips();
      const list = Array.isArray(data) ? data : data.trips || [];
      setTrips(list);
      if (list.length > 0) {
        setTargetTripId(list[0].id);
        setTargetDate(list[0].startDate);
      }
    } catch (err) {
      console.warn("Could not load trips for selection:", err);
      setTrips(MOCK_TRIPS);
      setTargetTripId(MOCK_TRIPS[0].id);
      setTargetDate(MOCK_TRIPS[0].startDate);
    }
  };

  // Submit adding activity to trip
  const handleAddActivitySubmit = async (e) => {
    e.preventDefault();
    if (!targetTripId || !selectedActivityToAdd) return;

    setSubmittingActivity(true);
    try {
      const payload = {
        activityName: selectedActivityToAdd.name,
        category: selectedActivityToAdd.category,
        cost: Number(selectedActivityToAdd.cost || 0),
        time: targetTime,
        date: targetDate,
        notes: targetNotes || `Added from Explore page for ${selectedCity.name}`
      };

      if (isDemoMode) {
        addToast(`Activity "${selectedActivityToAdd.name}" added to demo trip!`, "success");
      } else {
        await tripService.addItineraryItem(targetTripId, payload);
        addToast(`Activity "${selectedActivityToAdd.name}" added successfully!`, "success");
      }
      setIsAddModalOpen(false);
      setSelectedActivityToAdd(null);
      setTargetNotes('');
    } catch (err) {
      console.error("Failed to add activity:", err);
      addToast("Failed to add activity to trip. Try again.", "error");
    } finally {
      setSubmittingActivity(false);
    }
  };

  // Trigger Plan Trip wizard
  const handleStartTripWithCity = (city) => {
    navigate('/create-trip', { state: { prefilledCity: city.name, prefilledCountry: city.country } });
  };

  // Get categories list
  const categories = ['All', ...new Set(activities.map(a => a.category))];

  // Filter activities
  const filteredActivities = selectedCategory === 'All'
    ? activities
    : activities.filter(a => a.category === selectedCategory);

  // Initial load: show featured destinations
  useEffect(() => {
    setCities(MOCK_CITIES);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Top Banner Search Area */}
      <div className="bg-white border border-stone-200 p-6 md:p-8 rounded-3xl shadow-xs">
        <div className="max-w-xl">
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text-dark tracking-tight">
            Explore Destinations
          </h1>
          <p className="text-text-muted mt-1 text-sm">
            Search for your favorite travel spots and discover local attractions, eateries, and cultural hubs.
          </p>
          
          <form onSubmit={handleSearch} className="mt-6 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for Paris, London, Tokyo..."
                className="w-full pl-11 pr-4 py-3 bg-bg-warm border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-colors shadow-xs"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Loader */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {/* Search results - Cities grid */}
      {!loading && !selectedCity && (
        <div className="space-y-4">
          <h2 className="font-display font-bold text-lg text-text-dark">
            {searchQuery ? 'Search Results' : 'Featured Destinations'}
          </h2>
          {cities.length === 0 ? (
            <div className="text-center py-10 bg-white border border-stone-200 border-dashed rounded-3xl flex flex-col items-center">
              <AlertCircle className="w-10 h-10 text-stone-400 mb-2" />
              <p className="text-text-muted text-sm font-medium">No destinations found. Try searching for Paris or London.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {cities.map((city) => (
                <div 
                  key={city.id}
                  className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="relative h-44 bg-stone-100">
                    <img 
                      src={city.image || FALLBACK_CITY_IMAGE} 
                      alt={city.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = FALLBACK_CITY_IMAGE;
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-bold text-stone-800 flex items-center gap-1 shadow-xs">
                      <MapPin className="w-3 h-3 text-primary" />
                      {city.country}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-bold text-lg text-stone-900 leading-tight">{city.name}</h3>
                      <p className="text-xs text-text-muted mt-1.5 leading-relaxed line-clamp-2">
                        {city.description || 'Discover attractions, local cuisines, and travel memories.'}
                      </p>
                    </div>
                    <div className="mt-5 flex gap-2">
                      <button
                        onClick={() => handleSelectCity(city)}
                        className="flex-1 py-2 px-3 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-lg transition-colors"
                      >
                        Explore Attractions
                      </button>
                      <button
                        onClick={() => handleStartTripWithCity(city)}
                        className="py-2 px-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-lg transition-colors"
                      >
                        Plan Trip
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected City & Activities View */}
      {selectedCity && (
        <div className="space-y-8 animate-fade-in">
          {/* Back button and banner */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setSelectedCity(null)}
              className="text-stone-500 hover:text-stone-700 text-xs font-bold flex items-center gap-1 self-start"
            >
              ← Back to Destinations
            </button>
            
            <div className="relative rounded-3xl overflow-hidden h-64 shadow-md">
              <img 
                src={selectedCity.image || FALLBACK_CITY_IMAGE} 
                alt={selectedCity.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = FALLBACK_CITY_IMAGE;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 md:p-8">
                <span className="text-xs font-bold uppercase tracking-wider text-primary-light">{selectedCity.country}</span>
                <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white mt-1 leading-none">{selectedCity.name}</h1>
                <p className="text-stone-200 text-sm max-w-2xl mt-2 line-clamp-2 leading-relaxed">
                  {selectedCity.description || 'Welcome to one of the most popular destinations in the world.'}
                </p>
              </div>
            </div>
          </div>

          {/* Activities display */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
              <h2 className="font-display font-bold text-lg text-text-dark">Popular Local Experiences</h2>
              
              {/* Category selector pills */}
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${
                      selectedCategory === cat
                        ? 'bg-primary text-white'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {loadingActivities ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : filteredActivities.length === 0 ? (
              <p className="text-text-muted text-sm italic py-4">No activities found in this category.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredActivities.map((act) => (
                  <div 
                    key={act.id}
                    className="bg-white border border-stone-200 p-5 rounded-2xl flex flex-col sm:flex-row justify-between gap-4 shadow-xs"
                  >
                    <div className="space-y-2">
                      <span className="inline-block text-[10px] font-extrabold text-secondary uppercase bg-secondary-light/30 px-2 py-0.5 rounded-md">
                        {act.category}
                      </span>
                      <h3 className="font-display font-bold text-base text-text-dark">{act.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted font-medium">
                        {act.rating && (
                          <span className="flex items-center gap-1 text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            {act.rating}
                          </span>
                        )}
                        {act.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            {act.duration}
                          </span>
                        )}
                        {act.time && (
                          <span>Suggested: {act.time}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 border-stone-100 pt-3 sm:pt-0 shrink-0">
                      <div className="text-right">
                        <span className="text-xs text-text-muted block font-medium">Est. Cost</span>
                        <span className="font-bold text-sm text-emerald-600">
                          {act.cost > 0 ? `$${act.cost}` : 'Free'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenAddModal(act)}
                        className="inline-flex items-center gap-1 py-1.5 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add to Trip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Experience to Trip"
      >
        {trips.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-text-muted mb-4">You must have an upcoming trip to add activities.</p>
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                navigate('/create-trip');
              }}
              className="py-2 px-4 bg-primary text-white text-sm font-bold rounded-lg"
            >
              Create a Trip
            </button>
          </div>
        ) : (
          <form onSubmit={handleAddActivitySubmit} className="space-y-4 font-sans text-sm">
            <div>
              <label className="block text-xs font-bold text-text-dark mb-1">Experience</label>
              <div className="font-semibold text-stone-900 text-sm bg-stone-100 p-2.5 rounded-lg border border-stone-200">
                {selectedActivityToAdd?.name} ({selectedActivityToAdd?.category})
              </div>
            </div>

            <div>
              <label htmlFor="tripSelect" className="block text-xs font-bold text-text-dark mb-1">Select Trip</label>
              <select
                id="tripSelect"
                value={targetTripId}
                onChange={(e) => {
                  setTargetTripId(e.target.value);
                  const selected = trips.find(t => t.id === e.target.value);
                  if (selected) setTargetDate(selected.startDate);
                }}
                className="w-full p-2.5 border border-stone-200 rounded-lg focus:ring-primary focus:border-primary text-sm font-medium"
              >
                {trips.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="activityDate" className="block text-xs font-bold text-text-dark mb-1">Date</label>
                <input
                  id="activityDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-lg text-sm font-medium"
                  required
                />
              </div>
              <div>
                <label htmlFor="activityTime" className="block text-xs font-bold text-text-dark mb-1">Preferred Time</label>
                <input
                  id="activityTime"
                  type="time"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-lg text-sm font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="activityNotes" className="block text-xs font-bold text-text-dark mb-1">Itinerary Notes</label>
              <textarea
                id="activityNotes"
                value={targetNotes}
                onChange={(e) => setTargetNotes(e.target.value)}
                placeholder="e.g. Bring tickets, wear walking shoes..."
                className="w-full p-2.5 border border-stone-200 rounded-lg text-sm font-medium h-20 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={submittingActivity}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-lg transition-colors flex justify-center items-center"
            >
              {submittingActivity ? 'Adding...' : 'Confirm Addition'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
