import { HomeComponent } from './home.component'
import { ValueService } from '@sunbird-cb/utils'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

describe('HomeComponent', () => {
    let component: HomeComponent
    let mockValueService: Partial<ValueService>
    let mockActivatedRoute: Partial<ActivatedRoute>

    beforeEach(() => {
        // Mock ValueService
        mockValueService = {
            isLtMedium$: of(false), // simulate the observable
        }

        // Mock ActivatedRoute with queryParams observable
        mockActivatedRoute = {
            queryParams: of({
                currentDept: 'DeptName',
                depatName: 'MyDept',
                deptType: 'ministry',
            }),
        }

        // Initialize component
        component = new HomeComponent(
            mockValueService as ValueService,
            mockActivatedRoute as ActivatedRoute
        )
    })

    // Test case 1: Component creation
    it('should create the HomeComponent', () => {
        expect(component).toBeTruthy()
    })

    // Test case 2: ngOnInit - check the titles array after initialization
    it('should initialize titles based on deptType', () => {
        // Call ngOnInit manually
        component.ngOnInit()

        expect(component.titles).toEqual([
            { title: 'Reports', url: '/app/home/reports' },
            { title: 'DeptName', url: '/app/home/reports/DeptName' },
            { title: 'MyDept', url: 'none' },
        ])
    })

    // Test case 3: ngOnInit - check query params parsing
    it('should parse query params correctly', () => {
        component.ngOnInit()

        expect(component.dept).toBe('DeptName')
        expect(component.mydept).toBe('MyDept')
        expect(component.deptType).toBe('ministry')
        expect(component.urlValue).toBe('DeptName')
    })

    // Test case 4: ngOnDestroy - subscription cleanup
    it('should unsubscribe from the defaultSideNavBarOpenedSubscription on ngOnDestroy', () => {
        const unsubscribeSpy = jest.fn()
        // Spy on the subscription's unsubscribe method
        mockValueService.isLtMedium$ = of(false)
        //  component.defaultSideNavBarOpenedSubscription = { unsubscribe: unsubscribeSpy } as any

        component.ngOnDestroy()

        expect(unsubscribeSpy).toHaveBeenCalled()
    })

    // Test case 5: bindUrl method
    it('should update currentRoute when bindUrl is called', () => {
        component.bindUrl('newRoute')

        expect(component.currentRoute).toBe('newRoute')
    })
})
