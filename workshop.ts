export type TransactionType = 'Income' | 'Expense';

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Card' | 'Check' | 'Mobile Money';

export interface Transaction {
  rowIndex: number;
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  description: string;
  clientOrVendor: string;
  orderRef: string;
  amount: number;
  paymentMethod: string;
  notes: string;
}

export interface InventoryItem {
  rowIndex: number;
  id: string;
  sku: string;
  materialName: string;
  category: string;
  specification: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  unitCost: number;
  supplier: string;
  lastUpdated: string;
}

export type OrderStatus =
  | 'Quoted'
  | 'Pending Material'
  | 'In Fabrication'
  | 'Ready for Pickup'
  | 'Completed'
  | 'Cancelled';

export interface ClientOrder {
  rowIndex: number;
  id: string;
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  projectTitle: string;
  materialSpec: string;
  orderDate: string;
  dueDate: string;
  totalPrice: number;
  depositPaid: number;
  status: OrderStatus;
  notes: string;
}

export interface WorkshopSettings {
  workshopName: string;
  currency: string;
  ownerPhone: string;
  shopAddress: string;
}

export interface AdminCredential {
  rowIndex: number;
  id: string;
  adminId: string;
  password: string;
  displayName: string;
  role: string;
  createdAt: string;
}

export interface SheetTabInfo {
  sheetId: number;
  title: string;
}

export interface SpreadsheetInfo {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheets: SheetTabInfo[];
}

export interface WorkshopData {
  spreadsheet: SpreadsheetInfo;
  transactions: Transaction[];
  inventory: InventoryItem[];
  orders: ClientOrder[];
  settings: WorkshopSettings;
  admins: AdminCredential[];
  missingTabs: string[];
}

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface PendingConfirmation {
  title: string;
  description: string;
  details: { label: string; value: string }[];
  confirmLabel: string;
  tone: 'primary' | 'danger';
  onConfirm: () => Promise<void>;
}

export const INCOME_CATEGORIES = [
  'Custom Fabrication',
  'Structural & Gates',
  'Welding Repairs',
  'Client Deposit',
  'Final Order Payment',
  'On-Site Mobile Welding',
  'Scrap Metal Sale',
  'Other Income',
] as const;

export const EXPENSE_CATEGORIES = [
  'Raw Steel & Metals',
  'Welding Gas & Cylinders',
  'Electrodes, Wire & Rods',
  'Cutting & Grinding Discs',
  'Tools & Machine Maintenance',
  'Paint, Primer & Coatings',
  'Workshop Rent & Utilities',
  'Labor & Subcontractors',
  'Fuel & Material Transport',
  'Safety Gear (PPE)',
  'Other Expense',
] as const;

export const INVENTORY_CATEGORIES = [
  'Raw Steel & Plates',
  'Tubing & Structural Beams',
  'Stainless & Aluminum',
  'Welding Wire & Electrodes',
  'Shielding Gas',
  'Abrasives & Cutting Discs',
  'Coatings & Fasteners',
  'Safety & Consumables',
] as const;

export const INVENTORY_UNITS = [
  'sheets',
  'lengths',
  'pcs',
  'kg',
  'meters',
  'cylinders',
  'spools',
  'boxes',
  'liters',
] as const;

export const ORDER_STATUSES: OrderStatus[] = [
  'Quoted',
  'Pending Material',
  'In Fabrication',
  'Ready for Pickup',
  'Completed',
  'Cancelled',
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Bank Transfer',
  'Card',
  'Check',
  'Mobile Money',
];

export const CURRENCY_OPTIONS = [
  { code: 'USD', label: 'USD ($)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'CAD', label: 'CAD ($)' },
  { code: 'AUD', label: 'AUD ($)' },
  { code: 'AED', label: 'AED (د.إ)' },
  { code: 'SAR', label: 'SAR (﷼)' },
  { code: 'NGN', label: 'NGN (₦)' },
  { code: 'PKR', label: 'PKR (₨)' },
  { code: 'INR', label: 'INR (₹)' },
  { code: 'ZAR', label: 'ZAR (R)' },
  { code: 'KES', label: 'KES (KSh)' },
] as const;
