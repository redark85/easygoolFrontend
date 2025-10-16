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
import { Subject, takeUntil, finalize } from 'rxjs';
import { PublicLoadingComponent } from '../../shared/components/public-loading/public-loading.component';
import { PublicMatchDetailService } from './services/public-match-detail.service';
import { 
  PublicMatchDetailResponse, 
  MatchInfo, 
  MatchEvent as ApiMatchEvent, 
  MatchEventType,
  MatchStatistics,
  TeamLineUp 
} from './models/match-detail.interface';

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
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'injury' | 'penalty_missed' | 'other';
  team: 'home' | 'away';
  player: string;
  assistedBy?: string;
  playerOut?: string;
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
  venue: string;
  matchday: number;
  status: 'upcoming' | 'live' | 'finished';
  homeFormation: string;
  awayFormation: string;
  homeLineup: Player[];
  awayLineup: Player[];
  events: MatchEvent[];
  stats: MatchStats;
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

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private publicMatchDetailService: PublicMatchDetailService
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
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa datos por defecto para mostrar la vista mientras carga
   */
  private initializeDefaultData(): void {
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
      venue: 'Estadio por definir',
      matchday: 1,
      status: 'upcoming',
      homeFormation: '',
      awayFormation: '',
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
        offsides: { home: 0, away: 0 }
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
      venue: 'Estadio', // No viene en el API, usar valor por defecto
      matchday: parseInt(matchInfo.matchDayName.replace(/\D/g, '')) || 1,
      status: this.determineMatchStatus(matchInfo),
      homeFormation: '', // No mostrar formación por defecto
      awayFormation: '', // No mostrar formación por defecto
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
  private determineMatchStatus(matchInfo: any): 'upcoming' | 'live' | 'finished' {
    const matchDate = new Date(matchInfo.matchDate);
    const now = new Date();
    
    if (matchInfo.homeScore > 0 || matchInfo.awayScore > 0) {
      return 'finished';
    } else if (matchDate <= now) {
      return 'live';
    } else {
      return 'upcoming';
    }
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
      type: this.mapEventType(event.type),
      team: Math.random() > 0.5 ? 'home' : 'away', // No viene en el API, asignar aleatoriamente
      player: event.description.split(' ')[0] || 'Jugador',
      assistedBy: event.type === MatchEventType.Goal ? 'Asistente' : undefined,
      playerOut: event.type === MatchEventType.Substitution ? 'Jugador saliente' : undefined
    }));
  }

  /**
   * Mapea el tipo de evento del API al tipo local
   */
  private mapEventType(apiType: number): 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'injury' | 'penalty_missed' | 'other' {
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
      offsides: { home: 0, away: 0 } // No viene en el API
    };
  }

  /**
   * Carga datos dummy del partido
   */
  private loadDummyMatch(): void {
    this.match = {
      id: this.matchId,
      homeTeam: {
        id: 1,
        name: 'Real Madrid',
        shortName: 'RMA',
        logoUrl: 'assets/team-placeholder.png'
      },
      awayTeam: {
        id: 2,
        name: 'Barcelona',
        shortName: 'BAR',
        logoUrl: 'assets/team-placeholder.png'
      },
      homeScore: 2,
      awayScore: 1,
      date: new Date('2024-10-15T20:00:00'),
      venue: 'Estadio Santiago Bernabéu',
      matchday: 10,
      status: 'finished',
      homeFormation: '4-3-3',
      awayFormation: '4-4-2',
      homeLineup: this.generateLineup('home', '4-3-3'),
      awayLineup: this.generateLineup('away', '4-4-2'),
      events: this.generateEvents(),
      stats: this.generateStats()
    };

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
   * Genera una alineación dummy
   */
  private generateLineup(team: 'home' | 'away', formation: string): Player[] {
    const positions = this.getFormationPositions(formation);
    const allNames = team === 'home' 
      ? ['Courtois', 'Carvajal', 'Militao', 'Alaba', 'Mendy', 'Modric', 'Casemiro', 'Kroos', 'Rodrygo', 'Benzema', 'Vinicius', 'Lunin', 'Nacho', 'Camavinga', 'Valverde', 'Asensio', 'Hazard', 'Mariano']
      : ['Ter Stegen', 'Dest', 'Piqué', 'Araujo', 'Alba', 'Busquets', 'De Jong', 'Pedri', 'Gavi', 'Lewandowski', 'Raphinha', 'Neto', 'García', 'Kessie', 'Torre', 'Ferran', 'Ansu Fati', 'Aubameyang'];

    const lineup: Player[] = [];
    
    // Titulares (primeros 11)
    positions.forEach((pos, index) => {
      lineup.push({
        id: index + 1,
        name: allNames[index],
        jerseyNumber: index + 1,
        position: pos.position,
        x: pos.x,
        y: pos.y
      });
    });
    
    // Suplentes (siguientes 7)
    for (let i = 11; i < Math.min(18, allNames.length); i++) {
      lineup.push({
        id: i + 1,
        name: allNames[i],
        jerseyNumber: i + 1,
        position: 'SUB',
        x: 0,
        y: 0
      });
    }

    return lineup;
  }

  /**
   * Obtiene las posiciones según la formación
   */
  private getFormationPositions(formation: string): { position: string; x: number; y: number }[] {
    const formations: { [key: string]: { position: string; x: number; y: number }[] } = {
      '4-3-3': [
        { position: 'GK', x: 50, y: 5 },
        { position: 'RB', x: 80, y: 20 }, { position: 'CB', x: 60, y: 20 }, { position: 'CB', x: 40, y: 20 }, { position: 'LB', x: 20, y: 20 },
        { position: 'CM', x: 65, y: 45 }, { position: 'CDM', x: 50, y: 40 }, { position: 'CM', x: 35, y: 45 },
        { position: 'RW', x: 75, y: 70 }, { position: 'ST', x: 50, y: 75 }, { position: 'LW', x: 25, y: 70 }
      ],
      '4-4-2': [
        { position: 'GK', x: 50, y: 5 },
        { position: 'RB', x: 80, y: 20 }, { position: 'CB', x: 60, y: 20 }, { position: 'CB', x: 40, y: 20 }, { position: 'LB', x: 20, y: 20 },
        { position: 'RM', x: 80, y: 50 }, { position: 'CM', x: 60, y: 45 }, { position: 'CM', x: 40, y: 45 }, { position: 'LM', x: 20, y: 50 },
        { position: 'ST', x: 60, y: 75 }, { position: 'ST', x: 40, y: 75 }
      ]
    };

    return formations[formation] || formations['4-3-3'];
  }

  /**
   * Genera eventos dummy del partido
   */
  private generateEvents(): MatchEvent[] {
    const events: MatchEvent[] = [
      { minute: 12, type: 'goal' as const, team: 'home' as const, player: 'Benzema', assistedBy: 'Vinicius' },
      { minute: 23, type: 'yellow_card' as const, team: 'away' as const, player: 'Busquets' },
      { minute: 34, type: 'goal' as const, team: 'away' as const, player: 'Lewandowski', assistedBy: 'Raphinha' },
      { minute: 45, type: 'substitution' as const, team: 'home' as const, player: 'Camavinga', playerOut: 'Casemiro' },
      { minute: 56, type: 'yellow_card' as const, team: 'home' as const, player: 'Carvajal' },
      { minute: 62, type: 'injury' as const, team: 'away' as const, player: 'Pedri' },
      { minute: 67, type: 'goal' as const, team: 'home' as const, player: 'Rodrygo', assistedBy: 'Modric' },
      { minute: 72, type: 'substitution' as const, team: 'away' as const, player: 'Ansu Fati', playerOut: 'Gavi' },
      { minute: 78, type: 'penalty_missed' as const, team: 'home' as const, player: 'Benzema' },
      { minute: 85, type: 'yellow_card' as const, team: 'away' as const, player: 'Araujo' },
      { minute: 90, type: 'red_card' as const, team: 'away' as const, player: 'Busquets' }
    ];
    return events.sort((a, b) => a.minute - b.minute);
  }

  /**
   * Genera estadísticas dummy
   */
  private generateStats(): MatchStats {
    return {
      possession: { home: 58, away: 42 },
      shots: { home: 15, away: 11 },
      shotsOnTarget: { home: 7, away: 5 },
      corners: { home: 6, away: 4 },
      fouls: { home: 12, away: 14 },
      yellowCards: { home: 2, away: 3 },
      redCards: { home: 0, away: 0 },
      offsides: { home: 3, away: 2 }
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
   * Calcula solo las estadísticas de tarjetas (amarillas y rojas)
   */
  private calculateCardStatsRows(stats: MatchStats): StatRow[] {
    const rows: StatRow[] = [];
    const cardKeys = ['yellowCards', 'redCards'];

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
      offsides: 'Fuera de Juego'
    };
    return labels[key] || key;
  }

  /**
   * Obtiene el icono del evento
   */
  getEventIcon(type: string): string {
    const icons: { [key: string]: string } = {
      goal: 'sports_soccer',
      yellow_card: 'square',
      red_card: 'square',
      substitution: 'swap_horiz',
      injury: 'medical_services',
      penalty_missed: 'cancel',
      other: 'info'
    };
    return icons[type] || 'info';
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
   * Obtiene el estado del partido
   */
  getMatchStatus(): string {
    if (!this.match) return '';
    
    const statuses: { [key: string]: string } = {
      upcoming: 'PRÓXIMO',
      live: 'EN VIVO',
      finished: 'FINALIZADO'
    };
    return statuses[this.match.status] || '';
  }

  /**
   * Obtiene la clase del estado
   */
  getStatusClass(): string {
    if (!this.match) return '';
    return `status-${this.match.status}`;
  }
}
