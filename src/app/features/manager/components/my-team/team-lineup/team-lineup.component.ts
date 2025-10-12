import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject, takeUntil } from 'rxjs';

interface Formation {
  id: string;
  name: string;
  description: string;
  positions: number[];
}

interface LineupPlayer {
  id: number;
  name: string;
  photo: string;
  jerseyNumber: number;
  position: string;
}

interface SavedLineup {
  id: number;
  name: string;
  formation: string;
  players: LineupPlayer[];
  wins: number;
  draws: number;
  losses: number;
  isFavorite: boolean;
}

/**
 * Componente para gestionar alineaciones del equipo
 */
@Component({
  selector: 'app-team-lineup',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatTooltipModule,
    MatTabsModule
  ],
  templateUrl: './team-lineup.component.html',
  styleUrls: ['./team-lineup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamLineupComponent implements OnInit, OnDestroy {
  formations: Formation[] = [
    { id: '4-4-2', name: '4-4-2', description: 'Formación clásica equilibrada', positions: [1, 4, 4, 2] },
    { id: '4-3-3', name: '4-3-3', description: 'Formación ofensiva', positions: [1, 4, 3, 3] },
    { id: '3-5-2', name: '3-5-2', description: 'Formación con mediocampo fuerte', positions: [1, 3, 5, 2] },
    { id: '4-2-3-1', name: '4-2-3-1', description: 'Formación moderna', positions: [1, 4, 2, 3, 1] },
    { id: '3-4-3', name: '3-4-3', description: 'Formación ultra ofensiva', positions: [1, 3, 4, 3] }
  ];

  selectedFormation: Formation = this.formations[0];

  availablePlayers: LineupPlayer[] = [
    { id: 1, name: 'Miguel Hernández', photo: 'assets/person.jpg', jerseyNumber: 1, position: 'Portero' },
    { id: 2, name: 'Carlos Rodríguez', photo: 'assets/person.jpg', jerseyNumber: 4, position: 'Defensa' },
    { id: 3, name: 'Luis González', photo: 'assets/person.jpg', jerseyNumber: 5, position: 'Defensa' },
    { id: 4, name: 'Pedro Martínez', photo: 'assets/person.jpg', jerseyNumber: 10, position: 'Mediocampista' },
    { id: 5, name: 'Juan García', photo: 'assets/person.jpg', jerseyNumber: 9, position: 'Delantero' }
  ];

  savedLineups: SavedLineup[] = [
    {
      id: 1,
      name: 'Alineación Titular',
      formation: '4-4-2',
      players: [],
      wins: 7,
      draws: 2,
      losses: 1,
      isFavorite: true
    },
    {
      id: 2,
      name: 'Alineación Ofensiva',
      formation: '4-3-3',
      players: [],
      wins: 5,
      draws: 1,
      losses: 2,
      isFavorite: false
    },
    {
      id: 3,
      name: 'Alineación Defensiva',
      formation: '5-4-1',
      players: [],
      wins: 3,
      draws: 4,
      losses: 1,
      isFavorite: false
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // TODO: Cargar datos reales
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cambia la formación seleccionada
   */
  onFormationChange(formation: Formation): void {
    this.selectedFormation = formation;
    this.cdr.detectChanges();
  }

  /**
   * Guarda la alineación actual
   */
  onSaveLineup(): void {
    // TODO: Implementar guardado de alineación
    console.log('Guardar alineación');
  }

  /**
   * Carga una alineación guardada
   */
  onLoadLineup(lineup: SavedLineup): void {
    // TODO: Cargar alineación
    console.log('Cargar alineación:', lineup);
  }

  /**
   * Marca/desmarca como favorita
   */
  onToggleFavorite(lineup: SavedLineup): void {
    lineup.isFavorite = !lineup.isFavorite;
    this.cdr.detectChanges();
    // TODO: Guardar cambio
  }

  /**
   * Elimina una alineación guardada
   */
  onDeleteLineup(lineup: SavedLineup): void {
    // TODO: Confirmar y eliminar
    console.log('Eliminar alineación:', lineup);
  }

  /**
   * Calcula el porcentaje de victorias
   */
  getWinPercentage(lineup: SavedLineup): number {
    const total = lineup.wins + lineup.draws + lineup.losses;
    if (total === 0) return 0;
    return (lineup.wins / total) * 100;
  }

  /**
   * Crea una nueva alineación
   */
  onCreateNewLineup(): void {
    // TODO: Abrir modal para crear nueva alineación
    console.log('Crear nueva alineación');
  }
}
