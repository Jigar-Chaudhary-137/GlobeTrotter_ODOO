import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { tripService } from '../services/tripService';
import { MOCK_TRIPS } from '../utils/mockData';
import {
  Calendar as CalendarIcon,
  MapPin,
  Wallet,
  Plus,
  Trash2,
  Edit3,
  Share2,
  Check,
  Copy,
  AlertTriangle,
  PieChart as ChartIcon,
  Clock,
  Layers,
  Activity,
  UserCheck,
  Globe,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import Loader, { ListSkeleton } from '../components/ui/Loader';
import Modal from '../components/ui/Modal';

const CATEGORIES = ['Transport', 'Accommodation', 'Activities', 'Meals', 'Other'];
const COLORS = ['#0d9488', '#f97316', '#3b82f6', '#ec4899', '#8b5cf6'];

export default function TripBuilder() {
  const { id } = useParams();
  const { addToast } = useToast();
  const { isDemoMode } = useAuth();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('itinerary'); // itinerary, budget, timeline
  const [copied, setCopied] = useState(false);

  // Modals state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Form states for Itinerary Item Add/Edit
  const [editingItem, setEditingItem] = useState(null);
  const [activityName, setActivityName] = useState('');
  const [activityCategory, setActivityCategory] = useState('Activities');
  const [activityCost, setActivityCost] = useState('');
  const [activityDate, setActivityDate] = useState('');
  const [activityTime, setActivityTime] = useState('09:00');
  const [activityNotes, setActivityNotes] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  // Form states for General Expense Add
  const [expenseCategory, setExpenseCategory] = useState('Transport');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);

  // Screen 5 itinerary sections states & handlers
  const [sections, setSections] = useState([]);
  const [savingSections, setSavingSections] = useState(false);

  useEffect(() => {
    if (trip) {
      if (trip.sections && trip.sections.length > 0) {
        setSections(trip.sections);
      } else {
        const defaultSections = [
          {
            id: `sec-1-${Date.now()}`,
            title: 'Section 1: Exploration & Sightseeing',
            description: 'Sightseeing of landmarks, monuments, and main museums.',
            startDate: trip.startDate,
            endDate: trip.startDate,
            budget: Math.round(trip.budget * 0.4)
          },
          {
            id: `sec-2-${Date.now()}`,
            title: 'Section 2: Cultural Experience & Dining',
            description: 'Local culinary tasting, market visits, and historic quarter walks.',
            startDate: trip.startDate,
            endDate: trip.endDate,
            budget: Math.round(trip.budget * 0.3)
          },
          {
            id: `sec-3-${Date.now()}`,
            title: 'Section 3: Leisure & Evening Shows',
            description: 'Relaxation at parks, dinner cruises, or theatre performances.',
            startDate: trip.endDate,
            endDate: trip.endDate,
            budget: Math.round(trip.budget * 0.3)
          }
        ];
        setSections(defaultSections);
      }
    }
  }, [trip]);

  const handleUpdateSection = (sectionId, field, value) => {
    setSections(sections.map(sec => {
      if (sec.id === sectionId) {
        return { ...sec, [field]: value };
      }
      return sec;
    }));
  };

  const handleAddSection = () => {
    const newNum = sections.length + 1;
    const newSection = {
      id: `sec-${Date.now()}-${newNum}`,
      title: `Section ${newNum}`,
      description: '',
      startDate: trip?.startDate || '',
      endDate: trip?.endDate || '',
      budget: 0
    };
    setSections([...sections, newSection]);
    addToast(`Added Section ${newNum}`, 'success');
  };

  const handleDeleteSection = (sectionId) => {
    setSections(sections.filter(sec => sec.id !== sectionId));
    addToast('Section removed', 'info');
  };

  const handleSaveSections = async () => {
    setSavingSections(true);
    const updatedTrip = { ...trip, sections };
    try {
      if (isDemoMode) {
        const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
        const idx = demoTrips.findIndex(t => t.id === id);
        if (idx !== -1) {
          demoTrips[idx] = updatedTrip;
          localStorage.setItem('demo_trips', JSON.stringify(demoTrips));
        }
        setTrip(updatedTrip);
        addToast('Itinerary sections saved (Demo Mode)!', 'success');
      } else {
        await tripService.updateTrip(id, { sections });
        setTrip(updatedTrip);
        addToast('Itinerary sections saved successfully!', 'success');
      }
    } catch (err) {
      console.warn("Failed to save sections to API, fallback to local save:", err);
      const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
      const idx = demoTrips.findIndex(t => t.id === id);
      if (idx !== -1) {
        demoTrips[idx] = updatedTrip;
        localStorage.setItem('demo_trips', JSON.stringify(demoTrips));
      }
      setTrip(updatedTrip);
      addToast('Itinerary sections saved locally (Offline Fallback)!', 'success');
    } finally {
      setSavingSections(false);
    }
  };

  // Fetch single trip
  const fetchTripDetails = async () => {
    try {
      if (isDemoMode) {
        // Look inside local storage for user created demo trips
        const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
        let found = demoTrips.find(t => t.id === id);
        if (!found) found = MOCK_TRIPS.find(t => t.id === id);

        if (found) {
          setTrip(found);
        } else {
          addToast("Demo trip not found.", "error");
        }
        setLoading(false);
        return;
      }

      const response = await tripService.getTripById(id);
      setTrip(response.trip || response);
    } catch (err) {
      console.warn("Failed to fetch trip details from API, seeking local cache:", err);
      // Fallback
      const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
      let found = demoTrips.find(t => t.id === id);
      if (!found) found = MOCK_TRIPS.find(t => t.id === id);

      if (found) {
        setTrip(found);
      } else {
        addToast("Unable to load trip. Back to dashboard.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [id, isDemoMode]);

  // Generate days array between trip bounds
  const getTripDays = () => {
    if (!trip) return [];
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const days = [];
    let current = new Date(start);

    while (current <= end) {
      const dateString = current.toISOString().split('T')[0];
      // Find which city stop covers this date
      const activeStop = trip.stops?.find(s => {
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

  // Toggle publish
  const handleTogglePublish = async () => {
    try {
      const nextPublicState = !trip.isPublic;

      if (isDemoMode) {
        const updated = { ...trip, isPublic: nextPublicState };
        setTrip(updated);
        // Update localStorage Cache
        const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
        const idx = demoTrips.findIndex(t => t.id === id);
        if (idx !== -1) {
          demoTrips[idx] = updated;
          localStorage.setItem('demo_trips', JSON.stringify(demoTrips));
        }
        addToast(nextPublicState ? 'Trip published to Community!' : 'Trip made private', 'success');
      } else {
        await tripService.publishTrip(trip.id, nextPublicState);
        setTrip({ ...trip, isPublic: nextPublicState });
        addToast(nextPublicState ? 'Trip published to Community!' : 'Trip made private', 'success');
      }
    } catch (err) {
      addToast('Failed to change sharing status', 'error');
    }
  };

  // Copy share URL
  const handleCopyLink = () => {
    const targetShareId = trip.shareId || trip.id;
    const shareUrl = `${window.location.origin}/public/trips/${targetShareId}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setCopied(true);
          addToast('Share link copied to clipboard!', 'success');
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          fallbackCopyText(shareUrl);
        });
    } else {
      fallbackCopyText(shareUrl);
    }
  };

  const fallbackCopyText = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      addToast('Share link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      addToast('Failed to copy link automatically. Please copy manually.', 'error');
    }
  };

  // Submit Itinerary Item (Create or Edit)
  const handleSaveActivity = async (e) => {
    e.preventDefault();
    if (!activityName.trim() || !activityDate) return;

    setSavingItem(true);
    const stopForDate = trip.stops?.find(s => {
      const current = new Date(activityDate);
      return current >= new Date(s.arrivalDate) && current <= new Date(s.departureDate);
    });

    const itemPayload = {
      activityName,
      category: activityCategory,
      cost: Number(activityCost || 0),
      date: activityDate,
      time: activityTime,
      notes: activityNotes,
      stopId: stopForDate?.id || null
    };

    try {
      if (isDemoMode) {
        let updatedItinerary = [...(trip.itinerary || [])];
        if (editingItem) {
          updatedItinerary = updatedItinerary.map(item =>
            item.id === editingItem.id ? { ...item, ...itemPayload } : item
          );
          addToast('Activity updated!', 'success');
        } else {
          const newItem = {
            id: `item-${Date.now()}`,
            ...itemPayload
          };
          updatedItinerary.push(newItem);
          addToast('Activity added!', 'success');
        }

        const updatedTrip = { ...trip, itinerary: updatedItinerary };
        setTrip(updatedTrip);

        // Save to cache
        const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
        const idx = demoTrips.findIndex(t => t.id === id);
        if (idx !== -1) {
          demoTrips[idx] = updatedTrip;
          localStorage.setItem('demo_trips', JSON.stringify(demoTrips));
        }
      } else {
        if (editingItem) {
          await tripService.updateItineraryItem(trip.id, editingItem.id, itemPayload);
          addToast('Activity updated successfully!', 'success');
        } else {
          await tripService.addItineraryItem(trip.id, itemPayload);
          addToast('Activity added successfully!', 'success');
        }
        await fetchTripDetails();
      }

      // Clear forms
      setIsActivityModalOpen(false);
      setEditingItem(null);
      setActivityName('');
      setActivityCost('');
      setActivityNotes('');
    } catch (err) {
      addToast('Failed to save activity.', 'error');
    } finally {
      setSavingItem(false);
    }
  };

  // Open Edit Activity Form
  const handleOpenEditActivity = (item) => {
    setEditingItem(item);
    setActivityName(item.activityName || item.name || '');
    setActivityCategory(item.category || 'Activities');
    setActivityCost(item.cost || '');
    setActivityDate(item.date);
    setActivityTime(item.time || '09:00');
    setActivityNotes(item.notes || '');
    setIsActivityModalOpen(true);
  };

  // Delete Itinerary Item
  const handleDeleteActivity = async (itemId) => {
    if (!window.confirm('Delete this activity?')) return;

    try {
      if (isDemoMode) {
        const updatedItinerary = (trip.itinerary || []).filter(item => item.id !== itemId);
        const updatedTrip = { ...trip, itinerary: updatedItinerary };
        setTrip(updatedTrip);

        const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
        const idx = demoTrips.findIndex(t => t.id === id);
        if (idx !== -1) {
          demoTrips[idx] = updatedTrip;
          localStorage.setItem('demo_trips', JSON.stringify(demoTrips));
        }
        addToast('Activity removed!', 'success');
      } else {
        await tripService.deleteItineraryItem(trip.id, itemId);
        addToast('Activity removed successfully!', 'success');
        await fetchTripDetails();
      }
    } catch (err) {
      addToast('Could not delete activity.', 'error');
    }
  };

  // Submit General Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseAmount || !expenseDesc.trim()) return;

    setSavingExpense(true);
    const expensePayload = {
      category: expenseCategory,
      amount: Number(expenseAmount),
      description: expenseDesc
    };

    try {
      if (isDemoMode) {
        const updatedExpenses = [...(trip.expenses || [])];
        const newExp = {
          id: `exp-${Date.now()}`,
          ...expensePayload
        };
        updatedExpenses.push(newExp);

        const updatedTrip = { ...trip, expenses: updatedExpenses };
        setTrip(updatedTrip);

        const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
        const idx = demoTrips.findIndex(t => t.id === id);
        if (idx !== -1) {
          demoTrips[idx] = updatedTrip;
          localStorage.setItem('demo_trips', JSON.stringify(demoTrips));
        }
        addToast('Expense added!', 'success');
      } else {
        // Call generic PUT update API for expenses
        const updatedExpenses = [...(trip.expenses || []), expensePayload];
        await tripService.updateTrip(trip.id, { expenses: updatedExpenses });
        addToast('Expense added successfully!', 'success');
        await fetchTripDetails();
      }

      setIsExpenseModalOpen(false);
      setExpenseAmount('');
      setExpenseDesc('');
    } catch (err) {
      addToast('Failed to log expense.', 'error');
    } finally {
      setSavingExpense(false);
    }
  };

  // Delete general expense
  const handleDeleteExpense = async (expId) => {
    if (!window.confirm('Remove this expense?')) return;

    try {
      if (isDemoMode) {
        const updatedExpenses = (trip.expenses || []).filter(e => e.id !== expId);
        const updatedTrip = { ...trip, expenses: updatedExpenses };
        setTrip(updatedTrip);

        const demoTrips = JSON.parse(localStorage.getItem('demo_trips') || '[]');
        const idx = demoTrips.findIndex(t => t.id === id);
        if (idx !== -1) {
          demoTrips[idx] = updatedTrip;
          localStorage.setItem('demo_trips', JSON.stringify(demoTrips));
        }
        addToast('Expense removed!', 'success');
      } else {
        const updatedExpenses = (trip.expenses || []).filter(e => e.id !== expId);
        await tripService.updateTrip(trip.id, { expenses: updatedExpenses });
        addToast('Expense removed!', 'success');
        await fetchTripDetails();
      }
    } catch (err) {
      addToast('Could not remove expense.', 'error');
    }
  };

  // CALCULATE EXPENSE SUMS
  const getExpensesSum = () => {
    if (!trip) return { total: 0, itineraryTotal: 0, generalTotal: 0 };

    const itineraryTotal = (trip.itinerary || []).reduce((sum, item) => sum + (item.cost || 0), 0);
    const generalTotal = (trip.expenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);

    return {
      total: itineraryTotal + generalTotal,
      itineraryTotal,
      generalTotal
    };
  };

  const expenseData = getExpensesSum();
  const isOverBudget = expenseData.total > (trip?.budget || 0);

  // Group chart data
  const getChartData = () => {
    if (!trip) return [];

    const groups = {};
    CATEGORIES.forEach(cat => { groups[cat] = 0; });

    // Itinerary items mapping
    (trip.itinerary || []).forEach(item => {
      const cat = item.category === 'Culture/Museums' || item.category === 'Attractions' ? 'Activities' :
                 item.category === 'Food/Restaurants' ? 'Meals' : item.category;
      if (groups[cat] !== undefined) {
        groups[cat] += (item.cost || 0);
      } else {
        groups['Other'] += (item.cost || 0);
      }
    });

    // General expenses mapping
    (trip.expenses || []).forEach(exp => {
      const cat = exp.category;
      if (groups[cat] !== undefined) {
        groups[cat] += (exp.amount || 0);
      } else {
        groups['Other'] += (exp.amount || 0);
      }
    });

    return Object.keys(groups)
      .map(key => ({ name: key, value: groups[key] }))
      .filter(item => item.value > 0);
  };

  const chartData = getChartData();

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 bg-stone-200 rounded-xl w-1/3" />
        <div className="h-10 bg-stone-200 rounded-lg w-2/3" />
        <ListSkeleton />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-sm font-semibold">Trip details could not be found.</p>
        <Link to="/dashboard" className="text-primary hover:underline text-sm font-bold mt-4 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const tripDays = getTripDays();

  return (
    <div className="space-y-8 animate-fade-in font-sans text-sm">
      {/* Top Header Card */}
      <div className="bg-white border border-stone-200 p-6 md:p-8 rounded-3xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text-dark tracking-tight leading-tight">
              {trip.name}
            </h1>
            <div className="flex flex-wrap gap-y-2 gap-x-4 items-center text-xs text-text-muted font-semibold">
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4 text-stone-400" />
                {trip.startDate} to {trip.endDate}
              </span>
              <span className="text-stone-300">•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-stone-400" />
                {trip.stops?.map(s => s.city).join(' → ')}
              </span>
            </div>
          </div>

          {/* Share/Publish tools */}
          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Publish Toggle Button */}
            <button
              onClick={handleTogglePublish}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                trip.isPublic
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              {trip.isPublic ? 'Public on Board' : 'Make Public'}
            </button>

            {/* Share link button */}
            {trip.isPublic && (
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white hover:bg-primary-hover rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Share Link'}
              </button>
            )}
          </div>
        </div>

        {/* Public Share Banner */}
        {trip.isPublic && (
          <div className="mt-4 pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/80 p-3.5 rounded-2xl animate-fade-in">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Share2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-bold text-stone-700 shrink-0">Public Share Link:</span>
              <span className="text-xs text-text-muted font-mono truncate bg-white px-2.5 py-1 rounded-lg border border-stone-200 select-all">
                {`${window.location.origin}/public/trips/${trip.shareId || trip.id}`}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white hover:bg-primary-hover rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <a
                href={`/public/trips/${trip.shareId || trip.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3.5 py-1.5 border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                Open Public View
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-stone-200">
        {[
          { id: 'itinerary', label: 'Day-Wise Itinerary', icon: Layers },
          { id: 'budget', label: 'Expenses & Budget', icon: Wallet },
          { id: 'timeline', label: 'Timeline & Schedule', icon: Activity }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* VIEW: ITINERARY DAY-WISE */}
      {activeTab === 'itinerary' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <h2 className="font-display font-bold text-lg text-text-dark">Itinerary Sections</h2>
            <button
              onClick={handleSaveSections}
              disabled={savingSections}
              className="inline-flex items-center gap-1.5 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              {savingSections ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Itinerary Sections</span>
              )}
            </button>
          </div>

          <div className="space-y-6">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-xs relative hover:shadow-md transition-all animate-fade-in"
              >
                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleDeleteSection(section.id)}
                  className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-rose-600 transition-colors hover:bg-stone-50 rounded-lg cursor-pointer"
                  title="Remove this section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 gap-5">
                  {/* Section Title */}
                  <div>
                    <label className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1.5">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => handleUpdateSection(section.id, 'title', e.target.value)}
                      placeholder={`e.g. Section ${index + 1}`}
                      className="w-full p-2.5 bg-bg-warm border border-stone-200 rounded-xl text-sm font-semibold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Description Area */}
                  <div>
                    <label className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1.5">
                      Information / Description Area
                    </label>
                    <textarea
                      rows={2.5}
                      value={section.description}
                      onChange={(e) => handleUpdateSection(section.id, 'description', e.target.value)}
                      placeholder="Add descriptions or specific lists of landmarks and details here..."
                      className="w-full p-2.5 bg-bg-warm border border-stone-200 rounded-xl text-sm font-medium text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Date Range & Budget */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1.5">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={section.startDate}
                        onChange={(e) => handleUpdateSection(section.id, 'startDate', e.target.value)}
                        className="w-full p-2.5 bg-bg-warm border border-stone-200 rounded-xl text-xs font-semibold text-stone-850 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1.5">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={section.endDate}
                        onChange={(e) => handleUpdateSection(section.id, 'endDate', e.target.value)}
                        className="w-full p-2.5 bg-bg-warm border border-stone-200 rounded-xl text-xs font-semibold text-stone-850 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5 text-stone-400" />
                        Section Budget ($)
                      </label>
                      <input
                        type="number"
                        value={section.budget}
                        onChange={(e) => handleUpdateSection(section.id, 'budget', Number(e.target.value))}
                        placeholder="e.g. 500"
                        className="w-full p-2.5 bg-bg-warm border border-stone-200 rounded-xl text-sm font-semibold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {sections.length === 0 && (
              <div className="bg-bg-warm border border-stone-200 border-dashed p-8 rounded-3xl text-center text-xs text-text-muted">
                No sections added. Click "+ Add another Section" below to create one.
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleAddSection}
              className="inline-flex items-center gap-1.5 py-3 px-6 bg-secondary hover:bg-secondary-hover text-white text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add another Section</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW: BUDGET MANAGEMENT */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          {/* Top warning alerts and cards */}
          {isOverBudget && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Budget Cap Exceeded!</h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  Your estimated trip costs exceed the set budget limit of ${trip.budget} by ${(expenseData.total - trip.budget).toLocaleString()}. Review your activity expenses below.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Allocation Cap</div>
              <div className="text-2xl font-bold text-text-dark mt-1">${trip.budget.toLocaleString()}</div>
            </div>
            <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Est. Expenses</div>
              <div className={`text-2xl font-bold mt-1 ${isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                ${expenseData.total.toLocaleString()}
              </div>
            </div>
            <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Remaining Wallet</div>
              <div className={`text-2xl font-bold mt-1 ${isOverBudget ? 'text-rose-500' : 'text-stone-700'}`}>
                ${(trip.budget - expenseData.total).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Recharts expense distribution */}
            <div className="bg-white border border-stone-200 p-6 rounded-3xl">
              <h3 className="font-display font-bold text-base text-text-dark mb-4">Category Distribution</h3>

              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-text-muted text-xs italic">
                  No costs recorded. Plan some activities to view chart distribution.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value}`} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Right: Extra manual expense logger */}
            <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-base text-text-dark">General Logged Expenses</h3>
                <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="py-1.5 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Log Expense
                </button>
              </div>

              {(!trip.expenses || trip.expenses.length === 0) ? (
                <p className="text-text-muted text-xs italic">No general flat expenses logged (e.g. flight tickets, hotel reservations).</p>
              ) : (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {trip.expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-3.5 bg-bg-warm border border-stone-200 rounded-xl hover:border-stone-300 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-stone-900 text-xs">{exp.description}</div>
                        <span className="inline-block text-[9px] font-extrabold text-stone-500 uppercase tracking-wider mt-0.5">
                          {exp.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-stone-900 text-xs">${exp.amount}</span>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-stone-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: TIMELINE / CALENDAR */}
      {activeTab === 'timeline' && (
        <div className="bg-white border border-stone-200 p-6 md:p-8 rounded-3xl space-y-8">
          <h2 className="font-display font-bold text-lg text-text-dark">Journey Timeline</h2>

          <div className="relative border-l-2 border-primary/20 pl-6 ml-4 space-y-8 py-2">
            {trip.stops?.map((stop, sIdx) => {
              // Find activities mapped under this stop's date bounds
              const stopStart = new Date(stop.arrivalDate);
              const stopEnd = new Date(stop.departureDate);
              const stopActivitiesCount = (trip.itinerary || []).filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= stopStart && itemDate <= stopEnd;
              }).length;

              return (
                <div key={stop.id || sIdx} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-xs group-hover:scale-110 transition-transform" />

                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Stop {sIdx + 1}
                    </span>
                    <h3 className="font-display font-bold text-lg text-text-dark leading-none">
                      {stop.city}, {stop.country}
                    </h3>
                    <p className="text-xs text-text-muted font-medium">
                      Dates: {stop.arrivalDate} to {stop.departureDate} ({stop.durationDays} days)
                    </p>
                    <div className="text-xs font-semibold text-stone-600">
                      Planned Activities: <span className="text-primary font-bold">{stopActivitiesCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT ACTIVITY */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title={editingItem ? "Edit Scheduled Activity" : "Schedule New Activity"}
      >
        <form onSubmit={handleSaveActivity} className="space-y-4 font-sans text-xs">
          <div>
            <label htmlFor="actName" className="block text-xs font-bold text-text-dark mb-1">Activity Name</label>
            <input
              id="actName"
              type="text"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="e.g. Eiffel Tower Guided Walk"
              className="w-full p-2.5 border border-stone-200 rounded-lg text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="actCategory" className="block text-xs font-bold text-text-dark mb-1">Category</label>
              <select
                id="actCategory"
                value={activityCategory}
                onChange={(e) => setActivityCategory(e.target.value)}
                className="w-full p-2.5 border border-stone-200 rounded-lg text-xs"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="actCost" className="block text-xs font-bold text-text-dark mb-1">Estimated Cost ($)</label>
              <input
                id="actCost"
                type="number"
                value={activityCost}
                onChange={(e) => setActivityCost(e.target.value)}
                placeholder="e.g. 35 (0 for Free)"
                className="w-full p-2.5 border border-stone-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="actDate" className="block text-xs font-bold text-text-dark mb-1">Date</label>
              <input
                id="actDate"
                type="date"
                min={trip.startDate}
                max={trip.endDate}
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                className="w-full p-2.5 border border-stone-200 rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label htmlFor="actTime" className="block text-xs font-bold text-text-dark mb-1">Time</label>
              <input
                id="actTime"
                type="time"
                value={activityTime}
                onChange={(e) => setActivityTime(e.target.value)}
                className="w-full p-2.5 border border-stone-200 rounded-lg text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="actNotes" className="block text-xs font-bold text-text-dark mb-1">Itinerary Notes / Details</label>
            <textarea
              id="actNotes"
              value={activityNotes}
              onChange={(e) => setActivityNotes(e.target.value)}
              placeholder="Booking details, meet up locations, clothing requirements..."
              className="w-full p-2.5 border border-stone-200 rounded-lg text-xs h-20"
            />
          </div>

          <button
            type="submit"
            disabled={savingItem}
            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors"
          >
            {savingItem ? 'Saving...' : 'Confirm Activity'}
          </button>
        </form>
      </Modal>

      {/* MODAL: ADD GENERAL EXPENSE */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Log Flat Expense"
      >
        <form onSubmit={handleAddExpense} className="space-y-4 font-sans text-xs">
          <div>
            <label htmlFor="expCategory" className="block text-xs font-bold text-text-dark mb-1">Category</label>
            <select
              id="expCategory"
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
              className="w-full p-2.5 border border-stone-200 rounded-lg text-xs font-medium"
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="expAmount" className="block text-xs font-bold text-text-dark mb-1">Expense Amount ($)</label>
            <input
              id="expAmount"
              type="number"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder="e.g. 450"
              className="w-full p-2.5 border border-stone-200 rounded-lg text-xs"
              required
            />
          </div>

          <div>
            <label htmlFor="expDesc" className="block text-xs font-bold text-text-dark mb-1">Description / Memo</label>
            <input
              id="expDesc"
              type="text"
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
              placeholder="e.g. Hotel deposit booking fees"
              className="w-full p-2.5 border border-stone-200 rounded-lg text-xs"
              required
            />
          </div>

          <button
            type="submit"
            disabled={savingExpense}
            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors"
          >
            {savingExpense ? 'Adding...' : 'Add Expense'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
