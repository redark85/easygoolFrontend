import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import {
  UserProfileData,
  UserProfileApiResponse,
  UpdateUserProfileRequest,
  UserStatus,
  UserRole
} from '@core/models/user-profile.interface';
import {
  USER_PROFILE_GET_ENDPOINT,
  USER_PROFILE_UPDATE_ENDPOINT
} from '@core/config/endpoints';
import { ToastService } from './toast.service';
import {ApiService} from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  /**
   * Obtiene el perfil del usuario actual
   */
  getUserProfile(): Observable<UserProfileData> {
    console.log('🔍 UserProfileService - Making request to:', USER_PROFILE_GET_ENDPOINT);

    return this.apiService.get<UserProfileApiResponse>(USER_PROFILE_GET_ENDPOINT).pipe(
      map(response => {
        console.log('✅ UserProfile API Response:', response);
        if (response.succeed && response.result) {
          return response.result;
        }
        throw new Error(response.message || 'Error al obtener el perfil de usuario');
      }),
      catchError(error => {
        console.error('❌ Error getting user profile:', {
          error,
          status: error.status,
          message: error.message,
          url: error.url
        });
        this.toastService.showError('Error al cargar el perfil de usuario');
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualiza el perfil del usuario
   */
  updateUserProfile(updateRequest: UpdateUserProfileRequest): Observable<UserProfileData> {
    return this.apiService.put<UserProfileApiResponse>(USER_PROFILE_UPDATE_ENDPOINT, updateRequest).pipe(
      map(response => {
        if (response.succeed && response.result) {
          this.toastService.showSuccess('Perfil actualizado correctamente');
          return response.result;
        }
        throw new Error(response.message || 'Error al actualizar el perfil');
      }),
      catchError(error => {
        console.error('Error updating user profile:', error);
        this.toastService.showError('Error al actualizar el perfil de usuario');
        return throwError(() => error);
      })
    );
  }

  /**
   * Procesa los datos de imagen para el perfil
   */
  processImageData(photoData: any): { base64: string; extension: string } {
    if (!photoData || !photoData.base64 || !photoData.contentType) {
      return { base64: '', extension: '' };
    }

    // Extraer base64 sin el prefijo data:image/...;base64,
    let cleanBase64 = photoData.base64;
    if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',')[1];
    }

    // Extraer solo la extensión del contentType
    let extension = '';
    if (photoData.contentType) {
      // De "image/jpeg" extraer "jpeg"
      // De "image/png" extraer "png"
      const parts = photoData.contentType.split('/');
      if (parts.length > 1) {
        extension = parts[1];
      }
    }

    return {
      base64: cleanBase64,
      extension: extension
    };
  }

  /**
   * Obtiene el texto del estado de usuario
   */
  getUserStatusText(status: UserStatus): string {
    switch (status) {
      case UserStatus.Active: return 'Activo';
      case UserStatus.Inactive: return 'Inactivo';
      case UserStatus.Suspended: return 'Suspendido';
      case UserStatus.Pending: return 'Pendiente';
      default: return 'Desconocido';
    }
  }

  /**
   * Obtiene el texto del rol de usuario
   */
  getUserRoleText(role: UserRole): string {
    switch (role) {
      case UserRole.User: return 'Usuario';
      case UserRole.Admin: return 'Administrador';
      case UserRole.Manager: return 'Manager';
      case UserRole.Referee: return 'Árbitro';
      default: return 'Desconocido';
    }
  }

  /**
   * Obtiene la clase CSS para el estado de usuario
   */
  getUserStatusClass(status: UserStatus): string {
    switch (status) {
      case UserStatus.Active: return 'status-active';
      case UserStatus.Inactive: return 'status-inactive';
      case UserStatus.Suspended: return 'status-suspended';
      case UserStatus.Pending: return 'status-pending';
      default: return 'status-unknown';
    }
  }

  /**
   * Obtiene la clase CSS para el rol de usuario
   */
  getUserRoleClass(role: UserRole): string {
    switch (role) {
      case UserRole.User: return 'role-user';
      case UserRole.Admin: return 'role-admin';
      case UserRole.Manager: return 'role-manager';
      case UserRole.Referee: return 'role-referee';
      default: return 'role-unknown';
    }
  }
}
