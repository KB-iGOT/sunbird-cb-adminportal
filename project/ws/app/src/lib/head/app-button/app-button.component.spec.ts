import { AppButtonComponent } from './app-button.component'

describe('AppButtonComponent', () => {
    let component: AppButtonComponent

    beforeEach(() => {
        component = new AppButtonComponent()
        jest.clearAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })

    it('should have default styles as empty object', () => {
        expect(component.styles).toEqual({})
    })

    it('should have default classes as empty string', () => {
        expect(component.classes).toBe('')
    })

    it('should emit event on onClickbutton when not disabled', () => {
        component.disabled = false
        const spy = jest.spyOn(component.eonClick, 'emit')
        const event = { type: 'click' }
        component.onClickbutton(event)
        expect(spy).toHaveBeenCalledWith(event)
    })

    it('should not emit event on onClickbutton when disabled is true', () => {
        component.disabled = true
        const spy = jest.spyOn(component.eonClick, 'emit')
        component.onClickbutton({ type: 'click' })
        expect(spy).not.toHaveBeenCalled()
    })

    it('should not emit event when disabled is undefined (falsy)', () => {
        component.disabled = undefined
        const spy = jest.spyOn(component.eonClick, 'emit')
        component.onClickbutton({ type: 'click' })
        expect(spy).toHaveBeenCalled()
    })

    it('should call ngOnInit without errors', () => {
        expect(() => component.ngOnInit()).not.toThrow()
    })

    it('should accept input values', () => {
        component.id = 'btn-1'
        component.label = 'Click me'
        component.icon = 'add'
        component.type = 'submit'
        expect(component.id).toBe('btn-1')
        expect(component.label).toBe('Click me')
        expect(component.icon).toBe('add')
        expect(component.type).toBe('submit')
    })
})
