import { Injectable, OnDestroy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, throwError, timer } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';
import { ToastService } from './toast.service';
import { LoginRequest, RegisterRequest, AuthResponse, AuthState, User, UserRole } from '../models';
import { ApiResponse } from '../models/api.interface';
import { AUTH_LOGIN_ENDPOINT, AUTH_REGISTER_ENDPOINT } from '../config/endpoints';
import { AppConstants } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private authStateSubject = new BehaviorSubject<AuthState>(this.getInitialAuthState());
  private expirationTimer: Subscription | null = null;

  public authState$ = this.authStateSubject.asObservable();

  constructor(
    private storageService: StorageService,
    private apiService: ApiService,
    private jwtService: JwtService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.initializeAuthOnLoad();
  }

  ngOnDestroy(): void {
    this.clearExpirationTimer();
  }

  private getInitialAuthState(): AuthState {
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null
    };
  }

  private initializeAuthOnLoad(): void {
    const token = this.storageService.getItem<string>(AppConstants.STORAGE_KEYS.TOKEN);
    if (token && !this.jwtService.isTokenExpired(token)) {
      const user = this.storageService.getItem<User>(AppConstants.STORAGE_KEYS.USER);
      this.setAuthState(true, token, user);
      this.scheduleTokenExpirationCheck(token);
    } else if (token) {
      this.logout(false);
    }
  }

  login(credentials: LoginRequest): Observable<void> {
    this.setLoading(true);
    return this.apiService.post<ApiResponse<AuthResponse>>(AUTH_LOGIN_ENDPOINT, credentials).pipe(
      map(response => {
        if (response.succeed && response.result) {
          this.handleAuthSuccess(response.result, true);
          return;
        }
        // Si la API responde con éxito pero el login falla (succeed: false)
        this.setLoading(false);
        this.toastService.showError('Usuario o contraseña incorrectos.');
      }),
      catchError((error: HttpErrorResponse) => {
        // Si la API responde con un error HTTP (ej. 500, 404)
        this.setLoading(false);
        this.toastService.showError('Ocurrió un error inesperado. Inténtalo de nuevo.');
        return throwError(() => error);
      })
    );
  }


  register(data: RegisterRequest, token : string | null): Observable<void> {
    this.setLoading(true);
    const url = token? `${AUTH_REGISTER_ENDPOINT}?token=${encodeURIComponent(token)}` : AUTH_REGISTER_ENDPOINT;
    return this.apiService.post<ApiResponse<AuthResponse>>(url, data).pipe(
      tap(response => {
        if (response.succeed && response.result) {
          this.handleAuthSuccess(response.result, true);
          this.toastService.showSuccess('¡Registro exitoso! Bienvenido.');
        } else {
          throw new HttpErrorResponse({
            error: { message: response.message || 'Error en el registro' },
            status: 400,
          });
        }
      }),
      map(() => void 0),
      catchError((error: HttpErrorResponse) => {
        this.setLoading(false);
        const errorMessage = error.error?.errors?.[0] || error.error?.message || 'Ocurrió un error en el registro.';
        this.toastService.showError(errorMessage);
        return throwError(() => error);
      })
    );
  }

  logout(notify: boolean = true): void {
    this.clearExpirationTimer();
    this.storageService.clear(); // Limpieza completa
    this.setAuthState(false, null, null);
    if (notify) {
      this.toastService.showInfo('Has cerrado sesión correctamente.');
    }
    this.router.navigate(['/auth/login']);
  }

  private handleAuthSuccess(response: AuthResponse, navigate: boolean): void {
    const userInfo = this.jwtService.getUserInfo(response.accessToken);
    if (!userInfo) {
      this.logout(false);
      this.toastService.showError('No se pudo procesar la información del usuario.');
      return;
    }

    const nameParts = userInfo.fullName.split(' ');
    const user: User = {
      id: userInfo.id,
      email: userInfo.email,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      role: userInfo.role.toLowerCase() as UserRole,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.storageService.setItem(AppConstants.STORAGE_KEYS.TOKEN, response.accessToken);
    this.storageService.setItem(AppConstants.STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
    this.storageService.setItem(AppConstants.STORAGE_KEYS.USER, user);

    this.setAuthState(true, response.accessToken, user);
    this.scheduleTokenExpirationCheck(response.accessToken);

    if (navigate) {
      this.router.navigate(['/dashboard/tournaments']);
    }
  }

  private scheduleTokenExpirationCheck(token: string): void {
    this.clearExpirationTimer();
    const expiresIn = this.jwtService.getTokenTimeToExpire(token);
    if (expiresIn === null || expiresIn <= 0) {
      this.logout(false);
      return;
    }

    const fiveMinutesInMs = 5 * 60 * 1000;
    if (expiresIn > fiveMinutesInMs) {
      const notificationTime = expiresIn - fiveMinutesInMs;
      this.expirationTimer = timer(notificationTime).subscribe(() => {
        this.toastService.showWarning('Tu sesión está a punto de expirar. Serás desconectado pronto.');
      });
    }

    this.expirationTimer?.add(timer(expiresIn).subscribe(() => {
      this.logout(true);
      this.toastService.showError('Tu sesión ha expirado.');
    }));
  }

  private clearExpirationTimer(): void {
    if (this.expirationTimer) {
      this.expirationTimer.unsubscribe();
      this.expirationTimer = null;
    }
  }

  private setLoading(loading: boolean): void {
    this.authStateSubject.next({ ...this.authStateSubject.value, loading });
  }

  private setAuthState(isAuthenticated: boolean, token: string | null, user: User | null): void {
    this.authStateSubject.next({
      ...this.getInitialAuthState(),
      isAuthenticated,
      token,
      user
    });
  }
}
