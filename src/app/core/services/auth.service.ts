import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { LoginRequest, RegisterRequest, AuthResponse, AuthState, User } from '../models';

// Auth service siguiendo principios SOLID - SRP y DIP
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'easygool_token';
  private readonly USER_KEY = 'easygool_user';
  private readonly API_URL = 'https://api.easygool.com'; // Preparado para API futura

  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null
  });

  public authState$ = this.authStateSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {
    this.initializeAuth();
  }

  // Inicializar estado de autenticación desde storage
  private initializeAuth(): void {
    const token = this.storageService.getItem<string>(this.TOKEN_KEY);
    const user = this.storageService.getItem<User>(this.USER_KEY);

    if (token && user) {
      this.updateAuthState({
        isAuthenticated: true,
        user,
        token,
        loading: false,
        error: null
      });
    }
  }

  // Login - Preparado para API integration
  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.setLoading(true);

    // Mock implementation - reemplazar con HTTP call real
    return this.mockLogin(credentials).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
      }),
      catchError(error => {
        this.handleAuthError('Error en el login');
        return throwError(() => error);
      })
    );
  }

  // Register - Preparado para API integration
  register(userData: RegisterRequest): Observable<User> {
    this.setLoading(true);

    // Mock implementation - reemplazar con HTTP call real
    return this.mockRegister(userData).pipe(
      tap(user => {
        // Auto-login después del registro
        const mockResponse: AuthResponse = {
          user,
          token: 'mock-jwt-token-' + Date.now(),
          expiresIn: 3600
        };
        this.handleAuthSuccess(mockResponse);
      }),
      catchError(error => {
        this.handleAuthError('Error en el registro');
        return throwError(() => error);
      })
    );
  }

  // Logout
  logout(): void {
    this.storageService.removeItem(this.TOKEN_KEY);
    this.storageService.removeItem(this.USER_KEY);
    
    this.updateAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null
    });
  }

  // Get current user
  getCurrentUser(): Observable<User | null> {
    return this.authState$.pipe(
      map(state => state.user)
    );
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  // Get token
  getToken(): string | null {
    return this.authStateSubject.value.token;
  }

  // Private methods
  private handleAuthSuccess(response: AuthResponse): void {
    this.storageService.setItem(this.TOKEN_KEY, response.token);
    this.storageService.setItem(this.USER_KEY, response.user);

    this.updateAuthState({
      isAuthenticated: true,
      user: response.user,
      token: response.token,
      loading: false,
      error: null
    });
  }

  private handleAuthError(error: string): void {
    this.updateAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error
    });
  }

  private setLoading(loading: boolean): void {
    this.updateAuthState({
      ...this.authStateSubject.value,
      loading
    });
  }

  private updateAuthState(newState: AuthState): void {
    this.authStateSubject.next(newState);
  }

  // Mock implementations - reemplazar con llamadas HTTP reales
  private mockLogin(credentials: LoginRequest): Observable<AuthResponse> {
    // Simulación de validación
    if (credentials.email === 'admin@easygool.com' && credentials.password === 'admin123') {
      const mockUser: User = {
        id: '1',
        email: credentials.email,
        firstName: 'Admin',
        lastName: 'EasyGool',
        role: 'admin' as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const response: AuthResponse = {
        user: mockUser,
        token: 'mock-jwt-token-' + Date.now(),
        expiresIn: 3600
      };

      return of(response);
    }

    return throwError(() => new Error('Credenciales inválidas'));
  }

  private mockRegister(userData: RegisterRequest): Observable<User> {
    // Simulación de registro
    const mockUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'user' as any,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return of(mockUser);
  }

  // Método para futuras llamadas HTTP reales
  private makeHttpCall<T>(endpoint: string, data?: any): Observable<T> {
    return this.http.post<T>(`${this.API_URL}${endpoint}`, data);
  }
}
