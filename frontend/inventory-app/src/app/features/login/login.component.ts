import { Component, inject, effect, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="login-wrap">
      <mat-card class="login-card">
        <mat-card-content>
          <h2>Employee Login</h2>
          <p>Sign in with your registered Google account.</p>
          <div #googleBtn class="google-btn-wrap"></div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 70vh;
    }
    .login-card {
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
export class LoginComponent implements AfterViewInit {
  @ViewChild('googleBtn') googleBtnEl!: ElementRef<HTMLElement>;

  auth   = inject(AuthService);
  router = inject(Router);

  constructor() {
    effect(() => {
      if (this.auth.isOwner()) this.router.navigate(['/overview']);
    });
  }

  ngAfterViewInit() {
    this.auth.renderButton(this.googleBtnEl.nativeElement, 'owner');
  }
}
