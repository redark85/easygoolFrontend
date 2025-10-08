import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { AuthService, ToastService } from '@core/services';
import { LoginRequest, RegisterRequest, RoleType } from '@core/models';
import { PhoneValidatorUtil } from '@shared/utils';
import { OtpVerificationModalComponent } from '@shared/components/otp-verification-modal/otp-verification-modal.component';
import { DeletionErrorHandlerHook } from '@shared/hooks/deletion-error-handler.hook';
import { TournamentService } from '@features/tournaments/services/tournament.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
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
  tokenFromUrl: string | null = null;
  roleType: 'league' | 'team' | null = null;
  pageTitle: string = 'Crear Cuenta';
  tournamentInfo: { id: number; name: string; imageUrl: string } | null = null;
  loadingTournament = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private errorHandler: DeletionErrorHandlerHook,
    private tournamentService: TournamentService,
    private toastService: ToastService
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
          this.loadTournamentByToken(params['token']);
        }
        if (params['role']) {
          this.roleType = params['role'];
          this.updatePageTitle();
        }
      });
  }

  /**
   * Carga la información del torneo usando el token
   */
  private loadTournamentByToken(token: string): void {
    this.loadingTournament = true;
    this.tournamentService.getTournamentByToken(token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tournament) => {
          this.loadingTournament = false;
          if (tournament) {
            this.tournamentInfo = tournament;
            console.log('Torneo cargado:', this.tournamentInfo);
          }
        },
        error: (error) => {
          this.loadingTournament = false;
          if (error.response.data.messageId === 'EGOL_121') {
              this.router.navigate(['/not-found']);
          }
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
            this.openOtpVerificationModal(registerData.password, response.email);
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

  private openOtpVerificationModal(password: string, email: string): void {
    const dialogRef = this.dialog.open(OtpVerificationModalComponent, {
      width: '550px',
      disableClose: true,
      data: {
        email: email,
        expiryMinutes: 5, // Tiempo de expiración del código OTP: 5 minutos
        onVerify: async (code: string) => {
          return new Promise<boolean>((resolve) => {
            this.authService.verifyOTP(email, code, false, true).subscribe({
              next: () => {
                // Login automático exitoso, el servicio ya maneja la navegación
                 const loginData: LoginRequest = { userName: email, password: password };
                this.authService.login(loginData, this.tokenFromUrl).subscribe({
                    next: (response) => {
                    
                    },
                    error: (error: any) => {
                      this.loading = false;
                      if (error.response.data.messageId === 'EGOL_120') {
                        this.toastService.showError('Su cuenta de correo no ha sido verificada.');
                      }
                      else {
                        this.toastService.showError('Usuario o contraseña incorrectos.');
                      }
                    }
                  });
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
        this.resendOtpCode(password,email);
      } else if (!result?.verified) {
        // Usuario canceló, permanecer en la página de registro
        this.loading = false;
      }
    });
  }

  private resendOtpCode(password: string, email: string): void {
    this.authService.resendOTP(email).subscribe({
      next: () => {
        // Reabrir el modal con el temporizador reiniciado
        this.openOtpVerificationModal(password, email);
      },
      error: (error) => {
        console.error('Resend OTP error:', error);
        // El error ya se muestra en el servicio con toast
        // Aún así, reabrir el modal para que el usuario pueda intentar de nuevo
        const userId = 0;
        this.openOtpVerificationModal(password, email);
      }
    });
  }
}
