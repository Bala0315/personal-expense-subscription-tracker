import React from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { DashboardSnapshot, formatCurrency, MONTH_NAMES } from '../types/finance';
import {
  BudgetDoughnutChart,
  CategoryPieChart,
  MonthlyBarChart,
  SpendingLineChart,
} from './FinanceCharts';

interface ReportsViewProps {
  snapshot: DashboardSnapshot;
  onExportCsv: (type: 'expenses' | 'subscriptions' | 'summary') => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  snapshot,
  onExportCsv,
}) => {
  const periodLabel = `${MONTH_NAMES[snapshot.month - 1]} ${snapshot.year}`;

  return (
    <div className="space-y-6">
      {/* Header + 3 CSV Export Options */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Reports, Analytics &amp; CSV Export
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Live SQLite aggregations for {periodLabel} · Export Excel-compatible CSV files anytime.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onExportCsv('expenses')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Export Expenses CSV
          </button>
          <button
            type="button"
            onClick={() => onExportCsv('subscriptions')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
            Export Subscriptions CSV
          </button>
          <button
            type="button"
            onClick={() => onExportCsv('summary')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
            Export Summary CSV
          </button>
        </div>
      </div>

      {/* All 4 Chart.js Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-base font-semibold text-slate-900">
            1. Expenses by Category
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Pie chart grouped by category for {periodLabel}
          </p>
          <CategoryPieChart data={snapshot.categoryBreakdown} />
        </div>

        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-base font-semibold text-slate-900">
            2. Monthly Expenses
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Bar chart comparing total logged expenses across recent months
          </p>
          <MonthlyBarChart data={snapshot.monthlyTotals} />
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-base font-semibold text-slate-900">
            3. Budget Usage
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4 font-mono tabular-nums">
            {formatCurrency(snapshot.totalMonthlySpending)} spent of {formatCurrency(snapshot.budgetLimit)} ({snapshot.usagePercent.toFixed(1)}%)
          </p>
          <BudgetDoughnutChart
            budgetLimit={snapshot.budgetLimit}
            totalSpent={snapshot.totalMonthlySpending}
          />
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-base font-semibold text-slate-900">
            4. Daily Spending Trends
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Line chart plotting day-by-day spending velocity in {periodLabel}
          </p>
          <SpendingLineChart data={snapshot.dailyTrends} />
        </div>
      </div>

      {/* Category Totals Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            Category Spending Summary ({periodLabel})
          </h3>
        </div>
        {snapshot.categoryBreakdown.length === 0 ? (
          <div className="py-10 px-6 text-center text-sm text-slate-500">
            No categorized expenses logged for this period yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-2.5 pl-5 pr-3 font-medium">Category</th>
                  <th className="py-2.5 px-3 font-medium text-right">Amount Spent</th>
                  <th className="py-2.5 pl-3 pr-5 font-medium text-right">Share of Expenses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {snapshot.categoryBreakdown.map((row) => {
                  const share =
                    snapshot.monthlyExpenses > 0
                      ? (row.total / snapshot.monthlyExpenses) * 100
                      : 0;
                  return (
                    <tr key={row.category} className="hover:bg-slate-50/70">
                      <td className="py-3 pl-5 pr-3 font-medium text-slate-900">
                        {row.category}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs font-semibold text-slate-900">
                        {formatCurrency(row.total)}
                      </td>
                      <td className="py-3 pl-3 pr-5 text-right font-mono tabular-nums text-xs text-slate-600">
                        {share.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
