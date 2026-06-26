import { Component, OnInit, signal, computed, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { InventoryService } from '../../core/services/inventory.service';
import { AuthService } from '../../core/services/auth.service';
import { InventoryItem, ItemImage } from '../../core/models/inventory.models';

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
        @if (item() && auth.isOwner()) {
          <button mat-stroked-button color="primary" (click)="edit()">
            <mat-icon>edit</mat-icon> Edit
          </button>
        }
      </div>

      @if (loading()) {
        <div class="spinner-wrap"><mat-spinner diameter="40" /></div>
      } @else if (item()) {
        <div class="item-content">
          <!-- Image gallery -->
          @if (images().length > 0) {
            <div class="gallery">
              <div class="gallery-main">
                <img [src]="inventoryService.imageDataUrl(sku, images()[activeImageIndex()].id)"
                     [alt]="item()!.title" class="main-image" />
              </div>
              @if (images().length > 1) {
                <div class="gallery-thumbs">
                  @for (img of images(); track img.id; let i = $index) {
                    <div class="thumb" [class.active]="activeImageIndex() === i" (click)="activeImageIndex.set(i)">
                      <img [src]="inventoryService.imageDataUrl(sku, img.id)" [alt]="'Photo ' + (i + 1)" />
                    </div>
                  }
                </div>
              }
            </div>
          } @else {
            <div class="no-image-large">
              <mat-icon>chair</mat-icon>
              <span>No Image</span>
            </div>
          }

          <!-- Header -->
          <h1 class="item-title">{{ item()!.title }}</h1>
          <p class="item-price">{{ item()!.listPrice | currency }}</p>
          @if (auth.isOwner() && totalCost() !== null) {
            <p class="item-cost">
              Total cost {{ totalCost() | currency }}
              @if (item()!.listPrice) {
                <span class="markup-label" [class.negative]="markup()! < 0">&nbsp;·&nbsp;{{ markup() }}% Return</span>
              }
            </p>
          }

          @if (item()!.description) {
            <p class="item-desc">{{ item()!.description }}</p>
          }

          <mat-divider />

          <!-- Fields table -->
          <div class="fields-grid">
            <div class="field-row">
              <span class="field-label">SKU</span>
              <span class="field-value mono">{{ item()!.sku }}{{ item()!.costCode ?? '' }}</span>
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

            <!-- Owner-only fields -->
            @if (auth.isOwner()) {
              <div class="field-row">
                <span class="field-label">State</span>
                <span class="field-value state-badge" [class]="item()!.state.toLowerCase()">{{ item()!.state === 'PendingSale' ? 'Pending Sale' : item()!.state }}</span>
              </div>
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
                  <span class="field-label">Staging/Listing</span>
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

    .gallery {
      margin-bottom: 20px;
    }

    .gallery-main {
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 340px;
      margin-bottom: 8px;
    }

    .main-image { width: 100%; height: 100%; object-fit: contain; }

    .gallery-thumbs {
      display: flex;
      gap: 8px;
      overflow-x: auto;
    }

    .thumb {
      width: 72px;
      height: 72px;
      flex-shrink: 0;
      border-radius: 6px;
      overflow: hidden;
      border: 2px solid transparent;
      cursor: pointer;
      opacity: 0.65;
      transition: opacity 0.15s, border-color 0.15s;
      img { width: 100%; height: 100%; object-fit: cover; }
      &.active { border-color: var(--mat-sys-primary); opacity: 1; }
      &:hover { opacity: 1; }
    }

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
    .item-price { font-size: 1.3rem; font-weight: 700; color: var(--mat-sys-primary); margin: 0 0 4px; }
    .item-cost  { font-size: 0.85rem; color: #888; margin: 0 0 12px; }
    .markup-label { color: #4caf50; font-weight: 600; }
    .markup-label.negative { color: #ef4444; }
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
  images = signal<ItemImage[]>([]);
  activeImageIndex = signal(0);
  loading = signal(true);

  totalCost = computed(() => {
    const i = this.item();
    if (!i) return null;
    const sum = (i.acquisitionCost ?? 0) + (i.laborCost ?? 0) + (i.prepCost ?? 0)
              + (i.travelCost ?? 0) + (i.shippingCost ?? 0);
    return sum > 0 ? sum : null;
  });

  markup = computed(() => {
    const cost = this.totalCost();
    const price = this.item()?.listPrice;
    if (!cost || !price) return null;
    return Math.round(((price - cost) / cost) * 100);
  });

  constructor(
    public inventoryService: InventoryService,
    public auth: AuthService,
    private router: Router,
    private location: Location
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
    this.inventoryService.getImages(this.sku).subscribe({
      next: imgs => this.images.set(imgs),
      error: () => {}
    });
  }

  back() {
    this.location.back();
  }

  edit() {
    this.router.navigate(['/item', this.sku, 'edit']);
  }
}
