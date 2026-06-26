import { InventoryItem } from './inventory.models';

export interface ScoutDto {
  id: number;
  name: string;
  email: string;
  tagId: string;
  profitSharePercent: number;
}

export interface ScoutDashboardDto {
  scout: ScoutDto;
  itemCount: number;
  purchaseCosts: number;
  totalReturn: number;
  itemsProcessing: number;
  itemsListed: number;
  itemsSold: number;
  items: InventoryItem[];
}

export interface CreateScoutDto {
  name: string;
  email: string;
  tagId: string;
  profitSharePercent: number;
}
