import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Redirect root to login
  { 
    path: '', 
    redirectTo: '/auth/login', 
    pathMatch: 'full' 
  },
  
  // Auth routes (lazy loaded)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(r => r.authRoutes)
  },
  
  // Dashboard routes (lazy loaded, protected)
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes),
    canActivate: [AuthGuard]
  },
  
  // Tournaments routes (lazy loaded, protected)
  {
    path: 'tournaments',
    loadChildren: () => import('./features/tournaments/tournaments.routes').then(r => r.tournamentsRoutes),
    canActivate: [AuthGuard]
  },
  
  // Wildcard route - redirect to login
  { 
    path: '**', 
    redirectTo: '/auth/login' 
  }
];
