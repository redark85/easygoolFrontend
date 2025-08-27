import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// Auth guard siguiendo SRP - Solo protección de rutas
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.authService.authState$.pipe(
      map(authState => {
        if (authState.isAuthenticated) {
          return true;
        } else {
          // Redirigir a login si no está autenticado
          return this.router.createUrlTree(['/auth/login']);
        }
      })
    );
  }
}
