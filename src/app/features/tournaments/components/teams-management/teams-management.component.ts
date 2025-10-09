import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Team, TeamStatus } from '../../models/team.interface';
import { TeamService } from '../../services/team.service';
import { PlayerService } from '../../services/player.service';
import { TeamFormComponent } from '../team-form/team-form.component';
import { PlayerFormComponent } from '../player-form/player-form.component';
import { DeletionErrorHandlerHook } from '../../../../shared/hooks/deletion-error-handler.hook';
import { Player, PlayerFormData, PlayerModalResult } from '../../../../core/models/player.interface';
import Swal from 'sweetalert2';

export interface TeamFormData {
  mode: 'create' | 'edit';
  team?: Team;
  tournamentId: number;
}

export interface TeamModalResult {
  success: boolean;
  team?: Team;
}

@Component({
  selector: 'app-teams-management',
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
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatExpansionModule
  ],
  templateUrl: './teams-management.component.html',
  styleUrls: ['./teams-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamsManagementComponent implements OnInit, OnDestroy {
  @Input() tournamentId!: number;
  @Input() teams: Team[] = [];
  @Output() teamsUpdated = new EventEmitter<Team[]>();

  searchTerm = '';
  filteredTeams: Team[] = [];
  private destroy$ = new Subject<void>();
  private updatingTeamRegistration = new Set<number>(); // Track loading state per team

  constructor(
    private teamService: TeamService,
    private playerService: PlayerService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private deletionErrorHandler: DeletionErrorHandlerHook
  ) {}

  ngOnInit(): void {
    this.loadTeams();
  }

  /**
   * Abre el modal para editar un jugador existente
   */
  editPlayer(player: Player, team: Team): void {
    const dialogRef = this.dialog.open(PlayerFormComponent, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        mode: 'edit',
        player,
        tournamentTeamId: team.id,
        teamName: team.name
      } as PlayerFormData
    });

    dialogRef.afterClosed().subscribe((result: PlayerModalResult) => {
      if (result && result.success && result.player) {
        // Actualiza el jugador en la lista del equipo si existe localmente
        const players = (team as any).players as Player[] | undefined;
        if (players) {
          const idx = players.findIndex(p => p.id === result.player!.id);
          if (idx !== -1) {
            players[idx] = result.player!;
          }
        }
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Elimina un jugador del equipo
   */
  deletePlayer(player: Player, team: Team): void {
    this.playerService.deletePlayer(player.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        const players = (team as any).players as Player[] | undefined;
        if (players) {
          const idx = players.findIndex(p => p.id === player.id);
          if (idx !== -1) {
            players.splice(idx, 1);
            // Actualizar contador si está presente
            if (typeof team.totalPlayers === 'number' && team.totalPlayers > 0) {
              team.totalPlayers = team.totalPlayers - 1;
            }
          }
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error deleting player:', error);
      }
    });
  }

  /**
   * Retorna el nombre completo del jugador
   */
  getPlayerFullName(player: Player): string {
    const names = [player.name, player.secondName].filter(n => n?.trim()).join(' ');
    const lasts = [player.lastName, player.secondLastName].filter(n => n?.trim()).join(' ');
    return `${names} ${lasts}`.trim();
  }

  /**
   * Carga los equipos desde el backend
   */
  private loadTeams(): void {
    if (!this.tournamentId) {
      console.warn('Tournament ID is required to load teams');
      return;
    }

    this.teamService.getTeamsByTournament(this.tournamentId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (teams) => {
        this.teams = teams;
        this.updateFilteredTeams();
        this.teamsUpdated.emit(teams);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading teams:', error);
        this.teams = [];
        this.updateFilteredTeams();
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Actualiza la lista filtrada de equipos basada en el término de búsqueda
   */
  updateFilteredTeams(): void {
    if (!this.searchTerm.trim()) {
      this.filteredTeams = [...this.teams];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredTeams = this.teams.filter(team => 
        team.name.toLowerCase().includes(term) ||
        team.shortName.toLowerCase().includes(term)
      );
    }
    this.cdr.detectChanges();
  }

  /**
   * Maneja el cambio en el campo de búsqueda
   */
  onSearchChange(): void {
    this.updateFilteredTeams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Abre el modal para crear un nuevo equipo
   */
  createTeam(): void {
    const dialogRef = this.dialog.open(TeamFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: { 
        mode: 'create', 
        tournamentId: this.tournamentId 
      } as TeamFormData
    });

    dialogRef.afterClosed().subscribe((result: TeamModalResult) => {
      if (result && result.success) {
        this.refreshTeams();
      }
    });
  }

  /**
   * Abre el modal para editar un equipo existente
   */
  editTeam(team: Team): void {
    const dialogRef = this.dialog.open(TeamFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: { 
        mode: 'edit', 
        team: team,
        tournamentId: this.tournamentId 
      } as TeamFormData
    });

    dialogRef.afterClosed().subscribe((result: TeamModalResult) => {
      if (result && result.success) {
        this.refreshTeams();
      }
    });
  }

  /**
   * Abre el modal para crear un nuevo jugador
   */
  createPlayer(team: Team): void {
    const dialogRef = this.dialog.open(PlayerFormComponent, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: true,
      data: { 
        mode: 'create', 
        tournamentTeamId: team.id,
        teamName: team.name
      } as PlayerFormData
    });

    dialogRef.afterClosed().subscribe((result: PlayerModalResult) => {
      if (result && result.success) {
        // Actualizar el contador de jugadores del equipo
        team.totalPlayers = (team.totalPlayers || 0) + 1;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Elimina un equipo después de confirmación
   */
  deleteTeam(team: Team): void {
    Swal.fire({
      title: 'Eliminar Equipo',
      text: `¿Estás seguro de que deseas eliminar el equipo "${team.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.teamService.removeTeam(team.id).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (response: any) => {
            const config = this.deletionErrorHandler.createConfig('Equipo', {
              'EGOL_113': 'No se puede eliminar el equipo porque pertenece a una fase activa.',
              'EGOL_114': 'No se puede eliminar el equipo porque tiene partidos programados.',
              'EGOL_115': 'No se puede eliminar el equipo porque el torneo ya comenzó.'
            });

            if (this.deletionErrorHandler.handleResponse(response, config)) {
              this.refreshTeams();
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
   * Refresca la lista de equipos desde el backend
   */
  private refreshTeams(): void {
    this.loadTeams();
  }

  /**
   * TrackBy function para optimizar el renderizado de equipos
   */
  trackByTeamId(index: number, team: Team): number {
    return team.id;
  }

  /**
   * TrackBy para jugadores
   */
  trackByPlayerId(index: number, player: Player): number {
    return player.id;
  }

  /**
   * Obtiene los jugadores del equipo. Si el backend no provee la lista,
   * retorna un arreglo vacío.
   */
  getPlayersForTeam(team: Team): Player[] {
    const players = (team as any).players as Player[] | undefined;
    return players ?? [];
  }

  /**
   * Copia la URL de registro al portapapeles
   */
  copyRegistrationUrl(url: string): void {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => {
        Swal.fire({
          title: '¡Copiado!',
          text: 'URL de registro copiada al portapapeles',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }).catch(() => {
        this.fallbackCopyTextToClipboard(url);
      });
    } else {
      this.fallbackCopyTextToClipboard(url);
    }
  }

  /**
   * Copia la URL de registro específica del equipo al portapapeles
   */
  copyTeamRegistrationUrl(team: Team): void {
    if (!team.urlRegistration) {
      Swal.fire({
        title: 'Error',
        text: 'Este equipo no tiene URL de registro disponible',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(team.urlRegistration).then(() => {
        Swal.fire({
          title: '¡Enlace Copiado!',
          text: `Enlace de registro del equipo "${team.name}" copiado al portapapeles`,
          icon: 'success',
          timer: 2500,
          showConfirmButton: false
        });
      }).catch(() => {
        this.fallbackCopyTextToClipboard(team.urlRegistration!);
      });
    } else {
      this.fallbackCopyTextToClipboard(team.urlRegistration!);
    }
  }

  /**
   * Descalifica un equipo con confirmación
   * @param team Equipo a descalificar
   */
  disqualifyTeam(team: Team): void {
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
            this.refreshTeams();
          },
          error: (error) => {
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
   * Reactiva un equipo descalificado con confirmación
   * @param team Equipo a reactivar
   */
  reactivateTeam(team: Team): void {
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
        // Por ahora solo cerramos el alert como solicitado
        // TODO: Implementar API call cuando esté disponible
        console.log('Reactivating team:', team.name);

        // Simulamos éxito por ahora
        Swal.fire({
          title: '¡Equipo reactivado!',
          text: `El equipo "${team.name}" ha sido reactivado exitosamente`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  /**
   * Obtiene la clase CSS para el badge de estado del equipo
   * @param status Estado del equipo
   * @returns Clase CSS correspondiente
   */
  getTeamStatusClass(status: TeamStatus): string {
    switch (status) {
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
  getTeamStatusText(status: TeamStatus): string {
    switch (status) {
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
  getTeamStatusIcon(status: TeamStatus): string {
    switch (status) {
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

  /**
   * Verifica si un equipo puede ser descalificado
   * @param team Equipo a verificar
   * @returns true si puede ser descalificado
   */
  canDisqualifyTeam(team: Team): boolean {
    return team.status === TeamStatus.Active;
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
   * Cambia el estado de registro de jugadores para un equipo con confirmación
   * @param team Equipo al que cambiar el estado
   * @param event Evento del slide toggle
   */
  onTogglePlayerRegistration(team: Team, event: any): void {
    if (this.updatingTeamRegistration.has(team.id)) {
      // Si está en loading, prevenir cualquier cambio
      event.source.checked = !event.source.checked;
      return;
    }

    // Guardar el estado original antes del cambio
    const originalState = team.allowPlayerRegistration || false;
    
    // Prevenir el cambio automático del switch
    event.source.checked = originalState;

    // Extraer el valor checked del evento
    const isChecked = event?.checked !== undefined ? event.checked : event?.source?.checked;

    // Mostrar confirmación con SweetAlert2
    Swal.fire({
      title: 'Confirmar cambio',
      text: '¿Estás seguro de cambiar el estado de esta opción?',
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
        event.source.checked = isChecked;
        this.cdr.detectChanges();
        this.updateTeamRegistrationStatus(team, isChecked);
      } else {
        // Usuario canceló, asegurar que el switch esté en su estado original
        event.source.checked = originalState;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Actualiza el estado de registro de jugadores del equipo
   * @param team Equipo a actualizar
   * @param allow Estado del registro a establecer
   */
  private updateTeamRegistrationStatus(team: Team, allow: boolean): void {
    console.log('Starting updateTeamRegistrationStatus:', {
      teamId: team.id,
      teamName: team.name,
      allow,
      currentState: team.allowPlayerRegistration
    });

    // Marcar como en loading
    this.updatingTeamRegistration.add(team.id);
    this.cdr.detectChanges();

    this.teamService.allowPlayerRegistration(team.id, allow).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('API Response received for team:', team.name, response);
        
        // CRÍTICO: Terminar el loading INMEDIATAMENTE
        this.updatingTeamRegistration.delete(team.id);
        
        // Actualizar el estado local del equipo
        team.allowPlayerRegistration = allow;
        
        console.log('Updated team state:', {
          teamId: team.id,
          allowPlayerRegistration: team.allowPlayerRegistration,
          isUpdating: this.updatingTeamRegistration.has(team.id)
        });
        
        // Forzar detección de cambios INMEDIATAMENTE
        this.cdr.detectChanges();
        
        // Forzar una segunda detección después de un tick
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
        
        // El toast ya se maneja automáticamente por el ToastService
        // No mostrar alert adicional para evitar duplicación
      },
      error: (error) => {
        console.error('Error changing player registration status:', error);
        
        // CRÍTICO: Terminar el loading INMEDIATAMENTE
        this.updatingTeamRegistration.delete(team.id);
        
        // Revertir el estado del toggle en caso de error
        team.allowPlayerRegistration = !allow;
        
        console.log('Error - Reverted team state:', {
          teamId: team.id,
          allowPlayerRegistration: team.allowPlayerRegistration,
          isUpdating: this.updatingTeamRegistration.has(team.id)
        });
        
        // Forzar detección de cambios INMEDIATAMENTE
        this.cdr.detectChanges();
        
        // Forzar una segunda detección después de un tick
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
        
        // El toast de error ya se maneja automáticamente por el ToastService
        // No mostrar alert adicional para evitar duplicación
      }
    });
  }

  /**
   * Verifica si un equipo está en proceso de actualización
   * @param team Equipo a verificar
   * @returns true si está actualizando
   */
  isUpdatingTeamRegistration(team: Team): boolean {
    return this.updatingTeamRegistration.has(team.id);
  }

  /**
   * Método alternativo para copiar texto al portapapeles
   */
  private fallbackCopyTextToClipboard(text: string): void {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      Swal.fire({
        title: '¡Copiado!',
        text: 'URL de registro copiada al portapapeles',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo copiar la URL al portapapeles',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }

    document.body.removeChild(textArea);
  }
}
