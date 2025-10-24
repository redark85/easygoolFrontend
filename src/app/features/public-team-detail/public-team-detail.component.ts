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
import { TeamDetailService } from './services/team-detail.service';
import { TeamDetailForComponent } from './models/team-detail.interface';
import { PublicLoadingComponent } from '../../shared/components/public-loading/public-loading.component';

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
    MatTooltipModule,
    PublicLoadingComponent
  ],
  templateUrl: './public-team-detail.component.html',
  styleUrls: ['./public-team-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicTeamDetailComponent implements OnInit, OnDestroy {
  team: TeamDetailForComponent | null = null;
  tournamentTeamId: number = 0;
  isLoading = false;
  hasError = false;
  errorMessage = '';

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
    private cdr: ChangeDetectorRef,
    private teamDetailService: TeamDetailService
  ) {}

  ngOnInit(): void {
    console.log('🚀 PublicTeamDetailComponent - Initializing...');
    
    // Obtener tournamentTeamId de la ruta
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('teamId');
        if (id && !isNaN(+id)) {
          this.tournamentTeamId = +id;
          console.log('📋 PublicTeamDetailComponent - Tournament Team ID from route:', this.tournamentTeamId);
          this.loadTeamDetail();
        } else {
          console.error('❌ PublicTeamDetailComponent - Invalid team ID in route:', id);
          this.handleError('ID de equipo inválido');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los detalles del equipo desde el API
   */
  loadTeamDetail(): void {
    console.log('📡 PublicTeamDetailComponent - Loading team details from API...');
    
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.cdr.detectChanges();
    
    this.teamDetailService.getTeamDetails(this.tournamentTeamId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (teamData) => {
          console.log('✅ PublicTeamDetailComponent - Team data received:', teamData);
          
          if (teamData) {
            this.team = teamData;
            console.log('🏆 PublicTeamDetailComponent - Team loaded successfully:', this.team.name);
          } else {
            console.warn('⚠️ PublicTeamDetailComponent - No team data received');
            this.handleError('No se encontraron datos del equipo');
          }
          
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ PublicTeamDetailComponent - Error loading team details:', error);
          this.handleError('Error al cargar los datos del equipo');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Maneja errores de carga
   */
  private handleError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    this.team = null;
  }




  /**
   * Obtiene jugadores por posición
   */
  getPlayersByPosition(position: string): any[] {
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
    // Intentar navegar hacia atrás en el historial
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback a la página principal de equipos públicos
      this.router.navigate(['/public-teams']);
    }
  }

  /**
   * Navega al detalle del partido
   */
  viewMatchDetail(matchId: number): void {
    // TODO: Obtener tournamentId real desde el contexto del equipo o modificar la ruta para incluirlo
    // Por ahora usamos un ID por defecto hasta que se implemente la solución completa
    const defaultTournamentId = 1;
    console.log('🚀 Navegando a public-match-detail con tournamentId por defecto:', defaultTournamentId, 'y matchId:', matchId);
    this.router.navigate(['/public-match-detail', defaultTournamentId, matchId]);
  }

  /**
   * Obtiene el porcentaje de victorias
   */
  getWinPercentage(): number {
    if (!this.team || (this.team.matchesPlayed || 0) === 0) return 0;
    return ((this.team.wins || 0) / (this.team.matchesPlayed || 1)) * 100;
  }

  /**
   * Obtiene el promedio de goles por partido
   */
  getGoalsPerMatch(): number {
    if (!this.team || (this.team.matchesPlayed || 0) === 0) return 0;
    return (this.team.goalsFor || 0) / (this.team.matchesPlayed || 1);
  }
}
