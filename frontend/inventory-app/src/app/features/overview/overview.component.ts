import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ItemCardComponent } from '../../shared/components/item-card/item-card.component';
import { InventoryService } from '../../core/services/inventory.service';
import { DashboardData, InventoryItem, ItemState } from '../../core/models/inventory.models';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    ItemCardComponent
  ],
  template: `
    <div class="overview-page">
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

        @for (group of groups(); track group.state) {
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

  constructor(private inventory: InventoryService) {}

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
}
