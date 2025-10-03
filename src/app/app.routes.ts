import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Landing page
  { 
    path: '', 
    loadComponent: () => import('./features/auth/components/landing/landing.component').then(c => c.LandingComponent)
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
  
  // Vocalia routes (lazy loaded, protected, fullscreen without sidebar)
  {
    path: 'vocalia',
    loadChildren: () => import('./features/vocalia/vocalia.routes').then(r => r.VOCALIA_ROUTES),
    canActivate: [AuthGuard]
  },
  
  // Fixture viewer (public access)
  {
    path: 'fixture-viewer',
    loadComponent: () => import('./features/fixture-viewer/fixture-viewer.component').then(c => c.FixtureViewerComponent)
  },
  
  // Wildcard route - redirect to landing
  { 
    path: '**', 
    redirectTo: '/' 
  }
];
