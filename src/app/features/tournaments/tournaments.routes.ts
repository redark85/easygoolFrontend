import { Routes } from '@angular/router';
import { TournamentsListComponent } from './components/tournaments-list/tournaments-list.component';
import { TournamentManagementComponent } from './components/tournament-management/tournament-management.component';

export const tournamentsRoutes: Routes = [
  {
    path: '',
    component: TournamentsListComponent,
    title: 'Torneos - EasyGool'
  },
  {
    path: ':id/manage',
    component: TournamentManagementComponent,
    title: 'Administrar Torneo - EasyGool'
  }
];
