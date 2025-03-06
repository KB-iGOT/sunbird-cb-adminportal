import { FracComponent } from './frac.component'
import { FracService } from '../../services/frac.service'
import { DomSanitizer } from '@angular/platform-browser'
import { IFrac } from '../../interfaces/frac.model'

describe('FracComponent', () => {
  let component: FracComponent
  let fracServiceMock: jest.Mocked<FracService>
  let domSanitizerMock: jest.Mocked<DomSanitizer>

  beforeEach(() => {
    // Create mock for FracService
    fracServiceMock = {
      fetchFrac: jest.fn(),
    } as unknown as jest.Mocked<FracService>

    // Create mock for DomSanitizer
    domSanitizerMock = {
      bypassSecurityTrustResourceUrl: jest.fn(),
    } as unknown as jest.Mocked<DomSanitizer>

    // Create component instance with mocked dependencies
    component = new FracComponent(
      domSanitizerMock,
      fracServiceMock
    )

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:4200'
      },
      writable: true
    })
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should set iframeSrc when fetchFrac returns valid data', async () => {
      // Arrange
      const mockFracData: IFrac = {
        iframeId: 'testId',
        title: 'Test Title',
        containerStyle: 'test-style',
        containerClass: 'test-class',
        iframeSrc: 'https://example.com',
      }

      const mockSafeResourceUrl = 'safe-resource-url' as any

      fracServiceMock.fetchFrac.mockResolvedValue(mockFracData)
      domSanitizerMock.bypassSecurityTrustResourceUrl.mockReturnValue(mockSafeResourceUrl)

      // Act
      await component.ngOnInit()

      // Assert
      expect(fracServiceMock.fetchFrac).toHaveBeenCalled()
      expect(component.widgetData).toEqual(mockFracData)
      expect(domSanitizerMock.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('https://example.com')
      expect(component.iframeSrc).toBe(mockSafeResourceUrl)
    })

    it('should set default iframeSrc when fetchFrac returns null', async () => {
      // Arrange
      fracServiceMock.fetchFrac.mockResolvedValue(null as unknown as IFrac)
      const mockSafeResourceUrl = 'safe-resource-url' as any
      domSanitizerMock.bypassSecurityTrustResourceUrl.mockReturnValue(mockSafeResourceUrl)

      // Act
      await component.ngOnInit()

      // Assert
      expect(fracServiceMock.fetchFrac).toHaveBeenCalled()
      expect(domSanitizerMock.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith('http://localhost:4200/frac')
      expect(component.iframeSrc).toBe(mockSafeResourceUrl)
    })

    it('should set default iframeSrc when fetchFrac returns data without iframeSrc', async () => {
      // Arrange
      const mockFracData: IFrac = {
        iframeId: 'testId',
        title: 'Test Title',
        containerStyle: 'test-style',
        containerClass: 'test-class',
        iframeSrc: '', // Empty iframeSrc
      }

      fracServiceMock.fetchFrac.mockResolvedValue(mockFracData)
      const mockSafeResourceUrl = 'safe-resource-url' as any
      domSanitizerMock.bypassSecurityTrustResourceUrl.mockReturnValue(mockSafeResourceUrl)

      // Act
      await component.ngOnInit()

      // Assert
      expect(fracServiceMock.fetchFrac).toHaveBeenCalled()
      expect(component.widgetData).toEqual(mockFracData)
      // Should not call domSanitizer for empty iframeSrc
      expect(domSanitizerMock.bypassSecurityTrustResourceUrl).not.toHaveBeenCalledWith('')
      expect(component.iframeSrc).toBe(null)
    })
  })

  describe('ngOnDestroy', () => {
    it('should not throw error', () => {
      expect(() => {
        component.ngOnDestroy()
      }).not.toThrow()
    })
  })
})