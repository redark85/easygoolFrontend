import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DocumentUploaderComponent, DocumentUploadData } from '../document-uploader/document-uploader.component';
import Swal from 'sweetalert2';

export interface DocumentUploadModalData {
  title: string;
  maxFileSizeMB: number;
  allowedTypes: string[];
  allowedExtensions: string[];
  acceptAttribute: string;
  message?: string;
  teamName?: string;
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
    @Inject(MAT_DIALOG_DATA) public data: DocumentUploadModalData
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
      teamName: this.data.teamName || ''
    };
  }

  onDocumentUploaded(documentData: DocumentUploadData): void {
    this.documentForm.patchValue({ document: documentData });
  }

  onSubmit(): void {
    if (this.documentForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      // Simular delay de subida
      setTimeout(() => {
        const documentData = this.documentForm.get('document')?.value;
        
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
      }, 1500);
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
}
