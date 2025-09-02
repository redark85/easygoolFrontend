import { Routes } from '@angular/router';
import { TournamentsListComponent } from './components/tournaments-list/tournaments-list.component';

export const tournamentsRoutes: Routes = [
  {
    path: '',
    component: TournamentsListComponent,
    title: 'Torneos - EasyGool'
  }
];
