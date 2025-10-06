import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { AuthService, ToastService } from '@core/services';
import { AccessCodeTemplateType } from '@core/models';
import { DeletionErrorHandlerHook } from '@shared/hooks/deletion-error-handler.hook';
import { OtpVerificationModalComponent } from '@shared/components/otp-verification-modal/otp-verification-modal.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private toastService: ToastService,
    private errorHandler: DeletionErrorHandlerHook
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const email = this.resetForm.value.email;
    this.loading = true;

    // Llamar al servicio para enviar código OTP con template de ResetPassword
    this.authService.resendOTP(email, AccessCodeTemplateType.ResetPassword).subscribe({
      next: () => {
        this.loading = false;
        // Abrir modal OTP para verificar y cambiar contraseña
        this.openOtpVerificationModal(email);
      },
      error: (error: any) => {
        this.loading = false;
        const config = this.errorHandler.createConfig('User');
        this.errorHandler.handleResponseError(error, config);
      }
    });
  }

  private openOtpVerificationModal(email: string): void {
    const dialogRef = this.dialog.open(OtpVerificationModalComponent, {
      width: '550px',
      disableClose: true,
      data: {
        email: email,
        expiryMinutes: 5,
        onVerify: async (code: string) => {
          return new Promise<boolean>((resolve) => {
            this.authService.verifyOTP(email, code).subscribe({
              next: () => {
                // Redirigir a una vista para cambiar la contraseña
                this.toastService.showSuccess('Código verificado. Ahora puedes cambiar tu contraseña.');
                this.router.navigate(['/auth/change-password'], { queryParams: { email: email } });
                resolve(true);
              },
              error: (error) => {
                this.loading = false;
                const config = this.errorHandler.createConfig('Code');
                this.errorHandler.handleResponseError(error, config);
                resolve(false);
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
        // Usuario canceló
        this.loading = false;
      }
    });
  }

  private resendOtpCode(email: string): void {
    this.authService.resendOTP(email, AccessCodeTemplateType.ResetPassword).subscribe({
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

  private markFormGroupTouched(): void {
    Object.keys(this.resetForm.controls).forEach(key => {
      const control = this.resetForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.resetForm.get(fieldName);

    if (control?.hasError('required')) {
      return 'Email es requerido';
    }

    if (control?.hasError('email')) {
      return 'Email inválido';
    }

    return '';
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goBack(): void {
    this.router.navigate(['/auth/login']);
  }
}
