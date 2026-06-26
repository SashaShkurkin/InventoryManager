import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExpenseService } from '../../core/services/expenses.service';
import { Expense, CreateExpense, EXPENSE_TYPES } from '../../core/models/inventory.models';

// ── Inline dialog component ──────────────────────────────────────────────────

@Component({
  selector: 'app-expense-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Expense' : 'New Expense' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="expense-form">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Type</mat-label>
          <mat-select formControlName="type">
            @for (t of expenseTypes; track t.value) {
              <mat-option [value]="t.value">{{ t.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" placeholder="Brief description" />
        </mat-form-field>

        <div class="row-2">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Amount ($)</mat-label>
            <input matInput type="number" step="0.01" min="0" formControlName="amount" />
            <span matPrefix>$&nbsp;</span>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Payment Method</mat-label>
            <input matInput formControlName="paymentMethod"
                   placeholder="Cash, Card, etc." />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="date" />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Address</mat-label>
          <input matInput formControlName="address"
                 placeholder="Vendor / location address" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="3"
                    placeholder="Any additional details"></textarea>
        </mat-form-field>

        <!-- Receipt photo upload — only shown after expense is saved -->
        @if (data) {
          <div class="receipt-row">
            <span class="receipt-label">Receipt photo</span>
            @if (data.hasReceipt) {
              <a [href]="receiptUrl" target="_blank" mat-stroked-button>
                <mat-icon>image</mat-icon> View receipt
              </a>
            }
            <button mat-stroked-button type="button" (click)="receiptInput.click()">
              <mat-icon>upload</mat-icon>
              {{ data.hasReceipt ? 'Replace' : 'Upload' }}
            </button>
            <input #receiptInput type="file" hidden accept="image/*,application/pdf"
                   (change)="onReceiptSelected($event)" />
            @if (receiptFileName) {
              <span class="receipt-filename">{{ receiptFileName }}</span>
            }
          </div>
        } @else {
          <p class="receipt-hint">
            <mat-icon style="font-size:16px;vertical-align:middle">info</mat-icon>
            Save the expense first, then upload a receipt photo.
          </p>
        }

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary"
              [disabled]="form.invalid || saving()"
              (click)="save()">
        @if (saving()) { <mat-spinner diameter="18" style="display:inline-block" /> }
        @else { {{ data ? 'Save Changes' : 'Create' }} }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .expense-form { display: flex; flex-direction: column; gap: 4px; min-width: 480px; padding-top: 8px; }
    .full-width { width: 100%; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .receipt-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 4px 0 8px; }
    .receipt-label { font-size: 14px; color: rgba(0,0,0,.6); }
    .receipt-filename { font-size: 12px; color: rgba(0,0,0,.5); }
    .receipt-hint { font-size: 12px; color: rgba(0,0,0,.5); display: flex; align-items: center; gap: 4px; margin: 0; }
  `]
})
export class ExpenseDialogComponent {
  expenseTypes = EXPENSE_TYPES;
  form: FormGroup;
  saving = signal(false);
  receiptFileName = '';
  pendingReceiptFile: File | null = null;

  get data(): Expense | null { return (this as any)._data ?? null; }
  get receiptUrl(): string {
    return this.data ? this.svc.receiptUrl(this.data.id) : '';
  }

  constructor(
    private fb: FormBuilder,
    private svc: ExpenseService,
    private snack: MatSnackBar,
    private dialogRef: MatDialogRef<ExpenseDialogComponent>,
  ) {
    const today = new Date();
    this.form = this.fb.group({
      type:          ['', Validators.required],
      title:         ['', Validators.required],
      amount:        [null],
      paymentMethod: [''],
      date:          [today, Validators.required],
      address:       [''],
      notes:         [''],
    });
  }

  // Called by parent to inject data after construction
  init(data: Expense | null) {
    (this as any)._data = data;
    if (data) {
      const [y, m, d] = data.date.split('-').map(Number);
      this.form.patchValue({
        type:          data.type,
        title:         data.title,
        amount:        data.amount ?? null,
        paymentMethod: data.paymentMethod ?? '',
        date:          new Date(y, m - 1, d),
        address:       data.address ?? '',
        notes:         data.notes ?? '',
      });
    }
  }

  onReceiptSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.pendingReceiptFile = file;
      this.receiptFileName = file.name;
    }
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);

    const v = this.form.value;
    const d: Date = v.date;
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const payload: CreateExpense = {
      type:          v.type,
      title:         v.title.trim(),
      amount:        v.amount ?? undefined,
      paymentMethod: v.paymentMethod?.trim() || undefined,
      date:          dateStr,
      address:       v.address?.trim() || undefined,
      notes:         v.notes?.trim() || undefined,
    };

    const call = this.data
      ? this.svc.update(this.data.id, payload)
      : this.svc.create(payload);

    call.subscribe({
      next: (expense) => {
        if (this.pendingReceiptFile) {
          this.svc.uploadReceipt(expense.id, this.pendingReceiptFile).subscribe({
            complete: () => { this.saving.set(false); this.dialogRef.close(true); },
            error:    () => { this.saving.set(false); this.dialogRef.close(true); }
          });
        } else {
          this.saving.set(false);
          this.dialogRef.close(true);
        }
      },
      error: () => {
        this.saving.set(false);
        this.snack.open('Failed to save expense', 'Dismiss', { duration: 4000 });
      }
    });
  }
}

// ── Page component ───────────────────────────────────────────────────────────

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="expenses-page">

      <div class="page-header">
        <div class="header-left">
          <h2 class="page-title">Expenses</h2>
          @if (!loading()) {
            <span class="total-badge">{{ total() }} total</span>
          }
        </div>
        <button mat-flat-button color="primary" (click)="openNew()">
          <mat-icon>add</mat-icon> New Expense
        </button>
      </div>

      @if (loading()) {
        <div class="spinner-wrap"><mat-spinner diameter="44" /></div>
      } @else if (expenses().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">receipt_long</mat-icon>
          <p>No expenses yet. Click <strong>New Expense</strong> to add one.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table mat-table [dataSource]="expenses()" class="expenses-table">

            <ng-container matColumnDef="expenseCode">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let e" class="mono">{{ e.expenseCode }}</td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let e">{{ e.date }}</td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let e">
                <span class="type-chip">{{ typeLabel(e.type) }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Title</th>
              <td mat-cell *matCellDef="let e" class="title-cell">{{ e.title }}</td>
            </ng-container>

            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef class="num-col">Amount</th>
              <td mat-cell *matCellDef="let e" class="num-col">
                {{ e.amount != null ? ('$' + (e.amount | number:'1.2-2')) : '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="paymentMethod">
              <th mat-header-cell *matHeaderCellDef>Payment</th>
              <td mat-cell *matCellDef="let e">{{ e.paymentMethod || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="address">
              <th mat-header-cell *matHeaderCellDef>Address</th>
              <td mat-cell *matCellDef="let e" class="address-cell">{{ e.address || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="notes">
              <th mat-header-cell *matHeaderCellDef>Notes</th>
              <td mat-cell *matCellDef="let e" class="notes-cell">{{ e.notes || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="receipt">
              <th mat-header-cell *matHeaderCellDef class="center-col">Receipt</th>
              <td mat-cell *matCellDef="let e" class="center-col">
                @if (e.hasReceipt) {
                  <a [href]="svc.receiptUrl(e.id)" target="_blank" mat-icon-button
                     matTooltip="View receipt">
                    <mat-icon>image</mat-icon>
                  </a>
                } @else {
                  <span style="color:rgba(0,0,0,.3)">—</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let e" class="actions-col">
                <button mat-icon-button matTooltip="Edit" (click)="openEdit(e)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Delete" color="warn"
                        (click)="deleteExpense(e)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"
                class="expense-row"></tr>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-bar">
          <span class="page-info">
            Showing {{ pageStart() }}–{{ pageEnd() }} of {{ total() }}
          </span>
          <div class="page-btns">
            <button mat-stroked-button [disabled]="page() === 0" (click)="prevPage()">
              <mat-icon>chevron_left</mat-icon> Previous 50
            </button>
            <button mat-stroked-button [disabled]="pageEnd() >= total()" (click)="nextPage()">
              Next 50 <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .expenses-page { max-width: 1400px; margin: 0 auto; }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .page-title { margin: 0; font-size: 22px; font-weight: 600; }
    .total-badge {
      font-size: 12px;
      background: rgba(0,0,0,.08);
      padding: 2px 10px;
      border-radius: 12px;
      color: rgba(0,0,0,.6);
    }

    .spinner-wrap { display: flex; justify-content: center; padding: 60px 0; }

    .empty-state {
      text-align: center;
      padding: 80px 0;
      color: rgba(0,0,0,.4);
    }
    .empty-icon { font-size: 56px; height: 56px; width: 56px; margin-bottom: 12px; }

    .table-wrap { overflow-x: auto; }

    .expenses-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    /* tight rows */
    .expenses-table th.mat-header-cell,
    .expenses-table td.mat-cell {
      padding: 8px 12px;
      border-bottom: 1px solid rgba(0,0,0,.08);
      white-space: nowrap;
    }

    .expenses-table tr.expense-row:hover { background: rgba(0,0,0,.03); cursor: pointer; }

    .mono { font-family: monospace; letter-spacing: .04em; }

    .title-cell { max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
    .address-cell { max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
    .notes-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; color: rgba(0,0,0,.6); }

    .num-col { text-align: right !important; }
    .center-col { text-align: center !important; }
    .actions-col { white-space: nowrap; text-align: right; }

    .type-chip {
      font-size: 11px;
      font-weight: 600;
      background: rgba(63,81,181,.1);
      color: #3f51b5;
      padding: 2px 8px;
      border-radius: 10px;
      white-space: nowrap;
    }

    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 4px 0;
    }
    .page-info { font-size: 13px; color: rgba(0,0,0,.5); }
    .page-btns { display: flex; gap: 8px; }
  `]
})
export class ExpensesComponent implements OnInit {
  readonly columns = [
    'expenseCode', 'date', 'type', 'title',
    'amount', 'paymentMethod', 'address', 'notes', 'receipt', 'actions'
  ];

  expenses = signal<Expense[]>([]);
  total    = signal(0);
  page     = signal(0);
  loading  = signal(true);

  pageStart = computed(() => this.page() * 50 + 1);
  pageEnd   = computed(() => Math.min((this.page() + 1) * 50, this.total()));

  private readonly typeMap = new Map(EXPENSE_TYPES.map(t => [t.value, t.label]));

  constructor(
    public svc: ExpenseService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll(this.page(), 50).subscribe({
      next: (r) => {
        this.expenses.set(r.items);
        this.total.set(r.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snack.open('Failed to load expenses', 'Dismiss', { duration: 4000 });
      }
    });
  }

  typeLabel(type: string): string {
    return this.typeMap.get(type as any) ?? type;
  }

  nextPage() { this.page.update(p => p + 1); this.load(); }
  prevPage() { this.page.update(p => p - 1); this.load(); }

  openNew()          { this.openDialog(null); }
  openEdit(e: Expense) { this.openDialog(e); }

  private openDialog(data: Expense | null) {
    const ref = this.dialog.open(ExpenseDialogComponent, {
      width: '560px',
      autoFocus: true,
    });
    ref.componentInstance.init(data);
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  deleteExpense(e: Expense) {
    if (!confirm(`Delete expense ${e.expenseCode} — "${e.title}"?`)) return;
    this.svc.delete(e.id).subscribe({
      next: () => { this.snack.open('Expense deleted', '', { duration: 2500 }); this.load(); },
      error: () => this.snack.open('Failed to delete', 'Dismiss', { duration: 4000 })
    });
  }
}
