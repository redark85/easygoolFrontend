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
import { Subject, takeUntil, debounceTime, finalize } from 'rxjs';
import { ApiService, ToastService } from '@core/services';
import { MANAGER_GET_PLAYER_LIST_ENDPOINT, PLAYER_SET_AS_TEAM_CAPITAN_ENDPOINT } from '@core/config/endpoints';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

// Enum de estados de jugadores
enum TournamentTeamPlayerStatusType {
  Active = 0,      // Activo
  Suspended = 1,   // Suspendido varios partidos
  Deleted = 2,     // Eliminado lógico
  Expelled = 3,    // Expulsado del torneo
  Injured = 4      // Lesionado
}

interface Player {
  tournamentTeamPlayerId: number;
  playerId: number;
  imageUrl: string;
  fullName: string;
  position: string;
  jerseyNumber: number;
  status: TournamentTeamPlayerStatusType;
  goals: number;
  penalties: number;
  yellowCards: number;
  redCards: number;
  isCapitan: boolean;
}

interface PlayerListResponse {
  succeed: boolean;
  message: string;
  messageId: string;
  messageType: number;
  result: Player[];
  records: number;
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
    { value: TournamentTeamPlayerStatusType.Active, label: 'Activo' },
    { value: TournamentTeamPlayerStatusType.Injured, label: 'Lesionado' },
    { value: TournamentTeamPlayerStatusType.Suspended, label: 'Suspendido' },
    { value: TournamentTeamPlayerStatusType.Expelled, label: 'Expulsado' },
    { value: TournamentTeamPlayerStatusType.Deleted, label: 'Eliminado' }
  ];

  tournamentTeamId: number = 0;
  isLoading = false;

  players: Player[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private apiService: ApiService,
    private toastService: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Obtener tournamentTeamId de la ruta o de algún servicio
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('teamId');
        if (id) {
          this.tournamentTeamId = +id;
          this.loadPlayers();
        }
      });
    
    this.initDataSource();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los jugadores desde el API
   */
  private loadPlayers(): void {
    if (!this.tournamentTeamId) {
      console.warn('No hay tournamentTeamId disponible');
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.apiService.get<PlayerListResponse>(
      `${MANAGER_GET_PLAYER_LIST_ENDPOINT}/${this.tournamentTeamId}`
    )
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (response) => {
        if (response.succeed && response.result) {
          this.players = response.result;
          this.dataSource.data = this.players;
          console.log('Jugadores cargados:', this.players);
        } else {
          this.toastService.showWarning(response.message || 'No se pudieron cargar los jugadores');
          this.players = [];
          this.dataSource.data = [];
        }
      },
      error: (error) => {
        console.error('Error al cargar jugadores:', error);
        this.toastService.showError('Error al cargar los jugadores del equipo');
        this.players = [];
        this.dataSource.data = [];
      }
    });
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
      return data.fullName.toLowerCase().includes(searchTerm) || 
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
        return player.fullName.toLowerCase().includes(searchTerm) ||
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
      filteredData = filteredData.filter(player => player.status === +status);
    }

    this.dataSource.data = filteredData;
    this.cdr.detectChanges();
  }

  /**
   * Obtiene el color del estado
   */
  getStatusColor(status: TournamentTeamPlayerStatusType): string {
    const colors: { [key: number]: string } = {
      [TournamentTeamPlayerStatusType.Active]: 'primary',
      [TournamentTeamPlayerStatusType.Injured]: 'warn',
      [TournamentTeamPlayerStatusType.Suspended]: 'accent',
      [TournamentTeamPlayerStatusType.Expelled]: 'warn',
      [TournamentTeamPlayerStatusType.Deleted]: 'accent'
    };
    return colors[status] || 'primary';
  }

  /**
   * Obtiene el label del estado
   */
  getStatusLabel(status: TournamentTeamPlayerStatusType): string {
    const labels: { [key: number]: string } = {
      [TournamentTeamPlayerStatusType.Active]: 'Activo',
      [TournamentTeamPlayerStatusType.Injured]: 'Lesionado',
      [TournamentTeamPlayerStatusType.Suspended]: 'Suspendido',
      [TournamentTeamPlayerStatusType.Expelled]: 'Expulsado',
      [TournamentTeamPlayerStatusType.Deleted]: 'Eliminado'
    };
    return labels[status] || 'Desconocido';
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
    player.status = TournamentTeamPlayerStatusType.Injured;
    this.cdr.detectChanges();
    // TODO: Guardar cambio en el servicio
  }

  /**
   * Marcar como activo
   */
  onMarkAsActive(player: Player): void {
    player.status = TournamentTeamPlayerStatusType.Active;
    this.cdr.detectChanges();
    // TODO: Guardar cambio en el servicio
  }

  /**
   * Marcar jugador como capitán
   */
  onSetAsCapitan(player: Player): void {
    Swal.fire({
      title: '¿Marcar como Capitán?',
      html: `
        <p>¿Estás seguro de que deseas marcar a <strong>${player.fullName}</strong> como capitán del equipo?</p>
        <p style="color: #666; font-size: 0.9em; margin-top: 10px;">
          Si ya existe un capitán, será reemplazado automáticamente.
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar como capitán',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1976d2',
      cancelButtonColor: '#666'
    }).then((result) => {
      if (result.isConfirmed) {
        this.setAsCapitan(player);
      }
    });
  }

  /**
   * Llama al servicio para marcar como capitán
   */
  private setAsCapitan(player: Player): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.apiService.post(
      `${PLAYER_SET_AS_TEAM_CAPITAN_ENDPOINT}/${player.tournamentTeamPlayerId}`,
      {}
    )
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (response: any) => {
        if (response.succeed) {
          this.toastService.showSuccess('Capitán asignado correctamente');
          // Recargar la lista de jugadores
          this.loadPlayers();
        } else {
          this.toastService.showWarning(response.message || 'No se pudo asignar el capitán');
        }
      },
      error: (error) => {
        console.error('Error al asignar capitán:', error);
        this.toastService.showError('Error al asignar el capitán del equipo');
      }
    });
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
