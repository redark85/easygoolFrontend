import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private errorHandler: DeletionErrorHandlerHook,
    private dialog: MatDialog,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.subscribeToAuthState();
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
    this.authService.login(loginData).subscribe({
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

  private openOtpVerificationModal(email: string): void {
    const dialogRef = this.dialog.open(OtpVerificationModalComponent, {
      width: '550px',
      disableClose: true,
      data: {
        email: email,
        expiryMinutes: 5, // Tiempo de expiración del código OTP: 5 minutos
        onVerify: async (code: string) => {
          return new Promise<boolean>((resolve) => {
            this.authService.verifyOTP(email, code).subscribe({
              next: () => {
                // La navegación se maneja en el servicio después de la verificación exitosa
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
          this.resendOtpCode(email);
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result?.verified) {
        // Usuario canceló, permanecer en login
        this.loading = false;
      }
    });
  }

  private resendOtpCode(email: string): void {
    this.authService.resendOTP(email).subscribe({
      next: () => {
        // El mensaje de éxito ya se muestra en el servicio
      },
      error: (error) => {
        console.error('Resend OTP error:', error);
        // El error ya se muestra en el servicio con toast
      }
    });
  }
}
