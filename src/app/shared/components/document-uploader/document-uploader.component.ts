import { Component, forwardRef, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ToastService } from '@core/services/toast.service';

export interface DocumentUploadData {
  base64: string;
  contentType: string;
  fileName: string;
  fileSize: number;
}

@Component({
  selector: 'app-document-uploader',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './document-uploader.component.html',
  styleUrls: ['./document-uploader.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DocumentUploaderComponent),
      multi: true
    }
  ]
})
export class DocumentUploaderComponent implements ControlValueAccessor {
  @Input() maxFileSizeMB = 1;
  @Input() title = 'Subir documento';
  @Input() allowedTypes: string[] = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']; // Excel .xlsx
  @Input() allowedExtensions: string[] = ['.xlsx'];
  @Input() acceptAttribute = '.xlsx';
  @Output() documentUploaded = new EventEmitter<DocumentUploadData>();

  selectedFile: File | null = null;
  isDragging = false;
  isDisabled = false;

  private onChange: (value: DocumentUploadData | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private toastService: ToastService) {}

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isDisabled) {
      this.isDragging = true;
    }
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (!this.isDisabled && event.dataTransfer?.files) {
      const file = event.dataTransfer.files[0];
      this.handleFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files[0]) {
      const file = element.files[0];
      this.handleFile(file);
    }
  }

  private handleFile(file: File): void {
    if (!this.isValidFile(file)) return;

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      const documentUploadData: DocumentUploadData = {
        base64: base64String,
        contentType: file.type,
        fileName: file.name,
        fileSize: file.size
      };
      this.onChange(documentUploadData);
      this.onTouched();
      this.documentUploaded.emit(documentUploadData);
    };
    reader.readAsDataURL(file);
  }

  private isValidFile(file: File): boolean {
    // Validar tipo de archivo
    if (!this.allowedTypes.includes(file.type)) {
      this.toastService.showError(`Tipo de archivo no permitido. Solo se aceptan archivos: ${this.allowedExtensions.join(', ')}`);
      return false;
    }

    // Validar extensión
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedExtensions.includes(fileExtension)) {
      this.toastService.showError(`Extensión de archivo no permitida. Solo se aceptan: ${this.allowedExtensions.join(', ')}`);
      return false;
    }

    // Validar tamaño
    const maxSizeBytes = this.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.toastService.showError(`El archivo es demasiado grande. El tamaño máximo es ${this.maxFileSizeMB}MB.`);
      return false;
    }

    return true;
  }

  writeValue(value: DocumentUploadData | null): void {
    if (value && value.fileName) {
      // Simular archivo seleccionado para mostrar en la UI
      this.selectedFile = new File([''], value.fileName, { type: value.contentType });
    } else {
      this.selectedFile = null;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  removeDocument(): void {
    this.selectedFile = null;
    this.onChange(null);
    this.onTouched();
  }

  /**
   * Formatea el tamaño del archivo en formato legible
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Obtiene el nombre de archivo sin extensión para mostrar
   */
  getFileDisplayName(): string {
    if (!this.selectedFile) return '';
    const name = this.selectedFile.name;
    const lastDotIndex = name.lastIndexOf('.');
    return lastDotIndex > 0 ? name.substring(0, lastDotIndex) : name;
  }

  /**
   * Obtiene la extensión del archivo
   */
  getFileExtension(): string {
    if (!this.selectedFile) return '';
    const name = this.selectedFile.name;
    const lastDotIndex = name.lastIndexOf('.');
    return lastDotIndex > 0 ? name.substring(lastDotIndex) : '';
  }
}
