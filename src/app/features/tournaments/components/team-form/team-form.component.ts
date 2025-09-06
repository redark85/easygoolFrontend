import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageUploaderComponent, ImageUploadData } from '@shared/components/image-uploader/image-uploader.component';
import { ToastService } from '@core/services/toast.service';
import { CreateTeamRequest, UpdateTeamRequest, Team } from '../../models/team.interface';

export interface TeamFormData {
  team?: Team;
  tournamentId: number;
  isEdit: boolean;
}

@Component({
  selector: 'app-team-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ImageUploaderComponent
  ],
  templateUrl: './team-form.component.html',
  styleUrls: ['./team-form.component.scss']
})
export class TeamFormComponent implements OnInit {
  teamForm: FormGroup;
  isEdit: boolean;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    public dialogRef: MatDialogRef<TeamFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TeamFormData
  ) {
    this.isEdit = data.isEdit;
    this.teamForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.isEdit && this.data.team) {
      this.populateForm(this.data.team);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s0-9]+$/)
      ]],
      shortName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(10),
        Validators.pattern(/^[A-Z0-9]+$/)
      ]],
      logo: [null, this.isEdit ? [] : [Validators.required]]
    });
  }

  private populateForm(team: Team): void {
    this.teamForm.patchValue({
      name: team.name,
      shortName: team.shortName,
      logo: team.logoBase64 ? {
        base64: team.logoBase64,
        contentType: team.logoContentType
      } : null
    });
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
      this.toastService.showError('Por favor, completa todos los campos requeridos correctamente.');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.teamForm.value;
    const logoData = formValue.logo as ImageUploadData;

    if (this.isEdit) {
      const updateRequest: UpdateTeamRequest = {
        id: this.data.team!.id,
        tournamentId: this.data.tournamentId,
        name: formValue.name,
        shortName: formValue.shortName.toUpperCase(),
        logoBase64: logoData?.base64 || '',
        logoContentType: logoData?.contentType || ''
      };
      this.dialogRef.close({ action: 'update', data: updateRequest });
    } else {
      const createRequest: CreateTeamRequest = {
        tournamentId: this.data.tournamentId,
        name: formValue.name,
        shortName: formValue.shortName.toUpperCase(),
        logoBase64: logoData.base64,
        logoContentType: logoData.contentType
      };
      this.dialogRef.close({ action: 'create', data: createRequest });
    }
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

  // Getters para validaciones en template
  get nameControl() { return this.teamForm.get('name'); }
  get shortNameControl() { return this.teamForm.get('shortName'); }
  get logoControl() { return this.teamForm.get('logo'); }

  get nameErrors(): string {
    const control = this.nameControl;
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El nombre del equipo es requerido';
      if (control.errors['minlength']) return 'El nombre debe tener al menos 2 caracteres';
      if (control.errors['maxlength']) return 'El nombre no puede exceder 50 caracteres';
      if (control.errors['pattern']) return 'El nombre solo puede contener letras, números y espacios';
    }
    return '';
  }

  get shortNameErrors(): string {
    const control = this.shortNameControl;
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El nombre corto es requerido';
      if (control.errors['minlength']) return 'El nombre corto debe tener al menos 2 caracteres';
      if (control.errors['maxlength']) return 'El nombre corto no puede exceder 10 caracteres';
      if (control.errors['pattern']) return 'El nombre corto solo puede contener letras mayúsculas y números';
    }
    return '';
  }

  get logoErrors(): string {
    const control = this.logoControl;
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El logo del equipo es requerido';
    }
    return '';
  }
}
