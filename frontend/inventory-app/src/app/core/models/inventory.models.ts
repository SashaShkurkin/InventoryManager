export type ItemState = 'Processing' | 'Listed' | 'Sold' | 'Archived';

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
  imageUrl?: string;
  dateAcquired?: string;
  dateListed?: string;
  dateSold?: string;
  state: ItemState;
  createdAt: string;
  updatedAt: string;
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
}

export interface DashboardData {
  revenueYtd: number;
  profitYtd: number;
  revenueMtd: number;
  profitMtd: number;
  itemsSoldYtd: number;
  itemsSoldMtd: number;
}

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
}
