import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  DollarSign,
  Plus,
  Edit3,
  Trash2,
  AlertCircle,
  FolderOpen,
  Sparkles,
  Compass,
} from 'lucide-react';
import ActivityFilterBar from './ActivityFilterBar';

/**
 * Helper to get badge style based on category
 */
const getCategoryBadgeStyle = (category = '') => {
  const cat = category.toLowerCase();
  if (cat.includes('transport')) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  if (cat.includes('accommodation')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (cat.includes('meal') || cat.includes('food') || cat.includes('restaurant')) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  if (cat.includes('activity') || cat.includes('tour') || cat.includes('sightseeing')) {
    return 'bg-teal-50 text-teal-700 border-teal-200';
  }
  return 'bg-purple-50 text-purple-700 border-purple-200';
};

/**
 * Format currency helper
 */
const formatCurrency = (amount = 0) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

/**
 * ItineraryView Component
 * Renders structured day-wise, city-wise, or category-wise itinerary activities
 * with interactive filtering, searching, sorting, and management controls.
 */
export default function ItineraryView({
  trip,
  itineraryItems = [],
  tripStops = [],
  loading = false,
  error = null,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
}) {
  // Toolbar state
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('day'); // 'day' | 'city' | 'category'
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('time-asc'); // 'time-asc' | 'time-desc' | 'cost-asc' | 'cost-desc'

  const resetFilters = () => {
    setSearch('');
    setGroupBy('day');
    setCategoryFilter('All');
    setSortBy('time-asc');
  };

  // Derive normalized items array without mutating props
  const rawItems = useMemo(() => {
    if (!Array.isArray(itineraryItems)) return [];
    return itineraryItems.map((item) => ({
      id: item.id || `item-${Math.random()}`,
      title: item.title || item.activityName || item.name || 'Untitled Activity',
      description: item.description || item.notes || '',
      category: item.category || 'Activities',
      expense: Number(item.expense !== undefined ? item.expense : item.cost || 0),
      time: item.time || '09:00',
      date: item.date ? (typeof item.date === 'string' ? item.date.split('T')[0] : new Date(item.date).toISOString().split('T')[0]) : null,
      dayNumber: item.dayNumber || 1,
      location: item.location || '',
      tripStopId: item.tripStopId || item.stopId || null,
    }));
  }, [itineraryItems]);

  // Derived filtered & sorted items
  const filteredAndSortedItems = useMemo(() => {
    let items = [...rawItems];

    // 1. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      );
    }

    // 2. Category Filter
    if (categoryFilter !== 'All') {
      items = items.filter(
        (item) => item.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // 3. Sorting
    items.sort((a, b) => {
      if (sortBy === 'time-asc') {
        return (a.time || '').localeCompare(b.time || '');
      }
      if (sortBy === 'time-desc') {
        return (b.time || '').localeCompare(a.time || '');
      }
      if (sortBy === 'cost-asc') {
        return a.expense - b.expense;
      }
      if (sortBy === 'cost-desc') {
        return b.expense - a.expense;
      }
      return 0;
    });

    return items;
  }, [rawItems, search, categoryFilter, sortBy]);

  // Derived Groups mapping based on selected `groupBy`
  const groupedData = useMemo(() => {
    if (groupBy === 'city') {
      const cityMap = {};
      
      // Seed with stops
      if (Array.isArray(tripStops) && tripStops.length > 0) {
        tripStops.forEach((stop) => {
          cityMap[stop.city] = {
            groupTitle: `${stop.city}, ${stop.country}`,
            stopInfo: stop,
            items: [],
          };
        });
      }

      // Populate items into city groups
      filteredAndSortedItems.forEach((item) => {
        let matchedCity = 'Unassigned City';
        if (item.tripStopId) {
          const stop = tripStops.find((s) => s.id === item.tripStopId);
          if (stop) matchedCity = stop.city;
        }
        if (!cityMap[matchedCity]) {
          cityMap[matchedCity] = {
            groupTitle: matchedCity,
            stopInfo: null,
            items: [],
          };
        }
        cityMap[matchedCity].items.push(item);
      });

      return Object.values(cityMap).filter((g) => g.items.length > 0 || Array.isArray(tripStops));
    }

    if (groupBy === 'category') {
      const catMap = {
        Transport: [],
        Accommodation: [],
        Activities: [],
        Meals: [],
        Other: [],
      };

      filteredAndSortedItems.forEach((item) => {
        const cat = item.category || 'Other';
        if (!catMap[cat]) catMap[cat] = [];
        catMap[cat].push(item);
      });

      return Object.entries(catMap)
        .map(([catName, items]) => ({
          groupTitle: catName,
          items,
        }))
        .filter((g) => g.items.length > 0);
    }

    // Default: Group by Day Number
    const dayMap = {};
    filteredAndSortedItems.forEach((item) => {
      const dayKey = `Day ${item.dayNumber}`;
      if (!dayMap[dayKey]) {
        dayMap[dayKey] = {
          groupTitle: dayKey,
          dayNumber: item.dayNumber,
          date: item.date,
          items: [],
        };
      }
      dayMap[dayKey].items.push(item);
    });

    // Sort days numerically
    return Object.values(dayMap).sort((a, b) => a.dayNumber - b.dayNumber);
  }, [filteredAndSortedItems, groupBy, tripStops]);

  // Loading State
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-stone-200/60 rounded-2xl animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-6 border border-stone-200/80 space-y-4 animate-pulse">
              <div className="h-6 w-1/4 bg-stone-200 rounded-md" />
              <div className="h-16 bg-stone-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800 space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold">Unable to Load Itinerary</h3>
        <p className="text-sm text-rose-600 max-w-md mx-auto">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <ActivityFilterBar
        search={search}
        onSearchChange={setSearch}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        category={categoryFilter}
        onCategoryChange={setCategoryFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onResetFilters={resetFilters}
      />

      {/* Header Bar with Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-teal-600" />
            Trip Itinerary
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Showing {filteredAndSortedItems.length} planned {filteredAndSortedItems.length === 1 ? 'activity' : 'activities'}
          </p>
        </div>

        {onAddActivity && (
          <button
            type="button"
            onClick={onAddActivity}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Activity
          </button>
        )}
      </div>

      {/* Empty State */}
      {filteredAndSortedItems.length === 0 && (
        <div className="bg-white border border-stone-200/80 rounded-2xl p-10 text-center space-y-4">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto">
            <FolderOpen className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">No Activities Found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              {search || categoryFilter !== 'All'
                ? 'No activities match your current search or category filters. Try clearing filters.'
                : 'Start building your trip itinerary by adding your first attraction, restaurant, or transit stop.'}
            </p>
          </div>
          {(search || categoryFilter !== 'All') && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Grouped Activity Lists */}
      <div className="space-y-6">
        {groupedData.map((group, gIdx) => {
          const groupTotalCost = group.items.reduce((sum, item) => sum + (item.expense || 0), 0);

          return (
            <div
              key={group.groupTitle || gIdx}
              className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden transition-all"
            >
              {/* Group Header */}
              <div className="px-6 py-4 bg-stone-50/80 border-b border-stone-200/80 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                    {gIdx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">{group.groupTitle}</h3>
                    {group.date && (
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        {new Date(group.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-stone-400 block">Subtotal</span>
                  <span className="text-sm font-bold text-teal-700">{formatCurrency(groupTotalCost)}</span>
                </div>
              </div>

              {/* Activity Cards List */}
              <div className="divide-y divide-stone-100">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 hover:bg-stone-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Time Slot */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-xs font-semibold">
                          <Clock className="w-3 h-3 text-stone-500" />
                          {item.time}
                        </span>

                        {/* Activity Title */}
                        <h4 className="text-base font-bold text-stone-900 group-hover:text-teal-700 transition-colors">
                          {item.title}
                        </h4>

                        {/* Category Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getCategoryBadgeStyle(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </span>
                      </div>

                      {/* Location & Notes */}
                      {item.location && (
                        <p className="text-xs text-stone-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                          {item.location}
                        </p>
                      )}

                      {item.description && (
                        <p className="text-xs text-stone-600 line-clamp-2 pl-4 border-l-2 border-stone-200">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Expense & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-stone-400 block uppercase tracking-wider font-semibold">
                          Expense
                        </span>
                        <span className="text-sm font-bold text-stone-900">
                          {item.expense > 0 ? formatCurrency(item.expense) : 'Free'}
                        </span>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEditActivity && (
                          <button
                            type="button"
                            onClick={() => onEditActivity(item)}
                            className="p-1.5 text-stone-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                            title="Edit Activity"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteActivity && (
                          <button
                            type="button"
                            onClick={() => onDeleteActivity(item.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete Activity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
