import React, { useState } from 'react';
import { CheckCircle2, ClipboardList, Lock, Receipt } from 'lucide-react';
import {
  ClientOrder,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  ORDER_STATUSES,
  OrderStatus,
  PAYMENT_METHODS,
  Transaction,
  TransactionType,
} from '../types/workshop';
import { generateId, getTodayISO } from '../lib/format';
import { WelderLogo } from './WelderLogo';

interface ShopFloorLandingProps {
  workshopName: string;
  nextOrderNumber: string;
  lastSavedMessage: string | null;
  onDismissSavedMessage: () => void;
  onSubmitNewEntry: (
    data: Omit<Transaction, 'rowIndex'>,
    onResetForm: () => void
  ) => void;
  onSubmitNewOrder: (
    data: Omit<ClientOrder, 'rowIndex'>,
    onResetForm: () => void
  ) => void;
  onOpenAdminLogin: () => void;
}

export const ShopFloorLanding: React.FC<ShopFloorLandingProps> = ({
  workshopName,
  nextOrderNumber,
  lastSavedMessage,
  onDismissSavedMessage,
  onSubmitNewEntry,
  onSubmitNewOrder,
  onOpenAdminLogin,
}) => {
  // Mobile tab toggle so phone users can switch effortlessly between both forms
  const [mobileFormTab, setMobileFormTab] = useState<'entry' | 'order'>('entry');

  // New Entry Form State
  const [txType, setTxType] = useState<TransactionType>('Income');
  const [txDate, setTxDate] = useState(getTodayISO());
  const [txCategory, setTxCategory] = useState<string>(INCOME_CATEGORIES[0]);
  const [txDescription, setTxDescription] = useState('');
  const [txParty, setTxParty] = useState('');
  const [txOrderRef, setTxOrderRef] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txMethod, setTxMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [txNotes, setTxNotes] = useState('');

  // New Order Form State
  const [ordClientName, setOrdClientName] = useState('');
  const [ordClientPhone, setOrdClientPhone] = useState('');
  const [ordTitle, setOrdTitle] = useState('');
  const [ordSpec, setOrdSpec] = useState('');
  const [ordDate, setOrdDate] = useState(getTodayISO());
  const [ordDueDate, setOrdDueDate] = useState('');
  const [ordTotalPrice, setOrdTotalPrice] = useState('');
  const [ordDepositPaid, setOrdDepositPaid] = useState('0');
  const [ordStatus, setOrdStatus] = useState<OrderStatus>('Quoted');
  const [ordNotes, setOrdNotes] = useState('');

  const txCategories = txType === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTxTypeChange = (next: TransactionType) => {
    setTxType(next);
    const list = next === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!(list as readonly string[]).includes(txCategory)) {
      setTxCategory(list[0]);
    }
  };

  const resetEntryForm = () => {
    setTxDate(getTodayISO());
    setTxDescription('');
    setTxParty('');
    setTxOrderRef('');
    setTxAmount('');
    setTxNotes('');
  };

  const resetOrderForm = () => {
    setOrdClientName('');
    setOrdClientPhone('');
    setOrdTitle('');
    setOrdSpec('');
    setOrdDate(getTodayISO());
    setOrdDueDate('');
    setOrdTotalPrice('');
    setOrdDepositPaid('0');
    setOrdStatus('Quoted');
    setOrdNotes('');
  };

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(txAmount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;

    onSubmitNewEntry(
      {
        id: generateId('TX'),
        date: txDate,
        type: txType,
        category: txCategory,
        description: txDescription.trim(),
        clientOrVendor: txParty.trim(),
        orderRef: txOrderRef.trim(),
        amount: numericAmount,
        paymentMethod: txMethod,
        notes: txNotes.trim(),
      },
      resetEntryForm
    );
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitNewOrder(
      {
        id: generateId('ORD'),
        orderNumber: nextOrderNumber,
        clientName: ordClientName.trim(),
        clientPhone: ordClientPhone.trim(),
        projectTitle: ordTitle.trim(),
        materialSpec: ordSpec.trim(),
        orderDate: ordDate,
        dueDate: ordDueDate,
        totalPrice: Math.max(0, parseFloat(ordTotalPrice) || 0),
        depositPaid: Math.max(0, parseFloat(ordDepositPaid) || 0),
        status: ordStatus,
        notes: ordNotes.trim(),
      },
      resetOrderForm
    );
  };

  return (
    <div className="min-h-screen bg-[#060E1E] text-[#EDF2FA] flex flex-col">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-20 border-b border-[#162949] bg-[#081226]/95 backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Brand with Welder Logo */}
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <WelderLogo size={38} />
            <span className="font-display text-lg font-bold tracking-tight text-white">
              {workshopName}
            </span>
          </div>

          {/* Zone 2: Concise Anchor Navigation Links */}
          <nav
            className="hidden items-center gap-6 text-sm font-medium text-[#9DB4D4] md:flex"
            aria-label="Workshop intake sections"
          >
            <a
              href="#new-entry-form"
              className="transition-colors hover:text-white whitespace-nowrap shrink-0"
            >
              New Entry
            </a>
            <a
              href="#new-order-form"
              className="transition-colors hover:text-white whitespace-nowrap shrink-0"
            >
              New Order
            </a>
          </nav>

          {/* Zone 3: Admin Login CTA */}
          <button
            type="button"
            onClick={onOpenAdminLogin}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-[#60A5FA] whitespace-nowrap shrink-0"
          >
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Admin Login</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Hero Brand Strip with Welder Logo */}
        <section className="flex flex-col justify-between gap-5 rounded-xl border border-[#193055] bg-[#0B172C] p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <WelderLogo size={60} className="shrink-0" />
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Workshop Intake Portal
              </h1>
              <p className="max-w-2xl text-xs leading-relaxed text-[#9DB4D4] sm:text-sm">
                Submit daily income, shop expenses, or new client fabrication orders directly to the
                workshop Google Sheet. Financial overview and reports require Admin login.
              </p>
            </div>
          </div>
        </section>

        {lastSavedMessage && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/35 px-4 py-3 text-xs text-emerald-200"
          >
            <span className="inline-flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
              {lastSavedMessage}
            </span>
            <button
              type="button"
              onClick={onDismissSavedMessage}
              className="rounded px-2 py-1 text-emerald-200 hover:bg-emerald-900/50"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Mobile Form Switcher */}
        <div
          className="grid grid-cols-2 gap-1 rounded-lg border border-[#193055] bg-[#091428] p-1 lg:hidden"
          role="tablist"
          aria-label="Select worker intake form"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mobileFormTab === 'entry'}
            onClick={() => setMobileFormTab('entry')}
            className={`min-h-[42px] rounded-md text-xs font-semibold transition-colors ${
              mobileFormTab === 'entry'
                ? 'bg-[#2563EB] text-white'
                : 'text-[#8FA8CC] hover:text-white'
            }`}
          >
            New Entry
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileFormTab === 'order'}
            onClick={() => setMobileFormTab('order')}
            className={`min-h-[42px] rounded-md text-xs font-semibold transition-colors ${
              mobileFormTab === 'order'
                ? 'bg-[#2563EB] text-white'
                : 'text-[#8FA8CC] hover:text-white'
            }`}
          >
            New Order
          </button>
        </div>

        {/* Side-by-side Forms on Desktop, Tabbed on Mobile/Tablet */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          {/* Card 1: New Entry Form */}
          <form
            id="new-entry-form"
            onSubmit={handleEntrySubmit}
            className={`rounded-xl border border-[#193055] bg-[#0B172C] p-5 sm:p-6 ${
              mobileFormTab === 'entry' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex items-center gap-3 border-b border-[#162949] pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#162E57] text-[#60A5FA] shrink-0">
                <Receipt className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold text-white">New Entry</h2>
                <p className="text-xs text-[#8DA6CA]">
                  Record shop income, material spending, gas refills, or expenses
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#193055] bg-[#060E1E] p-1">
                {(['Income', 'Expense'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTxTypeChange(t)}
                    className={`min-h-[40px] rounded-md font-semibold transition-colors ${
                      txType === t
                        ? t === 'Income'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-red-600 text-white'
                        : 'text-[#8DA6CA] hover:text-white'
                    }`}
                  >
                    {t === 'Income' ? 'Income (Inflow)' : 'Expense (Spending)'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="wk-tx-date" className="mb-1.5 block font-medium text-[#B8CAE4]">
                    Date
                  </label>
                  <input
                    id="wk-tx-date"
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="wk-tx-amount" className="mb-1.5 block font-medium text-[#B8CAE4]">
                    Amount
                  </label>
                  <input
                    id="wk-tx-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0.00"
                    className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="wk-tx-cat" className="mb-1.5 block font-medium text-[#B8CAE4]">
                    Category
                  </label>
                  <select
                    id="wk-tx-cat"
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white focus:border-[#3B82F6] focus:outline-none"
                  >
                    {txCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="wk-tx-method" className="mb-1.5 block font-medium text-[#B8CAE4]">
                    Payment Method
                  </label>
                  <select
                    id="wk-tx-method"
                    value={txMethod}
                    onChange={(e) => setTxMethod(e.target.value)}
                    className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white focus:border-[#3B82F6] focus:outline-none"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="wk-tx-desc" className="mb-1.5 block font-medium text-[#B8CAE4]">
                    Description
                  </label>
                  <input
                    id="wk-tx-desc"
                    type="text"
                    required
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    placeholder={
                      txType === 'Income'
                        ? 'e.g. Gate repair payment or deposit received'
                        : 'e.g. Steel rods, grinding discs, or Argon gas refill'
                    }
                    className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="wk-tx-party" className="mb-1.5 block font-medium text-[#B8CAE4]">
                    {txType === 'Income' ? 'Client Name' : 'Supplier / Vendor'}
                  </label>
                  <input
                    id="wk-tx-party"
                    type="text"
                    value={txParty}
                    onChange={(e) => setTxParty(e.target.value)}
                    placeholder={txType === 'Income' ? 'Client name' : 'Vendor name'}
                    className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="wk-tx-ref" className="mb-1.5 block font-medium text-[#B8CAE4]">
                    Order # (Optional)
                  </label>
                  <input
                    id="wk-tx-ref"
                    type="text"
                    value={txOrderRef}
                    onChange={(e) => setTxOrderRef(e.target.value)}
                    placeholder="e.g. WO-1004"
                    className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="wk-tx-notes" className="mb-1.5 block font-medium text-[#B8CAE4]">
                    Notes
                  </label>
                  <textarea
                    id="wk-tx-notes"
                    rows={2}
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    placeholder="Receipt number or worker remarks..."
                    className="w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] p-3 text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="min-h-[44px] w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
                >
                  Submit New Entry
                </button>
              </div>
            </div>
          </form>

          {/* Card 2: New Order Form */}
          <form
            id="new-order-form"
            onSubmit={handleOrderSubmit}
            className={`rounded-xl border border-[#193055] bg-[#0B172C] p-5 sm:p-6 ${
              mobileFormTab === 'order' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#162949] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#162E57] text-[#60A5FA] shrink-0">
                  <ClipboardList className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-white">New Order</h2>
                  <p className="text-xs text-[#8DA6CA]">
                    Log a new client welding or custom fabrication job
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-semibold text-[#60A5FA] tabular-nums whitespace-nowrap">
                {nextOrderNumber}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
              <div>
                <label htmlFor="wk-ord-client" className="mb-1.5 block font-medium text-[#B8CAE4]">
                  Client Name
                </label>
                <input
                  id="wk-ord-client"
                  type="text"
                  required
                  value={ordClientName}
                  onChange={(e) => setOrdClientName(e.target.value)}
                  placeholder="Client or company"
                  className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="wk-ord-phone" className="mb-1.5 block font-medium text-[#B8CAE4]">
                  Client Phone
                </label>
                <input
                  id="wk-ord-phone"
                  type="text"
                  value={ordClientPhone}
                  onChange={(e) => setOrdClientPhone(e.target.value)}
                  placeholder="Phone number"
                  className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="wk-ord-title" className="mb-1.5 block font-medium text-[#B8CAE4]">
                  Project Title
                </label>
                <input
                  id="wk-ord-title"
                  type="text"
                  required
                  value={ordTitle}
                  onChange={(e) => setOrdTitle(e.target.value)}
                  placeholder="e.g. Heavy-Duty Sliding Steel Gate 14ft"
                  className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="wk-ord-spec" className="mb-1.5 block font-medium text-[#B8CAE4]">
                  Material &amp; Weld Specification
                </label>
                <input
                  id="wk-ord-spec"
                  type="text"
                  value={ordSpec}
                  onChange={(e) => setOrdSpec(e.target.value)}
                  placeholder="e.g. 50x50mm square tube, 3mm plate, navy primer"
                  className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="wk-ord-date" className="mb-1.5 block font-medium text-[#B8CAE4]">
                  Order Date
                </label>
                <input
                  id="wk-ord-date"
                  type="date"
                  required
                  value={ordDate}
                  onChange={(e) => setOrdDate(e.target.value)}
                  className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="wk-ord-due" className="mb-1.5 block font-medium text-[#B8CAE4]">
                  Delivery / Due Date
                </label>
                <input
                  id="wk-ord-due"
                  type="date"
                  value={ordDueDate}
                  onChange={(e) => setOrdDueDate(e.target.value)}
                  className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="wk-ord-total" className="mb-1.5 block font-medium text-[#B8CAE4]">
                  Total Agreed Price
                </label>
                <input
                  id="wk-ord-total"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={ordTotalPrice}
                  onChange={(e) => setOrdTotalPrice(e.target.value)}
                  placeholder="0.00"
                  className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="wk-ord-deposit" className="mb-1.5 block font-medium text-[#B8CAE4]">
                  Deposit Paid
                </label>
                <input
                  id="wk-ord-deposit"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={ordDepositPaid}
                  onChange={(e) => setOrdDepositPaid(e.target.value)}
                  className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 font-mono text-white focus:border-[#3B82F6] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="wk-ord-status" className="mb-1.5 block font-medium text-[#B8CAE4]">
                  Initial Job Status
                </label>
                <select
                  id="wk-ord-status"
                  value={ordStatus}
                  onChange={(e) => setOrdStatus(e.target.value as OrderStatus)}
                  className="min-h-[42px] w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] px-3 text-white focus:border-[#3B82F6] focus:outline-none"
                >
                  {ORDER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="wk-ord-notes" className="mb-1.5 block font-medium text-[#B8CAE4]">
                  Measurements &amp; Job Notes
                </label>
                <textarea
                  id="wk-ord-notes"
                  rows={2}
                  value={ordNotes}
                  onChange={(e) => setOrdNotes(e.target.value)}
                  placeholder="Dimensions, installation location, or special instructions..."
                  className="w-full rounded-lg border border-[#1E3A66] bg-[#060E1E] p-3 text-white placeholder-[#5B7499] focus:border-[#3B82F6] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  className="min-h-[44px] w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
                >
                  Submit New Order
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
