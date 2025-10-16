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
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      text-align: center;
      min-width: 280px;
      animation: fadeInUp 0.4s ease-out;
    }

    .loading-text {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1976d2;
      letter-spacing: 0.5px;
      line-height: 1.3;
    }

    .loading-subtext {
      margin: 0;
      font-size: 14px;
      color: #666;
      font-weight: 400;
      line-height: 1.2;
    }

    /* Spinner styling */
    ::ng-deep .mat-mdc-progress-spinner circle {
      stroke: #1976d2;
    }

    /* Animation for card */
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
        padding: 32px 24px;
        min-width: 240px;
        margin: 20px;
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
