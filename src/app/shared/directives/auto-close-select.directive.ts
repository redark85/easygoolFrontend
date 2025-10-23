import { Directive, OnInit } from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { MatSelectAutoCloseService } from '@core/services/mat-select-auto-close.service';

/**
 * Directiva para forzar el cierre automático de mat-select al hacer clic fuera
 * Soluciona el problema donde los mat-select no se cierran automáticamente
 * Se aplica automáticamente a todos los mat-select
 */
@Directive({
  selector: 'mat-select',
  standalone: true
})
export class AutoCloseSelectDirective implements OnInit {

  constructor(
    private matSelect: MatSelect,
    private autoCloseService: MatSelectAutoCloseService
  ) {}

  ngOnInit(): void {
    // Registrar este select en el servicio global
    this.autoCloseService.registerSelect(this.matSelect);
  }
}
