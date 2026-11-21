export const EXPENSE_CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Education',
  'Entertainment',
  'Healthcare',
  'Others',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAYMENT_METHODS = [
  'UPI',
  'Debit Card',
  'Credit Card',
  'Cash',
  'Net Banking',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const BILLING_CYCLES = ['Monthly', 'Quarterly', 'Yearly'] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const SUBSCRIPTION_STATUSES = ['Active', 'Cancelled'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export type FinancePage = 'dashboard' | 'expenses' | 'subscriptions' | 'budget' | 'reports';

export interface ExpenseRecord {
  id: number;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  payment_method: PaymentMethod;
  description: string;
}

export interface SubscriptionRecord {
  id: number;
  name: string;
  amount: number;
  category: ExpenseCategory;
  billing_cycle: BillingCycle;
  start_date: string;
  next_payment_date: string;
  status: SubscriptionStatus;
  monthly_equivalent: number;
}

export interface DashboardSnapshot {
  month: number;
  year: number;
  monthlyExpenses: number;
  monthlySubscriptionCost: number;
  totalMonthlySpending: number;
  budgetLimit: number;
  remainingBudget: number;
  usagePercent: number;
  txCount: number;
  activeSubscriptionCount: number;
  recentExpenses: ExpenseRecord[];
  upcomingSubscriptions: SubscriptionRecord[];
  categoryBreakdown: { category: string; total: number }[];
  monthlyTotals: { monthKey: string; total: number }[];
  dailyTrends: { date: string; total: number }[];
}

export function formatCurrency(value: number): string {
  const abs = Math.abs(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value < 0 ? `-₹${abs}` : `₹${abs}`;
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
