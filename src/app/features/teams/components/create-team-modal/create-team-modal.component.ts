import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '@core/services';
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
  teamForm!: FormGroup;
  tournaments: TournamentOption[] = [];
  availableCategories: CategoryOption[] = [];
  isLoadingTournaments = false;
  isSubmitting = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private tournamentTeamService: TournamentTeamService,
    private tournamentService: TournamentService,
    private toastService: ToastService,
    public dialogRef: MatDialogRef<CreateTeamModalComponent>
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadTournaments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.teamForm = this.fb.group({
      tournamentId: ['', Validators.required],
      categoryId: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      shortName: ['', [Validators.maxLength(100)]],
      logo: [null]
    });
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

  /**
   * Inicializa valores por defecto: primer torneo y primera categoría
   */
  private initializeDefaultValues(): void {
    if (this.tournaments.length > 0) {
      const firstTournament = this.tournaments[0];
      console.log('🎯 Inicializando valores por defecto:', {
        tournamentId: firstTournament.id,
        tournamentName: firstTournament.name,
        categoriesCount: firstTournament.categories.length
      });
      
      // Establecer primer torneo por defecto
      this.teamForm.patchValue({
        tournamentId: firstTournament.id
      });
      
      // Establecer categorías del primer torneo
      this.availableCategories = firstTournament.categories;
      
      // Establecer primera categoría por defecto
      if (this.availableCategories.length > 0) {
        this.teamForm.patchValue({
          categoryId: this.availableCategories[0].id
        });
        console.log('✅ Valores por defecto establecidos:', {
          tournamentId: firstTournament.id,
          categoryId: this.availableCategories[0].id,
          categoryName: this.availableCategories[0].name
        });
      }
    }
  }

  /**
   * Maneja el cambio de torneo y actualiza las categorías disponibles
   */
  onTournamentChange(tournamentId: number): void {
    console.log('🔄 Cambio de torneo detectado:', tournamentId);
    
    const selectedTournament = this.tournaments.find(t => t.id === tournamentId);
    if (selectedTournament) {
      // Actualizar categorías disponibles
      this.availableCategories = selectedTournament.categories;
      console.log('📋 Categorías actualizadas:', this.availableCategories);
      
      // Resetear y establecer primera categoría por defecto
      if (this.availableCategories.length > 0) {
        this.teamForm.patchValue({
          categoryId: this.availableCategories[0].id
        });
        console.log('✅ Primera categoría seleccionada automáticamente:', {
          categoryId: this.availableCategories[0].id,
          categoryName: this.availableCategories[0].name
        });
      } else {
        // Si no hay categorías, limpiar el campo
        this.teamForm.patchValue({
          categoryId: ''
        });
        console.log('⚠️ No hay categorías disponibles para este torneo');
      }
    }
  }

  onImageUploaded(imageData: ImageUploadData): void {
    this.teamForm.patchValue({
      logo: imageData
    });
    this.teamForm.get('logo')?.markAsTouched();
  }

  onSubmit(): void {
    if (this.teamForm.invalid) {
      this.markFormGroupTouched();
      this.toastService.showError('Por favor, completa todos los campos requeridos');
      return;
    }

    const formValue = this.teamForm.value;
    
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

    this.tournamentTeamService.createTeam(teamData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (team) => {
          this.isSubmitting = false;
          this.dialogRef.close({ success: true, team });
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

  private markFormGroupTouched(): void {
    Object.keys(this.teamForm.controls).forEach(key => {
      const control = this.teamForm.get(key);
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
    const control = this.teamForm.get('categoryId');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Debes seleccionar una categoría';
    }
    return '';
  }
}
