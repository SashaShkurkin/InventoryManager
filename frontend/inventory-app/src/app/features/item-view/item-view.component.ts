import { Component, OnInit, signal, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { InventoryService } from '../../core/services/inventory.service';
import { InventoryItem } from '../../core/models/inventory.models';

@Component({
  selector: 'app-item-view',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="item-view">
      <div class="top-bar">
        <button mat-icon-button (click)="back()" aria-label="Back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span class="spacer"></span>
        @if (item()) {
          <button mat-stroked-button color="primary" (click)="edit()">
            <mat-icon>edit</mat-icon> Edit
          </button>
        }
      </div>

      @if (loading()) {
        <div class="spinner-wrap"><mat-spinner diameter="40" /></div>
      } @else if (item()) {
        <div class="item-content">
          <!-- Image -->
          <div class="image-wrap">
            @if (item()!.imageUrl) {
              <img [src]="item()!.imageUrl" [alt]="item()!.title" class="item-image" />
            } @else {
              <div class="no-image-large">
                <mat-icon>chair</mat-icon>
                <span>No Image</span>
              </div>
            }
          </div>

          <!-- Header -->
          <h1 class="item-title">{{ item()!.title }}</h1>
          <p class="item-price">{{ item()!.listPrice | currency }}</p>

          @if (item()!.description) {
            <p class="item-desc">{{ item()!.description }}</p>
          }

          <mat-divider />

          <!-- Fields table -->
          <div class="fields-grid">
            <div class="field-row">
              <span class="field-label">SKU</span>
              <span class="field-value mono">{{ item()!.sku }}</span>
            </div>
            <div class="field-row">
              <span class="field-label">State</span>
              <span class="field-value state-badge" [class]="item()!.state.toLowerCase()">{{ item()!.state }}</span>
            </div>
            @if (item()!.type) {
              <div class="field-row">
                <span class="field-label">Type</span>
                <span class="field-value">{{ item()!.type }}</span>
              </div>
            }
            @if (item()!.subType) {
              <div class="field-row">
                <span class="field-label">Sub Type</span>
                <span class="field-value">{{ item()!.subType }}</span>
              </div>
            }
            @if (item()!.style) {
              <div class="field-row">
                <span class="field-label">Style</span>
                <span class="field-value">{{ item()!.style }}</span>
              </div>
            }
            @if (item()!.color) {
              <div class="field-row">
                <span class="field-label">Color</span>
                <span class="field-value">{{ item()!.color }}</span>
              </div>
            }
            <mat-divider />
            @if (item()!.acquisitionCost != null) {
              <div class="field-row">
                <span class="field-label">Acquired</span>
                <span class="field-value">{{ item()!.acquisitionCost | currency }}</span>
              </div>
            }
            @if (item()!.laborCost != null) {
              <div class="field-row">
                <span class="field-label">Labor</span>
                <span class="field-value">{{ item()!.laborCost | currency }}</span>
              </div>
            }
            @if (item()!.materialsCost != null) {
              <div class="field-row">
                <span class="field-label">Materials</span>
                <span class="field-value">{{ item()!.materialsCost | currency }}</span>
              </div>
            }
            @if (item()!.prepCost != null) {
              <div class="field-row">
                <span class="field-label">Prep</span>
                <span class="field-value">{{ item()!.prepCost | currency }}</span>
              </div>
            }
            @if (item()!.travelCost != null) {
              <div class="field-row">
                <span class="field-label">Travel</span>
                <span class="field-value">{{ item()!.travelCost | currency }}</span>
              </div>
            }
            @if (item()!.soldPrice != null) {
              <div class="field-row">
                <span class="field-label">Sold For</span>
                <span class="field-value">{{ item()!.soldPrice | currency }}</span>
              </div>
            }
            @if (item()!.profit != null) {
              <div class="field-row">
                <span class="field-label">Profit</span>
                <span class="field-value" [class.profit-pos]="item()!.profit! > 0">{{ item()!.profit | currency }}</span>
              </div>
            }
            <mat-divider />
            @if (item()!.dateAcquired) {
              <div class="field-row">
                <span class="field-label">Date Acquired</span>
                <span class="field-value">{{ item()!.dateAcquired }}</span>
              </div>
            }
            @if (item()!.dateListed) {
              <div class="field-row">
                <span class="field-label">Date Listed</span>
                <span class="field-value">{{ item()!.dateListed }}</span>
              </div>
            }
            @if (item()!.dateSold) {
              <div class="field-row">
                <span class="field-label">Date Sold</span>
                <span class="field-value">{{ item()!.dateSold }}</span>
              </div>
            }
            @if (item()!.tags) {
              <div class="field-row">
                <span class="field-label">Tags</span>
                <span class="field-value">{{ item()!.tags }}</span>
              </div>
            }
          </div>
        </div>
      } @else {
        <p class="not-found">Item not found.</p>
      }
    </div>
  `,
  styles: [`
    .item-view { max-width: 680px; margin: 0 auto; }

    .top-bar {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }
    .spacer { flex: 1; }

    .spinner-wrap { display: flex; justify-content: center; padding: 48px; }

    .image-wrap {
      width: 100%;
      max-height: 380px;
      overflow: hidden;
      border-radius: 12px;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }

    .item-image { width: 100%; height: 380px; object-fit: contain; }

    .no-image-large {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 200px;
      color: #ccc;
      mat-icon { font-size: 64px; width: 64px; height: 64px; }
      span { font-size: 14px; }
    }

    .item-title { font-size: 1.6rem; font-weight: 700; margin: 0 0 6px; }
    .item-price { font-size: 1.3rem; font-weight: 700; color: var(--mat-sys-primary); margin: 0 0 12px; }
    .item-desc { color: #555; line-height: 1.6; margin: 0 0 16px; }

    .fields-grid { margin-top: 16px; }

    .field-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
      gap: 16px;
    }

    .field-label {
      width: 130px;
      flex-shrink: 0;
      font-size: 13px;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .field-value { font-size: 14px; color: #333; }
    .mono { font-family: monospace; }

    .state-badge {
      font-weight: 600;
      &.processing { color: #f59e0b; }
      &.listed { color: #10b981; }
      &.sold { color: #6366f1; }
      &.archived { color: #9ca3af; }
    }

    .profit-pos { color: #10b981; font-weight: 600; }
    .not-found { color: #888; padding: 24px; }

    mat-divider { margin: 8px 0; }

    @media (max-width: 600px) {
      .item-title { font-size: 1.2rem; }
      .field-label { width: 100px; font-size: 11px; }
    }
  `]
})
export class ItemViewComponent implements OnInit {
  @Input() sku!: string;
  item = signal<InventoryItem | null>(null);
  loading = signal(true);

  constructor(
    private inventoryService: InventoryService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.sku) {
      this.loading.set(false);
      return;
    }
    this.inventoryService.getBySkuake(this.sku).subscribe({
      next: item => {
        this.item.set(item);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  back() {
    this.router.navigate(['/overview']);
  }

  edit() {
    this.router.navigate(['/item', this.sku, 'edit']);
  }
}
