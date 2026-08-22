import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Phone, MapPin, Globe, FileText, Camera, Loader2, Compass } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Form Fields State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  // Profile Photo State
  const [avatarPreview, setAvatarPreview] = useState('');
  
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!email) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    if (!city.trim()) {
      errors.city = 'City is required';
    }
    if (!country.trim()) {
      errors.country = 'Country is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError('');

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      // Call the existing registration service contract (passing password as undefined per user instructions)
      const result = await register(
        fullName, 
        email, 
        undefined, 
        phone, 
        city, 
        country, 
        additionalInfo, 
        avatarPreview
      );
      addToast(result.message, 'success');
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please check the fields and try again.');
      addToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-warm flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-3 shadow-xs">
          <Compass className="w-9 h-9" />
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-text-dark tracking-tight">
          Join GlobeTrotter
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Register to map, track, and share your traveler adventures.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Card Container */}
        <div className="bg-surface py-8 px-6 border border-stone-200/80 shadow-2xl rounded-3xl sm:px-10 transition-all">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            
            {/* Photo/Profile Visual with Live Upload Simulation */}
            <div className="text-center">
              <span className="block text-sm font-semibold text-text-dark mb-2">Photo/profile visual</span>
              <div className="relative w-28 h-28 mx-auto group">
                <div className="absolute inset-0 rounded-full bg-linear-to-tr from-primary to-secondary animate-pulse opacity-10"></div>
                <img
                  src={avatarPreview || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80"}
                  alt="Avatar Preview"
                  className="relative w-full h-full rounded-full border-4 border-surface shadow-md object-cover"
                />
                <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center border-2 border-surface shadow-md cursor-pointer transition-transform duration-200 hover:scale-110">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </label>
              </div>
              <span className="block text-xs text-text-muted mt-2">Click the camera button to pick an image</span>
            </div>

            {apiError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-sm font-medium transition-all">
                {apiError}
              </div>
            )}

            {/* Form Fields Section */}
            <div className="space-y-5">
              {/* Row 1: First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-text-dark">
                    First Name
                  </label>
                  <div className="mt-1.5 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-stone-400" />
                    </div>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      disabled={isSubmitting}
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: '' });
                      }}
                      className={`block w-full pl-10 pr-4 py-2.5 bg-bg-warm border rounded-xl text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm ${
                        formErrors.firstName ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-stone-200'
                      }`}
                      placeholder="Jane"
                    />
                  </div>
                  {formErrors.firstName && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-text-dark">
                    Last Name
                  </label>
                  <div className="mt-1.5 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-stone-400" />
                    </div>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      disabled={isSubmitting}
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: '' });
                      }}
                      className={`block w-full pl-10 pr-4 py-2.5 bg-bg-warm border rounded-xl text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm ${
                        formErrors.lastName ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-stone-200'
                      }`}
                      placeholder="Doe"
                    />
                  </div>
                  {formErrors.lastName && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Email Address & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-text-dark">
                    Email Address
                  </label>
                  <div className="mt-1.5 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-stone-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      disabled={isSubmitting}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                      }}
                      className={`block w-full pl-10 pr-4 py-2.5 bg-bg-warm border rounded-xl text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm ${
                        formErrors.email ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-stone-200'
                      }`}
                      placeholder="jane.doe@example.com"
                    />
                  </div>
                  {formErrors.email && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-text-dark">
                    Phone Number
                  </label>
                  <div className="mt-1.5 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-stone-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      disabled={isSubmitting}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                      }}
                      className={`block w-full pl-10 pr-4 py-2.5 bg-bg-warm border rounded-xl text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm ${
                        formErrors.phone ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-stone-200'
                      }`}
                      placeholder="+1 (555) 019-2834"
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.phone}</p>
                  )}
                </div>
              </div>

              {/* Row 3: City & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-semibold text-text-dark">
                    City
                  </label>
                  <div className="mt-1.5 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-stone-400" />
                    </div>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      disabled={isSubmitting}
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        if (formErrors.city) setFormErrors({ ...formErrors, city: '' });
                      }}
                      className={`block w-full pl-10 pr-4 py-2.5 bg-bg-warm border rounded-xl text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm ${
                        formErrors.city ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-stone-200'
                      }`}
                      placeholder="Paris"
                    />
                  </div>
                  {formErrors.city && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.city}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-semibold text-text-dark">
                    Country
                  </label>
                  <div className="mt-1.5 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Globe className="h-4 w-4 text-stone-400" />
                    </div>
                    <input
                      id="country"
                      name="country"
                      type="text"
                      disabled={isSubmitting}
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value);
                        if (formErrors.country) setFormErrors({ ...formErrors, country: '' });
                      }}
                      className={`block w-full pl-10 pr-4 py-2.5 bg-bg-warm border rounded-xl text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm ${
                        formErrors.country ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-stone-200'
                      }`}
                      placeholder="France"
                    />
                  </div>
                  {formErrors.country && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.country}</p>
                  )}
                </div>
              </div>

              {/* Row 4: Additional Information */}
              <div>
                <label htmlFor="additionalInfo" className="block text-sm font-semibold text-text-dark">
                  Additional Information
                </label>
                <div className="mt-1.5 relative">
                  <div className="absolute top-3 left-3.5 pointer-events-none">
                    <FileText className="h-4 w-4 text-stone-400" />
                  </div>
                  <textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    disabled={isSubmitting}
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={4}
                    className="block w-full pl-10 pr-4 py-2.5 bg-bg-warm border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    placeholder="Tell us about your favorite destinations, travel style, or what you hope to discover..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all hover:shadow-lg active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span>Registering...</span>
                  </>
                ) : (
                  'Register Users'
                )}
              </button>
            </div>
          </form>

          {/* Navigation to Login */}
          <div className="mt-6 border-t border-stone-200/80 pt-6 text-center">
            <p className="text-sm text-text-muted font-sans">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:text-primary-hover transition-colors">
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
