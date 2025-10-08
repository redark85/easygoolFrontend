import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { AuthService, ToastService } from '@core/services';
import { LoginRequest } from '@core/models';
import { DeletionErrorHandlerHook } from '@shared/hooks/deletion-error-handler.hook';
import { OtpVerificationModalComponent } from '@shared/components/otp-verification-modal/otp-verification-modal.component';
import { TournamentService } from '@features/tournaments/services/tournament.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  hidePassword = true;
  loading = false;
  private destroy$ = new Subject<void>();
  tokenFromUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandler: DeletionErrorHandlerHook,
    private dialog: MatDialog,
    private toastService: ToastService,
    private tournamentService: TournamentService    
  ) {}

  ngOnInit(): void {
    this.captureTokenFromUrl();
    this.initializeForm();
    this.subscribeToAuthState();
  }

  /**
   * Captura el parámetro 'token' de la URL si existe
   */
  private captureTokenFromUrl(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['token']) {
          this.tokenFromUrl = params['token'];
          console.log('Token capturado de la URL en login:', this.tokenFromUrl);
          this.loadTournamentByToken(params['token']);
        }
      });
  }

  /**
   * Carga la información del torneo usando el token
   */
  private loadTournamentByToken(token: string): void {
    this.tournamentService.getTournamentByToken(token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tournament) => {
          if (tournament) {
          }
        },
        error: (error) => {
          if (error.response.data.messageId === 'EGOL_121') {
              this.router.navigate(['/auth/login']);
          }
        }
      });
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  private subscribeToAuthState(): void {
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.loading = state.loading;

        if (state.isAuthenticated) {
          this.router.navigate(['/dashboard']);
        }
      });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const loginData: LoginRequest = this.loginForm.value;
    this.authService.login(loginData, this.tokenFromUrl).subscribe({
        next: (response) => {
         
        },
        error: (error: any) => {
          this.loading = false;
          if (error.response.data.messageId === 'EGOL_120') {
            this.toastService.showError('Su cuenta de correo no ha sido verificada.');
            const email = loginData.userName; // El email es el userName
            this.openOtpVerificationModal(email);
          }
          else {
            this.toastService.showError('Usuario o contraseña incorrectos.');
          }
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);

    if (control?.hasError('required')) {
      return fieldName === 'userName' ? 'Email es requerido' : 'Contraseña es requerida';
    }

    if (control?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }

    return '';
  }

  navigateToRegister(): void {
    this.router.navigate(['/']);
  }

  navigateToResetPassword(): void {
    this.router.navigate(['/auth/reset-password']);
  }

  private openOtpVerificationModal(email: string): void {
    const dialogRef = this.dialog.open(OtpVerificationModalComponent, {
      width: '550px',
      data: {
        email: email,
        expiryMinutes: 5, // Tiempo de expiración del código OTP: 5 minutos
        onVerify: async (code: string) => {
          return new Promise<boolean>((resolve) => {
            this.authService.verifyOTP(email, code, false, true).subscribe({
              next: () => {
                // Login automático exitoso, el servicio ya maneja la navegación
                this.toastService.showSuccess('¡Cuenta verificada e inicio de sesión exitoso!');
                resolve(true); // Cerrar el modal
              },
              error: (error) => {
                this.loading = false;
                const config = this.errorHandler.createConfig('Code');
                this.errorHandler.handleResponseError(error, config);
                resolve(false); // No cerrar el modal, permitir reintentar
              }
            });
          });
        },
        onResend: () => {
          // No hacer nada aquí, el modal se cerrará y se reabrirá
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.resend) {
        // Usuario solicitó reenvío, llamar al servicio y reabrir modal
        this.resendOtpCode(email);
      } else if (!result?.verified) {
        // Usuario canceló, permanecer en login
        this.loading = false;
      }
    });
  }

  private resendOtpCode(email: string): void {
    this.authService.resendOTP(email).subscribe({
      next: () => {
        // Reabrir el modal con el temporizador reiniciado
        this.openOtpVerificationModal(email);
      },
      error: (error) => {
        console.error('Resend OTP error:', error);
        // El error ya se muestra en el servicio con toast
        // Aún así, reabrir el modal para que el usuario pueda intentar de nuevo
        this.openOtpVerificationModal(email);
      }
    });
  }
}
