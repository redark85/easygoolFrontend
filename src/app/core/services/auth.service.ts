import { Injectable, OnDestroy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, throwError, timer } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';
import { ToastService } from './toast.service';
import { LoginRequest, RegisterRequest, AuthResponse, AuthState, User, RoleType, AccessCodeType, VerifyOTPRequest } from '../models';
import { ApiResponse } from '../models/api.interface';
import { AUTH_LOGIN_ENDPOINT, AUTH_REGISTER_ENDPOINT, AUTH_VERIFY_OTP_ENDPOINT, AUTH_RESEND_OTP_ENDPOINT } from '../config/endpoints';
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

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    this.setLoading(true);
    return this.apiService.post<ApiResponse<AuthResponse>>(AUTH_LOGIN_ENDPOINT, credentials).pipe(
      map(response => {
        if (response.succeed && response.result) {
          this.handleAuthSuccess(response.result, true);
          return response;
        }   
        return response;
      }),
      catchError((error: HttpErrorResponse) => {
        // Si la API responde con un error HTTP (ej. 500, 404)
        this.setLoading(false);
        return throwError(() => error);
      })
    );
  }


  register(data: RegisterRequest, token : string | null): Observable<{ success: boolean; userId: number; email: string }> {
    this.setLoading(true);
    const url = token? `${AUTH_REGISTER_ENDPOINT}?token=${encodeURIComponent(token)}` : AUTH_REGISTER_ENDPOINT;
    return this.apiService.post<ApiResponse<number>>(url, data).pipe(
      map(response => {
        this.setLoading(false);
        if (response.succeed && response.result !== undefined) {
          return { success: true, userId: response.result, email: data.email };
        } else {         
          return { success: false, userId: 0, email: '' };
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  verifyOTP(email: string, otpCode: string): Observable<void> {
    this.setLoading(true);
    const url = `${AUTH_VERIFY_OTP_ENDPOINT}?email=${encodeURIComponent(email)}`;
    const body: VerifyOTPRequest = {
      accessCodeType: AccessCodeType.Email,
      accessCode: parseInt(otpCode, 10)
    };
    
    return this.apiService.post<ApiResponse<AuthResponse>>(url, body).pipe(
      tap(response => {
        this.setLoading(false);
        if (response.succeed) {
          this.toastService.showSuccess('¡Cuenta verificada exitosamente! Ahora puedes iniciar sesión.');
          this.router.navigate(['/auth/login']);
        }
      }),
      map(() => void 0),
      catchError((error: HttpErrorResponse) => {
        this.setLoading(false);   
        return throwError(() => error);
      })
    );
  }

  resendOTP(email: string): Observable<void> {
    this.setLoading(true);
    const url = `${AUTH_RESEND_OTP_ENDPOINT}?email=${encodeURIComponent(email)}`;
   
    return this.apiService.post<ApiResponse<any>>(url, {}).pipe(
      tap(response => {
        this.setLoading(false);
        if (response.succeed) {
          this.toastService.showSuccess('Código OTP reenviado exitosamente. Revisa tu correo.');
        } else {
          throw new HttpErrorResponse({
            error: { message: response.message || 'Error al reenviar el código' },
            status: 400,
          });
        }
      }),
      map(() => void 0),
      catchError((error: HttpErrorResponse) => {
        this.setLoading(false);
        const errorMessage = error.error?.message || 'Error al reenviar el código OTP.';
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
    this.router.navigate(['/']);
  }

  private handleAuthSuccess(response: AuthResponse, navigate: boolean): void {
    const userInfo = this.jwtService.getUserInfo(response.accessToken);
    if (!userInfo) {
      this.logout(false);
      this.toastService.showError('No se pudo procesar la información del usuario.');
      return;
    }

    const nameParts = userInfo.fullName.split(' ');
    
    // Mapear el rol del backend (string) al enum RoleType (number)
    let mappedRole: RoleType;
    switch (userInfo.role) {
      case 'Superadmin':
        mappedRole = RoleType.Superadmin;
        break;
      case 'League':
        mappedRole = RoleType.League;
        break;
      case 'Team':
        mappedRole = RoleType.Team;
        break;
      case 'Official':
        mappedRole = RoleType.Official;
        break;
      default:
        mappedRole = RoleType.League; // Default
    }
    
    const user: User = {
      id: userInfo.id,
      email: userInfo.email,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      role: mappedRole,
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
      // Redirigir según el rol del usuario
      this.navigateByRole(mappedRole);
    }
  }

  /**
   * Navega a la ruta correspondiente según el rol del usuario
   */
  private navigateByRole(role: RoleType): void {
    switch (role) {
      case RoleType.Superadmin:
        this.router.navigate(['/tournaments']);
        break;
      case RoleType.League:
        this.router.navigate(['/tournaments']);
        break;
      case RoleType.Team:
        this.router.navigate(['/teams']);
        break;
      case RoleType.Official:
        this.router.navigate(['/matches']);
        break;
      default:
        this.router.navigate(['/tournaments']);
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
