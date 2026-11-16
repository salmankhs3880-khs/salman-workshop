import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Package,
  Plus,
} from 'lucide-react';
import { ClientOrder, InventoryItem, Transaction } from '../types/workshop';
import { formatCurrency, formatNumber } from '../lib/format';

interface OverviewDashboardProps {
  currency: string;
  transactions: Transaction[];
  inventory: InventoryItem[];
  orders: ClientOrder[];
  onOpenNewTransaction: (defaultType: 'Income' | 'Expense') => void;
  onOpenNewOrder: () => void;
  onNavigateTab: (tab: 'overview' | 'ledger' | 'inventory' | 'orders' | 'settings') => void;
}

type DateScope = 'all' | 'month' | '30d' | 'year';

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  currency,
  transactions,
  inventory,
  orders,
  onOpenNewTransaction,
  onOpenNewOrder,
  onNavigateTab,
}) => {
  const [dateScope, setDateScope] = useState<DateScope>('all');
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return transactions.filter((tx) => {
      if (dateScope === 'all') return true;
      if (!tx.date) return false;
      const d = new Date(`${tx.date}T00:00:00`);
      if (Number.isNaN(d.getTime())) return false;
      if (dateScope === 'month') {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }
      if (dateScope === '30d') {
        return d >= thirtyDaysAgo;
      }
      if (dateScope === 'year') {
        return d.getFullYear() === currentYear;
      }
      return true;
    });
  }, [transactions, dateScope]);

  const metrics = useMemo(() => {
    let income = 0;
    let incomeCount = 0;
    let expense = 0;
    let expenseCount = 0;
    const expenseByCategory: Record<string, number> = {};

    for (const tx of filteredTransactions) {
      if (tx.type === 'Income') {
        income += tx.amount;
        incomeCount += 1;
      } else {
        expense += tx.amount;
        expenseCount += 1;
        const cat = tx.category || 'Other Expense';
        expenseByCategory[cat] = (expenseByCategory[cat] || 0) + tx.amount;
      }
    }

    const net = income - expense;
    const margin = income > 0 ? (net / income) * 100 : 0;

    const categoryBreakdown = Object.entries(expenseByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        share: expense > 0 ? (amount / expense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    const lowStockItems = inventory.filter((item) => item.quantity <= item.minThreshold);
    const activeOrders = orders.filter(
      (o) =>
        o.status === 'Pending Material' ||
        o.status === 'In Fabrication' ||
        o.status === 'Ready for Pickup'
    );
    const outstandingBalance = orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + Math.max(0, o.totalPrice - o.depositPaid), 0);

    const inventoryValue = inventory.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0
    );

    return {
      income,
      incomeCount,
      expense,
      expenseCount,
      net,
      margin,
      categoryBreakdown,
      lowStockItems,
      activeOrders,
      outstandingBalance,
      inventoryValue,
    };
  }, [filteredTransactions, inventory, orders]);

  // Monthly 6-month series (always based on all transactions so trend is meaningful)
  const monthlySeries = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; income: number; expense: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months.push({ key, label, income: 0, expense: 0 });
    }

    const map = new Map(months.map((item) => [item.key, item]));
    for (const tx of transactions) {
      if (!tx.date || tx.date.length < 7) continue;
      const key = tx.date.slice(0, 7);
      const bucket = map.get(key);
      if (bucket) {
        if (tx.type === 'Income') bucket.income += tx.amount;
        else bucket.expense += tx.amount;
      }
    }

    const maxVal = Math.max(
      1,
      ...months.map((m) => Math.max(m.income, m.expense))
    );

    return { months, maxVal };
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.rowIndex - a.rowIndex)
      .slice(0, 6);
  }, [filteredTransactions]);

  const urgentOrders = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled')
      .sort((a, b) => (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99'))
      .slice(0, 5);
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Toolbar: Date filter + Quick Log Actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div
          className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-[#193055] bg-[#091428] p-1"
          role="group"
          aria-label="Date range filter"
        >
          {(
            [
              { id: 'all', label: 'All Time' },
              { id: 'month', label: 'This Month' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'year', label: 'This Year' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDateScope(opt.id)}
              className={`min-h-[34px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                dateScope === opt.id
                  ? 'bg-[#1D4ED8] text-white'
                  : 'text-[#8FA8CC] hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenNewTransaction('Income')}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Log Income</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenNewTransaction('Expense')}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#234375] bg-[#0D1C36] px-3.5 py-2 text-xs font-semibold text-[#D6E4F8] transition-colors hover:bg-[#152B52] hover:text-white whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Log Expense</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewOrder}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#234375] bg-[#0D1C36] px-3.5 py-2 text-xs font-semibold text-[#D6E4F8] transition-colors hover:bg-[#152B52] hover:text-white whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* 4-Column KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[#193055] bg-[#0B172C] p-5">
          <div className="flex items-center justify-between text-xs text-[#8DA6CA]">
            <span>Total Income</span>
            <ArrowUpRight className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-white tabular-nums">
            {formatCurrency(metrics.income, currency)}
          </p>
          <p className="mt-1.5 text-xs text-[#7E97BC] tabular-nums">
            {metrics.incomeCount} income {metrics.incomeCount === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        <div className="rounded-xl border border-[#193055] bg-[#0B172C] p-5">
          <div className="flex items-center justify-between text-xs text-[#8DA6CA]">
            <span>Total Outcome &amp; Expenses</span>
            <ArrowDownRight className="h-4 w-4 text-red-400" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-white tabular-nums">
            {formatCurrency(metrics.expense, currency)}
          </p>
          <p className="mt-1.5 text-xs text-[#7E97BC] tabular-nums">
            {metrics.expenseCount} expense {metrics.expenseCount === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        <div className="rounded-xl border border-[#193055] bg-[#0B172C] p-5">
          <div className="flex items-center justify-between text-xs text-[#8DA6CA]">
            <span>Net Profit</span>
            <span
              className={`text-xs font-medium tabular-nums ${
                metrics.net >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {metrics.net >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>
          <p
            className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
              metrics.net >= 0 ? 'text-emerald-300' : 'text-red-300'
            }`}
          >
            {formatCurrency(metrics.net, currency)}
          </p>
          <p className="mt-1.5 text-xs text-[#7E97BC] tabular-nums">
            {metrics.margin.toFixed(1)}% operating margin
          </p>
        </div>

        <div className="rounded-xl border border-[#193055] bg-[#0B172C] p-5">
          <div className="flex items-center justify-between text-xs text-[#8DA6CA]">
            <span>Active Orders &amp; Stock</span>
            <Briefcase className="h-4 w-4 text-[#60A5FA]" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-white tabular-nums">
            {metrics.activeOrders.length} active
          </p>
          <p className="mt-1.5 text-xs text-[#7E97BC] tabular-nums">
            {formatCurrency(metrics.outstandingBalance, currency)} balance due ·{' '}
            <span
              className={
                metrics.lowStockItems.length > 0 ? 'text-amber-300 font-medium' : ''
              }
            >
              {metrics.lowStockItems.length} low stock
            </span>
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 6-Month Cashflow Chart */}
        <section className="rounded-xl border border-[#193055] bg-[#0B172C] p-5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#162949] pb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-white">
                6-Month Income vs. Expenses
              </h2>
              <p className="text-xs text-[#8DA6CA]">
                Monthly cashflow comparison across recorded ledger entries
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#B6C8E2]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#3B82F6]" aria-hidden="true" />
                Income
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#F87171]" aria-hidden="true" />
                Expenses
              </span>
            </div>
          </div>

          <div className="mt-5">
            {transactions.length === 0 ? (
              <div className="flex h-52 flex-col items-center justify-center text-center">
                <p className="text-sm text-[#9DB4D4]">No transactions recorded yet.</p>
                <button
                  type="button"
                  onClick={() => onOpenNewTransaction('Income')}
                  className="mt-3 rounded-lg bg-[#162E57] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#2563EB]"
                >
                  Log First Entry
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="grid h-52 grid-cols-6 items-end gap-2 sm:gap-4 pt-6 pb-2">
                  {monthlySeries.months.map((m, idx) => {
                    const incomePct = Math.round((m.income / monthlySeries.maxVal) * 100);
                    const expensePct = Math.round((m.expense / monthlySeries.maxVal) * 100);
                    const isHovered = hoveredMonthIdx === idx;
                    return (
                      <div
                        key={m.key}
                        onMouseEnter={() => setHoveredMonthIdx(idx)}
                        onMouseLeave={() => setHoveredMonthIdx(null)}
                        className="group relative flex h-full flex-col items-center justify-end"
                      >
                        {isHovered && (
                          <div className="pointer-events-none absolute -top-2 z-10 w-36 -translate-y-full rounded-lg border border-[#24457A] bg-[#060E1E] p-2 text-[11px] shadow-xl">
                            <p className="font-semibold text-white">{m.label}</p>
                            <p className="mt-0.5 flex justify-between text-blue-300 tabular-nums">
                              <span>In:</span>
                              <span>{formatCurrency(m.income, currency)}</span>
                            </p>
                            <p className="flex justify-between text-red-300 tabular-nums">
                              <span>Out:</span>
                              <span>{formatCurrency(m.expense, currency)}</span>
                            </p>
                          </div>
                        )}
                        <div className="flex h-36 w-full items-end justify-center gap-1 sm:gap-1.5">
                          <div
                            className="w-3 rounded-t-sm bg-[#3B82F6] transition-opacity group-hover:opacity-90 sm:w-4"
                            style={{ height: `${Math.max(m.income > 0 ? 6 : 2, incomePct)}%` }}
                            title={`${m.label} Income: ${formatCurrency(m.income, currency)}`}
                          />
                          <div
                            className="w-3 rounded-t-sm bg-[#F87171] transition-opacity group-hover:opacity-90 sm:w-4"
                            style={{ height: `${Math.max(m.expense > 0 ? 6 : 2, expensePct)}%` }}
                            title={`${m.label} Expenses: ${formatCurrency(m.expense, currency)}`}
                          />
                        </div>
                        <span className="mt-2 font-mono text-[11px] text-[#8BA3C7] whitespace-nowrap">
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Expense Breakdown */}
        <section className="rounded-xl border border-[#193055] bg-[#0B172C] p-5 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-[#162949] pb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-white">
                Top Workshop Expenses
              </h2>
              <p className="text-xs text-[#8DA6CA]">
                Where material and operating spend goes
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('ledger')}
              className="text-xs font-medium text-[#60A5FA] hover:text-white whitespace-nowrap shrink-0"
            >
              View Ledger
            </button>
          </div>

          <div className="mt-4 space-y-3.5">
            {metrics.categoryBreakdown.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#8DA6CA]">
                No expense entries recorded for this period.
              </div>
            ) : (
              metrics.categoryBreakdown.map((item) => (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-[#DCE7F7]">{item.category}</span>
                    <span className="font-mono text-[#B6C8E2] tabular-nums whitespace-nowrap shrink-0">
                      {formatCurrency(item.amount, currency)} ({item.share.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#071021]">
                    <div
                      className="h-full rounded-full bg-[#2563EB]"
                      style={{ width: `${Math.min(100, Math.max(4, item.share))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Bottom Split: Recent Transactions & Shop Floor Watchlist */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Recent Transactions */}
        <section className="rounded-xl border border-[#193055] bg-[#0B172C] lg:col-span-7">
          <div className="flex items-center justify-between gap-4 border-b border-[#162949] px-5 py-4">
            <h2 className="font-display text-base font-semibold text-white">
              Recent Income &amp; Expenses
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab('ledger')}
              className="text-xs font-medium text-[#60A5FA] hover:text-white whitespace-nowrap shrink-0"
            >
              Open Full Ledger
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-[#8DA6CA]">
              No entries yet. Use Log Income or Log Expense to record your first transaction.
            </div>
          ) : (
            <div className="divide-y divide-[#162949]">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-4 px-5 py-3 text-sm transition-colors hover:bg-[#0F1E3A]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {tx.description || tx.category}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[#829BC0] tabular-nums">
                      {tx.date} · {tx.category}
                      {tx.clientOrVendor ? ` · ${tx.clientOrVendor}` : ''}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-sm font-semibold tabular-nums whitespace-nowrap shrink-0 ${
                      tx.type === 'Income' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {tx.type === 'Income' ? '+' : '-'}
                    {formatCurrency(tx.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Shop Floor Alerts: Low Stock + Active Orders */}
        <section className="rounded-xl border border-[#193055] bg-[#0B172C] lg:col-span-5">
          <div className="flex items-center justify-between gap-4 border-b border-[#162949] px-5 py-4">
            <h2 className="font-display text-base font-semibold text-white">
              Shop Floor Priorities
            </h2>
            <span className="font-mono text-xs text-[#8DA6CA] tabular-nums">
              Stock Value: {formatCurrency(metrics.inventoryValue, currency)}
            </span>
          </div>

          <div className="divide-y divide-[#162949]">
            {/* Low Stock Alerts */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C5D5EC]">
                  <Package className="h-3.5 w-3.5 text-[#60A5FA]" aria-hidden="true" />
                  Low Stock Materials
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('inventory')}
                  className="text-xs font-medium text-[#60A5FA] hover:text-white"
                >
                  Manage Stock
                </button>
              </div>
              {metrics.lowStockItems.length === 0 ? (
                <p className="mt-2 text-xs text-[#7E97BC]">
                  All tracked steel, gas, and consumables are above minimum thresholds.
                </p>
              ) : (
                <ul className="mt-2.5 space-y-2">
                  {metrics.lowStockItems.slice(0, 4).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="inline-flex items-center gap-1.5 truncate text-amber-300">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.materialName}</span>
                      </span>
                      <span className="font-mono text-[#D6E4F8] tabular-nums whitespace-nowrap shrink-0">
                        {formatNumber(item.quantity)} / {formatNumber(item.minThreshold)}{' '}
                        {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Upcoming Fabrication Orders */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C5D5EC]">
                  <Briefcase className="h-3.5 w-3.5 text-[#60A5FA]" aria-hidden="true" />
                  Open Client Orders
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('orders')}
                  className="text-xs font-medium text-[#60A5FA] hover:text-white"
                >
                  All Orders
                </button>
              </div>
              {urgentOrders.length === 0 ? (
                <p className="mt-2 text-xs text-[#7E97BC]">
                  No pending client fabrication orders right now.
                </p>
              ) : (
                <ul className="mt-2.5 space-y-2">
                  {urgentOrders.map((ord) => (
                    <li
                      key={ord.id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">
                          {ord.orderNumber} · {ord.projectTitle}
                        </p>
                        <p className="truncate text-[#829BC0]">
                          {ord.clientName} · {ord.status}
                        </p>
                      </div>
                      <span className="font-mono text-[#B6C8E2] tabular-nums whitespace-nowrap shrink-0">
                        Due {ord.dueDate || 'TBD'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
