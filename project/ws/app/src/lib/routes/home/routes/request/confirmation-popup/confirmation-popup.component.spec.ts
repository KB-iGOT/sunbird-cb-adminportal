import { MatDialogRef } from '@angular/material/dialog'
import { ConfirmationPopupComponent } from './confirmation-popup.component'

describe('ConfirmationPopupComponent', () => {
    let component: ConfirmationPopupComponent
    let mockDialogRef: jest.Mocked<MatDialogRef<ConfirmationPopupComponent>>
    let mockData: any

    beforeEach(() => {
        // Create mock objects
        mockDialogRef = {
            close: jest.fn()
        } as unknown as jest.Mocked<MatDialogRef<ConfirmationPopupComponent>>

        mockData = {
            title: 'Test Title',
            message: 'Test Message'
        }

        // Create component instance manually
        component = new ConfirmationPopupComponent(mockData, mockDialogRef)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Component Initialization', () => {
        it('should create component instance', () => {
            expect(component).toBeTruthy()
        })

        it('should initialize with injected data', () => {
            expect(component.data).toBe(mockData)
        })

        it('should call ngOnInit without errors', () => {
            expect(() => component.ngOnInit()).not.toThrow()
        })
    })

    describe('closeModal', () => {
        it('should call dialogRef.close() when closeModal is called', () => {
            component.closeModal()

            expect(mockDialogRef.close).toHaveBeenCalledTimes(1)
            expect(mockDialogRef.close).toHaveBeenCalledWith()
        })
    })

    describe('performAction', () => {
        it('should close dialog with "confirmed" when data type is "conformation"', () => {
            const testData = { type: 'conformation' }

            component.performAction(testData)

            expect(mockDialogRef.close).toHaveBeenCalledTimes(1)
            expect(mockDialogRef.close).toHaveBeenCalledWith('confirmed')
        })

        it('should close dialog without parameters when data type is not "conformation"', () => {
            const testData = { type: 'other' }

            component.performAction(testData)

            expect(mockDialogRef.close).toHaveBeenCalledTimes(1)
            expect(mockDialogRef.close).toHaveBeenCalledWith()
        })

        it('should close dialog without parameters when data is null', () => {
            component.performAction(null)

            expect(mockDialogRef.close).toHaveBeenCalledTimes(1)
            expect(mockDialogRef.close).toHaveBeenCalledWith()
        })

        it('should close dialog without parameters when data is undefined', () => {
            component.performAction(undefined)

            expect(mockDialogRef.close).toHaveBeenCalledTimes(1)
            expect(mockDialogRef.close).toHaveBeenCalledWith()
        })

        it('should close dialog without parameters when data has no type property', () => {
            const testData = { someOtherProperty: 'value' }

            component.performAction(testData)

            expect(mockDialogRef.close).toHaveBeenCalledTimes(1)
            expect(mockDialogRef.close).toHaveBeenCalledWith()
        })

        it('should handle empty object data', () => {
            const testData = {}

            component.performAction(testData)

            expect(mockDialogRef.close).toHaveBeenCalledTimes(1)
            expect(mockDialogRef.close).toHaveBeenCalledWith()
        })
    })

    describe('Edge Cases', () => {
        it('should handle multiple calls to closeModal', () => {
            component.closeModal()
            component.closeModal()

            expect(mockDialogRef.close).toHaveBeenCalledTimes(2)
        })

        it('should handle multiple calls to performAction with different data', () => {
            const confirmationData = { type: 'conformation' }
            const otherData = { type: 'other' }

            component.performAction(confirmationData)
            component.performAction(otherData)

            expect(mockDialogRef.close).toHaveBeenCalledTimes(2)
            expect(mockDialogRef.close).toHaveBeenNthCalledWith(1, 'confirmed')
            expect(mockDialogRef.close).toHaveBeenNthCalledWith(2)
        })

        it('should handle case-sensitive type checking', () => {
            const testData = { type: 'Conformation' } // Different case

            component.performAction(testData)

            expect(mockDialogRef.close).toHaveBeenCalledWith()
            expect(mockDialogRef.close).not.toHaveBeenCalledWith('confirmed')
        })
    })

    describe('Component Properties', () => {
        it('should have public data property accessible', () => {
            expect(component.data).toBeDefined()
            expect(component.data).toBe(mockData)
        })

        it('should maintain reference to dialogRef', () => {
            expect(component['dialogRef']).toBe(mockDialogRef)
        })
    })
})