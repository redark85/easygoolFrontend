import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';

interface TeamInfo {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  foundedYear: number;
  stadium: string;
  city: string;
  description: string;
  registrationCode: string;
  registrationEnabled: boolean;
  totalPlayers: number;
  activePlayers: number;
}

/**
 * Componente para ver y editar información del equipo
 */
@Component({
  selector: 'app-team-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './team-info.component.html',
  styleUrls: ['./team-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamInfoComponent implements OnInit, OnDestroy {
  teamForm!: FormGroup;
  isEditing = false;
  isLoading = false;
  
  teamInfo: TeamInfo = {
    id: 1,
    name: 'Club Deportivo Ejemplo',
    shortName: 'CDE',
    logoUrl: 'assets/default-team.png',
    primaryColor: '#1976d2',
    secondaryColor: '#ffffff',
    foundedYear: 2020,
    stadium: 'Estadio Municipal',
    city: 'Ciudad Ejemplo',
    description: 'Club deportivo fundado con el objetivo de promover el fútbol en la comunidad.',
    registrationCode: 'ABC123XYZ',
    registrationEnabled: true,
    totalPlayers: 18,
    activePlayers: 16
  };

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadTeamInfo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario
   */
  private initForm(): void {
    this.teamForm = this.fb.group({
      name: [{ value: '', disabled: true }, Validators.required],
      shortName: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(10)]],
      foundedYear: [{ value: '', disabled: true }],
      stadium: [{ value: '', disabled: true }],
      city: [{ value: '', disabled: true }],
      description: [{ value: '', disabled: true }, Validators.maxLength(500)],
      primaryColor: [{ value: '', disabled: true }],
      secondaryColor: [{ value: '', disabled: true }]
    });
  }

  /**
   * Carga la información del equipo
   */
  private loadTeamInfo(): void {
    this.isLoading = true;
    
    // TODO: Cargar datos reales del servicio
    setTimeout(() => {
      this.teamForm.patchValue({
        name: this.teamInfo.name,
        shortName: this.teamInfo.shortName,
        foundedYear: this.teamInfo.foundedYear,
        stadium: this.teamInfo.stadium,
        city: this.teamInfo.city,
        description: this.teamInfo.description,
        primaryColor: this.teamInfo.primaryColor,
        secondaryColor: this.teamInfo.secondaryColor
      });
      
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 500);
  }

  /**
   * Activa el modo edición
   */
  onEdit(): void {
    this.isEditing = true;
    this.teamForm.enable();
    this.cdr.detectChanges();
  }

  /**
   * Cancela la edición
   */
  onCancel(): void {
    this.isEditing = false;
    this.teamForm.disable();
    this.loadTeamInfo();
  }

  /**
   * Guarda los cambios
   */
  onSave(): void {
    if (this.teamForm.invalid) {
      return;
    }

    this.isLoading = true;
    
    // TODO: Guardar cambios en el servicio
    setTimeout(() => {
      const formValue = this.teamForm.value;
      this.teamInfo = { ...this.teamInfo, ...formValue };
      
      this.isEditing = false;
      this.teamForm.disable();
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 1000);
  }

  /**
   * Genera un nuevo código de registro
   */
  onGenerateNewCode(): void {
    // TODO: Implementar generación de nuevo código
    this.teamInfo.registrationCode = this.generateRandomCode();
    this.cdr.detectChanges();
  }

  /**
   * Copia el código de registro al portapapeles
   */
  onCopyCode(): void {
    navigator.clipboard.writeText(this.getRegistrationUrl());
    // TODO: Mostrar toast de éxito
  }

  /**
   * Alterna el estado de registro
   */
  onToggleRegistration(): void {
    this.teamInfo.registrationEnabled = !this.teamInfo.registrationEnabled;
    // TODO: Guardar cambio en el servicio
    this.cdr.detectChanges();
  }

  /**
   * Obtiene la URL completa de registro
   */
  getRegistrationUrl(): string {
    return `${window.location.origin}/register/${this.teamInfo.registrationCode}`;
  }

  /**
   * Genera un código aleatorio
   */
  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 9; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Maneja la selección de logo
   */
  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        this.teamInfo.logoUrl = e.target.result;
        this.cdr.detectChanges();
      };
      
      reader.readAsDataURL(file);
    }
  }
}
