import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InventoryService } from '../../core/services/inventory.service';

type ReportType = 'all-time' | 'current' | 'revenue';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="reports-page">
      <h2 class="page-title">Reports</h2>
      <p class="page-sub">Generate and download PDF reports from your inventory data.</p>

      <div class="report-buttons">
        @for (r of reportDefs; track r.key) {
          <button
            mat-flat-button
            color="primary"
            class="report-btn"
            [disabled]="loading()[r.key]"
            (click)="download(r.key)"
          >
            @if (loading()[r.key]) {
              <mat-spinner diameter="20" class="btn-spinner" />
            } @else {
              <mat-icon>picture_as_pdf</mat-icon>
            }
            {{ r.label }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .reports-page { max-width: 480px; }
    .page-title { margin: 0 0 6px; font-size: 1.4rem; }
    .page-sub { color: #666; margin: 0 0 32px; }

    .report-buttons {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .report-btn {
      height: 56px;
      font-size: 1rem;
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: flex-start;
      padding-left: 20px;
      mat-icon, .btn-spinner { margin-right: 8px; }
    }

    @media (max-width: 600px) {
      .reports-page { max-width: 100%; }
    }
  `]
})
export class ReportsComponent {
  reportDefs: { key: ReportType; label: string }[] = [
    { key: 'all-time', label: 'All Time Inventory' },
    { key: 'current', label: 'Current Inventory' },
    { key: 'revenue', label: 'Revenue' }
  ];

  loading = signal<Record<ReportType, boolean>>({
    'all-time': false,
    'current': false,
    'revenue': false
  });

  constructor(
    private inventoryService: InventoryService,
    private snack: MatSnackBar
  ) {}

  download(type: ReportType) {
    this.loading.update(s => ({ ...s, [type]: true }));

    this.inventoryService.getReport(type).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        this.loading.update(s => ({ ...s, [type]: false }));
      },
      error: () => {
        this.snack.open('Failed to generate report', 'Dismiss', { duration: 4000 });
        this.loading.update(s => ({ ...s, [type]: false }));
      }
    });
  }
}
