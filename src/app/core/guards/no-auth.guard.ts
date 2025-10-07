import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '@core/services';

// Guard para cerrar sesión cuando se accede a páginas de auth con sesión activa
@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {

  constructor(
    private authService: AuthService
  ) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.authState$.pipe(
      map(authState => {
        if (authState.isAuthenticated) {
          // Si está autenticado, cerrar sesión sin notificación
          this.authService.logout(false);
        }
        // Siempre permitir acceso a la página
        return true;
      })
    );
  }
}
