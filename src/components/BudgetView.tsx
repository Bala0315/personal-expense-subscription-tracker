import React, { useEffect, useState } from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DashboardSnapshot, formatCurrency, MONTH_NAMES } from '../types/finance';
import { BudgetDoughnutChart } from './FinanceCharts';

interface BudgetViewProps {
  snapshot: DashboardSnapshot;
  onSaveBudget: (month: number, year: number, budgetLimit: number) => Promise<boolean>;
  onChangePeriod: (month: number, year: number) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  snapshot,
  onSaveBudget,
  onChangePeriod,
}) => {
  const [month, setMonth] = useState(snapshot.month);
  const [year, setYear] = useState(snapshot.year);
  const [budgetLimit, setBudgetLimit] = useState(
    snapshot.budgetLimit > 0 ? String(snapshot.budgetLimit) : '25000'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMonth(snapshot.month);
    setYear(snapshot.year);
    setBudgetLimit(snapshot.budgetLimit > 0 ? String(snapshot.budgetLimit) : '25000');
  }, [snapshot.month, snapshot.year, snapshot.budgetLimit]);

  const isExceeded = snapshot.budgetLimit > 0 && snapshot.usagePercent >= 100;
  const isWarning = snapshot.budgetLimit > 0 && snapshot.usagePercent >= 80 && !isExceeded;
  const progressWidth = Math.min(100, Math.max(0, snapshot.usagePercent));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(budgetLimit);
    if (!Number.isFinite(num) || num <= 0) {
      setError('Enter a positive monthly budget amount.');
      return;
    }
    setError('');
    setSaving(true);
    await onSaveBudget(month, year, Math.round(num * 100) / 100);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Monthly Budget Management</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Formula: <span className="font-mono text-slate-700">Remaining Budget = Monthly Budget - Total Monthly Spending</span>
        </p>
      </div>

      {/* Automatic 80% Warning & Exceeded Alert */}
      {isExceeded && (
        <div
          role="alert"
          className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 text-sm text-red-900"
        >
          <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-semibold">Budget Limit Exceeded:</span> Total spending of{' '}
            <span className="font-mono tabular-nums font-semibold">
              {formatCurrency(snapshot.totalMonthlySpending)}
            </span>{' '}
            is over your {MONTH_NAMES[snapshot.month - 1]} budget by{' '}
            <span className="font-mono tabular-nums font-semibold">
              {formatCurrency(snapshot.totalMonthlySpending - snapshot.budgetLimit)}
            </span>
            .
          </div>
        </div>
      )}

      {isWarning && (
        <div
          role="alert"
          className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 text-sm text-amber-950"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-semibold">Approaching Budget Limit (80%+):</span> You have consumed{' '}
            <span className="font-mono tabular-nums font-semibold">
              {snapshot.usagePercent.toFixed(1)}%
            </span>{' '}
            of your budget with {formatCurrency(snapshot.remainingBudget)} left.
          </div>
        </div>
      )}

      {!isExceeded && !isWarning && snapshot.budgetLimit > 0 && (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3.5 text-sm text-emerald-950">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-semibold">On Track:</span> Monthly spending is within budget at{' '}
            <span className="font-mono tabular-nums font-semibold">
              {snapshot.usagePercent.toFixed(1)}%
            </span>{' '}
            utilization.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Budget Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            Set or Update Monthly Budget
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Select a billing period and set your target monthly spending ceiling.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-2.5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="budget-month" className="block text-xs font-medium text-slate-700 mb-1">
                  Month
                </label>
                <select
                  id="budget-month"
                  value={month}
                  onChange={(e) => {
                    const nextM = Number(e.target.value);
                    setMonth(nextM);
                    onChangePeriod(nextM, year);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="budget-year" className="block text-xs font-medium text-slate-700 mb-1">
                  Year
                </label>
                <input
                  id="budget-year"
                  type="number"
                  min={2020}
                  max={2050}
                  value={year}
                  onChange={(e) => {
                    const nextY = Number(e.target.value);
                    setYear(nextY);
                    if (nextY >= 2020 && nextY <= 2050) {
                      onChangePeriod(month, nextY);
                    }
                  }}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="budget-limit" className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Budget Limit (₹) *
              </label>
              <input
                id="budget-limit"
                type="number"
                required
                min="1"
                step="0.01"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 px-4 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving ? 'Updating Budget...' : 'Save Monthly Budget'}
            </button>
          </form>

          {/* Transparent Breakdown */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Logged Monthly Expenses</span>
              <span className="font-mono tabular-nums font-medium text-slate-900">
                {formatCurrency(snapshot.monthlyExpenses)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Active Subscriptions (Monthly Eq.)</span>
              <span className="font-mono tabular-nums font-medium text-slate-900">
                {formatCurrency(snapshot.monthlySubscriptionCost)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100 font-semibold text-slate-900">
              <span>Total Monthly Spending</span>
              <span className="font-mono tabular-nums">
                {formatCurrency(snapshot.totalMonthlySpending)}
              </span>
            </div>
          </div>
        </div>

        {/* Budget Progress & Doughnut Visualization */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-3 gap-4 pb-5 border-b border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Budget Limit</p>
              <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
                {formatCurrency(snapshot.budgetLimit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Spending</p>
              <p className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">
                {formatCurrency(snapshot.totalMonthlySpending)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Remaining Balance</p>
              <p
                className={`mt-1 text-xl font-semibold font-mono tabular-nums ${
                  snapshot.remainingBudget < 0 ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {formatCurrency(snapshot.remainingBudget)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-700">Budget Utilization</span>
              <span
                className={`font-mono tabular-nums font-semibold ${
                  isExceeded
                    ? 'text-red-700'
                    : isWarning
                      ? 'text-amber-700'
                      : 'text-blue-700'
                }`}
              >
                {snapshot.usagePercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isExceeded
                    ? 'bg-red-600'
                    : isWarning
                      ? 'bg-amber-500'
                      : 'bg-blue-600'
                }`}
                style={{ width: `${progressWidth}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
              <span>0%</span>
              <span>80% Warning</span>
              <span>100% Limit</span>
            </div>
          </div>

          <BudgetDoughnutChart
            budgetLimit={snapshot.budgetLimit}
            totalSpent={snapshot.totalMonthlySpending}
          />
        </div>
      </div>
    </div>
  );
};
