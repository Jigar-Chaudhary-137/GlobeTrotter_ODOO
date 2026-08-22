import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { tripService } from '../services/tripService';
import { MOCK_CITIES, MOCK_ACTIVITIES } from '../utils/mockData';
import {
  Calendar,
  MapPin,
  Wallet,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Plane,
  PlusCircle,
  Star,
  DollarSign,
  Check,
  Compass,
  Clock
} from 'lucide-react';

export default function CreateTrip() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { isDemoMode } = useAuth();

  const [step, setStep] = useState(1);

  // Screen 4 states
  const [selectedPlace, setSelectedPlace] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);

  // Step 1 states
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');

  // Step 2 states (Stops)
  const [stops, setStops] = useState([]);
  const [currentCity, setCurrentCity] = useState('');
  const [currentCountry, setCurrentCountry] = useState('');
  const [currentArrival, setCurrentArrival] = useState('');
  const [currentDeparture, setCurrentDeparture] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Prefill city from Explore page if available
  useEffect(() => {
    if (location.state && location.state.prefilledCity) {
      setCurrentCity(location.state.prefilledCity);
      setCurrentCountry(location.state.prefilledCountry || '');
      setSelectedPlace(location.state.prefilledCity);
      setTripName(`Trip to ${location.state.prefilledCity}`);
    }
  }, [location.state]);

  const handlePlaceSelect = (val) => {
    setSelectedPlace(val);
    setCurrentCity(val);
    setTripName(`Trip to ${val}`);
    setBudget('1500'); // default budget cap
    const matchedCity = MOCK_CITIES.find(c => c.name.toLowerCase() === val.toLowerCase());
    if (matchedCity) {
      setCurrentCountry(matchedCity.country);
    }
  };

  const validateStep1 = () => {
    const errs = {};
    if (!selectedPlace) errs.selectedPlace = 'Select a Place is required';
    if (!startDate) errs.startDate = 'Start date is required';
    if (!endDate) errs.endDate = 'End date is required';
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errs.endDate = 'End date must be after start date';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitTripWithData = async (finalStops, initialItinerary = []) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: `Trip to ${selectedPlace}`,
        name: `Trip to ${selectedPlace}`,
        startDate,
        endDate,
        totalBudget: Number(budget || 1500),
        budget: Number(budget || 1500),
        stops: finalStops.map((s, idx) => ({
          city: s.city,
          country: s.country,
          arrivalDate: s.arrivalDate,
          departureDate: s.departureDate,
          order: s.order !== undefined ? s.order : idx + 1
        })),
        itineraryItems: initialItinerary.map(item => ({
          title: item.activityName || item.title,
          category: item.category,
          expense: item.cost || item.expense || 0,
          date: item.date,
          time: item.time,
          notes: item.notes
        }))
      };

      if (isDemoMode) {
        const mockNewTrip = {
          id: `trip-new-${Date.now()}`,
          name: `Trip to ${selectedPlace}`,
          title: `Trip to ${selectedPlace}`,
          startDate,
          endDate,
          budget: Number(budget || 1500),
          isPublic: false,
          stops: finalStops,
          itinerary: initialItinerary,
          expenses: []
        };
        const savedDemoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
        localStorage.setItem('demo_trips', JSON.stringify([...savedDemoTrips, mockNewTrip]));

        addToast('Trip created successfully in demo session!', 'success');
        navigate(`/trips/${mockNewTrip.id}`);
      } else {
        const response = await tripService.createTrip(payload);
        const createdId = response.trip?.id || response.id || response.data?.id;
        if (!createdId) throw new Error('Server returned invalid trip record.');
        addToast('Trip created successfully!', 'success');
        navigate(`/trips/${createdId}`);
      }
    } catch (err) {
      console.error("Trip creation API error:", err);
      const msg = err.response?.data?.message || err.message || 'Failed to create trip. Please try again.';
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
      const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      const singleStop = {
        id: `new-stop-${Date.now()}`,
        city: selectedPlace,
        country: currentCountry || 'Unknown',
        arrivalDate: startDate,
        departureDate: endDate,
        durationDays,
        order: 0
      };

      const initialItinerary = selectedActivities.map((act, index) => ({
        id: `item-${Date.now()}-${index}`,
        stopId: singleStop.id,
        date: startDate,
        time: act.time || '10:00',
        activityName: act.name,
        category: act.category || 'Activities',
        cost: act.cost || 0,
        notes: 'Suggested activity added during planning.'
      }));

      handleSubmitTripWithData([singleStop], initialItinerary);
    }
  };

  const handleAddStop = () => {
    // Left intact for compatibility
  };

  const handleRemoveStop = (id) => {
    // Left intact for compatibility
  };

  const handleSubmitTrip = async () => {
    if (stops.length === 0) {
      addToast('Please add at least one city stop to your trip.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: tripName,
        name: tripName,
        startDate,
        endDate,
        totalBudget: Number(budget),
        budget: Number(budget),
        stops: stops.map((s, idx) => ({
          city: s.city,
          country: s.country,
          arrivalDate: s.arrivalDate,
          departureDate: s.departureDate,
          order: s.order !== undefined ? s.order : idx + 1
        }))
      };

      if (isDemoMode) {
        const mockNewTrip = {
          id: `trip-new-${Date.now()}`,
          name: tripName,
          title: tripName,
          startDate,
          endDate,
          budget: Number(budget),
          isPublic: false,
          stops: stops,
          itinerary: [],
          expenses: []
        };
        const savedDemoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
        localStorage.setItem('demo_trips', JSON.stringify([...savedDemoTrips, mockNewTrip]));

        addToast('Trip created successfully in demo session!', 'success');
        navigate(`/trips/${mockNewTrip.id}`);
      } else {
        const response = await tripService.createTrip(payload);
        const createdId = response.trip?.id || response.id || response.data?.id;
        if (!createdId) throw new Error('Server returned invalid trip record.');
        addToast('Trip created successfully!', 'success');
        navigate(`/trips/${createdId}`);
      }
    } catch (err) {
      console.error("Trip creation API error:", err);
      const msg = err.response?.data?.message || err.message || 'Failed to create trip. Please try again.';
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in font-sans">
      {/* Wizard Progress Steps */}
      <div className="bg-white border border-stone-200 p-6 rounded-3xl flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            step === 1 ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
          }`}>
            1
          </div>
          <span className={`text-sm font-semibold ${step === 1 ? 'text-text-dark' : 'text-text-muted'}`}>Trip Details</span>
        </div>
        <div className="h-0.5 bg-stone-200 flex-1 mx-4" />
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            step === 2 ? 'bg-primary text-white' : 'bg-stone-100 text-stone-400'
          }`}>
            2
          </div>
          <span className={`text-sm font-semibold ${step === 2 ? 'text-text-dark' : 'text-text-muted'}`}>Destinations & Stops</span>
        </div>
      </div>

      {/* STEP 1: Basic Trip Details */}
      {step === 1 && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-white border border-stone-200 p-6 md:p-8 rounded-3xl shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="font-display font-extrabold text-xl text-text-dark flex items-center gap-2">
                <Plane className="w-6 h-6 text-primary" />
                Plan a new trip
              </h2>
              <p className="text-text-muted text-xs mt-1">Select your destination, set your dates, and select recommended activities below.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Select a Place */}
              <div>
                <label htmlFor="selectedPlace" className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-stone-400" />
                  Select a Place
                </label>
                <select
                  id="selectedPlace"
                  value={selectedPlace}
                  onChange={(e) => handlePlaceSelect(e.target.value)}
                  className={`w-full p-3 bg-bg-warm border rounded-xl text-sm font-semibold text-stone-850 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    errors.selectedPlace ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-stone-200'
                  }`}
                >
                  <option value="">-- Choose Place --</option>
                  {MOCK_CITIES.map(c => (
                    <option key={c.id} value={c.name}>{c.name}, {c.country}</option>
                  ))}
                </select>
                {errors.selectedPlace && <p className="text-xs text-rose-600 font-medium mt-1">{errors.selectedPlace}</p>}
              </div>

              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1.5">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full p-3 bg-bg-warm border rounded-xl text-sm font-medium ${
                    errors.startDate ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-stone-200'
                  }`}
                />
                {errors.startDate && <p className="text-xs text-rose-600 font-medium mt-1">{errors.startDate}</p>}
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1.5">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full p-3 bg-bg-warm border rounded-xl text-sm font-medium ${
                    errors.endDate ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-stone-200'
                  }`}
                />
                {errors.endDate && <p className="text-xs text-rose-600 font-medium mt-1">{errors.endDate}</p>}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleNextStep}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 py-3 px-6 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Generating Trip...' : 'Generate Trip Itinerary'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Suggestions for Places to Visit/Activities to perform */}
          <div className="space-y-4 pt-2">
            <div className="border-b border-stone-200 pb-2">
              <h3 className="font-display font-bold text-lg text-text-dark flex items-center gap-2">
                <Compass className="w-5.5 h-5.5 text-primary" />
                Suggestions for Places to Visit / Activities to perform
              </h3>
              <p className="text-xs text-text-muted mt-1">Pick recommended options below to automatically insert them into your itinerary.</p>
            </div>

            {selectedPlace ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {(MOCK_ACTIVITIES[selectedPlace.toLowerCase().replace(' ', '-')] || []).map((activity) => {
                  const isSelected = selectedActivities.some(act => act.id === activity.id);
                  return (
                    <div
                      key={activity.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedActivities(selectedActivities.filter(act => act.id !== activity.id));
                        } else {
                          setSelectedActivities([...selectedActivities, activity]);
                        }
                      }}
                      className={`bg-white border p-5 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer group flex flex-col justify-between transform hover:-translate-y-0.5 select-none relative overflow-hidden ${
                        isSelected
                          ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                          : 'border-stone-200/80 hover:border-stone-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-5.5 h-5.5 bg-secondary text-white rounded-full flex items-center justify-center animate-scale-in">
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        </div>
                      )}
                      <div>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-stone-100 text-stone-500 uppercase tracking-wider">
                          {activity.category}
                        </span>
                        <h4 className="font-bold text-stone-905 text-sm mt-3 leading-snug group-hover:text-primary transition-colors pr-3">
                          {activity.name}
                        </h4>
                      </div>
                      <div className="mt-6 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-text-muted font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          {activity.duration}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-stone-800">
                          <DollarSign className="w-3.5 h-3.5 text-stone-400" />
                          {activity.cost === 0 ? 'Free' : `$${activity.cost}`}
                        </span>
                        <span className="flex items-center gap-1 text-secondary-dark font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {activity.rating}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {(MOCK_ACTIVITIES[selectedPlace.toLowerCase().replace(' ', '-')] || []).length === 0 && (
                  <div className="col-span-full text-center text-xs text-text-muted py-8 bg-white border border-stone-200 rounded-3xl">
                    No suggestions available for this place.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-stone-200 p-12 rounded-3xl text-center text-xs text-text-muted">
                Select a place from the dropdown above to display matching activity recommendations.
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Multi-City Stops Scheduler */}
      {step === 2 && (
        <div className="bg-white border border-stone-200 p-6 md:p-8 rounded-3xl shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4 flex justify-between items-center">
            <div>
              <h2 className="font-display font-extrabold text-xl text-text-dark flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary" />
                Add Destinations
              </h2>
              <p className="text-text-muted text-xs mt-1">Specify stops for your trip ({startDate} to {endDate})</p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-stone-500 hover:text-stone-700 text-xs font-bold flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          {/* Added stops preview */}
          {stops.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-text-dark uppercase tracking-wider">Your Route</h3>
              <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 bg-bg-warm/30">
                {stops.map((stop, index) => (
                  <div key={stop.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-bold text-stone-900 text-sm">{stop.city}, {stop.country}</div>
                        <div className="text-xs text-text-muted font-medium mt-0.5">
                          {stop.arrivalDate} to {stop.departureDate} ({stop.durationDays} {stop.durationDays === 1 ? 'day' : 'days'})
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveStop(stop.id)}
                      className="text-stone-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Stop Form */}
          <div className="bg-bg-warm/50 border border-stone-200/80 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-text-dark uppercase tracking-wider flex items-center gap-1">
              <PlusCircle className="w-4 h-4 text-primary" />
              Add Next Destination Stop
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="stopCity" className="block text-xs font-bold text-stone-600 mb-1">City Name</label>
                <input
                  id="stopCity"
                  type="text"
                  value={currentCity}
                  onChange={(e) => setCurrentCity(e.target.value)}
                  placeholder="e.g. Dubai"
                  className={`w-full p-2.5 bg-white border border-stone-200 rounded-lg text-sm ${
                    errors.stopCity ? 'border-rose-300 ring-2 ring-rose-500/10' : ''
                  }`}
                />
                {errors.stopCity && <p className="text-xs text-rose-600 font-medium mt-1">{errors.stopCity}</p>}
              </div>

              <div>
                <label htmlFor="stopCountry" className="block text-xs font-bold text-stone-600 mb-1">Country (Optional)</label>
                <input
                  id="stopCountry"
                  type="text"
                  value={currentCountry}
                  onChange={(e) => setCurrentCountry(e.target.value)}
                  placeholder="e.g. United Arab Emirates"
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="stopArrival" className="block text-xs font-bold text-stone-600 mb-1">Arrival Date</label>
                <input
                  id="stopArrival"
                  type="date"
                  value={currentArrival}
                  onChange={(e) => setCurrentArrival(e.target.value)}
                  className={`w-full p-2.5 bg-white border border-stone-200 rounded-lg text-sm ${
                    errors.stopArrival ? 'border-rose-300 ring-2 ring-rose-500/10' : ''
                  }`}
                />
                {errors.stopArrival && <p className="text-xs text-rose-600 font-medium mt-1">{errors.stopArrival}</p>}
              </div>

              <div>
                <label htmlFor="stopDeparture" className="block text-xs font-bold text-stone-600 mb-1">Departure Date</label>
                <input
                  id="stopDeparture"
                  type="date"
                  value={currentDeparture}
                  onChange={(e) => setCurrentDeparture(e.target.value)}
                  className={`w-full p-2.5 bg-white border border-stone-200 rounded-lg text-sm ${
                    errors.stopDeparture ? 'border-rose-300 ring-2 ring-rose-500/10' : ''
                  }`}
                />
                {errors.stopDeparture && <p className="text-xs text-rose-600 font-medium mt-1">{errors.stopDeparture}</p>}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddStop}
              className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-lg transition-colors"
            >
              Add Stop
            </button>
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="py-3 px-5 border border-stone-200 text-stone-600 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors"
            >
              Back to Basics
            </button>
            <button
              onClick={handleSubmitTrip}
              disabled={isSubmitting || stops.length === 0}
              className="py-3 px-6 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-all shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Trip...' : 'Generate Trip Itinerary'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
