
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { PositionsHomeComponent } from './positions-home.component'

describe('PositionsHomeComponent', () => {
    let component: PositionsHomeComponent

    const route: Partial<Router> = {}

    beforeAll(() => {
        component = new PositionsHomeComponent(
            route as Router
        )
    })

    beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })

    describe('template', () => {
        beforeEach(() => {
            TestBed.configureTestingModule({
                declarations: [PositionsHomeComponent],
                providers: [
                    { provide: Router, useValue: { url: '/app/home/positions/active-positions', navigate: jest.fn() } },
                ],
                schemas: [NO_ERRORS_SCHEMA],
            })
        })

        it('should not expose the header wrapper as a focusable role="none" element', () => {
            const fixture = TestBed.createComponent(PositionsHomeComponent)
            fixture.detectChanges()
            const header: HTMLElement = fixture.nativeElement.querySelector('#positionstitle > div')

            expect(header).toBeTruthy()
            expect(header.hasAttribute('role')).toBe(false)
            expect(header.hasAttribute('tabindex')).toBe(false)
            expect(fixture.nativeElement.querySelector('#positionstitle [tabindex]')).toBeNull()
        })
    })
})
