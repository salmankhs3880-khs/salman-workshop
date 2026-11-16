import {
  AdminCredential,
  ClientOrder,
  DriveSpreadsheetFile,
  InventoryItem,
  OrderStatus,
  SheetTabInfo,
  SpreadsheetInfo,
  Transaction,
  TransactionType,
  WorkshopData,
  WorkshopSettings,
} from '../types/workshop';

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_BASE = 'https://www.googleapis.com/drive/v3/files';

export const TAB_NAMES = {
  TRANSACTIONS: 'Transactions',
  INVENTORY: 'Inventory',
  ORDERS: 'Orders',
  SETTINGS: 'Settings',
  ADMINS: 'Admins',
} as const;

export const TAB_HEADERS: Record<string, string[]> = {
  [TAB_NAMES.TRANSACTIONS]: [
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
  [TAB_NAMES.INVENTORY]: [
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
  [TAB_NAMES.ORDERS]: [
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
    'Status',
    'Notes',
  ],
  [TAB_NAMES.SETTINGS]: ['Key', 'Value'],
  [TAB_NAMES.ADMINS]: ['ID', 'AdminId', 'Password', 'DisplayName', 'Role', 'CreatedAt'],
};

export class GoogleApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'GoogleApiError';
    this.status = status;
  }
}

async function googleFetch<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Google API request failed (${res.status})`;
    try {
      const errBody = await res.json();
      if (errBody?.error?.message) {
        message = errBody.error.message;
      }
    } catch {
      // keep default message
    }
    throw new GoogleApiError(message, res.status);
  }

  return res.json();
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export async function findAppSpreadsheets(token: string): Promise<DriveSpreadsheetFile[]> {
  const query = encodeURIComponent(
    "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false"
  );
  const fields = encodeURIComponent('files(id,name,modifiedTime,webViewLink)');
  const data = await googleFetch<{ files?: DriveSpreadsheetFile[] }>(
    `${DRIVE_BASE}?q=${query}&fields=${fields}&orderBy=modifiedTime desc&pageSize=20`,
    token
  );
  return data.files || [];
}

export async function getSpreadsheetMetadata(
  token: string,
  spreadsheetId: string
): Promise<SpreadsheetInfo> {
  const fields = encodeURIComponent(
    'spreadsheetId,spreadsheetUrl,properties.title,sheets.properties(sheetId,title)'
  );
  const data = await googleFetch<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    properties?: { title?: string };
    sheets?: { properties: { sheetId: number; title: string } }[];
  }>(`${SHEETS_BASE}/${encodeURIComponent(spreadsheetId)}?fields=${fields}`, token);

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Workshop Spreadsheet',
    spreadsheetUrl:
      data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`,
    sheets: (data.sheets || []).map((s) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
    })),
  };
}

export async function createWorkshopSpreadsheet(
  token: string,
  workshopName = 'IronWeld Fabrication'
): Promise<string> {
  const title = `${workshopName} — Ledger`;
  const created = await googleFetch<{
    spreadsheetId: string;
    sheets: { properties: { sheetId: number; title: string } }[];
  }>(SHEETS_BASE, token, {
    method: 'POST',
    body: JSON.stringify({
      properties: { title },
      sheets: [
        { properties: { title: TAB_NAMES.TRANSACTIONS, gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: TAB_NAMES.INVENTORY, gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: TAB_NAMES.ORDERS, gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: TAB_NAMES.SETTINGS, gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: TAB_NAMES.ADMINS, gridProperties: { frozenRowCount: 1 } } },
      ],
    }),
  });

  const spreadsheetId = created.spreadsheetId;

  // Populate headers and default settings
  await googleFetch(`${SHEETS_BASE}/${spreadsheetId}/values:batchUpdate`, token, {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: `'${TAB_NAMES.TRANSACTIONS}'!A1:J1`,
          values: [TAB_HEADERS[TAB_NAMES.TRANSACTIONS]],
        },
        {
          range: `'${TAB_NAMES.INVENTORY}'!A1:K1`,
          values: [TAB_HEADERS[TAB_NAMES.INVENTORY]],
        },
        {
          range: `'${TAB_NAMES.ORDERS}'!A1:L1`,
          values: [TAB_HEADERS[TAB_NAMES.ORDERS]],
        },
        {
          range: `'${TAB_NAMES.SETTINGS}'!A1:B5`,
          values: [
            TAB_HEADERS[TAB_NAMES.SETTINGS],
            ['workshopName', workshopName],
            ['currency', 'USD'],
            ['ownerPhone', ''],
            ['shopAddress', ''],
          ],
        },
        {
          range: `'${TAB_NAMES.ADMINS}'!A1:F1`,
          values: [TAB_HEADERS[TAB_NAMES.ADMINS]],
        },
      ],
    }),
  });

  // Format header rows cleanly with navy fill & bold white text
  const formatRequests = created.sheets.map((s) => ({
    repeatCell: {
      range: {
        sheetId: s.properties.sheetId,
        startRowIndex: 0,
        endRowIndex: 1,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.06, green: 0.13, blue: 0.27 },
          textFormat: {
            foregroundColor: { red: 1, green: 1, blue: 1 },
            bold: true,
          },
        },
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat)',
    },
  }));

  await googleFetch(`${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, token, {
    method: 'POST',
    body: JSON.stringify({ requests: formatRequests }),
  });

  return spreadsheetId;
}

export async function initializeMissingTabs(
  token: string,
  spreadsheetId: string,
  existingSheets: SheetTabInfo[],
  missingTabs: string[]
): Promise<void> {
  if (missingTabs.length === 0) return;

  const existingTitles = new Set(existingSheets.map((s) => s.title));
  const tabsToCreate = missingTabs.filter((t) => !existingTitles.has(t));

  if (tabsToCreate.length > 0) {
    await googleFetch(`${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, token, {
      method: 'POST',
      body: JSON.stringify({
        requests: tabsToCreate.map((title) => ({
          addSheet: {
            properties: {
              title,
              gridProperties: { frozenRowCount: 1 },
            },
          },
        })),
      }),
    });
  }

  const valueData = tabsToCreate.map((tab) => {
    const headers = TAB_HEADERS[tab] || [];
    if (tab === TAB_NAMES.SETTINGS) {
      return {
        range: `'${tab}'!A1:B5`,
        values: [
          headers,
          ['workshopName', 'IronWeld Fabrication'],
          ['currency', 'USD'],
          ['ownerPhone', ''],
          ['shopAddress', ''],
        ],
      };
    }
    return {
      range: `'${tab}'!A1`,
      values: [headers],
    };
  });

  if (valueData.length > 0) {
    await googleFetch(`${SHEETS_BASE}/${spreadsheetId}/values:batchUpdate`, token, {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueData,
      }),
    });
  }
}

function parseNumber(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export async function loadWorkshopData(
  token: string,
  spreadsheetId: string
): Promise<WorkshopData> {
  const spreadsheet = await getSpreadsheetMetadata(token, spreadsheetId);
  const existingTitles = new Set(spreadsheet.sheets.map((s) => s.title));

  const requiredTabs = [
    TAB_NAMES.TRANSACTIONS,
    TAB_NAMES.INVENTORY,
    TAB_NAMES.ORDERS,
    TAB_NAMES.SETTINGS,
    TAB_NAMES.ADMINS,
  ];
  const missingTabs = requiredTabs.filter((t) => !existingTitles.has(t));
  const presentTabs = requiredTabs.filter((t) => existingTitles.has(t));

  const transactions: Transaction[] = [];
  const inventory: InventoryItem[] = [];
  const orders: ClientOrder[] = [];
  const admins: AdminCredential[] = [];
  const settings: WorkshopSettings = {
    workshopName: 'IronWeld Fabrication',
    currency: 'USD',
    ownerPhone: '',
    shopAddress: '',
  };

  if (presentTabs.length === 0) {
    return {
      spreadsheet,
      transactions,
      inventory,
      orders,
      settings,
      admins,
      missingTabs,
    };
  }

  const rangesQuery = presentTabs
    .map((tab) => `ranges=${encodeURIComponent(`'${tab}'!A1:Z`)}`)
    .join('&');

  const batchResult = await googleFetch<{
    valueRanges?: { range: string; values?: string[][] }[];
  }>(`${SHEETS_BASE}/${spreadsheetId}/values:batchGet?${rangesQuery}`, token);

  const valueRanges = batchResult.valueRanges || [];

  presentTabs.forEach((tab, idx) => {
    const rows = valueRanges[idx]?.values || [];
    if (rows.length <= 1) return; // header only or empty

    if (tab === TAB_NAMES.TRANSACTIONS) {
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.every((c) => !String(c).trim())) continue;
        const rawType = String(r[2] || '').trim();
        const type: TransactionType = rawType === 'Expense' ? 'Expense' : 'Income';
        transactions.push({
          rowIndex: i + 1,
          id: r[0] || `TX-${i}`,
          date: r[1] || '',
          type,
          category: r[3] || 'Uncategorized',
          description: r[4] || '',
          clientOrVendor: r[5] || '',
          orderRef: r[6] || '',
          amount: parseNumber(r[7]),
          paymentMethod: r[8] || 'Cash',
          notes: r[9] || '',
        });
      }
    } else if (tab === TAB_NAMES.INVENTORY) {
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.every((c) => !String(c).trim())) continue;
        inventory.push({
          rowIndex: i + 1,
          id: r[0] || `INV-${i}`,
          sku: r[1] || '',
          materialName: r[2] || '',
          category: r[3] || 'Raw Steel & Plates',
          specification: r[4] || '',
          quantity: parseNumber(r[5]),
          unit: r[6] || 'pcs',
          minThreshold: parseNumber(r[7]),
          unitCost: parseNumber(r[8]),
          supplier: r[9] || '',
          lastUpdated: r[10] || '',
        });
      }
    } else if (tab === TAB_NAMES.ORDERS) {
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.every((c) => !String(c).trim())) continue;
        const status = (r[10] || 'Quoted') as OrderStatus;
        orders.push({
          rowIndex: i + 1,
          id: r[0] || `ORD-${i}`,
          orderNumber: r[1] || '',
          clientName: r[2] || '',
          clientPhone: r[3] || '',
          projectTitle: r[4] || '',
          materialSpec: r[5] || '',
          orderDate: r[6] || '',
          dueDate: r[7] || '',
          totalPrice: parseNumber(r[8]),
          depositPaid: parseNumber(r[9]),
          status,
          notes: r[11] || '',
        });
      }
    } else if (tab === TAB_NAMES.SETTINGS) {
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[0]) continue;
        const key = String(r[0]).trim();
        const val = String(r[1] ?? '').trim();
        if (key === 'workshopName' && val) settings.workshopName = val;
        if (key === 'currency' && val) settings.currency = val;
        if (key === 'ownerPhone') settings.ownerPhone = val;
        if (key === 'shopAddress') settings.shopAddress = val;
      }
    } else if (tab === TAB_NAMES.ADMINS) {
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.every((c) => !String(c).trim())) continue;
        const adminId = String(r[1] ?? '').trim();
        const password = String(r[2] ?? '').trim();
        if (!adminId) continue;
        admins.push({
          rowIndex: i + 1,
          id: r[0] || `ADM-${i}`,
          adminId,
          password,
          displayName: String(r[3] ?? '').trim() || adminId,
          role: String(r[4] ?? '').trim() || 'Admin',
          createdAt: String(r[5] ?? '').trim(),
        });
      }
    }
  });

  return {
    spreadsheet,
    transactions,
    inventory,
    orders,
    settings,
    admins,
    missingTabs,
  };
}

export async function appendSheetRow(
  token: string,
  spreadsheetId: string,
  tabName: string,
  rowValues: (string | number)[]
): Promise<void> {
  const range = encodeURIComponent(`'${tabName}'!A1`);
  await googleFetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );
}

export async function updateSheetRow(
  token: string,
  spreadsheetId: string,
  tabName: string,
  rowIndex: number,
  rowValues: (string | number)[]
): Promise<void> {
  const range = encodeURIComponent(`'${tabName}'!A${rowIndex}`);
  await googleFetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );
}

export async function deleteSheetRow(
  token: string,
  spreadsheetId: string,
  sheetId: number,
  rowIndex: number
): Promise<void> {
  await googleFetch(`${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, token, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        },
      ],
    }),
  });
}

export async function saveWorkshopSettings(
  token: string,
  spreadsheetId: string,
  settings: WorkshopSettings
): Promise<void> {
  const range = encodeURIComponent(`'${TAB_NAMES.SETTINGS}'!A1:B5`);
  await googleFetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({
        values: [
          ['Key', 'Value'],
          ['workshopName', settings.workshopName],
          ['currency', settings.currency],
          ['ownerPhone', settings.ownerPhone],
          ['shopAddress', settings.shopAddress],
        ],
      }),
    }
  );
}

export function transactionToRow(tx: Omit<Transaction, 'rowIndex'>): (string | number)[] {
  return [
    tx.id,
    tx.date,
    tx.type,
    tx.category,
    tx.description,
    tx.clientOrVendor,
    tx.orderRef,
    tx.amount,
    tx.paymentMethod,
    tx.notes,
  ];
}

export function inventoryToRow(item: Omit<InventoryItem, 'rowIndex'>): (string | number)[] {
  return [
    item.id,
    item.sku,
    item.materialName,
    item.category,
    item.specification,
    item.quantity,
    item.unit,
    item.minThreshold,
    item.unitCost,
    item.supplier,
    item.lastUpdated,
  ];
}

export function orderToRow(order: Omit<ClientOrder, 'rowIndex'>): (string | number)[] {
  return [
    order.id,
    order.orderNumber,
    order.clientName,
    order.clientPhone,
    order.projectTitle,
    order.materialSpec,
    order.orderDate,
    order.dueDate,
    order.totalPrice,
    order.depositPaid,
    order.status,
    order.notes,
  ];
}

export function adminToRow(admin: Omit<AdminCredential, 'rowIndex'>): (string | number)[] {
  return [
    admin.id,
    admin.adminId,
    admin.password,
    admin.displayName,
    admin.role,
    admin.createdAt,
  ];
}
