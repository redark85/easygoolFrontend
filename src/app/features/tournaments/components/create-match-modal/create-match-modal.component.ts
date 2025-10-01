import { Component, Inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
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
}

@Component({
  selector: 'app-create-match-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './create-match-modal.component.html',
  styleUrls: ['./create-match-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateMatchModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  availableTeams: FreeTeam[] = [];
  selectedHomeTeam: FreeTeam | null = null;
  selectedAwayTeam: FreeTeam | null = null;
  isLoading = false;

  constructor(
    private dialogRef: MatDialogRef<CreateMatchModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateMatchDialogData,
    private matchService: MatchService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFreeTeams();
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
    return this.selectedHomeTeam !== null && this.selectedAwayTeam !== null;
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

    const request = {
      phaseId: this.data.phaseId,
      matchDayId: this.data.matchDayId,
      homeTeamId: this.selectedHomeTeam!.phaseTeamId,
      awayTeamId: this.selectedAwayTeam!.phaseTeamId
    };

    this.matchService.createMatch(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
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
              awayTeamId: this.selectedAwayTeam!.tournamentTeamId
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
   * TrackBy function para optimizar el renderizado
   */
  trackByTeamId(index: number, team: FreeTeam): number {
    return team.tournamentTeamId;
  }
}
