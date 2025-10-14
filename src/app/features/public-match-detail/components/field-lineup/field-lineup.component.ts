import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Player {
  id: number;
  name: string;
  jerseyNumber: number;
  position: string;
  x?: number;
  y?: number;
}

/**
 * Componente para mostrar la alineación en un campo visual
 */
@Component({
  selector: 'app-field-lineup',
  standalone: true,
  imports: [
    CommonModule,
    MatTooltipModule
  ],
  templateUrl: './field-lineup.component.html',
  styleUrls: ['./field-lineup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldLineupComponent {
  @Input() players: Player[] = [];
  @Input() formation: string = '4-3-3';

  /**
   * Obtiene el estilo de posición del jugador
   */
  getPlayerStyle(player: Player): { [key: string]: string } {
    return {
      left: `${player.x}%`,
      top: `${player.y}%`
    };
  }
}
