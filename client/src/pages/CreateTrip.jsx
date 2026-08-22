import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { tripService } from '../services/tripService';
import { MOCK_CITIES } from '../utils/mockData';
import { 
  Calendar, 
  MapPin, 
  Wallet, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  Plane,
  PlusCircle
} from 'lucide-react';

export default function CreateTrip() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { isDemoMode } = useAuth();

  const [step, setStep] = useState(1);

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
      setTripName(`Trip to ${location.state.prefilledCity}`);
    }
  }, [location.state]);

  const validateStep1 = () => {
    const errs = {};
    if (!tripName.trim()) errs.tripName = 'Trip name is required';
    if (!startDate) errs.startDate = 'Start date is required';
    if (!endDate) errs.endDate = 'End date is required';
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errs.endDate = 'End date must be after start date';
    }
    if (!budget || Number(budget) <= 0) errs.budget = 'Please enter a valid budget';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      // Auto-set initial dates for stops to match trip bounds
      if (!currentArrival) setCurrentArrival(startDate);
      if (!currentDeparture) setCurrentDeparture(endDate);
      setStep(2);
    }
  };

  const handleAddStop = () => {
    const errs = {};
    if (!currentCity.trim()) errs.stopCity = 'City is required';
    if (!currentArrival) errs.stopArrival = 'Arrival date is required';
    if (!currentDeparture) errs.stopDeparture = 'Departure date is required';
    
    // Date bounds checking
    if (currentArrival && currentDeparture && new Date(currentArrival) > new Date(currentDeparture)) {
      errs.stopDeparture = 'Departure must be after arrival';
    }
    if (startDate && currentArrival && new Date(currentArrival) < new Date(startDate)) {
      errs.stopArrival = 'Arrival cannot be before trip starts';
    }
    if (endDate && currentDeparture && new Date(currentDeparture) > new Date(endDate)) {
      errs.stopDeparture = 'Departure cannot be after trip ends';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    
    // Calculate days duration
    const diffTime = Math.abs(new Date(currentDeparture) - new Date(currentArrival));
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const newStop = {
      id: `new-stop-${Date.now()}`,
      city: currentCity,
      country: currentCountry || 'Unknown',
      arrivalDate: currentArrival,
      departureDate: currentDeparture,
      durationDays,
      order: stops.length
    };

    setStops([...stops, newStop]);
    setCurrentCity('');
    setCurrentCountry('');
    setCurrentArrival('');
    setCurrentDeparture('');
    addToast(`Added stop: ${newStop.city}`, 'success');
  };

  const handleRemoveStop = (id) => {
    setStops(stops.filter(s => s.id !== id).map((s, index) => ({ ...s, order: index })));
  };

  const handleSubmitTrip = async () => {
    if (stops.length === 0) {
      addToast('Please add at least one city stop to your trip.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: tripName,
        startDate,
        endDate,
        budget: Number(budget),
        stops: stops.map(s => ({
          city: s.city,
          country: s.country,
          arrivalDate: s.arrivalDate,
          departureDate: s.departureDate,
          durationDays: s.durationDays,
          order: s.order
        }))
      };

      if (isDemoMode) {
        // Create mock trip item in local storage/context simulation
        const mockNewTrip = {
          id: `trip-new-${Date.now()}`,
          name: tripName,
          startDate,
          endDate,
          budget: Number(budget),
          isPublic: false,
          stops: stops,
          itinerary: [],
          expenses: []
        };
        // Save to cache for builder page to pull
        const savedDemoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
        localStorage.setItem('demo_trips', JSON.stringify([...savedDemoTrips, mockNewTrip]));

        addToast('Trip created successfully in demo session!', 'success');
        navigate(`/trips/${mockNewTrip.id}`);
      } else {
        const response = await tripService.createTrip(payload);
        addToast('Trip created successfully!', 'success');
        navigate(`/trips/${response.trip?.id || response.id}`);
      }
    } catch (err) {
      console.warn("Trip creation API failed, executing demo session fallback:", err);
      // Fallback
      const mockNewTrip = {
        id: `trip-new-${Date.now()}`,
        name: tripName,
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
      
      addToast('Trip created successfully (Offline Demo Mode)!', 'success');
      navigate(`/trips/${mockNewTrip.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in font-sans">
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
        <div className="bg-white border border-stone-200 p-6 md:p-8 rounded-3xl shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="font-display font-extrabold text-xl text-text-dark flex items-center gap-2">
              <Plane className="w-6 h-6 text-primary" />
              Plan Your Adventure
            </h2>
            <p className="text-text-muted text-xs mt-1">Configure your trip name, dates, and budget bounds.</p>
          </div>

          <div className="space-y-4">
            {/* Trip Name */}
            <div>
              <label htmlFor="tripName" className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1.5">
                Trip Name
              </label>
              <input
                id="tripName"
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="e.g. My Euro Tour 2026"
                className={`w-full p-3 bg-bg-warm border rounded-xl text-sm font-medium ${
                  errors.tripName ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-stone-200'
                }`}
              />
              {errors.tripName && <p className="text-xs text-rose-600 font-medium mt-1">{errors.tripName}</p>}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Budget */}
            <div>
              <label htmlFor="budget" className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Wallet className="w-4 h-4 text-stone-400" />
                Estimated Trip Budget ($)
              </label>
              <input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 3500"
                className={`w-full p-3 bg-bg-warm border rounded-xl text-sm font-medium ${
                  errors.budget ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-stone-200'
                }`}
              />
              {errors.budget && <p className="text-xs text-rose-600 font-medium mt-1">{errors.budget}</p>}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleNextStep}
              className="inline-flex items-center gap-1.5 py-3 px-6 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-all shadow-xs"
            >
              Continue to Stops
              <ArrowRight className="w-4 h-4" />
            </button>
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
