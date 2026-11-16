import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Hammer,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { ClientOrder, ORDER_STATUSES, OrderStatus } from '../types/workshop';
import { exportToCsv, formatCurrency } from '../lib/format';

interface OrdersViewProps {
  currency: string;
  orders: ClientOrder[];
  onAddClick: () => void;
  onEditClick: (order: ClientOrder) => void;
  onDeleteClick: (order: ClientOrder) => void;
  onQuickStatusChange: (order: ClientOrder, newStatus: OrderStatus) => void;
  onRecordPayment: (order: ClientOrder) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  currency,
  orders,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onQuickStatusChange,
  onRecordPayment,
}) => {
  const [statusGroup, setStatusGroup] = useState<'all' | 'active' | 'quoted' | 'completed'>(
    'all'
  );
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...orders]
      .filter((ord) => {
        if (statusGroup === 'active') {
          if (
            ord.status !== 'Pending Material' &&
            ord.status !== 'In Fabrication' &&
            ord.status !== 'Ready for Pickup'
          ) {
            return false;
          }
        } else if (statusGroup === 'quoted' && ord.status !== 'Quoted') {
          return false;
        } else if (statusGroup === 'completed' && ord.status !== 'Completed') {
          return false;
        }

        if (q) {
          const hay = `${ord.orderNumber} ${ord.clientName} ${ord.clientPhone} ${ord.projectTitle} ${ord.materialSpec}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (b.orderDate || '').localeCompare(a.orderDate || '') || b.rowIndex - a.rowIndex);
  }, [orders, statusGroup, search]);

  const summary = useMemo(() => {
    const nonCancelled = orders.filter((o) => o.status !== 'Cancelled');
    const totalValue = nonCancelled.reduce((s, o) => s + o.totalPrice, 0);
    const totalCollected = nonCancelled.reduce((s, o) => s + o.depositPaid, 0);
    const totalBalance = nonCancelled.reduce(
      (s, o) => s + Math.max(0, o.totalPrice - o.depositPaid),
      0
    );
    const activeCount = orders.filter(
      (o) =>
        o.status === 'Pending Material' ||
        o.status === 'In Fabrication' ||
        o.status === 'Ready for Pickup'
    ).length;

    return { totalValue, totalCollected, totalBalance, activeCount };
  }, [orders]);

  const handleExport = () => {
    exportToCsv(
      `workshop-orders-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'ID',
        'OrderNumber',
        'ClientName',
        'ClientPhone',
        'ProjectTitle',
        'MaterialSpec',
        'OrderDate',
        'DueDate',
        'TotalPrice',
        'DepositPaid',
        'BalanceDue',
        'Status',
        'Notes',
      ],
      filtered.map((o) => [
        o.id,
        o.orderNumber,
        o.clientName,
        o.clientPhone,
        o.projectTitle,
        o.materialSpec,
        o.orderDate,
        o.dueDate,
        o.totalPrice,
        o.depositPaid,
        Math.max(0, o.totalPrice - o.depositPaid),
        o.status,
        o.notes,
      ])
    );
  };

  const renderStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />;
      case 'In Fabrication':
        return <Hammer className="h-3.5 w-3.5 text-[#60A5FA] shrink-0" aria-hidden="true" />;
      case 'Ready for Pickup':
        return <CheckCircle2 className="h-3.5 w-3.5 text-sky-300 shrink-0" aria-hidden="true" />;
      case 'Pending Material':
      case 'Quoted':
        return <Clock className="h-3.5 w-3.5 text-amber-300 shrink-0" aria-hidden="true" />;
      case 'Cancelled':
        return <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" aria-hidden="true" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Summary Strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-[#193055] bg-[#0B172C] p-4">
          <p className="text-xs text-[#8DA6CA]">Active Jobs</p>
          <p className="mt-1 font-mono text-xl font-semibold text-white tabular-nums">
            {summary.activeCount}
          </p>
        </div>
        <div className="rounded-xl border border-[#193055] bg-[#0B172C] p-4">
          <p className="text-xs text-[#8DA6CA]">Total Order Book</p>
          <p className="mt-1 font-mono text-xl font-semibold text-white tabular-nums">
            {formatCurrency(summary.totalValue, currency)}
          </p>
        </div>
        <div className="rounded-xl border border-[#193055] bg-[#0B172C] p-4">
          <p className="text-xs text-[#8DA6CA]">Deposits Collected</p>
          <p className="mt-1 font-mono text-xl font-semibold text-emerald-400 tabular-nums">
            {formatCurrency(summary.totalCollected, currency)}
          </p>
        </div>
        <div className="rounded-xl border border-[#193055] bg-[#0B172C] p-4">
          <p className="text-xs text-[#8DA6CA]">Balance Receivable</p>
          <p className="mt-1 font-mono text-xl font-semibold text-amber-300 tabular-nums">
            {formatCurrency(summary.totalBalance, currency)}
          </p>
        </div>
      </div>

      {/* Filter & Actions */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div
          className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-[#193055] bg-[#091428] p-1 self-start"
          role="group"
          aria-label="Order status filter"
        >
          {(
            [
              { id: 'all', label: 'All Orders' },
              { id: 'active', label: 'In Progress' },
              { id: 'quoted', label: 'Quoted' },
              { id: 'completed', label: 'Completed' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusGroup(tab.id)}
              className={`min-h-[34px] rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                statusGroup === tab.id
                  ? 'bg-[#1D4ED8] text-white'
                  : 'text-[#8FA8CC] hover:text-white'
              }`}
            >
              {tab.label}
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
            onClick={onAddClick}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>New Client Order</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-xl border border-[#193055] bg-[#0B172C] p-4">
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6B87B0]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, client name, phone, or project..."
            aria-label="Search client orders"
            className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] pr-3 pl-9 text-xs text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
          />
        </div>
      </div>

      {/* Table / Cards */}
      <section className="overflow-hidden rounded-xl border border-[#193055] bg-[#0B172C]">
        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-white">No client orders found</p>
            <p className="mt-1 text-xs text-[#8DA6CA]">
              Create your first fabrication job order to track client quotes, deposits, and due
              dates.
            </p>
            <button
              type="button"
              onClick={onAddClick}
              className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Create Client Order</span>
            </button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#162949] bg-[#081224] text-[#8DA6CA]">
                    <th className="px-4 py-3 font-medium">Order #</th>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Project &amp; Spec</th>
                    <th className="px-4 py-3 font-medium">Due Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-right font-medium">Balance Due</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#152847]">
                  {filtered.map((ord) => {
                    const balance = Math.max(0, ord.totalPrice - ord.depositPaid);
                    return (
                      <tr key={ord.id} className="transition-colors hover:bg-[#0F1E3A]">
                        <td className="px-4 py-3 font-mono font-semibold text-[#60A5FA] whitespace-nowrap">
                          {ord.orderNumber}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{ord.clientName}</p>
                          <p className="font-mono text-[11px] text-[#7E97BC]">
                            {ord.clientPhone || 'No phone'}
                          </p>
                        </td>
                        <td className="max-w-[260px] px-4 py-3">
                          <p className="truncate font-medium text-white">{ord.projectTitle}</p>
                          <p className="truncate text-[11px] text-[#7E97BC]">
                            {ord.materialSpec || 'Custom spec'}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono text-[#B6C8E2] tabular-nums whitespace-nowrap">
                          {ord.dueDate || 'TBD'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {renderStatusIcon(ord.status)}
                            <select
                              value={ord.status}
                              onChange={(e) =>
                                onQuickStatusChange(ord, e.target.value as OrderStatus)
                              }
                              aria-label={`Change status for order ${ord.orderNumber}`}
                              className="rounded-md border border-[#1E3A66] bg-[#060E1E] px-2 py-1 text-xs text-white focus:border-[#3B82F6] focus:outline-none"
                            >
                              {ORDER_STATUSES.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-white tabular-nums whitespace-nowrap">
                          {formatCurrency(ord.totalPrice, currency)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-semibold tabular-nums whitespace-nowrap ${
                            balance > 0 ? 'text-amber-300' : 'text-emerald-400'
                          }`}
                        >
                          {formatCurrency(balance, currency)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {balance > 0 && ord.status !== 'Cancelled' && (
                              <button
                                type="button"
                                onClick={() => onRecordPayment(ord)}
                                title="Log client payment to Income ledger"
                                className="inline-flex items-center gap-1 rounded-md border border-[#234375] bg-[#102242] px-2.5 py-1 text-[11px] font-medium text-[#93C5FD] transition-colors hover:bg-[#1D4ED8] hover:text-white"
                              >
                                <DollarSign className="h-3 w-3" aria-hidden="true" />
                                <span>Pay</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onEditClick(ord)}
                              aria-label={`Edit order ${ord.orderNumber}`}
                              className="rounded-md p-1.5 text-[#8FA8CC] hover:bg-[#17305C] hover:text-white"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteClick(ord)}
                              aria-label={`Delete order ${ord.orderNumber}`}
                              className="rounded-md p-1.5 text-[#8FA8CC] hover:bg-red-950/60 hover:text-red-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Cards */}
            <div className="divide-y divide-[#162949] lg:hidden">
              {filtered.map((ord) => {
                const balance = Math.max(0, ord.totalPrice - ord.depositPaid);
                return (
                  <div key={ord.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-semibold text-[#60A5FA]">
                          {ord.orderNumber} · Due {ord.dueDate || 'TBD'}
                        </p>
                        <p className="mt-0.5 font-medium text-white truncate">
                          {ord.projectTitle}
                        </p>
                        <p className="text-xs text-[#829BC0] truncate">
                          {ord.clientName}
                          {ord.clientPhone ? ` · ${ord.clientPhone}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-sm font-semibold text-white tabular-nums">
                          {formatCurrency(ord.totalPrice, currency)}
                        </p>
                        <p
                          className={`font-mono text-xs tabular-nums ${
                            balance > 0 ? 'text-amber-300' : 'text-emerald-400'
                          }`}
                        >
                          Bal {formatCurrency(balance, currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="inline-flex items-center gap-1.5">
                        {renderStatusIcon(ord.status)}
                        <select
                          value={ord.status}
                          onChange={(e) =>
                            onQuickStatusChange(ord, e.target.value as OrderStatus)
                          }
                          aria-label={`Change status for order ${ord.orderNumber}`}
                          className="min-h-[36px] rounded-md border border-[#1E3A66] bg-[#060E1E] px-2.5 text-xs text-white"
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        {balance > 0 && ord.status !== 'Cancelled' && (
                          <button
                            type="button"
                            onClick={() => onRecordPayment(ord)}
                            className="min-h-[36px] rounded-md bg-[#162E57] px-3 text-xs font-medium text-[#93C5FD]"
                          >
                            Log Payment
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditClick(ord)}
                          className="min-h-[36px] rounded-md border border-[#1E3A66] px-2.5 text-xs text-[#C5D5EC]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteClick(ord)}
                          className="min-h-[36px] rounded-md border border-red-900/60 px-2.5 text-xs text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
