import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil, switchMap, filter } from 'rxjs';
import { TournamentService } from '@features/tournaments/services/tournament.service';
import { TournamentDetail, TournamentStatusType, TournamentModality } from '@features/tournaments/models/tournament.interface';
import { Phase, Group, PhaseType } from '@features/tournaments/models/phase.interface';
import { Team, CreateTeamRequest, UpdateTeamRequest } from '@features/tournaments/models/team.interface';
import { Title } from '@angular/platform-browser';
import { TournamentStore } from '@core/store/tournament.store';
import { ToastService } from '@core/services/toast.service';
import { TeamModalService, TeamModalResult } from '../../services/team-modal.service';
import { TeamService } from '../../services/team.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { PhaseFormComponent } from '../phase-form/phase-form.component';
import { GroupFormComponent } from '../group-form/group-form.component';
import { PhaseFormData, PhaseModalResult, CreatePhaseRequest, UpdatePhaseRequest } from '../../models/phase-form.interface';
import { GroupFormData, GroupModalResult, CreateGroupRequest, UpdateGroupRequest } from '../../models/group-form.interface';

@Component({
  selector: 'app-tournament-management',
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
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = +params['id'];
        if (id && !isNaN(id)) {
          this.tournamentId = id;
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
          this.tournamentStore.setCurrentTournament(this.tournament.id, this.tournament.name);

          // Initialize mock data
          this.initializeMockTeams();
          this.initializeMockPhases();

          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
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
      tournamentId: this.tournament.id,
      isEdit: false
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
        // TODO: Implementar servicio para crear fase
        const createData = result.data as CreatePhaseRequest;
        this.toastService.showSuccess(`Fase "${createData.name}" creada exitosamente`);
        // this.loadTournamentData(); // Descomentar cuando esté el servicio
        console.log('Crear fase:', createData);
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
      tournamentId: this.tournament.id,
      isEdit: true
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
        // TODO: Implementar servicio para actualizar fase
        const updateData = result.data as UpdatePhaseRequest;
        this.toastService.showSuccess(`Fase "${updateData.name}" actualizada exitosamente`);
        // this.loadTournamentData(); // Descomentar cuando esté el servicio
        console.log('Actualizar fase:', updateData);
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
      tournamentId: this.tournament.id,
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
        // TODO: Implementar servicio para crear grupo
        const createData = result.data as CreateGroupRequest;
        this.toastService.showSuccess(`Grupo "${createData.name}" creado exitosamente en ${phase.name}`);
        // this.loadTournamentData(); // Descomentar cuando esté el servicio
        console.log('Crear grupo:', createData, 'en fase:', phase.name);
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
    tournamentId: this.tournament.id,
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
      // TODO: Implementar servicio para actualizar grupo
      const updateData = result.data as UpdateGroupRequest;
      this.toastService.showSuccess(`Grupo "${updateData.name}" actualizado exitosamente`);
      // this.loadTournamentData(); // Descomentar cuando esté el servicio
      console.log('Actualizar grupo:', updateData);
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
          error: (error) => {
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
          error: (error) => {
            this.toastService.showError(`Error al actualizar equipo: ${error.message}`);
          }
        });
      }
    });
}

deleteTeam(team: Team): void {
  const dialogData: ConfirmationDialogData = {
    title: 'Eliminar Equipo',
    message: `¿Estás seguro de que deseas eliminar el equipo <strong>${team.name}</strong>?<br><br>Esta acción no se puede deshacer.`,
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    type: 'danger',
    icon: 'delete_forever'
  };

  const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
    width: '480px',
    maxWidth: '90vw',
    data: dialogData,
    disableClose: true
  });

  dialogRef.afterClosed().subscribe((confirmed: boolean) => {
    if (confirmed) {
      this.teamService.deleteTeam(team.id).subscribe({
        next: () => {
          this.toastService.showSuccess(`Equipo "${team.name}" eliminado exitosamente`);
          // TODO: Actualizar la lista de equipos
          this.loadTournamentData();
        },
        error: (error) => {
          this.toastService.showError(`Error al eliminar equipo: ${error.message}`);
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
            this.teamService.assignTeamToGroup(createdTeam.id, groupId).subscribe({
              next: () => {
                this.toastService.showSuccess(`Equipo asignado al grupo exitosamente`);
                this.loadTournamentData();
              },
              error: (error) => {
                this.toastService.showError(`Error al asignar equipo al grupo: ${error.message}`);
              }
            });
          },
          error: (error) => {
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
  const dialogData: ConfirmationDialogData = {
    title: 'Quitar Equipo del Grupo',
    message: `¿Estás seguro de que deseas quitar el equipo <strong>${team.name}</strong> del grupo <strong>${group.name}</strong>?`,
    confirmText: 'Quitar',
    cancelText: 'Cancelar',
    type: 'warning',
    icon: 'remove_circle'
  };

  const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
    width: '480px',
    maxWidth: '90vw',
    data: dialogData,
    disableClose: true
  });

  dialogRef.afterClosed().subscribe((confirmed: boolean) => {
    if (confirmed) {
      this.teamService.removeTeamFromGroup(team.id).subscribe({
        next: () => {
          this.toastService.showSuccess(`Equipo "${team.name}" removido del grupo exitosamente`);
          this.loadTournamentData();
        },
        error: (error) => {
          this.toastService.showError(`Error al remover equipo del grupo: ${error.message}`);
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

// Initialize mock teams data
private initializeMockTeams(): void {
  this.teams = [
    {
      id: 1,
      tournamentId: this.tournamentId,
      name: 'Real Madrid FC',
      shortName: 'RMA',
      logoBase64: '',
      logoContentType: 'image/png'
    },
    {
      id: 2,
      tournamentId: this.tournamentId,
      name: 'FC Barcelona',
      shortName: 'BAR',
      logoBase64: '',
      logoContentType: 'image/png'
    },
    {
      id: 3,
      tournamentId: this.tournamentId,
      name: 'Atlético Madrid',
      shortName: 'ATM',
      logoBase64: '',
      logoContentType: 'image/png'
    },
    {
      id: 4,
      tournamentId: this.tournamentId,
      name: 'Valencia CF',
      shortName: 'VAL',
      logoBase64: '',
      logoContentType: 'image/png'
    }
  ];
}

// Initialize mock phases data
private initializeMockPhases(): void {
  this.phases = [
    {
      id: 1,
      name: 'Fase de Grupos',
      phaseType: PhaseType.GroupStage,
      groups: [
        {
          id: 1,
          name: 'Grupo A',
          phaseId: 1,
          teams: this.teams.slice(0, 2)
        },
        {
          id: 2,
          name: 'Grupo B',
          phaseId: 1,
          teams: this.teams.slice(2, 4)
        }
      ]
    },
    {
      id: 2,
      name: 'Eliminatorias',
      phaseType: PhaseType.Knockout,
      groups: [
        {
          id: 3,
          name: 'Cuartos de Final',
          phaseId: 2,
          teams: []
        }
      ]
    }
  ];
}
}
