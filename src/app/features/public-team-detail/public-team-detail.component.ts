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
import { Subject, takeUntil } from 'rxjs';

interface Player {
  id: number;
  name: string;
  jerseyNumber: number;
  position: string;
  photoUrl: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
}

interface Match {
  id: number;
  opponent: string;
  opponentLogo: string;
  date: Date;
  isHome: boolean;
  score?: string;
  result?: 'W' | 'D' | 'L';
  status: 'upcoming' | 'finished';
}

interface Team {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string;
  motto: string;
  position: number;
  points: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  totalPlayers: number;
  coach: string;
  stadium: string;
  founded: number;
  lastFiveResults: ('W' | 'D' | 'L')[];
  players: Player[];
  upcomingMatches: Match[];
  pastMatches: Match[];
}

interface Position {
  value: string;
  name: string;
}

/**
 * Componente para mostrar el detalle completo de un equipo
 */
@Component({
  selector: 'app-public-team-detail',
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
    MatTooltipModule
  ],
  templateUrl: './public-team-detail.component.html',
  styleUrls: ['./public-team-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicTeamDetailComponent implements OnInit, OnDestroy {
  team: Team | null = null;
  teamId: number = 0;
  isLoading = false;

  positions: Position[] = [
    { value: 'GK', name: 'Porteros' },
    { value: 'DEF', name: 'Defensas' },
    { value: 'MID', name: 'Mediocampistas' },
    { value: 'FWD', name: 'Delanteros' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Obtener teamId de la ruta
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('teamId');
        if (id) {
          this.teamId = +id;
          this.loadTeamDetail();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los detalles del equipo
   */
  private loadTeamDetail(): void {
    this.isLoading = true;
    
    // TODO: Cargar desde API
    // Por ahora usar datos dummy
    this.loadDummyTeam();
    
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  /**
   * Carga datos dummy del equipo
   */
  private loadDummyTeam(): void {
    this.team = {
      id: this.teamId,
      name: 'Real Madrid',
      shortName: 'RMA',
      logoUrl: 'assets/team-placeholder.png',
      motto: 'Hala Madrid',
      position: 1,
      points: 68,
      matchesPlayed: 25,
      wins: 21,
      draws: 5,
      losses: 4,
      goalsFor: 65,
      goalsAgainst: 28,
      goalDifference: 37,
      totalPlayers: 25,
      coach: 'Carlo Ancelotti',
      stadium: 'Santiago Bernabéu',
      founded: 1902,
      lastFiveResults: ['W', 'W', 'D', 'W', 'L'],
      players: this.generateDummyPlayers(),
      upcomingMatches: this.generateUpcomingMatches(),
      pastMatches: this.generatePastMatches()
    };
  }

  /**
   * Genera jugadores dummy
   */
  private generateDummyPlayers(): Player[] {
    const players: Player[] = [
      // Porteros
      { id: 1, name: 'Thibaut Courtois', jerseyNumber: 1, position: 'GK', photoUrl: 'assets/player-placeholder.png', goals: 0, assists: 0, yellowCards: 1, redCards: 0, matchesPlayed: 20 },
      { id: 2, name: 'Andriy Lunin', jerseyNumber: 13, position: 'GK', photoUrl: 'assets/player-placeholder.png', goals: 0, assists: 0, yellowCards: 0, redCards: 0, matchesPlayed: 5 },
      
      // Defensas
      { id: 3, name: 'Dani Carvajal', jerseyNumber: 2, position: 'DEF', photoUrl: 'assets/player-placeholder.png', goals: 2, assists: 4, yellowCards: 5, redCards: 0, matchesPlayed: 22 },
      { id: 4, name: 'Éder Militão', jerseyNumber: 3, position: 'DEF', photoUrl: 'assets/player-placeholder.png', goals: 3, assists: 1, yellowCards: 4, redCards: 0, matchesPlayed: 23 },
      { id: 5, name: 'David Alaba', jerseyNumber: 4, position: 'DEF', photoUrl: 'assets/player-placeholder.png', goals: 2, assists: 3, yellowCards: 3, redCards: 0, matchesPlayed: 20 },
      { id: 6, name: 'Ferland Mendy', jerseyNumber: 23, position: 'DEF', photoUrl: 'assets/player-placeholder.png', goals: 1, assists: 2, yellowCards: 2, redCards: 0, matchesPlayed: 18 },
      { id: 7, name: 'Antonio Rüdiger', jerseyNumber: 22, position: 'DEF', photoUrl: 'assets/player-placeholder.png', goals: 2, assists: 1, yellowCards: 6, redCards: 1, matchesPlayed: 24 },
      
      // Mediocampistas
      { id: 8, name: 'Luka Modrić', jerseyNumber: 10, position: 'MID', photoUrl: 'assets/player-placeholder.png', goals: 4, assists: 8, yellowCards: 3, redCards: 0, matchesPlayed: 23 },
      { id: 9, name: 'Toni Kroos', jerseyNumber: 8, position: 'MID', photoUrl: 'assets/player-placeholder.png', goals: 3, assists: 10, yellowCards: 2, redCards: 0, matchesPlayed: 24 },
      { id: 10, name: 'Federico Valverde', jerseyNumber: 15, position: 'MID', photoUrl: 'assets/player-placeholder.png', goals: 6, assists: 5, yellowCards: 4, redCards: 0, matchesPlayed: 25 },
      { id: 11, name: 'Eduardo Camavinga', jerseyNumber: 12, position: 'MID', photoUrl: 'assets/player-placeholder.png', goals: 2, assists: 3, yellowCards: 3, redCards: 0, matchesPlayed: 20 },
      { id: 12, name: 'Aurélien Tchouaméni', jerseyNumber: 18, position: 'MID', photoUrl: 'assets/player-placeholder.png', goals: 1, assists: 2, yellowCards: 5, redCards: 0, matchesPlayed: 22 },
      
      // Delanteros
      { id: 13, name: 'Karim Benzema', jerseyNumber: 9, position: 'FWD', photoUrl: 'assets/player-placeholder.png', goals: 22, assists: 8, yellowCards: 2, redCards: 0, matchesPlayed: 24 },
      { id: 14, name: 'Vinícius Jr', jerseyNumber: 7, position: 'FWD', photoUrl: 'assets/player-placeholder.png', goals: 18, assists: 12, yellowCards: 4, redCards: 0, matchesPlayed: 25 },
      { id: 15, name: 'Rodrygo', jerseyNumber: 11, position: 'FWD', photoUrl: 'assets/player-placeholder.png', goals: 12, assists: 7, yellowCards: 1, redCards: 0, matchesPlayed: 23 },
      { id: 16, name: 'Marco Asensio', jerseyNumber: 20, position: 'FWD', photoUrl: 'assets/player-placeholder.png', goals: 8, assists: 4, yellowCards: 2, redCards: 0, matchesPlayed: 18 }
    ];

    return players;
  }

  /**
   * Genera partidos próximos
   */
  private generateUpcomingMatches(): Match[] {
    return [
      { id: 1, opponent: 'Barcelona', opponentLogo: 'assets/team-placeholder.png', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), isHome: true, status: 'upcoming' },
      { id: 2, opponent: 'Atlético Madrid', opponentLogo: 'assets/team-placeholder.png', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), isHome: false, status: 'upcoming' },
      { id: 3, opponent: 'Sevilla FC', opponentLogo: 'assets/team-placeholder.png', date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), isHome: true, status: 'upcoming' }
    ];
  }

  /**
   * Genera partidos pasados
   */
  private generatePastMatches(): Match[] {
    return [
      { id: 4, opponent: 'Valencia CF', opponentLogo: 'assets/team-placeholder.png', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), isHome: true, score: '3-1', result: 'W', status: 'finished' },
      { id: 5, opponent: 'Real Betis', opponentLogo: 'assets/team-placeholder.png', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), isHome: false, score: '2-2', result: 'D', status: 'finished' },
      { id: 6, opponent: 'Athletic Bilbao', opponentLogo: 'assets/team-placeholder.png', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), isHome: true, score: '4-0', result: 'W', status: 'finished' },
      { id: 7, opponent: 'Villarreal CF', opponentLogo: 'assets/team-placeholder.png', date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), isHome: false, score: '1-2', result: 'L', status: 'finished' },
      { id: 8, opponent: 'Real Sociedad', opponentLogo: 'assets/team-placeholder.png', date: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000), isHome: true, score: '2-0', result: 'W', status: 'finished' }
    ];
  }

  /**
   * Obtiene jugadores por posición
   */
  getPlayersByPosition(position: string): Player[] {
    if (!this.team) return [];
    return this.team.players.filter(p => p.position === position);
  }

  /**
   * Obtiene la clase del resultado
   */
  getResultClass(result: string): string {
    return `result-${result.toLowerCase()}`;
  }

  /**
   * Obtiene el texto del resultado
   */
  getResultText(result: string): string {
    const texts: { [key: string]: string } = {
      W: 'V',
      D: 'E',
      L: 'D'
    };
    return texts[result] || result;
  }

  /**
   * Navega hacia atrás
   */
  goBack(): void {
    this.router.navigate(['/public-teams', 1]); // TODO: Usar tournamentId real
  }

  /**
   * Navega al detalle del partido
   */
  viewMatchDetail(matchId: number): void {
    this.router.navigate(['/public-match-detail', matchId]);
  }

  /**
   * Obtiene el porcentaje de victorias
   */
  getWinPercentage(): number {
    if (!this.team || this.team.matchesPlayed === 0) return 0;
    return (this.team.wins / this.team.matchesPlayed) * 100;
  }

  /**
   * Obtiene el promedio de goles por partido
   */
  getGoalsPerMatch(): number {
    if (!this.team || this.team.matchesPlayed === 0) return 0;
    return this.team.goalsFor / this.team.matchesPlayed;
  }
}
