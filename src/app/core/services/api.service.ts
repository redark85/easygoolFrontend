import { Injectable } from '@angular/core';
import { Observable, throwError, from } from 'rxjs';
import { catchError } from 'rxjs/operators';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { AppConstants } from '../constants';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';
import { StorageService } from './storage.service';

// Servicio base para APIs siguiendo principios SOLID - SRP
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private toastService: ToastService,
    private storageService: StorageService
  ) {
    this.setupAxiosInterceptors();
  }

  /**
   * Configura interceptores de Axios para token Bearer
   */
  private setupAxiosInterceptors(): void {
    // Request interceptor para agregar token Bearer
    axios.interceptors.request.use(
      (config) => {
        const token = this.storageService.getItem<string>(AppConstants.STORAGE_KEYS.TOKEN);
        if (token && this.isApiRequest(config.url || '')) {
          console.log('🔑 Adding Bearer token to Axios request:', config.url);
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.log('❌ No token or not API request:', { 
            hasToken: !!token, 
            isApi: this.isApiRequest(config.url || ''), 
            url: config.url 
          });
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor para manejo de errores
    axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.handleAxiosError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Verifica si la URL es una petición a nuestra API
   */
  private isApiRequest(url: string): boolean {
    const isApi = url.includes('/api/') || url.includes('easygoolapis.somee.com');
    return isApi;
  }

  /**
   * Realiza petición GET
   * @param endpoint - Endpoint relativo
   * @returns Observable con la respuesta
   */
  private getApiBaseUrl(): string {
    return environment.apiBaseUrl;
  }

  get<T>(endpoint: string): Observable<T> {
    return from(
      axios.get<T>(`${this.getApiBaseUrl()}${endpoint}`)
        .then((response: AxiosResponse<T>) => response.data)
    ).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Realiza petición POST
   * @param endpoint - Endpoint relativo
   * @param data - Datos a enviar
   * @returns Observable con la respuesta
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    return from(
      axios.post<T>(`${this.getApiBaseUrl()}${endpoint}`, data)
        .then((response: AxiosResponse<T>) => response.data)
    ).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Realiza petición PUT
   * @param endpoint - Endpoint relativo
   * @param data - Datos a enviar
   * @returns Observable con la respuesta
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    return from(
      axios.put<T>(`${this.getApiBaseUrl()}${endpoint}`, data)
        .then((response: AxiosResponse<T>) => response.data)
    ).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Realiza petición DELETE
   * @param endpoint - Endpoint relativo
   * @returns Observable con la respuesta
   */
  delete<T>(endpoint: string): Observable<T> {
    return from(
      axios.delete<T>(`${this.getApiBaseUrl()}${endpoint}`)
        .then((response: AxiosResponse<T>) => response.data)
    ).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Maneja errores de Axios y muestra toast
   * @param error - Error de Axios
   * @returns Observable con error
   */
  private handleError(error: any): Observable<never> {
    let errorMessage: string = AppConstants.ERROR_MESSAGES.UNKNOWN_ERROR;

    if (error.response) {
      // Error del servidor
      switch (error.response.status) {
        case 400:
          errorMessage = AppConstants.ERROR_MESSAGES.UNAUTHORIZED;
          break;
        case 401:
          errorMessage = AppConstants.ERROR_MESSAGES.UNAUTHORIZED;
          break;
        default:
          if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          }
          break;
      }
    } else if (error.request) {
      // Error de red
      errorMessage = AppConstants.ERROR_MESSAGES.NETWORK_ERROR;
    }

    // Mostrar toast de error
    this.toastService.showError(errorMessage);

    // Log del error para debugging
    console.error('API Error:', errorMessage, error);

    return throwError(() => error);
  }

  /**
   * Maneja errores específicos de Axios
   */
  private handleAxiosError(error: AxiosError): void {
    if (error.response) {
      switch (error.response.status) {
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
          this.toastService.showError('Error interno del servidor.');
          break;
      }
    }
  }
}
