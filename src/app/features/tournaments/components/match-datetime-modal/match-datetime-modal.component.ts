import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

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
    MatNativeDateModule,
    MatIconModule,
    MatSelectModule,
    MatOptionModule
  ],
  templateUrl: './match-datetime-modal.component.html',
  styleUrls: ['./match-datetime-modal.component.scss']
})
export class MatchDatetimeModalComponent implements OnInit {
  dateTimeForm: FormGroup;
  isSubmitting = false;
  
  // Opciones para el time picker personalizado
  timeOptions: string[] = [];
  
  // Configuración de fecha mínima (hoy)
  minDate = new Date();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<MatchDatetimeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MatchDateTimeData
  ) {
    this.dateTimeForm = this.fb.group({
      matchDate: [null, Validators.required],
      matchTime: ['', Validators.required]
    });
    
    // Generar opciones de tiempo cada 15 minutos
    this.generateTimeOptions();
  }

  ngOnInit(): void {
    this.initializeForm();
  }
  
  /**
   * Genera opciones de tiempo cada 15 minutos
   */
  private generateTimeOptions(): void {
    this.timeOptions = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        this.timeOptions.push(timeString);
      }
    }
  }

  private initializeForm(): void {
    // Convertir la fecha actual a Date object
    let initialDate: Date | null = null;
    let initialTime = '15:00';

    if (this.data.currentDate && this.data.currentDate !== '0001-01-01T00:00:00') {
      const date = new Date(this.data.currentDate);
      if (!isNaN(date.getTime())) {
        initialDate = date;
        // Extraer la hora si está disponible
        const timeFromDate = date.toTimeString().slice(0, 5);
        // Buscar la hora más cercana en las opciones disponibles
        initialTime = this.findClosestTime(timeFromDate);
      }
    }

    // Si hay tiempo específico, usarlo
    if (this.data.currentTime) {
      const cleanTime = this.data.currentTime.replace('h', '').trim();
      initialTime = this.findClosestTime(cleanTime);
    }

    this.dateTimeForm.patchValue({
      matchDate: initialDate,
      matchTime: initialTime
    });
  }
  
  /**
   * Encuentra la hora más cercana disponible en las opciones
   */
  private findClosestTime(targetTime: string): string {
    if (!targetTime || targetTime.length < 5) {
      return '15:00';
    }
    
    // Si la hora exacta existe en las opciones, usarla
    if (this.timeOptions.includes(targetTime)) {
      return targetTime;
    }
    
    // Buscar la hora más cercana
    const [targetHour, targetMinute] = targetTime.split(':').map(Number);
    const targetMinutes = targetHour * 60 + targetMinute;
    
    let closestTime = '15:00';
    let minDifference = Infinity;
    
    for (const timeOption of this.timeOptions) {
      const [hour, minute] = timeOption.split(':').map(Number);
      const optionMinutes = hour * 60 + minute;
      const difference = Math.abs(targetMinutes - optionMinutes);
      
      if (difference < minDifference) {
        minDifference = difference;
        closestTime = timeOption;
      }
    }
    
    return closestTime;
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  onUpdate(): void {
    if (this.dateTimeForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.dateTimeForm.value;
      const selectedDate = formValue.matchDate as Date;
      const selectedTime = formValue.matchTime as string;

      // Combinar fecha y hora
      const combinedDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      combinedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const result: MatchDateTimeResult = {
        success: true,
        date: combinedDateTime.toISOString(),
        time: selectedTime
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
