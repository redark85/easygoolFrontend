import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppConstants } from '../constants';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';

// Servicio base para APIs siguiendo principios SOLID - SRP
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) {}

  /**
   * Realiza petición GET
   * @param endpoint - Endpoint relativo
   * @returns Observable con la respuesta
   */
  private getApiBaseUrl(): string {
    return environment.apiBaseUrl;
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.getApiBaseUrl()}${endpoint}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Realiza petición POST
   * @param endpoint - Endpoint relativo
   * @param data - Datos a enviar
   * @returns Observable con la respuesta
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.getApiBaseUrl()}${endpoint}`, data)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Realiza petición PUT
   * @param endpoint - Endpoint relativo
   * @param data - Datos a enviar
   * @returns Observable con la respuesta
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.getApiBaseUrl()}${endpoint}`, data)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Realiza petición DELETE
   * @param endpoint - Endpoint relativo
   * @returns Observable con la respuesta
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.getApiBaseUrl()}${endpoint}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  /**
   * Maneja errores de HTTP y muestra toast
   * @param error - Error de HTTP
   * @returns Observable con error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage: string = AppConstants.ERROR_MESSAGES.UNKNOWN_ERROR;

    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = AppConstants.ERROR_MESSAGES.NETWORK_ERROR;
    } else {
      // Error del servidor
      switch (error.status) {
        case 400:
          errorMessage = AppConstants.ERROR_MESSAGES.UNAUTHORIZED;
          break;
        case 401:
          errorMessage = AppConstants.ERROR_MESSAGES.UNAUTHORIZED;
          break;
        case 0:
          errorMessage = AppConstants.ERROR_MESSAGES.NETWORK_ERROR;
          break;
        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
          break;
      }
    }

    // Mostrar toast de error
    this.toastService.showError(errorMessage);
    
    // Log del error para debugging
    console.error('API Error:', errorMessage, error);

    return throwError(() => error);
  }
}
