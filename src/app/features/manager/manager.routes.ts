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
    path: 'matches-calendar',
    loadComponent: () => import('./components/matches/matches-calendar/matches-calendar.component').then(c => c.MatchesCalendarComponent),
    title: 'Calendario de Partidos - Manager'
  },
  {
    path: 'matches-history',
    loadComponent: () => import('./components/matches/matches-history/matches-history.component').then(c => c.MatchesHistoryComponent),
    title: 'Historial de Partidos - Manager'
  },
  {
    path: 'team-stats',
    loadComponent: () => import('./components/statistics/team-stats/team-stats.component').then(c => c.TeamStatsComponent),
    title: 'Estadísticas del Equipo - Manager'
  },
  {
    path: 'player-analysis',
    loadComponent: () => import('./components/statistics/player-analysis/player-analysis.component').then(c => c.PlayerAnalysisComponent),
    title: 'Análisis de Jugadores - Manager'
  },
  {
    path: 'match-predictions',
    loadComponent: () => import('./components/predictions/match-predictions/match-predictions.component').then(c => c.MatchPredictionsComponent),
    title: 'Pronósticos de Partidos - Manager'
  },
  {
    path: 'scenario-simulator',
    loadComponent: () => import('./components/predictions/scenario-simulator/scenario-simulator.component').then(c => c.ScenarioSimulatorComponent),
    title: 'Simulador de Escenarios - Manager'
  }
];
