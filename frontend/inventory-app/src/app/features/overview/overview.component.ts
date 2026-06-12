import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ItemCardComponent } from '../../shared/components/item-card/item-card.component';
import { InventoryService } from '../../core/services/inventory.service';
import { DashboardData, InventoryItem } from '../../core/models/inventory.models';

type SortOption = 'recent' | 'oldest' | 'price-high' | 'price-low' | 'sku';

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

        @for (group of sortedGroups(); track group.state) {
          @if (group.items.length > 0) {
            <section class="inventory-group">
              <h2 class="group-header">
                <mat-icon class="state-icon" [class]="group.state.toLowerCase()">{{ group.icon }}</mat-icon>
                {{ group.state }}
                <span class="count">({{ group.items.length }})</span>
              </h2>
              <div class="card-grid">
                @for (item of group.items; track item.id) {
                  <app-item-card [item]="item" />
                }
              </div>
            </section>
          }
        }
      }
    </div>
  `,
  styles: [`
    .overview-page { padding-bottom: 32px; }

    .top-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .spacer { flex: 1; }

    .sort-field {
      width: 240px;
      /* pull the extra bottom margin that mat-form-field adds */
      margin-bottom: -1.25em;
    }

    .spinner-wrap {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

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

    .dash-sub {
      font-size: 0.85rem;
      color: #888;
      margin: 2px 0 0;
    }

    .inventory-group { margin-bottom: 28px; }

    .group-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #555;
      border-bottom: 2px solid #eee;
      padding-bottom: 8px;
      margin-bottom: 16px;
    }

    .count { font-weight: 400; color: #aaa; font-size: 0.9rem; }

    .state-icon {
      &.processing { color: #f59e0b; }
      &.listed { color: #10b981; }
      &.sold { color: #6366f1; }
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    @media (max-width: 600px) {
      .top-actions { flex-wrap: wrap; }
      .sort-field { width: 100%; }
      .card-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .dashboard-grid { grid-template-columns: 1fr 1fr; }
      .dash-value { font-size: 1.2rem; }
    }
  `]
})
export class OverviewComponent implements OnInit {
  loading = signal(true);
  dashboard = signal<DashboardData | null>(null);
  groups = signal<{ state: string; icon: string; items: InventoryItem[] }[]>([]);
  sortBy = signal<SortOption>('recent');

  sortedGroups = computed(() => {
    const sort = this.sortBy();
    return this.groups().map(g => ({
      ...g,
      items: this.sortItems([...g.items], sort)
    }));
  });

  constructor(private inventory: InventoryService, private router: Router) {}

  ngOnInit() {
    this.inventory.getDashboard().subscribe({
      next: data => this.dashboard.set(data),
      error: () => {}
    });

    this.inventory.getAll({ pageSize: 500 }).subscribe({
      next: res => {
        const stateGroups = [
          { state: 'Processing', icon: 'pending', items: res.items.filter(i => i.state === 'Processing') },
          { state: 'Listed', icon: 'storefront', items: res.items.filter(i => i.state === 'Listed') },
          { state: 'Sold', icon: 'check_circle', items: res.items.filter(i => i.state === 'Sold') }
        ];
        this.groups.set(stateGroups);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  addNew() {
    this.router.navigate(['/item/new/edit']);
  }

  private sortItems(items: InventoryItem[], sort: SortOption): InventoryItem[] {
    switch (sort) {
      case 'recent':
        return items.sort((a, b) => this.cmpDate(b.dateAcquired, a.dateAcquired));
      case 'oldest':
        return items.sort((a, b) => this.cmpDate(a.dateAcquired, b.dateAcquired));
      case 'price-high':
        return items.sort((a, b) => (b.listPrice ?? 0) - (a.listPrice ?? 0));
      case 'price-low':
        return items.sort((a, b) => (a.listPrice ?? 0) - (b.listPrice ?? 0));
      case 'sku':
        return items.sort((a, b) => a.sku.slice(0, 4).localeCompare(b.sku.slice(0, 4)));
    }
  }

  private cmpDate(a?: string, b?: string): number {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a < b ? -1 : a > b ? 1 : 0;
  }
}
