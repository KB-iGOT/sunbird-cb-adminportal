import { TncRendererComponent } from './tnc-renderer.component'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'

describe('TncRendererComponent', () => {
  let component: TncRendererComponent
  let mockConfigSvc: Partial<ConfigurationsService>

  beforeEach(() => {
    // Mocking ConfigurationsService
    mockConfigSvc = {
      restrictedFeatures: new Set(),
    }

    // Creating instance of the component with mocked service
    component = new TncRendererComponent(mockConfigSvc as ConfigurationsService)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize component correctly when tncData is provided', () => {
      const mockTncData = {
        isAccepted: false,
        termsAndConditions: [
          { name: 'Generic T&C', isAccepted: false },
          { name: 'DP T&C', isAccepted: false },
        ],
      }

      component.tncData = mockTncData as any
      component.ngOnInit()

      expect(component.generalTnc).toEqual(mockTncData.termsAndConditions[0])
      expect(component.dpTnc).toEqual(mockTncData.termsAndConditions[1])
      expect(component.currentPanel).toBe('tnc') // Because generalTnc is not accepted
    })

    it('should switch panel to dp if dpTnc is not accepted', () => {
      const mockTncData = {
        isAccepted: false,
        termsAndConditions: [
          { name: 'Generic T&C', isAccepted: false },
          { name: 'DP T&C', isAccepted: false },
        ],
      }

      component.tncData = mockTncData as any
      component.ngOnInit()

      expect(component.currentPanel).toBe('dp') // Because dpTnc is not accepted
    })
  })

  describe('ngOnChanges', () => {
    it('should reassign general and dp terms when tncData changes', () => {
      const mockTncData = {
        termsAndConditions: [
          { name: 'Generic T&C', isAccepted: false },
          { name: 'DP T&C', isAccepted: false },
        ],
      }

      component.tncData = mockTncData as any
      component.ngOnChanges()

      expect(component.generalTnc).toEqual(mockTncData.termsAndConditions[0])
      expect(component.dpTnc).toEqual(mockTncData.termsAndConditions[1])
    })
  })

  describe('Methods', () => {
    it('should call tncChange.emit when changeTncLang is called', () => {
      const emitMock = jest.fn()
      component.tncChange = { emit: emitMock } as any

      const locale = 'en'
      component.changeTncLang(locale)

      expect(emitMock).toHaveBeenCalledWith(locale)
    })

    it('should call dpChange.emit when changeDpLang is called', () => {
      const emitMock = jest.fn()
      component.dpChange = { emit: emitMock } as any

      const locale = 'es'
      component.changeDpLang(locale)

      expect(emitMock).toHaveBeenCalledWith(locale)
    })

    it('should call reCenterPanel and scroll into view', () => {
      // Mocking document.getElementById to return a fake element
      const scrollIntoViewMock = jest.fn()
      document.getElementById = jest.fn().mockReturnValue({
        scrollIntoView: scrollIntoViewMock,
      })

      component.reCenterPanel()

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      })
    })
  })
})
