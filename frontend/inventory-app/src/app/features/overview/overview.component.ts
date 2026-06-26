import { Component, OnInit, OnDestroy, signal, computed, afterNextRender, WritableSignal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ItemCardComponent } from '../../shared/components/item-card/item-card.component';
import { InventoryService } from '../../core/services/inventory.service';
import { AuthService } from '../../core/services/auth.service';
import { InventoryItem, SearchSuggestion } from '../../core/models/inventory.models';
import { OverviewStateService, SortOption, StateGroup } from './overview-state.service';

const ALL_GROUPS: Omit<StateGroup, 'items'>[] = [
  { state: 'PendingSale', icon: 'pending_actions', color: '#8b5cf6' },
  { state: 'Processing',  icon: 'pending',         color: '#f59e0b' },
  { state: 'Listed',      icon: 'storefront',      color: '#10b981' },
  { state: 'Sold',        icon: 'check_circle',    color: '#6366f1' },
  { state: 'Archived',    icon: 'archive',         color: '#111111' },
];

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    ItemCardComponent
  ],
  template: `
    <div class="overview-page">

      <!-- Search bar -->
      <div class="search-wrap">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search items...</mat-label>
          <input matInput [formControl]="searchCtrl" autocomplete="off" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        @if (searching()) {
          <mat-spinner diameter="20" class="search-spinner" />
        }
        @if (suggestions().length > 0 && searchCtrl.value) {
          <div class="suggestions-dropdown">
            @for (s of suggestions(); track s.sku) {
              <div class="suggestion-row" (click)="selectSuggestion(s)"
                   (keydown.enter)="selectSuggestion(s)" tabindex="0">
                <div class="suggestion-thumb">
                  @if (s.firstImageId) {
                    <img [src]="inventoryService.imageDataUrl(s.sku, s.firstImageId)" [alt]="s.title" />
                  } @else if (s.imageUrl) {
                    <img [src]="s.imageUrl" [alt]="s.title" />
                  } @else {
                    <mat-icon class="thumb-icon">chair</mat-icon>
                  }
                </div>
                <div class="suggestion-info">
                  <span class="suggestion-title">{{ s.title | slice:0:30 }}{{ s.title.length > 30 ? '…' : '' }}</span>
                  <span class="suggestion-price">{{ s.listPrice | currency }}</span>
                </div>
                <span class="suggestion-sku">{{ s.sku }}</span>
              </div>
            }
          </div>
        }
      </div>

      <!-- Weekly snapshot tiles — owner only -->
      @if (auth.isOwner() && !loading() && state.dashboard()) {
        <div class="dash-toggle-row">
          <button class="dash-toggle-btn" (click)="state.showDashboard.set(!state.showDashboard())">
            <mat-icon>{{ state.showDashboard() ? 'expand_less' : 'expand_more' }}</mat-icon>
            {{ state.showDashboard() ? 'Hide Metrics' : 'Show Metrics' }}
          </button>
        </div>
        @if (state.showDashboard()) {
          <section class="dashboard-grid">

            <mat-card class="dash-card">
              <mat-card-header>
                <mat-icon mat-card-avatar color="primary">storefront</mat-icon>
                <mat-card-title>Current Week Sales</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p class="dash-value">{{ state.dashboard()!.weekSalesRevenue | currency }}</p>
                <p class="dash-sub">sold price · items closed this week</p>
              </mat-card-content>
            </mat-card>

            <mat-card class="dash-card" [class.dash-card--over]="state.dashboard()!.weekAcquisitionCost > 640">
              <mat-card-header>
                <mat-icon mat-card-avatar>shopping_cart</mat-icon>
                <mat-card-title>Weekly Acquisition Goal</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p class="dash-value">{{ state.dashboard()!.weekAcquisitionCost | currency:'USD':'symbol':'1.0-0' }} / $640</p>
                <div class="acq-track">
                  <div class="acq-fill" [style.width.%]="weekAcqPct()"
                       [class.acq-fill--over]="weekAcqPct() >= 100"></div>
                </div>
                <p class="dash-sub">{{ weekAcqPct() }}% of weekly goal</p>
              </mat-card-content>
            </mat-card>

          </section>
        }
      }

      @if (loading()) {
        <div class="spinner-wrap"><mat-spinner diameter="40" /></div>
      } @else {

        @for (group of visibleGroups(); track group.state) {
          <section class="inventory-group">
            <h2 class="group-header" [style.--hdr-color]="group.color">
              <mat-icon class="state-icon">{{ group.icon }}</mat-icon>
              <span style="text-transform:none">{{ displayState(group.state) }}</span>
              <span class="count">({{ group.items.length }})</span>
            </h2>

            @if (group.items.length === 0) {
              <p class="empty-group">No items in this category.</p>
            }

            <!-- Grid view -->
            @if (state.viewMode() === 'grid' && group.items.length > 0) {
              <div class="card-grid">
                @for (item of group.items; track item.id) {
                  <app-item-card [item]="item" />
                }
              </div>
            }

            <!-- List view -->
            @if (state.viewMode() === 'list' && group.items.length > 0) {
              <div class="list-view">
                @for (item of group.items; track item.id) {
                  <div class="list-row" (click)="navigate(item.sku)"
                       tabindex="0" (keydown.enter)="navigate(item.sku)">
                    <div class="list-thumb">
                      @if (item.firstImageId) {
                        <img [src]="inventoryService.imageDataUrl(item.sku, item.firstImageId)"
                             [alt]="item.title" loading="lazy" />
                      } @else {
                        <mat-icon class="thumb-placeholder">chair</mat-icon>
                      }
                    </div>
                    <span class="list-sku">{{ item.sku }}</span>
                    <span class="list-title">{{ item.title }}</span>
                    <span class="list-type">
                      {{ item.type }}{{ item.subType ? ' · ' + item.subType : '' }}
                    </span>
                    <span class="list-date">{{ item.dateAcquired ?? '—' }}</span>
                    <span class="list-price">{{ item.listPrice | currency }}</span>
                  </div>
                }
              </div>
            }
          </section>
        }
      }
    </div>

    <!-- Floating control cluster — all users; add button is owner-only -->
    <div class="float-cluster">

      <!-- ADD item — owner only -->
      @if (auth.isOwner()) {
        <button mat-mini-fab color="primary" class="fab-add" (click)="addNew()" aria-label="New Item">
          <mat-icon>add</mat-icon>
        </button>
      }

      <!-- SORT button -->
      <button class="fab-sort" (click)="toggleSort()" [class.open]="showSortPanel()">
        {{ sortLabel() }}
      </button>
      @if (showSortPanel()) {
        <div class="float-panel sort-panel">
          @for (opt of sortOptions; track opt.value) {
            <button class="panel-opt" [class.sel]="state.sortBy() === opt.value"
                    (click)="state.sortBy.set(opt.value); showSortPanel.set(false)">
              {{ opt.label }}
            </button>
          }
        </div>
      }

      <!-- FILTER button -->
      <button mat-mini-fab class="fab-filter" [class.has-active]="filterActive()"
              (click)="toggleFilter()" aria-label="Filter">
        <mat-icon>filter_list</mat-icon>
      </button>
      @if (showFilterPanel()) {
        <div class="float-panel filter-panel">
          @if (auth.isOwner()) {
            @for (g of allGroups; track g.state) {
              <button class="filter-chip"
                      [class.active]="state.activeStates().has(g.state)"
                      [style.--chip-color]="g.color"
                      (click)="toggleState(g.state)">
                <span class="chip-dot"></span>
                {{ displayState(g.state) }}
                <span class="chip-count">({{ countFor(g.state) }})</span>
              </button>
            }
          }
          <div class="view-toggle-row">
            <button mat-icon-button [class.active]="state.viewMode() === 'grid'"
                    matTooltip="Grid view" (click)="state.viewMode.set('grid')">
              <mat-icon>grid_view</mat-icon>
            </button>
            <button mat-icon-button [class.active]="state.viewMode() === 'list'"
                    matTooltip="List view" (click)="state.viewMode.set('list')">
              <mat-icon>view_list</mat-icon>
            </button>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .overview-page { padding-bottom: 120px; }

    /* ── Floating cluster ── */
    .float-cluster {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 200;
      display: flex;
      flex-direction: column-reverse;
      align-items: flex-end;
      gap: 12px;
    }

    .fab-add { box-shadow: 0 3px 12px rgba(0,0,0,0.2); }

    .fab-sort {
      width: 40px;
      height: 40px;
      min-width: 0;
      padding: 0;
      border-radius: 50%;
      border: none;
      background: #fff;
      color: #333;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      box-shadow: 0 3px 12px rgba(0,0,0,0.2);
      transition: background 0.15s, color 0.15s;
      &.open, &:hover { background: var(--mat-sys-primary); color: #fff; }
    }

    .fab-filter {
      background: #fff !important;
      color: #555 !important;
      box-shadow: 0 3px 12px rgba(0,0,0,0.2) !important;
      &.has-active { background: var(--mat-sys-primary) !important; color: #fff !important; }
    }

    /* ── Floating panels ── */
    .float-panel {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 28px rgba(0,0,0,0.18);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 180px;
    }

    .panel-opt {
      text-align: left;
      background: none;
      border: none;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 13px;
      cursor: pointer;
      color: #444;
      transition: background 0.12s;
      &:hover { background: #f5f5f5; }
      &.sel { font-weight: 700; color: var(--mat-sys-primary); background: #f0f4ff; }
    }

    .view-toggle-row {
      display: flex;
      gap: 2px;
      border-top: 1px solid #eee;
      padding-top: 6px;
      margin-top: 2px;
      button { color: #aaa; }
      button.active { color: var(--mat-sys-primary); }
    }

    /* ── Dashboard toggle ── */
    .dash-toggle-row { margin-bottom: 8px; }

    .dash-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #aaa;
      padding: 2px 0;
      &:hover { color: #666; }
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .dashboard-grid { margin-bottom: 16px; }

    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px 5px 10px;
      border-radius: 999px;
      border: 2px solid #e0e0e0;
      background: #fff;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: #666;
      transition: all 0.15s;

      .chip-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #ccc;
        flex-shrink: 0;
        transition: background 0.15s;
      }

      .chip-count {
        font-weight: 400;
        color: #aaa;
        font-size: 12px;
      }

      &:hover {
        border-color: var(--chip-color, #999);
        color: #333;
      }

      &.active {
        border-color: var(--chip-color, #999);
        background: color-mix(in srgb, var(--chip-color, #999) 10%, white);
        color: #333;

        .chip-dot { background: var(--chip-color, #999); }
        .chip-count { color: #666; }
      }
    }

    /* ── Spinner ── */
    .spinner-wrap { display: flex; justify-content: center; padding: 48px; }

    /* ── Weekly snapshot tiles ── */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .dash-card {
      text-align: center;
      mat-icon { font-size: 28px; color: var(--mat-sys-primary); }
    }
    .dash-card--over {
      border: 2px solid #ef4444;
      mat-icon { color: #ef4444; }
      .dash-value { color: #b91c1c; }
    }
    .dash-value {
      font-size: 1.6rem;
      font-weight: 700;
      margin: 8px 0 0;
      color: var(--mat-sys-on-surface);
    }
    .dash-sub { font-size: 0.85rem; color: #888; margin: 4px 0 0; }

    .acq-track {
      height: 6px;
      background: #e5e7eb;
      border-radius: 999px;
      overflow: hidden;
      margin: 10px 0 4px;
    }
    .acq-fill {
      height: 100%;
      background: #10b981;
      border-radius: 999px;
      transition: width 0.4s ease;
    }
    .acq-fill--over { background: #ef4444; }

    /* ── Section headers (sticky) ── */
    .inventory-group { margin-bottom: 28px; }

    .group-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #444;
      border-bottom: 3px solid var(--hdr-color, #eee);
      padding: 10px 0 8px;
      margin-bottom: 16px;
      position: sticky;
      top: 64px;
      background: var(--mat-sys-surface, #fff);
      z-index: 5;

      .state-icon { color: var(--hdr-color, #888); font-size: 20px; }
    }

    .count { font-weight: 400; color: #aaa; font-size: 0.9rem; }
    .empty-group { color: #bbb; font-size: 13px; font-style: italic; padding: 0 0 8px; }

    /* ── Grid view ── */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    /* ── List view ── */
    .list-view {
      display: flex;
      flex-direction: column;
      border: 1px solid #eee;
      border-radius: 8px;
      overflow: hidden;
    }

    .list-row {
      display: grid;
      grid-template-columns: 48px 100px 1fr 140px 110px 100px;
      align-items: center;
      gap: 12px;
      padding: 5px 12px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background 0.12s;
      &:last-child { border-bottom: none; }
      &:hover { background: #fafafa; }
    }

    .list-thumb {
      width: 40px;
      height: 40px;
      border-radius: 5px;
      background: #f5f5f5;
      overflow: hidden;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      img { width: 100%; height: 100%; object-fit: cover; }
    }
    .thumb-placeholder { font-size: 20px; color: #ccc; }

    .list-sku  { font-family: monospace; font-size: 11px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .list-title { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .list-type  { font-size: 12px; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .list-date  { font-size: 12px; color: #aaa; white-space: nowrap; }
    .list-price { font-size: 13px; font-weight: 600; color: var(--mat-sys-primary); text-align: right; white-space: nowrap; }

    /* ── Search ── */
    .search-wrap { position: relative; margin-bottom: 8px; }
    .search-field { width: 100%; }
    .search-spinner { position: absolute; right: 48px; top: 18px; }

    .suggestions-dropdown {
      position: absolute;
      z-index: 300;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      width: 100%;
      max-height: 360px;
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
    .suggestion-thumb {
      width: 40px; height: 40px; border-radius: 4px; overflow: hidden;
      background: #f0f0f0; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0;
      img { width: 100%; height: 100%; object-fit: cover; }
      .thumb-icon { font-size: 22px; color: #bbb; }
    }
    .suggestion-info { flex: 1; display: flex; flex-direction: column; }
    .suggestion-title { font-weight: 500; font-size: 14px; }
    .suggestion-price { font-size: 13px; color: var(--mat-sys-primary); font-weight: 600; }
    .suggestion-sku { font-size: 11px; color: #999; font-family: monospace; white-space: nowrap; }

    /* ── Mobile ── */
    @media (max-width: 600px) {
      .card-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .dashboard-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .dash-card mat-card-header { padding: 8px 8px 0; }
      .dash-card mat-card-content { padding: 0 8px 8px; }
      .dash-value { font-size: 1.05rem; word-break: break-word; }
      .dash-sub { font-size: 0.72rem; }
      .group-header { top: 56px; }
      .list-row { grid-template-columns: 40px 1fr 80px; }
      .list-sku, .list-type, .list-date { display: none; }
    }
  `]
})
export class OverviewComponent implements OnInit, OnDestroy {
  loading!: WritableSignal<boolean>;

  // Transient UI state (not cached)
  showFilterPanel = signal(false);
  showSortPanel   = signal(false);
  searchCtrl      = new FormControl('');
  suggestions     = signal<SearchSuggestion[]>([]);
  searching       = signal(false);
  private destroy$ = new Subject<void>();

  readonly allGroups = ALL_GROUPS;

  readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'recent',     label: 'Newest first' },
    { value: 'oldest',     label: 'Oldest first' },
    { value: 'price-high', label: 'Price: high → low' },
    { value: 'price-low',  label: 'Price: low → high' },
    { value: 'sku',        label: 'A – Z  (SKU)' },
  ];

  private readonly SORT_SHORT: Record<SortOption, string> = {
    recent:       'New',
    oldest:       'Old',
    'price-high': '$ ↓',
    'price-low':  '$ ↑',
    sku:          '0-9',
  };

  weekAcqPct = computed(() =>
    Math.min(100, Math.round(((this.state.dashboard()?.weekAcquisitionCost ?? 0) / 640) * 100))
  );

  sortLabel    = computed(() => this.SORT_SHORT[this.state.sortBy()]);
  filterActive = computed(() => {
    const s = this.state.activeStates();
    const isDefault = s.size === 2 && s.has('Listed') && s.has('PendingSale');
    return !isDefault;
  });

  sortedGroups = computed(() => {
    const sort = this.state.sortBy();
    return this.state.groups().map(g => ({
      ...g,
      items: this.sortItems([...g.items], sort)
    }));
  });

  visibleGroups = computed(() =>
    this.sortedGroups().filter(g => this.state.activeStates().has(g.state))
  );

  constructor(
    public inventoryService: InventoryService,
    public auth: AuthService,
    public state: OverviewStateService,
    private router: Router
  ) {
    const cacheWarm = state.loadedAsOwner() === auth.isOwner();
    this.loading = signal(!cacheWarm);

    if (cacheWarm) {
      // Restore the sidenav scroll position after the first render completes
      afterNextRender(() => {
        const el = document.querySelector('mat-sidenav-content');
        if (el) el.scrollTop = state.scrollY();
      });
    }
  }

  ngOnInit() {
    this.searchCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => {
      if (!q || q.trim().length < 2) { this.suggestions.set([]); return; }
      this.searching.set(true);
      this.inventoryService.search(q.trim(), 'Listed').subscribe({
        next: r => { this.suggestions.set(r); this.searching.set(false); },
        error: () => this.searching.set(false),
      });
    });

    const isOwner = this.auth.isOwner();

    // Skip fetch if cache is warm for the same auth mode
    if (this.state.loadedAsOwner() === isOwner) {
      this.loading.set(false);
      return;
    }

    if (isOwner) {
      this.inventoryService.getDashboard().subscribe({
        next: data => this.state.dashboard.set(data),
        error: () => {}
      });

      forkJoin({
        main:     this.inventoryService.getAll({ pageSize: 500 }),
        archived: this.inventoryService.getAll({ state: 'Archived', pageSize: 500 })
      }).subscribe({
        next: ({ main, archived }) => {
          const all = [...main.items, ...archived.items];
          this.state.groups.set(ALL_GROUPS.map(g => ({ ...g, items: all.filter(i => i.state === g.state) })));
          this.state.loadedAsOwner.set(true);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else {
      this.inventoryService.getAll({ pageSize: 500 }).subscribe({
        next: data => {
          this.state.groups.set(ALL_GROUPS.map(g => ({ ...g, items: data.items.filter(i => i.state === g.state) })));
          this.state.loadedAsOwner.set(false);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  toggleState(state: string) {
    this.state.activeStates.update(s => {
      const next = new Set(s);
      next.has(state) ? next.delete(state) : next.add(state);
      return next;
    });
  }

  countFor(state: string): number {
    return this.state.groups().find(g => g.state === state)?.items.length ?? 0;
  }

  displayState(state: string): string {
    if (state === 'Listed')      return 'Available';
    if (state === 'PendingSale') return 'Pending Sale';
    return state;
  }

  toggleFilter() {
    this.showFilterPanel.update(v => !v);
    this.showSortPanel.set(false);
  }
  toggleSort() {
    this.showSortPanel.update(v => !v);
    this.showFilterPanel.set(false);
  }

  selectSuggestion(s: SearchSuggestion) {
    this.suggestions.set([]);
    this.searchCtrl.setValue('', { emitEvent: false });
    this.router.navigate(['/item', s.sku]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    const el = document.querySelector('mat-sidenav-content');
    if (el) this.state.scrollY.set(el.scrollTop);
  }

  addNew() { this.router.navigate(['/item/new/edit']); }
  navigate(sku: string) { this.router.navigate(['/item', sku]); }

  private sortItems(items: InventoryItem[], sort: SortOption): InventoryItem[] {
    switch (sort) {
      case 'recent':     return items.sort((a, b) => this.cmpDate(b.dateAcquired, a.dateAcquired));
      case 'oldest':     return items.sort((a, b) => this.cmpDate(a.dateAcquired, b.dateAcquired));
      case 'price-high': return items.sort((a, b) => (b.listPrice ?? 0) - (a.listPrice ?? 0));
      case 'price-low':  return items.sort((a, b) => (a.listPrice ?? 0) - (b.listPrice ?? 0));
      case 'sku':        return items.sort((a, b) => a.sku.slice(0, 4).localeCompare(b.sku.slice(0, 4)));
    }
  }

  private cmpDate(a?: string, b?: string): number {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a < b ? -1 : a > b ? 1 : 0;
  }
}
