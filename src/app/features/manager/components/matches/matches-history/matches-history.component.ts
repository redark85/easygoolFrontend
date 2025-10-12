import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime } from 'rxjs';

interface MatchHistory {
  id: number;
  date: Date;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  venue: string;
  matchday: number;
  isHome: boolean;
  result: 'win' | 'draw' | 'loss';
  competition: string;
}

/**
 * Componente para ver el historial de partidos
 */
@Component({
  selector: 'app-matches-history',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './matches-history.component.html',
  styleUrls: ['./matches-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatchesHistoryComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['date', 'matchday', 'teams', 'result', 'venue', 'actions'];
  dataSource!: MatTableDataSource<MatchHistory>;

  searchControl = new FormControl('');
  resultFilter = new FormControl('all');
  venueFilter = new FormControl('all');

  resultOptions = [
    { value: 'all', label: 'Todos los Resultados' },
    { value: 'win', label: 'Victorias' },
    { value: 'draw', label: 'Empates' },
    { value: 'loss', label: 'Derrotas' }
  ];

  venueOptions = [
    { value: 'all', label: 'Todos los Lugares' },
    { value: 'home', label: 'Local' },
    { value: 'away', label: 'Visitante' }
  ];

  // Statistics
  stats = {
    total: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0
  };

  matchesHistory: MatchHistory[] = [
    {
      id: 1,
      date: new Date(2025, 9, 5),
      homeTeam: 'Mi Equipo',
      awayTeam: 'Real Deportivo',
      homeGoals: 3,
      awayGoals: 1,
      venue: 'Estadio Municipal',
      matchday: 10,
      isHome: true,
      result: 'win',
      competition: 'Liga Local'
    },
    {
      id: 2,
      date: new Date(2025, 8, 28),
      homeTeam: 'Atlético City',
      awayTeam: 'Mi Equipo',
      homeGoals: 2,
      awayGoals: 2,
      venue: 'Estadio Central',
      matchday: 9,
      isHome: false,
      result: 'draw',
      competition: 'Liga Local'
    },
    {
      id: 3,
      date: new Date(2025, 8, 21),
      homeTeam: 'Mi Equipo',
      awayTeam: 'Deportivo Unidos',
      homeGoals: 1,
      awayGoals: 0,
      venue: 'Estadio Municipal',
      matchday: 8,
      isHome: true,
      result: 'win',
      competition: 'Liga Local'
    },
    {
      id: 4,
      date: new Date(2025, 8, 14),
      homeTeam: 'Rival FC',
      awayTeam: 'Mi Equipo',
      homeGoals: 3,
      awayGoals: 0,
      venue: 'Estadio Norte',
      matchday: 7,
      isHome: false,
      result: 'loss',
      competition: 'Liga Local'
    },
    {
      id: 5,
      date: new Date(2025, 8, 7),
      homeTeam: 'Mi Equipo',
      awayTeam: 'Club Deportivo',
      homeGoals: 2,
      awayGoals: 1,
      venue: 'Estadio Municipal',
      matchday: 6,
      isHome: true,
      result: 'win',
      competition: 'Liga Local'
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initDataSource();
    this.setupFilters();
    this.calculateStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el data source
   */
  private initDataSource(): void {
    this.dataSource = new MatTableDataSource(this.matchesHistory);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * Configura los filtros
   */
  private setupFilters(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });

    this.resultFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });

    this.venueFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  /**
   * Aplica todos los filtros
   */
  private applyFilters(): void {
    let filteredData = [...this.matchesHistory];

    // Search filter
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    if (searchTerm) {
      filteredData = filteredData.filter(match =>
        match.homeTeam.toLowerCase().includes(searchTerm) ||
        match.awayTeam.toLowerCase().includes(searchTerm) ||
        match.venue.toLowerCase().includes(searchTerm)
      );
    }

    // Result filter
    const result = this.resultFilter.value;
    if (result && result !== 'all') {
      filteredData = filteredData.filter(match => match.result === result);
    }

    // Venue filter
    const venue = this.venueFilter.value;
    if (venue && venue !== 'all') {
      filteredData = filteredData.filter(match =>
        venue === 'home' ? match.isHome : !match.isHome
      );
    }

    this.dataSource.data = filteredData;
    this.cdr.detectChanges();
  }

  /**
   * Calcula las estadísticas
   */
  private calculateStats(): void {
    this.stats.total = this.matchesHistory.length;
    this.stats.wins = this.matchesHistory.filter(m => m.result === 'win').length;
    this.stats.draws = this.matchesHistory.filter(m => m.result === 'draw').length;
    this.stats.losses = this.matchesHistory.filter(m => m.result === 'loss').length;
    
    this.stats.goalsFor = this.matchesHistory.reduce((sum, match) => {
      return sum + (match.isHome ? match.homeGoals : match.awayGoals);
    }, 0);
    
    this.stats.goalsAgainst = this.matchesHistory.reduce((sum, match) => {
      return sum + (match.isHome ? match.awayGoals : match.homeGoals);
    }, 0);
  }

  /**
   * Obtiene el color del resultado
   */
  getResultColor(result: string): string {
    const colors: { [key: string]: string } = {
      win: 'primary',
      draw: 'accent',
      loss: 'warn'
    };
    return colors[result] || '';
  }

  /**
   * Obtiene el label del resultado
   */
  getResultLabel(result: string): string {
    const labels: { [key: string]: string } = {
      win: 'Victoria',
      draw: 'Empate',
      loss: 'Derrota'
    };
    return labels[result] || result;
  }

  /**
   * Obtiene el icono del resultado
   */
  getResultIcon(result: string): string {
    const icons: { [key: string]: string } = {
      win: 'check_circle',
      draw: 'remove_circle',
      loss: 'cancel'
    };
    return icons[result] || 'help';
  }

  /**
   * Navega a los detalles del partido
   */
  onViewMatchDetails(matchId: number): void {
    // TODO: Navegar a detalles
    console.log('Ver detalles del partido:', matchId);
  }

  /**
   * Exporta el historial
   */
  onExport(): void {
    // TODO: Exportar a Excel
    console.log('Exportar historial');
  }

  /**
   * Calcula el porcentaje de victorias
   */
  get winPercentage(): number {
    if (this.stats.total === 0) return 0;
    return (this.stats.wins / this.stats.total) * 100;
  }
}
