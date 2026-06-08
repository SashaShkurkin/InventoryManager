import { Component, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';

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
    MatListModule
  ],
  template: `
    <mat-sidenav-container class="shell-container">
      <mat-sidenav #sidenav mode="over" [fixedInViewport]="true">
        <mat-nav-list>
          <a mat-list-item routerLink="/overview" routerLinkActive="active-link" (click)="sidenav.close()">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Overview</span>
          </a>
          <a mat-list-item routerLink="/search" routerLinkActive="active-link" (click)="sidenav.close()">
            <mat-icon matListItemIcon>search</mat-icon>
            <span matListItemTitle>Search</span>
          </a>
          <a mat-list-item routerLink="/reports" routerLinkActive="active-link" (click)="sidenav.close()">
            <mat-icon matListItemIcon>picture_as_pdf</mat-icon>
            <span matListItemTitle>Reports</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="app-toolbar">
          <button mat-icon-button (click)="sidenav.toggle()" aria-label="Menu">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="app-title">Furniture Inventory</span>
        </mat-toolbar>
        <main class="main-content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell-container { height: 100vh; }
    .app-toolbar { position: sticky; top: 0; z-index: 100; }
    .app-title { margin-left: 8px; font-size: 1.1rem; letter-spacing: 0.5px; }
    .main-content { padding: 16px; max-width: 1400px; margin: 0 auto; }
    .active-link { background: rgba(0,0,0,0.08) !important; }
    mat-sidenav { width: 220px; }
  `]
})
export class NavShellComponent {}
