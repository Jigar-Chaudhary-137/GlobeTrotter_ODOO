import React from 'react';
import { Search, Filter, Layers, ArrowUpDown, RotateCcw, X } from 'lucide-react';

/**
 * ActivityFilterBar
 * Screen 9 Toolbar for searching, grouping, filtering, and sorting itinerary activities.
 *
 * @param {string} search - Current search query
 * @param {function} onSearchChange - Callback when search text changes
 * @param {string} groupBy - Current grouping ('day', 'city', 'category')
 * @param {function} onGroupByChange - Callback when group by option changes
 * @param {string} category - Current category filter ('All', 'Transport', 'Accommodation', 'Activities', 'Meals', 'Other')
 * @param {function} onCategoryChange - Callback when category filter changes
 * @param {string} sortBy - Current sort option ('time-asc', 'time-desc', 'cost-asc', 'cost-desc')
 * @param {function} onSortChange - Callback when sort option changes
 * @param {function} [onResetFilters] - Optional callback to reset all filters to default
 */
export default function ActivityFilterBar({
  search = '',
  onSearchChange,
  groupBy = 'day',
  onGroupByChange,
  category = 'All',
  onCategoryChange,
  sortBy = 'time-asc',
  onSortChange,
  onResetFilters,
}) {
  const CATEGORIES = ['All', 'Transport', 'Accommodation', 'Activities', 'Meals', 'Other'];

  const isFiltered = search || category !== 'All' || groupBy !== 'day' || sortBy !== 'time-asc';

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 mb-6 transition-all duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search activities, locations, or notes..."
            className="w-full pl-10 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange && onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-200/60 transition-all"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Group By Selector */}
          <div className="flex items-center gap-1.5 bg-stone-50 p-1 border border-stone-200 rounded-xl">
            <span className="text-xs font-semibold text-stone-500 pl-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Group:</span>
            </span>
            <div className="flex items-center gap-0.5">
              {[
                { id: 'day', label: 'Day' },
                { id: 'city', label: 'City' },
                { id: 'category', label: 'Category' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onGroupByChange && onGroupByChange(opt.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    groupBy === opt.id
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="relative flex items-center">
            <span className="absolute left-3 pointer-events-none text-stone-400">
              <Filter className="w-3.5 h-3.5 text-teal-600" />
            </span>
            <select
              value={category}
              onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
              className="pl-8 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 appearance-none cursor-pointer transition-all"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Selector */}
          <div className="relative flex items-center">
            <span className="absolute left-3 pointer-events-none text-stone-400">
              <ArrowUpDown className="w-3.5 h-3.5 text-teal-600" />
            </span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange && onSortChange(e.target.value)}
              className="pl-8 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 appearance-none cursor-pointer transition-all"
            >
              <option value="time-asc">Time (Earliest First)</option>
              <option value="time-desc">Time (Latest First)</option>
              <option value="cost-asc">Expense (Low → High)</option>
              <option value="cost-desc">Expense (High → Low)</option>
            </select>
          </div>

          {/* Reset Filters Helper */}
          {isFiltered && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-stone-500 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-all"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
