import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TournamentService } from '@features/tournaments/services/tournament.service';
import { TournamentDetail, TournamentStatusType, TournamentModality } from '@features/tournaments/models/tournament.interface';
import { Phase, Group, PhaseType } from '@features/tournaments/models/phase.interface';
import { Team, CreateTeamRequest, UpdateTeamRequest } from '@features/tournaments/models/team.interface';
import { Title } from '@angular/platform-browser';
import { TournamentStore } from '@core/store/tournament.store';
import { ToastService } from '@core/services/toast.service';
import { TeamModalService, TeamModalResult } from '../../services/team-modal.service';
import { TeamService } from '../../services/team.service';
import { PhaseService } from '../../services/phase.service';
import Swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { PhaseFormComponent } from '../phase-form/phase-form.component';
import { GroupFormComponent } from '../group-form/group-form.component';
import { PhasesGroupsManagementComponent } from '../phases-groups-management/phases-groups-management.component';
import { TeamsManagementComponent } from '../teams-management/teams-management.component';
import { MatchesManagementComponent } from '../matches-management/matches-management.component';
import { StatisticsManagementComponent } from '../statistics-management/statistics-management.component';
import { PhaseFormData, PhaseModalResult, CreatePhaseRequest, UpdatePhaseRequest } from '../../models/phase-form.interface';
import { GroupFormData, GroupModalResult, CreateGroupRequest, UpdateGroupRequest } from '../../models/group-form.interface';

@Component({
  selector: 'app-tournament-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatExpansionModule,
    MatTabsModule,
    MatMenuModule,
    MatDialogModule,
    MatSlideToggleModule,
    PhasesGroupsManagementComponent,
    TeamsManagementComponent,
    MatchesManagementComponent,
    StatisticsManagementComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  templateUrl: './tournament-management.component.html',
  styleUrls: ['./tournament-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TournamentManagementComponent implements OnInit, OnDestroy {
  tournament: TournamentDetail | null = null;
  phases: Phase[] = [];
  teams: Team[] = [];
  isLoading = false;
  tournamentId: number = 0;
  selectedTabIndex: number = 0;
  registrationClosed = false; // Control para cerrar registro de equipos

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private tournamentService: TournamentService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private tournamentStore: TournamentStore,
    private teamModalService: TeamModalService,
    private teamService: TeamService,
    private phaseService: PhaseService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.tournamentId = +params['id'];
      if (this.tournamentId) {
        this.loadTournamentData();
      } else {
        this.toastService.showError('ID de torneo inválido');
        this.router.navigate(['/dashboard/tournaments']);
      }
    });
  }

  ngOnDestroy(): void {
    // Limpiar el store al salir del componente
    this.tournamentStore.clearCurrentTournament();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Maneja la actualización de fases desde el componente hijo
   */
  onPhasesUpdated(phases: Phase[]): void {
    this.phases = phases;
    // Cuando se actualizan las fases, también refrescar equipos
    // ya que pueden haber cambios en asignaciones
    this.loadTeams();
    this.cdr.detectChanges();
  }

  /**
   * Maneja la actualización de equipos desde el componente hijo
   */
  onTeamsUpdated(teams: Team[]): void {
    this.teams = teams;
    // Cuando se actualizan los equipos, también refrescar fases
    // para mostrar equipos actualizados en grupos
    this.loadPhases();
    this.cdr.detectChanges();
  }

  /**
   * Carga los datos del torneo y sus fases
   */
  private loadTournamentData(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.tournamentService.getTournamentById(this.tournamentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tournamentData) => {
          this.tournament = tournamentData;
          
          // Actualizar título de la página para el breadcrumb
          this.titleService.setTitle(`${this.tournament.name} - EasyGool`);
          
          // Actualizar el store con la información del torneo
          this.tournamentStore.setCurrentTournament(this.tournamentId, this.tournament.name);

          // Cargar datos reales del backend
          this.loadTeams();
          this.loadPhases();

          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error loading tournament:', error);
          this.isLoading = false;
          this.cdr.detectChanges();
          // El error ya se maneja en el servicio con toast
          // Redirigir a la lista de torneos
          this.router.navigate(['/dashboard/tournaments']);
        }
      });
  }

  /**
   * Navega de vuelta a la lista de torneos
   */
  goBack(): void {
    this.router.navigate(['/dashboard/tournaments']);
  }

  /**
   * Obtiene el ícono apropiado para la modalidad del torneo
   */
  getModalityIcon(modality: TournamentModality): string {
    switch (modality) {
      case TournamentModality.Five:
        return 'sports_handball';
      case TournamentModality.Six:
        return 'sports_soccer';
      case TournamentModality.Seven:
        return 'sports_soccer';
      case TournamentModality.Eight:
        return 'sports';
      case TournamentModality.Nine:
        return 'sports';
      case TournamentModality.Ten:
        return 'stadium';
      case TournamentModality.Eleven:
        return 'stadium';
      default:
        return 'sports_soccer';
    }
  }

  /**
   * Obtiene el texto descriptivo para la modalidad del torneo
   */
  getModalityText(modality: TournamentModality): string {
    switch (modality) {
      case TournamentModality.Five:
        return 'Fútbol 5 (Indoor)';
      case TournamentModality.Six:
        return 'Fútbol 6';
      case TournamentModality.Seven:
        return 'Fútbol 7';
      case TournamentModality.Eight:
        return 'Fútbol 8';
      case TournamentModality.Nine:
        return 'Fútbol 9';
      case TournamentModality.Ten:
        return 'Fútbol 10';
      case TournamentModality.Eleven:
        return 'Fútbol 11';
      default:
        return 'Modalidad desconocida';
    }
  }

  /**
   * Obtiene la clase CSS para el estado del torneo
   */
  getStatusClass(status: TournamentStatusType): string {
    switch (status) {
      case TournamentStatusType.Active:
        return 'status-active';
      case TournamentStatusType.Coming:
        return 'status-coming';
      case TournamentStatusType.Completed:
        return 'status-completed';
      case TournamentStatusType.Deleted:
        return 'status-deleted';
      default:
        return 'status-unknown';
    }
  }

  /**
   * Carga los equipos del torneo desde la API
   */
  private loadTeams(): void {
    this.teamService.getTeamsByTournament(this.tournamentId).subscribe({
      next: (teams) => {
        this.teams = teams;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading teams:', error);
        this.teams = [];
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Carga las fases del torneo desde la API
   */
  private loadPhases(): void {
    this.phaseService.getPhasesByTournament(this.tournamentId).subscribe({
      next: (phases) => {
        this.phases = phases;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading phases:', error);
        this.phases = [];
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Obtiene el texto del estado del torneo
   */
  getStatusText(status: TournamentStatusType): string {
    switch (status) {
      case TournamentStatusType.Active:
        return 'Activo';
      case TournamentStatusType.Coming:
        return 'Próximo';
      case TournamentStatusType.Completed:
        return 'Completado';
      case TournamentStatusType.Deleted:
        return 'Eliminado';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Obtiene el ícono para el estado del torneo
   */
  getStatusIcon(status: TournamentStatusType): string {
    switch (status) {
      case TournamentStatusType.Active:
        return 'check_circle';
      case TournamentStatusType.Coming:
        return 'schedule';
      case TournamentStatusType.Completed:
        return 'emoji_events';
      case TournamentStatusType.Deleted:
        return 'cancel';
      default:
        return 'help_outline';
    }
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
   * Formatea una fecha para mostrar
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Obtiene el rango de fechas del torneo
   */
  getDateRange(): string {
    if (!this.tournament) return '';
    
    const startDate = new Date(this.tournament.startDate).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
    
    if (this.tournament.endDate) {
      const endDate = new Date(this.tournament.endDate).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      });
      return `${startDate} - ${endDate}`;
    }
    
    return `Desde ${startDate}`;
  }

  /**
   * Crea una nueva fase
   */
  createPhase(): void {
    if (!this.tournament) return;

    const dialogData: PhaseFormData = {
      isEdit: false,
      tournamentId: this.tournamentId
    };

    const dialogRef = this.dialog.open(PhaseFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      height: 'auto',
      maxHeight: 'none',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: PhaseModalResult | undefined) => {
      if (result && result.action === 'create') {
        // La creación de fase ya está implementada en PhaseFormComponent
        this.loadTournamentData(); // Recargar datos para mostrar la nueva fase
      }
    });
  }

  /**
   * Edita una fase existente
   */
  editPhase(phase: Phase): void {
    if (!this.tournament) return;

    const dialogData: PhaseFormData = {
      phase: phase,
      isEdit: true,
      tournamentId: this.tournamentId
    };

    const dialogRef = this.dialog.open(PhaseFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      height: 'auto',
      maxHeight: 'none',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: PhaseModalResult | undefined) => {
      if (result && result.action === 'update') {
        // La actualización de fase se implementará cuando esté disponible en la API
        const updateData = result.data as UpdatePhaseRequest;
        this.toastService.showSuccess(`Fase "${updateData.name}" actualizada exitosamente`);
        this.loadTournamentData(); // Recargar datos
      }
    });
  }

  /**
   * Elimina una fase
   */
  deletePhase(phase: Phase): void {
    // TODO: Implementar confirmación y eliminación
    console.log('Eliminar fase:', phase.name);
  }

  /**
   * Crea un nuevo grupo en una fase
   */
  createGroup(phase: Phase): void {
    if (!this.tournament) return;

    const dialogData: GroupFormData = {
      phaseId: phase.id,
      isEdit: false
    };

    const dialogRef = this.dialog.open(GroupFormComponent, {
      width: '500px',
      maxWidth: '90vw',
      height: 'auto',
      maxHeight: 'none',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: GroupModalResult | undefined) => {
      if (result && result.action === 'create') {
        // La creación de grupo ya está implementada en GroupFormComponent
        this.loadTournamentData(); // Recargar datos para mostrar el nuevo grupo
      }
    });
  }

/**
 * Edita un grupo existente
 */
editGroup(group: Group): void {
  if (!this.tournament) return;

  const dialogData: GroupFormData = {
    group: group,
    phaseId: group.phaseId || 0, // Asumiendo que Group tiene phaseId
    isEdit: true
  };

  const dialogRef = this.dialog.open(GroupFormComponent, {
    width: '500px',
    maxWidth: '90vw',
    height: 'auto',
    maxHeight: 'none',
    data: dialogData,
    disableClose: true
  });

  dialogRef.afterClosed().subscribe((result: GroupModalResult | undefined) => {
    if (result && result.action === 'update') {
      // La actualización de grupo se implementará cuando esté disponible en la API
      const updateData = result.data as UpdateGroupRequest;
      this.toastService.showSuccess(`Grupo "${updateData.name}" actualizado exitosamente`);
      this.loadTournamentData(); // Recargar datos
    }
  });
}

/**
 * Elimina un grupo
 */
deleteGroup(group: Group): void {
  // TODO: Implementar confirmación y eliminación
  console.log('Eliminar grupo:', group.name);
}

// Team management methods
createTeam(): void {
  const tournament = this.tournament;
  if (!tournament) return;

  this.teamModalService.openCreateTeamModal(tournament.id)
    .subscribe((result: TeamModalResult | undefined) => {
      if (result && result.action === 'create') {
        this.teamService.createTeam(result.data as CreateTeamRequest).subscribe({
          next: (createdTeam) => {
            this.toastService.showSuccess(`Equipo "${createdTeam.name}" creado exitosamente`);
            this.loadTournamentData();
          },
          error: (error: any) => {
            this.toastService.showError(`Error al crear equipo: ${error.message}`);
          }
        });
      }
    });
}

editTeam(team: Team): void {
  const tournament = this.tournament;
  if (!tournament) return;

  this.teamModalService.openEditTeamModal(team, tournament.id)
    .subscribe((result: TeamModalResult | undefined) => {
      if (result && result.action === 'update') {
        this.teamService.updateTeam(result.data as UpdateTeamRequest).subscribe({
          next: (updatedTeam) => {
            this.toastService.showSuccess(`Equipo "${updatedTeam.name}" actualizado exitosamente`);
            this.loadTournamentData();
          },
          error: (error: any) => {
            this.toastService.showError(`Error al actualizar equipo: ${error.message}`);
          }
        });
      }
    });
}

deleteTeam(team: Team): void {
  Swal.fire({
    title: 'Eliminar Equipo',
    html: `¿Estás seguro de que deseas eliminar el equipo <strong>${team.name}</strong>?<br><br>Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      this.teamService.deleteTeam(team.id).subscribe({
        next: () => {
          this.toastService.showSuccess(`Equipo "${team.name}" eliminado exitosamente`);
          // Recargar datos del torneo para actualizar la lista de equipos
          this.loadTournamentData();

          // Mostrar mensaje de éxito adicional
          Swal.fire({
            title: '¡Eliminado!',
            text: 'El equipo ha sido eliminado correctamente.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          this.toastService.showError(`Error al eliminar equipo: ${error.message}`);
          
          // Mostrar mensaje de error
          Swal.fire({
            title: 'Error',
            text: 'No se pudo eliminar el equipo. Inténtalo de nuevo.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    }
  });
}

/**
 * Agregar equipo a un grupo
 */
addTeamToGroup(phaseId: number, groupId: number): void {
  const tournament = this.tournament;
  if (!tournament) return;

  this.teamModalService.openCreateTeamModal(tournament.id)
    .subscribe((result: TeamModalResult | undefined) => {
      if (result && result.action === 'create') {
        this.teamService.createTeam(result.data as CreateTeamRequest).subscribe({
          next: (createdTeam) => {
            this.toastService.showSuccess(`Equipo "${createdTeam.name}" creado exitosamente`);
            // Asignar el equipo al grupo
            this.teamService.assignTeamsToGroup(0, [createdTeam.id], groupId).subscribe({
              next: () => {
                this.toastService.showSuccess(`Equipo asignado al grupo exitosamente`);
                this.loadTournamentData();
              },
              error: (error: any) => {
                this.toastService.showError(`Error al asignar equipo al grupo: ${error.message}`);
              }
            });
          },
          error: (error: any) => {
            this.toastService.showError(`Error al crear equipo: ${error.message}`);
          }
        });
      }
    });
}

/**
 * Quitar equipo de un grupo
 */
removeTeamFromGroup(team: Team, group: Group): void {
  Swal.fire({
    title: 'Quitar Equipo del Grupo',
    html: `¿Estás seguro de que deseas quitar el equipo <strong>${team.name}</strong> del grupo <strong>${group.name}</strong>?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#ff9800',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Quitar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      this.teamService.removeTeamFromGroup(team.id).subscribe({
        next: () => {
          this.toastService.showSuccess(`Equipo "${team.name}" removido del grupo exitosamente`);
          this.loadTournamentData();

          // Mostrar mensaje de éxito
          Swal.fire({
            title: '¡Removido!',
            text: 'El equipo ha sido removido del grupo correctamente.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          this.toastService.showError(`Error al remover equipo del grupo: ${error.message}`);
          
          // Mostrar mensaje de error
          Swal.fire({
            title: 'Error',
            text: 'No se pudo remover el equipo del grupo. Inténtalo de nuevo.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    }
  });
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
  return team.tournamentId || index;
}

  /**
   * Maneja eventos desde el componente de partidos
   */
  onMatchesUpdated(matches: any[]): void {
    // TODO: Implementar lógica de actualización de partidos
    console.log('Matches updated:', matches);
    this.cdr.detectChanges();
  }

  /**
   * Maneja eventos desde el componente de estadísticas
   */
  onStatisticsUpdated(statistics: any): void {
    console.log('Statistics updated');
    this.cdr.detectChanges();
  }

  /**
   * Copia el enlace de registro del torneo al portapapeles
   */
  copyRegistrationLink(): void {
    if (this.tournament?.tournamentLink) {
      navigator.clipboard.writeText(this.tournament.tournamentLink).then(() => {
        this.toastService.showSuccess('Enlace copiado al portapapeles');
      }).catch(() => {
        this.toastService.showError('Error al copiar el enlace');
      });
    }
  }

  /**
   * Maneja el cambio del switch de registro de equipos
   * @param event Evento del slide toggle
   */
  onRegistrationToggleChange(event: any): void {
    this.registrationClosed = event.checked;
    const status = this.registrationClosed ? 'cerrado' : 'abierto';
    this.toastService.showInfo(`Registro de equipos ${status}`);
    this.cdr.detectChanges();
  }

  /**
   * Maneja el cambio de tab y refresca los datos correspondientes
   * @param event Evento del cambio de tab
   */
  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;
    
    // Siempre refrescar tanto equipos como fases en todos los tabs
    // para asegurar que los datos estén sincronizados
    this.loadTeams();
    this.loadPhases();
    
    this.cdr.detectChanges();
  }

}
