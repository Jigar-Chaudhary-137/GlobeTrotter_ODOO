import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { tripService } from '../services/tripService';
import { MOCK_TRIPS, MOCK_CITIES } from '../utils/mockData';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  MapPin, 
  Globe, 
  Image as ImageIcon, 
  Calendar, 
  Wallet,
  Settings,
  Compass,
  ArrowRight,
  Camera,
  Loader2
} from 'lucide-react';

export default function Profile() {
  const { user, updateProfile, uploadProfilePhoto, isDemoMode } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [avatar, setAvatar] = useState('');
  
  const [trips, setTrips] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Initialize fields
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCity(user.city || '');
      setCountry(user.country || '');
      setAvatar(user.profilePic || user.avatar || '');
    }
  }, [user]);

  // Fetch personal trips
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        if (isDemoMode) {
          const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
          const all = [...demoTrips, ...MOCK_TRIPS];
          // Remove duplicates if any
          const unique = all.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          setTrips(unique);
          return;
        }

        const data = await tripService.getTrips();
        setTrips(Array.isArray(data) ? data : data.trips || []);
      } catch (err) {
        console.warn("Profile trips fetch failed, loading fallback:", err);
        const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
        setTrips([...demoTrips, ...MOCK_TRIPS]);
      }
    };

    fetchTrips();
  }, [isDemoMode]);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast("File size exceeds 5 MB limit.", "error");
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      addToast("Invalid file type. Please select JPEG, PNG, or WebP.", "error");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const res = await uploadProfilePhoto(file);
      addToast(res.message || "Profile photo uploaded successfully!", "success");
    } catch (err) {
      console.error("Photo upload failed:", err);
      addToast(err.message || "Failed to upload photo.", "error");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast("Name is required", "warning");
      return;
    }

    setIsUpdating(true);
    try {
      await updateProfile({
        name,
        city,
        country,
        profilePic: avatar || user?.profilePic || user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'
      });
      addToast("Profile updated successfully!", "success");
    } catch (err) {
      console.error("Failed to update profile:", err);
      addToast("Could not update profile.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans text-sm">
      {/* Profile Overview Hero */}
      <div className="bg-white border border-stone-200 p-6 md:p-8 rounded-3xl shadow-xs flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group w-20 h-20 shrink-0">
          <img 
            src={user?.profilePic || user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'} 
            alt={user?.name}
            className="w-20 h-20 rounded-full border-2 border-primary object-cover"
          />
          <label 
            htmlFor="profile-photo-input"
            className="absolute bottom-0 right-0 p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-full border-2 border-white shadow-xs cursor-pointer transition-transform hover:scale-110"
            title="Upload profile photo to Supabase Storage"
          >
            {isUploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            <input 
              id="profile-photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoSelect}
              className="hidden"
              disabled={isUploadingPhoto}
            />
          </label>
        </div>

        <div className="text-center sm:text-left space-y-1.5">
          <h1 className="font-display font-extrabold text-2xl text-text-dark tracking-tight leading-none">{user?.name}</h1>
          <div className="text-xs text-text-muted font-semibold flex flex-wrap justify-center sm:justify-start items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-stone-400" />
              {user?.email}
            </span>
            {(user?.city || user?.country) && (
              <>
                <span className="text-stone-300 hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  {user?.city ? `${user.city}, ` : ''}{user?.country || ''}
                </span>
              </>
            )}
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Edit Profile Form */}
        <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-6">
          <h3 className="font-display font-bold text-base text-text-dark flex items-center gap-2 border-b border-stone-100 pb-3">
            <Settings className="w-5 h-5 text-primary" />
            Update Profile Information
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="profName" className="block text-xs font-bold text-stone-600 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="profName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-bg-warm border border-stone-200 rounded-lg text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="profCity" className="block text-xs font-bold text-stone-600 mb-1">Home City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    id="profCity"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Paris"
                    className="w-full pl-9 pr-4 py-2 bg-bg-warm border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="profCountry" className="block text-xs font-bold text-stone-600 mb-1">Country</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    id="profCountry"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. France"
                    className="w-full pl-9 pr-4 py-2 bg-bg-warm border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="profAvatar" className="block text-xs font-bold text-stone-600 mb-1">Avatar Image URL</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="profAvatar"
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/photo..."
                  className="w-full pl-9 pr-4 py-2 bg-bg-warm border border-stone-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              {isUpdating ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </form>
        </div>

        {/* Right: Personal journeys & saved destinations */}
        <div className="lg:col-span-2 space-y-8">
          {/* Journeys List */}
          <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-4">
            <h3 className="font-display font-bold text-base text-text-dark">My Personal Journeys ({trips.length})</h3>
            
            {trips.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-text-muted text-xs italic">You have no active or historical itineraries saved.</p>
                <Link to="/create-trip" className="text-xs text-primary font-bold hover:underline mt-2 inline-block">Create one now →</Link>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {trips.map((trip) => (
                  <div 
                    key={trip.id}
                    className="flex items-center justify-between p-4 bg-bg-warm/30 border border-stone-200 rounded-xl hover:border-stone-300 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-stone-900 text-sm truncate">{trip.name}</div>
                      <div className="flex items-center gap-1.5 text-text-muted text-xs mt-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        {trip.startDate} to {trip.endDate}
                      </div>
                    </div>

                    <Link
                      to={`/trips/${trip.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs rounded-lg transition-colors shrink-0 shadow-xs"
                    >
                      Open Planner
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inspiration Section */}
          <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-4">
            <h3 className="font-display font-bold text-base text-text-dark flex items-center gap-1">
              <Compass className="w-5 h-5 text-secondary" />
              Saved Destinations Inspiration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MOCK_CITIES.slice(0, 2).map((city) => (
                <div key={city.id} className="bg-bg-warm/50 border border-stone-200 p-3.5 rounded-2xl flex gap-3.5">
                  <img 
                    src={city.image} 
                    alt={city.name}
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-stone-900 text-xs truncate">{city.name}</div>
                    <div className="text-[10px] text-text-muted mt-0.5 truncate">{city.country}</div>
                    <Link to="/explore" className="text-[10px] text-secondary hover:underline font-bold mt-1.5 inline-block">Explore Activities</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
