import React, { useMemo, useState } from 'react';
import {
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  ExpenseRecord,
  formatCurrency,
  PAYMENT_METHODS,
  PaymentMethod,
} from '../types/finance';

interface ExpenseFormInput {
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  payment_method: PaymentMethod;
  description: string;
}

interface ExpensesViewProps {
  expenses: ExpenseRecord[];
  onCreate: (data: ExpenseFormInput) => Promise<boolean>;
  onUpdate: (id: number, data: ExpenseFormInput) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onExportCsv: () => void;
  openModalSignal: number;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  onCreate,
  onUpdate,
  onDelete,
  onExportCsv,
  openModalSignal,
}) => {
  const todayIso = new Date().toISOString().slice(0, 10);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [date, setDate] = useState(todayIso);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [description, setDescription] = useState('');

  // Open modal whenever parent triggers quick-add signal
  const lastSignalRef = React.useRef(openModalSignal);
  React.useEffect(() => {
    if (openModalSignal !== lastSignalRef.current) {
      lastSignalRef.current = openModalSignal;
      openCreateModal();
    }
  }, [openModalSignal]);

  const openCreateModal = () => {
    setEditingExpense(null);
    setTitle('');
    setAmount('');
    setCategory('Food');
    setDate(todayIso);
    setPaymentMethod('UPI');
    setDescription('');
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditModal = (exp: ExpenseRecord) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setAmount(String(exp.amount));
    setCategory(exp.category);
    setDate(exp.date);
    setPaymentMethod(exp.payment_method);
    setDescription(exp.description || '');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const numericAmount = parseFloat(amount);

    if (!trimmedTitle) {
      setFormError('Please enter an expense title.');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError('Please enter a valid positive amount.');
      return;
    }
    if (!date) {
      setFormError('Please select a transaction date.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    const payload: ExpenseFormInput = {
      title: trimmedTitle,
      amount: Math.round(numericAmount * 100) / 100,
      category,
      date,
      payment_method: paymentMethod,
      description: description.trim(),
    };

    const ok = editingExpense
      ? await onUpdate(editingExpense.id, payload)
      : await onCreate(payload);
    setSubmitting(false);

    if (ok) {
      setIsFormOpen(false);
    }
  };

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((exp) => {
      if (
        q &&
        !exp.title.toLowerCase().includes(q) &&
        !(exp.description || '').toLowerCase().includes(q) &&
        !exp.payment_method.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (categoryFilter && exp.category !== categoryFilter) return false;
      if (startDate && exp.date < startDate) return false;
      if (endDate && exp.date > endDate) return false;
      return true;
    });
  }, [expenses, search, categoryFilter, startDate, endDate]);

  const filteredTotal = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  const hasActiveFilters = Boolean(search || categoryFilter || startDate || endDate);

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Expense Records</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing <span className="font-mono tabular-nums font-medium text-slate-700">{filteredExpenses.length}</span>{' '}
            transactions · Filtered Total:{' '}
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {formatCurrency(filteredTotal)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-4">
            <label htmlFor="exp-search" className="block text-xs font-medium text-slate-600 mb-1">
              Search
            </label>
            <div className="relative">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="exp-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title, description, payment..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="exp-cat-filter" className="block text-xs font-medium text-slate-600 mb-1">
              Category
            </label>
            <select
              id="exp-cat-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="exp-from" className="block text-xs font-medium text-slate-600 mb-1">
              From Date
            </label>
            <input
              id="exp-from"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="exp-to" className="block text-xs font-medium text-slate-600 mb-1">
              To Date
            </label>
            <input
              id="exp-to"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="lg:col-span-1">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="w-full inline-flex items-center justify-center gap-1 py-2 px-2.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Reset filters"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Expense Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <p className="text-sm font-medium text-slate-900">No matching expense records found.</p>
            <p className="text-xs text-slate-500 mt-1">
              {hasActiveFilters
                ? 'Try clearing your search query or date filters.'
                : 'Add your first expense to start tracking spending.'}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
              <button
                type="button"
                onClick={openCreateModal}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Add Expense
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-2.5 pl-5 pr-3 font-medium">Date</th>
                  <th className="py-2.5 px-3 font-medium">Title</th>
                  <th className="py-2.5 px-3 font-medium">Category</th>
                  <th className="py-2.5 px-3 font-medium">Payment Method</th>
                  <th className="py-2.5 px-3 font-medium">Description</th>
                  <th className="py-2.5 px-3 font-medium text-right">Amount</th>
                  <th className="py-2.5 pl-3 pr-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pl-5 pr-3 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">
                      {exp.title}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-700 whitespace-nowrap">
                      {exp.category}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">
                      {exp.payment_method}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500 max-w-[240px] truncate">
                      {exp.description || '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-xs font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                      {confirmDeleteId === exp.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={async () => {
                              await onDelete(exp.id);
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
                            onClick={() => openEditModal(exp)}
                            aria-label={`Edit ${exp.title}`}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(exp.id)}
                            aria-label={`Delete ${exp.title}`}
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

      {/* Add / Edit Expense Modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="expense-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 id="expense-modal-title" className="text-base font-semibold text-slate-900">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="f-title" className="block text-xs font-medium text-slate-700 mb-1">
                    Expense Title *
                  </label>
                  <input
                    id="f-title"
                    type="text"
                    required
                    maxLength={120}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Supermarket Groceries"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="f-amount" className="block text-xs font-medium text-slate-700 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    id="f-amount"
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="f-cat" className="block text-xs font-medium text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    id="f-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="f-date" className="block text-xs font-medium text-slate-700 mb-1">
                    Date *
                  </label>
                  <input
                    id="f-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="f-pm" className="block text-xs font-medium text-slate-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    id="f-pm"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="f-desc" className="block text-xs font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  id="f-desc"
                  rows={2}
                  maxLength={300}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional note or merchant detail..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {submitting
                    ? 'Saving...'
                    : editingExpense
                      ? 'Update Expense'
                      : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
