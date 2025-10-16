import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-public-loading',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="public-loading-overlay" *ngIf="isVisible">
      <div class="loading-content">
        <mat-spinner 
          [diameter]="diameter" 
          [strokeWidth]="strokeWidth">
        </mat-spinner>
        <p class="loading-text" *ngIf="text">{{ text }}</p>
        <p class="loading-subtext" *ngIf="subtext">{{ subtext }}</p>
      </div>
    </div>
  `,
  styles: [`
    .public-loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      border-radius: 12px;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
      padding: 32px;
    }

    .loading-text {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1976d2;
      letter-spacing: 0.5px;
    }

    .loading-subtext {
      margin: 0;
      font-size: 14px;
      color: #666;
      font-weight: 400;
      opacity: 0.8;
    }

    /* Animation for spinner container */
    .loading-content {
      animation: fadeInUp 0.4s ease-out;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .loading-content {
        padding: 24px;
      }

      .loading-text {
        font-size: 16px;
      }

      .loading-subtext {
        font-size: 13px;
      }
    }
  `]
})
export class PublicLoadingComponent {
  @Input() isVisible: boolean = false;
  @Input() text: string = 'Cargando datos del torneo...';
  @Input() subtext: string = 'Por favor espere';
  @Input() diameter: number = 60;
  @Input() strokeWidth: number = 4;
}
