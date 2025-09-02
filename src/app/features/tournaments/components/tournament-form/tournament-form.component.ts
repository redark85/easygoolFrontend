import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ImageUploaderComponent, ImageUploadData } from '@shared/components/image-uploader/image-uploader.component';
import { TournamentService } from '../../services/tournament.service';
import { CreateTournamentRequest, TournamentModality, Tournament } from '../../models/tournament.interface';
import { dateRangeValidator } from '@shared/validators/date-range.validator';

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
    ImageUploaderComponent
  ],
  templateUrl: './tournament-form.component.html',
  styleUrls: ['./tournament-form.component.scss']
})
export class TournamentFormComponent implements OnInit {
  tournamentForm!: FormGroup;
  isSubmitting = false;
  isEditMode = false;
  uploadedImage: ImageUploadData | null = null;
  
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
    private dialogRef: MatDialogRef<TournamentFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TournamentFormData
  ) {
    this.isEditMode = this.data?.mode === 'edit';
    this.initializeForm();
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.tournament) {
      this.patchForm(this.data.tournament);
    }
  }

  private initializeForm(): void {
    this.tournamentForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      startDate: [null, Validators.required],
      endDate: [null],
      modality: [null, Validators.required]
    }, { validators: dateRangeValidator });
  }

  private patchForm(tournament: Tournament): void {
    this.tournamentForm.patchValue({
      name: tournament.name,
      description: tournament.description,
      startDate: new Date(tournament.startDate),
      endDate: tournament.endDate ? new Date(tournament.endDate) : null,
      modality: tournament.modality
    });
    
    // Si hay imagen, configurarla
    if (tournament.imageUrl) {
      this.uploadedImage = {
        base64: tournament.imageUrl,
        contentType: 'image/jpeg'
      };
    }
  }

  onImageUploaded(imageData: ImageUploadData): void {
    this.uploadedImage = imageData;
  }

  onSubmit(): void {
    if (this.tournamentForm.valid && this.uploadedImage) {
      this.isSubmitting = true;

      const formValue = this.tournamentForm.value;
      const request: CreateTournamentRequest = {
        name: formValue.name,
        description: formValue.description,
        startDate: formValue.startDate.toISOString(),
        endDate: formValue.endDate ? formValue.endDate.toISOString() : null,
        modality: formValue.modality,
        imageBase64: this.uploadedImage.base64,
        imageContentType: this.uploadedImage.contentType,
        hasPenaltyMode: false
      };

      this.tournamentService.createTournament(request).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.dialogRef.close(response);
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
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
}
