import { Component, Input, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { switchMap } from 'rxjs';
import { ScoutService } from '../../core/services/scout.service';
import { InventoryService } from '../../core/services/inventory.service';
import { ScoutDashboardDto } from '../../core/models/scout.models';
import { InventoryItem, ItemState } from '../../core/models/inventory.models';

@Component({
  selector: 'app-scout-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatIconModule,
  ],
  template: `
    @if (loading()) {
      <div class="spinner-wrap"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (error()) {
      <div class="error-msg">{{ error() }}</div>
    } @else if (data()) {
      <div class="dashboard-wrap">
        <div class="metric-grid">
          <mat-card class="metric-card">
            <mat-card-content>
              <div class="metric-label">Items Scouted</div>
              <div class="metric-value">{{ data()!.itemCount }}</div>
              <div class="items-row">
                <span class="pill processing">{{ data()!.itemsProcessing }} Processing</span>
                <span class="pill listed">{{ data()!.itemsListed }} Listed</span>
                <span class="pill sold">{{ data()!.itemsSold }} Sold</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card">
            <mat-card-content>
              <div class="metric-label">Purchase Costs</div>
              <div class="metric-value">{{ data()!.purchaseCosts | currency }}</div>
              <div class="metric-sub">acquisition cost of scouted items</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card highlight">
            <mat-card-content>
              <div class="metric-label">Return</div>
              <div class="metric-value">{{ data()!.totalReturn | currency }}</div>
              <div class="metric-sub">
                capital recovered + {{ data()!.scout.profitSharePercent }}% profit share
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        @if (data()!.items?.length) {
          <mat-divider class="section-divider"></mat-divider>
          @for (group of itemGroups(); track group.state) {
            <h3 class="state-heading">
              <span class="state-dot" [class]="group.state.toLowerCase()"></span>
              {{ group.state }} ({{ group.items.length }})
            </h3>
            <div class="items-grid">
              @for (item of group.items; track item.sku) {
                <div class="item-tile" [routerLink]="['/item', item.sku]">
                  <div class="tile-image">
                    @if (item.firstImageId) {
                      <img [src]="inventoryService.imageDataUrl(item.sku, item.firstImageId!)"
                           [alt]="item.title" loading="lazy" />
                    } @else {
                      <div class="no-img"><mat-icon>chair</mat-icon></div>
                    }
                  </div>
                  <div class="tile-body">
                    <p class="tile-sku">{{ item.sku }}{{ item.costCode ?? '' }}</p>
                    <p class="tile-title">{{ item.title }}</p>
                    <p class="tile-price">{{ item.listPrice | currency }}</p>
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>
    }
  `,
  styles: [`
    .dashboard-wrap { padding: 16px 0; }
    .spinner-wrap   { display: flex; justify-content: center; padding: 40px; }
    .error-msg      { color: #ef4444; padding: 16px; text-align: center; }

    .metric-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
    .metric-card.highlight { border: 2px solid #4caf50; }
    .metric-label { font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; color: #888; margin-bottom: 8px; }
    .metric-value { font-size: 1.5rem; font-weight: 700; }
    .metric-sub   { font-size: .75rem; color: #999; margin-top: 4px; }
    .items-row    { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    .pill         { padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 600; }
    .pill.processing { background: #e3f2fd; color: #1565c0; }
    .pill.listed     { background: #e8f5e9; color: #2e7d32; }
    .pill.sold       { background: #f3e5f5; color: #6a1b9a; }

    .section-divider { margin: 24px 0 16px; }

    .state-heading {
      display: flex; align-items: center; gap: 8px;
      font-size: 1rem; font-weight: 600; margin: 0 0 12px; color: #444;
    }
    .state-dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
      &.processing { background: #f59e0b; }
      &.listed     { background: #10b981; }
      &.sold       { background: #6366f1; }
      &.archived   { background: #9ca3af; }
    }

    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .item-tile {
      border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb;
      cursor: pointer; transition: box-shadow 0.15s; background: #fff;
      &:hover { box-shadow: 0 4px 14px rgba(0,0,0,.12); }
    }
    .tile-image {
      height: 110px; background: #f5f5f5;
      display: flex; align-items: center; justify-content: center; overflow: hidden;
      img { width: 100%; height: 100%; object-fit: cover; }
    }
    .no-img { color: #ccc; mat-icon { font-size: 36px; width: 36px; height: 36px; } }
    .tile-body  { padding: 6px 10px 10px; }
    .tile-sku   { font-size: 10px; color: #aaa; font-family: monospace; margin: 0 0 2px; }
    .tile-title { font-size: 12px; font-weight: 500; margin: 0 0 4px; line-height: 1.3;
                  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .tile-price { font-size: 12px; font-weight: 700; color: var(--mat-sys-primary); margin: 0; }
  `],
})
export class ScoutDashboardComponent implements OnInit, OnChanges {
  @Input() scoutId!: number;

  loading = signal(true);
  data    = signal<ScoutDashboardDto | null>(null);
  error   = signal<string | null>(null);

  constructor(
    private svc: ScoutService,
    public inventoryService: InventoryService,
  ) {}

  ngOnInit(): void { this.load(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scoutId'] && !changes['scoutId'].firstChange) {
      this.load();
    }
  }

  private load(): void {
    this.loading.set(true);
    this.data.set(null);
    this.error.set(null);
    this.svc.getDashboard(this.scoutId).subscribe({
      next:  d => { this.data.set(d); this.loading.set(false); },
      error: e => {
        console.error('Scout dashboard load failed', e);
        this.error.set('Could not load dashboard.');
        this.loading.set(false);
      },
    });
  }

  itemGroups(): { state: string; items: InventoryItem[] }[] {
    const d = this.data();
    if (!d?.items?.length) return [];
    const order: ItemState[] = ['Processing', 'Listed', 'Sold', 'Archived'];
    return order
      .map(state => ({ state, items: d.items.filter(i => i.state === state) }))
      .filter(g => g.items.length > 0);
  }
}
