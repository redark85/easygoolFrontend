import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

export interface ManagerInfoData {
  managerName: string;
  phoneNumber: string;
  email?: string;
  teamName: string;
}

@Component({
  selector: 'app-manager-info-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule
  ],
  template: `
    <div class="manager-info-modal">
      <div mat-dialog-title class="modal-header">
        <div class="header-content">
          <div class="manager-avatar">
            <mat-icon class="avatar-icon">account_circle</mat-icon>
          </div>
          <div class="header-text">
            <h2 class="manager-name">{{ data.managerName }}</h2>
            <p class="team-name">Manager de {{ data.teamName }}</p>
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div mat-dialog-content class="modal-content">
        <div class="info-section">
          <h3 class="section-title">
            <mat-icon class="section-icon">contact_phone</mat-icon>
            Información de Contacto
          </h3>
          
          <div class="contact-info">
            <!-- Teléfono -->
            <div class="info-item">
              <div class="info-label">
                <mat-icon class="info-icon">phone</mat-icon>
                <span>Teléfono</span>
              </div>
              <div class="info-value">
                <a [href]="'tel:' + data.phoneNumber" class="phone-link">
                  {{ data.phoneNumber }}
                </a>
                <button mat-icon-button 
                        class="copy-btn"
                        (click)="copyToClipboard(data.phoneNumber)"
                        matTooltip="Copiar teléfono">
                  <mat-icon>content_copy</mat-icon>
                </button>
              </div>
            </div>

            <!-- Email -->
            <div class="info-item">
              <div class="info-label">
                <mat-icon class="info-icon">email</mat-icon>
                <span>Email</span>
              </div>
              <div class="info-value">
                <span *ngIf="data.email; else noEmail" class="email-value">
                  <a [href]="'mailto:' + data.email" class="email-link">
                    {{ data.email }}
                  </a>
                  <button mat-icon-button 
                          class="copy-btn"
                          (click)="copyToClipboard(data.email!)"
                          matTooltip="Copiar email">
                    <mat-icon>content_copy</mat-icon>
                  </button>
                </span>
                <ng-template #noEmail>
                  <span class="no-data">No disponible</span>
                </ng-template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div mat-dialog-actions class="modal-actions">
        <button mat-raised-button 
                color="primary" 
                (click)="close()"
                class="close-btn">
          <mat-icon>close</mat-icon>
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .manager-info-modal {
      width: 100%;
      max-width: 500px;
    }

    .modal-header {
      padding: 24px 24px 16px 24px;
      margin: 0;
      
      .header-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .manager-avatar {
        .avatar-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: #1976d2;
        }
      }

      .header-text {
        flex: 1;
        
        .manager-name {
          margin: 0 0 4px 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
        }

        .team-name {
          margin: 0;
          font-size: 0.9rem;
          color: #666;
          font-weight: 500;
        }
      }
    }

    .modal-content {
      padding: 20px 24px;
      min-height: 120px;
    }

    .info-section {
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 16px 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #1976d2;

        .section-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .contact-info {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #1976d2;

        .info-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          color: #555;
          min-width: 80px;

          .info-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            color: #1976d2;
          }
        }

        .info-value {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          justify-content: flex-end;

          .phone-link, .email-link {
            color: #1976d2;
            text-decoration: none;
            font-weight: 500;
            
            &:hover {
              text-decoration: underline;
            }
          }

          .email-value {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .no-data {
            color: #999;
            font-style: italic;
          }

          .copy-btn {
            width: 32px;
            height: 32px;
            min-width: 32px;
            color: #666;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            
            &:hover {
              color: #1976d2;
              background: rgba(25, 118, 210, 0.1);
            }

            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
        }
      }
    }

    .modal-actions {
      padding: 16px 24px 24px 24px;
      justify-content: center;
      
      .close-btn {
        min-width: 120px;
        
        mat-icon {
          margin-right: 8px;
        }
      }
    }

    // Responsive
    @media (max-width: 480px) {
      .manager-info-modal {
        max-width: 100%;
      }

      .modal-header .header-content {
        flex-direction: column;
        text-align: center;
        gap: 12px;
      }

      .info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;

        .info-value {
          justify-content: flex-start;
          width: 100%;
        }
      }
    }
  `]
})
export class ManagerInfoModalComponent {
  constructor(
    public dialogRef: MatDialogRef<ManagerInfoModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ManagerInfoData
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  async copyToClipboard(text: string): Promise<void> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback para navegadores sin soporte de clipboard API
        this.fallbackCopyTextToClipboard(text);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.fallbackCopyTextToClipboard(text);
    }
  }

  private fallbackCopyTextToClipboard(text: string): void {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
    } catch (error) {
      console.error('Fallback: Could not copy text: ', error);
    }

    document.body.removeChild(textArea);
  }
}
