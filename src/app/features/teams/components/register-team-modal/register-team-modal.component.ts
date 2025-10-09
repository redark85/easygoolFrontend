import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { TeamService as CoreTeamService, ToastService } from '@core/services';
import { ManagerTeam } from '@core/models';
import { ImageUploaderComponent, ImageUploadData } from '@shared/components/image-uploader/image-uploader.component';
import { TeamService as TournamentTeamService } from '@features/tournaments/services/team.service';
import { CreateTeamRequest } from '@features/tournaments/models/team.interface';

export interface RegisterTeamModalData {
  tournamentId: number;
  tournamentName: string;
  tournamentImageUrl: string;
}

@Component({
  selector: 'app-register-team-modal',
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
  templateUrl: './register-team-modal.component.html',
  styleUrls: ['./register-team-modal.component.scss']
})
export class RegisterTeamModalComponent implements OnInit, OnDestroy {
  existingTeamForm!: FormGroup;
  newTeamForm!: FormGroup;
  myTeams: ManagerTeam[] = [];
  isLoadingTeams = false;
  isSubmitting = false;
  selectedTabIndex = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private teamService: CoreTeamService,
    private tournamentTeamService: TournamentTeamService,
    private toastService: ToastService,
    public dialogRef: MatDialogRef<RegisterTeamModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RegisterTeamModalData
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadMyTeams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    // Formulario para equipo existente
    this.existingTeamForm = this.fb.group({
      teamId: ['', Validators.required]
    });

    // Formulario para nuevo equipo
    this.newTeamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      shortName: ['', [Validators.maxLength(100)]],
      logo: [null]
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
        },
        error: (error) => {
          console.error('Error loading teams:', error);
          this.myTeams = [];
          this.isLoadingTeams = false;
        }
      });
  }

  onImageUploaded(imageData: ImageUploadData): void {
    this.newTeamForm.patchValue({
      logo: imageData
    });
    this.newTeamForm.get('logo')?.markAsTouched();
  }

  selectTeam(teamId: number): void {
    this.existingTeamForm.patchValue({ teamId });
    this.existingTeamForm.get('teamId')?.markAsTouched();
  }

  onSubmit(): void {
    if (this.selectedTabIndex === 0) {
      this.registerExistingTeam();
    } else {
      this.registerNewTeam();
    }
  }

  private registerExistingTeam(): void {
    if (this.existingTeamForm.invalid) {
      this.markFormGroupTouched(this.existingTeamForm);
      this.toastService.showError('Por favor, selecciona un equipo');
      return;
    }

    this.isSubmitting = true;
    const teamId = this.existingTeamForm.value.teamId;

    this.teamService.registerTournamentTeam(this.data.tournamentId, teamId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toastService.showSuccess('Equipo registrado exitosamente en el torneo');
          this.dialogRef.close({ success: true, isNewTeam: false, teamId });
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error al registrar equipo:', error);
          this.toastService.showError(error.message || 'Error al registrar el equipo en el torneo');
        }
      });
  }

  private registerNewTeam(): void {
    if (this.newTeamForm.invalid) {
      this.markFormGroupTouched(this.newTeamForm);
      this.toastService.showError('Por favor, completa todos los campos requeridos');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.newTeamForm.value;
    const logoData = formValue.logo as ImageUploadData;

    const teamData: CreateTeamRequest = {
      tournamentId: this.data.tournamentId,
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

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
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

  get nameErrors(): string {
    const control = this.newTeamForm.get('name');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El nombre del equipo es requerido';
      if (control.errors['minlength']) return 'El nombre debe tener al menos 2 caracteres';
      if (control.errors['maxlength']) return 'El nombre no puede exceder 100 caracteres';
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
