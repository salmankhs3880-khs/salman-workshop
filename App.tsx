import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
  Briefcase,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Menu,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  Settings,
  Shield,
  X,
} from 'lucide-react';
import {
  AdminCredential,
  ClientOrder,
  DriveSpreadsheetFile,
  InventoryItem,
  OrderStatus,
  PendingConfirmation,
  Transaction,
  TransactionType,
  WorkshopData,
  WorkshopSettings,
} from './types/workshop';
import { clearAccessToken, getAccessToken, googleSignIn, initAuth, logout } from './lib/auth';
import {
  TAB_NAMES,
  adminToRow,
  appendSheetRow,
  createWorkshopSpreadsheet,
  deleteSheetRow,
  findAppSpreadsheets,
  initializeMissingTabs,
  inventoryToRow,
  loadWorkshopData,
  orderToRow,
  saveWorkshopSettings,
  transactionToRow,
  updateSheetRow,
} from './lib/sheets';
import { formatCurrency, generateId, getTodayISO } from './lib/format';
import { AuthGateView } from './components/AuthGateView';
import { SpreadsheetConnectView } from './components/SpreadsheetConnectView';
import { ShopFloorLanding } from './components/ShopFloorLanding';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminAccountsView } from './components/AdminAccountsView';
import { WelderLogo } from './components/WelderLogo';
import { OverviewDashboard } from './components/OverviewDashboard';
import { LedgerView } from './components/LedgerView';
import { InventoryView } from './components/InventoryView';
import { OrdersView } from './components/OrdersView';
import { SettingsView } from './components/SettingsView';
import { ConfirmActionModal } from './components/ConfirmActionModal';
import { InventoryModal, OrderModal, TransactionModal } from './components/EntryModals';

type ActiveTab = 'overview' | 'ledger' | 'inventory' | 'orders' | 'admins' | 'settings';

const LAST_SHEET_KEY = 'ironweld_last_spreadsheet_id';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [discoveredFiles, setDiscoveredFiles] = useState<DriveSpreadsheetFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);

  const [activeSpreadsheetId, setActiveSpreadsheetId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LAST_SHEET_KEY);
    } catch {
      return null;
    }
  });
  const [workshopData, setWorkshopData] = useState<WorkshopData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Worker Landing vs Admin Overview Session State
  const [activeAdmin, setActiveAdmin] = useState<AdminCredential | null>(null);
  const [adminLoginOpen, setAdminLoginOpen] = useState<boolean>(false);
  const [workerSavedMessage, setWorkerSavedMessage] = useState<string | null>(null);

  // Entry Modals State
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [defaultTxType, setDefaultTxType] = useState<TransactionType>('Income');
  const [paymentOrderTarget, setPaymentOrderTarget] = useState<ClientOrder | null>(null);

  const [invModalOpen, setInvModalOpen] = useState(false);
  const [editingInv, setEditingInv] = useState<InventoryItem | null>(null);

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ClientOrder | null>(null);

  // Mandatory User Confirmation State before any Google Sheets write/update/delete
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmation | null>(null);
  const [isMutating, setIsMutating] = useState<boolean>(false);

  const handleApiError = useCallback((err: unknown) => {
    const status = (err as { status?: number })?.status;
    const message =
      err instanceof Error ? err.message : 'Unable to reach Google Sheets right now.';
    if (status === 401) {
      clearAccessToken();
      setNeedsAuth(true);
      setAuthError('Your Google session expired. Please sign in again to continue.');
      return;
    }
    setAppError(message);
  }, []);

  const fetchDriveSpreadsheets = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setIsLoadingFiles(true);
    try {
      const files = await findAppSpreadsheets(token);
      setDiscoveredFiles(files);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [handleApiError]);

  const syncSpreadsheet = useCallback(
    async (spreadsheetId: string) => {
      const token = await getAccessToken();
      if (!token) {
        setNeedsAuth(true);
        return;
      }
      setIsLoadingData(true);
      setAppError(null);
      try {
        const data = await loadWorkshopData(token, spreadsheetId);
        setWorkshopData(data);
        setActiveSpreadsheetId(spreadsheetId);
        try {
          localStorage.setItem(LAST_SHEET_KEY, spreadsheetId);
        } catch {
          // ignore storage failure
        }
        setLastSyncedAt(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
      } catch (err) {
        handleApiError(err);
        // If stored spreadsheet is inaccessible/deleted, clear selection so user can pick another
        setWorkshopData(null);
        setActiveSpreadsheetId(null);
        try {
          localStorage.removeItem(LAST_SHEET_KEY);
        } catch {
          // ignore
        }
      } finally {
        setIsLoadingData(false);
      }
    },
    [handleApiError]
  );

  useEffect(() => {
    const unsubscribe = initAuth(
      (signedInUser) => {
        setUser(signedInUser);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        await fetchDriveSpreadsheets();
        if (activeSpreadsheetId) {
          await syncSpreadsheet(activeSpreadsheetId);
        }
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.';
      setAuthError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setActiveAdmin(null);
    setWorkshopData(null);
    setDiscoveredFiles([]);
    setNeedsAuth(true);
  };

  const handleSwitchSpreadsheet = () => {
    setActiveAdmin(null);
    setWorkshopData(null);
    setActiveSpreadsheetId(null);
    try {
      localStorage.removeItem(LAST_SHEET_KEY);
    } catch {
      // ignore
    }
    fetchDriveSpreadsheets();
  };

  // Helper to resolve tab sheetId dynamically from metadata
  const getSheetIdByName = (tabName: string): number | null => {
    if (!workshopData) return null;
    const found = workshopData.spreadsheet.sheets.find((s) => s.title === tabName);
    return found ? found.sheetId : null;
  };

  // Execute confirmed mutation
  const executeConfirmedAction = async () => {
    if (!pendingConfirm) return;
    setIsMutating(true);
    setAppError(null);
    try {
      await pendingConfirm.onConfirm();
      setPendingConfirm(null);
    } catch (err) {
      handleApiError(err);
      setPendingConfirm(null);
    } finally {
      setIsMutating(false);
    }
  };

  // Create new Workshop Google Sheet (with confirmation)
  const requestCreateSpreadsheet = (name: string) => {
    setPendingConfirm({
      title: 'Create New Workshop Google Sheet?',
      description:
        'This will create a new Google Sheets spreadsheet in your Google Drive with tabs for Transactions, Inventory, Orders, and Settings.',
      details: [
        { label: 'Spreadsheet Title', value: `${name} — Ledger` },
        { label: 'Tabs Created', value: 'Transactions, Inventory, Orders, Settings' },
      ],
      confirmLabel: 'Create Spreadsheet',
      tone: 'primary',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Session expired. Please sign in again.');
        const newId = await createWorkshopSpreadsheet(token, name);
        await fetchDriveSpreadsheets();
        await syncSpreadsheet(newId);
      },
    });
  };

  // Initialize missing tabs on an existing spreadsheet
  const requestInitializeMissingTabs = () => {
    if (!workshopData || workshopData.missingTabs.length === 0) return;
    const { spreadsheet, missingTabs } = workshopData;
    setPendingConfirm({
      title: 'Add Missing Workshop Tabs?',
      description:
        'Your connected spreadsheet is missing required tabs. Confirm to add those tabs and header rows.',
      details: [
        { label: 'Spreadsheet', value: spreadsheet.title },
        { label: 'Tabs to Add', value: missingTabs.join(', ') },
      ],
      confirmLabel: 'Create Missing Tabs',
      tone: 'primary',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Session expired. Please sign in again.');
        await initializeMissingTabs(
          token,
          spreadsheet.spreadsheetId,
          spreadsheet.sheets,
          missingTabs
        );
        await syncSpreadsheet(spreadsheet.spreadsheetId);
      },
    });
  };

  /* -------------------- TRANSACTION MUTATIONS -------------------- */
  const handleTransactionFormSubmit = (
    data: Omit<Transaction, 'rowIndex'>,
    existingRowIndex?: number
  ) => {
    if (!workshopData) return;
    const spreadsheetId = workshopData.spreadsheet.spreadsheetId;
    const currency = workshopData.settings.currency;
    const linkedOrder = paymentOrderTarget;

    setTxModalOpen(false);
    setEditingTx(null);
    setPaymentOrderTarget(null);

    const isUpdate = typeof existingRowIndex === 'number';
    const details: { label: string; value: string }[] = [
      { label: 'Sheet Tab', value: TAB_NAMES.TRANSACTIONS },
      { label: 'Type', value: data.type },
      { label: 'Category', value: data.category },
      { label: 'Amount', value: formatCurrency(data.amount, currency) },
      { label: 'Description', value: data.description || data.category },
    ];
    if (linkedOrder) {
      const nextPaid = Math.min(linkedOrder.totalPrice, linkedOrder.depositPaid + data.amount);
      details.push({
        label: `Update ${linkedOrder.orderNumber} Paid`,
        value: `${formatCurrency(linkedOrder.depositPaid, currency)} -> ${formatCurrency(nextPaid, currency)}`,
      });
    }

    setPendingConfirm({
      title: isUpdate
        ? 'Update Transaction in Google Sheets?'
        : 'Save Transaction to Google Sheets?',
      description: isUpdate
        ? `Confirm updating row ${existingRowIndex} in the '${TAB_NAMES.TRANSACTIONS}' tab.`
        : `Confirm appending this ${data.type.toLowerCase()} record to the '${TAB_NAMES.TRANSACTIONS}' tab.`,
      details,
      confirmLabel: isUpdate ? 'Update Row' : 'Save Entry',
      tone: 'primary',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Session expired. Please sign in again.');
        if (isUpdate) {
          await updateSheetRow(
            token,
            spreadsheetId,
            TAB_NAMES.TRANSACTIONS,
            existingRowIndex,
            transactionToRow(data)
          );
        } else {
          await appendSheetRow(
            token,
            spreadsheetId,
            TAB_NAMES.TRANSACTIONS,
            transactionToRow(data)
          );
          if (linkedOrder) {
            const nextPaid = linkedOrder.depositPaid + data.amount;
            const nextStatus: OrderStatus =
              nextPaid >= linkedOrder.totalPrice && linkedOrder.status === 'Ready for Pickup'
                ? 'Completed'
                : linkedOrder.status;
            await updateSheetRow(
              token,
              spreadsheetId,
              TAB_NAMES.ORDERS,
              linkedOrder.rowIndex,
              orderToRow({
                ...linkedOrder,
                depositPaid: nextPaid,
                status: nextStatus,
              })
            );
          }
        }
        await syncSpreadsheet(spreadsheetId);
      },
    });
  };

  const handleDeleteTransaction = (tx: Transaction) => {
    if (!workshopData) return;
    const sheetId = getSheetIdByName(TAB_NAMES.TRANSACTIONS);
    if (sheetId === null) {
      setAppError("Cannot delete: 'Transactions' tab not found in spreadsheet.");
      return;
    }
    const spreadsheetId = workshopData.spreadsheet.spreadsheetId;
    const currency = workshopData.settings.currency;

    setPendingConfirm({
      title: 'Delete Transaction from Google Sheets?',
      description: `This will permanently remove row ${tx.rowIndex} from the '${TAB_NAMES.TRANSACTIONS}' tab in your Google Sheet.`,
      details: [
        { label: 'Date', value: tx.date },
        { label: 'Description', value: tx.description || tx.category },
        { label: 'Amount', value: `${tx.type} · ${formatCurrency(tx.amount, currency)}` },
      ],
      confirmLabel: 'Delete Row',
      tone: 'danger',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Session expired. Please sign in again.');
        await deleteSheetRow(token, spreadsheetId, sheetId, tx.rowIndex);
        await syncSpreadsheet(spreadsheetId);
      },
    });
  };

  /* -------------------- INVENTORY MUTATIONS -------------------- */
  const handleInventoryFormSubmit = (
    data: Omit<InventoryItem, 'rowIndex'>,
    existingRowIndex?: number
  ) => {
    if (!workshopData) return;
    const spreadsheetId = workshopData.spreadsheet.spreadsheetId;
    setInvModalOpen(false);
    setEditingInv(null);

    const isUpdate = typeof existingRowIndex === 'number';
    setPendingConfirm({
      title: isUpdate
        ? 'Update Material in Google Sheets?'
        : 'Add Material to Google Sheets?',
      description: isUpdate
        ? `Confirm updating '${data.materialName}' on row ${existingRowIndex} in the '${TAB_NAMES.INVENTORY}' tab.`
        : `Confirm adding '${data.materialName}' to the '${TAB_NAMES.INVENTORY}' tab.`,
      details: [
        { label: 'SKU', value: data.sku },
        { label: 'Material', value: data.materialName },
        { label: 'Quantity', value: `${data.quantity} ${data.unit}` },
        { label: 'Min Alert', value: `${data.minThreshold} ${data.unit}` },
      ],
      confirmLabel: isUpdate ? 'Update Material' : 'Add Material',
      tone: 'primary',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Session expired. Please sign in again.');
        if (isUpdate) {
          await updateSheetRow(
            token,
            spreadsheetId,
            TAB_NAMES.INVENTORY,
            existingRowIndex,
            inventoryToRow(data)
          );
        } else {
          await appendSheetRow(
            token,
            spreadsheetId,
            TAB_NAMES.INVENTORY,
            inventoryToRow(data)
          );
        }
        await syncSpreadsheet(spreadsheetId);
      },
    });
  };

  const handleAdjustInventoryQuantity = (item: InventoryItem, delta: number) => {
    if (!workshopData) return;
    const spreadsheetId = workshopData.spreadsheet.spreadsheetId;
    const nextQty = Math.max(0, item.quantity + delta);
    const updated: Omit<InventoryItem, 'rowIndex'> = {
      ...item,
      quantity: nextQty,
      lastUpdated: new Date().toISOString().slice(0, 10),
    };

    setPendingConfirm({
      title: 'Update Stock Quantity in Google Sheets?',
      description: `Confirm updating stock on hand for '${item.materialName}' in the '${TAB_NAMES.INVENTORY}' tab.`,
      details: [
        { label: 'Material', value: item.materialName },
        {
          label: 'Quantity Change',
          value: `${item.quantity} -> ${nextQty} ${item.unit}`,
        },
      ],
      confirmLabel: 'Update Stock',
      tone: 'primary',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Session expired. Please sign in again.');
        await updateSheetRow(
          token,
          spreadsheetId,
          TAB_NAMES.INVENTORY,
          item.rowIndex,
          inventoryToRow(updated)
        );
        await syncSpreadsheet(spreadsheetId);
      },
    });
  };

  const handleDeleteInventory = (item: InventoryItem) => {
    if (!workshopData) return;
    const sheetId = getSheetIdByName(TAB_NAMES.INVENTORY);
    if (sheetId === null) {
      setAppError("Cannot delete: 'Inventory' tab not found in spreadsheet.");
      return;
    }
    const spreadsheetId = workshopData.spreadsheet.spreadsheetId;

    setPendingConfirm({
      title: 'Delete Material from Google Sheets?',
      description: `This will permanently remove row ${item.rowIndex} from the '${TAB_NAMES.INVENTORY}' tab.`,
      details: [
        { label: 'SKU', value: item.sku || item.id },
        { label: 'Material', value: item.materialName },
        { label: 'Current Stock', value: `${item.quantity} ${item.unit}` },
      ],
      confirmLabel: 'Delete Material',
      tone: 'danger',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Session expired. Please sign in again.');
        await deleteSheetRow(token, spreadsheetId, sheetId, item.rowIndex);
        await syncSpreadsheet(spreadsheetId);
      },
    });
  };

  /* -------------------- ORDER MUTATIONS -------------------- */
  const nextOrderNumber = useMemo(() => {
    const count = (workshopData?.orders.length || 0) + 1001;
    return `WO-${count}`;
  }, [workshopData?.orders.length]);

  const handleOrderFormSubmit = (
    data: Omit<ClientOrder, 'rowIndex'>,
    existingRowIndex?: number
  ) => {
    if (!workshopData) return;
    const spreadsheetId = workshopData.spreadsheet.spreadsheetId;
    const currency = workshopData.settings.currency;
    setOrderModalOpen(false);
    setEditingOrder(null);

    const isUpdate = typeof existingRowIndex === 'number';
    setPendingConfirm({
      title: isUpdate
        ? 'Update Client Order in Google Sheets?'
        : 'Create Client Order in Google Sheets?',
      description: isUpdate
        ? `Confirm updating order '${data.orderNumber}' on row ${existingRowIndex} in the '${TAB_NAMES.ORDERS}' tab.`
        : `Confirm adding order '${data.orderNumber}' for ${data.clientName} to the '${TAB_NAMES.ORDERS}' tab.`,
      details: [
        { label: 'Order #', value: data.orderNumber },
        { label: 'Client', value: data.clientName },
        { label: 'Project', value: data.projectTitle },
        { label: 'Total Price', value: formatCurrency(data.totalPrice, currency) },
        { label: 'Status', value: data.status },
      ],
      confirmLabel: isUpdate ? 'Update Order' : 'Save Order',
      tone: 'primary',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Session expired. Please sign in again.');
        if (isUpdate) {
          await updateSheetRow(
            token,
            spreadsheetId,
            TAB_NAMES.ORDERS,
            existingRowIndex,
            orderToRow(data)
          );
        } else {
          await appendSheetRow(token, spreadsheetId, TAB_NAMES.ORDERS, orderToRow(data));
        }
        await syncSpreadsheet(spreadsheetId);
      },
    });
  };

  const handleQuickOrderStatus = (order: ClientOrder, newStatus: OrderStatus) => {
    if (!workshopData || order.status === newStatus) return;
    const spreadsheetId = workshopData.spreadsheet.spreadsheetId;

    setPendingConfirm({
      title: 'Update Order Status in Google Sheets?',
      description: `Confirm changing status for order '${order.orderNumber}' in the '${TAB_NAMES.ORDERS}' tab.`,
      details: [
        { label: 'Order #', value: order.orderNumber },
        { label: 'Client', value: order.clientName },
        { label: 'Status Change', value: `${order.status} -> ${newStatus}` },
      ],
      confirmLabel: 'Update Status',
      tone: 'primary',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Session expired. Please sign in again.');
        await updateSheetRow(
          token,
          spreadsheetId,
          TAB_NAMES.ORDERS,
          order.rowIndex,
          orderToRow({ ...order, status: newStatus })
        );
        await syncSpreadsheet(spreadsheetId);
      },
    });
  };

  const handleDeleteOrder = (order: ClientOrder) => {
    if (!workshopData) return;
    const sheetId = getSheetIdByName(TAB_NAMES.ORDERS);
    if (sheetId === null) {
      setAppError("Cannot delete: 'Orders' tab not found in spreadsheet.");
      return;
    }
    const spreadsheetId = workshopData.spreadsheet.spreadsheetId;

    setPendingConfirm({
      title: 'Delete Client Order from Google Sheets?',
      description: `This will permanently remove row ${order.rowIndex} from the '${TAB_NAMES.ORDERS}' tab.`,
      details: [
        { label: 'Order #', value: order.orderNumber },
        { label: 'Client', value: order.clientName },
        { label: 'Project', value: order.projectTitle },
      ],
      confirmLabel: 'Delete Order',
      tone: 'danger',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Session expired. Please sign in again.');
        await deleteSheetRow(token, spreadsheetId, sheetId, order.rowIndex);
        await syncSpreadsheet(spreadsheetId);
      },
    });
  };

  /* -------------------- SETTINGS MUTATION -------------------- */
  const handleSaveSettings = (updated: WorkshopSettings) => {
    if (!workshopData) return;
    const spreadsheetId = workshopData.spreadsheet.spreadsheetId;

    setPendingConfirm({
      title: 'Save Workshop Settings to Google Sheets?',
      description: `Confirm updating your workshop profile and currency in the '${TAB_NAMES.SETTINGS}' tab.`,
      details: [
        { label: 'Workshop Name', value: updated.workshopName },
        { label: 'Currency', value: updated.currency },
        { label: 'Phone', value: updated.ownerPhone || '—' },
      ],
      confirmLabel: 'Save Settings',
      tone: 'primary',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Session expired. Please sign in again.');
        await saveWorkshopSettings(token, spreadsheetId, updated);
        await syncSpreadsheet(spreadsheetId);
      },
    });
  };

  /* -------------------- ADMIN CREDENTIAL MUTATIONS -------------------- */
  const handleCreateFirstAdmin = (payload: {
    adminId: string;
    password: string;
    displayName: string;
  }) => {
    if (!workshopData) return;
    const spreadsheetId = workshopData.spreadsheet.spreadsheetId;
    const hasAdminsTab = workshopData.spreadsheet.sheets.some(
      (s) => s.title === TAB_NAMES.ADMINS
    );
    const newAdmin: Omit<AdminCredential, 'rowIndex'> = {
      id: generateId('ADM'),
      adminId: payload.adminId,
      password: payload.password,
      displayName: payload.displayName,
      role: 'Owner',
      createdAt: getTodayISO(),
    };

    setAdminLoginOpen(false);
    setPendingConfirm({
      title: 'Create Primary Administrator Account?',
      description: hasAdminsTab
        ? `Confirm saving Admin ID '${newAdmin.adminId}' to the '${TAB_NAMES.ADMINS}' tab in Google Sheets.`
        : `Confirm creating the '${TAB_NAMES.ADMINS}' tab and saving Admin ID '${newAdmin.adminId}' to Google Sheets.`,
      details: [
        { label: 'Admin User ID', value: newAdmin.adminId },
        { label: 'Name', value: newAdmin.displayName },
        { label: 'Role', value: newAdmin.role },
      ],
      confirmLabel: 'Save & Open Overview',
      tone: 'primary',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Session expired. Please sign in again.');
        if (!hasAdminsTab) {
          await initializeMissingTabs(
            token,
            spreadsheetId,
            workshopData.spreadsheet.sheets,
            [TAB_NAMES.ADMINS]
          );
        }
        await appendSheetRow(token, spreadsheetId, TAB_NAMES.ADMINS, adminToRow(newAdmin));
        await syncSpreadsheet(spreadsheetId);
        setActiveAdmin({ ...newAdmin, rowIndex: 2 });
        setActiveTab('overview');
      },
    });
  };

  const handleAddAdmin = (data: Omit<AdminCredential, 'rowIndex'>) => {
    if (!workshopData) return;
    const spreadsheetId = workshopData.spreadsheet.spreadsheetId;
    const hasAdminsTab = workshopData.spreadsheet.sheets.some(
      (s) => s.title === TAB_NAMES.ADMINS
    );

    setPendingConfirm({
      title: 'Add Admin Account to Google Sheets?',
      description: `Confirm adding Admin ID '${data.adminId}' to the '${TAB_NAMES.ADMINS}' tab.`,
      details: [
        { label: 'Admin User ID', value: data.adminId },
        { label: 'Name', value: data.displayName },
        { label: 'Role', value: data.role },
      ],
      confirmLabel: 'Add Admin',
      tone: 'primary',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Session expired. Please sign in again.');
        if (!hasAdminsTab) {
          await initializeMissingTabs(
            token,
            spreadsheetId,
            workshopData.spreadsheet.sheets,
            [TAB_NAMES.ADMINS]
          );
        }
        await appendSheetRow(token, spreadsheetId, TAB_NAMES.ADMINS, adminToRow(data));
        await syncSpreadsheet(spreadsheetId);
      },
    });
  };

  const handleUpdateAdmin = (data: Omit<AdminCredential, 'rowIndex'>, rowIndex: number) => {
    if (!workshopData) return;
    const spreadsheetId = workshopData.spreadsheet.spreadsheetId;

    setPendingConfirm({
      title: 'Update Admin Credentials in Google Sheets?',
      description: `Confirm updating Admin ID '${data.adminId}' on row ${rowIndex} in the '${TAB_NAMES.ADMINS}' tab.`,
      details: [
        { label: 'Admin User ID', value: data.adminId },
        { label: 'Name', value: data.displayName },
        { label: 'Role', value: data.role },
      ],
      confirmLabel: 'Save Credentials',
      tone: 'primary',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Session expired. Please sign in again.');
        await updateSheetRow(
          token,
          spreadsheetId,
          TAB_NAMES.ADMINS,
          rowIndex,
          adminToRow(data)
        );
        await syncSpreadsheet(spreadsheetId);
        if (activeAdmin && activeAdmin.id === data.id) {
          setActiveAdmin({ ...data, rowIndex });
        }
      },
    });
  };

  const handleDeleteAdmin = (admin: AdminCredential) => {
    if (!workshopData) return;
    const sheetId = getSheetIdByName(TAB_NAMES.ADMINS);
    if (sheetId === null) {
      setAppError("Cannot delete: 'Admins' tab not found in spreadsheet.");
      return;
    }
    const spreadsheetId = workshopData.spreadsheet.spreadsheetId;

    setPendingConfirm({
      title: 'Remove Admin Account from Google Sheets?',
      description: `This will permanently revoke access for '${admin.adminId}' by removing row ${admin.rowIndex} from the '${TAB_NAMES.ADMINS}' tab.`,
      details: [
        { label: 'Admin User ID', value: admin.adminId },
        { label: 'Name', value: admin.displayName },
        { label: 'Role', value: admin.role },
      ],
      confirmLabel: 'Remove Admin',
      tone: 'danger',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Session expired. Please sign in again.');
        await deleteSheetRow(token, spreadsheetId, sheetId, admin.rowIndex);
        await syncSpreadsheet(spreadsheetId);
        if (activeAdmin && activeAdmin.id === admin.id) {
          setActiveAdmin(null);
        }
      },
    });
  };

  /* -------------------- WORKER LANDING INTAKE HANDLERS -------------------- */
  const handleWorkerSubmitNewEntry = (
    data: Omit<Transaction, 'rowIndex'>,
    onResetForm: () => void
  ) => {
    if (!workshopData) return;
    const spreadsheetId = workshopData.spreadsheet.spreadsheetId;
    const currency = workshopData.settings.currency;

    setPendingConfirm({
      title: 'Save New Entry to Google Sheets?',
      description: `Confirm saving this ${data.type.toLowerCase()} record to the '${TAB_NAMES.TRANSACTIONS}' tab.`,
      details: [
        { label: 'Date', value: data.date },
        { label: 'Type', value: data.type },
        { label: 'Category', value: data.category },
        { label: 'Description', value: data.description },
        { label: 'Amount', value: formatCurrency(data.amount, currency) },
      ],
      confirmLabel: 'Save Entry',
      tone: 'primary',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Session expired. Please sign in again.');
        await appendSheetRow(token, spreadsheetId, TAB_NAMES.TRANSACTIONS, transactionToRow(data));
        await syncSpreadsheet(spreadsheetId);
        onResetForm();
        setWorkerSavedMessage(
          `Saved ${data.type} entry (${formatCurrency(data.amount, currency)}) to Google Sheets.`
        );
      },
    });
  };

  const handleWorkerSubmitNewOrder = (
    data: Omit<ClientOrder, 'rowIndex'>,
    onResetForm: () => void
  ) => {
    if (!workshopData) return;
    const spreadsheetId = workshopData.spreadsheet.spreadsheetId;
    const currency = workshopData.settings.currency;

    setPendingConfirm({
      title: 'Save New Order to Google Sheets?',
      description: `Confirm creating order '${data.orderNumber}' for ${data.clientName} in the '${TAB_NAMES.ORDERS}' tab.`,
      details: [
        { label: 'Order #', value: data.orderNumber },
        { label: 'Client', value: data.clientName },
        { label: 'Project', value: data.projectTitle },
        { label: 'Total Price', value: formatCurrency(data.totalPrice, currency) },
        { label: 'Status', value: data.status },
      ],
      confirmLabel: 'Save Order',
      tone: 'primary',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Session expired. Please sign in again.');
        await appendSheetRow(token, spreadsheetId, TAB_NAMES.ORDERS, orderToRow(data));
        await syncSpreadsheet(spreadsheetId);
        onResetForm();
        setWorkerSavedMessage(
          `Saved client order ${data.orderNumber} (${data.clientName}) to Google Sheets.`
        );
      },
    });
  };

  // Screen 1: Google Sign-In Gate
  if (needsAuth) {
    return (
      <AuthGateView
        onSignIn={handleLogin}
        isLoggingIn={isLoggingIn}
        authError={authError}
      />
    );
  }

  // Screen 2: Loading active spreadsheet
  if (!workshopData && activeSpreadsheetId && isLoadingData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#060E1E] px-4 text-center text-[#EDF2FA]">
        <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" aria-hidden="true" />
        <p className="mt-4 font-display text-base font-semibold text-white">
          Loading Workshop Ledger from Google Sheets
        </p>
        <p className="mt-1 text-xs text-[#8DA6CA]">
          Reading Transactions, Inventory, Orders, and Settings...
        </p>
      </div>
    );
  }

  // Screen 3: Select / Create Google Sheet
  if (!workshopData) {
    return (
      <>
        <SpreadsheetConnectView
          userEmail={user?.email || ''}
          userName={user?.displayName || ''}
          discoveredFiles={discoveredFiles}
          isLoadingFiles={isLoadingFiles}
          error={appError}
          onRefreshFiles={fetchDriveSpreadsheets}
          onSelectSpreadsheet={syncSpreadsheet}
          onRequestCreateSpreadsheet={requestCreateSpreadsheet}
          onSignOut={handleSignOut}
        />
        <ConfirmActionModal
          pending={pendingConfirm}
          isSubmitting={isMutating}
          onCancel={() => setPendingConfirm(null)}
          onConfirm={executeConfirmedAction}
        />
      </>
    );
  }

  // Screen 4: Worker Landing Page (default view without Admin login)
  if (!activeAdmin) {
    return (
      <>
        <ShopFloorLanding
          workshopName={workshopData.settings.workshopName}
          nextOrderNumber={nextOrderNumber}
          lastSavedMessage={workerSavedMessage}
          onDismissSavedMessage={() => setWorkerSavedMessage(null)}
          onSubmitNewEntry={handleWorkerSubmitNewEntry}
          onSubmitNewOrder={handleWorkerSubmitNewOrder}
          onOpenAdminLogin={() => setAdminLoginOpen(true)}
        />
        <AdminLoginModal
          open={adminLoginOpen}
          admins={workshopData.admins}
          onClose={() => setAdminLoginOpen(false)}
          onLoginSuccess={(admin) => {
            setActiveAdmin(admin);
            setAdminLoginOpen(false);
            setActiveTab('overview');
          }}
          onCreateFirstAdmin={handleCreateFirstAdmin}
        />
        <ConfirmActionModal
          pending={pendingConfirm}
          isSubmitting={isMutating}
          onCancel={() => setPendingConfirm(null)}
          onConfirm={executeConfirmedAction}
        />
      </>
    );
  }

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'ledger', label: 'Income & Expenses', icon: Receipt },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'orders', label: 'Client Orders', icon: Briefcase },
    { id: 'admins', label: 'Admin Accounts', icon: Shield },
    { id: 'settings', label: 'Sheet & Settings', icon: Settings },
  ];

  const activeTitle = navItems.find((n) => n.id === activeTab)?.label || 'Overview';

  const handleHeaderPrimaryAction = () => {
    if (activeTab === 'inventory') {
      setEditingInv(null);
      setInvModalOpen(true);
    } else if (activeTab === 'orders') {
      setEditingOrder(null);
      setOrderModalOpen(true);
    } else {
      setEditingTx(null);
      setPaymentOrderTarget(null);
      setDefaultTxType('Income');
      setTxModalOpen(true);
    }
  };

  const headerPrimaryLabel =
    activeTab === 'inventory'
      ? 'Add Material'
      : activeTab === 'orders'
        ? 'New Order'
        : 'New Entry';

  return (
    <div className="min-h-screen bg-[#060E1E] text-[#EDF2FA] lg:flex">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-[#162949] bg-[#081226] lg:flex">
        <div>
          <div className="flex h-16 items-center gap-2.5 border-b border-[#162949] px-5">
            <WelderLogo size={34} className="shrink-0" />
            <span className="truncate font-display text-base font-bold text-white">
              {workshopData.settings.workshopName}
            </span>
          </div>

          <nav className="space-y-1 p-3" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex min-h-[42px] w-full items-center gap-3 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#152B52] text-white'
                      : 'text-[#8DA6CA] hover:bg-[#0D1A33] hover:text-white'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-[#60A5FA]' : 'text-[#6B87B0]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Sheet Connection & Account */}
        <div className="space-y-3 border-t border-[#162949] p-4 text-xs">
          <div className="rounded-lg border border-[#162949] bg-[#060E1E] p-3">
            <p className="font-medium text-white truncate">
              {workshopData.spreadsheet.title}
            </p>
            <p className="mt-0.5 text-[11px] text-[#7E97BC]">
              {lastSyncedAt ? `Synced at ${lastSyncedAt}` : 'Connected to Google Sheets'}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => syncSpreadsheet(workshopData.spreadsheet.spreadsheetId)}
                disabled={isLoadingData}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[#1E3A66] bg-[#0B172C] px-2.5 py-1.5 text-[11px] font-medium text-[#C5D5EC] hover:bg-[#132544] hover:text-white disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isLoadingData ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>Sync</span>
              </button>
              <a
                href={workshopData.spreadsheet.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open spreadsheet in Google Sheets"
                className="inline-flex items-center justify-center rounded-md border border-[#1E3A66] bg-[#0B172C] p-1.5 text-[#C5D5EC] hover:bg-[#132544] hover:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="min-w-0">
              <p className="truncate font-medium text-[#DCE7F7]">
                {activeAdmin.displayName} ({activeAdmin.adminId})
              </p>
              <p className="truncate text-[11px] text-[#7E97BC]">{activeAdmin.role}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveAdmin(null)}
                title="Lock Overview (Worker Landing View)"
                aria-label="Lock Overview and return to Worker Landing View"
                className="rounded-lg p-2 text-[#8FA8CC] hover:bg-[#132544] hover:text-white"
              >
                <Lock className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                title="Sign out of Google"
                aria-label="Sign out of Google"
                className="rounded-lg p-2 text-[#8FA8CC] hover:bg-[#132544] hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-[#030712]/80 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 flex w-72 max-w-[85vw] flex-col justify-between border-r border-[#162949] bg-[#081226]">
            <div>
              <div className="flex h-14 items-center justify-between border-b border-[#162949] px-4">
                <div className="flex items-center gap-2 min-w-0">
                  <WelderLogo size={30} className="shrink-0" />
                  <span className="truncate font-display text-sm font-bold text-white">
                    {workshopData.settings.workshopName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-[#8FA8CC] hover:text-white"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="space-y-1 p-3" aria-label="Mobile navigation">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#152B52] text-white'
                          : 'text-[#8DA6CA] hover:bg-[#0D1A33] hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-2.5 border-t border-[#162949] p-4 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveAdmin(null);
                }}
                className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-[#162E57] px-3 text-xs font-semibold text-white"
              >
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Worker Landing View</span>
              </button>
              <a
                href={workshopData.spreadsheet.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-[#1E3A66] bg-[#0B172C] px-3 text-xs font-medium text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Open Google Sheet</span>
              </a>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border border-[#1E3A66] px-3 text-xs font-medium text-[#C5D5EC]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-[#162949] bg-[#081226]/95 px-4 backdrop-blur-xs sm:h-16 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#193055] text-[#C5D5EC] hover:bg-[#132544] hover:text-white lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="truncate font-display text-base font-bold text-white sm:text-lg">
              {activeTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveAdmin(null)}
              className="hidden min-h-[38px] items-center gap-1.5 rounded-lg border border-[#1E3A66] bg-[#0B172C] px-3 py-1.5 text-xs font-medium text-[#C5D5EC] transition-colors hover:bg-[#132544] hover:text-white sm:inline-flex whitespace-nowrap shrink-0"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Worker View</span>
            </button>
            <button
              type="button"
              onClick={() => syncSpreadsheet(workshopData.spreadsheet.spreadsheetId)}
              disabled={isLoadingData}
              title="Reload data from Google Sheets"
              aria-label="Reload data from Google Sheets"
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#1E3A66] bg-[#0B172C] px-3 py-1.5 text-xs font-medium text-[#C5D5EC] transition-colors hover:bg-[#132544] hover:text-white disabled:opacity-50 lg:hidden"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoadingData ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Sync</span>
            </button>
            {activeTab !== 'admins' && activeTab !== 'settings' && (
              <button
                type="button"
                onClick={handleHeaderPrimaryAction}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{headerPrimaryLabel}</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-5 px-4 py-6 sm:px-6 lg:px-8">
          {appError && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-xs text-red-200"
            >
              <span className="inline-flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
                {appError}
              </span>
              <button
                type="button"
                onClick={() => setAppError(null)}
                className="rounded px-2 py-1 text-red-200 hover:bg-red-900/50"
              >
                Dismiss
              </button>
            </div>
          )}

          {workshopData.missingTabs.length > 0 && (
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-xs sm:flex-row sm:items-center">
              <p className="text-amber-200">
                This Google Sheet is missing tabs:{' '}
                <span className="font-mono font-semibold">
                  {workshopData.missingTabs.join(', ')}
                </span>
                . Add them to enable full workshop tracking.
              </p>
              <button
                type="button"
                onClick={requestInitializeMissingTabs}
                className="min-h-[36px] rounded-lg bg-amber-600 px-3.5 py-1.5 font-semibold text-white hover:bg-amber-500 whitespace-nowrap shrink-0"
              >
                Create Missing Tabs
              </button>
            </div>
          )}

          {activeTab === 'overview' && (
            <OverviewDashboard
              currency={workshopData.settings.currency}
              transactions={workshopData.transactions}
              inventory={workshopData.inventory}
              orders={workshopData.orders}
              onOpenNewTransaction={(type) => {
                setEditingTx(null);
                setPaymentOrderTarget(null);
                setDefaultTxType(type);
                setTxModalOpen(true);
              }}
              onOpenNewOrder={() => {
                setEditingOrder(null);
                setOrderModalOpen(true);
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'ledger' && (
            <LedgerView
              currency={workshopData.settings.currency}
              transactions={workshopData.transactions}
              orders={workshopData.orders}
              onAddClick={(type = 'Income') => {
                setEditingTx(null);
                setPaymentOrderTarget(null);
                setDefaultTxType(type);
                setTxModalOpen(true);
              }}
              onEditClick={(tx) => {
                setEditingTx(tx);
                setPaymentOrderTarget(null);
                setTxModalOpen(true);
              }}
              onDeleteClick={handleDeleteTransaction}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              currency={workshopData.settings.currency}
              inventory={workshopData.inventory}
              onAddClick={() => {
                setEditingInv(null);
                setInvModalOpen(true);
              }}
              onEditClick={(item) => {
                setEditingInv(item);
                setInvModalOpen(true);
              }}
              onDeleteClick={handleDeleteInventory}
              onAdjustQuantity={handleAdjustInventoryQuantity}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView
              currency={workshopData.settings.currency}
              orders={workshopData.orders}
              onAddClick={() => {
                setEditingOrder(null);
                setOrderModalOpen(true);
              }}
              onEditClick={(ord) => {
                setEditingOrder(ord);
                setOrderModalOpen(true);
              }}
              onDeleteClick={handleDeleteOrder}
              onQuickStatusChange={handleQuickOrderStatus}
              onRecordPayment={(ord) => {
                setEditingTx(null);
                setPaymentOrderTarget(ord);
                setDefaultTxType('Income');
                setTxModalOpen(true);
              }}
            />
          )}

          {activeTab === 'admins' && (
            <AdminAccountsView
              admins={workshopData.admins}
              currentAdminId={activeAdmin.adminId}
              onAddAdmin={handleAddAdmin}
              onUpdateAdmin={handleUpdateAdmin}
              onDeleteAdmin={handleDeleteAdmin}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              spreadsheet={workshopData.spreadsheet}
              settings={workshopData.settings}
              missingTabs={workshopData.missingTabs}
              onSaveSettings={handleSaveSettings}
              onInitializeMissingTabs={requestInitializeMissingTabs}
              onSwitchSpreadsheet={handleSwitchSpreadsheet}
              onSyncNow={() => syncSpreadsheet(workshopData.spreadsheet.spreadsheetId)}
              isSyncing={isLoadingData}
            />
          )}
        </main>
      </div>

      {/* Entry Modals */}
      <TransactionModal
        open={txModalOpen}
        initialTx={editingTx}
        defaultType={defaultTxType}
        prefillOrder={paymentOrderTarget}
        orders={workshopData.orders}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTx(null);
          setPaymentOrderTarget(null);
        }}
        onSubmit={handleTransactionFormSubmit}
      />

      <InventoryModal
        open={invModalOpen}
        initialItem={editingInv}
        onClose={() => {
          setInvModalOpen(false);
          setEditingInv(null);
        }}
        onSubmit={handleInventoryFormSubmit}
      />

      <OrderModal
        open={orderModalOpen}
        initialOrder={editingOrder}
        nextOrderNumber={nextOrderNumber}
        onClose={() => {
          setOrderModalOpen(false);
          setEditingOrder(null);
        }}
        onSubmit={handleOrderFormSubmit}
      />

      {/* Explicit Confirmation Modal for ALL Google Sheets Mutations */}
      <ConfirmActionModal
        pending={pendingConfirm}
        isSubmitting={isMutating}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={executeConfirmedAction}
      />
    </div>
  );
}
