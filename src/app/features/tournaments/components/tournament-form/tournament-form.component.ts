import { Component, OnInit, AfterViewInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

import { ImageUploaderComponent, ImageUploadData } from '@shared/components/image-uploader/image-uploader.component';
import { LocationMapComponent, LocationData } from '@shared/components/location-map/location-map.component';
import { TournamentService } from '../../services/tournament.service';
import { PhaseService } from '../../services/phase.service';
import { CreateTournamentRequest, UpdateTournamentRequest, TournamentModality, Tournament, TournamentStatusType } from '../../models/tournament.interface';
import { Phase, CreatePhaseRequest, CreateGroupRequest, PhaseType } from '../../models/phase.interface';
import { dateRangeValidator } from '@shared/validators/date-range.validator';
import { convertCloudinaryToHttps } from '@shared/utils/url.utils';

export interface TournamentFormData {
  mode: 'create' | 'edit';
  tournament?: Tournament;
}

@Component({
  selector: 'app-tournament-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatNativeDateModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatCardModule,
    MatChipsModule,
    ImageUploaderComponent    
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './tournament-form.component.html',
  styleUrls: ['./tournament-form.component.scss']
})
export class TournamentFormComponent implements OnInit, AfterViewInit {
  tournamentForm!: FormGroup;
  phaseForm!: FormGroup;
  groupForm!: FormGroup;
  isSubmitting = false;
  isEditMode = false;
  tournament: Tournament | null = null;
  uploadedImage: ImageUploadData | null = null;
  selectedLocationData: LocationData | null = null;
  
  // Phase and Group management
  showPhaseSection = false;
  createdTournamentId: number | null = null;
  phases: Phase[] = [];
  selectedPhaseId: number | null = null;
  phaseTypeOptions: Array<{value: number, label: string, description: string}> = [];
  isCreatingPhase = false;
  isCreatingGroup = false;

  modalityOptions = [
    { value: TournamentModality.Five, label: 'Fútbol Indoor (5 vs 5)' },
    { value: TournamentModality.Six, label: 'Fútbol 6 vs 6' },
    { value: TournamentModality.Seven, label: 'Fútbol 7 vs 7' },
    { value: TournamentModality.Eight, label: 'Fútbol 8 vs 8' },
    { value: TournamentModality.Nine, label: 'Fútbol 9 vs 9' },
    { value: TournamentModality.Ten, label: 'Fútbol 10 vs 10' },
    { value: TournamentModality.Eleven, label: 'Fútbol 11 vs 11' }
  ];

  constructor(
    private fb: FormBuilder,
    private tournamentService: TournamentService,
    private phaseService: PhaseService,
    private dialogRef: MatDialogRef<TournamentFormComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: TournamentFormData
  ) {
    this.isEditMode = this.data?.mode === 'edit';
    this.initializeForm();
    this.initializePhaseForm();
    this.initializeGroupForm();
    this.phaseTypeOptions = this.phaseService.getPhaseTypeOptions();
  }

  async ngOnInit(): Promise<void> {
    if (this.isEditMode && this.data.tournament) {
      await this.patchForm(this.data.tournament);
    }
  }

  ngAfterViewInit(): void {
    // Forzar actualización del componente de imagen después de la vista
    if (this.uploadedImage) {
      setTimeout(() => {
        // Trigger change detection para el componente de imagen
      }, 100);
    }
  }

  private initializeForm(): void {
    this.tournamentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(250)]],
      modality: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''], // Removido Validators.required
      location: ['', Validators.required]
    }, { validators: [dateRangeValidator] });
  }

  private initializePhaseForm(): void {
    this.phaseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      phaseType: ['', Validators.required]
    });
  }

  private initializeGroupForm(): void {
    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
    });
  }

  private async patchForm(tournament: Tournament): Promise<void> {
    this.tournament = tournament;
    this.tournamentForm.patchValue({
      name: tournament.name,
      description: tournament.description,
      modality: tournament.modality,
      startDate: new Date(tournament.startDate),
      endDate: tournament.endDate ? new Date(tournament.endDate) : null,
      location: tournament.address?.address || ''
    });

    // Si hay datos de dirección, inicializar selectedLocationData
    if (tournament.address) {
      this.selectedLocationData = {
        address: tournament.address.address,
        latitude: parseFloat(tournament.address.latitude) || 0,
        longitude: parseFloat(tournament.address.longitude) || 0,
        primaryStreet: tournament.address.mainStreet,
        secondaryStreet: tournament.address.secondStreet
      };
    }

    // Si hay imagen URL, convertirla a base64 para el componente de imagen
    if (tournament.imageUrl && tournament.imageUrl !== 'assets/logo.png') {
      try {
        const imageData = await this.convertImageUrlToBase64(tournament.imageUrl);
        this.uploadedImage = {
          base64: `data:image/${imageData.contentType};base64,${imageData.base64}`,
          contentType: `image/${imageData.contentType}`
        };
      } catch (error) {
        console.error('Error converting tournament image:', error);
      }
    }
  }

  onImageUploaded(imageData: ImageUploadData): void {
    this.uploadedImage = imageData;
  }

  onSubmit(): void {
    if (this.tournamentForm.valid && this.uploadedImage) {
      this.isSubmitting = true;

      const formValue = this.tournamentForm.value;

      // Limpiar imageBase64 removiendo el prefijo data URI
      let cleanImageBase64 = this.uploadedImage.base64;
      if (cleanImageBase64.includes(',')) {
        cleanImageBase64 = cleanImageBase64.split(',')[1];
      }

      // Limpiar imageContentType para enviar solo la extensión
      let cleanImageContentType = this.uploadedImage.contentType;
      if (cleanImageContentType.startsWith('image/')) {
        cleanImageContentType = cleanImageContentType.replace('image/', '');
      }

      if (this.isEditMode && this.data.tournament) {
        // Modo edición - usar updateTournament
        const updateData: UpdateTournamentRequest = {
          name: formValue.name!,
          description: formValue.description!,
          startDate: formValue.startDate!.toISOString(),
          status: this.mapTournamentStatusToStatusType(this.data.tournament.status),
          allowTeamRegistration: this.data.tournament.status === TournamentStatusType.Active,
          imageBase64: cleanImageBase64,
          imageContentType: cleanImageContentType,
          address: this.selectedLocationData ? {
            address: formValue.location || '',
            mainStreet: this.selectedLocationData.primaryStreet || '',
            secondStreet: this.selectedLocationData.secondaryStreet || '',
            latitude: this.selectedLocationData.latitude.toString() || '0',
            longitude: this.selectedLocationData.longitude.toString() || '0'
          } : undefined
        };

        // Solo agregar endDate si no está vacío
        if (formValue.endDate) {
          updateData.endDate = formValue.endDate.toISOString();
        }

        console.log('Sending updateData:', updateData);
        console.log('selectedLocationData at send:', this.selectedLocationData);

        this.tournamentService.updateTournament(this.data.tournament.id, updateData).subscribe({
          next: (response) => {
            this.isSubmitting = false;
            this.dialogRef.close(true);
          },
          error: (error) => {
            this.isSubmitting = false;
            console.error('Error updating tournament:', error);
          }
        });
      } else {
        // Modo creación - usar createTournament
        const tournamentData: CreateTournamentRequest = {
          name: formValue.name!,
          description: formValue.description!,
          startDate: formValue.startDate!.toISOString(),
          imageBase64: cleanImageBase64,
          imageContentType: cleanImageContentType,
          hasPenaltyMode: false, // Default value
          modality: formValue.modality!,
          address: this.selectedLocationData ? {
            address: formValue.location || '',
            mainStreet: this.selectedLocationData.primaryStreet || '',
            secondStreet: this.selectedLocationData.secondaryStreet || '',
            latitude: this.selectedLocationData.latitude.toString() || '0',
            longitude: this.selectedLocationData.longitude.toString() || '0'
          } : undefined
        };

        // Solo agregar endDate si no está vacío
        if (formValue.endDate) {
          tournamentData.endDate = formValue.endDate.toISOString();
        }

        console.log('Sending tournamentData:', tournamentData);
        console.log('selectedLocationData at create:', this.selectedLocationData);

        this.tournamentService.createTournament(tournamentData).subscribe({
          next: (response) => {
            this.isSubmitting = false;
            if (response.succeed && response.result) {
              this.createdTournamentId = response.result.id;
              this.showPhaseSection = true;
              this.loadPhases();
            } else {
              this.dialogRef.close(true);
            }
          },
          error: (error) => {
            this.isSubmitting = false;
            console.error('Error creating tournament:', error);
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.tournamentForm.controls).forEach(key => {
      this.tournamentForm.get(key)?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.tournamentForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (field?.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength']?.requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    if (field?.hasError('dateRange')) {
      return 'La fecha de fin debe ser posterior a la de inicio';
    }
    return '';
  }

  get isFormValid(): boolean {
    return this.tournamentForm.valid && this.uploadedImage !== null;
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Editar Torneo' : 'Crear Nuevo Torneo';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Actualizar' : 'Crear Torneo';
  }

  /**
   * Abre el modal de selección de ubicación
   */
  openLocationModal(): void {
    const currentLocation = this.tournamentForm.get('location')?.value;
    let initialLocationData = null;
    
    // Si hay datos de ubicación existentes (modo edición), usarlos
    if (this.selectedLocationData) {
      initialLocationData = this.selectedLocationData;
    } else if (currentLocation && currentLocation.trim()) {
      // Si hay texto en el campo pero no coordenadas, crear datos básicos
      initialLocationData = {
        address: currentLocation,
        latitude: -0.1807, // Coordenadas por defecto (Quito)
        longitude: -78.4678
      };
    }
    // Si no hay datos, el modal usará ubicación actual del usuario
    
    const dialogRef = this.dialog.open(LocationMapComponent, {
      width: '900px',
      height: '800px',
      maxHeight: '90vh',
      data: {
        initialLocation: initialLocationData
      }
    });

    dialogRef.afterClosed().subscribe((result: LocationData) => {
      if (result) {
        console.log('LocationData received:', result);
        this.selectedLocationData = result;
        this.tournamentForm.patchValue({
          location: result.address.toUpperCase()
        });
        console.log('selectedLocationData updated:', this.selectedLocationData);
      }
    });
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
   * Mapea TournamentStatusType a TournamentStatusType (método simplificado)
   */
  private mapTournamentStatusToStatusType(status: TournamentStatusType): TournamentStatusType {
    // Como ya usamos TournamentStatusType unificado, simplemente retornamos el valor
    return status;
  }

  /**
   * Carga las fases del torneo creado
   */
  private loadPhases(): void {
    if (!this.createdTournamentId) return;
    
    this.phaseService.getPhasesByTournament(this.createdTournamentId).subscribe({
      next: (phases) => {
        this.phases = phases;
      },
      error: (error) => {
        console.error('Error loading phases:', error);
      }
    });
  }

  /**
   * Crea una nueva fase
   */
  onCreatePhase(): void {
    if (this.phaseForm.valid && this.createdTournamentId) {
      this.isCreatingPhase = true;
      
      const phaseData: CreatePhaseRequest = {
        name: this.phaseForm.value.name,
        phaseType: this.phaseForm.value.phaseType
      };

      this.phaseService.createPhase(this.createdTournamentId, phaseData).subscribe({
        next: (response) => {
          this.isCreatingPhase = false;
          if (response.succeed) {
            this.phaseForm.reset();
            this.loadPhases();
          }
        },
        error: (error) => {
          this.isCreatingPhase = false;
          console.error('Error creating phase:', error);
        }
      });
    } else {
      this.markPhaseFormTouched();
    }
  }

  /**
   * Crea un nuevo grupo para la fase seleccionada
   */
  onCreateGroup(): void {
    if (this.groupForm.valid && this.selectedPhaseId) {
      this.isCreatingGroup = true;
      
      const groupData: CreateGroupRequest = {
        name: this.groupForm.value.name
      };

      this.phaseService.createGroup(this.selectedPhaseId, groupData).subscribe({
        next: (response) => {
          this.isCreatingGroup = false;
          if (response.succeed) {
            this.groupForm.reset();
            this.loadPhases(); // Recargar para mostrar el nuevo grupo
          }
        },
        error: (error) => {
          this.isCreatingGroup = false;
          console.error('Error creating group:', error);
        }
      });
    } else {
      this.markGroupFormTouched();
    }
  }

  /**
   * Selecciona una fase para crear grupos
   */
  onSelectPhase(phaseId: number): void {
    this.selectedPhaseId = phaseId;
  }

  /**
   * Marca todos los campos del formulario de fase como tocados
   */
  private markPhaseFormTouched(): void {
    Object.keys(this.phaseForm.controls).forEach(key => {
      this.phaseForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Marca todos los campos del formulario de grupo como tocados
   */
  private markGroupFormTouched(): void {
    Object.keys(this.groupForm.controls).forEach(key => {
      this.groupForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Obtiene el mensaje de error para campos de fase
   */
  getPhaseErrorMessage(fieldName: string): string {
    const field = this.phaseForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength']?.requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    return '';
  }

  /**
   * Obtiene el mensaje de error para campos de grupo
   */
  getGroupErrorMessage(fieldName: string): string {
    const field = this.groupForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength']?.requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    return '';
  }

  /**
   * Finaliza la configuración del torneo y cierra el modal
   */
  onFinishTournamentSetup(): void {
    this.dialogRef.close(true);
  }

  /**
   * Obtiene el texto del tipo de fase
   */
  getPhaseTypeText(phaseType: number): string {
    return this.phaseService.getPhaseTypeText(phaseType);
  }

  /**
   * TrackBy function para optimizar el rendimiento de la lista de fases
   */
  trackByPhaseId(index: number, phase: Phase): number {
    return phase.id;
  }

  /**
   * TrackBy function para optimizar el rendimiento de la lista de grupos
   */
  trackByGroupId(index: number, group: any): number {
    return group.id;
  }
}
