import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  newPasswordForm!: FormGroup;
  loading = false;
  showPasswordForm = false;
  verifiedEmail = '';
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private toastService: ToastService,
    private errorHandler: DeletionErrorHandlerHook,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.initializePasswordForm();
  }

  private initializeForm(): void {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  private initializePasswordForm(): void {
    this.newPasswordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(100)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(group: FormGroup): {[key: string]: boolean} | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
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
            this.authService.verifyOTP(email, code, false).subscribe({
              next: () => {
                // Mostrar formulario de nueva contraseña
                this.toastService.showSuccess('Código verificado. Ahora puedes cambiar tu contraseña.');
                this.verifiedEmail = email;
                this.showPasswordForm = true;
                console.log('showPasswordForm set to true:', this.showPasswordForm);
                this.cdr.detectChanges();
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
      } else if (result?.verified) {
        // Verificación exitosa, el formulario de contraseña ya está visible
        // No hacer nada, mantener en la página actual
        console.log('OTP verified, showing password form');
      } else {
        // Usuario canceló sin verificar
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

  onSubmitNewPassword(): void {
    if (this.newPasswordForm.invalid) {
      this.markPasswordFormTouched();
      return;
    }

    this.loading = true;
    const newPassword = this.newPasswordForm.value.newPassword;

    // Llamar al servicio para cambiar la contraseña
    this.authService.resetPassword(this.verifiedEmail, newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.showSuccess('Contraseña cambiada exitosamente. Ahora puedes iniciar sesión.');
        this.router.navigate(['/auth/login']);
      },
      error: (error: any) => {
        this.loading = false;
        const config = this.errorHandler.createConfig('Password');
        this.errorHandler.handleResponseError(error, config);
      }
    });
  }

  private markPasswordFormTouched(): void {
    Object.keys(this.newPasswordForm.controls).forEach(key => {
      const control = this.newPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  getPasswordErrorMessage(fieldName: string): string {
    const control = this.newPasswordForm.get(fieldName);

    if (control?.hasError('required')) {
      return fieldName === 'newPassword' ? 'La nueva contraseña es requerida' : 'Confirma tu contraseña';
    }

    if (control?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }

    if (control?.hasError('maxlength')) {
      return 'La contraseña no puede exceder 100 caracteres';
    }

    if (fieldName === 'confirmPassword' && this.newPasswordForm.hasError('passwordMismatch')) {
      return 'Las contraseñas no coinciden';
    }

    return '';
  }
}
