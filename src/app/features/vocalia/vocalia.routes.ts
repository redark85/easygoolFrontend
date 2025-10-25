import { Routes } from '@angular/router';
import { VocaliaViewComponent } from './components/vocalia-view/vocalia-view.component';

export const VOCALIA_ROUTES: Routes = [
  {
    path: ':matchId',
    component: VocaliaViewComponent
  }
];
