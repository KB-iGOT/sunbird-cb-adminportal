import { Directive, HostListener, Input, ElementRef } from '@angular/core'

@Directive({
    selector: '[appMaxLengthNumber]',
    standalone: false,
})
export class MaxLengthNumberDirective {
  @Input() appMaxLengthNumber!: number

  private lastValidValue = ''

  constructor(private el: ElementRef<HTMLInputElement>) { }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const forbiddenKeys = ['.', 'e', 'E', '-', '+']

    if (forbiddenKeys.includes(event.key)) {
      event.preventDefault()
      return
    }

    const input = this.el.nativeElement
    if (
      /^\d$/.test(event.key) &&
      input.value.length >= this.appMaxLengthNumber
    ) {
      event.preventDefault()
    }
  }

  // Handle paste
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const pastedValue = event.clipboardData?.getData('text') ?? ''

    if (!/^\d+$/.test(pastedValue)) {
      event.preventDefault()
      return
    }

    const input = this.el.nativeElement
    if (input.value.length + pastedValue.length > this.appMaxLengthNumber) {
      event.preventDefault()
    }
  }

  @HostListener('input')
  onInput() {
    const input = this.el.nativeElement
    const value = input.value

    if (!/^\d*$/.test(value) || value.length > this.appMaxLengthNumber) {
      input.value = this.lastValidValue
      return
    }

    this.lastValidValue = value
  }
}
