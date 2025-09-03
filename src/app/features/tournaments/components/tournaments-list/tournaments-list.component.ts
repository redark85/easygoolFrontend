import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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

import { Tournament, TournamentStatus, TournamentStatusType, TournamentModality, UpdateTournamentRequest } from '../../models/tournament.interface';
import { TournamentService } from '../../services/tournament.service';
import { TournamentFormComponent } from '../tournament-form/tournament-form.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

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

  private destroy$ = new Subject<void>();

  constructor(
    private tournamentService: TournamentService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
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
   * Administrar equipos del torneo
   */
  viewTournamentDetails(tournament: Tournament): void {
    // TODO: Implementar modal de administración de equipos
    console.log('Administrar equipos del torneo:', tournament.name);
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
   * Cambia el estado de un torneo usando actualización completa
   */
  async changeStatus(tournament: Tournament, newStatus: TournamentStatusType): Promise<void> {

    try {
      // Convertir imagen URL a base64 si existe
      let imageBase64 = '';
      let imageContentType = 'jpeg';

      if (tournament.imageUrl) {
        const imageData = await this.convertImageUrlToBase64(tournament.imageUrl);
        imageBase64 = imageData.base64;
        imageContentType = imageData.contentType;
      }

      // Preparar data completa para actualización
      const updateRequest: UpdateTournamentRequest = {
        name: tournament.name,
        description: tournament.description,
        startDate: tournament.startDate,
        endDate: tournament.endDate || '',
        location: tournament.location || '',
        latitude: tournament.latitude,
        longitude: tournament.longitude,
        status: this.mapStatusTypeToBackend(newStatus),
        allowTeamRegistration: true,
        imageBase64: imageBase64,
        imageContentType: imageContentType
      };

      this.tournamentService.updateTournament(tournament.id, updateRequest).subscribe({
        next: () => {
          this.loadTournaments(); // Recargar lista después del cambio
        },
        error: (error) => {
          console.error('Error changing tournament status:', error);
        }
      });
    } catch (error) {
      console.error('Error preparing tournament update:', error);
    }
  }

  /**
   * Elimina un torneo con confirmación (cambio a estado Deleted)
   */
  deleteTournament(tournament: Tournament): void {
    const dialogData: ConfirmDialogData = {
      title: 'Eliminar Torneo',
      message: `¿Estás seguro de que deseas eliminar el torneo "${tournament.name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Cambiar estado a Deleted en lugar de eliminar físicamente
        this.changeStatus(tournament, TournamentStatusType.Deleted);
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
  getStatusClass(status: TournamentStatus): string {
    // Mapear TournamentStatus a TournamentStatusType para UI
    switch (status) {
      case TournamentStatus.Active:
        return 'status-active';
      case TournamentStatus.Completed:
        return 'status-completed';
      case TournamentStatus.Comming:
        return 'status-coming';
      case TournamentStatus.Cancelled:
        return 'status-deleted';
      default:
        return '';
    }
  }

  /**
   * Obtiene el texto del estado del torneo basado en TournamentStatusType
   */
  getStatusText(status: TournamentStatus): string {
    // Mapear TournamentStatus a TournamentStatusType para UI
    switch (status) {
      case TournamentStatus.Active:
        return 'Activo';
      case TournamentStatus.Completed:
        return 'Completado';
      case TournamentStatus.Comming:
        return 'Próximo';
      case TournamentStatus.Cancelled:
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
      const response = await fetch(imageUrl);
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
   */
  private mapStatusTypeToBackend(statusType: TournamentStatusType): number {
    switch (statusType) {
      case TournamentStatusType.Coming:
        return 0;
      case TournamentStatusType.Active:
        return 1;
      case TournamentStatusType.Completed:
        return 2;
      case TournamentStatusType.Deleted:
        return 3;
      default:
        return 0;
    }
  }

  /**
   * Obtiene las opciones de estado disponibles para un torneo
   */
  getStatusOptions(currentStatus: TournamentStatus): Array<{value: TournamentStatusType, label: string}> {

    const allOptions = [
      { value: TournamentStatusType.Active, label: 'Marcar como Activo' },
      { value: TournamentStatusType.Coming, label: 'Marcar como Próximo' },
      { value: TournamentStatusType.Completed, label: 'Marcar como Completado' },
      { value: TournamentStatusType.Deleted, label: 'Eliminar' }
    ];

    // Filtrar la opción actual para no mostrarla en el menú
    const currentStatusType = this.mapToStatusType(currentStatus);
    const filteredOptions = allOptions.filter(option => option.value !== currentStatusType);

    return filteredOptions;
  }

  /**
   * Mapea TournamentStatus a TournamentStatusType
   */
  private mapToStatusType(status: TournamentStatus): TournamentStatusType {
    switch (status) {
      case TournamentStatus.Active:
        return TournamentStatusType.Active;
      case TournamentStatus.Completed:
        return TournamentStatusType.Completed;
      case TournamentStatus.Comming:
        return TournamentStatusType.Coming;
      case TournamentStatus.Cancelled:
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
