import { Component, forwardRef, HostListener, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ToastService } from '@core/services/toast.service';
import { convertCloudinaryToHttps } from '../../utils/url.utils';

export interface ImageUploadData {
  base64: string;
  contentType: string;
}

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './image-uploader.component.html',
  styleUrls: ['./image-uploader.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImageUploaderComponent),
      multi: true
    }
  ]
})
export class ImageUploaderComponent implements ControlValueAccessor {
  @Input() maxFileSizeMB = 1;
  @Input() viewUploadText: string = '';
  @Output() imageUploaded = new EventEmitter<ImageUploadData>();

  previewUrl: string | ArrayBuffer | null = null;
  isDragging = false;
  isDisabled = false;

  private onChange: (value: ImageUploadData | null) => void = () => {};
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

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result;
      const base64String = reader.result as string;
      const imageUploadData: ImageUploadData = {
        base64: base64String,
        contentType: file.type
      };
      this.onChange(imageUploadData);
      this.onTouched();
      this.imageUploaded.emit(imageUploadData);
    };
    reader.readAsDataURL(file);
  }

  private isValidFile(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.toastService.showError('Tipo de archivo no permitido. Solo se aceptan imágenes.');
      return false;
    }

    const maxSizeBytes = this.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.toastService.showError(`El archivo es demasiado grande. El tamaño máximo es ${this.maxFileSizeMB}MB.`);
      return false;
    }

    return true;
  }

  async writeValue(value: ImageUploadData | string | null): Promise<void> {
    if (value) {
      if (typeof value === 'string') {
        // Si es una URL, convertirla a base64 para evitar problemas CORS en producción
        try {
          const imageData = await this.convertUrlToBase64(value);
          this.previewUrl = imageData.base64;
        } catch (error) {
          console.warn('Error loading image from URL, using URL directly:', error);
          this.previewUrl = value; // Fallback a URL directa
        }
      } else if (value.base64) {
        // Si ya es base64, usarlo directamente
        this.previewUrl = value.base64;
      }
      // Forzar detección de cambios
      setTimeout(() => {
      }, 0);
    } else {
      this.previewUrl = null;
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

  removeImage(): void {
    this.previewUrl = null;
    this.onChange(null);
    this.onTouched();
  }

  /**
   * Maneja errores de carga de imagen
   */
  onImageError(event: Event): void {
    console.warn('Error loading image:', event);
    this.toastService.showError('Error al cargar la imagen');
  }

  /**
   * Maneja la carga exitosa de imagen
   */
  onImageLoad(event: Event): void {
    console.log('Image loaded successfully');
  }

  /**
   * Convierte una URL de imagen a base64 para evitar problemas CORS en producción
   */
  private async convertUrlToBase64(imageUrl: string): Promise<{base64: string, contentType: string}> {
    try {
      // Convertir HTTP a HTTPS para evitar Mixed Content en producción
      const httpsUrl = convertCloudinaryToHttps(imageUrl);

      // Agregar headers para evitar problemas CORS
      const response = await fetch(httpsUrl, {
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'image/*'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const contentType = blob.type || 'image/jpeg';

          resolve({
            base64: base64String,
            contentType: contentType
          });
        };
        reader.onerror = () => reject(new Error('Error reading blob as base64'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image URL to base64:', error);
      throw error;
    }
  }
}
