import { Routes } from '@angular/router';

export const publicTeamsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./public-teams.component').then(c => c.PublicTeamsComponent),
    title: 'Equipos Participantes'
  }
];
