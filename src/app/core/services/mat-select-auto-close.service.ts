import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { MatSelect } from '@angular/material/select';

/**
 * Servicio global para manejar el cierre automático de todos los mat-select
 * Se ejecuta automáticamente sin necesidad de configuración adicional
 */
@Injectable({
  providedIn: 'root'
})
export class MatSelectAutoCloseService implements OnDestroy {
  private activeSelects = new Set<MatSelect>();
  private globalClickListener?: (event: Event) => void;
  private isListenerActive = false;

  constructor(private ngZone: NgZone) {
    this.initializeGlobalListener();
  }

  ngOnDestroy(): void {
    this.removeGlobalListener();
  }

  /**
   * Registra un mat-select para el manejo automático de cierre
   */
  registerSelect(matSelect: MatSelect): void {
    // Escuchar cuando el select se abre/cierra
    const subscription = matSelect.openedChange.subscribe((isOpen: boolean) => {
      if (isOpen) {
        this.activeSelects.add(matSelect);
        this.activateGlobalListener();
      } else {
        this.activeSelects.delete(matSelect);
        if (this.activeSelects.size === 0) {
          this.deactivateGlobalListener();
        }
      }
    });

    // Almacenar la suscripción para limpieza posterior
    // Nota: La limpieza se hará automáticamente cuando el componente se destruya
  }

  private initializeGlobalListener(): void {
    this.globalClickListener = (event: Event) => {
      if (this.activeSelects.size === 0) return;

      const target = event.target as HTMLElement;
      
      // Verificar cada select activo
      this.activeSelects.forEach(matSelect => {
        const selectElement = matSelect._elementRef.nativeElement;
        const selectPanel = document.querySelector('.mat-select-panel');
        
        // Si el clic fue fuera del select y del panel, cerrarlo
        if (!selectElement.contains(target) && !selectPanel?.contains(target)) {
          this.ngZone.run(() => {
            matSelect.close();
          });
        }
      });
    };
  }

  private activateGlobalListener(): void {
    if (!this.isListenerActive && this.globalClickListener) {
      // Esperar un tick para que el select termine de abrirse
      setTimeout(() => {
        this.ngZone.runOutsideAngular(() => {
          document.addEventListener('click', this.globalClickListener!, true);
          this.isListenerActive = true;
        });
      }, 50);
    }
  }

  private deactivateGlobalListener(): void {
    if (this.isListenerActive && this.globalClickListener) {
      document.removeEventListener('click', this.globalClickListener, true);
      this.isListenerActive = false;
    }
  }

  private removeGlobalListener(): void {
    this.deactivateGlobalListener();
    this.activeSelects.clear();
  }
}
