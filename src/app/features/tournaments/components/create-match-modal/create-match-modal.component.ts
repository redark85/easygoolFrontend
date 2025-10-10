import { Component, Inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { MatchService, FreeTeam } from '@core/services/match.service';
import Swal from 'sweetalert2';

export interface CreateMatchDialogData {
  groupId: number;
  phaseId: number;
  matchDayId: number;
  matchDayName: string;
}

export interface CreateMatchResult {
  success: boolean;
  homeTeamId?: number;
  awayTeamId?: number;
  matchDate?: string;
  matchTime?: string;
}

@Component({
  selector: 'app-create-match-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatTimepickerModule,
    MatNativeDateModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './create-match-modal.component.html',
  styleUrls: ['./create-match-modal.component.scss']
  // changeDetection: ChangeDetectionStrategy.OnPush // Temporalmente deshabilitado para debugging
})
export class CreateMatchModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  availableTeams: FreeTeam[] = [];
  selectedHomeTeam: FreeTeam | null = null;
  selectedAwayTeam: FreeTeam | null = null;
  isLoading = false;
  matchForm!: FormGroup;
  minDate = new Date();

  constructor(
    private dialogRef: MatDialogRef<CreateMatchModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateMatchDialogData,
    private matchService: MatchService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadFreeTeams();
  }

  /**
   * Inicializa el formulario con fecha y hora por defecto
   */
  private initializeForm(): void {
    const now = new Date();
    
    // Redondear la hora actual a los 15 minutos más cercanos
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    const initialTime = new Date(now);
    initialTime.setMinutes(roundedMinutes, 0, 0);
    
    // Si se pasa de 60 minutos, ajustar la hora
    if (roundedMinutes >= 60) {
      initialTime.setHours(initialTime.getHours() + 1, 0, 0, 0);
    }
    
    this.matchForm = this.fb.group({
      matchDate: [new Date(now), Validators.required],
      matchTime: [initialTime, Validators.required]
    });
    
    console.log('Form initialized:', this.matchForm);
    console.log('Form valid:', this.matchForm.valid);
    console.log('Form value:', this.matchForm.value);
    
    // Forzar detección de cambios
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los equipos libres para la jornada
   */
  private loadFreeTeams(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.matchService.getFreeMatchDayTeams(
      this.data.groupId,
      this.data.phaseId,
      this.data.matchDayId
    )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (teams) => {
          this.availableTeams = teams;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading free teams:', error);
          Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudieron cargar los equipos disponibles',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Selecciona el equipo local
   */
  selectHomeTeam(team: FreeTeam): void {
    // Si el equipo ya está seleccionado como visitante, no hacer nada
    if (this.selectedAwayTeam?.tournamentTeamId === team.tournamentTeamId) {
      return;
    }
    
    // Si ya está seleccionado como local, deseleccionar
    if (this.selectedHomeTeam?.tournamentTeamId === team.tournamentTeamId) {
      this.selectedHomeTeam = null;
    } else {
      // Seleccionar como local
      this.selectedHomeTeam = team;
    }
    
    console.log('Home team selected:', this.selectedHomeTeam);
    this.cdr.detectChanges();
  }

  /**
   * Selecciona el equipo visitante
   */
  selectAwayTeam(team: FreeTeam): void {
    // Si el equipo ya está seleccionado como local, no hacer nada
    if (this.selectedHomeTeam?.tournamentTeamId === team.tournamentTeamId) {
      return;
    }
    
    // Si ya está seleccionado como visitante, deseleccionar
    if (this.selectedAwayTeam?.tournamentTeamId === team.tournamentTeamId) {
      this.selectedAwayTeam = null;
    } else {
      // Seleccionar como visitante
      this.selectedAwayTeam = team;
    }
    
    console.log('Away team selected:', this.selectedAwayTeam);
    this.cdr.detectChanges();
  }

  /**
   * Verifica si un equipo está seleccionado como local
   */
  isHomeTeamSelected(team: FreeTeam): boolean {
    return this.selectedHomeTeam !== null && this.selectedHomeTeam.tournamentTeamId === team.tournamentTeamId;
  }

  /**
   * Verifica si un equipo está seleccionado como visitante
   */
  isAwayTeamSelected(team: FreeTeam): boolean {
    return this.selectedAwayTeam !== null && this.selectedAwayTeam.tournamentTeamId === team.tournamentTeamId;
  }

  /**
   * Verifica si un equipo puede ser seleccionado
   */
  canSelectTeam(team: FreeTeam, type: 'home' | 'away'): boolean {
    if (type === 'home') {
      return !this.isAwayTeamSelected(team);
    }
    return !this.isHomeTeamSelected(team);
  }

  /**
   * Obtiene la URL de la imagen del equipo
   */
  getTeamImageUrl(team: FreeTeam): string {
    return team.logoUrl || 'assets/logo.png';
  }

  /**
   * Verifica si se puede confirmar la creación
   */
  canConfirm(): boolean {
    return this.selectedHomeTeam !== null && 
           this.selectedAwayTeam !== null && 
           this.matchForm.valid;
  }

  /**
   * Cancela la operación
   */
  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  /**
   * Confirma la creación del partido
   */
  onConfirm(): void {
    if (!this.canConfirm()) {
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    // Obtener fecha y hora del formulario
    const formValue = this.matchForm.value;
    const selectedDate = formValue.matchDate as Date;
    const selectedTime = formValue.matchTime as Date;

    // Combinar fecha y hora
    const combinedDateTime = new Date(selectedDate);
    combinedDateTime.setHours(
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
      0
    );

    const request = {
      phaseId: this.data.phaseId,
      matchDayId: this.data.matchDayId,
      homeTeamId: this.selectedHomeTeam!.phaseTeamId,
      awayTeamId: this.selectedAwayTeam!.phaseTeamId,
      matchDate: combinedDateTime.toISOString(),
      matchTime: selectedTime.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    this.matchService.createMatch(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'El partido se ha creado correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            this.dialogRef.close({
              success: true,
              homeTeamId: this.selectedHomeTeam!.tournamentTeamId,
              awayTeamId: this.selectedAwayTeam!.tournamentTeamId,
              matchDate: combinedDateTime.toISOString(),
              matchTime: selectedTime.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })
            });
          });
        },
        error: (error) => {
          console.error('Error creating match:', error);
          Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo crear el partido',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      });
  }

  /**
   * Verifica si el formulario está inicializado
   */
  isFormInitialized(): boolean {
    return !!this.matchForm;
  }

  /**
   * TrackBy function para optimizar el renderizado
   */
  trackByTeamId(index: number, team: FreeTeam): number {
    return team.tournamentTeamId;
  }
}
