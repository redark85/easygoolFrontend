import { Routes } from '@angular/router';

export const managerRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/manager-dashboard.component').then(c => c.ManagerDashboardComponent),
    title: 'Dashboard - Manager'
  }
];
