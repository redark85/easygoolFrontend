import { Routes } from '@angular/router';

export const managerRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/manager-dashboard.component').then(c => c.ManagerDashboardComponent),
    title: 'Dashboard - Manager'
  },
  {
    path: 'team-info',
    loadComponent: () => import('./components/my-team/team-info/team-info.component').then(c => c.TeamInfoComponent),
    title: 'Información del Equipo - Manager'
  },
  {
    path: 'team-players',
    loadComponent: () => import('./components/my-team/team-players/team-players.component').then(c => c.TeamPlayersComponent),
    title: 'Gestión de Jugadores - Manager'
  },
  {
    path: 'team-lineup',
    loadComponent: () => import('./components/my-team/team-lineup/team-lineup.component').then(c => c.TeamLineupComponent),
    title: 'Plantilla y Alineaciones - Manager'
  },
  {
    path: 'matches-calendar',
    loadComponent: () => import('./components/matches/matches-calendar/matches-calendar.component').then(c => c.MatchesCalendarComponent),
    title: 'Calendario de Partidos - Manager'
  },
  {
    path: 'matches-history',
    loadComponent: () => import('./components/matches/matches-history/matches-history.component').then(c => c.MatchesHistoryComponent),
    title: 'Historial de Partidos - Manager'
  }
];
