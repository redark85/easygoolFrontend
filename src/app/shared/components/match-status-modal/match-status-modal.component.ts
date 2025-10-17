import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatchStatusType, MatchService } from '@core/services/match.service';
import { ToastService } from '@core/services/toast.service';

export interface MatchStatusModalData {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  currentStatus: MatchStatusType;
  currentMatchDate: string;
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
    @Inject(MAT_DIALOG_DATA) public data: MatchStatusModalData,
    private matchService: MatchService,
    private toastService: ToastService
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
      { value: MatchStatusType.inProgress, text: 'En vivo' },
      { value: MatchStatusType.played, text: 'Jugado' },
      { value: MatchStatusType.canceled, text: 'Eliminado' },
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
      case MatchStatusType.inProgress: return 'En vivo';
      case MatchStatusType.played: return 'Jugado';
      case MatchStatusType.canceled: return 'Cancelado';
      case MatchStatusType.postponed: return 'Postergado';
      default: return 'Desconocido';
    }
  }

  getStatusClass(status: MatchStatusType): string {
    switch (status) {
      case MatchStatusType.scheduled: return 'status-scheduled';
      case MatchStatusType.inProgress: return 'status-in-progress';
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
      const newStatus = this.statusForm.get('newStatus')?.value;

      // Llamar al API para cambiar el estado del partido
      this.matchService.changeMatchStatus(
        this.data.matchId,
        newStatus,
        this.data.currentMatchDate
      ).subscribe({
        next: (response) => {
          this.toastService.showSuccess('Estado del partido actualizado correctamente');
          this.dialogRef.close({
            success: true,
            newStatus: newStatus
          } as MatchStatusModalResult);
        },
        error: (error) => {
          console.error('Error al cambiar estado del partido:', error);
          this.toastService.showError('Error al cambiar el estado del partido');
          this.isSubmitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close({
      success: false
    } as MatchStatusModalResult);
  }
}
