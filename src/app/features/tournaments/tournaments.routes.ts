import { Routes } from '@angular/router';

export const TOURNAMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/tournaments-list/tournaments-list.component').then(m => m.TournamentsListComponent),
    title: 'Torneos - EasyGool'
  }
];
