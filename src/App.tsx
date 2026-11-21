import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Download,
  LayoutDashboard,
  Menu,
  PiggyBank,
  Plus,
  Receipt,
  Repeat,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  BillingCycle,
  DashboardSnapshot,
  ExpenseCategory,
  ExpenseRecord,
  FinancePage,
  MONTH_NAMES,
  PaymentMethod,
  SubscriptionRecord,
  SubscriptionStatus,
} from './types/finance';
import { DashboardView } from './components/DashboardView';
import { ExpensesView } from './components/ExpensesView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { BudgetView } from './components/BudgetView';
import { ReportsView } from './components/ReportsView';

interface ToastMessage {
  kind: 'success' | 'error';
  text: string;
}

export default function App() {
  const now = new Date();
  const [page, setPage] = useState<FinancePage>('dashboard');
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [openExpenseModalSignal, setOpenExpenseModalSignal] = useState<number>(0);

  const showToast = useCallback((kind: 'success' | 'error', text: string) => {
    setToast({ kind, text });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const fetchAllData = useCallback(
    async (targetMonth = month, targetYear = year) => {
      try {
        const [dashRes, expRes, subRes] = await Promise.all([
          fetch(`/api/dashboard?month=${targetMonth}&year=${targetYear}`),
          fetch('/api/expenses'),
          fetch('/api/subscriptions'),
        ]);
        if (!dashRes.ok || !expRes.ok || !subRes.ok) {
          throw new Error('Failed to load financial records from database.');
        }
        const [dashData, expData, subData] = await Promise.all([
          dashRes.json(),
          expRes.json(),
          subRes.json(),
        ]);
        setSnapshot(dashData);
        setExpenses(expData);
        setSubscriptions(subData);
      } catch (err) {
        showToast(
          'error',
          err instanceof Error ? err.message : 'Unable to connect to local SQLite backend.'
        );
      } finally {
        setLoading(false);
      }
    },
    [month, year, showToast]
  );

  useEffect(() => {
    fetchAllData(month, year);
  }, [month, year, fetchAllData]);

  // Expense CRUD handlers
  const handleCreateExpense = async (data: {
    title: string;
    amount: number;
    category: ExpenseCategory;
    date: string;
    payment_method: PaymentMethod;
    description: string;
  }): Promise<boolean> => {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast('error', err.error || 'Could not save expense.');
      return false;
    }
    await fetchAllData();
    showToast('success', 'Expense added and charts updated.');
    return true;
  };

  const handleUpdateExpense = async (
    id: number,
    data: {
      title: string;
      amount: number;
      category: ExpenseCategory;
      date: string;
      payment_method: PaymentMethod;
      description: string;
    }
  ): Promise<boolean> => {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast('error', err.error || 'Could not update expense.');
      return false;
    }
    await fetchAllData();
    showToast('success', 'Expense updated.');
    return true;
  };

  const handleDeleteExpense = async (id: number): Promise<boolean> => {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      showToast('error', 'Could not delete expense.');
      return false;
    }
    await fetchAllData();
    showToast('success', 'Expense removed.');
    return true;
  };

  // Subscription CRUD handlers
  const handleCreateSubscription = async (data: {
    name: string;
    amount: number;
    category: ExpenseCategory;
    billing_cycle: BillingCycle;
    start_date: string;
    next_payment_date: string;
    status: SubscriptionStatus;
  }): Promise<boolean> => {
    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast('error', err.error || 'Could not save subscription.');
      return false;
    }
    await fetchAllData();
    showToast('success', 'Subscription added.');
    return true;
  };

  const handleUpdateSubscription = async (
    id: number,
    data: {
      name: string;
      amount: number;
      category: ExpenseCategory;
      billing_cycle: BillingCycle;
      start_date: string;
      next_payment_date: string;
      status: SubscriptionStatus;
    }
  ): Promise<boolean> => {
    const res = await fetch(`/api/subscriptions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast('error', err.error || 'Could not update subscription.');
      return false;
    }
    await fetchAllData();
    showToast('success', 'Subscription updated.');
    return true;
  };

  const handleDeleteSubscription = async (id: number): Promise<boolean> => {
    const res = await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      showToast('error', 'Could not delete subscription.');
      return false;
    }
    await fetchAllData();
    showToast('success', 'Subscription deleted.');
    return true;
  };

  // Budget update handler
  const handleSaveBudget = async (
    targetMonth: number,
    targetYear: number,
    budgetLimit: number
  ): Promise<boolean> => {
    const res = await fetch('/api/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: targetMonth,
        year: targetYear,
        budget_limit: budgetLimit,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast('error', err.error || 'Could not update monthly budget.');
      return false;
    }
    setMonth(targetMonth);
    setYear(targetYear);
    await fetchAllData(targetMonth, targetYear);
    showToast('success', 'Monthly budget limit saved.');
    return true;
  };

  // Excel-ready CSV Download
  const handleExportCsv = useCallback(
    (type: 'expenses' | 'subscriptions' | 'summary' = 'expenses') => {
      const url = `/api/export/csv?type=${type}&month=${month}&year=${year}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${year}-${String(month).padStart(2, '0')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('success', `Exported ${type} CSV file.`);
    },
    [month, year, showToast]
  );

  const navItems: { id: FinancePage; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
    { id: 'expenses', label: 'Expenses', icon: <Receipt className="w-4 h-4 shrink-0" /> },
    { id: 'subscriptions', label: 'Subscriptions', icon: <Repeat className="w-4 h-4 shrink-0" /> },
    { id: 'budget', label: 'Budget', icon: <PiggyBank className="w-4 h-4 shrink-0" /> },
    { id: 'reports', label: 'Reports & Analytics', icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
  ];

  const pageTitle = navItems.find((n) => n.id === page)?.label ?? 'Dashboard';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-white border-r border-slate-200 sticky top-0 h-screen">
        <div className="h-15 px-5 flex items-center border-b border-slate-200">
          <button
            type="button"
            onClick={() => setPage('dashboard')}
            className="font-display text-lg font-bold tracking-tight text-blue-700 whitespace-nowrap cursor-pointer"
          >
            ExpenseTrack
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1" aria-label="Sidebar navigation">
          {navItems.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPage(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-2">
          <button
            type="button"
            onClick={() => handleExportCsv('expenses')}
            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Export Expenses CSV
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white h-full flex flex-col border-r border-slate-200 z-10">
            <div className="h-15 px-5 flex items-center justify-between border-b border-slate-200">
              <span className="font-display text-lg font-bold text-blue-700">
                ExpenseTrack
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => {
                const active = page === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPage(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  handleExportCsv('expenses');
                  setMobileMenuOpen(false);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Export Expenses CSV
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Contextual Top Bar */}
        <header className="sticky top-0 z-30 h-15 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-slate-400 hidden sm:inline">Personal Finance</span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">/</span>
              <span className="font-display font-semibold text-slate-900 truncate">
                {pageTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Period Picker */}
            <div className="hidden sm:flex items-center gap-1.5">
              <select
                aria-label="Select month"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500"
              >
                {MONTH_NAMES.map((mName, idx) => (
                  <option key={mName} value={idx + 1}>
                    {mName}
                  </option>
                ))}
              </select>
              <input
                aria-label="Select year"
                type="number"
                min={2020}
                max={2050}
                value={year}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 2020 && val <= 2050) setYear(val);
                }}
                className="w-20 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setPage('expenses');
                setOpenExpenseModalSignal((s) => s + 1);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add Expense
            </button>
          </div>
        </header>

        {/* Feedback Toast Notification */}
        {toast && (
          <div className="px-4 sm:px-6 pt-4 max-w-[1280px] w-full mx-auto">
            <div
              role="status"
              className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border text-xs font-medium ${
                toast.kind === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {toast.kind === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
                )}
                {toast.text}
              </span>
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Dismiss notification"
                className="opacity-70 hover:opacity-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Active View Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1280px] w-full mx-auto">
          {loading || !snapshot ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse"
                  />
                ))}
              </div>
              <div className="h-72 bg-white border border-slate-200 rounded-xl animate-pulse" />
            </div>
          ) : (
            <>
              {page === 'dashboard' && (
                <DashboardView
                  snapshot={snapshot}
                  onNavigate={setPage}
                  onQuickAddExpense={() => {
                    setPage('expenses');
                    setOpenExpenseModalSignal((s) => s + 1);
                  }}
                />
              )}
              {page === 'expenses' && (
                <ExpensesView
                  expenses={expenses}
                  onCreate={handleCreateExpense}
                  onUpdate={handleUpdateExpense}
                  onDelete={handleDeleteExpense}
                  onExportCsv={() => handleExportCsv('expenses')}
                  openModalSignal={openExpenseModalSignal}
                />
              )}
              {page === 'subscriptions' && (
                <SubscriptionsView
                  subscriptions={subscriptions}
                  onCreate={handleCreateSubscription}
                  onUpdate={handleUpdateSubscription}
                  onDelete={handleDeleteSubscription}
                  onExportCsv={() => handleExportCsv('subscriptions')}
                />
              )}
              {page === 'budget' && (
                <BudgetView
                  snapshot={snapshot}
                  onSaveBudget={handleSaveBudget}
                  onChangePeriod={(m, y) => {
                    setMonth(m);
                    setYear(y);
                  }}
                />
              )}
              {page === 'reports' && (
                <ReportsView snapshot={snapshot} onExportCsv={handleExportCsv} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
