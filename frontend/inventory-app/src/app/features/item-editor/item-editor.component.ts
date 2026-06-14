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
import { InventoryService } from '../../core/services/inventory.service';
import { InventoryItem, ItemImage, ItemState } from '../../core/models/inventory.models';

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
    MatDividerModule
  ],
  template: `
    <div class="editor-page">
      <div class="top-bar">
        <button mat-icon-button (click)="cancel()" aria-label="Back">
          <mat-icon>close</mat-icon>
        </button>
        <h2 class="page-title">{{ isNew ? 'New Item' : 'Edit Item' }}</h2>
        <span class="spacer"></span>
        <button mat-flat-button color="primary" [disabled]="saving()" (click)="save()">
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

            <mat-form-field appearance="outline" class="span3">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="3"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>State</mat-label>
              <mat-select formControlName="state">
                @for (s of states; track s) {
                  <mat-option [value]="s">{{ s }}</mat-option>
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
              <mat-label>Prep</mat-label>
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
    }

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
  images = signal<ItemImage[]>([]);
  uploadingSlot = signal<number | null>(null);

  states: ItemState[] = ['Processing', 'Listed', 'Sold', 'Archived'];

  photoSlots = () => Array.from({ length: 6 }, (_, i) => ({
    index: i,
    image: this.images()[i] ?? null
  }));

  constructor(
    private fb: FormBuilder,
    public inventoryService: InventoryService,
    private router: Router,
    private snack: MatSnackBar
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
      acquisitionCost: [item?.acquisitionCost ?? null],
      laborCost: [item?.laborCost ?? null],
      materialsCost: [item?.materialsCost ?? null],
      prepCost: [item?.prepCost ?? null],
      travelCost: [item?.travelCost ?? null],
      shippingCost: [item?.shippingCost ?? null],
      listPrice: [item?.listPrice ?? null],
      soldPrice: [item?.soldPrice ?? null],
      profit: [item?.profit ?? null],
      dateAcquired: [item?.dateAcquired ?? ''],
      dateListed: [item?.dateListed ?? ''],
      dateSold: [item?.dateSold ?? '']
    });

    if (!this.isNew) {
      this.form.get('sku')?.disable();
    }
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
    if (!this.form.valid) return;
    this.saving.set(true);

    const values = this.form.getRawValue();
    const payload = {
      ...values,
      dateAcquired: values.dateAcquired || null,
      dateListed:   values.dateListed   || null,
      dateSold:     values.dateSold     || null,
    };

    if (this.isNew) {
      this.inventoryService.create(payload).subscribe({
        next: created => {
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

  cancel() {
    if (this.isNew) {
      this.router.navigate(['/overview']);
    } else {
      this.router.navigate(['/item', this.sku]);
    }
  }
}
