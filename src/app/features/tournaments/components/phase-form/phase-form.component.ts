import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastService } from '@core/services/toast.service';
import { PhaseFormData, CreatePhaseRequest, UpdatePhaseRequest, PhaseType } from '../../models/phase-form.interface';

@Component({
  selector: 'app-phase-form',
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
    MatProgressSpinnerModule
  ],
  templateUrl: './phase-form.component.html',
  styleUrls: ['./phase-form.component.scss']
})
export class PhaseFormComponent implements OnInit {
  phaseForm: FormGroup;
  isEdit: boolean;
  isSubmitting = false;

  phaseTypeOptions = [
    { value: PhaseType.GroupStage, label: 'Fase de Grupos' },
    { value: PhaseType.Knockout, label: 'Eliminación Directa' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PhaseFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PhaseFormData,
    private toastService: ToastService
  ) {
    this.isEdit = data.isEdit;
    this.phaseForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.isEdit && this.data.phase) {
      this.patchForm();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      phaseType: [PhaseType.GroupStage, [Validators.required]]
    });
  }

  private patchForm(): void {
    if (this.data.phase) {
      this.phaseForm.patchValue({
        name: this.data.phase.name,
        phaseType: this.data.phase.phaseType
      });
    }
  }

  get nameErrors(): string | null {
    const nameControl = this.phaseForm.get('name');
    if (nameControl?.errors && nameControl.touched) {
      if (nameControl.errors['required']) {
        return 'El nombre de la fase es obligatorio';
      }
      if (nameControl.errors['minlength']) {
        return 'El nombre debe tener al menos 2 caracteres';
      }
      if (nameControl.errors['maxlength']) {
        return 'El nombre no puede exceder 50 caracteres';
      }
    }
    return null;
  }

  get phaseTypeErrors(): string | null {
    const phaseTypeControl = this.phaseForm.get('phaseType');
    if (phaseTypeControl?.errors && phaseTypeControl.touched) {
      if (phaseTypeControl.errors['required']) {
        return 'El tipo de fase es obligatorio';
      }
    }
    return null;
  }

  onSubmit(): void {
    if (this.phaseForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.phaseForm.value;
      
      if (this.isEdit && this.data.phase) {
        const updateData: UpdatePhaseRequest = {
          id: this.data.phase.id,
          name: formValue.name.trim(),
          phaseType: formValue.phaseType
        };
        
        this.dialogRef.close({
          action: 'update',
          data: updateData
        });
      } else {
        const createData: CreatePhaseRequest = {
          name: formValue.name.trim(),
          phaseType: formValue.phaseType
        };
        
        this.dialogRef.close({
          action: 'create',
          data: createData
        });
      }
    } else {
      this.phaseForm.markAllAsTouched();
      this.toastService.showError('Por favor, completa todos los campos requeridos');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
