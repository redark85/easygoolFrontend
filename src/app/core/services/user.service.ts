import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User, UserProfile, UpdateUserRequest } from '../models';

// User service siguiendo SRP - Solo gestión de usuarios
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = 'https://api.easygool.com/users';

  constructor(private http: HttpClient) {}

  // Get user profile - Preparado para API
  getProfile(userId: string): Observable<User> {
    // Mock implementation - reemplazar con HTTP call
    return this.mockGetProfile(userId);
    // return this.http.get<User>(`${this.API_URL}/${userId}`);
  }

  // Update user profile - Preparado para API
  updateProfile(userId: string, userData: UpdateUserRequest): Observable<User> {
    // Mock implementation - reemplazar con HTTP call
    return this.mockUpdateProfile(userId, userData);
    // return this.http.put<User>(`${this.API_URL}/${userId}`, userData);
  }

  // Get user avatar - Preparado para API
  getUserAvatar(userId: string): Observable<string> {
    // Mock implementation
    return of('assets/logo.png'); // Usar logo como avatar temporal
    // return this.http.get<{avatarUrl: string}>(`${this.API_URL}/${userId}/avatar`)
    //   .pipe(map(response => response.avatarUrl));
  }

  // Upload avatar - Preparado para API
  uploadAvatar(userId: string, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    // Mock implementation
    return of('assets/logo.png');
    // return this.http.post<{avatarUrl: string}>(`${this.API_URL}/${userId}/avatar`, formData)
    //   .pipe(map(response => response.avatarUrl));
  }

  // Mock implementations - reemplazar con llamadas HTTP reales
  private mockGetProfile(userId: string): Observable<User> {
    const mockUser: User = {
      id: userId,
      email: 'user@easygool.com',
      firstName: 'Usuario',
      lastName: 'EasyGool',
      avatar: 'assets/logo.png',
      role: 'user' as any,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return of(mockUser);
  }

  private mockUpdateProfile(userId: string, userData: UpdateUserRequest): Observable<User> {
    const updatedUser: User = {
      id: userId,
      email: userData.email || 'user@easygool.com',
      firstName: userData.firstName || 'Usuario',
      lastName: userData.lastName || 'EasyGool',
      avatar: userData.avatar || 'assets/logo.png',
      role: userData.role || 'user' as any,
      isActive: userData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return of(updatedUser);
  }
}
