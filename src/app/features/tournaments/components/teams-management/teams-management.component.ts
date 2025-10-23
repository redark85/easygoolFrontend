import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
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
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { Overlay, ScrollStrategy } from '@angular/cdk/overlay';
import { ViewportRuler, CdkScrollableModule } from '@angular/cdk/scrolling';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TeamService } from '../../services/team.service';
import { PlayerService } from '../../services/player.service';
import { TeamFormComponent } from '../team-form/team-form.component';
import { PlayerFormComponent } from '../player-form/player-form.component';
import { DeletionErrorHandlerHook } from '../../../../shared/hooks/deletion-error-handler.hook';
import { DocumentUploadService } from '../../../../shared/services/document-upload.service';
import { DocumentUploadModalComponent, DocumentUploadModalData, DocumentUploadModalResult } from '../../../../shared/components/document-upload-modal/document-upload-modal.component';
import { FileDownloadUtil } from '../../../../shared/utils/file-download.util';
import { ManagerInfoModalComponent, ManagerInfoData } from '../manager-info-modal/manager-info-modal.component';

// Importaciones de interfaces y modelos
import { Team, TeamStatus, Manager } from '../../models/team.interface';
import { Player, PlayerFormData, PlayerModalResult } from '../../../../core/models/player.interface';
import Swal from 'sweetalert2';

export interface TeamFormData {
  mode: 'create' | 'edit';
  team?: Team;
  tournamentId: number;
  allowUpdateInfo : boolean
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
    MatExpansionModule,
    MatMenuModule,
    CdkScrollableModule
  ],
  templateUrl: './teams-management.component.html',
  styleUrls: ['./teams-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamsManagementComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() tournamentId!: number;
  @Input() teams: Team[] = [];
  @Output() teamsUpdated = new EventEmitter<Team[]>();

  searchTerm = '';
  filteredTeams: Team[] = [];
  private destroy$ = new Subject<void>();
  private updatingTeamRegistration = new Set<number>(); // Track loading state per team
  private deletingPlayers = new Set<number>(); // Track loading state per player
  
  constructor(
    private teamService: TeamService,
    private playerService: PlayerService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private errorHandler: DeletionErrorHandlerHook,
    private documentUploadService: DocumentUploadService,
    private overlay: Overlay,
    private viewportRuler: ViewportRuler
  ) {}

  ngOnInit(): void {
    this.loadTeams();
  }

  ngAfterViewInit(): void {
    // Configurar interceptores para menús móviles
    this.setupMenuPositionFix();
    
    // Escuchar cambios de tamaño de ventana para reposicionar menús
    window.addEventListener('resize', () => {
      this.repositionOpenMenus();
    });
  }

  /**
   * Configura la corrección de posicionamiento para menús móviles
   */
  private setupMenuPositionFix(): void {
    // Observar cambios en el DOM para detectar menús mal posicionados
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Buscar overlays de menús
              if (element.classList.contains('cdk-overlay-pane')) {
                this.fixMenuPosition(element as HTMLElement);
              }
              // Buscar dentro del elemento agregado
              const overlays = element.querySelectorAll('.cdk-overlay-pane');
              overlays.forEach(overlay => this.fixMenuPosition(overlay as HTMLElement));
            }
          });
        }
      });
    });

    // Observar el documento completo
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Limpiar el observer cuando se destruya el componente
    this.destroy$.subscribe(() => observer.disconnect());
  }

  /**
   * Corrige la posición de un menú para que aparezca centrado como modal en móvil
   */
  private fixMenuPosition(overlay: HTMLElement): void {
    // Verificar si contiene un menú móvil
    const hasTeamMenu = overlay.querySelector('.team-mobile-menu');
    const hasPlayerMenu = overlay.querySelector('.player-mobile-menu');
    
    if (hasTeamMenu || hasPlayerMenu) {
      // Verificar si estamos en móvil (ancho menor a 768px)
      const isMobile = window.innerWidth <= 768;
      
      if (isMobile) {
        // Centrar el menú como modal en móvil
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Posicionar en el centro de la pantalla
        overlay.style.position = 'fixed';
        overlay.style.top = '50%';
        overlay.style.left = '50%';
        overlay.style.transform = 'translate(-50%, -50%)';
        overlay.style.zIndex = '1001';
        
        // Asegurar que el menú no sea más grande que la pantalla
        overlay.style.maxWidth = `${viewportWidth - 32}px`;
        overlay.style.maxHeight = `${viewportHeight - 64}px`;
        
        // Agregar clase para estilos adicionales
        overlay.classList.add('mobile-menu-modal');
      } else {
        // Comportamiento normal en desktop
        const rect = overlay.getBoundingClientRect();
        
        // Si el menú está muy arriba (menos de 50px del top)
        if (rect.top < 50) {
          overlay.style.top = '120px';
          overlay.style.transform = 'translateY(0)';
        }
        
        // Si el menú está muy a la izquierda
        if (rect.left < 16) {
          overlay.style.left = '16px';
        }
        
        // Asegurar que no se salga por la derecha
        const viewportWidth = window.innerWidth;
        if (rect.right > viewportWidth - 16) {
          overlay.style.left = `${viewportWidth - rect.width - 16}px`;
        }
        
        // Asegurar z-index alto
        overlay.style.zIndex = '1000';
      }
    }
  }

  /**
   * Maneja la apertura de menús móviles para corregir posicionamiento
   */
  onMenuOpened(): void {
    // Usar setTimeout para asegurar que el menú esté renderizado
    setTimeout(() => {
      this.repositionOpenMenus();
    }, 10);
  }

  /**
   * Reposiciona todos los menús abiertos
   */
  private repositionOpenMenus(): void {
    const overlays = document.querySelectorAll('.cdk-overlay-pane');
    overlays.forEach(overlay => {
      this.fixMenuPosition(overlay as HTMLElement);
    });
  }

  /**
   * Abre el modal para editar un jugador existente
   */
  editPlayer(player: Player, team: Team): void {
    console.log('Opening edit player modal:', {
      playerId: player.id,
      playerName: this.getPlayerFullName(player),
      teamId: team.id,
      teamName: team.name,
      tournamentTeamId: team.tournamentTeamId
    });
    
    const dialogRef = this.dialog.open(PlayerFormComponent, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        mode: 'edit',
        player,
        tournamentTeamId: team.tournamentTeamId,
        teamName: team.name,
        allowUpdateInfo: team.allowUpdateInfo
      } as PlayerFormData
    });

    dialogRef.afterClosed().subscribe((result: PlayerModalResult) => {
      if (result && result.success && result.player) {
        console.log('Player edited successfully, refreshing team data from API...');
        
        // Recargar datos completos desde el API con delay
        setTimeout(() => {
          console.log('Executing delayed refresh after player edit...');
          this.refreshTeams();
        }, 300);
      }
    });
  }

  /**
   * Elimina un jugador del equipo con confirmación
   */
  deletePlayer(player: Player, team: Team): void {
    const playerName = this.getPlayerFullName(player);
    
    Swal.fire({
      title: '¿Eliminar jugador?',
      html: `¿Estás seguro de que deseas eliminar al jugador <strong>"${playerName}"</strong> del equipo <strong>"${team.name}"</strong>?<br><br>Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result: any) => {
      if (result.isConfirmed) {
        // Marcar jugador como eliminándose
        this.deletingPlayers.add(player.id);
        this.cdr.detectChanges();

        this.playerService.deletePlayer(player.tournamentTeamPlayerId).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            // Quitar del estado de loading
            this.deletingPlayers.delete(player.id);
            
            // Actualizar localmente la lista de jugadores
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
            
            // Mostrar mensaje de éxito
            Swal.fire({
              title: '¡Jugador eliminado!',
              text: `${playerName} ha sido eliminado exitosamente del equipo ${team.name}`,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });

            // Forzar detección de cambios para actualizar la UI
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error deleting player:', error);
            
            // Quitar del estado de loading
            this.deletingPlayers.delete(player.id);
            this.cdr.detectChanges();

            // Mostrar mensaje de error
            Swal.fire({
              title: 'Error al eliminar',
              text: error.message || 'No se pudo eliminar el jugador. Inténtalo nuevamente.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });
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
    if (!team.allowUpdateInfo) {
      Swal.fire({
        icon: 'warning',
        title: 'Equipo No Modificable',
        html: `
          <div style="text-align: left; padding: 10px;">
            <p style="margin-bottom: 15px;">
              <strong>${team.name}</strong> está participando activamente en otros torneos y no puede ser modificado desde aquí.
            </p>
            <p style="margin-bottom: 10px;">
              <strong>¿Qué puedes hacer?</strong>
            </p>
            <ul style="margin-left: 20px; margin-bottom: 15px;">
              <li>Contactar al dueño del equipo para solicitar cambios</li>
              <li>Contactar al administrador del sistema</li>
              <li>Esperar a que finalicen los torneos activos</li>
            </ul>
            <p style="color: #666; font-size: 0.9em; margin-top: 15px;">
              <strong>Nota:</strong> Esta restricción protege la integridad de los datos en torneos activos.
            </p>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#1976d2',
        width: '500px',
        customClass: {
          popup: 'swal-team-restriction',
          htmlContainer: 'swal-html-container'
        }
      });
      return;
    }
    const dialogRef = this.dialog.open(TeamFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: { 
        mode: 'edit', 
        team: team,
        tournamentId: this.tournamentId,
        allowUpdateInfo: team.allowUpdateInfo
      } as TeamFormData
    });

    dialogRef.afterClosed().subscribe((result: TeamModalResult) => {
      if (result && result.success) {
        // Recargar lista de equipos después de edición exitosa
        console.log('Team edited successfully, refreshing teams list');
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
        tournamentTeamId: team.tournamentTeamId,
        teamName: team.name
      } as PlayerFormData
    });

    dialogRef.afterClosed().subscribe((result: PlayerModalResult) => {
      if (result && result.success) {
        console.log('Player created successfully, updating team data...');
        
        // Estrategia híbrida: Actualización inmediata + refresh del API
        
        // 1. Actualización inmediata para feedback instantáneo
        team.totalPlayers = (team.totalPlayers || 0) + 1;
        this.ensurePlayersListExists(team);
        
        if (result.player) {
          const players = (team as any).players as Player[];
          players.push(result.player);
        }
        
        // 2. Forzar actualización inmediata de la vista
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        
        // 3. Recargar datos completos del API para asegurar sincronización
        // Usar un delay más largo para asegurar que el backend haya procesado el cambio
        setTimeout(() => {
          console.log('Executing delayed refresh of team data...');
          
          // Usar refresh completo para asegurar que se actualicen todos los datos
          // incluyendo la lista completa de jugadores desde el API
          this.refreshTeams();
        }, 500);
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
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.teamService.removeTeam(team.tournamentTeamId).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (success: boolean) => {
            console.log('Team deletion result:', success);
            if (success) {
              // Recargar lista de equipos después de eliminación exitosa
              console.log('Team deleted successfully, refreshing teams list');
              this.refreshTeams();
            }
          },
          error: (error) => {
            console.error('Error deleting team:', error);
            // El error ya es manejado por el TeamService, solo logueamos aquí
            // No necesitamos usar errorHandler porque el servicio ya maneja los mensajes
          }
        });
      }
    });
  }

  /**
   * Refresca la lista de equipos desde el backend después de operaciones CRUD
   * Este método centraliza la lógica de recarga para mantener la UI actualizada
   */
  private refreshTeams(): void {
    console.log('Refreshing teams list after CRUD operation...');
    this.loadTeams();
  }

  /**
   * Refresca los datos de un equipo específico desde el backend
   * Útil cuando solo necesitamos actualizar un equipo sin recargar toda la lista
   * @param team Equipo a refrescar
   */
  private refreshTeamData(team: Team): void {
    console.log('Refreshing specific team data:', team.name);
    
    this.teamService.getTeamsByTournament(this.tournamentId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (teams) => {
        console.log('Teams data received from API:', teams.length, 'teams');
        
        // Encontrar el equipo actualizado
        const updatedTeam = teams.find(t => t.id === team.id);
        if (updatedTeam) {
          console.log('Updated team found:', updatedTeam.name, 'with', updatedTeam.totalPlayers, 'players');
          
          // Actualizar el equipo en la lista local
          const teamIndex = this.teams.findIndex(t => t.id === team.id);
          if (teamIndex !== -1) {
            // Reemplazar completamente el equipo con los datos actualizados
            this.teams[teamIndex] = updatedTeam;
            
            // Actualizar la lista filtrada
            this.updateFilteredTeams();
            
            // Forzar detección de cambios
            this.cdr.markForCheck();
            this.cdr.detectChanges();
            
            console.log('Team data refreshed successfully');
          } else {
            console.warn('Team not found in local list for update');
          }
        } else {
          console.warn('Updated team not found in API response');
        }
      },
      error: (error) => {
        console.error('Error refreshing team data:', error);
        
        // Fallback: recargar toda la lista si falla la actualización específica
        console.log('Falling back to full teams refresh...');
        this.refreshTeams();
      }
    });
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
    
    // Si no hay lista de jugadores pero hay contador > 0, inicializar lista vacía
    if (!players && team.totalPlayers > 0) {
      (team as any).players = [];
      return [];
    }
    
    return players ?? [];
  }

  /**
   * Inicializa la lista de jugadores para un equipo si no existe
   * @param team Equipo al que inicializar la lista
   */
  private ensurePlayersListExists(team: Team): void {
    if (!(team as any).players) {
      (team as any).players = [];
    }
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
    }).then((result: any) => {
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
            // Recargar lista de equipos después de descalificación exitosa
            console.log('Team disqualified successfully, refreshing teams list');
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
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.teamService.qualifyTeam(team.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire({
                title: '¡Equipo reactivado!',
                text: `El equipo "${team.name}" ha sido reactivado exitosamente`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
              
              // Recargar lista de equipos después de reactivación exitosa
              console.log('Team reactivated successfully, refreshing teams list');
              this.refreshTeams();
            },
            error: (error: any) => {
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

    // Determinar el mensaje según la acción
    const title = isChecked ? 'Habilitar registro de jugadores' : 'Deshabilitar registro de jugadores';
    const message = isChecked 
      ? 'El dueño del equipo podrá registrar nuevos jugadores.'
      : 'El dueño del equipo no podrá registrar nuevos jugadores.';

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
    }).then((result: any) => {
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
   * Verifica si un jugador está siendo eliminado
   * @param player Jugador a verificar
   * @returns true si está siendo eliminado
   */
  isDeletingPlayer(player: Player): boolean {
    return this.deletingPlayers.has(player.id);
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
   * Abre el modal para subir excel de jugadores
   * @param team Equipo al que subir el excel
   */
  uploadExcelDocument(team: Team): void {
    const dialogRef = this.dialog.open(DocumentUploadModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        title: 'Subir excel de Jugadores',
        maxFileSizeMB: 1,
        allowedTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        allowedExtensions: ['.xlsx'],
        acceptAttribute: '.xlsx',
        message: 'Estas a punto de subir el excel para el equipo ten en cuenta que solo podrás subir una vez el archivo.',
        teamName: team.name,
        tournamentTeamId: team.tournamentTeamId
      } as DocumentUploadModalData
    });

    dialogRef.afterClosed().subscribe((result: DocumentUploadModalResult) => {
      if (result && result.success && result.document) {
        console.log('📄 Excel uploaded successfully for team:', team.name, result.document);
        
        // Marcar el equipo como que ya subió el excel (actualización inmediata)
        team.hasExcelUploaded = true;
        this.cdr.detectChanges();
        
        // 🔄 ACTUALIZACIÓN CRÍTICA: Refrescar toda la data desde el API
        // Los jugadores del Excel ahora están en el backend y necesitamos cargarlos
        console.log('🔄 Refreshing teams data after Excel upload to load new players...');
        
        // Usar un delay para asegurar que el backend haya procesado completamente el archivo
        setTimeout(() => {
          console.log('⚡ Executing delayed refresh after Excel upload...');
          this.refreshTeams();
        }, 1000); // 1 segundo de delay para procesamiento del backend
      }
    });
  }

  /**
   * Abre el modal con la información completa del manager
   */
  openManagerInfoModal(team: Team): void {
    if (!team.manager) {
      return;
    }

    const dialogData: ManagerInfoData = {
      managerName: team.manager.managerName,
      phoneNumber: team.manager.phoneNumber,
      email: team.manager.email,
      teamName: team.name
    };

    this.dialog.open(ManagerInfoModalComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: dialogData,
      panelClass: 'manager-info-dialog'
    });
  }

  /**
   * Configura el posicionamiento óptimo del menú basado en la posición del trigger
   */
  getMenuPositionStrategy(triggerElement: HTMLElement): { xPosition: 'before' | 'after', yPosition: 'above' | 'below' } {
    const rect = triggerElement.getBoundingClientRect();
    const viewportHeight = this.viewportRuler.getViewportSize().height;
    const viewportWidth = this.viewportRuler.getViewportSize().width;
    
    // Determinar posición vertical
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const yPosition = spaceBelow > 300 || spaceBelow > spaceAbove ? 'below' : 'above';
    
    // Determinar posición horizontal
    const spaceRight = viewportWidth - rect.right;
    const spaceLeft = rect.left;
    const xPosition = spaceLeft > 280 || spaceLeft > spaceRight ? 'before' : 'after';
    
    return { xPosition, yPosition };
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
