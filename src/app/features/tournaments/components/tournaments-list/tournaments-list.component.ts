import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';

import { Tournament, TournamentStatusType, TournamentModality, UpdateTournamentRequest } from '../../models/tournament.interface';
import { TournamentService } from '../../services/tournament.service';
import { TournamentStatusService } from '../../services/tournament-status.service';
import { TournamentFormComponent } from '../tournament-form/tournament-form.component';
import Swal from 'sweetalert2';
import { convertCloudinaryToHttps } from '@shared/utils/url.utils';

import { Subject, takeUntil, debounceTime, distinctUntilChanged, startWith } from 'rxjs';

@Component({
  selector: 'app-tournaments-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './tournaments-list.component.html',
  styleUrls: ['./tournaments-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TournamentsListComponent implements OnInit, OnDestroy {
  tournaments: Tournament[] = [];
  filteredTournaments: Tournament[] = [];
  isLoading = false;
  searchControl = new FormControl('');
  
  // Map para controlar loading específico por torneo
  tournamentLoadingStates = new Map<number, boolean>();

  private destroy$ = new Subject<void>();

  constructor(
    private tournamentService: TournamentService,
    private tournamentStatusService: TournamentStatusService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTournaments();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga todos los torneos del usuario
   */
  private loadTournaments(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.tournamentService.getAllTournamentsByUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tournaments: Tournament[]) => {
          this.tournaments = tournaments;
          this.filteredTournaments = tournaments;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error loading tournaments:', error);
          this.tournaments = [];
          this.filteredTournaments = [];
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Configura la búsqueda con debounce
   */
  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.filterTournaments(searchTerm || '');
      });
  }

  /**
   * Filtra torneos por término de búsqueda
   */
  private filterTournaments(query: string = ''): void {
    const searchTerm = query.toLowerCase();
    this.filteredTournaments = this.tournaments.filter(tournament =>
      tournament.name.toLowerCase().includes(searchTerm) ||
      tournament.description.toLowerCase().includes(searchTerm)
    );
    this.cdr.detectChanges();
  }

  /**
   * Navega a la vista de administración del torneo (fases y grupos)
   */
  viewTournamentDetails(tournament: Tournament): void {
    this.router.navigate(['/tournaments', tournament.id, 'manage']);
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
   * Abre modal para crear nuevo torneo
   */
  createTournament(): void {
    const dialogRef = this.dialog.open(TournamentFormComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: true,
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTournaments(); // Recargar lista después de crear
      }
    });
  }

  /**
   * Edita un torneo existente
   */
  editTournament(tournament: Tournament): void {
    const dialogRef = this.dialog.open(TournamentFormComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: true,
      data: { mode: 'edit', tournament }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTournaments(); // Recargar lista después de editar
      }
    });
  }

  /**
   * Método de debug para eventos de click
   */
  debugClick(eventType: string, tournament: Tournament, option: {value: TournamentStatusType, label: string}): void {
    console.log(`${eventType} event triggered:`, {
      tournament: tournament.name,
      option: option.label,
      value: option.value
    });
  }

  /**
   * TrackBy function para optimizar el *ngFor
   */
  trackByOption(index: number, option: {value: TournamentStatusType, label: string}): TournamentStatusType {
    return option.value;
  }

  /**
   * Maneja las acciones de cambio de estado desde el menú
   */
  handleStatusAction(tournament: Tournament, option: {value: TournamentStatusType, label: string}): void {

    if (option.value === TournamentStatusType.Deleted) {
      this.deleteTournament(tournament);
    } else {
      this.changeStatus(tournament, option.value);
    }
  }

  /**
   * Cambia el estado de un torneo usando el endpoint específico ChangeStatus
   */
  changeStatus(tournament: Tournament, newStatus: TournamentStatusType): void {
    // Activar loading específico para este torneo
    this.tournamentLoadingStates.set(tournament.id, true);
    this.cdr.detectChanges();

    this.tournamentService.changeStatus(tournament.id, newStatus).subscribe({
      next: () => {
        // Actualizar solo el torneo específico sin recargar toda la lista
        this.updateTournamentInList(tournament.id, newStatus);
        this.tournamentLoadingStates.set(tournament.id, false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error changing tournament status:', error);
        this.tournamentLoadingStates.set(tournament.id, false);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Actualiza un torneo específico en la lista sin recargar toda la lista
   */
  private updateTournamentInList(tournamentId: number, newStatus: TournamentStatusType): void {
    const tournamentIndex = this.tournaments.findIndex(t => t.id === tournamentId);
    if (tournamentIndex !== -1) {
      this.tournaments[tournamentIndex].status = newStatus;
      this.filteredTournaments = [...this.tournaments];
    }
  }

  /**
   * Verifica si un torneo específico está en estado de loading
   */
  isTournamentLoading(tournamentId: number): boolean {
    return this.tournamentLoadingStates.get(tournamentId) || false;
  }

  /**
   * Elimina un torneo con confirmación (cambio a estado Deleted)
   */
  deleteTournament(tournament: Tournament): void {
    Swal.fire({
      title: 'Eliminar Torneo',
      text: `¿Estás seguro de que deseas eliminar el torneo "${tournament.name}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Activar loading específico para este torneo
        this.tournamentLoadingStates.set(tournament.id, true);
        this.cdr.detectChanges();

        // Usar el endpoint específico de eliminación
        this.tournamentService.deleteTournament(tournament.id).subscribe({
          next: () => {
            // Remover el torneo de la lista local
            this.tournaments = this.tournaments.filter(t => t.id !== tournament.id);
            this.filteredTournaments = [...this.tournaments];
            this.tournamentLoadingStates.delete(tournament.id);
            this.cdr.detectChanges();

            // Mostrar mensaje de éxito
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El torneo ha sido eliminado correctamente.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error deleting tournament:', error);
            this.tournamentLoadingStates.set(tournament.id, false);
            this.cdr.detectChanges();

            // Mostrar mensaje de error
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar el torneo. Inténtalo de nuevo.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }

  /**
   * Obtiene la clase CSS para el menú de estados
   */
  getStatusMenuClass(statusType: TournamentStatusType): string {
    switch (statusType) {
      case TournamentStatusType.Active:
        return 'status-menu-active';
      case TournamentStatusType.Coming:
        return 'status-menu-coming';
      case TournamentStatusType.Completed:
        return 'status-menu-completed';
      case TournamentStatusType.Deleted:
        return 'status-menu-deleted delete-action';
      default:
        return '';
    }
  }

  /**
   * TrackBy function para optimizar el rendering
   */
  trackByTournamentId(index: number, tournament: Tournament): number {
    return tournament.id; // Usar id como identificador único
  }

  /**
   * Obtiene la clase CSS para el estado del torneo basado en TournamentStatusType
   */
  getStatusClass(status: TournamentStatusType): string {
    switch (status) {
      case TournamentStatusType.Active:
        return 'status-active';
      case TournamentStatusType.Completed:
        return 'status-completed';
      case TournamentStatusType.Coming:
        return 'status-coming';
      case TournamentStatusType.Deleted:
        return 'status-deleted';
      default:
        return '';
    }
  }

  /**
   * Obtiene el texto del estado del torneo basado en TournamentStatusType
   */
  getStatusText(status: TournamentStatusType): string {
    switch (status) {
      case TournamentStatusType.Active:
        return 'Activo';
      case TournamentStatusType.Completed:
        return 'Completado';
      case TournamentStatusType.Coming:
        return 'Próximo';
      case TournamentStatusType.Deleted:
        return 'Eliminado';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Convierte una URL de imagen a base64
   */
  private async convertImageUrlToBase64(imageUrl: string): Promise<{base64: string, contentType: string}> {
    try {
      // Convertir HTTP a HTTPS para evitar Mixed Content en producción
      const httpsUrl = convertCloudinaryToHttps(imageUrl);
      
      const response = await fetch(httpsUrl, {
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'image/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1]; // Remover el prefijo data:image/...;base64,
          const contentType = blob.type.split('/')[1] || 'jpeg';

          resolve({
            base64: base64Data,
            contentType: contentType
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image URL to base64:', error);
      return { base64: '', contentType: 'jpeg' };
    }
  }

  /**
   * Mapea TournamentModality a valor del backend
   */
  private mapModalityToBackend(modality: TournamentModality): number {
    // Mapear directamente el valor numérico del enum
    return modality;
  }

  /**
   * Mapea TournamentStatusType a valor del backend
   * CORREGIDO: Los valores deben coincidir con el enum TournamentStatusType
   */
  private mapStatusTypeToBackend(statusType: TournamentStatusType): number {
    // Los valores del enum ya son correctos, solo retornamos el valor numérico
    return statusType;
  }

  /**
   * Obtiene las opciones de estado disponibles para un torneo según reglas de negocio
   * - Coming: puede cambiar a Active y Completed
   * - Active: solo puede cambiar a Completed
   * - Completed: solo puede cambiar a Active
   * - Todos: siempre pueden ser eliminados
   * - Nunca mostrar: cambio a Coming
   */
  getStatusOptions(currentStatus: TournamentStatusType): Array<{value: TournamentStatusType, label: string}> {
    const currentStatusType = this.mapToStatusType(currentStatus);
    const availableOptions: Array<{value: TournamentStatusType, label: string}> = [];

    switch (currentStatusType) {
      case TournamentStatusType.Coming:
        // Coming puede cambiar a Active y Completed
        availableOptions.push(
          { value: TournamentStatusType.Active, label: 'Marcar como Activo' },
          { value: TournamentStatusType.Completed, label: 'Marcar como Completado' }
        );
        break;

      case TournamentStatusType.Active:
        // Active solo puede cambiar a Completed
        availableOptions.push(
          { value: TournamentStatusType.Completed, label: 'Marcar como Completado' }
        );
        break;

      case TournamentStatusType.Completed:
        // Completed solo puede cambiar a Active
        availableOptions.push(
          { value: TournamentStatusType.Active, label: 'Marcar como Activo' }
        );
        break;

      case TournamentStatusType.Deleted:
        // Los torneos eliminados no deberían mostrar opciones de cambio de estado
        // pero mantenemos la lógica por consistencia
        break;
    }

    // Siempre agregar la opción de eliminar (excepto si ya está eliminado)
    if (currentStatusType !== TournamentStatusType.Deleted) {
      availableOptions.push({ value: TournamentStatusType.Deleted, label: 'Eliminar' });
    }

    return availableOptions;
  }

  /**
   * Mapea TournamentStatusType a TournamentStatusType
   */
  private mapToStatusType(status: TournamentStatusType): TournamentStatusType {
    switch (status) {
      case TournamentStatusType.Active:
        return TournamentStatusType.Active;
      case TournamentStatusType.Completed:
        return TournamentStatusType.Completed;
      case TournamentStatusType.Coming:
        return TournamentStatusType.Coming;
      case TournamentStatusType.Deleted:
        return TournamentStatusType.Deleted;
      default:
        return TournamentStatusType.Coming;
    }
  }

  /**
   * Obtiene el ícono para cada tipo de estado
   */
  getStatusIcon(statusType: TournamentStatusType): string {
    switch (statusType) {
      case TournamentStatusType.Active:
        return 'play_circle';
      case TournamentStatusType.Coming:
        return 'schedule';
      case TournamentStatusType.Completed:
        return 'check_circle';
      case TournamentStatusType.Deleted:
        return 'delete';
      default:
        return 'help';
    }
  }

  /**
   * Formatea la fecha para mostrar
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }


  /**
   * Obtiene el rango de fechas del torneo
   */
  getDateRange(tournament: Tournament): string {
    const startDate = this.formatDate(tournament.startDate);
    const endDate = tournament.endDate ? this.formatDate(tournament.endDate) : 'Sin fecha fin';
    return `${startDate} - ${endDate}`;
  }

  /**
   * Obtiene la imagen del torneo con fallback
   */
  getTournamentImage(tournament: Tournament): string {
    return tournament.imageUrl || 'assets/logo.png';
  }

}
