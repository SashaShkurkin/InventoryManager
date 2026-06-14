import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ItemCardComponent } from '../../shared/components/item-card/item-card.component';
import { InventoryService } from '../../core/services/inventory.service';
import { DashboardData, InventoryItem } from '../../core/models/inventory.models';

type SortOption = 'recent' | 'oldest' | 'price-high' | 'price-low' | 'sku';
type ViewMode  = 'grid' | 'list';

interface StateGroup {
  state: string;
  icon: string;
  color: string;
  items: InventoryItem[];
}

const ALL_GROUPS: Omit<StateGroup, 'items'>[] = [
  { state: 'Processing', icon: 'pending',      color: '#f59e0b' },
  { state: 'Listed',     icon: 'storefront',   color: '#10b981' },
  { state: 'Sold',       icon: 'check_circle', color: '#6366f1' },
  { state: 'Archived',   icon: 'archive',      color: '#9ca3af' },
];

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    FormsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    ItemCardComponent
  ],
  template: `
    <div class="overview-page">

      <!-- Top actions -->
      <div class="top-actions">
        <button mat-flat-button color="primary" (click)="addNew()">
          <mat-icon>add</mat-icon> New Item
        </button>
        <span class="spacer"></span>
        <mat-form-field appearance="outline" class="sort-field">
          <mat-label>Organize by</mat-label>
          <mat-select [value]="sortBy()" (valueChange)="sortBy.set($event)">
            <mat-option value="recent">Recent Date Acquired</mat-option>
            <mat-option value="oldest">Oldest Date Acquired</mat-option>
            <mat-option value="price-high">Listed Price High to Low</mat-option>
            <mat-option value="price-low">Listed Price Low to High</mat-option>
            <mat-option value="sku">By SKU (first 4)</mat-option>
          </mat-select>
        </mat-form-field>
        <div class="view-toggle">
          <button mat-icon-button [class.active]="viewMode() === 'grid'"
                  matTooltip="Grid view" (click)="viewMode.set('grid')">
            <mat-icon>grid_view</mat-icon>
          </button>
          <button mat-icon-button [class.active]="viewMode() === 'list'"
                  matTooltip="List view" (click)="viewMode.set('list')">
            <mat-icon>view_list</mat-icon>
          </button>
        </div>
      </div>

      <!-- State filter chips -->
      <div class="state-filters">
        @for (g of allGroups; track g.state) {
          <button class="filter-chip"
                  [class.active]="activeStates().has(g.state)"
                  [style.--chip-color]="g.color"
                  (click)="toggleState(g.state)">
            <span class="chip-dot"></span>
            {{ g.state }}
            <span class="chip-count">({{ countFor(g.state) }})</span>
          </button>
        }
      </div>

      <!-- Dashboard cards -->
      @if (loading()) {
        <div class="spinner-wrap"><mat-spinner diameter="40" /></div>
      } @else {
        @if (dashboard()) {
          <section class="dashboard-grid">
            <mat-card class="dash-card">
              <mat-card-header>
                <mat-icon mat-card-avatar color="primary">trending_up</mat-icon>
                <mat-card-title>Revenue YTD</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p class="dash-value">{{ dashboard()!.revenueYtd | currency }}</p>
              </mat-card-content>
            </mat-card>
            <mat-card class="dash-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>savings</mat-icon>
                <mat-card-title>Profit YTD</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p class="dash-value">{{ dashboard()!.profitYtd | currency }}</p>
              </mat-card-content>
            </mat-card>
            <mat-card class="dash-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>calendar_today</mat-icon>
                <mat-card-title>Revenue MTD</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p class="dash-value">{{ dashboard()!.revenueMtd | currency }}</p>
              </mat-card-content>
            </mat-card>
            <mat-card class="dash-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>sell</mat-icon>
                <mat-card-title>Items Sold MTD</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p class="dash-value">{{ dashboard()!.itemsSoldMtd }}</p>
                <p class="dash-sub">{{ dashboard()!.itemsSoldYtd }} YTD</p>
              </mat-card-content>
            </mat-card>
          </section>
        }

        @for (group of visibleGroups(); track group.state) {
          <section class="inventory-group">
            <h2 class="group-header" [style.--hdr-color]="group.color">
              <mat-icon class="state-icon">{{ group.icon }}</mat-icon>
              {{ group.state }}
              <span class="count">({{ group.items.length }})</span>
            </h2>

            @if (group.items.length === 0) {
              <p class="empty-group">No items in this category.</p>
            }

            <!-- Grid view -->
            @if (viewMode() === 'grid' && group.items.length > 0) {
              <div class="card-grid">
                @for (item of group.items; track item.id) {
                  <app-item-card [item]="item" />
                }
              </div>
            }

            <!-- List view -->
            @if (viewMode() === 'list' && group.items.length > 0) {
              <div class="list-view">
                @for (item of group.items; track item.id) {
                  <div class="list-row" (click)="navigate(item.sku)"
                       tabindex="0" (keydown.enter)="navigate(item.sku)">
                    <div class="list-thumb">
                      @if (item.firstImageId) {
                        <img [src]="inventoryService.imageDataUrl(item.sku, item.firstImageId)"
                             [alt]="item.title" />
                      } @else {
                        <mat-icon class="thumb-placeholder">chair</mat-icon>
                      }
                    </div>
                    <span class="list-sku">{{ item.sku }}</span>
                    <span class="list-title">{{ item.title }}</span>
                    <span class="list-type">
                      {{ item.type }}{{ item.subType ? ' · ' + item.subType : '' }}
                    </span>
                    <span class="list-date">{{ item.dateAcquired ?? '—' }}</span>
                    <span class="list-price">{{ item.listPrice | currency }}</span>
                  </div>
                }
              </div>
            }
          </section>
        }
      }
    </div>
  `,
  styles: [`
    .overview-page { padding-bottom: 32px; }

    /* ── Top bar ── */
    .top-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .spacer { flex: 1; }
    .sort-field { width: 240px; margin-bottom: -1.25em; }
    .view-toggle {
      display: flex;
      gap: 2px;
      button { color: #aaa; }
      button.active { color: var(--mat-sys-primary); }
    }

    /* ── State filter chips ── */
    .state-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 24px;
    }

    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px 5px 10px;
      border-radius: 999px;
      border: 2px solid #e0e0e0;
      background: #fff;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: #666;
      transition: all 0.15s;

      .chip-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #ccc;
        flex-shrink: 0;
        transition: background 0.15s;
      }

      .chip-count {
        font-weight: 400;
        color: #aaa;
        font-size: 12px;
      }

      &:hover {
        border-color: var(--chip-color, #999);
        color: #333;
      }

      &.active {
        border-color: var(--chip-color, #999);
        background: color-mix(in srgb, var(--chip-color, #999) 10%, white);
        color: #333;

        .chip-dot { background: var(--chip-color, #999); }
        .chip-count { color: #666; }
      }
    }

    /* ── Spinner ── */
    .spinner-wrap { display: flex; justify-content: center; padding: 48px; }

    /* ── Dashboard ── */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .dash-card {
      text-align: center;
      mat-icon { font-size: 28px; color: var(--mat-sys-primary); }
    }
    .dash-value {
      font-size: 1.6rem;
      font-weight: 700;
      margin: 8px 0 0;
      color: var(--mat-sys-on-surface);
    }
    .dash-sub { font-size: 0.85rem; color: #888; margin: 2px 0 0; }

    /* ── Section headers (sticky) ── */
    .inventory-group { margin-bottom: 28px; }

    .group-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #444;
      border-bottom: 3px solid var(--hdr-color, #eee);
      padding: 10px 0 8px;
      margin-bottom: 16px;
      position: sticky;
      top: 64px;
      background: var(--mat-sys-surface, #fff);
      z-index: 5;

      .state-icon { color: var(--hdr-color, #888); font-size: 20px; }
    }

    .count { font-weight: 400; color: #aaa; font-size: 0.9rem; }
    .empty-group { color: #bbb; font-size: 13px; font-style: italic; padding: 0 0 8px; }

    /* ── Grid view ── */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    /* ── List view ── */
    .list-view {
      display: flex;
      flex-direction: column;
      border: 1px solid #eee;
      border-radius: 8px;
      overflow: hidden;
    }

    .list-row {
      display: grid;
      grid-template-columns: 48px 100px 1fr 140px 110px 100px;
      align-items: center;
      gap: 12px;
      padding: 5px 12px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background 0.12s;
      &:last-child { border-bottom: none; }
      &:hover { background: #fafafa; }
    }

    .list-thumb {
      width: 40px;
      height: 40px;
      border-radius: 5px;
      background: #f5f5f5;
      overflow: hidden;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      img { width: 100%; height: 100%; object-fit: cover; }
    }
    .thumb-placeholder { font-size: 20px; color: #ccc; }

    .list-sku  { font-family: monospace; font-size: 11px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .list-title { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .list-type  { font-size: 12px; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .list-date  { font-size: 12px; color: #aaa; white-space: nowrap; }
    .list-price { font-size: 13px; font-weight: 600; color: var(--mat-sys-primary); text-align: right; white-space: nowrap; }

    /* ── Mobile ── */
    @media (max-width: 600px) {
      .top-actions { flex-wrap: wrap; }
      .sort-field { width: 100%; }
      .card-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .dashboard-grid { grid-template-columns: 1fr 1fr; }
      .dash-value { font-size: 1.2rem; }
      .group-header { top: 56px; }
      .list-row { grid-template-columns: 40px 1fr 80px; }
      .list-sku, .list-type, .list-date { display: none; }
    }
  `]
})
export class OverviewComponent implements OnInit {
  loading  = signal(true);
  dashboard = signal<DashboardData | null>(null);
  groups   = signal<StateGroup[]>([]);
  sortBy   = signal<SortOption>('recent');
  viewMode = signal<ViewMode>('grid');
  activeStates = signal<Set<string>>(new Set(['Processing', 'Listed', 'Sold']));

  readonly allGroups = ALL_GROUPS;

  sortedGroups = computed(() => {
    const sort = this.sortBy();
    return this.groups().map(g => ({
      ...g,
      items: this.sortItems([...g.items], sort)
    }));
  });

  visibleGroups = computed(() =>
    this.sortedGroups().filter(g => this.activeStates().has(g.state))
  );

  constructor(public inventoryService: InventoryService, private router: Router) {}

  ngOnInit() {
    this.inventoryService.getDashboard().subscribe({
      next: data => this.dashboard.set(data),
      error: () => {}
    });

    forkJoin({
      main:     this.inventoryService.getAll({ pageSize: 500 }),
      archived: this.inventoryService.getAll({ state: 'Archived', pageSize: 500 })
    }).subscribe({
      next: ({ main, archived }) => {
        const all = [...main.items, ...archived.items];
        const groups: StateGroup[] = ALL_GROUPS.map(g => ({
          ...g,
          items: all.filter(i => i.state === g.state)
        }));
        this.groups.set(groups);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleState(state: string) {
    this.activeStates.update(s => {
      const next = new Set(s);
      next.has(state) ? next.delete(state) : next.add(state);
      return next;
    });
  }

  countFor(state: string): number {
    return this.groups().find(g => g.state === state)?.items.length ?? 0;
  }

  addNew() { this.router.navigate(['/item/new/edit']); }
  navigate(sku: string) { this.router.navigate(['/item', sku]); }

  private sortItems(items: InventoryItem[], sort: SortOption): InventoryItem[] {
    switch (sort) {
      case 'recent':     return items.sort((a, b) => this.cmpDate(b.dateAcquired, a.dateAcquired));
      case 'oldest':     return items.sort((a, b) => this.cmpDate(a.dateAcquired, b.dateAcquired));
      case 'price-high': return items.sort((a, b) => (b.listPrice ?? 0) - (a.listPrice ?? 0));
      case 'price-low':  return items.sort((a, b) => (a.listPrice ?? 0) - (b.listPrice ?? 0));
      case 'sku':        return items.sort((a, b) => a.sku.slice(0, 4).localeCompare(b.sku.slice(0, 4)));
    }
  }

  private cmpDate(a?: string, b?: string): number {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a < b ? -1 : a > b ? 1 : 0;
  }
}
