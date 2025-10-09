import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { DocumentUploadData } from '../components/document-uploader/document-uploader.component';
import { ToastService } from '@core/services/toast.service';

export interface UploadDocumentRequest {
  teamId: number;
  documentBase64: string;
  documentContentType: string;
  fileName: string;
  fileSize: number;
}

export interface UploadDocumentResponse {
  success: boolean;
  message: string;
  documentId?: number;
  uploadedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentUploadService {

  constructor(private toastService: ToastService) {}

  /**
   * Sube un documento Excel para un equipo específico
   * TODO: Implementar integración con API real cuando esté disponible
   * @param request Datos del documento a subir
   * @returns Observable con la respuesta de la subida
   */
  uploadTeamExcel(request: UploadDocumentRequest): Observable<UploadDocumentResponse> {
    // Simulación de llamada API - Reemplazar por integración real
    console.log('Uploading team excel document:', {
      teamId: request.teamId,
      fileName: request.fileName,
      fileSize: request.fileSize,
      contentType: request.documentContentType
    });

    // Simular delay de subida
    return of({
      success: true,
      message: 'Documento subido exitosamente',
      documentId: Math.floor(Math.random() * 1000) + 1,
      uploadedAt: new Date()
    }).pipe(
      delay(1500), // Simular tiempo de subida
      map(response => {
        if (response.success) {
          this.toastService.showSuccess(response.message);
        } else {
          this.toastService.showError(response.message);
        }
        return response;
      })
    );

    // TODO: Implementar llamada real a API
    // return this.apiService.post<UploadDocumentResponse>('/api/Team/UploadExcel', request).pipe(
    //   map(response => {
    //     if (response.succeed) {
    //       this.toastService.showSuccess('Documento subido exitosamente');
    //       return {
    //         success: true,
    //         message: response.message,
    //         documentId: response.result?.documentId,
    //         uploadedAt: response.result?.uploadedAt
    //       };
    //     } else {
    //       this.toastService.showError(response.message || 'Error al subir el documento');
    //       return {
    //         success: false,
    //         message: response.message || 'Error al subir el documento'
    //       };
    //     }
    //   }),
    //   catchError(error => {
    //     this.toastService.showError('Error de conexión al subir el documento');
    //     return throwError(() => error);
    //   })
    // );
  }

  /**
   * Valida si un archivo es un Excel válido
   * @param file Archivo a validar
   * @returns true si es válido, false en caso contrario
   */
  validateExcelFile(file: File): boolean {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls (opcional)
    ];
    
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    return allowedTypes.includes(file.type) && allowedExtensions.includes(fileExtension);
  }

  /**
   * Convierte DocumentUploadData a UploadDocumentRequest
   * @param teamId ID del equipo
   * @param documentData Datos del documento subido
   * @returns Request formateado para la API
   */
  createUploadRequest(teamId: number, documentData: DocumentUploadData): UploadDocumentRequest {
    return {
      teamId,
      documentBase64: documentData.base64,
      documentContentType: documentData.contentType,
      fileName: documentData.fileName,
      fileSize: documentData.fileSize
    };
  }

  /**
   * Formatea el tamaño del archivo en formato legible
   * @param bytes Tamaño en bytes
   * @returns Tamaño formateado (ej: "1.5 MB")
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
