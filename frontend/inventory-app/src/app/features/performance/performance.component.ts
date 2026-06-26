import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { InventoryService } from '../../core/services/inventory.service';
import { DashboardData } from '../../core/models/inventory.models';

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DecimalPipe,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    @if (loading()) {
      <div class="spinner-wrap"><mat-spinner diameter="40" /></div>
    } @else if (data()) {
      <div class="perf-page">
        <div class="metrics-grid">

          <mat-card class="metric-card">
            <mat-card-header>
              <mat-icon mat-card-avatar color="primary">trending_up</mat-icon>
              <mat-card-title>Revenue YTD</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="metric-value">{{ data()!.revenueYtd | currency }}</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>savings</mat-icon>
              <mat-card-title>Profit YTD</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="metric-value">{{ data()!.profitYtd | currency }}</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>calendar_today</mat-icon>
              <mat-card-title>Revenue MTD</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="metric-value">{{ data()!.revenueMtd | currency }}</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>sell</mat-icon>
              <mat-card-title>Items Sold MTD</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="metric-value">{{ data()!.itemsSoldMtd }}</p>
              <p class="metric-sub">{{ data()!.itemsSoldYtd }} YTD</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card">
            <mat-card-header>
              <mat-icon mat-card-avatar color="accent">percent</mat-icon>
              <mat-card-title>Projected ROI</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="metric-value">{{ data()!.rolling90DayRoiPct | number:'1.1-1' }}%</p>
              <p class="metric-sub">90-day avg · {{ data()!.rolling90DayItemCount }} items</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card metric-card--highlight">
            <mat-card-header>
              <mat-icon mat-card-avatar>moving</mat-icon>
              <mat-card-title>Projected Return</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="metric-value">{{ data()!.projectedReturn | currency }}</p>
              <p class="metric-sub">on {{ data()!.listedCostBasis | currency }} listed cost · 25% buffer</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card metric-card--highlight">
            <mat-card-header>
              <mat-icon mat-card-avatar>account_balance_wallet</mat-icon>
              <mat-card-title>Projected Profit</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="metric-value">{{ data()!.projectedProfit | currency }}</p>
              <p class="metric-sub">projected return minus cost basis</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>speed</mat-icon>
              <mat-card-title>$10k Profit Velocity</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="metric-value">{{ data()!.profitVelocity10k }}</p>
              <p class="metric-sub">listings needed for $10k profit</p>
            </mat-card-content>
          </mat-card>

        </div>
      </div>
    }
  `,
  styles: [`
    .perf-page    { padding: 24px 16px; max-width: 1200px; margin: 0 auto; }
    .spinner-wrap { display: flex; justify-content: center; padding: 60px; }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .metric-card { text-align: center; }
    .metric-card mat-icon { font-size: 28px; color: var(--mat-sys-primary); }
    .metric-card--highlight {
      border: 2px solid #4caf50;
      mat-icon { color: #4caf50; }
      .metric-value { color: #2e7d32; }
    }

    .metric-value {
      font-size: 1.6rem;
      font-weight: 700;
      margin: 8px 0 0;
      color: var(--mat-sys-on-surface);
    }
    .metric-sub { font-size: 0.85rem; color: #888; margin: 4px 0 0; }

    @media (max-width: 600px) {
      .perf-page { padding: 16px 10px; }
      .metrics-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .metric-card mat-card-header { padding: 8px 8px 0; }
      .metric-card mat-card-content { padding: 0 8px 8px; }
      mat-card-title { font-size: 0.78rem !important; line-height: 1.2; }
      .metric-value { font-size: 1rem; word-break: break-word; }
      .metric-sub { font-size: 0.7rem; }
    }
  `],
})
export class PerformanceComponent implements OnInit {
  loading = signal(true);
  data    = signal<DashboardData | null>(null);

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.inventoryService.getDashboard().subscribe({
      next:  d => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
