import { Routes } from '@angular/router';

export const publicMatchDetailRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./public-match-detail.component').then(c => c.PublicMatchDetailComponent),
    title: 'Detalle del Partido'
  }
];
