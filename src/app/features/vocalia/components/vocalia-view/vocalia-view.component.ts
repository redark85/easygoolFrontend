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
import { Subject, takeUntil, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { VocaliaService, VocaliaPlayer, AvailablePlayer, MatchEventType, RegisterMatchEventRequest, MatchEvent } from '@core/services/vocalia.service';

interface Player {
  id: number;
  number: number;
  name: string;
  goals: number;
  yellowCards: number;
  redCards: number;
}

interface MatchIncident {
  minute: number;
  type: 'goal' | 'yellow' | 'red' | 'substitution';
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
    MatProgressSpinnerModule
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
      this.matchId = params['id'] ? +params['id'] : null;
      if (this.matchId) {
        this.loadMatchData(this.matchId);
      }
    });
  }

  ngOnDestroy(): void {
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
            this.router.navigate(['/matches']);
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
      redCards: 0
    };
  }

  /**
   * Convierte un evento del API al formato interno
   */
  private convertToIncident(apiEvent: any): MatchIncident {
    // Determinar el tipo basado en el type del API
    let type: 'goal' | 'yellow' | 'red' | 'substitution' = 'substitution';
    if (apiEvent.type === 1) type = 'goal';
    else if (apiEvent.type === 2) type = 'yellow';
    else if (apiEvent.type === 3 || apiEvent.type === 4) type = 'red';

    return {
      minute: apiEvent.minute,
      type: type,
      player: '',
      team: '',
      description: apiEvent.description
    };
  }

  /**
   * Registra un gol
   */
  addGoal(player: Player, team: 'home' | 'away'): void {
    player.goals++;
    if (team === 'home') {
      this.homeScore++;
    } else {
      this.awayScore++;
    }
    
    const teamName = team === 'home' ? this.homeTeam : this.awayTeam;
    this.incidents.unshift({
      minute: this.getCurrentMinute(),
      type: 'goal',
      player: `#${player.number} ${player.name}`,
      team: teamName,
      description: `Gol de #${player.number} ${player.name} (${teamName})`
    });
  }

  /**
   * Registra una tarjeta amarilla
   */
  addYellowCard(player: Player, team: 'home' | 'away'): void {
    player.yellowCards++;
    
    const teamName = team === 'home' ? this.homeTeam : this.awayTeam;
    this.incidents.unshift({
      minute: this.getCurrentMinute(),
      type: 'yellow',
      player: `#${player.number} ${player.name}`,
      team: teamName,
      description: `Tarjeta amarilla para #${player.number} ${player.name} (${teamName})`
    });
  }

  /**
   * Registra una tarjeta roja
   */
  addRedCard(player: Player, team: 'home' | 'away'): void {
    player.redCards++;
    
    const teamName = team === 'home' ? this.homeTeam : this.awayTeam;
    this.incidents.unshift({
      minute: this.getCurrentMinute(),
      type: 'red',
      player: `#${player.number} ${player.name}`,
      team: teamName,
      description: `Tarjeta roja para #${player.number} ${player.name} (${teamName})`
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
    this.vocaliaService.getAvailablePlayers(phaseTeamId, this.tournamentId)
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
        const events: MatchEvent[] = addedPlayers.map(player => ({
          tournamentTeamPlayerId: player.id,
          eventType: MatchEventType.InMatch,
          minute: 0,
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
              // Agregar jugadores a la lista local
              if (team === 'home') {
                this.homeTeamPlayers.push(...addedPlayers);
                this.filterPlayers('home');
              } else {
                this.awayTeamPlayers.push(...addedPlayers);
                this.filterPlayers('away');
              }
              
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
          type: 'substitution', // Tipo genérico para incidencias personalizadas
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
        // TODO: Implementar llamada al API para finalizar partido
        Swal.fire({
          title: '¡Partido finalizado!',
          text: 'El resultado ha sido guardado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/matches']);
        });
      }
    });
  }

  /**
   * Obtiene el minuto actual del partido
   */
  private getCurrentMinute(): number {
    // TODO: Implementar lógica real del cronómetro
    return Math.floor(Math.random() * 90) + 1;
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
}
