import { Component, OnInit, OnChanges, SimpleChanges, Input, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, EMPTY } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { InvestorService } from '../../core/services/investor.service';
import { InventoryService } from '../../core/services/inventory.service';
import { InvestorDashboardDto } from '../../core/models/investor.models';
import { InventoryItem, ItemState } from '../../core/models/inventory.models';

interface RoiRow {
  sku: string;
  label: string;
  cost: number;
  returnAmt: number | null;
  roi: number | null;
}

@Component({
  selector: 'app-investor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DecimalPipe,
    RouterLink,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    @if (error()) {
      <div class="error-msg">{{ error() }}</div>
    } @else if (data()) {
      <div class="dashboard-wrap">
        <div class="investor-name">{{ data()!.investor.name }}</div>
        <div class="funding-tag">Funding Series: {{ data()!.investor.fundingTag }}</div>

        <!-- 1. Metric cards -->
        <div class="metric-grid">
          <mat-card class="metric-card wallet-tile">
            <mat-card-content>
              <div class="metric-label">Wallet</div>
              <div class="metric-value wallet-value">{{ walletBalance() | currency }}</div>
              <div class="metric-sub">due next pay · {{ nextPaySunday() }}</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card">
            <mat-card-content>
              <div class="metric-label">Total Invested</div>
              <div class="metric-value">{{ data()!.investor.fundsInvested | currency }}</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card">
            <mat-card-content>
              <div class="metric-label">Funds Deployed</div>
              <div class="metric-value">{{ data()!.fundsDeployed | currency }}</div>
              <div class="metric-sub">acquisition cost of tagged items</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card">
            <mat-card-content>
              <div class="metric-label">Items Summary</div>
              <div class="items-row">
                <span class="pill processing">{{ data()!.itemsProcessing }} Processing</span>
                <span class="pill listed">{{ data()!.itemsListed }} Listed</span>
                <span class="pill sold">{{ data()!.itemsSold }} Sold</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card highlight">
            <mat-card-content>
              <div class="metric-label">Return</div>
              <div class="return-line">
                <span class="return-pct">{{ profitReturn().pct >= 0 ? '+' : '' }}{{ profitReturn().pct | number:'1.0-1' }}%</span>
                <span class="return-sep">·</span>
                <span class="return-amt">{{ profitReturn().amount | currency }}</span>
              </div>
              <div class="metric-sub">{{ data()!.investor.profitSharePercent }}% profit share on sold items</div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- 2. ROI Table -->
        @if (roiRows().length) {
          <mat-divider class="section-divider"></mat-divider>
          <div class="roi-table-wrap">
            <table class="roi-table">
              <thead>
                <tr>
                  <th class="col-item">Item</th>
                  <th class="col-return">Return</th>
                  <th class="col-roi">ROI</th>
                </tr>
              </thead>
              <tbody>
                @for (row of roiRows(); track row.sku) {
                  <tr class="roi-row" [routerLink]="['/item', row.sku]">
                    <td class="col-item">{{ row.label }}</td>
                    <td class="col-return num">
                      @if (row.returnAmt != null) {
                        <span>{{ row.returnAmt | currency:'USD':'symbol':'1.0-0' }}</span>
                      } @else {
                        <span class="dash">—</span>
                      }
                    </td>
                    <td class="col-roi num">
                      @if (row.roi != null) {
                        <span class="roi-val" [class.pos]="row.roi >= 0" [class.neg]="row.roi < 0">
                          {{ row.roi >= 0 ? '+' : '' }}{{ row.roi | number:'1.1-1' }}%
                        </span>
                      } @else {
                        <span class="dash">—</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="totals-row">
                  <td class="col-item">TOTAL</td>
                  <td class="col-return num">{{ roiTotals().totalReturn | currency:'USD':'symbol':'1.0-0' }}</td>
                  <td class="col-roi num">
                    @if (roiTotals().roi != null) {
                      <span class="roi-val" [class.pos]="roiTotals().roi! >= 0" [class.neg]="roiTotals().roi! < 0">
                        {{ roiTotals().roi! >= 0 ? '+' : '' }}{{ roiTotals().roi! | number:'1.1-1' }}%
                      </span>
                    }
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        }

        <!-- 3. Wallet -->
        <mat-divider class="section-divider"></mat-divider>
        <div class="wallet-wrap">
          <div class="wallet-header">
            <div>
              <div class="metric-label">Wallet Balance</div>
              <div class="wallet-balance" [class.zero]="walletBalance() <= 0">
                {{ walletBalance() | currency }}
              </div>
              <div class="metric-sub">capital + profit share minus paid out</div>
            </div>
            <div class="next-pay">
              <div class="next-pay-label">Next Pay</div>
              <div class="next-pay-date">{{ nextPaySunday() }}</div>
            </div>
          </div>

          @if (data()!.payments?.length) {
            <table class="ledger-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Method</th>
                  <th class="num-col">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (p of data()!.payments; track p.id) {
                  <tr>
                    <td>{{ formatPayDate(p.paidDate) }}</td>
                    <td>{{ p.method }}</td>
                    <td class="num-col">{{ p.amount | currency }}</td>
                    <td class="del-col">
                      <button mat-icon-button class="del-btn" (click)="deletePayment(p.id)" title="Remove">
                        <mat-icon>close</mat-icon>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="no-payments">No payments recorded yet.</p>
          }

          <!-- Add payment row -->
          <form class="add-pay-form" (ngSubmit)="addPayment()">
            <input class="pay-input" type="number" placeholder="Amount" min="0.01" step="0.01"
                   [(ngModel)]="newAmt" name="amt" required />
            <input class="pay-input date-input" type="date" [(ngModel)]="newDate" name="date" required />
            <select class="pay-input" [(ngModel)]="newMethod" name="method" required>
              <option value="" disabled>Method</option>
              <option>Venmo</option>
              <option>Zelle</option>
              <option>Cash</option>
              <option>Check</option>
              <option>Bank Transfer</option>
            </select>
            <button mat-raised-button color="primary" type="submit" [disabled]="!newAmt || !newDate || !newMethod">
              Record
            </button>
          </form>
        </div>

        <!-- 4. Item grid -->
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
    } @else {
      <div class="spinner-wrap"><mat-spinner diameter="48"></mat-spinner></div>
    }
  `,
  styles: [`
    .dashboard-wrap { padding: 24px 16px; max-width: 1100px; margin: 0 auto; }
    .spinner-wrap   { display: flex; justify-content: center; padding: 60px; }
    .error-msg      { color: #ef4444; padding: 24px; text-align: center; }

    .investor-name { font-size: 1.5rem; font-weight: 600; margin-bottom: 4px; }
    .funding-tag   { color: #666; margin-bottom: 24px; }

    /* Metric cards */
    .metric-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
    .metric-card.highlight { border: 2px solid #4caf50; }
    .wallet-tile { border: 2px solid #6366f1; }
    .wallet-value { color: #6366f1; }
    .metric-label  { font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; color: #888; margin-bottom: 8px; }
    .metric-value  { font-size: 1.75rem; font-weight: 700; }
    .metric-sub    { font-size: .75rem; color: #999; margin-top: 4px; }
    .return-line   { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; margin-bottom: 4px; }
    .return-pct    { font-size: 1.5rem; font-weight: 700; color: #16a34a; }
    .return-sep    { font-size: 1rem; color: #d1d5db; }
    .return-amt    { font-size: 1.1rem; font-weight: 600; color: #374151; }
    .items-row     { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .pill          { padding: 3px 10px; border-radius: 999px; font-size: .78rem; font-weight: 600; }
    .pill.processing { background: #e3f2fd; color: #1565c0; }
    .pill.listed     { background: #e8f5e9; color: #2e7d32; }
    .pill.sold       { background: #f3e5f5; color: #6a1b9a; }

    .section-divider { margin: 32px 0 24px; }

    /* ROI Table */
    .roi-table-wrap {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .roi-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;

      th, td {
        padding: 10px 14px;
        text-align: left;
        white-space: nowrap;
      }

      thead tr {
        background: #f9fafb;
        border-bottom: 2px solid #e5e7eb;
        th {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6b7280;
        }
      }

      tbody tr {
        border-bottom: 1px solid #f3f4f6;
        cursor: pointer;
        transition: background 0.1s;
        &:hover { background: #f9fafb; }
        &:last-child { border-bottom: none; }
      }

      tfoot tr {
        border-top: 2px solid #e5e7eb;
        background: #f9fafb;
        font-weight: 700;
      }
    }

    .col-item {
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 105px;
    }
    .col-return { min-width: 90px; }
    .col-roi    { min-width: 68px; }
    .num        { font-family: 'Courier New', monospace; font-size: 13px; }

    @media (min-width: 600px) {
      .col-item { max-width: 260px; }
      .roi-table th, .roi-table td { padding: 10px 14px; }
    }

    @media (max-width: 599px) {
      .roi-table th, .roi-table td { padding: 8px 5px; }
    }

    .roi-val {
      font-weight: 700;
      &.pos { color: #16a34a; }
      &.neg { color: #dc2626; }
      &.projected { opacity: 0.65; }
    }

    .projected { color: #9ca3af; }

    .est-tag {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #9ca3af;
      margin-left: 3px;
      vertical-align: super;
    }

    .dash { color: #d1d5db; }

    .totals-row td { font-size: 13px; }

    /* Wallet */
    .wallet-wrap { margin-top: 4px; }
    .wallet-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .wallet-balance {
      font-size: 2rem;
      font-weight: 700;
      color: #16a34a;
      &.zero { color: #9ca3af; }
    }
    .next-pay { text-align: right; }
    .next-pay-label { font-size: .7rem; text-transform: uppercase; letter-spacing: .08em; color: #888; }
    .next-pay-date  { font-size: 1.1rem; font-weight: 600; color: #374151; margin-top: 2px; }

    .ledger-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      th, td { padding: 9px 10px; text-align: left; border-bottom: 1px solid #f3f4f6; }
      thead tr { background: #f9fafb; border-bottom: 2px solid #e5e7eb; }
      thead th { font-size: 10px; font-weight: 700; text-transform: uppercase;
                 letter-spacing: 1px; color: #6b7280; }
      tbody tr:last-child td { border-bottom: none; }
      .num-col { text-align: right; font-family: 'Courier New', monospace; }
      .del-col { width: 32px; padding: 0 4px; }
    }
    .del-btn { width: 28px; height: 28px; line-height: 28px;
               mat-icon { font-size: 16px; width: 16px; height: 16px; color: #ef4444; } }
    .no-payments { color: #9ca3af; font-size: 13px; margin: 8px 0 0; }

    .add-pay-form {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      flex-wrap: wrap;
      align-items: center;
    }
    .pay-input {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 7px 10px;
      font-size: 13px;
      background: #fff;
      outline: none;
      &:focus { border-color: var(--mat-sys-primary); }
    }
    .date-input { min-width: 130px; }

    /* Item grid */
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
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
      margin-bottom: 28px;
    }
    .item-tile {
      border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb;
      cursor: pointer; transition: box-shadow 0.15s; background: #fff;
      &:hover { box-shadow: 0 4px 14px rgba(0,0,0,.12); }
    }
    .tile-image {
      height: 130px; background: #f5f5f5;
      display: flex; align-items: center; justify-content: center; overflow: hidden;
      img { width: 100%; height: 100%; object-fit: cover; }
    }
    .no-img { color: #ccc; mat-icon { font-size: 40px; width: 40px; height: 40px; } }
    .tile-body  { padding: 8px 10px 10px; }
    .tile-sku   { font-size: 10px; color: #aaa; font-family: monospace; margin: 0 0 2px; }
    .tile-title { font-size: 13px; font-weight: 500; margin: 0 0 4px; line-height: 1.3;
                  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .tile-price { font-size: 13px; font-weight: 700; color: var(--mat-sys-primary); margin: 0; }

    @media (max-width: 600px) {
      .items-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
    }
  `],
})
export class InvestorDashboardComponent implements OnInit, OnChanges {
  @Input() investorId?: number;

  data  = signal<InvestorDashboardDto | null>(null);
  error = signal<string | null>(null);

  private readonly destroyRef = inject(DestroyRef);
  private readonly load$ = new Subject<number | null>();

  constructor(
    private svc: InvestorService,
    public inventoryService: InventoryService,
  ) {}

  ngOnInit(): void {
    this.load$.pipe(
      switchMap(id => {
        this.data.set(null);
        this.error.set(null);
        return (id != null ? this.svc.getDashboard(id) : this.svc.getMyDashboard()).pipe(
          catchError(e => {
            this.error.set('Could not load dashboard. Please try again.');
            return EMPTY;
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(d => this.data.set(d));

    this.load$.next(this.investorId ?? null);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['investorId'] && !changes['investorId'].firstChange) {
      this.load$.next(this.investorId ?? null);
    }
  }

  newAmt: number | null = null;
  newDate: string = new Date().toISOString().slice(0, 10);
  newMethod: string = '';

  walletBalance(): number {
    const d = this.data();
    if (!d) return 0;
    const paid = (d.payments ?? []).reduce((s, p) => s + p.amount, 0);
    return d.totalReturn - paid;
  }

  nextPaySunday(): string {
    const today = new Date();
    const daysUntil = (7 - today.getDay()) % 7 || 7;
    const next = new Date(today);
    next.setDate(today.getDate() + daysUntil);
    return next.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  formatPayDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  addPayment(): void {
    if (!this.investorId || !this.newAmt || !this.newDate || !this.newMethod) return;
    this.svc.addPayment(this.investorId, {
      amount: this.newAmt,
      paidDate: this.newDate,
      method: this.newMethod,
    }).subscribe(p => {
      const d = this.data();
      if (d) {
        this.data.set({ ...d, payments: [p, ...d.payments] });
      }
      this.newAmt = null;
      this.newMethod = '';
      this.newDate = new Date().toISOString().slice(0, 10);
    });
  }

  deletePayment(paymentId: number): void {
    if (!this.investorId) return;
    this.svc.deletePayment(this.investorId, paymentId).subscribe(() => {
      const d = this.data();
      if (d) {
        this.data.set({ ...d, payments: d.payments.filter(p => p.id !== paymentId) });
      }
    });
  }

  profitReturn(): { amount: number; pct: number } {
    const rows = this.roiRows();
    const totalProfit = rows.reduce((s, r) => s + (r.returnAmt != null ? r.returnAmt - r.cost : 0), 0);
    const totalCost   = rows.reduce((s, r) => s + r.cost, 0);
    return { amount: totalProfit, pct: totalCost > 0 ? (totalProfit / totalCost) * 100 : 0 };
  }

  roiRows(): RoiRow[] {
    const d = this.data();
    if (!d?.items?.length) return [];
    const pct = d.investor.profitSharePercent / 100;

    return d.items
      .filter(i => i.state === 'Sold' && i.acquisitionCost != null && i.acquisitionCost > 0 && i.profit != null)
      .map(i => {
        const cost = i.acquisitionCost!;
        const returnAmt = cost + i.profit! * pct;
        const roi = ((returnAmt - cost) / cost) * 100;
        const label = '$' + Math.round(cost) + ' — ' + i.title;
        return { sku: i.sku, label, cost, returnAmt, roi };
      });
  }

  roiTotals(): { totalCost: number; totalReturn: number; roi: number | null } {
    const rows = this.roiRows();
    const totalCost   = rows.reduce((s, r) => s + r.cost, 0);
    const totalReturn = rows.filter(r => r.returnAmt != null).reduce((s, r) => s + r.returnAmt!, 0);
    const roi = totalCost > 0 ? ((totalReturn - totalCost) / totalCost) * 100 : null;
    return { totalCost, totalReturn, roi };
  }

  itemGroups(): { state: string; items: InventoryItem[] }[] {
    const d = this.data();
    if (!d?.items?.length) return [];
    const order: ItemState[] = ['Processing', 'Listed', 'PendingSale', 'Sold', 'Archived'];
    return order
      .map(state => ({ state, items: d.items.filter(i => i.state === state) }))
      .filter(g => g.items.length > 0);
  }
}
