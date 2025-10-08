import { Directive, ElementRef, HostListener, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appUppercase]',
  standalone: true
})
export class UppercaseDirective {

  constructor(
    private el: ElementRef,
    @Optional() private ngControl: NgControl
  ) {}  

  @HostListener('paste', ['$event']) onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const paste = (event.clipboardData || (window as any).clipboardData).getData('text');
    const input = this.el.nativeElement as HTMLInputElement;
    
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentValue = input.value;
    
    // Insertar el texto pegado en mayúsculas
    const newValue = currentValue.substring(0, start) + paste.toUpperCase() + currentValue.substring(end);
    input.value = newValue;
    
    // Actualizar el control de Angular Forms si existe
    if (this.ngControl && this.ngControl.control) {
      this.ngControl.control.setValue(newValue, { emitEvent: false });
    }
    
    // Posicionar el cursor después del texto pegado
    const newCursorPosition = start + paste.length;
    input.setSelectionRange(newCursorPosition, newCursorPosition);
    
    // Disparar evento input para que Angular detecte el cambio
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
