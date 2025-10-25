import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { VocaliaService, VocaliaPlayer, AvailablePlayer, MatchEventType, RegisterMatchEventRequest, MatchEvent, MatchInProgressStatusType } from '@core/services/vocalia.service';
import { MatchStatusType } from '@core/services/match.service';

interface Player {
  id: number;
  number: number;
  name: string;
  goals: number;
  yellowCards: number;
  redCards: number;
  matchAway? : boolean;
}

interface MatchIncident {
  minute: number;
  type: MatchEventType;
  player: string;
  team: string;
  description: string;
}

@Component({
  selector: 'app-vocalia-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './vocalia-view.component.html',
  styleUrls: ['./vocalia-view.component.scss']
})
export class VocaliaViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  matchId: number | null = null;
  tournamentId: number | null = null;
  isLoading = false;
  
  // Match Info
  tournamentName = '';
  homeTeam = '';
  awayTeam = '';
  homeTeamLogo = '';
  awayTeamLogo = '';
  homeScore = 0;
  awayScore = 0;
  matchTime = '00:00';
  isMatchActive = true;
  
  // Match State Control usando el enum del API
  matchProgressType: MatchInProgressStatusType | null = null;
  timerInterval: any = null;
  elapsedSeconds = 0;
  
  // NUEVO DE CHATGPT - Timer persistente
  isRunning = false;
  private intervalId: any;
  private lastStartTime: number | null = null;
  
  // Enum para usar en el template
  MatchInProgressStatusType = MatchInProgressStatusType;
  
  // Team IDs
  homeTeamId: number | null = null;
  awayTeamId: number | null = null;
  
  // Players
  homeTeamPlayers: Player[] = [];
  awayTeamPlayers: Player[] = [];
  
  // Filtered Players
  filteredHomeTeamPlayers: Player[] = [];
  filteredAwayTeamPlayers: Player[] = [];
  
  // Search Text
  homeTeamSearchText = '';
  awayTeamSearchText = '';
  // Incidents
  incidents: MatchIncident[] = [];
  hasMatchStarted = false;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vocaliaService: VocaliaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Inicializar listas filtradas
    this.filteredHomeTeamPlayers = [...this.homeTeamPlayers];
    this.filteredAwayTeamPlayers = [...this.awayTeamPlayers];
    
    // Obtener el ID del partido de la ruta
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.matchId = params['matchId'] ? +params['matchId'] : null;
      if (this.matchId) {
        this.loadMatchData(this.matchId);
        // Cargar estado guardado para este partido específico
        this.loadTimerState();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopInterval();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos del partido desde el API
   */
  private loadMatchData(matchId: number): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.vocaliaService.getMatchData(matchId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          // Información del partido
          this.tournamentId = data.tournamentId;
          this.tournamentName = data.tournamentName;
          this.homeTeam = data.homeTeam.name;
          this.awayTeam = data.awayTeam.name;
          this.homeTeamLogo = data.homeTeam.logoUrl;
          this.awayTeamLogo = data.awayTeam.logoUrl;
          this.homeScore = data.homeTeam.score;
          this.awayScore = data.awayTeam.score;
          this.homeTeamId = data.homeTeam.phaseTeamId;
          this.awayTeamId = data.awayTeam.phaseTeamId;

          // Convertir jugadores del API al formato interno
          this.homeTeamPlayers = data.homeTeam.playerInGame.map(p => this.convertToPlayer(p));
          this.awayTeamPlayers = data.awayTeam.playerInGame.map(p => this.convertToPlayer(p));

          // Inicializar listas filtradas
          this.filteredHomeTeamPlayers = [...this.homeTeamPlayers];
          this.filteredAwayTeamPlayers = [...this.awayTeamPlayers];

          // Convertir eventos del API al formato interno
          this.incidents = data.events.map(e => this.convertToIncident(e));

          // Cargar el estado del partido desde el API
          if (data.matchProgressType !== undefined && data.matchProgressType !== null) {
            this.matchProgressType = data.matchProgressType;
          }
          this.hasMatchStarted = data.status === MatchStatusType.inProgress;
          //Mostrar modal para registrar el nombre del vocal
          //solo un campo que diga nombre de la persona o nombre del equipo al que pertenece el vocal
          if (!data.vocalName) {
            console.log("Levantar modal para registrar el nombre del vocal");
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading match data:', error);
          Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudieron cargar los datos del partido',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            this.router.navigate(['/']);
          });
        }
      });
  }

  /**
   * Convierte un jugador del API al formato interno
   */
  private convertToPlayer(apiPlayer: VocaliaPlayer): Player {
    return {
      id: apiPlayer.tournamentTeamPlayerId,
      number: apiPlayer.jersey,
      name: apiPlayer.name,
      goals: 0,
      yellowCards: 0,
      redCards: 0,
      matchAway: apiPlayer.matchAway
    };
  }

  /**
   * Convierte un evento del API al formato interno
   */
  private convertToIncident(apiEvent: any): MatchIncident {
    return {
      minute: apiEvent.minute,
      type: apiEvent.type as MatchEventType,
      player: '',
      team: '',
      description: apiEvent.description
    };
  }

  /**
   * Registra un gol
   */
  addGoal(player: Player, team: 'home' | 'away'): void {
    const teamName = team === 'home' ? this.homeTeam : this.awayTeam;
    
    Swal.fire({
      title: '¿Registrar gol?',
      html: `
        <div style="text-align: left;">
          <p style="text-align: center;">¿Estás seguro de registrar un gol para:</p>
          <p style="margin-top: 10px; text-align: center;"><strong>#${player.number} ${player.name}</strong></p>
          <p style="color: #666; text-align: center; margin-bottom: 20px;">${teamName}</p>
          
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 15px; background: #f5f5f5; border-radius: 8px; margin-top: 15px;">
            <input type="checkbox" id="isPenaltyCheckbox" style="width: 20px; height: 20px; cursor: pointer;">
            <label for="isPenaltyCheckbox" style="margin: 0; font-size: 1rem; font-weight: 500; cursor: pointer;">
              ⚽ ¿Es gol de penal?
            </label>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4caf50',
      cancelButtonColor: '#d33',
      preConfirm: () => {
        const checkbox = document.getElementById('isPenaltyCheckbox') as HTMLInputElement;
        return {
          isPenalty: checkbox ? checkbox.checked : false
        };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const isHomeTeam = team === 'home';
        const isPenalty = result.value.isPenalty;
        
        const event: MatchEvent = {
          tournamentTeamPlayerId: player.id,
          eventType: MatchEventType.Goal,
          minute: this.getCurrentMinute(),
          isHomeGoal: isHomeTeam,
          isPenalty: isPenalty
        };

        const request: RegisterMatchEventRequest = {
          matchId: this.matchId!,
          events: [event]
        };

        // Mostrar loading
        Swal.fire({
          title: 'Registrando gol...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Llamar al API
        this.vocaliaService.registerMatchEvent(request)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Recargar información del partido desde el API
              this.loadMatchData(this.matchId!);

              Swal.fire({
                title: '¡Gol registrado!',
                text: `${isPenalty ? 'Gol de penal' : 'Gol'} de ${player.name}`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
            },
            error: (error) => {
              console.error('Error registering goal:', error);
              Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudo registrar el gol',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
            }
          });
      }
    });
  }

  /**
   * Registra una tarjeta amarilla
   */
  addYellowCard(player: Player, team: 'home' | 'away'): void {
    const teamName = team === 'home' ? this.homeTeam : this.awayTeam;
    
    Swal.fire({
      title: '¿Registrar tarjeta amarilla?',
      html: `
        <p>¿Estás seguro de registrar una tarjeta amarilla para:</p>
        <p style="margin-top: 10px;"><strong>#${player.number} ${player.name}</strong></p>
        <p style="color: #666;">${teamName}</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4caf50',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        const isHomeTeam = team === 'home';
        const event: MatchEvent = {
          tournamentTeamPlayerId: player.id,
          eventType: MatchEventType.YellowCard,
          minute: this.getCurrentMinute(),
          isHomeGoal: isHomeTeam
        };

        const request: RegisterMatchEventRequest = {
          matchId: this.matchId!,
          events: [event]
        };

        // Mostrar loading
        Swal.fire({
          title: 'Registrando tarjeta amarilla...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Llamar al API
        this.vocaliaService.registerMatchEvent(request)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Recargar información del partido desde el API
              this.loadMatchData(this.matchId!);

              Swal.fire({
                title: 'Tarjeta amarilla registrado!',
                text: `Amarilla para ${player.name}`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
            },
            error: (error) => {
              Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudo registrar la tarjeta amarilla',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
            }
          });
      }
    });
  }

  /**
   * Registra una doble tarjeta amarilla (expulsión)
   */
  addDoubleYellowCard(player: Player, team: 'home' | 'away'): void {
    player.yellowCards += 2;
    player.redCards++;
    
   const teamName = team === 'home' ? this.homeTeam : this.awayTeam;
    
    Swal.fire({
      title: '¿Registrar tarjeta amarilla?',
      html: `
        <p>¿Estás seguro de registrar una doble amarilla para:</p>
        <p style="margin-top: 10px;"><strong>#${player.number} ${player.name}</strong></p>
        <p style="color: #666;">${teamName}</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4caf50',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        const isHomeTeam = team === 'home';
        const event: MatchEvent = {
          tournamentTeamPlayerId: player.id,
          eventType: MatchEventType.DoubleYellowCard,
          minute: this.getCurrentMinute(),
          isHomeGoal: isHomeTeam
        };

        const request: RegisterMatchEventRequest = {
          matchId: this.matchId!,
          events: [event]
        };

        // Mostrar loading
        Swal.fire({
          title: 'Registrando doble amarilla...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Llamar al API
        this.vocaliaService.registerMatchEvent(request)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Recargar información del partido desde el API
              this.loadMatchData(this.matchId!);

              Swal.fire({
                title: 'Doble amarilla registrada!',
                text: `Doble amarilla para ${player.name}`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
            },
            error: (error) => {
              Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudo registrar la tarjeta amarilla',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
            }
          });
      }
    });
  }

  /**
   * Registra una tarjeta roja
   */
  addRedCard(player: Player, team: 'home' | 'away'): void {
    player.redCards++;
    
    const teamName = team === 'home' ? this.homeTeam : this.awayTeam;
    
    Swal.fire({
      title: '¿Registrar tarjeta roja?',
      html: `
        <p>¿Estás seguro de registrar una tarjeta roja para:</p>
        <p style="margin-top: 10px;"><strong>#${player.number} ${player.name}</strong></p>
        <p style="color: #666;">${teamName}</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4caf50',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        const isHomeTeam = team === 'home';
        const event: MatchEvent = {
          tournamentTeamPlayerId: player.id,
          eventType: MatchEventType.RedCard,
          minute: this.getCurrentMinute(),
          isHomeGoal: isHomeTeam
        };

        const request: RegisterMatchEventRequest = {
          matchId: this.matchId!,
          events: [event]
        };

        // Mostrar loading
        Swal.fire({
          title: 'Registrando tarjeta roja...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Llamar al API
        this.vocaliaService.registerMatchEvent(request)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Recargar información del partido desde el API
              this.loadMatchData(this.matchId!);

              Swal.fire({
                title: 'Tarjeta roja registrada!',
                text: `Roja para ${player.name}`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
            },
            error: (error) => {
              Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudo registrar la tarjeta amarilla',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
            }
          });
      }
    });
  }

  /**
   * Sustituye un jugador por otro que no está en cancha
   */
  substitutePlayer(playerOut: Player, team: 'home' | 'away'): void {
    const phaseTeamId = team === 'home' ? this.homeTeamId : this.awayTeamId;
    const teamName = team === 'home' ? this.homeTeam : this.awayTeam;
    
    if (!phaseTeamId || !this.tournamentId) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo obtener la información del equipo',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Obtener jugadores disponibles (que no están en cancha)
    this.vocaliaService.getAvailablePlayers(phaseTeamId, this.tournamentId, this.matchId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (players) => {
          if (players.length === 0) {
            Swal.fire({
              title: 'Sin jugadores disponibles',
              text: 'No hay jugadores disponibles para sustituir',
              icon: 'info',
              confirmButtonText: 'Aceptar'
            });
            return;
          }

          // Crear opciones para el select
          const inputOptions: { [key: string]: string } = {};
          players.forEach(player => {
            inputOptions[player.tournamentTeamPlayerId.toString()] = `#${player.jerseyNumber} - ${player.fullName}`;
          });

          // Mostrar modal para seleccionar jugador entrante
          Swal.fire({
            title: 'Sustituir jugador',
            html: `
              <p style="margin-bottom: 15px;">Jugador que sale:</p>
              <p style="font-weight: bold; color: #d32f2f; margin-bottom: 20px;">
                #${playerOut.number} ${playerOut.name}
              </p>
              <p style="margin-bottom: 10px;">Selecciona el jugador que entra:</p>
            `,
            input: 'select',
            inputOptions: inputOptions,
            inputPlaceholder: 'Selecciona un jugador',
            showCancelButton: true,
            confirmButtonText: 'Siguiente',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#4caf50',
            cancelButtonColor: '#d33',
            inputValidator: (value) => {
              if (!value) {
                return 'Debes seleccionar un jugador';
              }
              return null;
            }
          }).then((result) => {
            if (result.isConfirmed && result.value) {
              const selectedPlayerId = parseInt(result.value);
              const playerIn = players.find(p => p.tournamentTeamPlayerId === selectedPlayerId);

              if (!playerIn) {
                Swal.fire({
                  title: 'Error',
                  text: 'No se pudo encontrar el jugador seleccionado',
                  icon: 'error',
                  confirmButtonText: 'Aceptar'
                });
                return;
              }

              // Mostrar confirmación
              Swal.fire({
                title: '¿Confirmar sustitución?',
                html: `
                  <div style="text-align: left; padding: 0 20px;">
                    <p style="margin-bottom: 15px;"><strong>Sustitución en ${teamName}</strong></p>
                    <div style="background: #ffebee; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                      <p style="margin: 0; color: #d32f2f;">
                        <mat-icon style="vertical-align: middle;">arrow_upward</mat-icon>
                        Sale: #${playerOut.number} ${playerOut.name}
                      </p>
                    </div>
                    <div style="background: #e8f5e9; padding: 15px; border-radius: 8px;">
                      <p style="margin: 0; color: #2e7d32;">
                        <mat-icon style="vertical-align: middle;">arrow_downward</mat-icon>
                        Entra: #${playerIn.jerseyNumber} ${playerIn.fullName}
                      </p>
                    </div>
                    <p style="margin-top: 15px; color: #666;">Minuto: ${this.getCurrentMinute()}'</p>
                  </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, sustituir',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#4caf50',
                cancelButtonColor: '#d33'
              }).then((confirmResult) => {
                if (confirmResult.isConfirmed) {
                  this.executeSubstitution(playerOut, playerIn, team, teamName);
                }
              });
            }
          });
        },
        error: (error) => {
          console.error('Error al obtener jugadores disponibles:', error);
          Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar los jugadores disponibles',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      });
  }

  /**
   * Ejecuta la sustitución del jugador
   */
  private executeSubstitution(playerOut: Player, playerIn: AvailablePlayer, team: 'home' | 'away', teamName: string): void {
    const isHomeTeam = team === 'home';
    
    // Crear evento de sustitución
    const event: MatchEvent = {
      tournamentTeamPlayerId: playerIn.tournamentTeamPlayerId,
      tournamentTeamPlayerSustitutionId: playerOut.id,
      eventType: MatchEventType.Substitution,
      minute: this.getCurrentMinute(),
      isHomeGoal: isHomeTeam,
    };

    const request: RegisterMatchEventRequest = {
      matchId: this.matchId!,
      events: [event]
    };

    // Mostrar loading
    Swal.fire({
      title: 'Registrando sustitución...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Llamar al API
    this.vocaliaService.registerMatchEvent(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Recargar información del partido desde el API
          this.loadMatchData(this.matchId!);

          Swal.fire({
            title: '¡Sustitución registrada!',
            html: `
              <p>Sale: #${playerOut.number} ${playerOut.name}</p>
              <p>Entra: #${playerIn.jerseyNumber} ${playerIn.fullName}</p>
            `,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          console.error('Error al registrar sustitución:', error);
          Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo registrar la sustitución',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      });
  }

  /**
   * Filtra los jugadores por número de camiseta o nombre
   * Busca en la lista de jugadores obtenida del API (playerInGame)
   */
  filterPlayers(team: 'home' | 'away'): void {
    if (team === 'home') {
      const searchText = this.homeTeamSearchText.toLowerCase().trim();
      if (searchText === '') {
        // Mostrar todos los jugadores del equipo local
        this.filteredHomeTeamPlayers = [...this.homeTeamPlayers];
      } else {
        // Filtrar por número de camiseta o nombre
        this.filteredHomeTeamPlayers = this.homeTeamPlayers.filter(player => {
          const numberMatch = player.number.toString().includes(searchText);
          const nameMatch = player.name.toLowerCase().includes(searchText);
          return numberMatch || nameMatch;
        });
      }
    } else {
      const searchText = this.awayTeamSearchText.toLowerCase().trim();
      if (searchText === '') {
        // Mostrar todos los jugadores del equipo visitante
        this.filteredAwayTeamPlayers = [...this.awayTeamPlayers];
      } else {
        // Filtrar por número de camiseta o nombre
        this.filteredAwayTeamPlayers = this.awayTeamPlayers.filter(player => {
          const numberMatch = player.number.toString().includes(searchText);
          const nameMatch = player.name.toLowerCase().includes(searchText);
          return numberMatch || nameMatch;
        });
      }
    }
  }

  /**
   * Agrega un nuevo jugador desde la lista de jugadores disponibles
   */
  addPlayer(team: 'home' | 'away'): void {
    const phaseTeamId = team === 'home' ? this.homeTeamId : this.awayTeamId;
    
    if (!phaseTeamId || !this.tournamentId) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo obtener la información del equipo',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Mostrar loading
    Swal.fire({
      title: 'Cargando jugadores...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Obtener jugadores disponibles del API
    this.vocaliaService.getAvailablePlayers(phaseTeamId, this.tournamentId, this.matchId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (players) => {
          this.showPlayerSelectionModal(players, team);
        },
        error: (error) => {
          console.error('Error loading available players:', error);
          Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudieron cargar los jugadores disponibles',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      });
  }

  /**
   * Muestra el modal de selección de jugadores
   */
  private showPlayerSelectionModal(players: AvailablePlayer[], team: 'home' | 'away'): void {
    if (players.length === 0) {
      Swal.fire({
        title: 'Sin jugadores',
        text: 'No hay jugadores disponibles para agregar',
        icon: 'info',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Generar HTML de la lista de jugadores
    const playersHtml = players.map(player => {
      const isSanctioned = player.isSanctioned;
      const disabledClass = isSanctioned ? 'player-sanctioned' : '';
      const disabledAttr = isSanctioned ? 'disabled' : '';
      const sanctionedLabel = isSanctioned ? '<span class="sanctioned-badge">SANCIONADO</span>' : '';
      
      return `
        <div class="player-item ${disabledClass}" data-number="${player.jerseyNumber}" data-name="${player.fullName.toLowerCase()}">
          <input type="checkbox" 
                 class="player-checkbox"
                 value="${player.tournamentTeamPlayerId}" 
                 id="player-${player.tournamentTeamPlayerId}"
                 ${disabledAttr}
                 data-number="${player.jerseyNumber}"
                 data-name="${player.fullName}">
          <label for="player-${player.tournamentTeamPlayerId}">
            <span class="player-number">#${player.jerseyNumber}</span>
            <span class="player-name">${player.fullName}</span>
            ${sanctionedLabel}
          </label>
        </div>
      `;
    }).join('');

    Swal.fire({
      title: 'Seleccionar jugadores',
      html: `
        <style>
          .search-container {
            margin-bottom: 15px;
          }
          .search-input {
            width: 100%;
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
          }
          .search-input:focus {
            outline: none;
            border-color: #3085d6;
          }
          .selected-count {
            margin-bottom: 10px;
            font-weight: 600;
            color: #3085d6;
          }
          .player-item {
            display: flex;
            align-items: center;
            padding: 12px;
            margin: 8px 0;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .player-item:hover:not(.player-sanctioned) {
            border-color: #3085d6;
            background-color: #f0f8ff;
          }
          .player-item.player-sanctioned {
            opacity: 0.5;
            cursor: not-allowed;
            background-color: #f5f5f5;
          }
          .player-item.hidden {
            display: none;
          }
          .player-checkbox {
            margin-right: 12px;
            cursor: pointer;
            width: 18px;
            height: 18px;
          }
          .player-item.player-sanctioned .player-checkbox {
            cursor: not-allowed;
          }
          .player-item label {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            margin: 0;
          }
          .player-item.player-sanctioned label {
            cursor: not-allowed;
          }
          .player-number {
            font-weight: 700;
            color: #3085d6;
            min-width: 40px;
          }
          .player-name {
            flex: 1;
            text-align: left;
          }
          .sanctioned-badge {
            background-color: #f44336;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
          }
          .no-results {
            text-align: center;
            padding: 20px;
            color: #999;
            display: none;
          }
          .no-results.show {
            display: block;
          }
        </style>
        <div class="search-container">
          <input type="text" 
                 id="playerSearch" 
                 class="search-input" 
                 placeholder="Buscar por número de camiseta o nombre..."
                 autocomplete="off">
        </div>
        <div class="selected-count" id="selectedCount">0 jugadores seleccionados</div>
        <div style="max-height: 400px; overflow-y: auto; text-align: left;" id="playersContainer">
          ${playersHtml}
          <div class="no-results" id="noResults">No se encontraron jugadores</div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Agregar seleccionados',
      cancelButtonText: 'Cancelar',
      width: '600px',
      didOpen: () => {
        const searchInput = document.getElementById('playerSearch') as HTMLInputElement;
        const playerItems = document.querySelectorAll('.player-item');
        const noResults = document.getElementById('noResults') as HTMLElement;
        const checkboxes = document.querySelectorAll('.player-checkbox') as NodeListOf<HTMLInputElement>;
        const selectedCount = document.getElementById('selectedCount') as HTMLElement;

        // Función para actualizar contador
        const updateCount = () => {
          const checked = document.querySelectorAll('.player-checkbox:checked').length;
          selectedCount.textContent = `${checked} jugador${checked !== 1 ? 'es' : ''} seleccionado${checked !== 1 ? 's' : ''}`;
        };

        // Event listener para checkboxes
        checkboxes.forEach(checkbox => {
          checkbox.addEventListener('change', updateCount);
        });

        // Event listener para búsqueda
        searchInput.addEventListener('input', (e) => {
          const searchText = (e.target as HTMLInputElement).value.toLowerCase().trim();
          let visibleCount = 0;

          playerItems.forEach(item => {
            const playerNumber = (item as HTMLElement).dataset['number'] || '';
            const playerName = (item as HTMLElement).dataset['name'] || '';
            
            const matchesNumber = playerNumber.includes(searchText);
            const matchesName = playerName.includes(searchText);
            
            if (searchText === '' || matchesNumber || matchesName) {
              item.classList.remove('hidden');
              visibleCount++;
            } else {
              item.classList.add('hidden');
            }
          });

          // Mostrar mensaje si no hay resultados
          if (visibleCount === 0) {
            noResults.classList.add('show');
          } else {
            noResults.classList.remove('show');
          }
        });

        // Focus en el input de búsqueda
        searchInput.focus();
      },
      preConfirm: () => {
        const selected = Array.from(document.querySelectorAll('.player-checkbox:checked')) as HTMLInputElement[];
        if (selected.length === 0) {
          Swal.showValidationMessage('Por favor selecciona al menos un jugador');
          return false;
        }
        return selected.map(checkbox => ({
          id: parseInt(checkbox.value),
          number: parseInt(checkbox.dataset['number'] || '0'),
          name: checkbox.dataset['name'] || ''
        }));
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const addedPlayers: Player[] = result.value.map((playerData: any) => ({
          id: playerData.id,
          number: playerData.number,
          name: playerData.name,
          goals: 0,
          yellowCards: 0,
          redCards: 0
        }));
        
        // Preparar eventos para el API
        const isHomeTeam = team === 'home';
        const currentMinute = this.getCurrentMinute();
        const events: MatchEvent[] = addedPlayers.map(player => ({
          tournamentTeamPlayerId: player.id,
          eventType: MatchEventType.InMatch,
          minute: currentMinute,
          description: `${player.name} ingresa al partido`,
          isHomeGoal: isHomeTeam
        }));

        const request: RegisterMatchEventRequest = {
          matchId: this.matchId!,
          events: events
        };

        // Mostrar loading
        Swal.fire({
          title: 'Registrando jugadores...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Llamar al API
        this.vocaliaService.registerMatchEvent(request)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Recargar información del partido desde el API
              this.loadMatchData(this.matchId!);
              
              const count = addedPlayers.length;
              Swal.fire({
                title: '¡Jugadores agregados!',
                text: `${count} jugador${count !== 1 ? 'es' : ''} agregado${count !== 1 ? 's' : ''} al equipo`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
            },
            error: (error) => {
              console.error('Error registering players:', error);
              Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudieron registrar los jugadores',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
            }
          });
      }
    });
  }

  /**
   * Elimina un jugador
   */
  removePlayer(player: Player, team: 'home' | 'away'): void {
    Swal.fire({
      title: '¿Eliminar jugador?',
      text: `¿Deseas eliminar a ${player.name} de la lista?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        if (team === 'home') {
          this.homeTeamPlayers = this.homeTeamPlayers.filter(p => p.id !== player.id);
          this.filterPlayers('home'); // Actualizar lista filtrada
        } else {
          this.awayTeamPlayers = this.awayTeamPlayers.filter(p => p.id !== player.id);
          this.filterPlayers('away'); // Actualizar lista filtrada
        }
      }
    });
  }

  /**
   * Abre el modal para registrar una nueva incidencia
   */
  openAddIncidentModal(): void {
    Swal.fire({
      title: 'Registrar incidencia',
      html: `
        <div style="display: flex; flex-direction: column; gap: 15px; text-align: left;">
          <label for="incident-minute" style="font-weight: 600; margin-bottom: -10px;">Minuto del partido:</label>
          <input id="incident-minute" type="number" class="swal2-input" placeholder="Ej: 45" min="1" max="120" style="margin-top: 0;">
          
          <label for="incident-description" style="font-weight: 600; margin-bottom: -10px;">Descripción de la incidencia:</label>
          <textarea id="incident-description" class="swal2-textarea" placeholder="Describe lo que sucedió en el partido..." rows="5" style="margin-top: 0; resize: vertical; min-height: 120px;"></textarea>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      width: '600px',
      preConfirm: () => {
        const minuteInput = document.getElementById('incident-minute') as HTMLInputElement;
        const descriptionInput = document.getElementById('incident-description') as HTMLTextAreaElement;
        
        const minute = parseInt(minuteInput.value);
        const description = descriptionInput.value.trim();
        
        if (!minute || minute < 1 || minute > 120) {
          Swal.showValidationMessage('Por favor ingresa un minuto válido (1-120)');
          return false;
        }
        
        if (!description) {
          Swal.showValidationMessage('Por favor ingresa una descripción');
          return false;
        }
        
        if (description.length < 10) {
          Swal.showValidationMessage('La descripción debe tener al menos 10 caracteres');
          return false;
        }
        
        return { minute, description };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const newIncident: MatchIncident = {
          minute: result.value.minute,
          type: MatchEventType.Other, // Tipo genérico para incidencias personalizadas
          player: '',
          team: '',
          description: result.value.description
        };
        
        // Agregar al inicio de la lista
        this.incidents.unshift(newIncident);
        
        Swal.fire({
          title: '¡Incidencia registrada!',
          text: 'La incidencia ha sido registrada correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  /**
   * Elimina una incidencia específica
   */
  deleteIncident(index: number): void {
    const incident = this.incidents[index];
    
    Swal.fire({
      title: '¿Eliminar incidencia?',
      html: `
        <p>¿Estás seguro de que deseas eliminar esta incidencia?</p>
        <p style="margin-top: 10px;"><strong>${incident.description}</strong></p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.incidents.splice(index, 1);
        
        Swal.fire({
          title: '¡Incidencia eliminada!',
          text: 'La incidencia ha sido eliminada correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }
  
  /**
   * Actualiza el estado del partido en el servidor
   */
  private updateMatchProgressInServer(newState: MatchInProgressStatusType): void {
    if (!this.matchId) {
      console.error('No hay matchId disponible');
      return;
    }

    this.vocaliaService.updateMatchProgress(this.matchId, newState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Estado del partido actualizado en el servidor:', newState);
        },
        error: (error) => {
          console.error('Error al actualizar estado del partido:', error);
          Swal.fire({
            title: 'Advertencia',
            text: 'El estado se actualizó localmente pero hubo un error al sincronizar con el servidor',
            icon: 'warning',
            confirmButtonText: 'Aceptar'
          });
        }
      });
  }

  /**
   * Determina si un estado requiere cronómetro activo
   */
  private isPlayingState(state: MatchInProgressStatusType | null): boolean {
    if (state === null) return false;
    return [
      MatchInProgressStatusType.FirstHalf,
      MatchInProgressStatusType.SecondHalf,
      MatchInProgressStatusType.ExtraFirstTime,
      MatchInProgressStatusType.ExtraSecondTime,
      MatchInProgressStatusType.Penalty
    ].includes(state);
  }

  /**
   * Obtiene el nombre legible del estado
   */
  private getStateName(state: MatchInProgressStatusType | null): string {
    if (state === null) return 'Sin iniciar';
    
    const stateNames: { [key: number]: string } = {
      [MatchInProgressStatusType.FirstHalf]: 'Primer Tiempo',
      [MatchInProgressStatusType.HalfTime]: 'Descanso',
      [MatchInProgressStatusType.SecondHalf]: 'Segundo Tiempo',
      [MatchInProgressStatusType.HalfSecondTime]: 'Descanso (Pre-Prórroga)',
      [MatchInProgressStatusType.ExtraFirstTime]: 'Prórroga - Primer Tiempo',
      [MatchInProgressStatusType.HalfFirstExtraTime]: 'Descanso (Prórroga)',
      [MatchInProgressStatusType.ExtraSecondTime]: 'Prórroga - Segundo Tiempo',
      [MatchInProgressStatusType.HalfPenalties]: 'Descanso (Pre-Penales)',
      [MatchInProgressStatusType.Penalty]: 'Tanda de Penales'
    };
    
    return stateNames[state] || 'Desconocido';
  }

  /**
   * Inicia el partido (primer tiempo)
   */
  startFirstHalf(): void {
    Swal.fire({
      title: '¿Iniciar el partido?',
      text: 'Se comenzará a contar el tiempo del primer tiempo',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, iniciar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.matchProgressType = MatchInProgressStatusType.FirstHalf;
        this.elapsedSeconds = 0;
        this.start();
        this.updateMatchProgressInServer(MatchInProgressStatusType.FirstHalf);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Finaliza el primer tiempo
   */
  endFirstHalf(): void {
    Swal.fire({
      title: '¿Finalizar el primer tiempo?',
      text: 'Se detendrá el cronómetro',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.matchProgressType = MatchInProgressStatusType.HalfTime;
        this.pause();
        this.updateMatchProgressInServer(MatchInProgressStatusType.HalfTime);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Inicia el segundo tiempo
   */
  startSecondHalf(): void {
    Swal.fire({
      title: '¿Iniciar el segundo tiempo?',
      text: 'Se continuará contando el tiempo del partido',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, iniciar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.matchProgressType = MatchInProgressStatusType.SecondHalf;
        this.start();
        this.updateMatchProgressInServer(MatchInProgressStatusType.SecondHalf);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Finaliza el segundo tiempo
   */
  endSecondHalf(): void {
    Swal.fire({
      title: '¿Finalizar el segundo tiempo?',
      text: 'Se detendrá el cronómetro',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.matchProgressType = MatchInProgressStatusType.HalfSecondTime;
        this.pause();
        this.updateMatchProgressInServer(MatchInProgressStatusType.HalfSecondTime);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Va directamente a penales (sin prórroga)
   */
  goToPenalties(): void {
    Swal.fire({
      title: '¿Ir directamente a penales?',
      text: 'Se saltará la prórroga y se irá directo a la tanda de penales',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, ir a penales',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.matchProgressType = MatchInProgressStatusType.Penalty;
        this.start();
        this.updateMatchProgressInServer(MatchInProgressStatusType.Penalty);
        this.cdr.detectChanges();
        
        Swal.fire({
          title: 'Tanda de penales iniciada',
          text: 'El partido ahora está en definición por penales',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  /**
   * Inicia el primer tiempo de prórroga
   */
  startExtraFirstTime(): void {
    Swal.fire({
      title: '¿Iniciar primer tiempo de prórroga?',
      text: 'Se continuará con el tiempo extra',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, iniciar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.matchProgressType = MatchInProgressStatusType.ExtraFirstTime;
        this.start();
        this.updateMatchProgressInServer(MatchInProgressStatusType.ExtraFirstTime);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Finaliza el primer tiempo de prórroga
   */
  endExtraFirstTime(): void {
    Swal.fire({
      title: '¿Finalizar primer tiempo de prórroga?',
      text: 'Se detendrá el cronómetro',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.matchProgressType = MatchInProgressStatusType.HalfFirstExtraTime;
        this.pause();
        this.updateMatchProgressInServer(MatchInProgressStatusType.HalfFirstExtraTime);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Inicia el segundo tiempo de prórroga
   */
  startExtraSecondTime(): void {
    Swal.fire({
      title: '¿Iniciar segundo tiempo de prórroga?',
      text: 'Se continuará con el segundo tiempo extra',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, iniciar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.matchProgressType = MatchInProgressStatusType.ExtraSecondTime;
        this.start();
        this.updateMatchProgressInServer(MatchInProgressStatusType.ExtraSecondTime);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Finaliza el segundo tiempo de prórroga
   */
  endExtraSecondTime(): void {
    Swal.fire({
      title: '¿Finalizar segundo tiempo de prórroga?',
      text: 'Se detendrá el cronómetro',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.matchProgressType = MatchInProgressStatusType.HalfPenalties;
        this.pause();
        this.updateMatchProgressInServer(MatchInProgressStatusType.HalfPenalties);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Inicia la tanda de penales
   */
  startPenalties(): void {
    Swal.fire({
      title: '¿Iniciar tanda de penales?',
      text: 'Se procederá con la definición por penales',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, iniciar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.matchProgressType = MatchInProgressStatusType.Penalty;
        this.start();
        this.updateMatchProgressInServer(MatchInProgressStatusType.Penalty);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Termina la tanda de penales
   */
  endPenalties(): void {
    Swal.fire({
      title: '¿Terminar tanda de penales?',
      text: 'Se finalizará la tanda de penales. El partido quedará listo para finalizar.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, terminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pause();
        this.cdr.detectChanges();
        
        Swal.fire({
          title: 'Tanda de penales finalizada',
          text: 'Ahora puedes finalizar el partido',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  /**
   * Inicia el cronómetro persistente
   */
  start(autoResume = false) {
    if (this.isRunning && !autoResume) return;

    this.isRunning = true;
    
    // Solo actualizar lastStartTime si NO es un autoResume
    // En autoResume, lastStartTime ya fue actualizado en loadTimerState()
    if (!autoResume) {
      this.lastStartTime = Date.now();
    }
    
    this.saveState();

    this.stopInterval();
    this.intervalId = setInterval(() => {
      this.elapsedSeconds++;
      this.updateMatchTime();
      this.saveState();
      this.cdr.detectChanges();
    }, 1000);
  }

  /**
   * Pausa el cronómetro persistente
   */
  pause() {
    this.isRunning = false;
    this.stopInterval();
    this.saveState();
  }

  /**
   * Reinicia el cronómetro
   */
  reset() {
    this.elapsedSeconds = 0;
    this.isRunning = false;
    this.stopInterval();
    this.updateMatchTime();
    
    // Eliminar el estado guardado para este partido
    if (this.matchId) {
      const key = `timerState_${this.matchId}`;
      localStorage.removeItem(key);
    }
    
    this.cdr.detectChanges();
  }

  /**
   * Detiene el intervalo del cronómetro
   */
  private stopInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Guarda el estado del cronómetro en localStorage asociado al matchId
   */
  private saveState() {
    if (!this.matchId) return;
    
    const key = `timerState_${this.matchId}`;
    localStorage.setItem(key, JSON.stringify({
      matchId: this.matchId,
      startTime: this.isRunning ? this.lastStartTime : null,
      elapsedSeconds: this.elapsedSeconds,
      isRunning: this.isRunning,
      matchProgressType: this.matchProgressType
    }));
  }

  /**
   * Carga el estado del cronómetro desde localStorage para el partido actual
   */
  private loadTimerState() {
    if (!this.matchId) return;

    const key = `timerState_${this.matchId}`;
    const savedState = localStorage.getItem(key);
    
    if (savedState) {
      const { matchId, startTime, elapsedSeconds, isRunning, matchProgressType } = JSON.parse(savedState);

      // Verificar que el estado sea del partido correcto
      if (matchId === this.matchId) {
        this.elapsedSeconds = elapsedSeconds;
        this.isRunning = isRunning;
        this.matchProgressType = matchProgressType;
        
        // Si estaba corriendo, recalcular cuánto tiempo pasó mientras la app no estaba abierta
        if (isRunning && startTime) {
          const now = Date.now();
          const diff = Math.floor((now - startTime) / 1000);
          this.elapsedSeconds += diff;
          // Actualizar lastStartTime al momento actual para evitar duplicación
          this.lastStartTime = now;
          this.start(true);
        } else {
          this.lastStartTime = startTime;
        }
        
        this.updateMatchTime();
        this.cdr.detectChanges();
      }
    }
  }

  /**
   * Actualiza el tiempo del partido en formato MM:SS
   */
  private updateMatchTime(): void {
    const minutes = Math.floor(this.elapsedSeconds / 60);
    const seconds = this.elapsedSeconds % 60;
    this.matchTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Obtiene el tiempo formateado
   */
  get formattedTime() {
    const minutes = Math.floor(this.elapsedSeconds / 60);
    const seconds = this.elapsedSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Finaliza el partido
   */
  finishMatch(): void {
    Swal.fire({
      title: '¿Finalizar partido?',
      text: 'Se guardará el resultado final y no podrás hacer más cambios',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        // Mostrar loading
        Swal.fire({
          title: 'Finalizando partido...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Llamar al API para finalizar partido
        this.vocaliaService.finishMatch(this.matchId!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire({
                title: '¡Partido finalizado!',
                text: 'El resultado ha sido guardado correctamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              }).then(() => {
                this.router.navigate(['/matches']);
              });
            },
            error: (error) => {
              console.error('Error finishing match:', error);
              Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudo finalizar el partido',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
            }
          });
      }
    });
  }

  /**
   * Obtiene el minuto actual del partido
   */
  private getCurrentMinute(): number {
    return Math.floor(this.elapsedSeconds / 60);
  }

  /**
   * TrackBy para jugadores
   */
  trackByPlayerId(index: number, player: Player): number {
    return player.id;
  }

  /**
   * TrackBy para incidencias
   */
  trackByIncidentIndex(index: number): number {
    return index;
  }

  /**
   * Obtiene la clase CSS para el tipo de incidencia
   */
  getIncidentTypeClass(type: MatchEventType): string {
    switch (type) {
      case MatchEventType.Goal:
        return 'goal';
      case MatchEventType.YellowCard:
        return 'yellow';
      case MatchEventType.DoubleYellowCard:
      case MatchEventType.RedCard:
        return 'red';
      case MatchEventType.Substitution:
        return 'substitution';
      case MatchEventType.Injury:
        return 'injury';
      case MatchEventType.PenaltyMissed:
        return 'penalty';
      case MatchEventType.Other:
      case MatchEventType.InMatch:
      default:
        return 'other';
    }
  }
}
