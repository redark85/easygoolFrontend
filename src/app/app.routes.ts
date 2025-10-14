import { Routes } from '@angular/router';
import { AuthGuard, NoAuthGuard } from './core/guards';

export const routes: Routes = [
  // Landing page (without layout)
  {
    path: '',
    loadComponent: () => import('./features/auth/components/landing/landing.component').then(c => c.LandingComponent),
    pathMatch: 'full',
    canActivate: [NoAuthGuard]
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
      
      // Teams routes
      {
        path: 'teams',
        children: [
          {
            path: 'my-teams',
            loadComponent: () => import('./features/teams/components/my-teams/my-teams.component').then(c => c.MyTeamsComponent)
          },
          {
            path: 'standings/:tournamentId',
            loadComponent: () => import('./features/teams/components/standings/standings.component').then(c => c.StandingsComponent)
          },
          {
            path: '',
            redirectTo: 'my-teams',
            pathMatch: 'full'
          }
        ]
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
      },
      
      // Manager routes (Dashboard del Manager)
      {
        path: 'manager',
        loadChildren: () => import('./features/manager/manager.routes').then(r => r.managerRoutes)
      }
    ]
  },
  
  // Vocalia routes (lazy loaded, protected, fullscreen without sidebar)
  {
    path: 'vocalia',
    loadChildren: () => import('./features/vocalia/vocalia.routes').then(r => r.VOCALIA_ROUTES)
  },
  
  // Fixture viewer (public access)
  {
    path: 'fixture-viewer',
    loadComponent: () => import('./features/fixture-viewer/fixture-viewer.component').then(c => c.FixtureViewerComponent)
  },
  
  // Public standings (public access, no layout)
  {
    path: 'public-standings/:tournamentId',
    loadComponent: () => import('./features/public-standings/public-standings.component').then(c => c.PublicStandingsComponent)
  },
  
  // Tournament Home (public access, no layout)
  {
    path: 'tournament-home/:tournamentId',
    loadComponent: () => import('./features/tournament-home/tournament-home.component').then(c => c.TournamentHomeComponent),
    title: 'Inicio - Torneo'
  },
  
  // Public Fixture (public access, no layout)
  {
    path: 'public-fixture/:tournamentId',
    loadComponent: () => import('./features/public-fixture/public-fixture.component').then(c => c.PublicFixtureComponent),
    title: 'Fixture Completo - Torneo'
  },
  
  // Public Match Detail (public access, no layout)
  {
    path: 'public-match-detail/:matchId',
    loadComponent: () => import('./features/public-match-detail/public-match-detail.component').then(c => c.PublicMatchDetailComponent),
    title: 'Detalle del Partido'
  },
  
  // Public Top Scorers (public access, no layout)
  {
    path: 'public-top-scorers/:tournamentId',
    loadComponent: () => import('./features/public-top-scorers/public-top-scorers.component').then(c => c.PublicTopScorersComponent),
    title: 'Estadísticas de Jugadores'
  },
  
  // Public Teams (public access, no layout)
  {
    path: 'public-teams/:tournamentId',
    loadComponent: () => import('./features/public-teams/public-teams.component').then(c => c.PublicTeamsComponent),
    title: 'Equipos Participantes'
  },
  
  // Public Team Detail (public access, no layout)
  {
    path: 'public-team-detail/:teamId',
    loadComponent: () => import('./features/public-team-detail/public-team-detail.component').then(c => c.PublicTeamDetailComponent),
    title: 'Detalle del Equipo'
  },
  
  // Public Tournament Stats (public access, no layout)
  {
    path: 'public-tournament-stats/:tournamentId',
    loadComponent: () => import('./features/public-tournament-stats/public-tournament-stats.component').then(c => c.PublicTournamentStatsComponent),
    title: 'Estadísticas del Torneo'
  },
  
  // Not Found page
  {
    path: 'not-found',
    loadComponent: () => import('./features/not-found/not-found.component').then(c => c.NotFoundComponent)
  },
  
  // Wildcard route - redirect to not found
  { 
    path: '**', 
    redirectTo: '/not-found' 
  }
];
