import { Routes } from '@angular/router';

export const publicTopScorersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./public-top-scorers.component').then(c => c.PublicTopScorersComponent),
    title: 'Estadísticas de Jugadores'
  }
];
