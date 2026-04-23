import { Router } from '@angular/router'
import { PeopleComponent } from './people.component'

describe('PeopleComponent', () => {
    let component: PeopleComponent

    const router: Partial<Router> = {
        navigate: jest.fn(),
    }

    beforeAll(() => {
        component = new PeopleComponent(
            router as Router
        )
    })

    beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })

    it('should call ngOnInit without error', () => {
        expect(() => component.ngOnInit()).not.toThrow()
    })

    describe('selectedUser', () => {
        it('should navigate to person-profile with user wid', () => {
            const user: any = { wid: 'user-123', email: 'test@example.com' }
            component.selectedUser(user)
            expect(router.navigate).toHaveBeenCalledWith(['/app/person-profile', 'user-123'])
        })
    })
})
