import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
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
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './match-datetime-modal.component.html',
  styleUrls: ['./match-datetime-modal.component.scss']
})
export class MatchDatetimeModalComponent implements OnInit {
  dateTimeForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<MatchDatetimeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MatchDateTimeData
  ) {
    this.dateTimeForm = this.fb.group({
      matchDate: [null, Validators.required],
      matchTime: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.initializeForm();
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
        initialTime = date.toTimeString().slice(0, 5);
      }
    }

    // Si hay tiempo específico, usarlo
    if (this.data.currentTime) {
      initialTime = this.data.currentTime.replace('h', '');
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
