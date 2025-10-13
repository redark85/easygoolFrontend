import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError, tap, switchMap, of } from 'rxjs';
import {
  UserProfileData,
  UserProfileApiResponse,
  UpdateUserProfileRequest,
  UpdateUserProfileApiRequest,
  UserStatus,
  UserRole
} from '@core/models/user-profile.interface';
import {
  USER_PROFILE_GET_ENDPOINT,
  USER_PROFILE_UPDATE_ENDPOINT
} from '@core/config/endpoints';
import { ToastService } from './toast.service';
import { StorageService } from './storage.service';
import { AppConstants } from '../constants';
import {ApiService} from '@core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    private storageService: StorageService
  ) {}

  /**
   * Obtiene el perfil del usuario actual desde la API y lo guarda en localStorage
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
      tap(userProfile => {
        // Guardar el perfil en localStorage para uso posterior
        this.saveUserProfileToStorage(userProfile);
        console.log('💾 User profile saved to localStorage');
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
   * Carga y guarda el perfil del usuario después del login
   */
  loadAndSaveUserProfile(): Observable<UserProfileData> {
    console.log('🔄 Loading user profile after login...');
    return this.getUserProfile();
  }

  /**
   * Obtiene el perfil del usuario desde localStorage
   */
  getUserProfileFromStorage(): UserProfileData | null {
    try {
      // Limpiar datos corruptos antes de intentar cargar
      this.cleanCorruptedProfileData();
      
      const profile = this.storageService.getItem<UserProfileData>(AppConstants.STORAGE_KEYS.USER_PROFILE);
      
      // Validar que el perfil cargado sea un objeto válido
      if (profile && typeof profile === 'object' && profile.name && profile.email) {
        console.log('📱 Valid user profile loaded from localStorage:', {
          name: profile.name,
          email: profile.email,
          hasImage: !!profile.profileImagePath
        });
        return profile;
      } else if (profile) {
        console.warn('⚠️ Invalid profile data detected, cleaning localStorage:', profile);
        this.clearUserProfileFromStorage();
        return null;
      } else {
        console.log('📱 No user profile found in localStorage');
        return null;
      }
    } catch (error) {
      console.error('❌ Error loading user profile from localStorage:', error);
      return null;
    }
  }

  /**
   * Guarda el perfil del usuario en localStorage
   */
  saveUserProfileToStorage(userProfile: UserProfileData): void {
    try {
      // Validar que userProfile sea un objeto válido antes de guardar
      if (!userProfile || typeof userProfile !== 'object') {
        console.error('❌ Invalid user profile data, not saving to localStorage:', userProfile);
        return;
      }

      // Limpiar cualquier dato corrupto previo
      this.storageService.removeItem(AppConstants.STORAGE_KEYS.USER_PROFILE);
      
      // Guardar los nuevos datos
      this.storageService.setItem(AppConstants.STORAGE_KEYS.USER_PROFILE, userProfile);
      console.log('✅ User profile saved to localStorage successfully:', {
        name: userProfile.name,
        email: userProfile.email,
        hasImage: !!userProfile.profileImagePath
      });
    } catch (error) {
      console.error('❌ Error saving user profile to localStorage:', error);
    }
  }

  /**
   * Limpia el perfil del usuario del localStorage
   */
  clearUserProfileFromStorage(): void {
    try {
      this.storageService.removeItem(AppConstants.STORAGE_KEYS.USER_PROFILE);
      console.log('🗑️ User profile cleared from localStorage');
    } catch (error) {
      console.error('❌ Error clearing user profile from localStorage:', error);
    }
  }

  /**
   * Limpia datos corruptos del localStorage y los reemplaza con datos válidos
   */
  cleanCorruptedProfileData(): void {
    try {
      const storedValue = localStorage.getItem(AppConstants.STORAGE_KEYS.USER_PROFILE);
      if (storedValue === 'true' || storedValue === 'false' || storedValue === 'null') {
        console.warn('🧹 Detected corrupted profile data in localStorage, cleaning...');
        this.clearUserProfileFromStorage();
      }
    } catch (error) {
      console.error('❌ Error cleaning corrupted profile data:', error);
    }
  }

  /**
   * Actualiza el perfil del usuario usando el endpoint /api/User/UpdateUser
   */
  updateUserProfile(updateRequest: UpdateUserProfileRequest): Observable<UserProfileData> {
    console.log('🔄 UserProfileService - Updating user profile with data:', updateRequest);

    // Mapear desde la interface antigua a la nueva requerida por el API
    const apiRequest: UpdateUserProfileApiRequest = {
      firstName: updateRequest.name,
      secondName: updateRequest.secondName || '',
      lastName: updateRequest.lastName,
      secondLastName: updateRequest.secondLastName || '',
      igameBase64: updateRequest.profileImageBase64 || '',
      photoContentType: updateRequest.profileImageContentType || '',
      phoneNumber: updateRequest.phoneNUmber // Mapear phoneNUmber a phoneNumber
    };

    console.log('📡 UserProfileService - API request mapped:', apiRequest);

    return this.apiService.put<UserProfileApiResponse>(USER_PROFILE_UPDATE_ENDPOINT, apiRequest).pipe(
      switchMap(response => {
        console.log('✅ UserProfile Update API Response:', response);
        console.log('🔍 Response type:', typeof response);
        console.log('🔍 Response result:', response.result);
        console.log('🔍 Response result type:', typeof response.result);
        
        if (response.succeed) {
          // Verificar si result es un objeto válido o solo un boolean
          if (response.result && typeof response.result === 'object' && response.result !== null) {
            console.log('✅ API returned complete profile data');
            this.toastService.showSuccess('Perfil actualizado correctamente');
            return of(response.result);
          } else {
            console.warn('⚠️ API returned success but result is boolean/null, fetching updated profile...');
            this.toastService.showSuccess('Perfil actualizado correctamente');
            // Si el API solo devuelve true, obtener el perfil actualizado
            return this.getUserProfile();
          }
        }
        throw new Error(response.message || 'Error al actualizar el perfil');
      }),
      tap(userProfile => {
        // Actualizar el perfil en localStorage después de la actualización exitosa
        console.log('💾 Saving user profile to localStorage:', userProfile);
        this.saveUserProfileToStorage(userProfile);
        console.log('✅ Updated user profile saved to localStorage');
      }),
      catchError(error => {
        console.error('❌ Error updating user profile:', {
          error,
          status: error.status,
          message: error.message,
          url: error.url
        });
        this.toastService.showError('Error al actualizar el perfil de usuario');
        return throwError(() => error);
      })
    );
  }

  /**
   * Procesa los datos de imagen para el perfil
   */
  processImageData(photoData: any): { base64: string; contentType: string } {
    if (!photoData || !photoData.base64 || !photoData.contentType) {
      return { base64: '', contentType: '' };
    }

    // Extraer base64 sin el prefijo data:image/...;base64,
    let cleanBase64 = photoData.base64;
    if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',')[1];
    }

    // Mantener el contentType completo para el API
    const contentType = photoData.contentType || '';

    console.log('🖼️ UserProfileService - Processing image data:', {
      originalBase64Length: photoData.base64?.length,
      cleanBase64Length: cleanBase64.length,
      contentType: contentType
    });

    return {
      base64: cleanBase64,
      contentType: contentType
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

  /**
   * Método de utilidad para limpiar datos corruptos manualmente
   * Útil para debugging y limpieza manual
   */
  forceCleanLocalStorage(): void {
    console.log('🧹 Force cleaning user profile localStorage...');
    this.clearUserProfileFromStorage();
    console.log('✅ LocalStorage cleaned successfully');
  }
}
