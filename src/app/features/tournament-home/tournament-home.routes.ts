import { Routes } from '@angular/router';

export const tournamentHomeRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tournament-home.component').then(c => c.TournamentHomeComponent),
    title: 'Inicio - Torneo'
  }
];
