import { Directive, Input, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appDefaultImage]',
  standalone: true
})
export class DefaultImageDirective {
  @Input() appDefaultImage: string = 'assets/logo.png';

  constructor(private el: ElementRef) {}

  @HostListener('error', ['$event'])
  onError(event: any): void {
    this.setDefaultImage();
  }

  @HostListener('load', ['$event'])
  onLoad(event: any): void {
    // Si la imagen se carga correctamente, no hacer nada
  }

  ngOnInit(): void {
    // Verificar si el src está vacío, es null o undefined al inicializar
    const imgElement = this.el.nativeElement as HTMLImageElement;
    if (!imgElement.src || imgElement.src === '' || imgElement.src === 'null' || imgElement.src.includes('null')) {
      this.setDefaultImage();
    }
  }

  private setDefaultImage(): void {
    const imgElement = this.el.nativeElement as HTMLImageElement;
    if (imgElement.src !== this.appDefaultImage) {
      imgElement.src = this.appDefaultImage;
    }
  }
}
