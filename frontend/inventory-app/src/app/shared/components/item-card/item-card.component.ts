import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { InventoryItem } from '../../../core/models/inventory.models';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, MatCardModule, MatIconModule, MatChipsModule],
  template: `
    <mat-card class="item-card" (click)="navigate()" tabindex="0" (keydown.enter)="navigate()">
      <div class="card-image">
        @if (item.imageUrl) {
          <img [src]="item.imageUrl" [alt]="item.title" />
        } @else {
          <div class="no-image">
            <mat-icon>chair</mat-icon>
          </div>
        }
      </div>
      <mat-card-content>
        <p class="sku-badge">{{ item.sku }}</p>
        <p class="item-title">{{ item.title | slice:0:40 }}{{ item.title.length > 40 ? '…' : '' }}</p>
        <p class="item-price">{{ item.listPrice | currency }}</p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .item-card {
      cursor: pointer;
      transition: box-shadow 0.2s;
      &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
    }
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
    .item-price {
      color: var(--mat-sys-primary);
      font-weight: 600;
      margin: 0;
      font-size: 15px;
    }
    mat-card-content { padding: 0 12px 12px; }
  `]
})
export class ItemCardComponent {
  @Input({ required: true }) item!: InventoryItem;

  constructor(private router: Router) {}

  navigate() {
    this.router.navigate(['/item', this.item.sku]);
  }
}
