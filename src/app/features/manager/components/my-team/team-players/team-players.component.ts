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
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil, debounceTime } from 'rxjs';

interface Player {
  id: number;
  photo: string;
  name: string;
  lastName: string;
  position: string;
  jerseyNumber: number;
  status: 'active' | 'injured' | 'suspended';
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
}

/**
 * Componente para gestionar jugadores del equipo
 */
@Component({
  selector: 'app-team-players',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './team-players.component.html',
  styleUrls: ['./team-players.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamPlayersComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['photo', 'name', 'position', 'jerseyNumber', 'status', 'stats', 'actions'];
  dataSource!: MatTableDataSource<Player>;
  
  searchControl = new FormControl('');
  positionFilter = new FormControl('all');
  statusFilter = new FormControl('all');

  positions = [
    { value: 'all', label: 'Todas las Posiciones' },
    { value: 'Portero', label: 'Portero' },
    { value: 'Defensa', label: 'Defensa' },
    { value: 'Mediocampista', label: 'Mediocampista' },
    { value: 'Delantero', label: 'Delantero' }
  ];

  statuses = [
    { value: 'all', label: 'Todos los Estados' },
    { value: 'active', label: 'Activo' },
    { value: 'injured', label: 'Lesionado' },
    { value: 'suspended', label: 'Suspendido' }
  ];

  players: Player[] = [
    {
      id: 1,
      photo: 'assets/person.jpg',
      name: 'Juan Carlos',
      lastName: 'García López',
      position: 'Delantero',
      jerseyNumber: 9,
      status: 'active',
      goals: 8,
      assists: 5,
      yellowCards: 2,
      redCards: 0,
      matchesPlayed: 10
    },
    {
      id: 2,
      photo: 'assets/person.jpg',
      name: 'Pedro',
      lastName: 'Martínez Ruiz',
      position: 'Mediocampista',
      jerseyNumber: 10,
      status: 'active',
      goals: 5,
      assists: 7,
      yellowCards: 3,
      redCards: 0,
      matchesPlayed: 10
    },
    {
      id: 3,
      photo: 'assets/person.jpg',
      name: 'Carlos',
      lastName: 'Rodríguez Pérez',
      position: 'Defensa',
      jerseyNumber: 4,
      status: 'suspended',
      goals: 1,
      assists: 2,
      yellowCards: 5,
      redCards: 1,
      matchesPlayed: 9
    },
    {
      id: 4,
      photo: 'assets/person.jpg',
      name: 'Miguel',
      lastName: 'Hernández Silva',
      position: 'Portero',
      jerseyNumber: 1,
      status: 'active',
      goals: 0,
      assists: 0,
      yellowCards: 1,
      redCards: 0,
      matchesPlayed: 10
    },
    {
      id: 5,
      photo: 'assets/person.jpg',
      name: 'Luis',
      lastName: 'González Torres',
      position: 'Delantero',
      jerseyNumber: 7,
      status: 'injured',
      goals: 6,
      assists: 3,
      yellowCards: 1,
      redCards: 0,
      matchesPlayed: 8
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initDataSource();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el data source
   */
  private initDataSource(): void {
    this.dataSource = new MatTableDataSource(this.players);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Custom filter predicate
    this.dataSource.filterPredicate = (data: Player, filter: string) => {
      const searchTerm = filter.toLowerCase();
      const fullName = `${data.name} ${data.lastName}`.toLowerCase();
      return fullName.includes(searchTerm) || 
             data.position.toLowerCase().includes(searchTerm) ||
             data.jerseyNumber.toString().includes(searchTerm);
    };
  }

  /**
   * Configura los filtros
   */
  private setupFilters(): void {
    // Search filter
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.applyFilters();
      });

    // Position filter
    this.positionFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });

    // Status filter
    this.statusFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  /**
   * Aplica todos los filtros
   */
  private applyFilters(): void {
    let filteredData = [...this.players];

    // Search filter
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    if (searchTerm) {
      filteredData = filteredData.filter(player => {
        const fullName = `${player.name} ${player.lastName}`.toLowerCase();
        return fullName.includes(searchTerm) ||
               player.position.toLowerCase().includes(searchTerm) ||
               player.jerseyNumber.toString().includes(searchTerm);
      });
    }

    // Position filter
    const position = this.positionFilter.value;
    if (position && position !== 'all') {
      filteredData = filteredData.filter(player => player.position === position);
    }

    // Status filter
    const status = this.statusFilter.value;
    if (status && status !== 'all') {
      filteredData = filteredData.filter(player => player.status === status);
    }

    this.dataSource.data = filteredData;
    this.cdr.detectChanges();
  }

  /**
   * Obtiene el color del estado
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      active: 'primary',
      injured: 'warn',
      suspended: 'accent'
    };
    return colors[status] || 'primary';
  }

  /**
   * Obtiene el label del estado
   */
  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      active: 'Activo',
      injured: 'Lesionado',
      suspended: 'Suspendido'
    };
    return labels[status] || status;
  }

  /**
   * Ver detalles del jugador
   */
  onViewPlayer(player: Player): void {
    // TODO: Navegar a detalle del jugador o abrir modal
    console.log('Ver jugador:', player);
  }

  /**
   * Editar jugador
   */
  onEditPlayer(player: Player): void {
    // TODO: Abrir modal de edición
    console.log('Editar jugador:', player);
  }

  /**
   * Marcar como lesionado
   */
  onMarkAsInjured(player: Player): void {
    player.status = 'injured';
    this.cdr.detectChanges();
    // TODO: Guardar cambio en el servicio
  }

  /**
   * Marcar como activo
   */
  onMarkAsActive(player: Player): void {
    player.status = 'active';
    this.cdr.detectChanges();
    // TODO: Guardar cambio en el servicio
  }

  /**
   * Eliminar jugador del equipo
   */
  onRemovePlayer(player: Player): void {
    // TODO: Confirmar y eliminar
    console.log('Eliminar jugador:', player);
  }

  /**
   * Agregar nuevo jugador
   */
  onAddPlayer(): void {
    // TODO: Abrir modal para agregar jugador
    console.log('Agregar jugador');
  }

  /**
   * Exportar lista de jugadores
   */
  onExport(): void {
    // TODO: Exportar a Excel
    console.log('Exportar jugadores');
  }
}
