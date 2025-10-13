import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

interface Team {
  id: number;
  name: string;
  logoUrl: string;
}

interface Player {
  id: number;
  name: string;
  photoUrl: string;
  team: Team;
}

interface TopScorer {
  position: number;
  player: Player;
  goals: number;
  assists: number;
  matchesPlayed: number;
  goalsPerMatch: number;
  penaltyGoals: number;
}

interface MVPPlayer {
  position: number;
  player: Player;
  goals: number;
  assists: number;
  matchesPlayed: number;
  rating: number;
  motmAwards: number; // Man of the Match awards
}

interface CardPlayer {
  position: number;
  player: Player;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
  totalCards: number;
}

/**
 * Componente para mostrar las tablas de estadísticas de jugadores
 */
@Component({
  selector: 'app-public-top-scorers',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './public-top-scorers.component.html',
  styleUrls: ['./public-top-scorers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicTopScorersComponent implements OnInit, OnDestroy {
  // Datos
  topScorers: TopScorer[] = [];
  mvpPlayers: MVPPlayer[] = [];
  cardPlayers: CardPlayer[] = [];
  
  isLoading = false;
  tournamentId: number = 0;

  // Columnas de las tablas
  scorersColumns: string[] = ['position', 'player', 'goals', 'assists', 'matches', 'average'];
  mvpColumns: string[] = ['position', 'player', 'goals', 'assists', 'rating', 'motm'];
  cardsColumns: string[] = ['position', 'player', 'yellow', 'red', 'total', 'matches'];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Obtener tournamentId de la ruta
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('tournamentId');
        if (id) {
          this.tournamentId = +id;
          this.loadData();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos de las estadísticas
   */
  private loadData(): void {
    this.isLoading = true;
    
    // TODO: Cargar desde API
    // Por ahora usar datos dummy
    this.loadDummyData();
    
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  /**
   * Carga datos dummy
   */
  private loadDummyData(): void {
    // Generar equipos
    const teams: Team[] = [
      { id: 1, name: 'Real Madrid', logoUrl: 'assets/team-placeholder.png' },
      { id: 2, name: 'Barcelona', logoUrl: 'assets/team-placeholder.png' },
      { id: 3, name: 'Atlético Madrid', logoUrl: 'assets/team-placeholder.png' },
      { id: 4, name: 'Sevilla FC', logoUrl: 'assets/team-placeholder.png' },
      { id: 5, name: 'Valencia CF', logoUrl: 'assets/team-placeholder.png' }
    ];

    // Generar goleadores
    const playerNames = [
      'Karim Benzema', 'Robert Lewandowski', 'Antoine Griezmann',
      'Youssef En-Nesyri', 'Edinson Cavani', 'Vinicius Jr',
      'Pedri González', 'Álvaro Morata', 'Iago Aspas', 'Gerard Moreno'
    ];

    this.topScorers = playerNames.map((name, index) => {
      const goals = 25 - index * 2;
      const matchesPlayed = 20 + Math.floor(Math.random() * 5);
      
      return {
        position: index + 1,
        player: {
          id: index + 1,
          name,
          photoUrl: 'assets/player-placeholder.png',
          team: teams[index % teams.length]
        },
        goals,
        assists: Math.floor(Math.random() * 10) + 3,
        matchesPlayed,
        goalsPerMatch: goals / matchesPlayed,
        penaltyGoals: Math.floor(Math.random() * 5)
      };
    });

    // Generar MVP
    this.mvpPlayers = playerNames.map((name, index) => {
      const goals = 25 - index * 2;
      const assists = Math.floor(Math.random() * 15) + 5;
      
      return {
        position: index + 1,
        player: {
          id: index + 1,
          name,
          photoUrl: 'assets/player-placeholder.png',
          team: teams[index % teams.length]
        },
        goals,
        assists,
        matchesPlayed: 20 + Math.floor(Math.random() * 5),
        rating: 9.5 - index * 0.3,
        motmAwards: 10 - index
      };
    });

    // Generar tarjetas
    const cardPlayerNames = [
      'Sergio Ramos', 'Casemiro', 'Diego Costa',
      'Sergio Busquets', 'Raúl García', 'José Giménez',
      'Marcos Llorente', 'Thomas Partey', 'Dani Carvajal', 'Jordi Alba'
    ];

    this.cardPlayers = cardPlayerNames.map((name, index) => {
      const yellowCards = 12 - index;
      const redCards = Math.floor(Math.random() * 3);
      
      return {
        position: index + 1,
        player: {
          id: index + 11,
          name,
          photoUrl: 'assets/player-placeholder.png',
          team: teams[index % teams.length]
        },
        yellowCards,
        redCards,
        matchesPlayed: 20 + Math.floor(Math.random() * 5),
        totalCards: yellowCards + redCards
      };
    });
  }

  /**
   * Verifica si la posición es top 3
   */
  isTop3(position: number): boolean {
    return position <= 3;
  }

  /**
   * Obtiene la clase de la posición
   */
  getPositionClass(position: number): string {
    if (position === 1) return 'gold';
    if (position === 2) return 'silver';
    if (position === 3) return 'bronze';
    return '';
  }

  /**
   * Navega al detalle del jugador
   */
  viewPlayerDetail(playerId: number): void {
    console.log('Ver detalle del jugador:', playerId);
    // TODO: Implementar navegación
  }

  /**
   * Navega hacia atrás
   */
  goBack(): void {
    this.router.navigate(['/public-standings', this.tournamentId]);
  }

  /**
   * Obtiene el color del rating
   */
  getRatingColor(rating: number): string {
    if (rating >= 9) return '#4caf50';
    if (rating >= 8) return '#8bc34a';
    if (rating >= 7) return '#ffc107';
    return '#ff9800';
  }
}
