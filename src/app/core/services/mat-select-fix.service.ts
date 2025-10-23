import { Injectable, NgZone } from '@angular/core';

/**
 * Servicio para corregir el comportamiento de mat-select
 * Implementa una solución global que funciona sin necesidad de directivas
 */
@Injectable({
  providedIn: 'root'
})
export class MatSelectFixService {
  private isInitialized = false;

  constructor(private ngZone: NgZone) {
    this.initializeGlobalFix();
  }

  private initializeGlobalFix(): void {
    if (this.isInitialized) return;
    
    // Esperar a que Angular se inicialice completamente
    setTimeout(() => {
      this.setupGlobalClickHandler();
      this.isInitialized = true;
    }, 1000);
  }

  private setupGlobalClickHandler(): void {
    // Agregar listener global para todos los clics
    document.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      
      // Buscar todos los mat-select abiertos
      const openPanels = document.querySelectorAll('.mat-select-panel');
      
      if (openPanels.length === 0) return;
      
      openPanels.forEach(panel => {
        // Encontrar el mat-select asociado a este panel
        const selectTriggers = document.querySelectorAll('.mat-select-trigger');
        
        let shouldClose = true;
        
        // Verificar si el clic fue dentro del panel o del trigger
        if (panel.contains(target)) {
          shouldClose = false;
        }
        
        // Verificar si el clic fue en algún trigger de select
        selectTriggers.forEach(trigger => {
          if (trigger.contains(target)) {
            shouldClose = false;
          }
        });
        
        // Si el clic fue fuera, cerrar el select
        if (shouldClose) {
          // Simular un clic en el backdrop para cerrar el select
          const backdrop = document.querySelector('.cdk-overlay-backdrop');
          if (backdrop) {
            this.ngZone.run(() => {
              (backdrop as HTMLElement).click();
            });
          }
        }
      });
    }, true);
    
    console.log('✅ MatSelectFixService: Global click handler initialized');
  }
}
