import { DragDropDirective } from './drag-drop.directive'

describe('DragDropDirective', () => {
  let directive: DragDropDirective

  beforeEach(() => {
    directive = new DragDropDirective()
  })

  it('should create', () => {
    expect(directive).toBeTruthy()
  })

  it('should initialize with opacity 1', () => {
    expect(directive.opacity).toBe('1')
  })

  it('should initialize fileDropped EventEmitter', () => {
    expect(directive.fileDropped).toBeDefined()
    expect(directive.fileDropped.emit).toBeDefined()
  })

  describe('onDragOver', () => {
    it('should prevent default and stop propagation', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as any

      directive.onDragOver(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockEvent.stopPropagation).toHaveBeenCalled()
    })

    it('should set opacity to 0.4', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as any

      directive.onDragOver(mockEvent)

      expect(directive.opacity).toBe('0.4')
    })
  })

  describe('onDragLeave', () => {
    it('should prevent default and stop propagation', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as any

      directive.onDragLeave(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockEvent.stopPropagation).toHaveBeenCalled()
    })

    it('should set opacity to 1.0', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as any

      directive.onDragLeave(mockEvent)

      expect(directive.opacity).toBe('1.0')
    })
  })

  describe('ondrop', () => {
    it('should prevent default and stop propagation', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          files: [new File([''], 'test.txt')]
        }
      } as any

      directive.ondrop(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockEvent.stopPropagation).toHaveBeenCalled()
    })

    it('should set opacity to 1.0', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          files: [new File([''], 'test.txt')]
        }
      } as any

      directive.ondrop(mockEvent)

      expect(directive.opacity).toBe('1.0')
    })

    it('should emit fileDropped event when files are present', () => {
      const testFile = new File(['test content'], 'test.txt')
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          files: [testFile]
        }
      } as any

      jest.spyOn(directive.fileDropped, 'emit')

      directive.ondrop(mockEvent)

      expect(directive.fileDropped.emit).toHaveBeenCalledWith(testFile)
    })

    it('should not emit fileDropped event when no files are present', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          files: []
        }
      } as any

      jest.spyOn(directive.fileDropped, 'emit')

      directive.ondrop(mockEvent)

      expect(directive.fileDropped.emit).not.toHaveBeenCalled()
    })

    it('should not emit fileDropped event when files array is null/undefined', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          files: null
        }
      } as any

      jest.spyOn(directive.fileDropped, 'emit')

      directive.ondrop(mockEvent)

      expect(directive.fileDropped.emit).not.toHaveBeenCalled()
    })

    it('should handle empty dataTransfer', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: null
      } as any

      jest.spyOn(directive.fileDropped, 'emit')

      expect(() => directive.ondrop(mockEvent)).toThrow()
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete drag and drop flow', () => {
      const dragOverEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as any

      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          files: [new File(['test'], 'test.txt')]
        }
      } as any

      jest.spyOn(directive.fileDropped, 'emit')

      // Simulate dragover
      directive.onDragOver(dragOverEvent)
      expect(directive.opacity).toBe('0.4')

      // Simulate drop
      directive.ondrop(dropEvent)
      expect(directive.opacity).toBe('1.0')
      expect(directive.fileDropped.emit).toHaveBeenCalled()
    })

    it('should handle drag over and drag leave flow', () => {
      const dragOverEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as any

      const dragLeaveEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as any

      // Simulate dragover
      directive.onDragOver(dragOverEvent)
      expect(directive.opacity).toBe('0.4')

      // Simulate dragleave
      directive.onDragLeave(dragLeaveEvent)
      expect(directive.opacity).toBe('1.0')
    })
  })
})