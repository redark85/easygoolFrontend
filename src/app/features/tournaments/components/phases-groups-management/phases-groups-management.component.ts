import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { Phase, Group, PhaseType } from '../../models/phase.interface';
import { Team } from '../../models/team.interface';
import { PhaseService } from '../../services/phase.service';
import { PhaseFormComponent } from '../phase-form/phase-form.component';
import { GroupFormComponent } from '../group-form/group-form.component';
import { AssignTeamsComponent, AssignTeamsDialogData, AssignTeamsResult } from '../assign-teams/assign-teams.component';
import { PhaseFormData, PhaseModalResult } from '../../models/phase-form.interface';
import { GroupFormData, GroupModalResult } from '../../models/group-form.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-phases-groups-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  templateUrl: './phases-groups-management.component.html',
  styleUrls: ['./phases-groups-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhasesGroupsManagementComponent implements OnInit {
  @Input() tournamentId!: number;
  @Input() phases: Phase[] = [];
  @Output() phasesUpdated = new EventEmitter<Phase[]>();

  // Control de expansión de grupos
  expandedGroupIndex: number = -1;
  
  // Loading states
  isLoadingPhases = false;

  private destroy$ = new Subject<void>();

  constructor(
    private phaseService: PhaseService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPhases();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Crea una nueva fase
   */
  createPhase(): void {
    const dialogRef = this.dialog.open(PhaseFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        mode: 'create',
        isEdit: false,
        tournamentId: this.tournamentId
      } as PhaseFormData
    });

    dialogRef.afterClosed().subscribe((result: PhaseModalResult) => {
      if (result && result.action === 'create') {
        this.refreshPhases();
      }
    });
  }

  /**
   * Edita una fase existente
   */
  editPhase(phase: Phase): void {
    const dialogRef = this.dialog.open(PhaseFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        mode: 'edit',
        isEdit: true,
        phase: phase,
        tournamentId: this.tournamentId
      } as PhaseFormData
    });

    dialogRef.afterClosed().subscribe((result: PhaseModalResult) => {
      if (result && result.action === 'update' && 'id' in result.data) {
        // Update phase via API
        this.phaseService.updatePhase(phase.id, result.data).subscribe({
          next: (response) => {
            if (response.succeed) {
              this.refreshPhases();
            }
          },
          error: (error) => {
            console.error('Error updating phase:', error);
          }
        });
      }
    });
  }

  /**
   * Elimina una fase
   */
  deletePhase(phase: Phase): void {
    Swal.fire({
      title: 'Eliminar Fase',
      text: `¿Estás seguro de que deseas eliminar la fase "${phase.name}"? Esta acción eliminará también todos los grupos asociados.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.phaseService.deletePhase(phase.id).subscribe({
          next: (response) => {
            if (response.succeed) {
              this.loadPhases();
              Swal.fire({
                title: '¡Eliminada!',
                text: 'La fase ha sido eliminada correctamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
            }
          },
          error: (error) => {
            console.error('Error deleting phase:', error);
          }
        });
      }
    });
  }

  /**
   * Crea un nuevo grupo en una fase
   */
  createGroup(phase: Phase): void {
    const dialogRef = this.dialog.open(GroupFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        mode: 'create',
        isEdit: false,
        phaseId: phase.id
      } as GroupFormData
    });

    dialogRef.afterClosed().subscribe((result: GroupModalResult) => {
      if (result && result.action === 'create') {
        this.refreshPhases();
      }
    });
  }

  /**
   * Edita un grupo existente
   */
  editGroup(group: Group): void {
    const dialogRef = this.dialog.open(GroupFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        mode: 'edit',
        isEdit: true,
        group: group,
        phaseId: group.phaseId
      } as GroupFormData
    });

    dialogRef.afterClosed().subscribe((result: GroupModalResult) => {
      if (result && result.action === 'update') {
        // Update group via API
        this.phaseService.updateGroup(group.id, { name: result.data.name }).subscribe({
          next: (response) => {
            if (response.succeed) {
              this.refreshPhases();
            }
          },
          error: (error) => {
            console.error('Error updating group:', error);
          }
        });
      }
    });
  }

  /**
   * Abre el modal para asignar equipos a una fase (Knockout)
   * @param phaseId ID de la fase
   * @param phaseName Nombre de la fase
   */
  addTeamToPhase(phaseId: number, phaseName: string): void {
    const dialogData: AssignTeamsDialogData = {
      phaseId: phaseId,
      phaseName: phaseName,
      phaseType: 1 // Knockout
    };

    const dialogRef = this.dialog.open(AssignTeamsComponent, {
      width: '600px',
      maxHeight: '80vh',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: AssignTeamsResult) => {
      if (result && result.success && result.selectedTeams.length > 0) {
        // TODO: Implementar la asignación de equipos a la fase
        console.log('Teams to assign to phase:', result.selectedTeams);
        // Aquí se llamaría al servicio para asignar los equipos a la fase
        this.refreshPhases();
      }
    });
  }

  /**
   * Abre el modal para asignar equipos a un grupo (GroupStage)
   * @param phaseId ID de la fase
   * @param groupId ID del grupo
   */
  addTeamToGroup(phaseId: number, groupId: number): void {
    // Encontrar la fase y el grupo
    const phase = this.phases.find(p => p.id === phaseId);
    const group = phase?.groups?.find(g => g.id === groupId);
    
    if (!phase || !group) {
      console.error('Phase or group not found');
      return;
    }

    const dialogData: AssignTeamsDialogData = {
      phaseId: phaseId,
      phaseName: phase.name,
      phaseType: 0, // GroupStage
      groupId: groupId,
      groupName: group.name
    };

    const dialogRef = this.dialog.open(AssignTeamsComponent, {
      width: '600px',
      maxHeight: '80vh',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: AssignTeamsResult) => {
      if (result && result.success && result.selectedTeams.length > 0) {
        // TODO: Implementar la asignación de equipos al grupo
        console.log('Teams to assign to group:', result.selectedTeams);
        // Aquí se llamaría al servicio para asignar los equipos al grupo
        this.refreshPhases();
      }
    });
  }

  /**
   * Elimina un grupo
   */
  deleteGroup(group: Group): void {
    Swal.fire({
      title: 'Eliminar Grupo',
      text: `¿Estás seguro de que deseas eliminar el grupo "${group.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.phaseService.deleteGroup(group.id).subscribe({
          next: (response) => {
            if (response.succeed) {
              this.loadPhases();
              Swal.fire({
                title: '¡Eliminado!',
                text: 'El grupo ha sido eliminado correctamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
            }
          },
          error: (error) => {
            console.error('Error deleting group:', error);
          }
        });
      }
    });
  }


  /**
   * Abre el modal para crear un nuevo grupo
   * @param phaseId ID de la fase donde crear el grupo
   */
  addGroup(phaseId: number): void {
    const dialogRef = this.dialog.open(GroupFormComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: true,
      data: { 
        phaseId: phaseId,
        isEdit: false
      } as GroupFormData
    });

    dialogRef.afterClosed().subscribe((result: GroupModalResult) => {
      if (result && result.action === 'create') {
        // Create group via API
        this.phaseService.createGroup(phaseId, { name: result.data.name }).subscribe({
          next: (response) => {
            if (response.succeed) {
              this.refreshPhases();
            }
          },
          error: (error) => {
            console.error('Error creating group:', error);
          }
        });
      }
    });
  }

  /**
   * Asigna equipos aleatoriamente a los grupos de una fase
   * @param phase Fase de grupos donde asignar equipos
   */
  assignTeamsRandomly(phase: Phase): void {
    // TODO: Implementar lógica para asignar equipos disponibles aleatoriamente a los grupos
    console.log('Asignar equipos aleatoriamente a la fase:', phase);
  }


  /**
   * Remueve un equipo de un grupo
   */
  removeTeamFromGroup(team: any, group: any): void {
    // TODO: Implementar lógica para remover equipo del grupo
    console.log('Remove team from group:', team, group);
  }

  /**
   * Remueve un equipo de una fase (para fases de eliminatorias)
   */
  removeTeamFromPhase(team: any, phase: Phase): void {
    // TODO: Implementar lógica para remover equipo de la fase de eliminatorias
    console.log('Remove team from phase:', team, phase);
  }

  /**
   * Descalifica un equipo del torneo
   * @param team Equipo a descalificar
   * @param group Grupo del equipo
   */
  disqualifyTeam(team: any, group: any): void {
    // TODO: Implementar lógica para descalificar equipo
    console.log('Disqualify team:', team, group);
  }

  /**
   * Carga las fases del torneo
   */
  loadPhases(): void {
    this.isLoadingPhases = true;
    this.cdr.detectChanges();
    
    this.phaseService.getPhasesByTournament(this.tournamentId).subscribe({
      next: (phases) => {
        this.phases = phases;
        this.phasesUpdated.emit(phases);
        this.isLoadingPhases = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading phases:', error);
        this.isLoadingPhases = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Refresca la lista de fases
   */
  private refreshPhases(): void {
    this.loadPhases();
  }

  /**
   * Obtiene el ícono para el tipo de fase
   */
  getPhaseTypeIcon(phaseType: PhaseType): string {
    switch (phaseType) {
      case PhaseType.GroupStage:
        return 'group_work';
      case PhaseType.Knockout:
        return 'emoji_events';
      default:
        return 'sports_soccer';
    }
  }

  /**
   * Obtiene el texto para el tipo de fase
   */
  getPhaseTypeText(phaseType: PhaseType): string {
    switch (phaseType) {
      case PhaseType.GroupStage:
        return 'Fase de Grupos';
      case PhaseType.Knockout:
        return 'Eliminatoria';
      default:
        return 'Tipo desconocido';
    }
  }

  /**
   * TrackBy function para fases
   */
  trackByPhaseId(index: number, phase: Phase): number {
    return phase.id || 0;
  }

  /**
   * TrackBy function para grupos
   */
  trackByGroupId(index: number, group: Group): number {
    return group.id || 0;
  }

  /**
   * TrackBy function para equipos
   */
  trackByTeamId(index: number, team: Team): number {
    return team.id || index;
  }

  /**
   * Valida si se puede eliminar una fase
   * @param phase Fase a validar
   * @returns true si se puede eliminar, false si no
   */
  canDeletePhase(phase: Phase): boolean {
    if (phase.phaseType === PhaseType.Knockout) {
      // Para fases de eliminatorias, verificar si hay equipos
      return !phase.knockoutTeams || phase.knockoutTeams.length === 0;
    } else {
      // Para fases de grupos, verificar si algún grupo tiene equipos
      if (!phase.groups || phase.groups.length === 0) {
        return true;
      }
      return !phase.groups.some(group => group.teams && group.teams.length > 0);
    }
  }

  /**
   * Valida si se puede eliminar un grupo
   * @param group Grupo a validar
   * @returns true si se puede eliminar, false si no
   */
  canDeleteGroup(group: Group): boolean {
    return !group.teams || group.teams.length === 0;
  }
}
