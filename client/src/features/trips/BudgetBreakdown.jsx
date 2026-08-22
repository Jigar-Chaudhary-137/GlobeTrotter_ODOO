import React from 'react';
import {
  Wallet,
  PieChart as ChartIcon,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Calendar,
  Plus,
  Trash2,
  DollarSign,
  TrendingDown,
  Info,
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
  YAxis,
  CartesianGrid,
} from 'recharts';

const CATEGORY_COLORS = {
  TRANSPORT: '#3b82f6', // Blue
  ACCOMMODATION: '#f97316', // Orange / Coral
  ACTIVITIES: '#0d9488', // Emerald Teal
  MEALS: '#ec4899', // Pink / Rose
  OTHER: '#8b5cf6', // Purple
};

/**
 * Format currency helper
 */
const formatCurrency = (amount = 0) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

/**
 * BudgetBreakdown Component
 * Screen 9 Financial & Budget visualization component.
 */
export default function BudgetBreakdown({
  trip,
  expenseSummary,
  loading = false,
  error = null,
  onAddExpense,
  onDeleteExpense,
}) {
  // Normalize expenseSummary data (backend aggregated payload or fallback)
  const summary = React.useMemo(() => {
    if (expenseSummary) return expenseSummary;

    // Fallback if component used before backend summary is attached
    const budget = Number(trip?.totalBudget || 0);
    return {
      totalBudget: budget,
      totalExpense: 0,
      remainingBudget: budget,
      isOverBudget: false,
      categoryBreakdown: {
        TRANSPORT: 0,
        ACCOMMODATION: 0,
        ACTIVITIES: 0,
        MEALS: 0,
        OTHER: 0,
      },
      costPerDay: [],
      costPerCity: [],
      expensesList: [],
    };
  }, [expenseSummary, trip]);

  const totalBudget = summary.totalBudget || Number(trip?.totalBudget || 0);
  const totalExpense = summary.totalExpense || 0;
  const remainingBudget = summary.remainingBudget !== undefined ? summary.remainingBudget : totalBudget - totalExpense;
  const isOverBudget = summary.isOverBudget || (totalBudget > 0 && totalExpense > totalBudget);

  // Calculate Average Cost Per Day
  const averageCostPerDay = React.useMemo(() => {
    if (Array.isArray(summary.costPerDay) && summary.costPerDay.length > 0) {
      const activeDays = summary.costPerDay.length;
      return totalExpense / activeDays;
    }
    // Calculate from trip dates if available
    if (trip?.startDate && trip?.endDate) {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const diffTime = Math.abs(end - start);
      const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return totalDays > 0 ? totalExpense / totalDays : totalExpense;
    }
    return totalExpense;
  }, [summary.costPerDay, totalExpense, trip]);

  // Format Recharts Pie Data safely
  const pieChartData = React.useMemo(() => {
    const breakdown = summary.categoryBreakdown || {};
    const data = [
      { name: 'Transport', value: breakdown.TRANSPORT || 0, color: CATEGORY_COLORS.TRANSPORT },
      { name: 'Accommodation', value: breakdown.ACCOMMODATION || 0, color: CATEGORY_COLORS.ACCOMMODATION },
      { name: 'Activities', value: breakdown.ACTIVITIES || 0, color: CATEGORY_COLORS.ACTIVITIES },
      { name: 'Meals', value: breakdown.MEALS || 0, color: CATEGORY_COLORS.MEALS },
      { name: 'Other', value: breakdown.OTHER || 0, color: CATEGORY_COLORS.OTHER },
    ];
    return data.filter((item) => item.value > 0);
  }, [summary.categoryBreakdown]);

  // Format Recharts Bar Data
  const barChartData = React.useMemo(() => {
    if (!Array.isArray(summary.costPerDay)) return [];
    return summary.costPerDay.map((d) => ({
      day: d.day,
      cost: d.cost || 0,
    }));
  }, [summary.costPerDay]);

  // Loading State
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-stone-200/60 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-stone-200/60 rounded-2xl animate-pulse" />
          <div className="h-72 bg-stone-200/60 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800 space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold">Unable to Load Budget Analytics</h3>
        <p className="text-sm text-rose-600 max-w-md mx-auto">{error}</p>
      </div>
    );
  }

  const budgetUsagePercent = totalBudget > 0 ? Math.min(Math.round((totalExpense / totalBudget) * 100), 100) : 0;

  return (
    <div className="space-y-8">
      {/* Over-Budget / Within-Budget Alert Banner */}
      {isOverBudget ? (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
          <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-rose-900">You're Over Budget!</h3>
            <p className="text-xs text-rose-700">
              Total estimated cost ({formatCurrency(totalExpense)}) exceeds your allocated budget (
              {formatCurrency(totalBudget)}) by{' '}
              <span className="font-bold">{formatCurrency(Math.abs(remainingBudget))}</span>. Consider adjusting activities or transport expenses.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900">Within Budget</h4>
              <p className="text-xs text-emerald-700">
                You have {formatCurrency(remainingBudget)} left from your {formatCurrency(totalBudget)} budget.
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-xs font-bold text-emerald-800">{budgetUsagePercent}% Used</span>
            <div className="w-24 bg-emerald-200 h-2 rounded-full overflow-hidden mt-1">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${budgetUsagePercent}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Budget */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Budget</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-900">{formatCurrency(totalBudget)}</p>
          <span className="text-[11px] text-stone-400 block">Allocated trip limit</span>
        </div>

        {/* Card 2: Total Estimated Expense */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Expense</span>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-900">{formatCurrency(totalExpense)}</p>
          <span className="text-[11px] text-stone-400 block">All activities & line items</span>
        </div>

        {/* Card 3: Remaining Budget */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Remaining</span>
            <div
              className={`p-2 rounded-xl ${
                remainingBudget < 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${remainingBudget < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            {formatCurrency(remainingBudget)}
          </p>
          <span className="text-[11px] text-stone-400 block">Available balance</span>
        </div>

        {/* Card 4: Avg Cost Per Day */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg / Day</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-900">{formatCurrency(averageCostPerDay)}</p>
          <span className="text-[11px] text-stone-400 block">Average daily expenditure</span>
        </div>
      </div>

      {/* Visualizations Section: Pie Chart & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Chart */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-teal-600" />
              Category Breakdown
            </h3>
            <span className="text-xs text-stone-400">By Expense Type</span>
          </div>

          {pieChartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2">
              <Info className="w-8 h-8 text-stone-300" />
              <p className="text-xs font-medium">No category expense data available yet.</p>
            </div>
          )}
        </div>

        {/* Daily Cost Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Cost Per Day
            </h3>
            <span className="text-xs text-stone-400">Daily Timeline</span>
          </div>

          {barChartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#78716c' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="cost" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2">
              <Info className="w-8 h-8 text-stone-300" />
              <p className="text-xs font-medium">No daily itinerary expenses logged yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cost Per City Section */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            Cost Per Destination / City
          </h3>
          <span className="text-xs text-stone-400">Multi-City Expense Distribution</span>
        </div>

        {Array.isArray(summary.costPerCity) && summary.costPerCity.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {summary.costPerCity.map((item, idx) => (
              <div
                key={item.city || idx}
                className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-teal-100 text-teal-800 rounded-lg flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">{item.city}</h4>
                    <span className="text-[11px] text-stone-400">Destination</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-teal-700">{formatCurrency(item.cost)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-stone-400 text-xs font-medium bg-stone-50 rounded-xl border border-dashed border-stone-200">
            No city-specific expense breakdown available. Add city stops to assign activities.
          </div>
        )}
      </div>

      {/* Standalone Expense Line Items List */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-teal-600" />
              General Line Item Expenses
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">Flights, hotels, and general travel receipts</p>
          </div>

          {onAddExpense && (
            <button
              type="button"
              onClick={onAddExpense}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Expense
            </button>
          )}
        </div>

        {Array.isArray(summary.expensesList) && summary.expensesList.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {summary.expensesList.map((exp) => (
              <div key={exp.id} className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-stone-900">{exp.description}</h4>
                  <span className="inline-block px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full text-[10px] font-semibold">
                    {exp.category}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-stone-900">{formatCurrency(exp.amount)}</span>
                  {onDeleteExpense && (
                    <button
                      type="button"
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded-md transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-stone-400 text-xs font-medium bg-stone-50 rounded-xl border border-dashed border-stone-200">
            No general line item expenses added. Click "Log Expense" to record flights, lodging, or transport receipts.
          </div>
        )}
      </div>
    </div>
  );
}
