import { Routes } from '@angular/router';

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
        loadComponent: () =>
          import('./features/item-editor/item-editor.component').then(m => m.ItemEditorComponent)
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then(m => m.ReportsComponent)
      }
    ]
  }
];
