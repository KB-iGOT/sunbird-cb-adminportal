import { TncRendererComponent } from './tnc-renderer.component'
import { NsTnc } from '../../../../../../../../../src/app/models/tnc.model'

describe('TncRendererComponent', () => {
    let component: TncRendererComponent

    beforeEach(() => {
        component = new TncRendererComponent()

        // Mock document.getElementById and scrollIntoView
        document.getElementById = jest.fn().mockImplementation(() => ({
            scrollIntoView: jest.fn()
        }))
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should set currentPanel to dp when dp is not accepted', () => {
            // Arrange
            const mockTncData: NsTnc.ITnc = {
                isAccepted: false,
                termsAndConditions: [
                    {
                        name: 'Generic T&C',
                        isAccepted: true,
                        availableLanguages: ['en'],
                        acceptedDate: new Date(),
                        acceptedLanguage: '',
                        acceptedVersion: '',
                        content: '',
                        language: '',
                        version: ''
                    },
                    {
                        name: 'Generic T&C',
                        isAccepted: false,
                        availableLanguages: ['en'],
                        acceptedDate: new Date(),
                        acceptedLanguage: '',
                        acceptedVersion: '',
                        content: '',
                        language: '',
                        version: ''
                    }
                ]
            }
            component.tncData = mockTncData

            // Act
            component.ngOnInit()

            // Assert
            expect(component.currentPanel).toBe('tnc')
            expect(component.generalTnc).toEqual(mockTncData.termsAndConditions[0])
            expect(component.dpTnc).toEqual(mockTncData.termsAndConditions[1])
        })

        it('should set currentPanel to tnc when general tnc is not accepted', () => {
            // Arrange
            const mockTncData: NsTnc.ITnc = {
                isAccepted: false,
                termsAndConditions: [
                    {
                        name: 'Generic T&C',
                        isAccepted: false,
                        availableLanguages: ['en'],
                        acceptedDate: new Date(),
                        acceptedLanguage: '',
                        acceptedVersion: '',
                        content: '',
                        language: '',
                        version: ''
                    },
                    {
                        name: 'Data Privacy',
                        isAccepted: true,
                        availableLanguages: ['en'],
                        acceptedDate: new Date(),
                        acceptedLanguage: '',
                        acceptedVersion: '',
                        content: '',
                        language: '',
                        version: ''
                    }
                ]
            }
            component.tncData = mockTncData

            // Act
            component.ngOnInit()

            // Assert
            expect(component.currentPanel).toBe('tnc')
            expect(component.generalTnc).toEqual(mockTncData.termsAndConditions[0])
            expect(component.dpTnc).toEqual(mockTncData.termsAndConditions[1])
        })

        it('should do nothing when tncData is null', () => {
            // Arrange
            component.tncData = null

            // Act
            component.ngOnInit()

            // Assert
            expect(component.generalTnc).toBeNull()
            expect(component.dpTnc).toBeNull()
        })
    })

    describe('ngOnChanges', () => {
        it('should call assignGeneralAndDp when tncData exists', () => {
            // Arrange
            const mockTncData: NsTnc.ITnc = {
                isAccepted: true,
                termsAndConditions: [
                    {
                        name: 'Generic T&C',
                        isAccepted: true,
                        availableLanguages: ['en'],
                        acceptedDate: new Date(),
                        acceptedLanguage: '',
                        acceptedVersion: '',
                        content: '',
                        language: '',
                        version: ''
                    }
                ]
            }
            component.tncData = mockTncData
            const spy = jest.spyOn(component as any, 'assignGeneralAndDp')

            // Act
            component.ngOnChanges()

            // Assert
            expect(spy).toHaveBeenCalled()
        })

        it('should not call assignGeneralAndDp when tncData is null', () => {
            // Arrange
            component.tncData = null
            const spy = jest.spyOn(component as any, 'assignGeneralAndDp')

            // Act
            component.ngOnChanges()

            // Assert
            expect(spy).not.toHaveBeenCalled()
        })
    })


    describe('reCenterPanel', () => {
        it('should call scrollIntoView when element exists', () => {
            // Arrange
            const mockScrollElement = {
                scrollIntoView: jest.fn()
            }
            document.getElementById = jest.fn().mockReturnValue(mockScrollElement)

            // Act
            component.reCenterPanel()

            // Assert
            expect(document.getElementById).toHaveBeenCalledWith('tnc')
            expect(mockScrollElement.scrollIntoView).toHaveBeenCalledWith({
                behavior: 'smooth',
                block: 'start'
            })
        })

        it('should not call scrollIntoView when element does not exist', () => {
            // Arrange
            document.getElementById = jest.fn().mockReturnValue(null)

            // Act
            component.reCenterPanel()

            // Assert
            expect(document.getElementById).toHaveBeenCalledWith('tnc')
        })
    })

    describe('changeTncLang', () => {
        it('should emit tncChange event with selected value', () => {
            // Arrange
            const mockEvent = { value: 'en' }
            const spy = jest.spyOn(component.tncChange, 'emit')

            // Act
            component.changeTncLang(mockEvent as any)

            // Assert
            expect(spy).toHaveBeenCalledWith('en')
        })
    })
})