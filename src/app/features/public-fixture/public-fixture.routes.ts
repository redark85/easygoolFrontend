import { Routes } from '@angular/router';

export const publicFixtureRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./public-fixture.component').then(c => c.PublicFixtureComponent),
    title: 'Fixture Completo - Torneo'
  }
];
