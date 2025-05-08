import { AvatarPhotoComponent } from './avatar-photo.component'
import { SimpleChange, SimpleChanges } from '@angular/core'

describe('AvatarPhotoComponent', () => {
    let component: AvatarPhotoComponent

    beforeEach(() => {
        component = new AvatarPhotoComponent()
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should show initials when photoUrl is not provided', () => {
            component.photoUrl = ''
            component.name = 'John Doe'

            component.ngOnInit()

            expect(component.showInitials).toBeTruthy()
            expect(component.userInitials).toBe('JD')
        })

        it('should use provided initials when photoUrl is not provided', () => {
            component.photoUrl = ''
            component.name = 'John Doe'
            component.initials = 'XX'

            component.ngOnInit()

            expect(component.showInitials).toBeTruthy()
            expect(component.userInitials).toBe('XX')
        })

        it('should set circle color when photoUrl is not provided', () => {
            component.photoUrl = ''
            component.name = 'John Doe'

            component.ngOnInit()

            expect(component.circleColor).toBeDefined()
        })

        it('should use random color when randomColor is true', () => {
            component.photoUrl = ''
            component.name = 'John Doe'
            component.randomColor = true

            // Mock Math.random to return consistent value for testing
            const originalMathRandom = Math.random
            Math.random = jest.fn().mockReturnValue(0.5)

            component.ngOnInit()

            // Restore original Math.random
            Math.random = originalMathRandom

            expect(component.circleColor).toBeDefined()
        })

        it('should use specific colors when datalen is 1', () => {
            component.photoUrl = ''
            component.name = 'John Doe'
            component.datalen = 1
            component.randomColor = true

            // Force a specific random index
            const originalMathRandom = Math.random
            Math.random = jest.fn().mockReturnValue(0)

            component.ngOnInit()

            // Restore original Math.random
            Math.random = originalMathRandom

            expect(component.circleColor).toBe('#006400') // Green
        })
    })

    describe('ngOnChanges', () => {
        it('should update initials when name changes', () => {
            component.name = 'Jane Smith'
            component.initials = 'JS'

            const changes: SimpleChanges = {
                name: new SimpleChange('Jane Smith', 'John Doe', false)
            }

            component.name = 'John Doe'
            component.ngOnChanges(changes)

            expect(component.userInitials).toBe('JD')
        })

        it('should not update initials on first change', () => {
            component.name = 'John Doe'

            const changes: SimpleChanges = {
                name: new SimpleChange(undefined, 'John Doe', true)
            }

            const initialInitials = component.userInitials
            component.ngOnChanges(changes)

            expect(component.userInitials).toBe(initialInitials)
        })
    })

    describe('initials generation', () => {
        it('should generate initials from first and last name', () => {
            component.name = 'John Doe'
            component.photoUrl = ''

            component.ngOnInit()

            expect(component.userInitials).toBe('JD')
        })

        it('should generate initials from single name', () => {
            component.name = 'John'
            component.photoUrl = ''

            component.ngOnInit()

            expect(component.userInitials).toBe('J')
        })

        it('should handle names with multiple spaces correctly', () => {
            component.name = 'John Smith Doe'
            component.photoUrl = ''

            component.ngOnInit()

            expect(component.userInitials).toBe('JS')
        })
    })
})