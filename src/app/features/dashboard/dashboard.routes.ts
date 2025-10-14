import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/layout/dashboard-layout.component').then(c => c.DashboardLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'tournaments',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent),
        title: 'Dashboard - EasyGool'
      },
      {
        path: 'tournaments',
        loadChildren: () => import('../tournaments/tournaments.routes').then(r => r.tournamentsRoutes),
        title: 'Torneos - EasyGool'
      },
      {
        path: 'matches',
        loadChildren: () => import('../matches/matches.routes').then(r => r.MATCHES_ROUTES)
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
      },
      {
        path: 'manager',
        loadChildren: () => import('../manager/manager.routes').then(r => r.managerRoutes),
        title: 'Manager - EasyGool'
      }
    ]
  }
];
