import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { investorGuard } from './core/guards/investor.guard';
import { scoutGuard } from './core/guards/scout.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  {
    path: '',
    loadComponent: () =>
      import('./shared/nav/nav-shell.component').then(m => m.NavShellComponent),
    children: [
      {
        path: 'overview',
        loadComponent: () =>
          import('./features/overview/overview.component').then(m => m.OverviewComponent)
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./features/search/search.component').then(m => m.SearchComponent)
      },
      {
        path: 'item/:sku',
        loadComponent: () =>
          import('./features/item-view/item-view.component').then(m => m.ItemViewComponent)
      },
      {
        path: 'item/:sku/edit',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/item-editor/item-editor.component').then(m => m.ItemEditorComponent)
      },
      {
        path: 'performance',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/performance/performance.component').then(m => m.PerformanceComponent)
      },
      {
        path: 'reports',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        // Owner-side investor management
        path: 'investors',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/investors-management/investors-management.component')
            .then(m => m.InvestorsManagementComponent)
      },
      {
        path: 'expenses',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/expenses/expenses.component').then(m => m.ExpensesComponent)
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/login/login.component').then(m => m.LoginComponent)
      },
      {
        // Public investor landing — shows login button
        path: 'investor',
        loadComponent: () =>
          import('./features/investor-portal/investor-portal.component')
            .then(m => m.InvestorPortalComponent)
      },
      {
        // Investor self-service dashboard
        path: 'investor/dashboard',
        canActivate: [investorGuard],
        loadComponent: () =>
          import('./features/investor-dashboard/investor-my-dashboard.component')
            .then(m => m.InvestorMyDashboardComponent)
      },
      {
        // Public scout landing — shows login button
        path: 'scout',
        loadComponent: () =>
          import('./features/scout-portal/scout-portal.component')
            .then(m => m.ScoutPortalComponent)
      },
      {
        // Scout self-service dashboard
        path: 'scout/dashboard',
        canActivate: [scoutGuard],
        loadComponent: () =>
          import('./features/scout-dashboard/scout-my-dashboard.component')
            .then(m => m.ScoutMyDashboardComponent)
      },
    ]
  }
];
