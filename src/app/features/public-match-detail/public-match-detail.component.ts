import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, finalize } from 'rxjs';
import { PublicLoadingComponent } from '../../shared/components/public-loading/public-loading.component';
import { PublicMatchDetailService } from './services/public-match-detail.service';
import { MatchStatusType } from '../../core/services/match.service';
import { SignalRService, MatchUpdateData } from '../../core/services/signalr.service';
import { 
  PublicMatchDetailResponse, 
  MatchInfo, 
  MatchEvent as ApiMatchEvent, 
  MatchEventType,
  MatchStatistics,
  TeamLineUp 
} from './models/match-detail.interface';
import { MatchInProgressStatusType } from '@core/services/vocalia.service';

interface Team {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string;
}

interface Player {
  id: number;
  name: string;
  jerseyNumber: number;
  position: string;
  x?: number; // Posición X en el campo (0-100)
  y?: number; // Posición Y en el campo (0-100)
}

interface MatchEvent {
  minute: number;
  type: MatchEventType;
  isHomeTeam: boolean; // Indica si el evento pertenece al equipo local o visitante. En el API, se usa el booleano isHomeTam: boolean;
  description: string; 
  isPenalty?: boolean;
}

interface MatchStats {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
  offsides: { home: number; away: number };
  substitutions: { home: number; away: number };
}

interface StatRow {
  label: string;
  homeValue: number;
  awayValue: number;
  homePercentage: number;
  awayPercentage: number;
}

interface Match {
  id: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  date: Date;
  venue: string | null;
  matchday: number | null;
  status: MatchStatusType;
  homeFormation: string | null;
  awayFormation: string | null;
  homeLineup: Player[];
  awayLineup: Player[];
  events: MatchEvent[];
  stats: MatchStats;
  progressStatus? : MatchInProgressStatusType;
}

/**
 * Componente para mostrar el detalle completo de un partido
 */
@Component({
  selector: 'app-public-match-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    PublicLoadingComponent    
  ],
  templateUrl: './public-match-detail.component.html',
  styleUrls: ['./public-match-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicMatchDetailComponent implements OnInit, OnDestroy {
  match: Match | null = null;
  matchId: number = 0;
  isLoading = false;
  statsRows: StatRow[] = [];
  cardStatsRows: StatRow[] = [];
  
  // Propiedades para la nueva estructura
  lineups: any = null;
  events: MatchEvent[] = [];
  
  // Control de visualización de estado
  hasValidStatus = false;
  matchProgressType: MatchInProgressStatusType | null = null;
    // Enum para usar en el template
  MatchInProgressStatusType = MatchInProgressStatusType;
  MatchStatusType = MatchStatusType;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private publicMatchDetailService: PublicMatchDetailService,
    private signalRService: SignalRService
  ) {
    // Inicializar datos por defecto para mostrar la vista mientras carga
    this.initializeDefaultData();
  }

  ngOnInit(): void {
    // Obtener matchId de la ruta
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('matchId');
        if (id) {
          this.matchId = +id;
          this.loadMatchDetail();
          this.initializeSignalR();
        }
      });
  }

  ngOnDestroy(): void {
    // Salir del grupo de SignalR antes de destruir el componente
    if (this.matchId) {
      this.signalRService.leaveMatchGroup(this.matchId).catch(err => {
        console.error('Error al salir del grupo:', err);
      });
    }
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa la conexión de SignalR y se suscribe a las actualizaciones
   */
  private initializeSignalR(): void {
    // Conectar a SignalR
    this.signalRService.startConnection()
      .then(() => {
        // Unirse al grupo del partido
        return this.signalRService.joinMatchGroup(this.matchId);
      })
      .then(() => {
        console.log('Conectado a SignalR y unido al grupo del partido');
        
        // Suscribirse a las actualizaciones del partido
        this.signalRService.matchUpdate$
          .pipe(takeUntil(this.destroy$))
          .subscribe((data: MatchUpdateData) => {
            // Verificar que la actualización es para este partido
            if (data.matchId === this.matchId) {
              console.log('Actualización en tiempo real recibida:', data);
              this.processMatchDataFromSignalR(data);
            }
          });
      })
      .catch(err => {
        console.error('Error al inicializar SignalR:', err);
        // No mostrar error al usuario, el partido seguirá funcionando sin actualizaciones en tiempo real
      });
  }

  /**
   * Procesa los datos del partido recibidos desde SignalR
   * Usa la misma estructura que getPublicMatchDetail
   */
  private processMatchDataFromSignalR(data: MatchUpdateData): void {
    // Crear el objeto result con la misma estructura que el API
    const result = {
      matchInfo: data.matchInfo,
      homeTeamLineUp: data.homeTeamLineUp,
      awayTeamLineUp: data.awayTeamLineUp,
      events: data.events,
      statistics: data.statistics,
      progressStatus: data.progressStatus
    };

    // Reutilizar el método existente de procesamiento
    this.processMatchData(result);
    
    // Forzar detección de cambios para actualizar la vista
    this.cdr.detectChanges();
  }

  /**
   * Inicializa datos por defecto para mostrar la vista mientras carga
   */
  private initializeDefaultData(): void {
    // Los datos por defecto no tienen estado válido del API
    this.hasValidStatus = false;
    // Crear match por defecto con imágenes por defecto
    this.match = {
      id: 0,
      homeTeam: {
        id: 1,
        name: 'Equipo Local',
        shortName: 'LOC',
        logoUrl: 'assets/logo.png'
      },
      awayTeam: {
        id: 2,
        name: 'Equipo Visitante',
        shortName: 'VIS',
        logoUrl: 'assets/logo.png'
      },
      homeScore: 0,
      awayScore: 0,
      date: new Date(),
      venue: null,
      matchday: null,
      status: MatchStatusType.scheduled,
      homeFormation: null,
      awayFormation: null,
      homeLineup: [],
      awayLineup: [],
      events: [],
      stats: {
        possession: { home: 0, away: 0 },
        shots: { home: 0, away: 0 },
        shotsOnTarget: { home: 0, away: 0 },
        corners: { home: 0, away: 0 },
        fouls: { home: 0, away: 0 },
        yellowCards: { home: 0, away: 0 },
        redCards: { home: 0, away: 0 },
        offsides: { home: 0, away: 0 },
        substitutions: { home: 0, away: 0 }
      }
    };

    // Inicializar estadísticas vacías
    this.statsRows = [];
    this.cardStatsRows = [];
    
    // Inicializar alineaciones vacías
    this.lineups = {
      home: {
        formation: '',
        startingXI: [],
        substitutes: []
      },
      away: {
        formation: '',
        startingXI: [],
        substitutes: []
      }
    };
    
    // Inicializar eventos vacíos
    this.events = [];
  }

  /**
   * Carga los detalles del partido desde el API
   */
  private loadMatchDetail(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.publicMatchDetailService.getPublicMatchDetail(this.matchId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response: PublicMatchDetailResponse) => {
          if (response.succeed && response.result) {
            this.processMatchData(response.result);
          }
        },
        error: (error) => {
          console.error('Error loading match detail:', error);
          // En caso de error, mantener los datos por defecto ya inicializados
        }
      });
  }

  /**
   * Procesa los datos del partido desde el API
   */
  private processMatchData(result: any): void {
    const matchInfo = result.matchInfo;
    
    // Crear objeto match compatible con la estructura actual
    this.match = {
      id: this.matchId,
      progressStatus: result.progressStatus,
      homeTeam: {
        id: 1,
        name: matchInfo.homeTeamName,
        shortName: matchInfo.homeTeamName.substring(0, 3).toUpperCase(),
        logoUrl: matchInfo.homeTeamLogoUrl || 'assets/team-placeholder.png'
      },
      awayTeam: {
        id: 2,
        name: matchInfo.awayTeamName,
        shortName: matchInfo.awayTeamName.substring(0, 3).toUpperCase(),
        logoUrl: matchInfo.awayTeamLogoUrl || 'assets/team-placeholder.png'
      },
      homeScore: matchInfo.homeScore,
      awayScore: matchInfo.awayScore,
      date: new Date(matchInfo.matchDate),
      venue: matchInfo.venue || null, // Solo mostrar si viene del API
      matchday: parseInt(matchInfo.matchDayName.replace(/\D/g, '')) || null,
      status: this.determineMatchStatus(matchInfo),
      homeFormation: matchInfo.homeFormation || null, // Solo mostrar si viene del API
      awayFormation: matchInfo.awayFormation || null, // Solo mostrar si viene del API
      homeLineup: this.processLineup(result.homeTeamLineUp, 'home'),
      awayLineup: this.processLineup(result.awayTeamLineUp, 'away'),
      events: this.processEvents(result.events),
      stats: this.processStatistics(result.statistics)
    };

    // Calcular estadísticas para la vista
    this.statsRows = this.calculateStatsRows(this.match.stats);
    this.cardStatsRows = this.calculateCardStatsRows(this.match.stats);
    
    // Inicializar propiedades para la nueva estructura
    this.events = this.match.events;
    this.lineups = {
      home: {
        formation: this.match.homeFormation,
        startingXI: this.match.homeLineup.slice(0, 11).map(player => ({
          number: player.jerseyNumber,
          name: player.name,
          position: player.position
        })),
        substitutes: this.match.homeLineup.slice(11).map(player => ({
          number: player.jerseyNumber,
          name: player.name,
          position: player.position
        }))
      },
      away: {
        formation: this.match.awayFormation,
        startingXI: this.match.awayLineup.slice(0, 11).map(player => ({
          number: player.jerseyNumber,
          name: player.name,
          position: player.position
        })),
        substitutes: this.match.awayLineup.slice(11).map(player => ({
          number: player.jerseyNumber,
          name: player.name,
          position: player.position
        }))
      }
    };
  }

  /**
   * Determina el estado del partido basado en la información
   */
  private determineMatchStatus(matchInfo: any): MatchStatusType {
    // Si el API proporciona el status directamente, usarlo y marcarlo como válido
    if (matchInfo.status !== undefined && matchInfo.status !== null) {
      this.hasValidStatus = true;
      return matchInfo.status as MatchStatusType;
    }
    
    // Si no viene del API, no mostrar estado (marcar como inválido)
    this.hasValidStatus = false;
    
    // Retornar un valor por defecto pero que no se mostrará
    return MatchStatusType.scheduled;
  }

  /**
   * Procesa la alineación desde el API
   */
  private processLineup(teamLineUp: TeamLineUp, team: 'home' | 'away'): Player[] {
    const lineup: Player[] = [];
    
    if (teamLineUp && teamLineUp.players && teamLineUp.players.length > 0) {
      teamLineUp.players.forEach((player, index) => {
        lineup.push({
          id: index + 1,
          name: player.name,
          jerseyNumber: index + 1,
          position: player.position,
          x: 0,
          y: 0
        });
      });
    }
    
    // Si no hay jugadores, devolver array vacío para mostrar solo el logo
    return lineup;
  }

  /**
   * Procesa los eventos desde el API
   */
  private processEvents(apiEvents: ApiMatchEvent[]): MatchEvent[] {
    if (!apiEvents) return [];
    
    return apiEvents.map(event => ({
      minute: event.minute,
      type: event.type,
      isHomeTeam: event.isHomeTeam,
      description: event.description,
      isPenalty: event.isPenalty
    }));
  }

  /**
   * Mapea el tipo de evento del API al tipo local
   */
  public mapEventType(apiType: MatchEventType){
    switch (apiType) {
      case MatchEventType.InMatch:
        return 'other';
      case MatchEventType.Goal:
        return 'goal';
      case MatchEventType.YellowCard:
        return 'yellow_card';
      case MatchEventType.DoubleYellowCard:
        return 'red_card'; // Doble amarilla se considera como roja
      case MatchEventType.RedCard:
        return 'red_card';
      case MatchEventType.Substitution:
        return 'substitution';
      case MatchEventType.Injury:
        return 'injury';
      case MatchEventType.PenaltyMissed:
        return 'penalty_missed';
      case MatchEventType.Other:
        return 'other';
      default:
        return 'other';
    }
  }

  /**
   * Procesa las estadísticas desde el API
   */
  private processStatistics(apiStats: MatchStatistics): MatchStats {
    return {
      possession: { home: 50, away: 50 }, // No viene en el API
      shots: { home: 0, away: 0 }, // No viene en el API
      shotsOnTarget: { home: 0, away: 0 }, // No viene en el API
      corners: { home: 0, away: 0 }, // No viene en el API
      fouls: { home: 0, away: 0 }, // No viene en el API
      yellowCards: { home: apiStats.homeTeamYellowCards, away: apiStats.awayTeamYellowCards },
      redCards: { home: apiStats.homeTeamRedCards, away: apiStats.awayTeamRedCards },
      offsides: { home: 0, away: 0 }, // No viene en el API
      substitutions: { home: apiStats.homeTeamSubstitution || 0, away: apiStats.awayTeamSubstitution || 0 }
    };
  }

  


  /**
   * Calcula las filas de estadísticas con porcentajes
   */
  private calculateStatsRows(stats: MatchStats): StatRow[] {
    const rows: StatRow[] = [];

    Object.keys(stats).forEach(key => {
      const stat = stats[key as keyof MatchStats];
      const total = stat.home + stat.away;
      const homePercentage = total > 0 ? (stat.home / total) * 100 : 50;
      const awayPercentage = total > 0 ? (stat.away / total) * 100 : 50;

      rows.push({
        label: this.getStatLabel(key),
        homeValue: stat.home,
        awayValue: stat.away,
        homePercentage,
        awayPercentage
      });
    });

    return rows;
  }

  /**
   * Calcula las estadísticas del header (tarjetas y sustituciones)
   */
  private calculateCardStatsRows(stats: MatchStats): StatRow[] {
    const rows: StatRow[] = [];
    const cardKeys = ['yellowCards', 'redCards', 'substitutions'];

    cardKeys.forEach(key => {
      const stat = stats[key as keyof MatchStats];
      const total = stat.home + stat.away;
      const homePercentage = total > 0 ? (stat.home / total) * 100 : 50;
      const awayPercentage = total > 0 ? (stat.away / total) * 100 : 50;

      rows.push({
        label: this.getStatLabel(key),
        homeValue: stat.home,
        awayValue: stat.away,
        homePercentage,
        awayPercentage
      });
    });

    return rows;
  }

  /**
   * Obtiene el label de la estadística
   */
  private getStatLabel(key: string): string {
    const labels: { [key: string]: string } = {
      possession: 'Posesión',
      shots: 'Tiros',
      shotsOnTarget: 'Tiros a Puerta',
      corners: 'Corners',
      fouls: 'Faltas',
      yellowCards: 'Tarjetas Amarillas',
      redCards: 'Tarjetas Rojas',
      offsides: 'Fuera de Juego',
      substitutions: 'Cambios'
    };
    return labels[key] || key;
  }

  /**
   * Formatea la fecha en español
   */
  getFormattedDate(date: Date): string {
    if (!date) return 'Fecha por definir';
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return new Intl.DateTimeFormat('es-ES', options).format(new Date(date));
  }

  /**
   * Formatea la hora en español
   */
  getFormattedTime(date: Date): string {
    if (!date) return 'Hora por definir';
    
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    
    return new Intl.DateTimeFormat('es-ES', options).format(new Date(date));
  }

  /**
   * Obtiene el icono del evento
   */
  getEventIcon(type: MatchEventType): string {
    switch (type) {
      case MatchEventType.Goal:
        return 'sports_soccer';
      case MatchEventType.YellowCard:
        return 'square';
      case MatchEventType.RedCard:
        return 'square';
      case MatchEventType.Substitution:
        return 'swap_horiz';
      case MatchEventType.Injury:
        return 'medical_services';
      case MatchEventType.PenaltyMissed:
        return 'cancel';
      case MatchEventType.Other:
      case MatchEventType.InMatch:
      default:
        return 'info';
    }
  }

  /**
   * Obtiene la clase CSS del evento
   */
  getEventClass(type: string): string {
    return `event-${type}`;
  }

  /**
   * Navega hacia atrás
   */
  goBack(): void {
    this.router.navigate(['/public-fixture', 1]); // TODO: Usar tournamentId real
  }

  /**
   * Verifica si el estado del partido debe mostrarse
   */
  shouldShowMatchStatus(): boolean {
    return this.match !== null && this.hasValidStatus;
  }

  /**
   * Obtiene el estado del partido basado en MatchStatusType
   */
  getMatchStatus(): string {
    if (!this.match || !this.hasValidStatus) return '';
    
    switch (this.match.status) {
      case MatchStatusType.scheduled:
        return 'PROGRAMADO';
      case MatchStatusType.inProgress:
        return 'EN VIVO';
      case MatchStatusType.played:
        return 'JUGADO';
      case MatchStatusType.canceled:
        return 'CANCELADO ELIMINADO';
      case MatchStatusType.postponed:
        return 'POSTERGADO';
      default:
        return 'DESCONOCIDO';
    }
  }

  /**
   * Obtiene la clase CSS del estado basada en MatchStatusType
   */
  getStatusClass(): string {
    if (!this.match) return '';
    
    switch (this.match.status) {
      case MatchStatusType.scheduled:
        return 'status-scheduled';
      case MatchStatusType.inProgress:
        return 'status-live';
      case MatchStatusType.played:
        return 'status-completed';
      case MatchStatusType.canceled:
        return 'status-cancelled';
      case MatchStatusType.postponed:
        return 'status-postponed';
      default:
        return 'status-unknown';
    }
  }

  /**
   * Obtiene el ícono correspondiente a la posición del jugador
   * @param position Posición del jugador
   * @returns Nombre del ícono de Material Design
   */
  getPositionIcon(position: string): string {
    if (!position) return 'person';
    
    const pos = position.toUpperCase();
    
    // Porteros
    if (pos.includes('GK') || pos.includes('POR') || pos.includes('PORTERO')) {
      return 'sports_handball';
    }
    
    // Defensas
    if (pos.includes('DF') || pos.includes('DEF') || pos.includes('CB') || 
        pos.includes('LB') || pos.includes('RB') || pos.includes('LWB') || 
        pos.includes('RWB') || pos.includes('DEFENSA')) {
      return 'shield';
    }
    
    // Mediocampistas
    if (pos.includes('MF') || pos.includes('MED') || pos.includes('CM') || 
        pos.includes('CDM') || pos.includes('CAM') || pos.includes('LM') || 
        pos.includes('RM') || pos.includes('MEDIO')) {
      return 'adjust';
    }
    
    // Delanteros
    if (pos.includes('FW') || pos.includes('DEL') || pos.includes('ST') || 
        pos.includes('CF') || pos.includes('LW') || pos.includes('RW') || 
        pos.includes('DELANTERO') || pos.includes('ATACANTE')) {
      return 'sports_soccer';
    }
    
    // Por defecto
    return 'person';
  }

  /**
   * Obtiene el texto completo de la posición para el tooltip
   * @param position Posición del jugador
   * @returns Texto descriptivo de la posición
   */
  getPositionTooltip(position: string): string {
    if (!position) return 'Jugador';
    
    const pos = position.toUpperCase();
    
    // Porteros
    if (pos.includes('GK') || pos.includes('POR')) return 'Portero';
    
    // Defensas
    if (pos.includes('CB')) return 'Defensa Central';
    if (pos.includes('LB')) return 'Lateral Izquierdo';
    if (pos.includes('RB')) return 'Lateral Derecho';
    if (pos.includes('LWB')) return 'Carrilero Izquierdo';
    if (pos.includes('RWB')) return 'Carrilero Derecho';
    if (pos.includes('DF') || pos.includes('DEF')) return 'Defensa';
    
    // Mediocampistas
    if (pos.includes('CDM')) return 'Mediocampista Defensivo';
    if (pos.includes('CM')) return 'Mediocampista Central';
    if (pos.includes('CAM')) return 'Mediocampista Ofensivo';
    if (pos.includes('LM')) return 'Mediocampista Izquierdo';
    if (pos.includes('RM')) return 'Mediocampista Derecho';
    if (pos.includes('MF') || pos.includes('MED')) return 'Mediocampista';
    
    // Delanteros
    if (pos.includes('ST')) return 'Delantero Centro';
    if (pos.includes('CF')) return 'Centrodelantero';
    if (pos.includes('LW')) return 'Extremo Izquierdo';
    if (pos.includes('RW')) return 'Extremo Derecho';
    if (pos.includes('FW') || pos.includes('DEL')) return 'Delantero';
    
    // Retornar la posición original si no coincide con ningún patrón
    return position;
  }
}
