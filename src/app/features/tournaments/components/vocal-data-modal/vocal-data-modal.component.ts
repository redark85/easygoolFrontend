import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatchService, MatchVocal, UpdateVocalPasswordResponse } from '@core/services/match.service';
import { Subject, takeUntil } from 'rxjs';

export interface VocalDataModalData {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  vocal: MatchVocal;
}

export interface VocalDataModalResult {
  success: boolean;
  updated?: boolean;
}

@Component({
  selector: 'app-vocal-data-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="vocal-data-modal">
      <h2 mat-dialog-title>Datos del Vocal</h2>
      
      <mat-dialog-content>
        <div class="match-info">
          <h4><strong>{{data.homeTeam}}</strong> vs <strong>{{data.awayTeam}}</strong></h4>
        </div>

        <form [formGroup]="vocalForm" class="vocal-form">
          <!-- Usuario (Solo lectura) -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Usuario</mat-label>
            <input matInput [value]="data.vocal.userName" readonly>
            <button mat-icon-button matSuffix type="button" (click)="copyToClipboard(data.vocal.userName)" matTooltip="Copiar Usuario">
              <mat-icon>content_copy</mat-icon>
            </button>
          </mat-form-field>

          <!-- Contraseña (Editable) -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Contraseña</mat-label>
            <input matInput 
                   formControlName="password"
                   [type]="hidePassword ? 'password' : 'text'"
                   placeholder="Mínimo 8 caracteres">
            <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword" matTooltip="Mostrar/Ocultar contraseña">
              <mat-icon>{{hidePassword ? 'visibility' : 'visibility_off'}}</mat-icon>
            </button>
            <button mat-icon-button matSuffix type="button" (click)="copyToClipboard(vocalForm.get('password')?.value || '')" matTooltip="Copiar Contraseña">
              <mat-icon>content_copy</mat-icon>
            </button>
            <mat-error *ngIf="vocalForm.get('password')?.hasError('required')">
              La contraseña es requerida
            </mat-error>
            <mat-error *ngIf="vocalForm.get('password')?.hasError('minlength')">
              La contraseña debe tener al menos 8 caracteres
            </mat-error>
          </mat-form-field>

          <div class="info-message">
            <mat-icon>info</mat-icon>
            <span>El usuario está bloqueado. Solo se puede actualizar la contraseña.</span>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()" [disabled]="loading">
          Cancelar
        </button>
        <button mat-raised-button 
                color="primary" 
                (click)="onUpdate()" 
                [disabled]="!vocalForm.valid || loading">
          <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
          <span *ngIf="!loading">Actualizar</span>
          <span *ngIf="loading">Actualizando...</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .vocal-data-modal {
      min-width: 400px;
      max-width: 500px;
    }

    .match-info {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .match-info h4 {
      margin: 0;
      color: #333;
    }

    .vocal-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .info-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 4px;
      color: #666;
      font-size: 14px;
    }

    .info-message mat-icon {
      color: #2196f3;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
    }

    mat-spinner {
      margin-right: 8px;
    }
  `]
})
export class VocalDataModalComponent implements OnInit {
  vocalForm: FormGroup;
  hidePassword = true;
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private matchService: MatchService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<VocalDataModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VocalDataModalData
  ) {
    this.vocalForm = this.fb.group({
      password: [data.vocal.password, [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    console.log('🎤 Vocal Data Modal initialized with data:', this.data);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Copia texto al portapapeles
   */
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Copiado al portapapeles', 'Cerrar', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }).catch(() => {
      this.snackBar.open('Error al copiar', 'Cerrar', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    });
  }

  /**
   * Cancela y cierra el modal
   */
  onCancel(): void {
    const result: VocalDataModalResult = { success: false };
    this.dialogRef.close(result);
  }

  /**
   * Actualiza la contraseña del vocal
   */
  onUpdate(): void {
    if (!this.vocalForm.valid) {
      return;
    }

    const newPassword = this.vocalForm.get('password')?.value;
    if (!newPassword) {
      return;
    }

    this.loading = true;
    console.log('🔄 Updating vocal password for vocal ID:', this.data.vocal.id);

    this.matchService.updateVocalPassword(this.data.vocal.id, newPassword)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: UpdateVocalPasswordResponse) => {
          this.loading = false;
          
          if (response.succeed && response.result) {
            this.snackBar.open('Contraseña actualizada correctamente', 'Cerrar', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            });

            const result: VocalDataModalResult = { 
              success: true, 
              updated: true 
            };
            this.dialogRef.close(result);
          } else {
            this.snackBar.open(response.message || 'Error al actualizar la contraseña', 'Cerrar', {
              duration: 4000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            });
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('❌ Error updating vocal password:', error);
          
          this.snackBar.open(error.message || 'Error al actualizar la contraseña', 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        }
      });
  }
}
