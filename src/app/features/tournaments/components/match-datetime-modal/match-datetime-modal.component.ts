import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatchService } from '@core/services/match.service';
import { ToastService } from '@core/services/toast.service';

export interface MatchDateTimeData {
  matchId: number;
  currentDate: string;
  currentTime?: string;
  homeTeam: string;
  awayTeam: string;
}

export interface MatchDateTimeResult {
  success: boolean;
  date?: string;
  time?: string;
}

@Component({
  selector: 'app-match-datetime-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatTimepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './match-datetime-modal.component.html',
  styleUrls: ['./match-datetime-modal.component.scss']
})
export class MatchDatetimeModalComponent implements OnInit {
  dateTimeForm: FormGroup;
  isSubmitting = false;
  
  // Configuración de fecha mínima (hoy)
  minDate = new Date();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<MatchDatetimeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MatchDateTimeData,
    private matchService: MatchService,
    private toastService: ToastService
  ) {
    this.dateTimeForm = this.fb.group({
      matchDate: [null, Validators.required],
      matchTime: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.initializeForm();
  }
  

  private initializeForm(): void {
    // Obtener fecha y hora actuales
    const now = new Date();
    let initialDate: Date = new Date(now);
    let initialTime: Date = new Date(now);

    // Si hay datos existentes, usarlos en lugar de los actuales
    if (this.data.currentDate && this.data.currentDate !== '0001-01-01T00:00:00') {
      const existingDate = new Date(this.data.currentDate);
      if (!isNaN(existingDate.getTime())) {
        initialDate = existingDate;
        // Usar la misma fecha para el time picker si no hay hora específica
        if (!this.data.currentTime) {
          initialTime = new Date(existingDate);
        }
      }
    }

    // Si hay tiempo específico, crear un Date object con esa hora
    if (this.data.currentTime) {
      const cleanTime = this.data.currentTime.replace('h', '').trim();
      if (cleanTime.includes(':')) {
        const [hours, minutes] = cleanTime.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const timeDate = new Date();
          timeDate.setHours(hours, minutes, 0, 0);
          initialTime = timeDate;
        }
      }
    }

    // Redondear la hora actual a los 15 minutos más cercanos si no hay datos existentes
    if (!this.data.currentDate && !this.data.currentTime) {
      const minutes = now.getMinutes();
      const roundedMinutes = Math.ceil(minutes / 15) * 15;
      initialTime.setMinutes(roundedMinutes, 0, 0);
      
      // Si se pasa de 60 minutos, ajustar la hora
      if (roundedMinutes >= 60) {
        initialTime.setHours(initialTime.getHours() + 1, 0, 0, 0);
      }
    }

    this.dateTimeForm.patchValue({
      matchDate: initialDate,
      matchTime: initialTime
    });
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  onUpdate(): void {
    if (this.dateTimeForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.dateTimeForm.value;
      const selectedDate = formValue.matchDate as Date;
      const selectedTime = formValue.matchTime as Date;

      // Combinar fecha y hora
      const combinedDateTime = new Date(selectedDate);
      combinedDateTime.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes(),
        0,
        0
      );

      // Obtener las horas y minutos en hora local
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();

      // Formatear la hora como HH:mm:ss
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

      // Formatear la fecha completa en hora local (YYYY-MM-DDTHH:mm:ss)
      const year = combinedDateTime.getFullYear();
      const month = (combinedDateTime.getMonth() + 1).toString().padStart(2, '0');
      const day = combinedDateTime.getDate().toString().padStart(2, '0');
      const formattedDateTime = `${year}-${month}-${day}T${formattedTime}`;

      // Llamar al servicio para actualizar la fecha del partido
      this.matchService.updateMatchDate(this.data.matchId, formattedDateTime).subscribe({
        next: () => {
          this.isSubmitting = false;
          
          const result: MatchDateTimeResult = {
            success: true,
            date: formattedDateTime,
            time: formattedTime
          };
          
          this.dialogRef.close(result);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.toastService.showError("La fecha debe ser posterior a la fecha actual.");
        }
      });
    }
  }

  get isFormValid(): boolean {
    return this.dateTimeForm.valid;
  }
}
