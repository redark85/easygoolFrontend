import { Routes } from '@angular/router';
import { NoAuthGuard } from '@core/guards';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(c => c.LoginComponent),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(c => c.RegisterComponent),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./components/reset-password/reset-password.component').then(c => c.ResetPasswordComponent),
    canActivate: [NoAuthGuard]
  }
];
