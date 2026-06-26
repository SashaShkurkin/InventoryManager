import { Component, Input, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { InventoryItem } from '../../../core/models/inventory.models';
import { InventoryService } from '../../../core/services/inventory.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, MatCardModule, MatIconModule, MatChipsModule],
  template: `
    <mat-card class="item-card" [class.pending-card]="item.state === 'PendingSale'"
              (click)="navigate()" tabindex="0" (keydown.enter)="navigate()">
      <div class="card-image">
        @if (item.firstImageId) {
          <img [src]="inventoryService.imageDataUrl(item.sku, item.firstImageId)" [alt]="item.title" loading="lazy" />
        } @else {
          <div class="no-image">
            <mat-icon>chair</mat-icon>
          </div>
        }
      </div>
      <mat-card-content>
        <p class="sku-badge">{{ item.sku }}{{ item.costCode ?? '' }}</p>
        <p class="item-title">{{ item.title | slice:0:40 }}{{ item.title.length > 40 ? '…' : '' }}</p>
        <div class="price-row">
          <span class="item-price">{{ item.listPrice | currency }}</span>
          @if (auth.isOwner() && returnPct() !== null) {
            <span class="return-badge" [class.negative]="returnPct()! < 0">{{ returnPct() }}%</span>
          }
        </div>
        @if (item.state === 'PendingSale' && (auth.isOwner() || auth.isInvestor())) {
          <div class="pending-chip">
            <mat-icon>pending_actions</mat-icon>
            <span>{{ pendingSummary() || 'Pending Sale' }}</span>
          </div>
          @if (item.agreedPrice) {
            <div class="agreed-price">Agreed: {{ item.agreedPrice | currency }}</div>
          }
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .item-card {
      cursor: pointer;
      transition: box-shadow 0.2s;
      &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
    }
    .pending-card { border: 2px solid #8b5cf6; }

    .card-image {
      height: 160px;
      overflow: hidden;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      img { width: 100%; height: 100%; object-fit: cover; }
    }
    .no-image {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: #bbb; }
    }
    .sku-badge {
      font-size: 11px;
      color: #888;
      margin: 8px 0 2px;
      font-family: monospace;
    }
    .item-title {
      font-weight: 500;
      margin: 0 0 4px;
      font-size: 14px;
      line-height: 1.3;
    }
    .price-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .item-price {
      color: var(--mat-sys-primary);
      font-weight: 600;
      margin: 0;
      font-size: 15px;
    }
    .return-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 999px;
      background: #dcfce7;
      color: #16a34a;
      &.negative { background: #fee2e2; color: #dc2626; }
    }

    /* Pending Sale chip */
    .pending-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: #ede9fe;
      border-radius: 6px;
      color: #6d28d9;
      font-size: 12px;
      font-weight: 600;
      mat-icon { font-size: 14px; width: 14px; height: 14px; flex-shrink: 0; }
    }
    .agreed-price {
      font-size: 11px;
      color: #7c3aed;
      font-weight: 600;
      margin-top: 3px;
      padding-left: 2px;
    }

    mat-card-content { padding: 0 12px 12px; }
  `]
})
export class ItemCardComponent {
  @Input({ required: true }) item!: InventoryItem;

  returnPct = computed(() => {
    const cost = (this.item.acquisitionCost ?? 0) + (this.item.laborCost ?? 0)
               + (this.item.prepCost ?? 0) + (this.item.travelCost ?? 0)
               + (this.item.shippingCost ?? 0);
    const price = this.item.listPrice;
    if (!cost || !price) return null;
    return Math.round(((price - cost) / cost) * 100);
  });

  pendingSummary = computed(() => {
    const parts: string[] = [];

    const m = this.item.pendingSaleMethod;
    if (m) parts.push(m === 'PublicMeet' ? 'Public Meet' : m);

    const ds = this.item.pendingSaleDate;
    if (ds) {
      const d = new Date(ds + 'T00:00:00');
      const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
      parts.push(`${day} ${d.getMonth() + 1}/${d.getDate()}`);
    }

    const ts = this.item.pendingSaleTime;
    if (ts) {
      const [h, mn] = ts.split(':').map(Number);
      const ampm = h >= 12 ? 'pm' : 'am';
      const h12 = h % 12 || 12;
      parts.push(`${h12}:${String(mn).padStart(2, '0')}${ampm}`);
    }

    return parts.join(', ');
  });

  constructor(
    private router: Router,
    public inventoryService: InventoryService,
    public auth: AuthService,
  ) {}

  navigate() {
    this.router.navigate(['/item', this.item.sku]);
  }
}
