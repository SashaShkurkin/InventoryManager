import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { InventoryService } from '../../core/services/inventory.service';
import { SearchSuggestion } from '../../core/models/inventory.models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    MatListModule
  ],
  template: `
    <div class="search-page">
      <h2 class="page-title">Search Inventory</h2>

      <!-- Text search -->
      <div class="search-wrap">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search by SKU, Title, or Tags</mat-label>
          <input matInput [formControl]="searchCtrl" autocomplete="off" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        @if (searching()) {
          <mat-spinner diameter="20" class="search-spinner" />
        }

        @if (suggestions().length > 0 && searchCtrl.value) {
          <div class="suggestions-dropdown">
            @for (s of suggestions(); track s.sku) {
              <div class="suggestion-row" (click)="select(s)" (keydown.enter)="select(s)" tabindex="0">
                <div class="thumb">
                  @if (s.imageUrl) {
                    <img [src]="s.imageUrl" [alt]="s.title" />
                  } @else {
                    <mat-icon class="thumb-icon">chair</mat-icon>
                  }
                </div>
                <div class="suggestion-info">
                  <span class="suggestion-title">{{ s.title | slice:0:20 }}{{ s.title.length > 20 ? '…' : '' }}</span>
                  <span class="suggestion-price">{{ s.listPrice | currency }}</span>
                </div>
                <span class="suggestion-sku">{{ s.sku }}</span>
              </div>
            }
          </div>
        }
      </div>

      <!-- Price range slider -->
      <div class="price-range-section">
        <h3 class="section-label">Price Range</h3>
        <div class="slider-labels">
          <span>{{ priceMin() | currency:'USD':'symbol':'1.0-0' }}</span>
          <span>{{ priceMax() | currency:'USD':'symbol':'1.0-0' }}</span>
        </div>
        <mat-slider min="0" max="5000" step="50" class="price-slider">
          <input matSliderStartThumb [(value)]="minValue" (valueChange)="onPriceChange()" />
          <input matSliderEndThumb [(value)]="maxValue" (valueChange)="onPriceChange()" />
        </mat-slider>
        <div class="slider-scale">
          <span>$0</span>
          <span>$5,000</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-page { max-width: 640px; }
    .page-title { margin: 0 0 20px; font-size: 1.4rem; }

    .search-wrap { position: relative; }
    .search-field { width: 100%; }
    .search-spinner { position: absolute; right: 48px; top: 18px; }

    .suggestions-dropdown {
      position: absolute;
      z-index: 200;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      width: 100%;
      max-height: 400px;
      overflow-y: auto;
    }

    .suggestion-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      &:last-child { border-bottom: none; }
      &:hover { background: #f9f9f9; }
    }

    .thumb {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      overflow: hidden;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      img { width: 100%; height: 100%; object-fit: cover; }
      .thumb-icon { font-size: 22px; color: #bbb; }
    }

    .suggestion-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .suggestion-title { font-weight: 500; font-size: 14px; }
    .suggestion-price { font-size: 13px; color: var(--mat-sys-primary); font-weight: 600; }
    .suggestion-sku { font-size: 11px; color: #999; font-family: monospace; white-space: nowrap; }

    .price-range-section { margin-top: 32px; }
    .section-label { font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #666; margin: 0 0 8px; }

    .slider-labels {
      display: flex;
      justify-content: space-between;
      font-weight: 600;
      font-size: 15px;
      color: var(--mat-sys-primary);
      margin-bottom: 4px;
    }

    .price-slider { width: 100%; }

    .slider-scale {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #aaa;
      margin-top: 4px;
    }

    @media (max-width: 600px) {
      .search-page { max-width: 100%; }
    }
  `]
})
export class SearchComponent implements OnInit, OnDestroy {
  searchCtrl = new FormControl('');
  suggestions = signal<SearchSuggestion[]>([]);
  searching = signal(false);
  priceMin = signal(0);
  priceMax = signal(5000);

  minValue = 0;
  maxValue = 5000;

  private destroy$ = new Subject<void>();

  constructor(
    private inventoryService: InventoryService,
    private router: Router
  ) {}

  ngOnInit() {
    this.searchCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => {
      if (!q || q.trim().length < 2) {
        this.suggestions.set([]);
        return;
      }
      this.searching.set(true);
      this.inventoryService.search(q.trim()).subscribe({
        next: results => {
          this.suggestions.set(results);
          this.searching.set(false);
        },
        error: () => this.searching.set(false)
      });
    });
  }

  onPriceChange() {
    this.priceMin.set(this.minValue);
    this.priceMax.set(this.maxValue);
  }

  select(s: SearchSuggestion) {
    this.suggestions.set([]);
    this.searchCtrl.setValue('', { emitEvent: false });
    this.router.navigate(['/item', s.sku]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
