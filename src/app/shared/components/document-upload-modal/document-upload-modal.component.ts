import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DocumentUploaderComponent, DocumentUploadData } from '../document-uploader/document-uploader.component';
import { PlayerService } from '@core/services/player.service';
import { ToastService } from '@core/services/toast.service';
import { FileDownloadUtil } from '@shared/utils/file-download.util';
import Swal from 'sweetalert2';

export interface DocumentUploadModalData {
  title: string;
  maxFileSizeMB: number;
  allowedTypes: string[];
  allowedExtensions: string[];
  acceptAttribute: string;
  message?: string;
  teamName?: string;
  tournamentTeamId?: number;
}

export interface DocumentUploadModalResult {
  success: boolean;
  document?: DocumentUploadData;
}

@Component({
  selector: 'app-document-upload-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DocumentUploaderComponent
  ],
  templateUrl: './document-upload-modal.component.html',
  styleUrls: ['./document-upload-modal.component.scss']
})
export class DocumentUploadModalComponent implements OnInit {
  documentForm: FormGroup;
  isSubmitting = false;
  isUploaded = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DocumentUploadModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DocumentUploadModalData,
    private playerService: PlayerService,
    private toastService: ToastService
  ) {
    this.documentForm = this.fb.group({
      document: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    // Configurar valores por defecto si no se proporcionan
    this.data = {
      title: this.data.title || 'Subir documento',
      maxFileSizeMB: this.data.maxFileSizeMB || 1,
      allowedTypes: this.data.allowedTypes || ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      allowedExtensions: this.data.allowedExtensions || ['.xlsx'],
      acceptAttribute: this.data.acceptAttribute || '.xlsx',
      message: this.data.message || '',
      teamName: this.data.teamName || '',
      tournamentTeamId: this.data.tournamentTeamId
    };
  }

  onDocumentUploaded(documentData: DocumentUploadData): void {
    this.documentForm.patchValue({ document: documentData });
  }

  onSubmit(): void {
    if (this.documentForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const documentData = this.documentForm.get('document')?.value;
      
      // Verificar si se proporcionó el tournamentTeamId
      if (!this.data.tournamentTeamId) {
        this.toastService.showError('No se proporcionó el ID del equipo');
        this.isSubmitting = false;
        return;
      }
      
      // Preparar el request
      const request = {
        base64File: this.cleanBase64(documentData.base64) 
      };
      
      // Llamar al servicio
      this.playerService.uploadPlayerExcel(this.data.tournamentTeamId, request)
        .subscribe({
          next: (response) => {
            // Mostrar mensaje de éxito
            Swal.fire({
              title: '¡Documento subido exitosamente!',
              text: `El archivo "${documentData.fileName}" ha sido subido correctamente`,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            }).then(() => {
              // Cerrar modal con resultado exitoso
              this.dialogRef.close({
                success: true,
                document: documentData
              } as DocumentUploadModalResult);
            });
            
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error al subir el archivo:', error);
            this.toastService.showError(error.message || 'Error al subir el archivo Excel');
            this.isSubmitting = false;
          }
        });
    }
  }

  onCancel(): void {
    this.dialogRef.close({
      success: false
    } as DocumentUploadModalResult);
  }

  get hasDocument(): boolean {
    return !!this.documentForm.get('document')?.value;
  }

  private cleanBase64(base64String: string): string {
    if (!base64String) return '';
    const base64Prefix = base64String.indexOf(',');
    if (base64Prefix !== -1) {
      return base64String.substring(base64Prefix + 1);
    }
    return base64String;
  }

  /**
   * Descarga el archivo de ejemplo de Excel para jugadores
   */
  async downloadExampleExcel(): Promise<void> {
    try {
      const success = await FileDownloadUtil.downloadTeamExampleFile();
      
      if (success) {
        Swal.fire({
          title: '¡Descarga iniciada!',
          text: 'El archivo de ejemplo se está descargando',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          title: 'Error en la descarga',
          text: 'No se pudo descargar el archivo de ejemplo',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    } catch (error) {
      console.error('Error al descargar el archivo de ejemplo:', error);
      this.toastService.showError('Error al descargar el archivo de ejemplo');
    }
  }
}
