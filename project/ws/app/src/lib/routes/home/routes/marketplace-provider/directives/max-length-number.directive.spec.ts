import { MaxLengthNumberDirective } from './max-length-number.directive'
import { ElementRef } from '@angular/core'

describe('MaxLengthNumberDirective', () => {
  let directive: MaxLengthNumberDirective
  let mockElementRef: { nativeElement: HTMLInputElement }

  beforeEach(() => {
    mockElementRef = {
      nativeElement: {
        value: '',
      } as HTMLInputElement,
    }
    directive = new MaxLengthNumberDirective(mockElementRef as ElementRef<HTMLInputElement>)
    directive.appMaxLengthNumber = 5
  })

  describe('onKeyDown', () => {
    it('should prevent "." key', () => {
      const event = { key: '.', preventDefault: jest.fn() } as unknown as KeyboardEvent
      directive.onKeyDown(event)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should prevent "e" key', () => {
      const event = { key: 'e', preventDefault: jest.fn() } as unknown as KeyboardEvent
      directive.onKeyDown(event)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should prevent "E" key', () => {
      const event = { key: 'E', preventDefault: jest.fn() } as unknown as KeyboardEvent
      directive.onKeyDown(event)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should prevent "-" key', () => {
      const event = { key: '-', preventDefault: jest.fn() } as unknown as KeyboardEvent
      directive.onKeyDown(event)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should prevent "+" key', () => {
      const event = { key: '+', preventDefault: jest.fn() } as unknown as KeyboardEvent
      directive.onKeyDown(event)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should prevent digit when input at max length', () => {
      mockElementRef.nativeElement.value = '12345' // 5 chars = maxLength
      const event = { key: '6', preventDefault: jest.fn() } as unknown as KeyboardEvent
      directive.onKeyDown(event)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should allow digit when input is below max length', () => {
      mockElementRef.nativeElement.value = '123' // 3 chars < maxLength 5
      const event = { key: '4', preventDefault: jest.fn() } as unknown as KeyboardEvent
      directive.onKeyDown(event)
      expect(event.preventDefault).not.toHaveBeenCalled()
    })

    it('should allow non-digit keys (e.g. Backspace) regardless of length', () => {
      mockElementRef.nativeElement.value = '12345'
      const event = { key: 'Backspace', preventDefault: jest.fn() } as unknown as KeyboardEvent
      directive.onKeyDown(event)
      expect(event.preventDefault).not.toHaveBeenCalled()
    })

    it('should allow arrow key regardless of length', () => {
      mockElementRef.nativeElement.value = '12345'
      const event = { key: 'ArrowLeft', preventDefault: jest.fn() } as unknown as KeyboardEvent
      directive.onKeyDown(event)
      expect(event.preventDefault).not.toHaveBeenCalled()
    })
  })

  describe('onPaste', () => {
    const createPasteEvent = (text: string): ClipboardEvent => {
      return {
        clipboardData: {
          getData: jest.fn().mockReturnValue(text),
        },
        preventDefault: jest.fn(),
      } as unknown as ClipboardEvent
    }

    it('should prevent pasting non-numeric text', () => {
      const event = createPasteEvent('abc')
      directive.onPaste(event)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should prevent pasting text with special characters', () => {
      const event = createPasteEvent('12.3')
      directive.onPaste(event)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should prevent pasting when combined length exceeds max', () => {
      mockElementRef.nativeElement.value = '123'
      const event = createPasteEvent('456') // 3+3=6 > 5
      directive.onPaste(event)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should allow pasting valid digits within max length', () => {
      mockElementRef.nativeElement.value = '12'
      const event = createPasteEvent('345') // 2+3=5 = maxLength
      directive.onPaste(event)
      expect(event.preventDefault).not.toHaveBeenCalled()
    })

    it('should allow pasting valid digits below max length', () => {
      mockElementRef.nativeElement.value = '1'
      const event = createPasteEvent('23') // 1+2=3 < 5
      directive.onPaste(event)
      expect(event.preventDefault).not.toHaveBeenCalled()
    })

    it('should prevent when clipboard data is null (empty string fails digit regex)', () => {
      const event = {
        clipboardData: null,
        preventDefault: jest.fn(),
      } as unknown as ClipboardEvent
      directive.onPaste(event)
      // null clipboardData => pastedValue = '', empty string fails /^\d+$/, so preventDefault is called
      expect(event.preventDefault).toHaveBeenCalled()
    })
  })

  describe('onInput', () => {
    it('should restore last valid value when input contains non-digits', () => {
      mockElementRef.nativeElement.value = '123'
      directive.onInput() // sets lastValidValue to '123'

      mockElementRef.nativeElement.value = '123a'
      directive.onInput() // should restore to '123'

      expect(mockElementRef.nativeElement.value).toBe('123')
    })

    it('should restore last valid value when input exceeds max length', () => {
      mockElementRef.nativeElement.value = '12345'
      directive.onInput() // sets lastValidValue to '12345'

      mockElementRef.nativeElement.value = '123456'
      directive.onInput() // length 6 > maxLength 5, should restore

      expect(mockElementRef.nativeElement.value).toBe('12345')
    })

    it('should update lastValidValue for valid input', () => {
      mockElementRef.nativeElement.value = '123'
      directive.onInput()

      // Internally lastValidValue should be '123'
      // Next invalid input should restore to '123'
      mockElementRef.nativeElement.value = 'abc'
      directive.onInput()
      expect(mockElementRef.nativeElement.value).toBe('123')
    })

    it('should allow empty string as valid input', () => {
      mockElementRef.nativeElement.value = '12'
      directive.onInput()

      mockElementRef.nativeElement.value = ''
      directive.onInput()
      expect(mockElementRef.nativeElement.value).toBe('')
    })

    it('should allow digits up to max length', () => {
      mockElementRef.nativeElement.value = '12345'
      directive.onInput()
      expect(mockElementRef.nativeElement.value).toBe('12345')
    })

    it('should not alter valid short digit strings', () => {
      mockElementRef.nativeElement.value = '42'
      directive.onInput()
      expect(mockElementRef.nativeElement.value).toBe('42')
    })
  })
})
