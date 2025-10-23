import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { ToastService, TeamService as CoreTeamService } from '@core/services';
import { ManagerTeam } from '@core/models';
import { ImageUploaderComponent, ImageUploadData } from '@shared/components/image-uploader/image-uploader.component';
import { TeamService as TournamentTeamService } from '@features/tournaments/services/team.service';
import { TournamentService } from '@features/tournaments/services/tournament.service';
import { CreateTeamRequest } from '@features/tournaments/models/team.interface';

interface TournamentOption {
  id: number;
  name: string;
  categories: CategoryOption[];
}

interface CategoryOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-create-team-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ImageUploaderComponent
  ],
  templateUrl: './create-team-modal.component.html',
  styleUrls: ['./create-team-modal.component.scss']
})
export class CreateTeamModalComponent implements OnInit, OnDestroy {
  // Formularios para ambos tabs
  existingTeamForm!: FormGroup;
  newTeamForm!: FormGroup;
  teamForm!: FormGroup; // Mantenido para compatibilidad

  // Control de tabs
  selectedTabIndex = 0;

  // Datos compartidos
  tournaments: TournamentOption[] = [];
  availableCategories: CategoryOption[] = []; // Para tab Nuevo Equipo
  availableCategoriesExisting: CategoryOption[] = []; // Para tab Equipo Existente
  
  // Equipos del usuario
  myTeams: ManagerTeam[] = [];

  // Estados de carga
  isLoadingTournaments = false;
  isLoadingTeams = false;
  isLoadingCategories = false;
  isSubmitting = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private tournamentTeamService: TournamentTeamService,
    private tournamentService: TournamentService,
    private teamService: CoreTeamService,
    private toastService: ToastService,
    public dialogRef: MatDialogRef<CreateTeamModalComponent>
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadTournaments();
    this.loadMyTeams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    // Formulario para equipo existente
    this.existingTeamForm = this.fb.group({
      tournamentId: ['', Validators.required],
      categoryId: ['', Validators.required],
      teamId: ['', Validators.required]
    });

    // Formulario para nuevo equipo
    this.newTeamForm = this.fb.group({
      tournamentId: ['', Validators.required],
      categoryId: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      shortName: ['', [Validators.maxLength(100)]],
      logo: [null]
    });

    // Mantener teamForm para compatibilidad con métodos existentes
    this.teamForm = this.newTeamForm;
  }

  private loadTournaments(): void {
    this.isLoadingTournaments = true;
    this.tournamentService.getTournamentsToAllowTeamRegistration()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tournaments) => {
          // Filtrar solo torneos que tienen categorías disponibles
          this.tournaments = tournaments.filter(tournament => 
            tournament.categories && tournament.categories.length > 0
          );
          this.isLoadingTournaments = false;
          console.log('📊 Torneos con categorías cargados:', this.tournaments);
          
          // Inicializar valores por defecto (primer torneo y primera categoría)
          this.initializeDefaultValues();
        },
        error: (error) => {
          console.error('Error loading tournaments:', error);
          this.tournaments = [];
          this.isLoadingTournaments = false;
        }
      });
  }

  private loadMyTeams(): void {
    this.isLoadingTeams = true;
    this.teamService.getAllManagerTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (teams) => {
          this.myTeams = teams;
          this.isLoadingTeams = false;
          console.log('👥 Equipos del usuario cargados:', this.myTeams.length);
        },
        error: (error) => {
          console.error('Error loading user teams:', error);
          this.myTeams = [];
          this.isLoadingTeams = false;
        }
      });
  }

  /**
   * Inicializa valores por defecto: primer torneo y primera categoría para ambos formularios
   */
  private initializeDefaultValues(): void {
    if (this.tournaments.length > 0) {
      const firstTournament = this.tournaments[0];
      console.log('🎯 Inicializando valores por defecto:', {
        tournamentId: firstTournament.id,
        tournamentName: firstTournament.name,
        categoriesCount: firstTournament.categories.length
      });
      
      // Establecer primer torneo por defecto en ambos formularios
      this.existingTeamForm.patchValue({
        tournamentId: firstTournament.id
      });
      this.newTeamForm.patchValue({
        tournamentId: firstTournament.id
      });
      
      // Establecer categorías del primer torneo para ambos tabs
      this.availableCategories = firstTournament.categories; // Para tab Nuevo Equipo
      this.availableCategoriesExisting = firstTournament.categories; // Para tab Equipo Existente
      
      // Establecer primera categoría por defecto en ambos formularios
      if (this.availableCategories.length > 0) {
        const firstCategoryId = this.availableCategories[0].id;
        this.existingTeamForm.patchValue({
          categoryId: firstCategoryId
        });
        this.newTeamForm.patchValue({
          categoryId: firstCategoryId
        });
        console.log('✅ Valores por defecto establecidos en ambos formularios:', {
          tournamentId: firstTournament.id,
          categoryId: firstCategoryId,
          categoryName: this.availableCategories[0].name
        });
      }
    }
  }

  /**
   * Maneja el cambio de torneo en el tab Nuevo Equipo
   */
  onTournamentChange(tournamentId: number): void {
    console.log('🔄 Cambio de torneo detectado (Nuevo Equipo):', tournamentId);
    
    const selectedTournament = this.tournaments.find(t => t.id === tournamentId);
    if (selectedTournament) {
      // Actualizar categorías disponibles para Nuevo Equipo
      this.availableCategories = selectedTournament.categories;
      console.log('📋 Categorías actualizadas (Nuevo Equipo):', this.availableCategories);
      
      // Resetear y establecer primera categoría por defecto
      if (this.availableCategories.length > 0) {
        this.newTeamForm.patchValue({
          categoryId: this.availableCategories[0].id
        });
        console.log('✅ Primera categoría seleccionada automáticamente (Nuevo Equipo):', {
          categoryId: this.availableCategories[0].id,
          categoryName: this.availableCategories[0].name
        });
      } else {
        // Si no hay categorías, limpiar el campo
        this.newTeamForm.patchValue({
          categoryId: ''
        });
        console.log('⚠️ No hay categorías disponibles para este torneo (Nuevo Equipo)');
      }
    }
  }

  /**
   * Maneja el cambio de torneo en el tab Equipo Existente
   */
  onExistingTournamentChange(tournamentId: number): void {
    console.log('🔄 Cambio de torneo detectado (Equipo Existente):', tournamentId);
    
    const selectedTournament = this.tournaments.find(t => t.id === tournamentId);
    if (selectedTournament) {
      // Actualizar categorías disponibles para Equipo Existente
      this.availableCategoriesExisting = selectedTournament.categories;
      console.log('📋 Categorías actualizadas (Equipo Existente):', this.availableCategoriesExisting);
      
      // Resetear y establecer primera categoría por defecto
      if (this.availableCategoriesExisting.length > 0) {
        this.existingTeamForm.patchValue({
          categoryId: this.availableCategoriesExisting[0].id
        });
        console.log('✅ Primera categoría seleccionada automáticamente (Equipo Existente):', {
          categoryId: this.availableCategoriesExisting[0].id,
          categoryName: this.availableCategoriesExisting[0].name
        });
      } else {
        // Si no hay categorías, limpiar el campo
        this.existingTeamForm.patchValue({
          categoryId: ''
        });
        console.log('⚠️ No hay categorías disponibles para este torneo (Equipo Existente)');
      }
    }
  }

  /**
   * Selecciona un equipo existente
   */
  selectTeam(teamId: number): void {
    const selectedTeam = this.myTeams.find(team => team.id === teamId);
    this.existingTeamForm.patchValue({ teamId });
    this.existingTeamForm.get('teamId')?.markAsTouched();
    console.log('👥 Equipo seleccionado:', {
      teamId,
      teamName: selectedTeam?.name,
      formValue: this.existingTeamForm.value
    });
  }

  onImageUploaded(imageData: ImageUploadData): void {
    this.newTeamForm.patchValue({
      logo: imageData
    });
    this.newTeamForm.get('logo')?.markAsTouched();
  }

  onSubmit(): void {
    if (this.selectedTabIndex === 0) {
      this.registerExistingTeam();
    } else {
      this.createNewTeam();
    }
  }

  private registerExistingTeam(): void {
    if (this.existingTeamForm.invalid) {
      this.markFormGroupTouched(this.existingTeamForm);
      this.toastService.showError('Por favor, selecciona un equipo y categoría');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.existingTeamForm.value;
    const teamId = formValue.teamId;
    const categoryId = formValue.categoryId;
    const tournamentId = formValue.tournamentId;

    console.log('📝 Registrando equipo existente:', { tournamentId, teamId, categoryId });

    this.teamService.registerTournamentTeam(tournamentId, teamId, categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toastService.showSuccess('Equipo registrado exitosamente en el torneo');
          this.dialogRef.close({ success: true, isNewTeam: false, teamId, categoryId });
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error al registrar equipo:', error);
          this.toastService.showError(error.message || 'Error al registrar el equipo en el torneo');
        }
      });
  }

  private createNewTeam(): void {
    if (this.newTeamForm.invalid) {
      this.markFormGroupTouched(this.newTeamForm);
      this.toastService.showError('Por favor, completa todos los campos requeridos');
      return;
    }

    const formValue = this.newTeamForm.value;
    
    // Validación adicional para categoryId
    if (!formValue.categoryId) {
      this.toastService.showError('Debes seleccionar una categoría');
      return;
    }

    this.isSubmitting = true;
    const logoData = formValue.logo as ImageUploadData;

    const teamData: CreateTeamRequest = {
      tournamentId: formValue.tournamentId,
      categoryId: formValue.categoryId,
      name: formValue.name,
      shortName: formValue.shortName || '',
      logoBase64: logoData ? this.cleanBase64(logoData.base64) : '',
      logoContentType: logoData ? this.extractFileExtension(logoData.contentType) : ''
    };

    console.log('🆕 Creando nuevo equipo:', teamData);

    this.tournamentTeamService.createTeam(teamData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (team) => {
          this.isSubmitting = false;
          this.dialogRef.close({ success: true, isNewTeam: true, team });
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error al crear equipo:', error);
          // El toast de error ya se muestra en el servicio
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(formGroup?: FormGroup): void {
    const form = formGroup || this.teamForm;
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      control?.markAsTouched();
    });
  }

  private cleanBase64(base64String: string): string {
    if (!base64String) return '';
    const base64Prefix = base64String.indexOf(',');
    if (base64Prefix !== -1) {
      return base64String.substring(base64Prefix + 1);
    }
    return base64String;
  }

  private extractFileExtension(contentType: string): string {
    if (!contentType) return '';
    const contentTypeMap: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp'
    };
    const normalizedContentType = contentType.toLowerCase();
    return contentTypeMap[normalizedContentType] || 'jpg';
  }

  get tournamentIdErrors(): string {
    const control = this.teamForm.get('tournamentId');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Debes seleccionar un torneo';
    }
    return '';
  }

  get nameErrors(): string {
    const control = this.teamForm.get('name');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El nombre del equipo es requerido';
      if (control.errors['minlength']) return 'El nombre debe tener al menos 2 caracteres';
      if (control.errors['maxlength']) return 'El nombre no puede exceder 100 caracteres';
    }
    return '';
  }

  get categoryIdErrors(): string {
    const control = this.newTeamForm.get('categoryId');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Debes seleccionar una categoría';
    }
    return '';
  }

  // Getters para errores del formulario de equipo existente
  get existingTournamentIdErrors(): string {
    const control = this.existingTeamForm.get('tournamentId');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Debes seleccionar un torneo';
    }
    return '';
  }

  get existingCategoryErrors(): string {
    const control = this.existingTeamForm.get('categoryId');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Debes seleccionar una categoría';
    }
    return '';
  }

  get teamIdErrors(): string {
    const control = this.existingTeamForm.get('teamId');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Debes seleccionar un equipo';
    }
    return '';
  }
}
