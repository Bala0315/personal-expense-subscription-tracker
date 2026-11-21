import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CreditCard,
  PiggyBank,
  Receipt,
  Repeat,
  Wallet,
} from 'lucide-react';
import {
  DashboardSnapshot,
  FinancePage,
  formatCurrency,
  MONTH_NAMES,
} from '../types/finance';
import { BudgetDoughnutChart, CategoryPieChart } from './FinanceCharts';

interface DashboardViewProps {
  snapshot: DashboardSnapshot;
  onNavigate: (page: FinancePage) => void;
  onQuickAddExpense: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  snapshot,
  onNavigate,
  onQuickAddExpense,
}) => {
  const isExceeded = snapshot.budgetLimit > 0 && snapshot.usagePercent >= 100;
  const isWarning = snapshot.budgetLimit > 0 && snapshot.usagePercent >= 80 && !isExceeded;

  return (
    <div className="space-y-6">
      {/* Budget Warning / Exceeded Alert Banners */}
      {isExceeded && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 text-sm text-red-900"
        >
          <div className="flex items-start gap-2.5">
            <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-semibold">Monthly Budget Exceeded:</span> Total spending of{' '}
              <span className="font-mono tabular-nums font-semibold">
                {formatCurrency(snapshot.totalMonthlySpending)}
              </span>{' '}
              exceeds your{' '}
              <span className="font-mono tabular-nums font-semibold">
                {formatCurrency(snapshot.budgetLimit)}
              </span>{' '}
              limit ({snapshot.usagePercent.toFixed(1)}%).
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('budget')}
            className="text-xs font-medium text-red-800 underline hover:text-red-950 whitespace-nowrap cursor-pointer"
          >
            Adjust Budget
          </button>
        </div>
      )}

      {isWarning && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 text-sm text-amber-950"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-semibold">Budget Warning:</span> You have used{' '}
              <span className="font-mono tabular-nums font-semibold">
                {snapshot.usagePercent.toFixed(1)}%
              </span>{' '}
              of your {MONTH_NAMES[snapshot.month - 1]} budget ({formatCurrency(snapshot.remainingBudget)} remaining).
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('budget')}
            className="text-xs font-medium text-amber-900 underline hover:text-amber-950 whitespace-nowrap cursor-pointer"
          >
            Review Budget
          </button>
        </div>
      )}

      {/* 5 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Monthly Expenses</span>
            <Wallet className="w-4 h-4 text-blue-600" aria-hidden="true" />
          </div>
          <p className="mt-2.5 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {formatCurrency(snapshot.monthlyExpenses)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {MONTH_NAMES[snapshot.month - 1]} {snapshot.year}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Subscription Costs</span>
            <Repeat className="w-4 h-4 text-blue-600" aria-hidden="true" />
          </div>
          <p className="mt-2.5 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {formatCurrency(snapshot.monthlySubscriptionCost)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {snapshot.activeSubscriptionCount} active · monthly eq.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Monthly Budget</span>
            <PiggyBank className="w-4 h-4 text-blue-600" aria-hidden="true" />
          </div>
          <p className="mt-2.5 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {formatCurrency(snapshot.budgetLimit)}
          </p>
          <p className="mt-1 text-xs font-mono tabular-nums text-slate-500">
            {snapshot.usagePercent.toFixed(1)}% utilized
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Remaining Budget</span>
            <CreditCard className="w-4 h-4 text-blue-600" aria-hidden="true" />
          </div>
          <p
            className={`mt-2.5 text-2xl font-semibold font-mono tabular-nums ${
              snapshot.remainingBudget < 0 ? 'text-red-600' : 'text-emerald-700'
            }`}
          >
            {formatCurrency(snapshot.remainingBudget)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {snapshot.remainingBudget < 0 ? 'Over monthly limit' : 'Available balance'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Transactions</span>
            <Receipt className="w-4 h-4 text-blue-600" aria-hidden="true" />
          </div>
          <p className="mt-2.5 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {snapshot.txCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Logged this month</p>
        </div>
      </div>

      {/* Visual Spending Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Expenses by Category</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution across categories in {MONTH_NAMES[snapshot.month - 1]} {snapshot.year}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 whitespace-nowrap cursor-pointer"
            >
              Full Reports
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
          <CategoryPieChart data={snapshot.categoryBreakdown} />
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Monthly Budget Usage</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                {formatCurrency(snapshot.totalMonthlySpending)} / {formatCurrency(snapshot.budgetLimit)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('budget')}
              className="text-xs font-medium text-blue-700 hover:text-blue-900 whitespace-nowrap cursor-pointer"
            >
              Manage Budget
            </button>
          </div>
          <BudgetDoughnutChart
            budgetLimit={snapshot.budgetLimit}
            totalSpent={snapshot.totalMonthlySpending}
          />
        </div>
      </div>

      {/* Bottom Row: Recent Expenses + Upcoming Subscription Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent Expenses</h2>
            <button
              type="button"
              onClick={() => onNavigate('expenses')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 whitespace-nowrap cursor-pointer"
            >
              View All Expenses
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {snapshot.recentExpenses.length === 0 ? (
            <div className="py-10 px-6 text-center">
              <p className="text-sm font-medium text-slate-900">No expenses logged yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Record your first daily transaction to populate spending charts.
              </p>
              <button
                type="button"
                onClick={onQuickAddExpense}
                className="mt-4 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Add First Expense
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                    <th className="py-2.5 pl-5 pr-3 font-medium">Date</th>
                    <th className="py-2.5 px-3 font-medium">Title</th>
                    <th className="py-2.5 px-3 font-medium">Category</th>
                    <th className="py-2.5 px-3 font-medium">Method</th>
                    <th className="py-2.5 pl-3 pr-5 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {snapshot.recentExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 pl-5 pr-3 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                        {exp.date}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900">{exp.title}</td>
                      <td className="py-3 px-3 text-xs text-slate-600 whitespace-nowrap">
                        {exp.category}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">
                        {exp.payment_method}
                      </td>
                      <td className="py-3 pl-3 pr-5 text-right font-mono tabular-nums text-xs font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrency(exp.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Upcoming Renewals</h2>
            <button
              type="button"
              onClick={() => onNavigate('subscriptions')}
              className="text-xs font-medium text-blue-700 hover:text-blue-900 whitespace-nowrap cursor-pointer"
            >
              Manage
            </button>
          </div>

          {snapshot.upcomingSubscriptions.length === 0 ? (
            <div className="py-10 px-5 text-center text-xs text-slate-500">
              No active subscriptions scheduled.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {snapshot.upcomingSubscriptions.map((sub) => (
                <li
                  key={sub.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{sub.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span className="font-mono tabular-nums">{sub.next_payment_date}</span>
                      <span aria-hidden="true">·</span>
                      <span>{sub.billing_cycle}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono tabular-nums text-sm font-semibold text-slate-900">
                      {formatCurrency(sub.amount)}
                    </p>
                    <p className="font-mono tabular-nums text-[11px] text-slate-500">
                      {formatCurrency(sub.monthly_equivalent)}/mo
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
