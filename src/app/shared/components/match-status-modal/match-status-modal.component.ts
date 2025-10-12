import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatchStatusType } from '@core/services/match.service';

export interface MatchStatusModalData {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  currentStatus: MatchStatusType;
}

export interface MatchStatusModalResult {
  success: boolean;
  newStatus?: MatchStatusType;
}

interface StatusOption {
  value: MatchStatusType;
  text: string;
}

@Component({
  selector: 'app-match-status-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './match-status-modal.component.html',
  styleUrls: ['./match-status-modal.component.scss']
})
export class MatchStatusModalComponent implements OnInit {
  statusForm: FormGroup;
  isSubmitting = false;
  availableStatuses: StatusOption[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<MatchStatusModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MatchStatusModalData
  ) {
    this.statusForm = this.fb.group({
      newStatus: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.initializeAvailableStatuses();
  }

  private initializeAvailableStatuses(): void {
    // Todos los estados disponibles
    this.availableStatuses = [
      { value: MatchStatusType.scheduled, text: 'Programado' },
      { value: MatchStatusType.played, text: 'Jugado' },
      { value: MatchStatusType.canceled, text: 'Cancelado' },
      { value: MatchStatusType.postponed, text: 'Postergado' }
    ];

    // Filtrar el estado actual para que no aparezca en las opciones
    this.availableStatuses = this.availableStatuses.filter(
      status => status.value !== this.data.currentStatus
    );
  }

  getCurrentStatusText(): string {
    switch (this.data.currentStatus) {
      case MatchStatusType.scheduled: return 'Programado';
      case MatchStatusType.played: return 'Jugado';
      case MatchStatusType.canceled: return 'Cancelado';
      case MatchStatusType.postponed: return 'Postergado';
      default: return 'Desconocido';
    }
  }

  getStatusClass(status: MatchStatusType): string {
    switch (status) {
      case MatchStatusType.scheduled: return 'status-scheduled';
      case MatchStatusType.played: return 'status-played';
      case MatchStatusType.canceled: return 'status-canceled';
      case MatchStatusType.postponed: return 'status-postponed';
      default: return 'status-unknown';
    }
  }

  compareStatusValues(status1: MatchStatusType, status2: MatchStatusType): boolean {
    return status1 === status2;
  }

  onSubmit(): void {
    if (this.statusForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      // Por ahora solo cerramos el modal con el nuevo estado
      // En el futuro aquí se haría la llamada a la API
      const newStatus = this.statusForm.get('newStatus')?.value;
      
      setTimeout(() => {
        this.dialogRef.close({
          success: true,
          newStatus: newStatus
        } as MatchStatusModalResult);
      }, 1000);
    }
  }

  onCancel(): void {
    this.dialogRef.close({
      success: false
    } as MatchStatusModalResult);
  }
}
