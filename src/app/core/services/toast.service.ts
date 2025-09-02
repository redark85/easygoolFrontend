import {Injectable} from '@angular/core';

type ToastType = 'error' | 'success' | 'info' | 'warning';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  showError(message: string): void {
    this.createToast(message, 'error');
  }

  showSuccess(message: string): void {
    this.createToast(message, 'success');
  }

  showInfo(message: string): void {
    this.createToast(message, 'info');
  }

  showWarning(message: string, actionText?: string, actionCallback?: () => void): void {
    this.createToast(message, 'warning', actionText, actionCallback);
  }

  private createToast(message: string, type: ToastType, actionText?: string, actionCallback?: () => void): void {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    messageSpan.style.flexGrow = '1';

    toast.appendChild(messageSpan);

    if (actionText && actionCallback) {
      const actionButton = document.createElement('button');
      actionButton.textContent = actionText;
      actionButton.onclick = (e) => {
        e.stopPropagation();
        actionCallback();
        this.removeToast(toast);
      };
      this.styleActionButton(actionButton);
      toast.appendChild(actionButton);
    }

    this.styleToast(toast, type);
    this.addAnimationStyles();
    document.body.appendChild(toast);

    if (!actionText) { // Auto-remove only if there's no action
      setTimeout(() => this.removeToast(toast), 5000);
    }

    toast.addEventListener('click', () => this.removeToast(toast));
  }

  private removeToast(toast: HTMLElement): void {
    if (toast.parentNode) {
      toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  }

  private styleToast(toast: HTMLElement, type: ToastType): void {
    toast.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-family: 'Roboto', sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 400px;
      word-wrap: break-word;
      animation: slideInRight 0.3s ease-out;
      cursor: pointer;
      ${this.getTypeStyles(type)}
    `;
  }

  private styleActionButton(button: HTMLButtonElement): void {
    button.style.cssText = `
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.5);
      color: white;
      padding: 5px 10px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      margin-left: 10px;
      outline: none;
      transition: background 0.2s ease;
    `;
    button.onmouseover = () => button.style.background = 'rgba(255, 255, 255, 0.3)';
    button.onmouseout = () => button.style.background = 'rgba(255, 255, 255, 0.2)';
  }

  private getTypeStyles(type: ToastType): string {
    switch (type) {
      case 'error': return 'background-color: #f44336; border-left: 4px solid #d32f2f;';
      case 'success': return 'background-color: #4caf50; border-left: 4px solid #388e3c;';
      case 'info': return 'background-color: #2196f3; border-left: 4px solid #1976d2;';
      case 'warning': return 'background-color: #ff9800; border-left: 4px solid #f57c00;';
      default: return 'background-color: #757575; border-left: 4px solid #424242;';
    }
  }

  private addAnimationStyles(): void {
    if (document.getElementById('toast-animations')) return;
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideInRight { from { transform: translateX(110%); } to { transform: translateX(0); } }
      @keyframes slideOutRight { from { transform: translateX(0); } to { transform: translateX(110%); } }
    `;
    document.head.appendChild(style);
  }
}
