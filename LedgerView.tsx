import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  ClientOrder,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  Transaction,
  TransactionType,
} from '../types/workshop';
import { exportToCsv, formatCurrency } from '../lib/format';

interface LedgerViewProps {
  currency: string;
  transactions: Transaction[];
  orders: ClientOrder[];
  onAddClick: (type?: TransactionType) => void;
  onEditClick: (tx: Transaction) => void;
  onDeleteClick: (tx: Transaction) => void;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  currency,
  transactions,
  onAddClick,
  onEditClick,
  onDeleteClick,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'Income' | 'Expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const allCategories = useMemo(() => {
    const set = new Set<string>([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]);
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...transactions]
      .filter((tx) => {
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
        if (dateFrom && tx.date < dateFrom) return false;
        if (dateTo && tx.date > dateTo) return false;
        if (q) {
          const hay = `${tx.id} ${tx.description} ${tx.category} ${tx.clientOrVendor} ${tx.orderRef} ${tx.notes}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.rowIndex - a.rowIndex);
  }, [transactions, typeFilter, categoryFilter, dateFrom, dateTo, search]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filtered) {
      if (tx.type === 'Income') income += tx.amount;
      else expense += tx.amount;
    }
    return { income, expense, net: income - expense };
  }, [filtered]);

  const handleExport = () => {
    exportToCsv(
      `workshop-ledger-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'ID',
        'Date',
        'Type',
        'Category',
        'Description',
        'ClientOrVendor',
        'OrderRef',
        'Amount',
        'PaymentMethod',
        'Notes',
      ],
      filtered.map((t) => [
        t.id,
        t.date,
        t.type,
        t.category,
        t.description,
        t.clientOrVendor,
        t.orderRef,
        t.amount,
        t.paymentMethod,
        t.notes,
      ])
    );
  };

  return (
    <div className="space-y-5">
      {/* Header Controls */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div
          className="inline-flex items-center gap-1 rounded-lg border border-[#193055] bg-[#091428] p-1 self-start"
          role="group"
          aria-label="Transaction type filter"
        >
          {(['all', 'Income', 'Expense'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTypeFilter(tab)}
              className={`min-h-[34px] rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                typeFilter === tab
                  ? 'bg-[#1D4ED8] text-white'
                  : 'text-[#8FA8CC] hover:text-white'
              }`}
            >
              {tab === 'all' ? 'All Entries' : tab === 'Income' ? 'Income' : 'Expenses'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[#1E3A66] bg-[#0B172C] px-3.5 py-2 text-xs font-medium text-[#C5D5EC] transition-colors hover:bg-[#132544] hover:text-white disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => onAddClick('Income')}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#193055] bg-[#0B172C] p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6B87B0]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, client, order..."
            aria-label="Search ledger transactions"
            className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] pr-3 pl-9 text-xs text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-xs text-white focus:border-[#3B82F6] focus:outline-none"
        >
          <option value="all">All Categories</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label="From date"
          className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-xs text-white focus:border-[#3B82F6] focus:outline-none"
        />

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="To date"
            className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-xs text-white focus:border-[#3B82F6] focus:outline-none"
          />
          {(search || categoryFilter !== 'all' || dateFrom || dateTo || typeFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
                setDateFrom('');
                setDateTo('');
                setTypeFilter('all');
              }}
              className="min-h-[40px] rounded-lg border border-[#1E3A66] px-3 text-xs text-[#9DB4D4] hover:text-white whitespace-nowrap shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Filtered Summary Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border border-[#193055] bg-[#0B172C] px-4 py-3">
          <span className="text-xs text-[#8DA6CA]">Filtered Income</span>
          <span className="font-mono text-sm font-semibold text-emerald-400 tabular-nums">
            +{formatCurrency(totals.income, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[#193055] bg-[#0B172C] px-4 py-3">
          <span className="text-xs text-[#8DA6CA]">Filtered Expenses</span>
          <span className="font-mono text-sm font-semibold text-red-400 tabular-nums">
            -{formatCurrency(totals.expense, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[#193055] bg-[#0B172C] px-4 py-3">
          <span className="text-xs text-[#8DA6CA]">Net Cashflow</span>
          <span
            className={`font-mono text-sm font-semibold tabular-nums ${
              totals.net >= 0 ? 'text-white' : 'text-red-300'
            }`}
          >
            {formatCurrency(totals.net, currency)}
          </span>
        </div>
      </div>

      {/* Data Table (Desktop) / Stacked Cards (Mobile) */}
      <section className="overflow-hidden rounded-xl border border-[#193055] bg-[#0B172C]">
        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-white">No ledger entries match your filters</p>
            <p className="mt-1 text-xs text-[#8DA6CA]">
              Record job payments, raw material purchases, welding gas refills, or shop bills.
            </p>
            <button
              type="button"
              onClick={() => onAddClick('Income')}
              className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Log First Transaction</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#162949] bg-[#081224] text-[#8DA6CA]">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Description &amp; Category</th>
                    <th className="px-4 py-3 font-medium">Client / Vendor</th>
                    <th className="px-4 py-3 font-medium">Order Ref</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#152847]">
                  {filtered.map((tx) => (
                    <tr key={tx.id} className="transition-colors hover:bg-[#0F1E3A]">
                      <td className="px-4 py-3 font-mono text-[#B6C8E2] tabular-nums whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            tx.type === 'Income' ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {tx.type === 'Income' ? (
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          {tx.type}
                        </span>
                      </td>
                      <td className="max-w-[260px] px-4 py-3">
                        <p className="truncate font-medium text-white">
                          {tx.description || tx.category}
                        </p>
                        <p className="truncate text-[11px] text-[#7E97BC]">{tx.category}</p>
                      </td>
                      <td className="px-4 py-3 text-[#C5D5EC]">{tx.clientOrVendor || '—'}</td>
                      <td className="px-4 py-3 font-mono text-[#9DB4D4]">
                        {tx.orderRef || '—'}
                      </td>
                      <td className="px-4 py-3 text-[#9DB4D4] whitespace-nowrap">
                        {tx.paymentMethod}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${
                          tx.type === 'Income' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {tx.type === 'Income' ? '+' : '-'}
                        {formatCurrency(tx.amount, currency)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditClick(tx)}
                            aria-label={`Edit ${tx.description || tx.id}`}
                            className="rounded-md p-1.5 text-[#8FA8CC] transition-colors hover:bg-[#17305C] hover:text-white"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteClick(tx)}
                            aria-label={`Delete ${tx.description || tx.id}`}
                            className="rounded-md p-1.5 text-[#8FA8CC] transition-colors hover:bg-red-950/60 hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="divide-y divide-[#162949] md:hidden">
              {filtered.map((tx) => (
                <div key={tx.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">
                        {tx.description || tx.category}
                      </p>
                      <p className="mt-0.5 text-xs text-[#829BC0] tabular-nums">
                        {tx.date} · {tx.category}
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
                  <div className="flex items-center justify-between gap-2 pt-1 text-xs text-[#8DA6CA]">
                    <span className="truncate">
                      {tx.clientOrVendor || tx.paymentMethod}
                      {tx.orderRef ? ` · ${tx.orderRef}` : ''}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditClick(tx)}
                        className="min-h-[36px] rounded-md border border-[#1E3A66] px-2.5 py-1 text-xs text-[#C5D5EC]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteClick(tx)}
                        className="min-h-[36px] rounded-md border border-red-900/60 px-2.5 py-1 text-xs text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
