import { Directive, HostListener, Input, ElementRef } from '@angular/core'

@Directive({
  selector: '[appMaxLengthNumber]'
})
export class MaxLengthNumberDirective {
  @Input() appMaxLengthNumber!: number

  private lastValidValue = '';

  constructor(private el: ElementRef<HTMLInputElement>) { }

  @HostListener('input', ['$event'])
  onInput(_event: Event) {
    const input = this.el.nativeElement
    const value = input.value

    if (!value) {
      this.lastValidValue = ''
      return
    }

    if (!/^\d+$/.test(value)) {
      input.value = this.lastValidValue
      return
    }

    if (value.length > this.appMaxLengthNumber) {
      input.value = this.lastValidValue
      return
    }

    this.lastValidValue = value
  }
}
