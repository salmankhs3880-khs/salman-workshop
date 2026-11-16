import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { INVENTORY_CATEGORIES, InventoryItem } from '../types/workshop';
import { exportToCsv, formatCurrency, formatNumber } from '../lib/format';

interface InventoryViewProps {
  currency: string;
  inventory: InventoryItem[];
  onAddClick: () => void;
  onEditClick: (item: InventoryItem) => void;
  onDeleteClick: (item: InventoryItem) => void;
  onAdjustQuantity: (item: InventoryItem, delta: number) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  currency,
  inventory,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onAdjustQuantity,
}) => {
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'healthy'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventory.filter((item) => {
      const isLow = item.quantity <= item.minThreshold;
      if (stockFilter === 'low' && !isLow) return false;
      if (stockFilter === 'healthy' && isLow) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (q) {
        const hay = `${item.sku} ${item.materialName} ${item.category} ${item.specification} ${item.supplier}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [inventory, stockFilter, categoryFilter, search]);

  const stats = useMemo(() => {
    let totalValue = 0;
    let lowCount = 0;
    let outCount = 0;
    for (const item of inventory) {
      totalValue += item.quantity * item.unitCost;
      if (item.quantity <= 0) outCount += 1;
      else if (item.quantity <= item.minThreshold) lowCount += 1;
    }
    return { totalSkus: inventory.length, totalValue, lowCount, outCount };
  }, [inventory]);

  const handleExport = () => {
    exportToCsv(
      `workshop-inventory-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'ID',
        'SKU',
        'MaterialName',
        'Category',
        'Specification',
        'Quantity',
        'Unit',
        'MinThreshold',
        'UnitCost',
        'Supplier',
        'LastUpdated',
      ],
      filtered.map((i) => [
        i.id,
        i.sku,
        i.materialName,
        i.category,
        i.specification,
        i.quantity,
        i.unit,
        i.minThreshold,
        i.unitCost,
        i.supplier,
        i.lastUpdated,
      ])
    );
  };

  const renderStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-red-400 whitespace-nowrap">
          <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Out of Stock
        </span>
      );
    }
    if (item.quantity <= item.minThreshold) {
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-amber-300 whitespace-nowrap">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400 whitespace-nowrap">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        In Stock
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Summary Strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-[#193055] bg-[#0B172C] p-4">
          <p className="text-xs text-[#8DA6CA]">Tracked Materials</p>
          <p className="mt-1 font-mono text-xl font-semibold text-white tabular-nums">
            {stats.totalSkus}
          </p>
        </div>
        <div className="rounded-xl border border-[#193055] bg-[#0B172C] p-4">
          <p className="text-xs text-[#8DA6CA]">Stock Valuation</p>
          <p className="mt-1 font-mono text-xl font-semibold text-white tabular-nums">
            {formatCurrency(stats.totalValue, currency)}
          </p>
        </div>
        <div className="rounded-xl border border-[#193055] bg-[#0B172C] p-4">
          <p className="text-xs text-[#8DA6CA]">Low Stock Alerts</p>
          <p
            className={`mt-1 font-mono text-xl font-semibold tabular-nums ${
              stats.lowCount > 0 ? 'text-amber-300' : 'text-white'
            }`}
          >
            {stats.lowCount}
          </p>
        </div>
        <div className="rounded-xl border border-[#193055] bg-[#0B172C] p-4">
          <p className="text-xs text-[#8DA6CA]">Out of Stock</p>
          <p
            className={`mt-1 font-mono text-xl font-semibold tabular-nums ${
              stats.outCount > 0 ? 'text-red-400' : 'text-white'
            }`}
          >
            {stats.outCount}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div
          className="inline-flex items-center gap-1 rounded-lg border border-[#193055] bg-[#091428] p-1 self-start"
          role="group"
          aria-label="Stock level filter"
        >
          {(
            [
              { id: 'all', label: 'All Stock' },
              { id: 'low', label: 'Needs Reorder' },
              { id: 'healthy', label: 'In Stock' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStockFilter(tab.id)}
              className={`min-h-[34px] rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                stockFilter === tab.id
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
            <span>Add Material</span>
          </button>
        </div>
      </div>

      {/* Search + Category */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#193055] bg-[#0B172C] p-4 sm:grid-cols-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6B87B0]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search material, SKU, gauge, supplier..."
            aria-label="Search inventory"
            className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] pr-3 pl-9 text-xs text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by inventory category"
          className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-xs text-white focus:border-[#3B82F6] focus:outline-none"
        >
          <option value="all">All Material Categories</option>
          {INVENTORY_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Table / Cards */}
      <section className="overflow-hidden rounded-xl border border-[#193055] bg-[#0B172C]">
        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-white">No inventory items found</p>
            <p className="mt-1 text-xs text-[#8DA6CA]">
              Add steel sheets, square tubing, welding wire, shielding gas, or abrasives to track
              stock levels.
            </p>
            <button
              type="button"
              onClick={onAddClick}
              className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add First Material</span>
            </button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#162949] bg-[#081224] text-[#8DA6CA]">
                    <th className="px-4 py-3 font-medium">SKU</th>
                    <th className="px-4 py-3 font-medium">Material &amp; Spec</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">On Hand</th>
                    <th className="px-4 py-3 text-right font-medium">Min Alert</th>
                    <th className="px-4 py-3 text-right font-medium">Unit Cost</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#152847]">
                  {filtered.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-[#0F1E3A]">
                      <td className="px-4 py-3 font-mono text-[#9DB4D4] whitespace-nowrap">
                        {item.sku || item.id}
                      </td>
                      <td className="max-w-[260px] px-4 py-3">
                        <p className="truncate font-medium text-white">{item.materialName}</p>
                        <p className="truncate text-[11px] text-[#7E97BC]">
                          {item.specification || 'Standard'}
                          {item.supplier ? ` · ${item.supplier}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[#C5D5EC]">{item.category}</td>
                      <td className="px-4 py-3">{renderStatus(item)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-white tabular-nums whitespace-nowrap">
                        {formatNumber(item.quantity)} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#8DA6CA] tabular-nums whitespace-nowrap">
                        {formatNumber(item.minThreshold)} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#D6E4F8] tabular-nums whitespace-nowrap">
                        {formatCurrency(item.unitCost, currency)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onAdjustQuantity(item, -1)}
                            disabled={item.quantity <= 0}
                            title="Use 1 unit"
                            aria-label={`Decrease ${item.materialName} quantity by 1`}
                            className="rounded-md border border-[#1E3A66] p-1.5 text-[#C5D5EC] hover:bg-[#17305C] hover:text-white disabled:opacity-40"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onAdjustQuantity(item, 1)}
                            title="Restock 1 unit"
                            aria-label={`Increase ${item.materialName} quantity by 1`}
                            className="rounded-md border border-[#1E3A66] p-1.5 text-[#C5D5EC] hover:bg-[#17305C] hover:text-white"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditClick(item)}
                            aria-label={`Edit ${item.materialName}`}
                            className="ml-1 rounded-md p-1.5 text-[#8FA8CC] hover:bg-[#17305C] hover:text-white"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteClick(item)}
                            aria-label={`Delete ${item.materialName}`}
                            className="rounded-md p-1.5 text-[#8FA8CC] hover:bg-red-950/60 hover:text-red-300"
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

            {/* Mobile Cards */}
            <div className="divide-y divide-[#162949] md:hidden">
              {filtered.map((item) => (
                <div key={item.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{item.materialName}</p>
                      <p className="mt-0.5 text-xs text-[#829BC0]">
                        {item.sku || item.id} · {item.specification || item.category}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm font-semibold text-white tabular-nums">
                        {formatNumber(item.quantity)} {item.unit}
                      </p>
                      <p className="font-mono text-[11px] text-[#7E97BC] tabular-nums">
                        Min {formatNumber(item.minThreshold)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    {renderStatus(item)}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onAdjustQuantity(item, -1)}
                        disabled={item.quantity <= 0}
                        className="min-h-[36px] min-w-[36px] rounded-md border border-[#1E3A66] px-2.5 text-[#C5D5EC] disabled:opacity-40"
                        aria-label={`Decrease ${item.materialName}`}
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => onAdjustQuantity(item, 1)}
                        className="min-h-[36px] min-w-[36px] rounded-md border border-[#1E3A66] px-2.5 text-[#C5D5EC]"
                        aria-label={`Increase ${item.materialName}`}
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditClick(item)}
                        className="min-h-[36px] rounded-md border border-[#1E3A66] px-2.5 text-[#C5D5EC]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteClick(item)}
                        className="min-h-[36px] rounded-md border border-red-900/60 px-2.5 text-red-300"
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
