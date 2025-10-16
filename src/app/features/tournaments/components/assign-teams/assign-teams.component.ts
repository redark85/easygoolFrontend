import { Component, Inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { PhaseService } from '../../services/phase.service';
import { TeamService } from '../../services/team.service';
import { TeamWithoutPhase, TeamStatus } from '../../models/team.interface';
import Swal from 'sweetalert2';

export interface AssignTeamsDialogData {
  phaseId: number;
  phaseName: string;
  phaseType: number; // 0 = GroupStage, 1 = Knockout
  groupId?: number; // Solo para GroupStage
  groupName?: string; // Solo para GroupStage
}

export interface AssignTeamsResult {
  success: boolean;
  selectedTeams: TeamWithoutPhase[];
}

@Component({
  selector: 'app-assign-teams',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './assign-teams.component.html',
  styleUrls: ['./assign-teams.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignTeamsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  availableTeams: TeamWithoutPhase[] = [];
  selectedTeams: Set<number> = new Set();
  isLoading = false;
  selectAll = false;

  // Enum reference for template
  TeamStatus = TeamStatus;

  constructor(
    private dialogRef: MatDialogRef<AssignTeamsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignTeamsDialogData,
    private phaseService: PhaseService,
    private teamService: TeamService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAvailableTeams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los equipos disponibles para asignar a la fase
   */
  private loadAvailableTeams(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.phaseService.getTeamsWithoutPhase(this.data.phaseId)
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
          console.error('Error loading available teams:', error);
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Maneja el cambio en la selección de un equipo
   * @param teamId ID del equipo
   * @param selected Estado de selección
   */
  onTeamSelectionChange(teamId: number, selected: boolean): void {
    if (selected) {
      this.selectedTeams.add(teamId);
    } else {
      this.selectedTeams.delete(teamId);
    }
    
    // Actualizar estado del "Seleccionar todos"
    this.updateSelectAllState();
  }

  /**
   * Maneja el cambio en "Seleccionar todos"
   * @param selectAll Estado de seleccionar todos
   */
  onSelectAllChange(selectAll: boolean): void {
    this.selectAll = selectAll;
    
    if (selectAll) {
      // Seleccionar todos los equipos activos
      this.availableTeams
        .filter(team => team.status === TeamStatus.Active)
        .forEach(team => this.selectedTeams.add(team.tournamentTeamId));
    } else {
      // Deseleccionar todos
      this.selectedTeams.clear();
    }
  }

  /**
   * Actualiza el estado del checkbox "Seleccionar todos"
   */
  private updateSelectAllState(): void {
    const activeTeams = this.availableTeams.filter(team => team.status === TeamStatus.Active);
    const selectedActiveTeams = activeTeams.filter(team => this.selectedTeams.has(team.tournamentTeamId));
    
    this.selectAll = activeTeams.length > 0 && selectedActiveTeams.length === activeTeams.length;
  }

  /**
   * Verifica si un equipo está seleccionado
   * @param teamId ID del equipo
   * @returns true si está seleccionado
   */
  isTeamSelected(teamId: number): boolean {
    return this.selectedTeams.has(teamId);
  }

  /**
   * Verifica si un equipo puede ser seleccionado
   * @param team Equipo a verificar
   * @returns true si puede ser seleccionado
   */
  canSelectTeam(team: TeamWithoutPhase): boolean {
    return team.status === TeamStatus.Active;
  }

  /**
   * Obtiene la URL de la imagen del equipo o la imagen por defecto
   * @param team Equipo
   * @returns URL de la imagen
   */
  getTeamImageUrl(team: TeamWithoutPhase): string {
    return team.logoUrl || 'assets/default-team.png';
  }

  /**
   * Obtiene el texto del estado del equipo
   * @param status Estado del equipo
   * @returns Texto del estado
   */
  getTeamStatusText(status: TeamStatus): string {
    switch (status) {
      case TeamStatus.Active:
        return 'Activo';
      case TeamStatus.Disqualified:
        return 'Descalificado';
      case TeamStatus.Deleted:
        return 'Eliminado';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Obtiene la clase CSS para el estado del equipo
   * @param status Estado del equipo
   * @returns Clase CSS
   */
  getTeamStatusClass(status: TeamStatus): string {
    switch (status) {
      case TeamStatus.Active:
        return 'status-active';
      case TeamStatus.Disqualified:
        return 'status-disqualified';
      case TeamStatus.Deleted:
        return 'status-deleted';
      default:
        return 'status-unknown';
    }
  }

  /**
   * Obtiene el título del modal según el contexto
   * @returns Título del modal
   */
  getModalTitle(): string {
    if (this.data.phaseType === 0 && this.data.groupName) {
      return `Asignar equipos al grupo "${this.data.groupName}"`;
    }
    return `Asignar equipos a la fase "${this.data.phaseName}"`;
  }

  /**
   * Obtiene el número de equipos seleccionados
   * @returns Número de equipos seleccionados
   */
  getSelectedCount(): number {
    return this.selectedTeams.size;
  }

  /**
   * Cancela la operación y cierra el modal
   */
  onCancel(): void {
    this.dialogRef.close({ success: false, selectedTeams: [] });
  }

  /**
   * Confirma la selección y asigna los equipos al grupo
   */
  onConfirm(): void {
    if (this.selectedTeams.size === 0) {
      return;
    }

    const selectedTeamIds = Array.from(this.selectedTeams);
    
    // Llamar al API para asignar equipos al grupo
    this.teamService.assignTeamsToGroup(
      this.data.phaseId,
      selectedTeamIds,
      this.data.groupId!
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Equipos asignados!',
          text: `${selectedTeamIds.length} equipo${selectedTeamIds.length !== 1 ? 's' : ''} asignado${selectedTeamIds.length !== 1 ? 's' : ''} exitosamente`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Cerrar modal con éxito
        this.dialogRef.close({ 
          success: true, 
          selectedTeams: this.availableTeams.filter(team => this.selectedTeams.has(team.tournamentTeamId))
        });
      },
      error: (error) => {
        Swal.fire({
          title: 'Error',
          text: error.message || 'No se pudieron asignar los equipos al grupo',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  /**
   * TrackBy function para optimizar el renderizado
   * @param index Índice
   * @param team Equipo
   * @returns ID del equipo
   */
  trackByTeamId(index: number, team: TeamWithoutPhase): number {
    return team.id;
  }
}
