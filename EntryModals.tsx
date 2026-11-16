import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  ClientOrder,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  INVENTORY_CATEGORIES,
  INVENTORY_UNITS,
  InventoryItem,
  ORDER_STATUSES,
  OrderStatus,
  PAYMENT_METHODS,
  Transaction,
  TransactionType,
} from '../types/workshop';
import { generateId, getTodayISO } from '../lib/format';

/* ======================== TRANSACTION MODAL ======================== */
interface TransactionModalProps {
  open: boolean;
  initialTx: Transaction | null;
  defaultType: TransactionType;
  prefillOrder?: ClientOrder | null;
  orders: ClientOrder[];
  onClose: () => void;
  onSubmit: (data: Omit<Transaction, 'rowIndex'>, existingRowIndex?: number) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  open,
  initialTx,
  defaultType,
  prefillOrder,
  orders,
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [date, setDate] = useState(getTodayISO());
  const [category, setCategory] = useState<string>(INCOME_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [clientOrVendor, setClientOrVendor] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initialTx) {
      setType(initialTx.type);
      setDate(initialTx.date || getTodayISO());
      setCategory(initialTx.category);
      setDescription(initialTx.description);
      setClientOrVendor(initialTx.clientOrVendor);
      setOrderRef(initialTx.orderRef);
      setAmount(String(initialTx.amount));
      setPaymentMethod(initialTx.paymentMethod || PAYMENT_METHODS[0]);
      setNotes(initialTx.notes);
    } else if (prefillOrder) {
      const remaining = Math.max(0, prefillOrder.totalPrice - prefillOrder.depositPaid);
      setType('Income');
      setDate(getTodayISO());
      setCategory(prefillOrder.depositPaid > 0 ? 'Final Order Payment' : 'Client Deposit');
      setDescription(`Payment for ${prefillOrder.projectTitle}`);
      setClientOrVendor(prefillOrder.clientName);
      setOrderRef(prefillOrder.orderNumber);
      setAmount(remaining > 0 ? String(remaining) : '');
      setPaymentMethod(PAYMENT_METHODS[0]);
      setNotes('');
    } else {
      setType(defaultType);
      setDate(getTodayISO());
      setCategory(
        defaultType === 'Income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
      );
      setDescription('');
      setClientOrVendor('');
      setOrderRef('');
      setAmount('');
      setPaymentMethod(PAYMENT_METHODS[0]);
      setNotes('');
    }
  }, [open, initialTx, defaultType, prefillOrder]);

  if (!open) return null;

  const categories = type === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeSwitch = (nextType: TransactionType) => {
    setType(nextType);
    const list = nextType === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!(list as readonly string[]).includes(category)) {
      setCategory(list[0]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;

    onSubmit(
      {
        id: initialTx?.id || generateId('TX'),
        date,
        type,
        category,
        description: description.trim(),
        clientOrVendor: clientOrVendor.trim(),
        orderRef: orderRef.trim(),
        amount: numericAmount,
        paymentMethod,
        notes: notes.trim(),
      },
      initialTx?.rowIndex
    );
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#030712]/80 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <form
        onSubmit={handleFormSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#1E3A66] bg-[#0B172C] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#162949] px-6 py-4">
          <h3 id="tx-modal-title" className="font-display text-base font-semibold text-white">
            {initialTx ? 'Edit Ledger Entry' : 'New Income / Expense Entry'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8FA8CC] hover:bg-[#132544] hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5 text-xs">
          {/* Type Switch */}
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#193055] bg-[#060E1E] p-1">
            {(['Income', 'Expense'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeSwitch(t)}
                className={`min-h-[38px] rounded-md font-semibold transition-colors ${
                  type === t
                    ? t === 'Income'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-red-600 text-white'
                    : 'text-[#8DA6CA] hover:text-white'
                }`}
              >
                {t === 'Income' ? 'Income (Inflow)' : 'Expense (Outcome)'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tx-date" className="mb-1.5 block font-medium text-[#B8CAE4]">
                Date
              </label>
              <input
                id="tx-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="tx-amount" className="mb-1.5 block font-medium text-[#B8CAE4]">
                Amount
              </label>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="tx-cat" className="mb-1.5 block font-medium text-[#B8CAE4]">
                Category
              </label>
              <select
                id="tx-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white focus:border-[#3B82F6] focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tx-method" className="mb-1.5 block font-medium text-[#B8CAE4]">
                Payment Method
              </label>
              <select
                id="tx-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white focus:border-[#3B82F6] focus:outline-none"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="tx-desc" className="mb-1.5 block font-medium text-[#B8CAE4]">
                Description
              </label>
              <input
                id="tx-desc"
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === 'Income'
                    ? 'e.g. Custom sliding driveway gate fabrication'
                    : 'e.g. 6mm mild steel sheets & Argon refill'
                }
                className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="tx-party" className="mb-1.5 block font-medium text-[#B8CAE4]">
                {type === 'Income' ? 'Client Name' : 'Supplier / Vendor'}
              </label>
              <input
                id="tx-party"
                type="text"
                value={clientOrVendor}
                onChange={(e) => setClientOrVendor(e.target.value)}
                placeholder={type === 'Income' ? 'Client name' : 'Steel supplier / gas vendor'}
                className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="tx-order" className="mb-1.5 block font-medium text-[#B8CAE4]">
                Linked Order (Optional)
              </label>
              <select
                id="tx-order"
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value)}
                className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
              >
                <option value="">None</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.orderNumber}>
                    {o.orderNumber} — {o.clientName}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="tx-notes" className="mb-1.5 block font-medium text-[#B8CAE4]">
                Notes
              </label>
              <textarea
                id="tx-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Invoice number, receipt details, or job remarks..."
                className="w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] p-3 text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#162949] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-lg border border-[#1E3A66] px-4 py-2 text-xs font-medium text-[#C5D5EC] hover:bg-[#132544] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="min-h-[40px] rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
          >
            {initialTx ? 'Review Update' : 'Review & Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ======================== INVENTORY MODAL ======================== */
interface InventoryModalProps {
  open: boolean;
  initialItem: InventoryItem | null;
  onClose: () => void;
  onSubmit: (data: Omit<InventoryItem, 'rowIndex'>, existingRowIndex?: number) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  open,
  initialItem,
  onClose,
  onSubmit,
}) => {
  const [sku, setSku] = useState('');
  const [materialName, setMaterialName] = useState('');
  const [category, setCategory] = useState<string>(INVENTORY_CATEGORIES[0]);
  const [specification, setSpecification] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [unit, setUnit] = useState<string>(INVENTORY_UNITS[0]);
  const [minThreshold, setMinThreshold] = useState('2');
  const [unitCost, setUnitCost] = useState('0');
  const [supplier, setSupplier] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initialItem) {
      setSku(initialItem.sku);
      setMaterialName(initialItem.materialName);
      setCategory(initialItem.category);
      setSpecification(initialItem.specification);
      setQuantity(String(initialItem.quantity));
      setUnit(initialItem.unit);
      setMinThreshold(String(initialItem.minThreshold));
      setUnitCost(String(initialItem.unitCost));
      setSupplier(initialItem.supplier);
    } else {
      setSku(generateId('MAT'));
      setMaterialName('');
      setCategory(INVENTORY_CATEGORIES[0]);
      setSpecification('');
      setQuantity('0');
      setUnit(INVENTORY_UNITS[0]);
      setMinThreshold('2');
      setUnitCost('0');
      setSupplier('');
    }
  }, [open, initialItem]);

  if (!open) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      {
        id: initialItem?.id || generateId('INV'),
        sku: sku.trim() || generateId('MAT'),
        materialName: materialName.trim(),
        category,
        specification: specification.trim(),
        quantity: Math.max(0, parseFloat(quantity) || 0),
        unit,
        minThreshold: Math.max(0, parseFloat(minThreshold) || 0),
        unitCost: Math.max(0, parseFloat(unitCost) || 0),
        supplier: supplier.trim(),
        lastUpdated: getTodayISO(),
      },
      initialItem?.rowIndex
    );
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#030712]/80 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inv-modal-title"
    >
      <form
        onSubmit={handleFormSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#1E3A66] bg-[#0B172C] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#162949] px-6 py-4">
          <h3 id="inv-modal-title" className="font-display text-base font-semibold text-white">
            {initialItem ? 'Edit Inventory Material' : 'Add Workshop Material'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8FA8CC] hover:bg-[#132544] hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-5 text-xs sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="inv-name" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Material Name
            </label>
            <input
              id="inv-name"
              type="text"
              required
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              placeholder="e.g. Mild Steel Square Tube 40x40mm"
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="inv-sku" className="mb-1.5 block font-medium text-[#B8CAE4]">
              SKU / Code
            </label>
            <input
              id="inv-sku"
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="inv-cat" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Category
            </label>
            <select
              id="inv-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white focus:border-[#3B82F6] focus:outline-none"
            >
              {INVENTORY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="inv-spec" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Dimensions / Grade Specification
            </label>
            <input
              id="inv-spec"
              type="text"
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder="e.g. 6m length · 3mm wall thickness · A36"
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="inv-qty" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Current Quantity
            </label>
            <input
              id="inv-qty"
              type="number"
              step="0.1"
              min="0"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="inv-unit" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Unit
            </label>
            <select
              id="inv-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white focus:border-[#3B82F6] focus:outline-none"
            >
              {INVENTORY_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="inv-min" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Low-Stock Alert Threshold
            </label>
            <input
              id="inv-min"
              type="number"
              step="0.1"
              min="0"
              required
              value={minThreshold}
              onChange={(e) => setMinThreshold(e.target.value)}
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="inv-cost" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Unit Cost
            </label>
            <input
              id="inv-cost"
              type="number"
              step="0.01"
              min="0"
              required
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="inv-supplier" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Preferred Supplier
            </label>
            <input
              id="inv-supplier"
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Supplier name"
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#162949] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-lg border border-[#1E3A66] px-4 py-2 text-xs font-medium text-[#C5D5EC] hover:bg-[#132544] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="min-h-[40px] rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
          >
            {initialItem ? 'Review Update' : 'Review & Add'}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ======================== CLIENT ORDER MODAL ======================== */
interface OrderModalProps {
  open: boolean;
  initialOrder: ClientOrder | null;
  nextOrderNumber: string;
  onClose: () => void;
  onSubmit: (data: Omit<ClientOrder, 'rowIndex'>, existingRowIndex?: number) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  open,
  initialOrder,
  nextOrderNumber,
  onClose,
  onSubmit,
}) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [materialSpec, setMaterialSpec] = useState('');
  const [orderDate, setOrderDate] = useState(getTodayISO());
  const [dueDate, setDueDate] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [depositPaid, setDepositPaid] = useState('0');
  const [status, setStatus] = useState<OrderStatus>('In Fabrication');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initialOrder) {
      setOrderNumber(initialOrder.orderNumber);
      setClientName(initialOrder.clientName);
      setClientPhone(initialOrder.clientPhone);
      setProjectTitle(initialOrder.projectTitle);
      setMaterialSpec(initialOrder.materialSpec);
      setOrderDate(initialOrder.orderDate || getTodayISO());
      setDueDate(initialOrder.dueDate);
      setTotalPrice(String(initialOrder.totalPrice));
      setDepositPaid(String(initialOrder.depositPaid));
      setStatus(initialOrder.status);
      setNotes(initialOrder.notes);
    } else {
      setOrderNumber(nextOrderNumber);
      setClientName('');
      setClientPhone('');
      setProjectTitle('');
      setMaterialSpec('');
      setOrderDate(getTodayISO());
      setDueDate('');
      setTotalPrice('');
      setDepositPaid('0');
      setStatus('Quoted');
      setNotes('');
    }
  }, [open, initialOrder, nextOrderNumber]);

  if (!open) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      {
        id: initialOrder?.id || generateId('ORD'),
        orderNumber: orderNumber.trim() || nextOrderNumber,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        projectTitle: projectTitle.trim(),
        materialSpec: materialSpec.trim(),
        orderDate,
        dueDate,
        totalPrice: Math.max(0, parseFloat(totalPrice) || 0),
        depositPaid: Math.max(0, parseFloat(depositPaid) || 0),
        status,
        notes: notes.trim(),
      },
      initialOrder?.rowIndex
    );
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#030712]/80 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ord-modal-title"
    >
      <form
        onSubmit={handleFormSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#1E3A66] bg-[#0B172C] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#162949] px-6 py-4">
          <h3 id="ord-modal-title" className="font-display text-base font-semibold text-white">
            {initialOrder ? `Edit Order ${initialOrder.orderNumber}` : 'New Client Order'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8FA8CC] hover:bg-[#132544] hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-5 text-xs sm:grid-cols-2">
          <div>
            <label htmlFor="ord-num" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Order Number
            </label>
            <input
              id="ord-num"
              type="text"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="ord-status" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Status
            </label>
            <select
              id="ord-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white focus:border-[#3B82F6] focus:outline-none"
            >
              {ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ord-client" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Client Name
            </label>
            <input
              id="ord-client"
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client or company"
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="ord-phone" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Client Phone
            </label>
            <input
              id="ord-phone"
              type="text"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Phone number"
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="ord-title" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Project Title
            </label>
            <input
              id="ord-title"
              type="text"
              required
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g. 14ft Heavy-Duty Sliding Driveway Gate"
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="ord-spec" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Material &amp; Weld Specifications
            </label>
            <input
              id="ord-spec"
              type="text"
              value={materialSpec}
              onChange={(e) => setMaterialSpec(e.target.value)}
              placeholder="e.g. 50x50x3mm RHS frame, powder-coated navy matte"
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="ord-date" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Order Date
            </label>
            <input
              id="ord-date"
              type="date"
              required
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="ord-due" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Delivery / Due Date
            </label>
            <input
              id="ord-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="ord-total" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Total Agreed Price
            </label>
            <input
              id="ord-total"
              type="number"
              step="0.01"
              min="0"
              required
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              placeholder="0.00"
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="ord-deposit" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Deposit / Paid So Far
            </label>
            <input
              id="ord-deposit"
              type="number"
              step="0.01"
              min="0"
              required
              value={depositPaid}
              onChange={(e) => setDepositPaid(e.target.value)}
              className="min-h-[40px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="ord-notes" className="mb-1.5 block font-medium text-[#B8CAE4]">
              Job Notes &amp; Delivery Instructions
            </label>
            <textarea
              id="ord-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Site measurements, installation instructions, special hardware..."
              className="w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] p-3 text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#162949] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-lg border border-[#1E3A66] px-4 py-2 text-xs font-medium text-[#C5D5EC] hover:bg-[#132544] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="min-h-[40px] rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
          >
            {initialOrder ? 'Review Update' : 'Review & Create'}
          </button>
        </div>
      </form>
    </div>
  );
};
