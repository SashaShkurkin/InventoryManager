import { Component, inject, effect, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-scout-portal',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="portal-wrap">
      <mat-card class="portal-card">
        <mat-card-content>
          <h2>Scout Portal</h2>
          <p>Sign in with your registered Google account to view your scouting dashboard.</p>
          <div #googleBtn class="google-btn-wrap"></div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .portal-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 70vh;
    }
    .portal-card {
      max-width: 400px;
      width: 100%;
      text-align: center;
      padding: 32px 24px;
    }
    h2 { margin-bottom: 12px; }
    p  { color: #666; margin-bottom: 24px; }
    .google-btn-wrap { display: flex; justify-content: center; }
  `]
})
export class ScoutPortalComponent implements AfterViewInit {
  @ViewChild('googleBtn') googleBtnEl!: ElementRef<HTMLElement>;

  auth   = inject(AuthService);
  router = inject(Router);

  constructor() {
    effect(() => {
      if (this.auth.isScout()) this.router.navigate(['/scout/dashboard']);
    });
  }

  ngAfterViewInit() {
    this.auth.renderButton(this.googleBtnEl.nativeElement, 'scout');
  }
}
