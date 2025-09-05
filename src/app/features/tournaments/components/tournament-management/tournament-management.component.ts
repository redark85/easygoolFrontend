import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { Subject, takeUntil } from 'rxjs';

import { Tournament, TournamentModality, TournamentStatusType } from '../../models/tournament.interface';
import { Phase, Group, PhaseType } from '../../models/phase.interface';
import { TournamentService } from '../../services/tournament.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-tournament-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatExpansionModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  templateUrl: './tournament-management.component.html',
  styleUrls: ['./tournament-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TournamentManagementComponent implements OnInit, OnDestroy {
  tournament: Tournament | null = null;
  phases: Phase[] = [];
  isLoading = false;
  tournamentId: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private tournamentService: TournamentService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = +params['id'];
        if (id && !isNaN(id)) {
          this.tournamentId = id;
          this.loadTournamentData();
        } else {
          this.toastService.showError('ID de torneo inválido');
          this.router.navigate(['/dashboard/tournaments']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos del torneo y sus fases
   */
  private loadTournamentData(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    // TODO: Implementar servicio para obtener torneo por ID
    // Por ahora, simularemos la carga
    setTimeout(() => {
      // Mock data - reemplazar con servicio real
      this.tournament = {
        id: this.tournamentId,
        name: 'Copa Primavera 2024',
        description: 'Torneo de fútbol 7 para equipos amateur de la ciudad',
        startDate: '2024-03-15T10:00:00Z',
        endDate: '2024-03-30T18:00:00Z',
        imageUrl: 'assets/logo.png',
        modality: TournamentModality.Seven,
        status: TournamentStatusType.Active,
        address: {
          address: 'Parque La Carolina, Quito, Ecuador',
          mainStreet: 'Parque La Carolina',
          secondStreet: 'Av. Eloy Alfaro',
          latitude: '-0.1807',
          longitude: '-78.4678'
        },
        totalTeams: 16,
        totalMatches: 32
      };

      // Actualizar título de la página para el breadcrumb
      this.titleService.setTitle(`${this.tournament.name} - EasyGool`);

      this.phases = [
        {
          id: 1,
          name: 'Fase de Grupos',
          phaseType: PhaseType.GroupStage,
          groups: [
            { id: 1, name: 'Grupo A' },
            { id: 2, name: 'Grupo B' },
            { id: 3, name: 'Grupo C' },
            { id: 4, name: 'Grupo D' }
          ]
        },
        {
          id: 2,
          name: 'Cuartos de Final',
          phaseType: PhaseType.Knockout,
          groups: []
        }
      ];

      this.isLoading = false;
      this.cdr.detectChanges();
    }, 1000);
  }

  /**
   * Navega de vuelta a la lista de torneos
   */
  goBack(): void {
    this.router.navigate(['/dashboard/tournaments']);
  }

  /**
   * Obtiene el ícono apropiado para la modalidad del torneo
   */
  getModalityIcon(modality: TournamentModality): string {
    switch (modality) {
      case TournamentModality.Five:
        return 'sports_handball';
      case TournamentModality.Six:
        return 'sports_soccer';
      case TournamentModality.Seven:
        return 'sports_soccer';
      case TournamentModality.Eight:
        return 'sports';
      case TournamentModality.Nine:
        return 'sports';
      case TournamentModality.Ten:
        return 'stadium';
      case TournamentModality.Eleven:
        return 'stadium';
      default:
        return 'sports_soccer';
    }
  }

  /**
   * Obtiene el texto descriptivo para la modalidad del torneo
   */
  getModalityText(modality: TournamentModality): string {
    switch (modality) {
      case TournamentModality.Five:
        return 'Fútbol 5 (Indoor)';
      case TournamentModality.Six:
        return 'Fútbol 6';
      case TournamentModality.Seven:
        return 'Fútbol 7';
      case TournamentModality.Eight:
        return 'Fútbol 8';
      case TournamentModality.Nine:
        return 'Fútbol 9';
      case TournamentModality.Ten:
        return 'Fútbol 10';
      case TournamentModality.Eleven:
        return 'Fútbol 11';
      default:
        return 'Modalidad desconocida';
    }
  }

  /**
   * Obtiene la clase CSS para el estado del torneo
   */
  getStatusClass(status: TournamentStatusType): string {
    switch (status) {
      case TournamentStatusType.Active:
        return 'status-active';
      case TournamentStatusType.Completed:
        return 'status-completed';
      case TournamentStatusType.Deleted:
        return 'status-deleted';
      default:
        return 'status-unknown';
    }
  }

  /**
   * Obtiene el texto del estado del torneo
   */
  getStatusText(status: TournamentStatusType): string {
    switch (status) {
      case TournamentStatusType.Active:
        return 'Activo';
      case TournamentStatusType.Completed:
        return 'Completado';
      case TournamentStatusType.Deleted:
        return 'Eliminado';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Obtiene el ícono para el estado del torneo
   */
  getStatusIcon(status: TournamentStatusType): string {
    switch (status) {
      case TournamentStatusType.Active:
        return 'check_circle';
      case TournamentStatusType.Completed:
        return 'emoji_events';
      case TournamentStatusType.Deleted:
        return 'cancel';
      default:
        return 'help_outline';
    }
  }

  /**
   * Obtiene el ícono para el tipo de fase
   */
  getPhaseTypeIcon(phaseType: PhaseType): string {
    switch (phaseType) {
      case PhaseType.GroupStage:
        return 'group_work';
      case PhaseType.Knockout:
        return 'emoji_events';
      default:
        return 'sports_soccer';
    }
  }

  /**
   * Obtiene el texto para el tipo de fase
   */
  getPhaseTypeText(phaseType: PhaseType): string {
    switch (phaseType) {
      case PhaseType.GroupStage:
        return 'Fase de Grupos';
      case PhaseType.Knockout:
        return 'Eliminatoria';
      default:
        return 'Tipo desconocido';
    }
  }

  /**
   * Formatea una fecha para mostrar
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Obtiene el rango de fechas del torneo
   */
  getDateRange(): string {
    if (!this.tournament) return '';
    
    const startDate = new Date(this.tournament.startDate).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
    
    if (this.tournament.endDate) {
      const endDate = new Date(this.tournament.endDate).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      });
      return `${startDate} - ${endDate}`;
    }
    
    return `Desde ${startDate}`;
  }

  /**
   * Crea una nueva fase
   */
  createPhase(): void {
    // TODO: Implementar modal para crear fase
    console.log('Crear nueva fase');
  }

  /**
   * Edita una fase existente
   */
  editPhase(phase: Phase): void {
    // TODO: Implementar modal para editar fase
    console.log('Editar fase:', phase.name);
  }

  /**
   * Elimina una fase
   */
  deletePhase(phase: Phase): void {
    // TODO: Implementar confirmación y eliminación
    console.log('Eliminar fase:', phase.name);
  }

  /**
   * Crea un nuevo grupo en una fase
   */
  createGroup(phase: Phase): void {
    // TODO: Implementar modal para crear grupo
    console.log('Crear grupo en fase:', phase.name);
  }

  /**
   * Edita un grupo existente
   */
  editGroup(group: Group): void {
    // TODO: Implementar modal para editar grupo
    console.log('Editar grupo:', group.name);
  }

  /**
   * Elimina un grupo
   */
  deleteGroup(group: Group): void {
    // TODO: Implementar confirmación y eliminación
    console.log('Eliminar grupo:', group.name);
  }

  /**
   * TrackBy function para fases
   */
  trackByPhaseId(index: number, phase: Phase): number {
    return phase.id || index;
  }

  /**
   * TrackBy function para grupos
   */
  trackByGroupId(index: number, group: Group): number {
    return group.id || index;
  }
}
