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
    @Inject(MAT_DIALOG_DATA) public data: MatchDateTimeData
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
    // Convertir la fecha actual a Date object
    let initialDate: Date | null = null;
    let initialTime: Date | null = null;

    if (this.data.currentDate && this.data.currentDate !== '0001-01-01T00:00:00') {
      const date = new Date(this.data.currentDate);
      if (!isNaN(date.getTime())) {
        initialDate = date;
        // Usar la misma fecha para el time picker
        initialTime = new Date(date);
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

    // Si no hay tiempo inicial, usar 15:00 por defecto
    if (!initialTime) {
      const defaultTime = new Date();
      defaultTime.setHours(15, 0, 0, 0);
      initialTime = defaultTime;
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

      // Formatear la hora para mostrar
      const timeString = selectedTime.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const result: MatchDateTimeResult = {
        success: true,
        date: combinedDateTime.toISOString(),
        time: timeString
      };

      // Simular un pequeño delay para mostrar el estado de carga
      setTimeout(() => {
        this.dialogRef.close(result);
      }, 300);
    }
  }

  get isFormValid(): boolean {
    return this.dateTimeForm.valid;
  }
}
