import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StorageService } from '../services/storage.service';
import { ToastService } from '../services/toast.service';
import { AppConstants } from '../constants';

// Auth interceptor siguiendo DIP - Preparado para APIs futuras
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private storageService: StorageService,
    private toastService: ToastService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.storageService.getItem<string>(AppConstants.STORAGE_KEYS.TOKEN);

    // Solo agregar token si existe y la request es a nuestra API
    let authReq = req;
    if (token && this.isApiRequest(req.url)) {
      authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (this.isApiRequest(req.url)) {
          this.handleHttpError(error);
        }
        return throwError(() => error);
      })
    );
  }

  private isApiRequest(url: string): boolean {
    const apiBaseUrl = (import.meta as any).env.VITE_API_BASE_URL;
    // Verificar si la URL es de nuestra API
    return url.startsWith(apiBaseUrl);
  }

  private handleHttpError(error: HttpErrorResponse): void {
    switch (error.status) {
      case 400:
        this.toastService.showError('Solicitud inválida. Verifica los datos ingresados.');
        break;
      case 401:
        this.toastService.showError('No autorizado. Inicia sesión nuevamente.');
        break;
      case 403:
        this.toastService.showError('No tienes permisos para realizar esta acción.');
        break;
      case 404:
        this.toastService.showError('Recurso no encontrado.');
        break;
      case 500:
        this.toastService.showError('Error interno del servidor. Intenta nuevamente más tarde.');
        break;
      default:
        if (error.status >= 400) {
          this.toastService.showError('Ha ocurrido un error. Intenta nuevamente.');
        }
        break;
    }
  }
}
