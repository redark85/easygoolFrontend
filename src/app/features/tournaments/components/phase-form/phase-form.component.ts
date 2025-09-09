import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastService } from '@core/services/toast.service';
import { PhaseService } from '../../services/phase.service';
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
export class PhaseFormComponent implements OnInit, OnDestroy {
  phaseForm: FormGroup;
  isEdit: boolean;
  isSubmitting = false;
  tournamentId: number | null = null;
  private destroy$ = new Subject<void>();

  phaseTypeOptions = [
    { value: PhaseType.GroupStage, label: 'Fase de Grupos' },
    { value: PhaseType.Knockout, label: 'Eliminación Directa' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PhaseFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PhaseFormData,
    private toastService: ToastService,
    private phaseService: PhaseService,
    private route: ActivatedRoute
  ) {
    this.isEdit = data.isEdit;
    this.phaseForm = this.createForm();
  }

  ngOnInit(): void {
    // Priorizar tournamentId del data (prop) sobre el de la ruta
    if (this.data.tournamentId) {
      this.tournamentId = this.data.tournamentId;
    } else {
      // Intentar obtener tournamentId de la ruta como fallback
      this.route.params
        .pipe(takeUntil(this.destroy$))
        .subscribe(params => {
          const id = +params['id'];
          if (id && !isNaN(id)) {
            this.tournamentId = id;
          } else {
            this.toastService.showError('ID de torneo inválido');
            this.dialogRef.close();
          }
        });
    }

    if (this.isEdit && this.data.phase) {
      this.patchForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        // TODO: Implementar actualización de fase cuando esté disponible en la API
        const updateData: UpdatePhaseRequest = {
          id: this.data.phase.id,
          name: formValue.name.trim(),
          phaseType: formValue.phaseType
        };
        
        this.toastService.showWarning('Funcionalidad de edición no disponible aún');
        this.isSubmitting = false;
        this.dialogRef.close({
          action: 'update',
          data: updateData
        });
      } else {
        // Crear nueva fase usando la API
        const createData: CreatePhaseRequest = {
          name: formValue.name.trim(),
          phaseType: formValue.phaseType
        };
        
        if (!this.tournamentId) {
          this.toastService.showError('ID de torneo no disponible');
          this.isSubmitting = false;
          return;
        }

        this.phaseService.createPhase(this.tournamentId, createData).subscribe({
          next: (response) => {
            this.isSubmitting = false;
            if (response.succeed) {
              this.dialogRef.close({
                action: 'create',
                data: response.result
              });
            }
          },
          error: (error) => {
            this.isSubmitting = false;
            console.error('Error creating phase:', error);
          }
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
