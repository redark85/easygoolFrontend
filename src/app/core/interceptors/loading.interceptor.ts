import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Solo mostrar loading para peticiones API (no para assets)
    if (req.url.includes('/api/')) {
      this.loadingService.startLoading();
    }

    return next.handle(req).pipe(
      finalize(() => {
        if (req.url.includes('/api/')) {
          this.loadingService.stopLoading();
        }
      })
    );
  }
}
