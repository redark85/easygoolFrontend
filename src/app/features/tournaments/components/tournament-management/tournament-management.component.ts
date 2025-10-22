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
import { Category } from '@features/tournaments/models/category.interface';
import { Title } from '@angular/platform-browser';
import { TournamentStore } from '@core/store/tournament.store';
import { ToastService } from '@core/services/toast.service';
import { TeamModalService, TeamModalResult } from '../../services/team-modal.service';
import { TeamService } from '../../services/team.service';
import { PhaseService } from '../../services/phase.service';
import Swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { DeletionErrorHandlerHook } from '../../../../shared/hooks/deletion-error-handler.hook';
import { PhaseFormComponent } from '../phase-form/phase-form.component';
import { GroupFormComponent } from '../group-form/group-form.component';
import { TeamsManagementComponent } from '../teams-management/teams-management.component';
import { MatchesManagementComponent } from '../matches-management/matches-management.component';
import { StatisticsManagementComponent } from '../statistics-management/statistics-management.component';
import { CategoriesManagementComponent } from '../categories-management/categories-management.component';
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
    TeamsManagementComponent,
    MatchesManagementComponent,
    CategoriesManagementComponent
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
  categories: Category[] = [];
  isLoading = false;
  tournamentId: number = 0;
  selectedTabIndex: number = 0;
  registrationClosed = false; // Control para cerrar registro de equipos
  isUpdatingRegistration = false; // Estado de carga para el switch
  hasCategories = false; // Control para mostrar/ocultar tabs de Equipos y Partidos

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
    private dialog: MatDialog,
    private deletionErrorHandler: DeletionErrorHandlerHook
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.tournamentId = +params['id'];
      if (this.tournamentId) {
        this.loadTournamentData();
      } else {
        this.toastService.showError('ID de torneo inválido');
        this.router.navigate(['/tournaments']);
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
   * Maneja la actualización de equipos desde el componente hijo
   */
  onTeamsUpdated(teams: Team[]): void {
    this.teams = teams;
    // Las categorías se actualizan automáticamente desde el componente hijo
    this.cdr.detectChanges();
  }

  /**
   * Maneja la actualización de categorías desde el componente hijo
   */
  onCategoriesUpdated(categories: Category[]): void {
    this.categories = categories;
    
    // Validar si existen categorías para mostrar/ocultar tabs
    this.hasCategories = categories && categories.length > 0;
    
    console.log('📊 Categorías actualizadas:', {
      count: categories.length,
      hasCategories: this.hasCategories,
      showTeamsTab: this.hasCategories,
      showMatchesTab: this.hasCategories
    });
    
    // Resetear el índice del tab si es necesario
    this.resetTabIndexIfNeeded();
    
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

          // Cargar el estado inicial del switch de registro
          // LÓGICA CORREGIDA:
          // allowTeamRegistration: false -> switch debe estar en false (registro cerrado)
          // allowTeamRegistration: true -> switch debe estar en true (registro abierto)
          this.registrationClosed = !this.tournament.allowTeamRegistration;

          console.log('Tournament loaded:', {
            allowTeamRegistration: this.tournament.allowTeamRegistration,
            registrationClosed: this.registrationClosed,
            'Switch debe mostrar': this.registrationClosed ? 'CERRADO' : 'ABIERTO'
          });

          // Las categorías (con sus fases) se cargan automáticamente en el componente hijo
          // Los equipos se cargan automáticamente en el componente hijo

          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error loading tournament:', error);
          this.isLoading = false;
          this.cdr.detectChanges();
          // El error ya se maneja en el servicio con toast
          // Redirigir a la lista de torneos
          this.router.navigate(['/tournaments']);
        }
      });
  }

  /**
   * Navega de vuelta a la lista de torneos
   */
  goBack(): void {
    this.router.navigate(['/tournaments']);
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
    // Las fases ahora se crean desde las categorías, no directamente desde el torneo
    this.toastService.showInfo('Las fases se crean desde la gestión de categorías');
  }

  /**
   * Edita una fase existente
   */
  editPhase(phase: Phase): void {
    // Las fases ahora se editan desde las categorías, no directamente desde el torneo
    this.toastService.showInfo('Las fases se editan desde la gestión de categorías');
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
        next: (response: any) => {
          const config = this.deletionErrorHandler.createConfig('Equipo', {
            'EGOL_113': 'No se puede eliminar el equipo porque pertenece a una fase activa.',
            'EGOL_114': 'No se puede eliminar el equipo porque tiene partidos programados.',
            'EGOL_115': 'No se puede eliminar el equipo porque el torneo ya comenzó.'
          });

          if (this.deletionErrorHandler.handleResponse(response, config)) {
            this.loadTournamentData();
          }
        },
        error: (error) => {
          console.error('Error deleting team:', error);
          const config = this.deletionErrorHandler.createConfig('Equipo');
          this.deletionErrorHandler.handleResponseError(error, config);
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
        next: (response: any) => {
          const config = this.deletionErrorHandler.createConfig('Equipo del grupo', {
            'EGOL_116': 'No se puede remover el equipo porque tiene partidos programados en este grupo.',
            'EGOL_117': 'No se puede remover el equipo porque la fase ya comenzó.',
            'EGOL_118': 'No se puede remover el equipo porque es el único en el grupo.'
          });

          if (this.deletionErrorHandler.handleResponse(response, config)) {
            this.loadTournamentData();
          }
        },
        error: (error) => {
          console.error('Error removing team from group:', error);
          const config = this.deletionErrorHandler.createConfig('Equipo del grupo');
          this.deletionErrorHandler.handleResponseError(error, config);
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
    if (!this.tournament || this.isUpdatingRegistration) {
      // Si está en loading, prevenir cualquier cambio
      event.source.checked = !event.source.checked;
      return;
    }

    // Guardar el estado original antes del cambio
    const originalState = !this.registrationClosed;
    
    // Prevenir el cambio automático del switch
    event.source.checked = originalState;

    // El evento de mat-slide-toggle tiene la estructura: { source: MatSlideToggle, checked: boolean }
    const isChecked = event?.checked !== undefined ? event.checked : event?.source?.checked;

    // LÓGICA CORREGIDA: El switch ahora representa "registro abierto"
    // - Si checked = true -> registro abierto -> allow = true
    // - Si checked = false -> registro cerrado -> allow = false
    const allowRegistration = isChecked;

    // Determinar el mensaje según la acción
    const title = allowRegistration ? 'Habilitar registro de equipos' : 'Deshabilitar registro de equipos';
    const message = allowRegistration 
      ? '¿Estás seguro de permitir el registro de equipos de cualquier usuario dentro de la aplicación para este torneo?'
      : '¿Estás seguro de impedir el registro de equipos para este torneo?';

    // Mostrar confirmación con SweetAlert2
    Swal.fire({
      title: title,
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1976d2',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Usuario confirmó, cambiar el switch y proceder con la API
        event.source.checked = !originalState;
        this.cdr.detectChanges();
        this.updateRegistrationStatus(allowRegistration);
      } else {
        // Usuario canceló, asegurar que el switch esté en su estado original
        event.source.checked = originalState;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Actualiza el estado de registro del torneo
   * @param allowRegistration Estado del registro a establecer
   */
  private updateRegistrationStatus(allowRegistration: boolean): void {
    console.log('Starting updateRegistrationStatus:', {
      allowRegistration,
      currentState: this.registrationClosed,
      isUpdating: this.isUpdatingRegistration
    });

    this.isUpdatingRegistration = true;
    this.cdr.detectChanges();

    this.tournamentService.allowRegisterTeam(this.tournamentId, allowRegistration)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('API Response received:', response);
          console.log('Setting isUpdatingRegistration to false');
          
          // CRÍTICO: Terminar el loading INMEDIATAMENTE
          this.isUpdatingRegistration = false;
          
          if (response.succeed) {
            // Actualizar el estado local y del torneo
            this.registrationClosed = !allowRegistration;
            if (this.tournament) {
              this.tournament.allowTeamRegistration = allowRegistration;
            }
            
            console.log('Updated states:', {
              registrationClosed: this.registrationClosed,
              allowTeamRegistration: this.tournament?.allowTeamRegistration,
              isUpdating: this.isUpdatingRegistration
            });
            
            // Forzar detección de cambios INMEDIATAMENTE
            this.cdr.detectChanges();
            
            // Forzar una segunda detección después de un tick
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 0);
            
            // Mostrar mensaje de éxito después de un pequeño delay
            setTimeout(() => {
              const statusText = allowRegistration ? 'abierto' : 'cerrado';
              this.toastService.showSuccess(`Registro de equipos ${statusText} exitosamente`);
            }, 300);
          } else {
            console.log('API response failed, reverting switch');
            // Revertir el switch si la API falló
            this.registrationClosed = allowRegistration;
            this.cdr.detectChanges();
            this.toastService.showError('Error al cambiar el estado del registro');
          }
        },
        error: (error) => {
          console.error('Error updating registration status:', error);
          console.log('Setting isUpdatingRegistration to false due to error');
          
          // CRÍTICO: Terminar el loading INMEDIATAMENTE
          this.isUpdatingRegistration = false;
          
          // Revertir el switch en caso de error
          this.registrationClosed = allowRegistration;
          
          console.log('Error - Updated states:', {
            registrationClosed: this.registrationClosed,
            isUpdating: this.isUpdatingRegistration
          });
          
          // Forzar detección de cambios INMEDIATAMENTE
          this.cdr.detectChanges();
          
          // Forzar una segunda detección después de un tick
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 0);
          
          // Mostrar error después de un pequeño delay
          setTimeout(() => {
            this.toastService.showError('Error al cambiar el estado del registro');
          }, 300);
        }
      });
  }

  /**
   * Método para debug - verificar estado del loading
   */
  debugLoadingState(): void {
    console.log('DEBUG - Current loading state:', {
      isUpdatingRegistration: this.isUpdatingRegistration,
      registrationClosed: this.registrationClosed,
      tournament: this.tournament,
      allowTeamRegistration: this.tournament?.allowTeamRegistration
    });
  }

  /**
   * Maneja el cambio de tab y refresca los datos correspondientes
   * @param event Evento del cambio de tab
   */
  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;

    // Ajustar índices según la visibilidad de tabs
    if (this.hasCategories) {
      // Si hay categorías, los tabs son: 0=Categorías, 1=Equipos, 2=Partidos
      switch (this.selectedTabIndex) {
        case 0:
          // Tab Categorías - se carga automáticamente en el componente hijo
          break;
        case 1:
          // Tab Equipos - se carga automáticamente en el componente hijo
          this.loadTeams();
          break;
        case 2:
          // Tab Partidos - se carga automáticamente en el componente hijo
          break;
        default:
          break;
      }
    } else {
      // Si no hay categorías, solo está el tab: 0=Categorías
      switch (this.selectedTabIndex) {
        case 0:
          // Tab Categorías - se carga automáticamente en el componente hijo
          break;
        default:
          break;
      }
    }

    this.cdr.detectChanges();
  }

  /**
   * Resetea el índice del tab seleccionado cuando cambia la visibilidad de tabs
   */
  private resetTabIndexIfNeeded(): void {
    // Si estamos en un tab que ya no existe (Equipos o Partidos cuando no hay categorías)
    if (!this.hasCategories && this.selectedTabIndex > 0) {
      console.log('🔄 Reseteando tab index a 0 porque no hay categorías');
      this.selectedTabIndex = 0;
      this.cdr.detectChanges();
    }
  }

}
