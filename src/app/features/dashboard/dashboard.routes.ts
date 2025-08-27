import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/layout/dashboard-layout.component').then(c => c.DashboardLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./components/home/home.component').then(c => c.HomeComponent)
      },
      {
        path: 'matches',
        loadComponent: () => import('./components/home/home.component').then(c => c.HomeComponent) // Placeholder
      },
      {
        path: 'teams',
        loadComponent: () => import('./components/home/home.component').then(c => c.HomeComponent) // Placeholder
      },
      {
        path: 'players',
        loadComponent: () => import('./components/home/home.component').then(c => c.HomeComponent) // Placeholder
      },
      {
        path: 'tournaments',
        loadComponent: () => import('./components/home/home.component').then(c => c.HomeComponent) // Placeholder
      },
      {
        path: 'stats',
        loadComponent: () => import('./components/home/home.component').then(c => c.HomeComponent) // Placeholder
      },
      {
        path: 'settings',
        loadComponent: () => import('./components/home/home.component').then(c => c.HomeComponent) // Placeholder
      },
      {
        path: 'profile',
        loadComponent: () => import('./components/home/home.component').then(c => c.HomeComponent) // Placeholder
      }
    ]
  }
];
