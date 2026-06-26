import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InvestorService } from '../../core/services/investor.service';
import { ScoutService } from '../../core/services/scout.service';
import { InvestorDashboardComponent } from '../investor-dashboard/investor-dashboard.component';
import { ScoutDashboardComponent } from '../scout-dashboard/scout-dashboard.component';
import { InvestorDto, CreateInvestorDto } from '../../core/models/investor.models';
import { ScoutDto, CreateScoutDto } from '../../core/models/scout.models';

type PartnerType = 'investor' | 'scout' | null;
type FormTarget  = 'investor' | 'scout' | null;

@Component({
  selector: 'app-investors-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    InvestorDashboardComponent,
    ScoutDashboardComponent,
  ],
  template: `
    <div class="mgmt-wrap">

      <!-- Partner type selector -->
      <div class="type-row">
        <mat-form-field appearance="outline" class="type-select">
          <mat-label>Partner type</mat-label>
          <mat-select [(ngModel)]="partnerType" (ngModelChange)="onTypeChange()">
            <mat-option value="investor">Investor</mat-option>
            <mat-option value="scout">Scout</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- ── Investor section ──────────────────────────────────────────────── -->
      @if (partnerType === 'investor') {
        <div class="toolbar-row">
          <mat-form-field appearance="outline" class="partner-select" *ngIf="investors().length">
            <mat-label>Select investor</mat-label>
            <mat-select [(ngModel)]="selectedInvestorId" (ngModelChange)="onSelectInvestor($event)">
              <mat-option *ngFor="let inv of investors()" [value]="inv.id">
                {{ inv.name }} ({{ inv.fundingTag }})
              </mat-option>
            </mat-select>
          </mat-form-field>
          <span class="spacer"></span>
          <button mat-flat-button color="primary" (click)="openInvestorForm()">
            <mat-icon>add</mat-icon> Add Investor
          </button>
        </div>

        @if (formTarget === 'investor') {
          <mat-card class="edit-form">
            <mat-card-header>
              <mat-card-title>{{ editingInvestor ? 'Edit ' + editingInvestor.name : 'New Investor' }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="investorForm" (ngSubmit)="saveInvestor()" class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Name</mat-label>
                  <input matInput formControlName="name" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Google account email</mat-label>
                  <input matInput formControlName="email" type="email" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Funding Tag (e.g. F1)</mat-label>
                  <input matInput formControlName="fundingTag" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Funds Invested ($)</mat-label>
                  <input matInput formControlName="fundsInvested" type="number" min="0" step="0.01" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Profit Share (%)</mat-label>
                  <input matInput formControlName="profitSharePercent" type="number" min="0" max="100" step="0.01" />
                </mat-form-field>
                <div class="form-actions">
                  <button mat-button type="button" (click)="closeForm()">Cancel</button>
                  <button mat-flat-button color="primary" type="submit">Save</button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }

        @if (selectedInvestorId && formTarget !== 'investor') {
          <mat-divider class="dash-divider"></mat-divider>
          <app-investor-dashboard [investorId]="selectedInvestorId"></app-investor-dashboard>
        }
      }

      <!-- ── Scout section ─────────────────────────────────────────────────── -->
      @if (partnerType === 'scout') {
        <div class="toolbar-row">
          <mat-form-field appearance="outline" class="partner-select" *ngIf="scouts().length">
            <mat-label>Select scout</mat-label>
            <mat-select [(ngModel)]="selectedScoutId" (ngModelChange)="onSelectScout($event)">
              <mat-option *ngFor="let s of scouts()" [value]="s.id">
                {{ s.name }} ({{ s.tagId }})
              </mat-option>
            </mat-select>
          </mat-form-field>
          <span class="spacer"></span>
          <button mat-flat-button color="primary" (click)="openScoutForm()">
            <mat-icon>add</mat-icon> Add Scout
          </button>
        </div>

        @if (formTarget === 'scout') {
          <mat-card class="edit-form">
            <mat-card-header>
              <mat-card-title>{{ editingScout ? 'Edit ' + editingScout.name : 'New Scout' }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="scoutForm" (ngSubmit)="saveScout()" class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Name</mat-label>
                  <input matInput formControlName="name" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Google account email</mat-label>
                  <input matInput formControlName="email" type="email" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Tag ID (e.g. S1)</mat-label>
                  <input matInput formControlName="tagId" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Profit Share (%)</mat-label>
                  <input matInput formControlName="profitSharePercent" type="number" min="0" max="100" step="0.01" />
                </mat-form-field>
                <div class="form-actions">
                  <button mat-button type="button" (click)="closeForm()">Cancel</button>
                  <button mat-flat-button color="primary" type="submit">Save</button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }

        @if (selectedScoutId && formTarget !== 'scout') {
          <mat-divider class="dash-divider"></mat-divider>
          <app-scout-dashboard [scoutId]="selectedScoutId"></app-scout-dashboard>
        }
      }

    </div>
  `,
  styles: [`
    .mgmt-wrap      { padding: 24px 16px; max-width: 900px; margin: 0 auto; }
    .type-row       { margin-bottom: 24px; }
    .type-select    { min-width: 200px; }
    .toolbar-row    { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
    .partner-select { flex: 1; min-width: 220px; max-width: 360px; margin-bottom: -1.25em; }
    .spacer         { flex: 1; }
    .edit-form      { margin-top: 16px; }
    .form-grid      { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 8px; }
    .form-actions   { grid-column: 1 / -1; display: flex; gap: 12px; justify-content: flex-end; }
    .dash-divider   { margin: 24px 0 20px; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
  `],
})
export class InvestorsManagementComponent implements OnInit {
  private investorSvc = inject(InvestorService);
  private scoutSvc    = inject(ScoutService);
  private fb          = inject(FormBuilder);
  private snackBar    = inject(MatSnackBar);

  investors = signal<InvestorDto[]>([]);
  scouts    = signal<ScoutDto[]>([]);

  partnerType: PartnerType = null;
  selectedInvestorId: number | undefined;
  selectedScoutId: number | undefined;

  formTarget: FormTarget = null;
  editingInvestor: InvestorDto | null = null;
  editingScout: ScoutDto | null = null;

  investorForm = this.fb.group({
    name:               ['', Validators.required],
    email:              ['', [Validators.required, Validators.email]],
    fundingTag:         ['', Validators.required],
    fundsInvested:      [0, [Validators.required, Validators.min(0)]],
    profitSharePercent: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  scoutForm = this.fb.group({
    name:               ['', Validators.required],
    email:              ['', [Validators.required, Validators.email]],
    tagId:              ['', Validators.required],
    profitSharePercent: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  ngOnInit(): void {
    this.investorSvc.getAll().subscribe({
      next: list => {
        this.investors.set(list);
        if (list.length && !this.selectedInvestorId) this.selectedInvestorId = list[0].id;
      },
    });
    this.scoutSvc.getAll().subscribe({
      next: list => {
        this.scouts.set(list);
        if (list.length && !this.selectedScoutId) this.selectedScoutId = list[0].id;
      },
    });
  }

  onTypeChange(): void {
    this.formTarget = null;
  }

  // ── Investor actions ──────────────────────────────────────────────────────

  onSelectInvestor(id: number): void {
    this.selectedInvestorId = id;
    this.formTarget = null;
  }

  openInvestorForm(inv?: InvestorDto): void {
    this.editingInvestor = inv ?? null;
    this.editingScout    = null;
    this.investorForm.reset(inv ? {
      name: inv.name, email: inv.email, fundingTag: inv.fundingTag,
      fundsInvested: inv.fundsInvested, profitSharePercent: inv.profitSharePercent,
    } : { name: '', email: '', fundingTag: '', fundsInvested: 0, profitSharePercent: 0 });
    this.formTarget = 'investor';
  }

  saveInvestor(): void {
    this.investorForm.markAllAsTouched();
    if (this.investorForm.invalid) {
      this.snackBar.open('Please fill in all required fields correctly.', 'OK', { duration: 4000 });
      return;
    }
    const dto = this.investorForm.value as CreateInvestorDto;
    const req = this.editingInvestor
      ? this.investorSvc.update(this.editingInvestor.id, dto)
      : this.investorSvc.create(dto);
    req.subscribe({
      next: saved => {
        this.closeForm();
        this.investorSvc.getAll().subscribe(list => {
          this.investors.set(list);
          this.selectedInvestorId = saved.id;
        });
      },
      error: () => this.snackBar.open('Failed to save investor.', 'OK', { duration: 5000 }),
    });
  }

  // ── Scout actions ─────────────────────────────────────────────────────────

  onSelectScout(id: number): void {
    this.selectedScoutId = id;
    this.formTarget = null;
  }

  openScoutForm(scout?: ScoutDto): void {
    this.editingScout    = scout ?? null;
    this.editingInvestor = null;
    this.scoutForm.reset(scout ? {
      name: scout.name, email: scout.email, tagId: scout.tagId,
      profitSharePercent: scout.profitSharePercent,
    } : { name: '', email: '', tagId: '', profitSharePercent: 0 });
    this.formTarget = 'scout';
  }

  saveScout(): void {
    this.scoutForm.markAllAsTouched();
    if (this.scoutForm.invalid) {
      this.snackBar.open('Please fill in all required fields correctly.', 'OK', { duration: 4000 });
      return;
    }
    const dto = this.scoutForm.value as CreateScoutDto;
    const req = this.editingScout
      ? this.scoutSvc.update(this.editingScout.id, dto)
      : this.scoutSvc.create(dto);
    req.subscribe({
      next: saved => {
        this.closeForm();
        this.scoutSvc.getAll().subscribe(list => {
          this.scouts.set(list);
          this.selectedScoutId = saved.id;
        });
      },
      error: () => this.snackBar.open('Failed to save scout.', 'OK', { duration: 5000 }),
    });
  }

  closeForm(): void {
    this.formTarget      = null;
    this.editingInvestor = null;
    this.editingScout    = null;
  }
}
