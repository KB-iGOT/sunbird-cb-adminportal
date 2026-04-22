import { HomeComponent } from './home.component'
import { ValueService } from '@sunbird-cb/utils-v2'
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
        component.ngOnInit()
        const sub = (component as any).defaultSideNavBarOpenedSubscription
        const unsubscribeSpy = jest.spyOn(sub, 'unsubscribe')

        component.ngOnDestroy()

        expect(unsubscribeSpy).toHaveBeenCalled()
    })

    // Test case 5: bindUrl method
    it('should update currentRoute when bindUrl is called', () => {
        component.bindUrl('newRoute')

        expect(component.currentRoute).toBe('newRoute')
    })

    // Test case 6: ngOnInit with state deptType (non-ministry/state path)
    it('should set directory titles when deptType is not ministry or state', () => {
        mockActivatedRoute = {
            queryParams: of({
                currentDept: 'MyOrg',
                depatName: 'SubOrg',
                deptType: 'org',
            }),
        }
        component = new HomeComponent(
            mockValueService as ValueService,
            mockActivatedRoute as ActivatedRoute
        )
        component.ngOnInit()

        expect(component.titles[0].title).toBe('Directory')
        expect(component.titles[1].title).toBe('MyOrg')
    })

    // Test case 7: bindUrl with empty path
    it('should not update currentRoute when bindUrl is called with empty path', () => {
        component.currentRoute = 'users'
        component.bindUrl('')
        expect(component.currentRoute).toBe('users')
    })

    // Test case 8: ngOnDestroy with no subscription
    it('should not throw when ngOnDestroy is called without ngOnInit', () => {
        expect(() => component.ngOnDestroy()).not.toThrow()
    })

    // Test case 9: screen size subscription sets sideNavBarOpened
    it('should set sideNavBarOpened based on screen size', () => {
        component.ngOnInit()
        expect(component.sideNavBarOpened).toBe(true) // isLtMedium$ emits false
    })
})
