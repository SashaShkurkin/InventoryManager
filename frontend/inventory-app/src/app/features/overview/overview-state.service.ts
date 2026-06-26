import { Injectable, signal } from '@angular/core';
import { DashboardData, InventoryItem } from '../../core/models/inventory.models';

export type SortOption = 'recent' | 'oldest' | 'price-high' | 'price-low' | 'sku';
export type ViewMode   = 'grid' | 'list';

export interface StateGroup {
  state: string;
  icon: string;
  color: string;
  items: InventoryItem[];
}

@Injectable({ providedIn: 'root' })
export class OverviewStateService {
  sortBy        = signal<SortOption>('recent');
  viewMode      = signal<ViewMode>('grid');
  activeStates  = signal<Set<string>>(new Set(['PendingSale', 'Listed']));
  showDashboard = signal(false);
  groups        = signal<StateGroup[]>([]);
  dashboard     = signal<DashboardData | null>(null);
  // null = never loaded; true/false = loaded as owner / public
  loadedAsOwner = signal<boolean | null>(null);
  scrollY       = signal(0);
}
