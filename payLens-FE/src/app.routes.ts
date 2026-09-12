import { Routes } from '@angular/router';
import { ShellComponent } from './shared/components/shell/shell.component';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'employees',
    loadChildren: () =>
      import('./features/employees/employees.routes').then(
        (m) => m.EMPLOYEE_ROUTES,
      ),
  },
  {
    path: 'compensation',
    loadComponent: () =>
      import('./features/compensation/pages/compensation.component').then(
        (m) => m.CompensationComponent,
      ),
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./features/analytics/pages/analytics/analytics.component').then(
        (m) => m.AnalyticsComponent,
      ),
  },
  {
    path: 'ask',
    loadComponent: () =>
      import('./features/ask/pages/ask/ask.component').then(
        (m) => m.AskComponent,
      ),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
