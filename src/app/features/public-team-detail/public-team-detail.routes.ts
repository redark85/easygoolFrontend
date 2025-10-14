import { Routes } from '@angular/router';

export const PUBLIC_TEAM_DETAIL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./public-team-detail.component').then(c => c.PublicTeamDetailComponent)
  }
];
