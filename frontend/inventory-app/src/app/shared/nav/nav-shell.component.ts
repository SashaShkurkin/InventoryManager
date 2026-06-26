import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-nav-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  template: `
    <mat-sidenav-container class="shell-container">
      <mat-sidenav #sidenav mode="over" [fixedInViewport]="true">
        <mat-nav-list>
          <!-- Public / employee / scout items -->
          @if (!auth.isInvestor() && !auth.isScout()) {
            <a mat-list-item routerLink="/overview" routerLinkActive="active-link" (click)="sidenav.close()">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>{{ auth.isOwner() ? 'Overview' : 'Store' }}</span>
            </a>
            <a mat-list-item routerLink="/search" routerLinkActive="active-link" (click)="sidenav.close()">
              <mat-icon matListItemIcon>search</mat-icon>
              <span matListItemTitle>Search</span>
            </a>
          }

          <!-- Owner-only items -->
          @if (auth.isOwner()) {
            <a mat-list-item routerLink="/performance" routerLinkActive="active-link" (click)="sidenav.close()">
              <mat-icon matListItemIcon>bar_chart</mat-icon>
              <span matListItemTitle>Performance</span>
            </a>
            <a mat-list-item routerLink="/reports" routerLinkActive="active-link" (click)="sidenav.close()">
              <mat-icon matListItemIcon>picture_as_pdf</mat-icon>
              <span matListItemTitle>Reports</span>
            </a>
            <a mat-list-item routerLink="/investors" routerLinkActive="active-link" (click)="sidenav.close()">
              <mat-icon matListItemIcon>groups</mat-icon>
              <span matListItemTitle>Partners</span>
            </a>
            <a mat-list-item routerLink="/expenses" routerLinkActive="active-link" (click)="sidenav.close()">
              <mat-icon matListItemIcon>receipt_long</mat-icon>
              <span matListItemTitle>Expenses</span>
            </a>
          }

          <!-- Investor-only item -->
          @if (auth.isInvestor()) {
            <a mat-list-item routerLink="/investor/dashboard" routerLinkActive="active-link" (click)="sidenav.close()">
              <mat-icon matListItemIcon>insights</mat-icon>
              <span matListItemTitle>My Dashboard</span>
            </a>
          }

          <!-- Scout-only item -->
          @if (auth.isScout()) {
            <a mat-list-item routerLink="/scout/dashboard" routerLinkActive="active-link" (click)="sidenav.close()">
              <mat-icon matListItemIcon>explore</mat-icon>
              <span matListItemTitle>My Dashboard</span>
            </a>
          }

          <!-- Login options (visible when not signed in as anything) -->
          @if (!auth.isAuthenticated()) {
            <mat-divider style="margin:8px 0"/>
            <a mat-list-item routerLink="/login" routerLinkActive="active-link" (click)="sidenav.close()">
              <mat-icon matListItemIcon>badge</mat-icon>
              <span matListItemTitle>Employee Login</span>
            </a>
            <a mat-list-item routerLink="/investor" routerLinkActive="active-link" (click)="sidenav.close()">
              <mat-icon matListItemIcon>account_balance</mat-icon>
              <span matListItemTitle>Investor Portal</span>
            </a>
            <a mat-list-item routerLink="/scout" routerLinkActive="active-link" (click)="sidenav.close()">
              <mat-icon matListItemIcon>explore</mat-icon>
              <span matListItemTitle>Scout Portal</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="app-toolbar">
          <button mat-icon-button (click)="sidenav.toggle()" aria-label="Menu">
            <mat-icon>menu</mat-icon>
          </button>

          <span class="spacer"></span>

          @if (auth.isAuthenticated()) {
            <span class="role-label">{{ auth.isOwner() ? 'Owner' : auth.isInvestor() ? 'Investor' : 'Scout' }}</span>
            <button mat-icon-button (click)="auth.signOut()" matTooltip="Sign out" aria-label="Sign out">
              <mat-icon>logout</mat-icon>
            </button>
          }
        </mat-toolbar>

        <div class="page-logo">
          <img src="/logo.png" alt="Nine Lives Furnishings" />
        </div>

        <main class="main-content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell-container { height: 100vh; }
    .app-toolbar { position: sticky; top: 0; z-index: 100; }
    .spacer { flex: 1; }

    .role-label {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-right: 8px;
      opacity: 0.85;
    }

    .page-logo {
      display: flex;
      justify-content: center;
      padding: 24px 16px 8px;
      img { width: 320px; max-width: 80vw; height: auto; display: block; }
    }
    .main-content { padding: 16px; max-width: 1400px; margin: 0 auto; }
    .active-link { background: rgba(0,0,0,0.08) !important; }
    mat-sidenav { width: 220px; }
  `]
})
export class NavShellComponent {
  constructor(public auth: AuthService) {}
}
