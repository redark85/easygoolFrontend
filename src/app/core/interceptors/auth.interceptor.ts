import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { AppConstants } from '../constants';

// Auth interceptor siguiendo DIP - Preparado para APIs futuras
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private storageService: StorageService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.storageService.getItem<string>(AppConstants.STORAGE_KEYS.TOKEN);

    // Solo agregar token si existe y la request es a nuestra API
    if (token && this.isApiRequest(req.url)) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(authReq);
    }

    return next.handle(req);
  }

  private isApiRequest(url: string): boolean {
    const apiBaseUrl = (import.meta as any).env.VITE_API_BASE_URL;
    // Verificar si la URL es de nuestra API
    return url.startsWith(apiBaseUrl);
  }
}
