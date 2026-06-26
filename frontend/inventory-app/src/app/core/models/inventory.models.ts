export type ItemState = 'Processing' | 'Listed' | 'PendingSale' | 'Sold' | 'Archived';

export interface InventoryItem {
  id: number;
  sku: string;
  title: string;
  description?: string;
  acquisitionCost?: number;
  laborCost?: number;
  materialsCost?: number;
  prepCost?: number;
  travelCost?: number;
  shippingCost?: number;
  listPrice?: number;
  soldPrice?: number;
  profit?: number;
  type?: string;
  subType?: string;
  style?: string;
  color?: string;
  tags?: string;
  costCode?: string;
  imageUrl?: string;
  dateAcquired?: string;
  dateListed?: string;
  dateSold?: string;
  state: ItemState;
  createdAt: string;
  updatedAt: string;
  firstImageId?: number;

  // Dimensions
  height?: number;
  width?: number;
  lengthDepth?: number;

  // Pending Sale details
  agreedPrice?: number;
  pendingSaleDate?: string;
  pendingSaleTime?: string;
  pendingSaleMethod?: string;
}

export interface ItemImage {
  id: number;
  sortOrder: number;
}

export interface InventoryListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: InventoryItem[];
}

export interface SearchSuggestion {
  sku: string;
  title: string;
  listPrice?: number;
  imageUrl?: string;
  firstImageId?: number;
}

export interface DashboardData {
  revenueYtd: number;
  profitYtd: number;
  revenueMtd: number;
  profitMtd: number;
  itemsSoldYtd: number;
  itemsSoldMtd: number;
  rolling90DayRoiPct: number;
  rolling90DayItemCount: number;
  listedCostBasis: number;
  projectedReturn: number;
  projectedProfit: number;
  profitVelocity10k: number;
  weekSalesRevenue: number;
  weekAcquisitionCost: number;
}

// ── Expenses ─────────────────────────────────────────────────────────────────

export type ExpenseType =
  | 'Fuel'
  | 'Inventory'
  | 'Advertising'
  | 'Software'
  | 'FurnitureMaterials'
  | 'OfficeSupplies';

export const EXPENSE_TYPES: { value: ExpenseType; label: string }[] = [
  { value: 'Fuel',              label: 'Fuel' },
  { value: 'Inventory',        label: 'Inventory' },
  { value: 'Advertising',      label: 'Advertising' },
  { value: 'Software',         label: 'Software' },
  { value: 'FurnitureMaterials', label: 'Furniture Materials' },
  { value: 'OfficeSupplies',   label: 'Office Supplies' },
];

export interface Expense {
  id: number;
  expenseCode: string;
  type: string;
  title: string;
  amount?: number;
  paymentMethod?: string;
  notes?: string;
  date: string;
  address?: string;
  hasReceipt: boolean;
  createdAt: string;
}

export interface CreateExpense {
  type: string;
  title: string;
  amount?: number;
  paymentMethod?: string;
  notes?: string;
  date: string;
  address?: string;
}

export interface ExpenseListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: Expense[];
}

// ─────────────────────────────────────────────────────────────────────────────

export interface CreateInventoryItem {
  sku: string;
  title: string;
  description?: string;
  acquisitionCost?: number;
  laborCost?: number;
  materialsCost?: number;
  prepCost?: number;
  travelCost?: number;
  shippingCost?: number;
  listPrice?: number;
  soldPrice?: number;
  profit?: number;
  type?: string;
  subType?: string;
  style?: string;
  color?: string;
  tags?: string;
  imageUrl?: string;
  dateAcquired?: string;
  dateListed?: string;
  dateSold?: string;
  state: ItemState;

  // Dimensions
  height?: number;
  width?: number;
  lengthDepth?: number;

  // Pending Sale details
  agreedPrice?: number;
  pendingSaleDate?: string;
  pendingSaleTime?: string;
  pendingSaleMethod?: string;
}
