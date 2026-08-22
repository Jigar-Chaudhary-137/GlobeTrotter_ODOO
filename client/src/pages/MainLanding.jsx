import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripService } from '../services/tripService';
import { MOCK_CITIES, MOCK_TRIPS } from '../utils/mockData';
import { 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  FolderPlus, 
  MapPin, 
  Calendar, 
  Wallet, 
  Plus, 
  Compass,
  ArrowRight,
  Plane
} from 'lucide-react';

export default function MainLanding() {
  const navigate = useNavigate();
  const { isDemoMode } = useAuth();
  
  // Data States
  const [trips, setTrips] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interaction states
  const [activeContinent, setActiveContinent] = useState('All'); // filter
  const [sortBy, setSortBy] = useState('name-asc'); // sort: name-asc, name-desc
  const [groupByContinent, setGroupByContinent] = useState(false); // group by toggle
  
  // Dropdown visibility
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Extend mock cities with continent data for filter/group functionality
  const REGIONS = [
    { ...MOCK_CITIES[0], continent: 'Europe' }, // Paris
    { ...MOCK_CITIES[1], continent: 'Europe' }, // London
    { ...MOCK_CITIES[2], continent: 'Asia' },   // Tokyo
    { ...MOCK_CITIES[3], continent: 'Middle East' }, // Dubai
    { ...MOCK_CITIES[4], continent: 'Asia' },   // Mumbai
  ];

  // Fetch / Combine Trips
  useEffect(() => {
    const loadTrips = async () => {
      try {
        let loadedTrips = [];
        if (isDemoMode) {
          loadedTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
        } else {
          const data = await tripService.getTrips();
          loadedTrips = Array.isArray(data) ? data : (data.trips || []);
        }
        setTrips(loadedTrips);
      } catch (err) {
        console.error("Failed to load trips from API", err);
        setTrips([]);
      }
    };

    loadTrips();
  }, [isDemoMode]);

  // Handle Plan a Trip button click
  const handlePlanTripClick = () => {
    navigate('/create-trip');
  };

  // Filter regional selections based on search query and active continent filter
  const filteredRegions = REGIONS.filter(region => {
    const matchesSearch = region.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          region.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesContinent = activeContinent === 'All' || region.continent === activeContinent;
    return matchesSearch && matchesContinent;
  });

  // Sort regional selections
  const sortedRegions = [...filteredRegions].sort((a, b) => {
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'name-desc') {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });

  // Group by Continent structure
  const groupedRegions = sortedRegions.reduce((acc, region) => {
    const key = region.continent;
    if (!acc[key]) acc[key] = [];
    acc[key].push(region);
    return acc;
  }, {});

  // Handle clicking a regional selection card -> pre-fill Create Trip page
  const handleRegionClick = (city) => {
    navigate('/create-trip', { 
      state: { prefilledCity: city.name, prefilledCountry: city.country } 
    });
  };

  // Handle clicking a previous trip card -> navigate to Build Itinerary
  const handleTripCardClick = (tripId) => {
    navigate(`/trips/${tripId}`);
  };

  return (
    <div className="space-y-10 font-sans pb-16">
      
      {/* 1. Banner Image Hero Section */}
      <div className="relative h-64 md:h-80 w-full rounded-3xl overflow-hidden shadow-lg">
        <img 
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&h=400&q=80" 
          alt="Travel Banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/30 to-black/10 flex flex-col justify-end p-6 md:p-10">
          <h1 className="font-display font-extrabold text-3xl md:text-5xl text-white tracking-tight">
            Map Your Next Adventure
          </h1>
          <p className="text-stone-200 text-sm md:text-base mt-2 max-w-xl font-medium">
            Plan itineraries, discover region selections, and organize trip elements with GlobeTrotter.
          </p>
        </div>
      </div>

      {/* 2. Interactive Search & Controls Row */}
      <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        
        {/* Search bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-stone-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search regional destinations (e.g. Paris, Tokyo...)"
            className="block w-full pl-11 pr-4 py-2.5 bg-bg-warm border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
          />
        </div>

        {/* Sorting, Filtering, and Grouping buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Group By button */}
          <button
            onClick={() => setGroupByContinent(!groupByContinent)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              groupByContinent 
                ? 'bg-primary text-white border-primary shadow-xs' 
                : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-600'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Group By {groupByContinent ? 'Continent' : 'Region'}</span>
          </button>

          {/* Filter dropdown button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowFilterMenu(!showFilterMenu);
                setShowSortMenu(false);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold uppercase tracking-wider text-stone-600 transition-all cursor-pointer ${
                activeContinent !== 'All' ? 'border-primary text-primary bg-primary/5' : ''
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filter: {activeContinent}</span>
            </button>
            
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-lg z-50 py-1 font-semibold text-xs text-stone-700 animate-fade-in">
                {['All', 'Europe', 'Asia', 'Middle East'].map((continent) => (
                  <button
                    key={continent}
                    onClick={() => {
                      setActiveContinent(continent);
                      setShowFilterMenu(false);
                    }}
                    className={`block w-full text-left px-4 py-2 hover:bg-stone-50 transition-colors ${
                      activeContinent === continent ? 'text-primary bg-primary/5 font-bold' : ''
                    }`}
                  >
                    {continent}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort By dropdown button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSortMenu(!showSortMenu);
                setShowFilterMenu(false);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold uppercase tracking-wider text-stone-600 transition-all cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>Sort: {sortBy === 'name-asc' ? 'A-Z' : 'Z-A'}</span>
            </button>

            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-lg z-50 py-1 font-semibold text-xs text-stone-700 animate-fade-in">
                <button
                  onClick={() => {
                    setSortBy('name-asc');
                    setShowSortMenu(false);
                  }}
                  className={`block w-full text-left px-4 py-2 hover:bg-stone-50 transition-colors ${
                    sortBy === 'name-asc' ? 'text-primary bg-primary/5 font-bold' : ''
                  }`}
                >
                  Name (A - Z)
                </button>
                <button
                  onClick={() => {
                    setSortBy('name-desc');
                    setShowSortMenu(false);
                  }}
                  className={`block w-full text-left px-4 py-2 hover:bg-stone-50 transition-colors ${
                    sortBy === 'name-desc' ? 'text-primary bg-primary/5 font-bold' : ''
                  }`}
                >
                  Name (Z - A)
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 3. Top Regional Selections Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-extrabold text-xl md:text-2xl text-text-dark flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            Top Regional Selections
          </h2>
          <span className="text-xs text-text-muted font-bold tracking-wider uppercase bg-stone-100 px-3 py-1 rounded-md">
            {sortedRegions.length} available
          </span>
        </div>

        {groupByContinent ? (
          // Grouped Layout
          <div className="space-y-8">
            {Object.keys(groupedRegions).map(continent => (
              <div key={continent} className="space-y-3">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-stone-200 pb-1.5">
                  {continent}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  {groupedRegions[continent].map(city => (
                    <div 
                      key={city.id}
                      onClick={() => handleRegionClick(city)}
                      className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group transform hover:-translate-y-0.5"
                    >
                      <div className="h-32 w-full overflow-hidden relative">
                        <img 
                          src={city.image} 
                          alt={city.name}
                          className="w-full h-full object-cover transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-[10px] text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                          {city.continent}
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-bold text-stone-900 text-sm group-hover:text-primary transition-colors">{city.name}</h4>
                        <p className="text-xs text-text-muted font-medium mt-0.5">{city.country}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Standard Grid Layout (5 cards columns on desktop)
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 animate-fade-in">
            {sortedRegions.map(city => (
              <div 
                key={city.id}
                onClick={() => handleRegionClick(city)}
                className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group transform hover:-translate-y-0.5"
              >
                <div className="h-36 w-full overflow-hidden relative">
                  <img 
                    src={city.image} 
                    alt={city.name}
                    className="w-full h-full object-cover transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-[10px] text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    {city.continent}
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="font-bold text-stone-900 text-sm group-hover:text-primary transition-colors">{city.name}</h4>
                  <p className="text-xs text-text-muted font-medium mt-0.5">{city.country}</p>
                  <p className="text-[10px] text-text-muted line-clamp-2 mt-2 leading-relaxed font-sans">
                    {city.description}
                  </p>
                </div>
              </div>
            ))}
            {sortedRegions.length === 0 && (
              <div className="col-span-full py-8 text-center text-stone-400 text-sm font-medium">
                No matching regions found. Adjust your search or filters.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Previous Trips Section */}
      <div className="space-y-4">
        <h2 className="font-display font-extrabold text-xl md:text-2xl text-text-dark flex items-center gap-2">
          <Plane className="w-6 h-6 text-primary" />
          Previous Trips
        </h2>

        {/* 3 columns grid */}
        {trips.length === 0 ? (
          <div className="bg-white border border-stone-200 border-dashed p-8 rounded-3xl text-center space-y-2">
            <p className="text-text-muted text-xs font-semibold">No trips created yet. Click "Plan a Trip" below to build your first itinerary!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trips.map(trip => (
              <div 
                key={trip.id}
                onClick={() => handleTripCardClick(trip.id)}
                className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-stone-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-stone-900 text-sm leading-snug group-hover:text-primary transition-colors">
                      {trip.name}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 uppercase tracking-wider ${
                      trip.isPublic 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-stone-100 text-stone-600'
                    }`}>
                      {trip.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2">
                    {/* Date range */}
                    <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                      <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                      <span>{trip.startDate} to {trip.endDate}</span>
                    </div>

                    {/* Budget */}
                    <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                      <Wallet className="w-4 h-4 text-stone-400 shrink-0" />
                      <span>Budget: ${(trip.budget || 0).toLocaleString()}</span>
                    </div>

                    {/* Stops */}
                    <div className="flex items-start gap-2 text-xs text-stone-600 font-medium">
                      <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        Stops: {trip.stops?.map(s => s.city).join(' → ') || 'No stops mapped'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-primary font-bold">
                  <span>View Itinerary</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Plan a Trip Button */}
      <div className="text-center pt-4">
        <button
          onClick={handlePlanTripClick}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover active:scale-98 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Plan a Trip</span>
        </button>
      </div>

    </div>
  );
}
