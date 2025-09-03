import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirm-dialog">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon [class]="getIconClass()">{{ getIcon() }}</mat-icon>
        {{ data.title }}
      </h2>
      
      <mat-dialog-content class="dialog-content">
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      
      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()" class="cancel-btn">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button 
          mat-raised-button 
          [class]="getConfirmButtonClass()" 
          (click)="onConfirm()">
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 400px;
      max-width: 500px;
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .dialog-content {
      margin-bottom: 24px;
      
      p {
        margin: 0;
        color: var(--text-secondary);
        line-height: 1.5;
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin: 0;
      padding: 0;
    }

    .cancel-btn {
      color: var(--text-secondary);
    }

    .confirm-btn-warning {
      background-color: #ff9800;
      color: white;
      
      &:hover {
        background-color: #f57c00;
      }
    }

    .confirm-btn-danger {
      background-color: #f44336;
      color: white;
      
      &:hover {
        background-color: #d32f2f;
      }
    }

    .confirm-btn-info {
      background-color: var(--primary-color);
      color: white;
      
      &:hover {
        background-color: var(--primary-dark);
      }
    }

    .icon-warning {
      color: #ff9800;
    }

    .icon-danger {
      color: #f44336;
    }

    .icon-info {
      color: var(--primary-color);
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getIcon(): string {
    switch (this.data.type) {
      case 'warning':
        return 'warning';
      case 'danger':
        return 'delete';
      case 'info':
      default:
        return 'help';
    }
  }

  getIconClass(): string {
    switch (this.data.type) {
      case 'warning':
        return 'icon-warning';
      case 'danger':
        return 'icon-danger';
      case 'info':
      default:
        return 'icon-info';
    }
  }

  getConfirmButtonClass(): string {
    switch (this.data.type) {
      case 'warning':
        return 'confirm-btn-warning';
      case 'danger':
        return 'confirm-btn-danger';
      case 'info':
      default:
        return 'confirm-btn-info';
    }
  }
}
