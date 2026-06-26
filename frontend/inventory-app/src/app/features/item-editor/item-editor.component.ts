import { Component, OnInit, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { InventoryService } from '../../core/services/inventory.service';
import { InventoryItem, ItemImage, ItemState } from '../../core/models/inventory.models';
import { OverviewStateService } from '../overview/overview-state.service';

@Component({
  selector: 'app-item-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <div class="editor-page">
      <div class="top-bar">
        <button mat-icon-button (click)="cancel()" aria-label="Back">
          <mat-icon>close</mat-icon>
        </button>
        <h2 class="page-title">{{ isNew ? 'New Item' : 'Edit Item' }}</h2>
        <span class="spacer"></span>
        @if (!isNew) {
          <button mat-stroked-button color="warn" [disabled]="saving() || deleting()" (click)="deleteItem()">
            <mat-icon>delete</mat-icon> Delete
          </button>
        }
        <button mat-flat-button color="primary" [disabled]="saving() || deleting()" (click)="save()">
          @if (saving()) {
            <mat-spinner diameter="18" class="btn-spinner" />
          } @else {
            <mat-icon>save</mat-icon>
          }
          {{ isNew ? 'Create' : 'Save' }}
        </button>
      </div>

      @if (loading()) {
        <div class="spinner-wrap"><mat-spinner diameter="40" /></div>
      } @else if (form) {
        <form [formGroup]="form" class="editor-form">

          <!-- Photo slots (edit mode only — upload after item exists) -->
          @if (!isNew) {
            <p class="section-label">Photos (up to 6)</p>
            <div class="photo-grid">
              @for (slot of photoSlots(); track slot.index) {
                <div class="photo-slot">
                  @if (slot.image) {
                    <img [src]="inventoryService.imageDataUrl(sku, slot.image.id)" alt="Photo {{ slot.index + 1 }}" />
                    <button class="slot-delete" mat-icon-button (click)="deletePhoto(slot.image.id)" [disabled]="uploadingSlot() !== null">
                      <mat-icon>close</mat-icon>
                    </button>
                  } @else if (uploadingSlot() === slot.index) {
                    <mat-spinner diameter="28" />
                  } @else {
                    <label class="slot-add">
                      <mat-icon>add_photo_alternate</mat-icon>
                      <input type="file" accept="image/jpeg,image/png,image/webp" (change)="uploadPhoto($event, slot.index)" hidden />
                    </label>
                  }
                </div>
              }
            </div>
            <mat-divider />
          }

          @if (isNew) {
            <p class="new-item-photo-note">
              <mat-icon>info</mat-icon> You can add photos after creating the item.
            </p>
          }

          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>SKU</mat-label>
              <input matInput formControlName="sku" [readonly]="!isNew" />
              @if (isNew) {
                <mat-hint>Unique identifier, e.g. CHAI-001</mat-hint>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="span2">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" />
            </mat-form-field>

            <!-- Dimensions -->
            <mat-form-field appearance="outline">
              <mat-label>Height (in)</mat-label>
              <input matInput type="number" formControlName="height" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Width (in)</mat-label>
              <input matInput type="number" formControlName="width" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Length / Depth (in)</mat-label>
              <input matInput type="number" formControlName="lengthDepth" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="span3">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="3"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>State</mat-label>
              <mat-select formControlName="state">
                @for (s of states; track s) {
                  <mat-option [value]="s">{{ stateLabel(s) }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Type</mat-label>
              <input matInput formControlName="type" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Sub Type</mat-label>
              <input matInput formControlName="subType" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Style</mat-label>
              <input matInput formControlName="style" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Color</mat-label>
              <input matInput formControlName="color" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="span3">
              <mat-label>Tags (comma-separated)</mat-label>
              <input matInput formControlName="tags" />
            </mat-form-field>
          </div>

          <!-- Pending Sale details -->
          <mat-divider />
          <p class="section-label" [class.section-locked]="form.get('state')?.value !== 'PendingSale'">
            <mat-icon class="section-icon">pending_actions</mat-icon>
            Pending Sale Details
            @if (form.get('state')?.value !== 'PendingSale') {
              <span class="lock-hint">— set state to Pending Sale to enable</span>
            }
          </p>

          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Agreed Price</mat-label>
              <span matTextPrefix>$&nbsp;</span>
              <input matInput type="number" formControlName="agreedPrice" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Sale Date</mat-label>
              <input matInput [matDatepicker]="saleDatePicker" formControlName="pendingSaleDate" />
              <mat-datepicker-toggle matIconSuffix [for]="saleDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #saleDatePicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Sale Time</mat-label>
              <mat-select formControlName="pendingSaleTime">
                @for (t of timeOptions; track t.value) {
                  <mat-option [value]="t.value">{{ t.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Handoff Method</mat-label>
              <mat-select formControlName="pendingSaleMethod">
                <mat-option value="Pickup">Pickup</mat-option>
                <mat-option value="PublicMeet">Public Meet</mat-option>
                <mat-option value="Delivery">Delivery</mat-option>
                <mat-option value="Shipping">Shipping</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <mat-divider />
          <p class="section-label">Financials</p>

          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Acquisition Cost</mat-label>
              <span matTextPrefix>$&nbsp;</span>
              <input matInput type="number" formControlName="acquisitionCost" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Labor</mat-label>
              <span matTextPrefix>$&nbsp;</span>
              <input matInput type="number" formControlName="laborCost" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Materials</mat-label>
              <span matTextPrefix>$&nbsp;</span>
              <input matInput type="number" formControlName="materialsCost" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Staging/Listing</mat-label>
              <span matTextPrefix>$&nbsp;</span>
              <input matInput type="number" formControlName="prepCost" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Travel</mat-label>
              <span matTextPrefix>$&nbsp;</span>
              <input matInput type="number" formControlName="travelCost" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Shipping Cost</mat-label>
              <span matTextPrefix>$&nbsp;</span>
              <input matInput type="number" formControlName="shippingCost" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>List Price</mat-label>
              <span matTextPrefix>$&nbsp;</span>
              <input matInput type="number" formControlName="listPrice" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Sold Price</mat-label>
              <span matTextPrefix>$&nbsp;</span>
              <input matInput type="number" formControlName="soldPrice" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Profit</mat-label>
              <span matTextPrefix>$&nbsp;</span>
              <input matInput type="number" formControlName="profit" />
            </mat-form-field>
          </div>

          <mat-divider />
          <p class="section-label">Dates</p>

          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Date Acquired</mat-label>
              <input matInput type="date" formControlName="dateAcquired" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date Listed</mat-label>
              <input matInput type="date" formControlName="dateListed" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date Sold</mat-label>
              <input matInput type="date" formControlName="dateSold" />
            </mat-form-field>
          </div>

        </form>
      }
    </div>
  `,
  styles: [`
    .editor-page { max-width: 760px; margin: 0 auto; padding-bottom: 48px; }

    .top-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      position: sticky;
      top: 64px;
      background: var(--mat-sys-surface);
      z-index: 10;
      padding: 8px 0;
    }

    .page-title { margin: 0; font-size: 1.1rem; }
    .spacer { flex: 1; }
    .btn-spinner { display: inline-block; margin-right: 4px; }
    .spinner-wrap { display: flex; justify-content: center; padding: 48px; }

    .photo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 12px;
    }

    .photo-slot {
      position: relative;
      aspect-ratio: 1;
      background: #f5f5f5;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px dashed #ddd;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .slot-delete {
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(0,0,0,0.55);
      color: white;
      width: 28px;
      height: 28px;
      line-height: 28px;
      mat-icon { font-size: 18px; line-height: 18px; }
    }

    .slot-add {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      cursor: pointer;
      color: #aaa;
      gap: 4px;
      mat-icon { font-size: 36px; }
      &:hover { background: #ebebeb; color: #666; }
    }

    .new-item-photo-note {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #888;
      font-size: 13px;
      mat-icon { font-size: 16px; }
    }

    .editor-form { display: flex; flex-direction: column; gap: 16px; }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .span2 { grid-column: span 2; }
    .span3 { grid-column: span 3; }

    .section-label {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
      margin: 8px 0 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-locked { color: #ccc; }
    .section-icon { font-size: 16px; width: 16px; height: 16px; }
    .lock-hint { font-weight: 400; text-transform: none; letter-spacing: 0; font-size: 0.75rem; color: #bbb; }

    mat-divider { margin: 8px 0; }

    @media (max-width: 600px) {
      .photo-grid { grid-template-columns: repeat(3, 1fr); gap: 6px; }
      .form-grid { grid-template-columns: 1fr 1fr; }
      .span2, .span3 { grid-column: span 2; }
      .top-bar { top: 56px; }
    }
  `]
})
export class ItemEditorComponent implements OnInit {
  @Input() sku!: string;

  get isNew(): boolean { return this.sku === 'new'; }

  form!: FormGroup;
  loading = signal(true);
  saving = signal(false);
  deleting = signal(false);
  images = signal<ItemImage[]>([]);
  uploadingSlot = signal<number | null>(null);

  states: ItemState[] = ['Processing', 'Listed', 'PendingSale', 'Sold', 'Archived'];

  readonly timeOptions = Array.from({ length: 96 }, (_, i) => {
    const h = Math.floor(i / 4);
    const m = (i % 4) * 15;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const label = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    return { value, label };
  });

  stateLabel(s: ItemState): string {
    return s === 'PendingSale' ? 'Pending Sale' : s;
  }

  private parseSaleDate(dateStr?: string): Date | null {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  private formatSaleDate(d: Date | null | string): string | null {
    if (!d) return null;
    if (typeof d === 'string') return d || null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  photoSlots = () => Array.from({ length: 6 }, (_, i) => ({
    index: i,
    image: this.images()[i] ?? null
  }));

  constructor(
    private fb: FormBuilder,
    public inventoryService: InventoryService,
    private router: Router,
    private snack: MatSnackBar,
    private overviewState: OverviewStateService
  ) {}

  ngOnInit() {
    if (this.isNew) {
      this.buildForm(null);
      this.loading.set(false);
      return;
    }

    if (!this.sku) { this.loading.set(false); return; }

    this.inventoryService.getBySkuake(this.sku).subscribe({
      next: item => {
        this.buildForm(item);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.inventoryService.getImages(this.sku).subscribe({
      next: imgs => this.images.set(imgs),
      error: () => {}
    });
  }

  private buildForm(item: InventoryItem | null) {
    const isPending = (item?.state ?? 'Processing') === 'PendingSale';

    this.form = this.fb.group({
      sku: [item?.sku ?? '', Validators.required],
      title: [item?.title ?? '', Validators.required],
      description: [item?.description ?? ''],
      state: [item?.state ?? 'Processing', Validators.required],
      type: [item?.type ?? ''],
      subType: [item?.subType ?? ''],
      style: [item?.style ?? ''],
      color: [item?.color ?? ''],
      tags: [item?.tags ?? ''],
      // Dimensions
      height: [item?.height ?? null],
      width: [item?.width ?? null],
      lengthDepth: [item?.lengthDepth ?? null],
      // Financials
      acquisitionCost: [item?.acquisitionCost ?? null],
      laborCost: [item?.laborCost ?? null],
      materialsCost: [item?.materialsCost ?? null],
      prepCost: [item?.prepCost ?? null],
      travelCost: [item?.travelCost ?? null],
      shippingCost: [item?.shippingCost ?? null],
      listPrice: [item?.listPrice ?? null],
      soldPrice: [item?.soldPrice ?? null],
      profit: [item?.profit ?? null],
      // Dates
      dateAcquired: [item?.dateAcquired ?? ''],
      dateListed: [item?.dateListed ?? ''],
      dateSold: [item?.dateSold ?? ''],
      // Pending Sale details (locked unless state is PendingSale)
      agreedPrice:       [{ value: item?.agreedPrice ?? null,                    disabled: !isPending }],
      pendingSaleDate:   [{ value: this.parseSaleDate(item?.pendingSaleDate),    disabled: !isPending }],
      pendingSaleTime:   [{ value: item?.pendingSaleTime ?? null,                disabled: !isPending }],
      pendingSaleMethod: [{ value: item?.pendingSaleMethod ?? null,              disabled: !isPending }],
    });

    if (!this.isNew) {
      this.form.get('sku')?.disable();
    }

    // Lock/unlock and clear pending sale fields when state changes
    this.form.get('state')!.valueChanges.subscribe((state: string) => {
      const pending = state === 'PendingSale';
      const pendingFields = ['agreedPrice', 'pendingSaleDate', 'pendingSaleTime', 'pendingSaleMethod'];
      for (const f of pendingFields) {
        const ctrl = this.form.get(f)!;
        if (pending) {
          ctrl.enable({ emitEvent: false });
        } else {
          ctrl.setValue(null, { emitEvent: false });
          ctrl.disable({ emitEvent: false });
        }
      }
    });
  }

  uploadPhoto(event: Event, slotIndex: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    input.value = '';

    this.uploadingSlot.set(slotIndex);
    this.inventoryService.uploadItemImage(this.sku, file).subscribe({
      next: img => {
        this.images.update(imgs => [...imgs, img]);
        this.uploadingSlot.set(null);
      },
      error: (err) => {
        const msg = err?.error || 'Upload failed';
        this.snack.open(typeof msg === 'string' ? msg : 'Upload failed', '', { duration: 3000 });
        this.uploadingSlot.set(null);
      }
    });
  }

  deletePhoto(id: number) {
    this.inventoryService.deleteItemImage(this.sku, id).subscribe({
      next: () => this.images.update(imgs => imgs.filter(i => i.id !== id)),
      error: () => this.snack.open('Delete failed', '', { duration: 3000 })
    });
  }

  save() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.snack.open('Please fill in SKU and Title before saving.', '', { duration: 3000 });
      return;
    }
    this.saving.set(true);

    const values = this.form.getRawValue();
    const payload = {
      ...values,
      dateAcquired:    values.dateAcquired    || null,
      dateListed:      values.dateListed      || null,
      dateSold:        values.dateSold        || null,
      pendingSaleDate: this.formatSaleDate(values.pendingSaleDate),
      pendingSaleTime: values.pendingSaleTime  || null,
    };

    if (this.isNew) {
      this.inventoryService.create(payload).subscribe({
        next: created => {
          this.overviewState.loadedAsOwner.set(null);
          this.snack.open('Item created', '', { duration: 2000 });
          this.saving.set(false);
          this.router.navigate(['/item', created.sku]);
        },
        error: () => {
          this.snack.open('Create failed', '', { duration: 3000 });
          this.saving.set(false);
        }
      });
      return;
    }

    this.inventoryService.update(this.sku, payload).subscribe({
      next: () => {
        this.overviewState.loadedAsOwner.set(null);
        this.snack.open('Saved', '', { duration: 2000 });
        this.saving.set(false);
        this.router.navigate(['/item', this.sku]);
      },
      error: () => {
        this.snack.open('Save failed', '', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  deleteItem() {
    const confirmed = window.confirm(
      'Are you sure you want to delete this item instead of Archiving?'
    );
    if (!confirmed) return;

    this.deleting.set(true);
    this.inventoryService.delete(this.sku).subscribe({
      next: () => {
        this.snack.open('Item deleted', '', { duration: 2000 });
        this.router.navigate(['/overview']);
      },
      error: () => {
        this.snack.open('Delete failed', '', { duration: 3000 });
        this.deleting.set(false);
      }
    });
  }

  cancel() {
    if (this.isNew) {
      this.router.navigate(['/overview']);
    } else {
      this.router.navigate(['/item', this.sku]);
    }
  }
}
