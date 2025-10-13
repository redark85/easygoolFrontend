import { Routes } from '@angular/router';

export const PUBLIC_TOURNAMENT_STATS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./public-tournament-stats.component').then(c => c.PublicTournamentStatsComponent)
  }
];
