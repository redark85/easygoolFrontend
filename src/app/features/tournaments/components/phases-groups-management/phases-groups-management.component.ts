import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
import { Team, TeamStatus } from '../../models/team.interface';
import { PhaseService } from '../../services/phase.service';
import { TeamService } from '../../services/team.service';
import { PhaseFormComponent } from '../phase-form/phase-form.component';
import { GroupFormComponent } from '../group-form/group-form.component';
import { AssignTeamsComponent, AssignTeamsDialogData, AssignTeamsResult } from '../assign-teams/assign-teams.component';
import { PhaseFormData, PhaseModalResult } from '../../models/phase-form.interface';
import { GroupFormData, GroupModalResult } from '../../models/group-form.interface';
import { DeletionErrorHandlerHook } from '../../../../shared/hooks/deletion-error-handler.hook';
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
export class PhasesGroupsManagementComponent implements OnInit, OnChanges, OnDestroy {
  @Input() tournamentId!: number;
  @Input() categoryId!: number;
  @Input() phases: Phase[] = [];
  @Output() phasesUpdated = new EventEmitter<any>();

  // Control de expansión de grupos
  expandedGroupIndex: number = -1;

  // Loading states
  isLoadingPhases = false;
  deletingPhaseId: number | null = null; // ID de la fase que se está eliminando

  private destroy$ = new Subject<void>();

  constructor(
    private phaseService: PhaseService,
    private teamService: TeamService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private errorHandler: DeletionErrorHandlerHook
  ) {}

  ngOnInit(): void {
    // Ya no carga fases automáticamente, las recibe como input
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['phases'] && changes['phases'].currentValue) {
      console.log('🔄 Phases input changed:', changes['phases'].currentValue.length, 'fases');
      // Forzar detección de cambios agresiva cuando las fases cambian
      this.forceChangeDetection();
    }
  }

  /**
   * Fuerza la detección de cambios de manera suave
   */
  private forceChangeDetection(): void {
    // Detección de cambios suave para evitar reinicios
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    
    // Un solo ciclo adicional
    setTimeout(() => {
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }, 0);
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
        categoryId: this.categoryId
      } as PhaseFormData
    });

    dialogRef.afterClosed().subscribe((result: PhaseModalResult) => {
      console.log('📝 Modal de fase cerrado con resultado:', result);
      if (result && result.action === 'create') {
        console.log('✨ Fase creada exitosamente, iniciando actualización');
        
        // Mostrar mensaje de éxito inmediatamente
        console.log('🎉 Mostrando mensaje de éxito y refrescando datos');
        
        // Refrescar datos
        this.refreshPhases();
      } else {
        console.log('❌ Modal cerrado sin crear fase o con error');
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
        categoryId: this.categoryId
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
        // Activar loading para esta fase específica
        this.deletingPhaseId = phase.id;
        this.cdr.detectChanges();

        console.log('🗑️ Eliminando fase:', phase.name, 'ID:', phase.id);

        this.phaseService.deletePhase(phase.id).subscribe({
          next: (response: any) => {
            const config = this.errorHandler.createConfig('Fase', {
              'EGOL_113': 'No se puede eliminar la fase porque tiene equipos asignados.',
              'EGOL_114': 'No se puede eliminar la fase porque tiene grupos con equipos.',
              'EGOL_115': 'No se puede eliminar la fase porque tiene partidos programados.'
            });

            // Desactivar loading
            this.deletingPhaseId = null;
            this.cdr.detectChanges();

            if (this.errorHandler.handleResponse(response, config)) {
              this.refreshPhases();
            }
          },
          error: (error) => {
            // Desactivar loading en caso de error
            this.deletingPhaseId = null;
            this.cdr.detectChanges();

            const config = this.errorHandler.createConfig('Fase');
            this.errorHandler.handleResponseError(error, config);
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
    const phaseGroups = this.getPhaseGroups(phase);
    const group = phaseGroups.find((g: Group) => g.id === groupId);

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
          next: (response: any) => {
            const config = this.errorHandler.createConfig('Grupo', {
              'EGOL_112': 'No se puede eliminar el grupo porque tiene partidos programados.'
            });

            if (this.errorHandler.handleResponse(response, config)) {
              this.refreshPhases();
            }
          },
          error: (error) => {
            console.error('Error deleting group:', error);
            const config = this.errorHandler.createConfig('Grupo');
            this.errorHandler.handleResponseError(error, config);
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
    if (this.getPhaseGroups(phase).length == 0) {
        Swal.fire({
            title: '¡Atención!',
            text: `Debes agregar al menos un grupo para esta fase`,
            icon: 'warning',
            timer: 3000,
            showConfirmButton: false
        });
        return;
    }

    this.teamService.assignRandomTeams(phase.id).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Equipos asignados!',
              text: `Equipos asignados aleatoriamente`,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.refreshPhases();
          },
          error: (error) => {
            const config = this.errorHandler.createConfig('Fase');
            this.errorHandler.handleResponseError(error, config);
          }
        });
  }


  /**
   * Remueve un equipo de una fase (para fases de eliminatorias)
   */
  removeTeamFromPhase(team: any, phase: Phase): void {
      Swal.fire({
      title: '¿Quitar equipo de la fase?',
      html: `¿Estás seguro de que deseas quitar al equipo <strong>"${team.name}"</strong> de la fase <strong>"${phase.name}"</strong>?<br><br>El equipo volverá a estar disponible para asignación.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.teamService.deleteTeam(team.phaseTeamId).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Equipo removido!',
              text: `El equipo "${team.name}" ha sido removido de la fase exitosamente`,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.refreshPhases();
          },
        error: (error) => {
            const config = this.errorHandler.createConfig('Equipo');
            this.errorHandler.handleResponseError(error, config);
          }
        });
      }
    });
  }

  /**
   * Carga las fases del torneo
   */
  loadPhases(): void {
    this.isLoadingPhases = true;
    this.cdr.detectChanges();

    // this.phaseService.getPhasesByTournament(this.tournamentId).subscribe({
    //   next: (phases) => {
    //     this.phases = phases;
    //     this.phasesUpdated.emit(phases);
    //     this.isLoadingPhases = false;
    //     this.cdr.detectChanges();
    //   },
    //   error: (error) => {
    //     console.error('Error loading phases:', error);
    //     this.isLoadingPhases = false;
    //     this.cdr.detectChanges();
    //   }
    // });
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
      const phaseGroups = this.getPhaseGroups(phase);
      if (!phaseGroups || phaseGroups.length === 0) {
        return true;
      }
      return !phaseGroups.some((group: Group) => group.teams && group.teams.length > 0);
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

  /**
   * Obtiene los grupos de una fase de manera compatible
   * @param phase Fase de la cual obtener los grupos
   */
  private getPhaseGroups(phase?: Phase): Group[] {
    if (!phase) return [];
    // Priorizar 'groups' sobre 'grups' para compatibilidad
    return phase.groups || phase.grups || [];
  }

  /**
   * Obtiene los grupos de una fase (para uso en templates)
   * @param phase Fase de la cual obtener los grupos
   */
  getGroupsForPhase(phase: Phase): Group[] {
    return this.getPhaseGroups(phase);
  }

  /**
   * Verifica si un equipo puede ser descalificado
   * @param team Equipo a verificar
   * @returns true si puede ser descalificado
   */
  canDisqualifyTeam(team: Team): boolean {
    return team.status === TeamStatus.Active;
  }

  /**
   * Descalifica un equipo con confirmación
   * @param team Equipo a descalificar
   * @param group Grupo del equipo (opcional)
   */
  disqualifyTeam(team: Team, group?: Group): void {
    Swal.fire({
      title: '¿Descalificar equipo?',
      html: `¿Estás seguro de que deseas descalificar al equipo <strong>"${team.name}"</strong>?<br><br>Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, descalificar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.teamService.disqualifyTeam(team.id).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Equipo descalificado!',
              text: `El equipo "${team.name}" ha sido descalificado exitosamente`,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.refreshPhases();
          },
          error: (error: any) => {
            Swal.fire({
              title: 'Error',
              text: error.message || 'No se pudo descalificar el equipo',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }

  /**
   * Verifica si un equipo puede ser reactivado
   * @param team Equipo a verificar
   * @returns true si puede ser reactivado
   */
  canReactivateTeam(team: Team): boolean {
    return team.status === TeamStatus.Disqualified;
  }

  /**
   * Reactiva un equipo descalificado con confirmación
   * @param team Equipo a reactivar
   * @param group Grupo del equipo (opcional)
   */
  reactivateTeam(team: Team, group?: Group): void {
    Swal.fire({
      title: '¿Volver a validar el equipo?',
      html: `¿Estás seguro de que deseas reactivar al equipo <strong>"${team.name}"</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4caf50',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.teamService.qualifyTeam(team.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Recargar datos para reflejar el cambio
              this.refreshPhases();

              Swal.fire({
                title: '¡Equipo reactivado!',
                text: `El equipo "${team.name}" ha sido reactivado exitosamente`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
            },
            error: (error) => {
              console.error('Error al reactivar equipo:', error);
              Swal.fire({
                title: 'Error',
                text: 'No se pudo reactivar el equipo',
                icon: 'error',
                confirmButtonColor: '#dc3545'
              });
            }
          });
      }
    });
  }

  /**
   * Quita un equipo del grupo con confirmación
   * @param team Equipo a quitar
   * @param group Grupo del equipo
   */
  removeTeamFromGroup(team: Team, group: Group): void {
    Swal.fire({
      title: '¿Quitar equipo del grupo?',
      html: `¿Estás seguro de que deseas quitar al equipo <strong>"${team.name}"</strong> del grupo <strong>"${group.name}"</strong>?<br><br>El equipo volverá a estar disponible para asignación.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.teamService.deleteTeam(team.phaseTeamId).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Equipo removido!',
              text: `El equipo "${team.name}" ha sido removido del grupo exitosamente`,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.refreshPhases();
          },
           error: (error) => {
            const config = this.errorHandler.createConfig('Equipo');
            this.errorHandler.handleResponseError(error, config);
          }
        });
      }
    });
  }

  /**
   * Refresca la lista de fases y notifica al componente padre
   */
  private refreshPhases(): void {
    console.log('🔄 refreshPhases() llamado - solicitando recarga SOLO de esta categoría:', this.categoryId);
    
    // Emitir evento específico con información detallada
    const updateEvent = {
      categoryId: this.categoryId,
      action: 'refresh',
      timestamp: new Date().toISOString(),
      source: 'phases-groups-management'
    };
    
    console.log('📤 Emitiendo evento de actualización:', updateEvent);
    this.phasesUpdated.emit(updateEvent);
  }

  /**
   * Obtiene la clase CSS para el badge de estado del equipo
   * @param status Estado del equipo
   * @returns Clase CSS correspondiente
   */
  getTeamStatusClass(status: TeamStatus | number | undefined): string {
    const teamStatus = status as TeamStatus;
    switch (teamStatus) {
      case TeamStatus.Active:
        return 'status-badge status-active';
      case TeamStatus.Disqualified:
        return 'status-badge status-reactivate'; // Verde para indicar que puede ser reactivado
      case TeamStatus.Deleted:
        return 'status-badge status-deleted';
      default:
        return 'status-badge status-active';
    }
  }

  /**
   * Obtiene el texto del estado del equipo
   * @param status Estado del equipo
   * @returns Texto del estado
   */
  getTeamStatusText(status: TeamStatus | number | undefined): string {
    const teamStatus = status as TeamStatus;
    switch (teamStatus) {
      case TeamStatus.Active:
        return 'Activo';
      case TeamStatus.Disqualified:
        return 'Descalificado';
      case TeamStatus.Deleted:
        return 'Eliminado';
      default:
        return 'Activo';
    }
  }

  /**
   * Obtiene el ícono del estado del equipo
   * @param status Estado del equipo
   * @returns Ícono del estado
   */
  getTeamStatusIcon(status: TeamStatus | number | undefined): string {
    const teamStatus = status as TeamStatus;
    switch (teamStatus) {
      case TeamStatus.Active:
        return 'check_circle';
      case TeamStatus.Disqualified:
        return 'verified'; // Ícono de validación para equipos descalificados
      case TeamStatus.Deleted:
        return 'delete';
      default:
        return 'check_circle';
    }
  }
}
