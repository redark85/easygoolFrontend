import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Landing page (without layout)
  {
    path: '',
    loadComponent: () => import('./features/auth/components/landing/landing.component').then(c => c.LandingComponent),
    pathMatch: 'full'
  },
  
  // Auth routes (lazy loaded)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(r => r.authRoutes)
  },
  
  // Main app routes with layout (sidebar + header)
  {
    path: '',
    loadComponent: () => import('./features/dashboard/components/layout/dashboard-layout.component').then(c => c.DashboardLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      // Tournaments routes
      {
        path: 'tournaments',
        loadChildren: () => import('./features/tournaments/tournaments.routes').then(r => r.tournamentsRoutes)
      },
      
      // Matches routes
      {
        path: 'matches',
        loadChildren: () => import('./features/matches/matches.routes').then(r => r.MATCHES_ROUTES)
      },
      
      // Teams routes - Placeholder
      {
        path: 'teams',
        loadComponent: () => import('./features/dashboard/components/home/home.component').then(c => c.HomeComponent)
      },
      
      // Players routes - Placeholder
      {
        path: 'players',
        loadComponent: () => import('./features/dashboard/components/home/home.component').then(c => c.HomeComponent)
      },
      
      // Stats routes - Placeholder
      {
        path: 'stats',
        loadComponent: () => import('./features/dashboard/components/home/home.component').then(c => c.HomeComponent)
      },
      
      // Settings routes - Placeholder
      {
        path: 'settings',
        loadComponent: () => import('./features/dashboard/components/home/home.component').then(c => c.HomeComponent)
      },
      
      // Profile routes - Placeholder
      {
        path: 'profile',
        loadComponent: () => import('./features/dashboard/components/home/home.component').then(c => c.HomeComponent)
      },
      
      // Leagues routes - Placeholder
      {
        path: 'leagues',
        loadComponent: () => import('./features/dashboard/components/home/home.component').then(c => c.HomeComponent)
      }
    ]
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
