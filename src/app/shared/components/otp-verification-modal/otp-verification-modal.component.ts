import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, timer } from 'rxjs';

export interface OtpVerificationData {
  email: string;
  expiryMinutes?: number;
}

@Component({
  selector: 'app-otp-verification-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './otp-verification-modal.component.html',
  styleUrls: ['./otp-verification-modal.component.scss']
})
export class OtpVerificationModalComponent implements OnInit, OnDestroy {
  otpForm!: FormGroup;
  loading = false;
  timeRemaining = 0;
  timerDisplay = '';
  private destroy$ = new Subject<void>();
  private timerSubscription?: any;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<OtpVerificationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OtpVerificationData
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  private initializeForm(): void {
    this.otpForm = this.fb.group({
      digit1: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit2: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit3: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit4: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit5: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit6: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    });
  }

  private startTimer(): void {
    const expiryMinutes = this.data.expiryMinutes || 10;
    this.timeRemaining = expiryMinutes * 60; // Convertir a segundos

    this.timerSubscription = timer(0, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.timeRemaining > 0) {
          this.timeRemaining--;
          this.updateTimerDisplay();
        } else {
          this.onTimerExpired();
        }
      });
  }

  private updateTimerDisplay(): void {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    this.timerDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private onTimerExpired(): void {
    this.timerDisplay = '0:00';
    this.otpForm.disable();
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  onDigitInput(event: any, currentIndex: number): void {
    const input = event.target;
    const value = input.value;

    // Si se ingresa un valor, mover al siguiente campo
    if (value && currentIndex < 6) {
      const nextInput = document.getElementById(`digit${currentIndex + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
  }

  onDigitKeyDown(event: KeyboardEvent, currentIndex: number): void {
    // Si se presiona backspace y el campo está vacío, mover al campo anterior
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement;
      if (!input.value && currentIndex > 1) {
        const prevInput = document.getElementById(`digit${currentIndex - 1}`);
        if (prevInput) {
          (prevInput as HTMLInputElement).focus();
        }
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text');
    
    if (pastedData && /^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      digits.forEach((digit, index) => {
        this.otpForm.patchValue({ [`digit${index + 1}`]: digit });
      });
      
      // Enfocar el último campo
      const lastInput = document.getElementById('digit6');
      if (lastInput) {
        (lastInput as HTMLInputElement).focus();
      }
    }
  }

  getOtpCode(): string {
    const values = this.otpForm.value;
    return `${values.digit1}${values.digit2}${values.digit3}${values.digit4}${values.digit5}${values.digit6}`;
  }

  onVerify(): void {
    if (this.otpForm.valid && this.timeRemaining > 0) {
      const otpCode = this.getOtpCode();
      this.dialogRef.close({ verified: true, code: otpCode });
    }
  }

  onResendCode(): void {
    this.dialogRef.close({ resend: true });
  }

  onCancel(): void {
    this.dialogRef.close({ verified: false });
  }

  get isExpired(): boolean {
    return this.timeRemaining <= 0;
  }

  get canVerify(): boolean {
    return this.otpForm.valid && !this.isExpired;
  }
}
