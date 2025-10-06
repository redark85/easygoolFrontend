import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '@core/services';
import { RegisterRequest, RoleType } from '@core/models';
import { PhoneValidatorUtil } from '@shared/utils';
import { OtpVerificationModalComponent } from '@shared/components/otp-verification-modal/otp-verification-modal.component';
import { DeletionErrorHandlerHook } from '@shared/hooks/deletion-error-handler.hook';

@Component({
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();
  private tokenFromUrl: string | null = null;
  roleType: 'league' | 'team' | null = null;
  pageTitle: string = 'Crear Cuenta';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private errorHandler: DeletionErrorHandlerHook
    
  ) {}

  ngOnInit(): void {
    this.captureTokenFromUrl();
    this.initializeForm();
    this.subscribeToAuthState();
  }

  /**
   * Captura el parámetro 'token' y 'role' de la URL si existen
   */
  private captureTokenFromUrl(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['token']) {
          this.tokenFromUrl = params['token'];
          console.log('Token capturado de la URL:', this.tokenFromUrl);
        }
        if (params['role']) {
          this.roleType = params['role'];
          this.updatePageTitle();
        }
      });
  }

  /**
   * Actualiza el título de la página según el tipo de rol
   */
  private updatePageTitle(): void {
    if (this.roleType === 'league') {
      this.pageTitle = 'Registro de Presidente de Liga';
    } else if (this.roleType === 'team') {
      this.pageTitle = 'Registro de Presidente de Equipo';
    } else {
      this.pageTitle = 'Crear Cuenta';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      secondName: [''],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      secondLastName: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, PhoneValidatorUtil.ecuadorianPhoneValidator()]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(control: AbstractControl): {[key: string]: any} | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { 'passwordMismatch': true };
    }
    return null;
  }

  private subscribeToAuthState(): void {
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.loading = state.loading;
        this.error = state.error;

        if (state.isAuthenticated) {
          this.router.navigate(['/dashboard']);
        }
      });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      // Capturar el token de la URL si existe
      const token = this.tokenFromUrl;
     
      const registerData: RegisterRequest = this.registerForm.value;
      registerData.phoneNumber = registerData.phoneNumber.replace(/-/g, "");
      
      // Determinar el rol basado en el parámetro de la URL o el token
      if (this.roleType === 'league') {
        registerData.role = RoleType.League;
      } else if (this.roleType === 'team' || token) {
        registerData.role = RoleType.Team;
      } else {
        registerData.role = RoleType.League; // Default
      }
      
      this.authService.register(registerData, token).subscribe({
        next: (response) => {
          if (response.success) {
            this.openOtpVerificationModal(response.userId, response.email);
          }
        },
        error: (error: any) => {
          this.loading = false;
          const config = this.errorHandler.createConfig('User');
          this.errorHandler.handleResponseError(error, config);
          if (error.response.data.messageId === 'EGOL_106') {
            this.navigateToLogin();
          }
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);

    if (control?.hasError('required')) {
      return `${this.getFieldDisplayName(fieldName)} es requerido`;
    }

    if (control?.hasError('email')) {
      return 'Email inválido';
    }

    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `${this.getFieldDisplayName(fieldName)} debe tener al menos ${minLength} caracteres`;
    }

    if (fieldName === 'confirmPassword' && this.registerForm.hasError('passwordMismatch')) {
      return 'Las contraseñas no coinciden';
    }

    if (fieldName === 'phoneNumber' && control?.hasError('ecuadorianPhone')) {
      return PhoneValidatorUtil.getPhoneErrorMessage(control);
    }

    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: {[key: string]: string} = {
      'firstName': 'Nombre',
      'secondName': 'Segundo nombre',
      'lastName': 'Apellido',
      'secondLastName': 'Segundo apellido',
      'email': 'Email',
      'password': 'Contraseña',
      'confirmPassword': 'Confirmar contraseña',
      'phoneNumber': 'Teléfono'
    };
    return displayNames[fieldName] || fieldName;
  }

  // Método para permitir solo números en el campo de teléfono
  onPhoneKeyPress(event: KeyboardEvent): boolean {
    return PhoneValidatorUtil.allowOnlyNumbers(event);
  }

  // Método para formatear el teléfono mientras se escribe
  onPhoneInput(event: any): void {
    const input = event.target;
    const formatted = PhoneValidatorUtil.formatEcuadorianPhone(input.value);
    this.registerForm.patchValue({ phoneNumber: formatted });
  }

  navigateToLogin(): void {
    if (this.tokenFromUrl) {
      this.router.navigate(['/auth/login'], { queryParams: { token: this.tokenFromUrl } });
    }
    else {
      this.router.navigate(['/auth/login']);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  private openOtpVerificationModal(userId: number, email: string): void {
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
        // Usuario canceló, redirigir al login
        this.router.navigate(['/auth/login']);
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
