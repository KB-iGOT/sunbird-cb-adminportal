import { ItemTileComponent } from './item-tile.component'
import { ActivatedRoute, Router } from '@angular/router'

jest.mock('@angular/router', () => ({
    ActivatedRoute: jest.fn(),
    Router: jest.fn(),
}))

describe('ItemTileComponent', () => {
    let component: ItemTileComponent
    let mockActivatedRoute: jest.Mocked<ActivatedRoute>
    let mockRouter: jest.Mocked<Router>

    beforeEach(() => {
        // Mock the ActivatedRoute and Router
        mockActivatedRoute = { parent: null } as any
        mockRouter = { navigate: jest.fn() } as any

        // Create instance of component with the mocked dependencies
        component = new ItemTileComponent(mockActivatedRoute, mockRouter)
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize with default values', () => {
        expect(component.ref).toBe('home')
        expect(component.topics).toEqual([])
    })

    describe('isString method', () => {
        it('should return true if input is a string', () => {
            expect(component.isString('test')).toBe(true)
        })

        it('should return false if input is not a string', () => {
            expect(component.isString(123)).toBe(false)
            expect(component.isString([])).toBe(false)
            expect(component.isString({})).toBe(false)
        })
    })

    describe('goToView method', () => {
        it('should call navigate with correct arguments', () => {
            component.goToView()
            expect(mockRouter.navigate).toHaveBeenCalledWith(
                [],
                { relativeTo: mockActivatedRoute.parent }
            )
        })

        it('should handle errors thrown by navigate', () => {
            mockRouter.navigate.mockImplementationOnce(() => {
                throw new Error('Navigation error')
            })

            expect(() => component.goToView()).toThrow('Navigation error')
        })
    })
})
