import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  PauseCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  BILLING_CYCLES,
  BillingCycle,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  formatCurrency,
  SUBSCRIPTION_STATUSES,
  SubscriptionRecord,
  SubscriptionStatus,
} from '../types/finance';

interface SubscriptionFormInput {
  name: string;
  amount: number;
  category: ExpenseCategory;
  billing_cycle: BillingCycle;
  start_date: string;
  next_payment_date: string;
  status: SubscriptionStatus;
}

interface SubscriptionsViewProps {
  subscriptions: SubscriptionRecord[];
  onCreate: (data: SubscriptionFormInput) => Promise<boolean>;
  onUpdate: (id: number, data: SubscriptionFormInput) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onExportCsv: () => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  subscriptions,
  onCreate,
  onUpdate,
  onDelete,
  onExportCsv,
}) => {
  const todayIso = new Date().toISOString().slice(0, 10);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Entertainment');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('Monthly');
  const [startDate, setStartDate] = useState(todayIso);
  const [nextPaymentDate, setNextPaymentDate] = useState(todayIso);
  const [status, setStatus] = useState<SubscriptionStatus>('Active');
  const [statusFilter, setStatusFilter] = useState<'all' | SubscriptionStatus>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setAmount('');
    setCategory('Entertainment');
    setBillingCycle('Monthly');
    setStartDate(todayIso);
    setNextPaymentDate(todayIso);
    setStatus('Active');
    setFormError('');
  };

  const loadForEdit = (sub: SubscriptionRecord) => {
    setEditingId(sub.id);
    setName(sub.name);
    setAmount(String(sub.amount));
    setCategory(sub.category);
    setBillingCycle(sub.billing_cycle);
    setStartDate(sub.start_date);
    setNextPaymentDate(sub.next_payment_date);
    setStatus(sub.status);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const numAmount = parseFloat(amount);

    if (!cleanName) {
      setFormError('Subscription name is required.');
      return;
    }
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setFormError('Amount must be greater than zero.');
      return;
    }
    if (!startDate || !nextPaymentDate) {
      setFormError('Start date and next payment date are required.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    const payload: SubscriptionFormInput = {
      name: cleanName,
      amount: Math.round(numAmount * 100) / 100,
      category,
      billing_cycle: billingCycle,
      start_date: startDate,
      next_payment_date: nextPaymentDate,
      status,
    };

    const ok =
      editingId !== null
        ? await onUpdate(editingId, payload)
        : await onCreate(payload);
    setSubmitting(false);

    if (ok) {
      resetForm();
    }
  };

  const summary = useMemo(() => {
    const active = subscriptions.filter((s) => s.status === 'Active');
    const monthlyCost = active.reduce((sum, s) => sum + s.monthly_equivalent, 0);
    return {
      activeCount: active.length,
      cancelledCount: subscriptions.length - active.length,
      monthlyCost,
      annualCost: monthlyCost * 12,
    };
  }, [subscriptions]);

  const visibleSubscriptions = useMemo(() => {
    if (statusFilter === 'all') return subscriptions;
    return subscriptions.filter((s) => s.status === statusFilter);
  }, [subscriptions, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Header + Summary Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recurring Subscriptions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {summary.activeCount} Active · Normalized Monthly:{' '}
            <span className="font-mono tabular-nums font-semibold text-blue-700">
              {formatCurrency(summary.monthlyCost)}
            </span>{' '}
            · Projected Annual:{' '}
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {formatCurrency(summary.annualCost)}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onExportCsv}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          Export Subscriptions CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 4 cols: Add / Edit Subscription Form */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            {editingId !== null ? 'Edit Subscription' : 'Add Subscription'}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Tracked separately from daily expenses; recurring cost is normalized automatically by billing cycle.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {formError && (
              <div className="p-2.5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg">
                {formError}
              </div>
            )}

            <div>
              <label htmlFor="sub-name" className="block text-xs font-medium text-slate-700 mb-1">
                Service Name *
              </label>
              <input
                id="sub-name"
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Netflix, Amazon Prime, Spotify"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sub-amount" className="block text-xs font-medium text-slate-700 mb-1">
                  Amount (₹) *
                </label>
                <input
                  id="sub-amount"
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="sub-cycle" className="block text-xs font-medium text-slate-700 mb-1">
                  Billing Cycle *
                </label>
                <select
                  id="sub-cycle"
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                  className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                >
                  {BILLING_CYCLES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sub-cat" className="block text-xs font-medium text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  id="sub-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sub-status" className="block text-xs font-medium text-slate-700 mb-1">
                  Status *
                </label>
                <select
                  id="sub-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                  className="w-full px-2.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                >
                  {SUBSCRIPTION_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sub-start" className="block text-xs font-medium text-slate-700 mb-1">
                  Start Date *
                </label>
                <input
                  id="sub-start"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="sub-next" className="block text-xs font-medium text-slate-700 mb-1">
                  Next Billing *
                </label>
                <input
                  id="sub-next"
                  type="date"
                  required
                  value={nextPaymentDate}
                  onChange={(e) => setNextPaymentDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 px-4 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {submitting
                  ? 'Saving...'
                  : editingId !== null
                    ? 'Update Subscription'
                    : 'Save Subscription'}
              </button>
              {editingId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right 8 cols: Subscriptions Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-900">Tracked Services</span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg" role="group" aria-label="Filter subscriptions by status">
              {(['all', 'Active', 'Cancelled'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab}
                </button>
              ))}
            </div>
          </div>

          {visibleSubscriptions.length === 0 ? (
            <div className="py-12 px-6 text-center text-sm text-slate-500">
              No subscriptions found in this view.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                    <th className="py-2.5 pl-4 pr-3 font-medium">Service</th>
                    <th className="py-2.5 px-3 font-medium">Cycle</th>
                    <th className="py-2.5 px-3 font-medium">Next Billing</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 px-3 font-medium text-right">Billed</th>
                    <th className="py-2.5 px-3 font-medium text-right">Monthly Eq.</th>
                    <th className="py-2.5 pl-3 pr-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {visibleSubscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 pl-4 pr-3">
                        <p className="font-medium text-slate-900 whitespace-nowrap">{sub.name}</p>
                        <p className="text-xs text-slate-500">{sub.category}</p>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 whitespace-nowrap">
                        {sub.billing_cycle}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                        {sub.next_payment_date}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {sub.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <PauseCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-slate-900 whitespace-nowrap">
                        {formatCurrency(sub.amount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs font-semibold text-blue-700 whitespace-nowrap">
                        {formatCurrency(sub.monthly_equivalent)}
                      </td>
                      <td className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                        {confirmDeleteId === sub.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={async () => {
                                await onDelete(sub.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => loadForEdit(sub)}
                              aria-label={`Edit ${sub.name}`}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(sub.id)}
                              aria-label={`Delete ${sub.name}`}
                              className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
