import { ChangeDetectorRef } from '@angular/core'
import { Router, Params } from '@angular/router'
import { RequestsService } from '../../services/onboarding-requests.service'
import { OnboardingRequestsComponent } from './onboarding-requests.component'
import { of, Subject } from 'rxjs'
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator'

describe('OnboardingRequestsComponent', () => {
    let component: OnboardingRequestsComponent
    let mockRouter: jest.Mocked<Router>
    let mockActivatedRoute: any
    let mockRequestService: jest.Mocked<RequestsService>
    let mockChangeDetectorRef: jest.Mocked<ChangeDetectorRef>
    let paramsSubject: Subject<Params>

    beforeEach(() => {
        paramsSubject = new Subject<Params>()

        mockRouter = {
            navigate: jest.fn(),
        } as unknown as jest.Mocked<Router>

        mockActivatedRoute = {
            params: paramsSubject,
            snapshot: {
                params: { type: 'organisation' },
                data: {
                    requestsList: { data: [] },
                    aprovedrequestsList: { data: [] },
                    rejectedList: { data: [] },
                    positionsList: { data: [] },
                    configService: {
                        userRoles: ['admin'],
                        userProfile: { userId: 'user123' }
                    }
                },
                parent: {
                    data: {
                        configService: {
                            userRoles: ['admin'],
                            unMappedUser: { rootOrgId: 'org123' }
                        }
                    }
                }
            }
        }

        mockRequestService = {
            getPositionsList: jest.fn().mockReturnValue(of({ result: { data: [], count: 0 } })),
            getOrgsList: jest.fn().mockReturnValue(of({ result: { data: [], count: 0 } }))
        } as unknown as jest.Mocked<RequestsService>

        mockChangeDetectorRef = {
            detectChanges: jest.fn()
        } as unknown as jest.Mocked<ChangeDetectorRef>

        component = new OnboardingRequestsComponent(
            mockRouter,
            mockActivatedRoute,
            mockRequestService,
            mockChangeDetectorRef
        )
    })

    it('should create component instance', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize with default values', () => {
        component.ngOnInit()
        expect(component.limit).toBe(20)
        expect(component.pageIndex).toBe(0)
        expect(component.currentOffset).toBe(0)
    })

    it('should set isSpvAdmin to true when user has spv_admin role', () => {
        mockActivatedRoute.snapshot.parent.data.configService.userRoles = ['spv_admin']
        component.ngOnInit()
        expect(component.isSpvAdmin).toBe(true)
    })

    it('should set isSpvAdmin to false when user does not have spv_admin role', () => {
        mockActivatedRoute.snapshot.parent.data.configService.userRoles = ['admin']
        component.ngOnInit()
        expect(component.isSpvAdmin).toBe(false)
    })

    it('should handle route parameters correctly for organisation type', () => {
        // Trigger params change
        paramsSubject.next({ type: 'organisation' })

        expect(component.requestType).toBe('organisation')
        expect(component.displayType).toBe('organisation')
        expect(component.currentFilter).toBe('pending')
    })

    it('should handle route parameters correctly for designation type', () => {
        // Trigger params change
        paramsSubject.next({ type: 'designation' })

        expect(component.requestType).toBe('position')
        expect(component.displayType).toBe('designation')
        expect(component.currentFilter).toBe('designations')
    })

    it('should format table data correctly for organisation type', () => {
        paramsSubject.next({ type: 'organisation' })
        expect(component.tabledata.columns.length).toBe(4)
        expect(component.tabledata.columns.map((col: { key: string }) => col.key)).toContain('organisation')
        expect(component.tabledata.columns.map((col: { key: string }) => col.key)).toContain('email')
    })

    it('should get display name with first letter capitalized', () => {
        component.displayType = 'organisation'
        expect(component.getDisplayName()).toBe('Organisation')
    })

    it('should format data correctly from API response', () => {
        const mockResponse = [{
            wfInfo: [{
                createdOn: '2023-05-14T10:00:00.000Z',
                lastUpdatedOn: '2023-05-15T10:00:00.000Z',
                updateFieldValues: JSON.stringify([{
                    toValue: { organisation: 'Test Org' },
                    firstName: 'Test',
                    email: 'test@example.com',
                    mobile: '1234567890',
                    description: 'Test description'
                }])
            }]
        }]

        component.requestType = 'organisation'
        component.formatData(mockResponse, 'pending')

        expect(component.data.length).toBe(1)
        expect(component.data[0].organisation).toBe('Test Org')
        expect(component.data[0].firstName).toBe('Test')
        expect(component.data[0].email).toBe('test@example.com')
    })

    it('should call getPendingList when filter is set to pending', () => {
        const spy = jest.spyOn(component, 'getPendingList')
        component.requestType = 'organisation'
        component.filter('pending')
        expect(spy).toHaveBeenCalled()
    })

    it('should call getApprovedList when filter is set to approved', () => {
        const spy = jest.spyOn(component, 'getApprovedList')
        component.requestType = 'organisation'
        component.filter('approved')
        expect(spy).toHaveBeenCalled()
    })

    it('should call getRejectedList when filter is set to rejected', () => {
        const spy = jest.spyOn(component, 'getRejectedList')
        component.requestType = 'organisation'
        component.filter('rejected')
        expect(spy).toHaveBeenCalled()
    })

    it('should navigate to requests-approval on actionsClick', () => {
        const eventData = { action: 'edit', row: { id: '123' } }
        component.actionsClick(eventData)
        expect(mockRouter.navigate).toHaveBeenCalledWith(
            ['requests-approval'],
            { relativeTo: mockActivatedRoute.parent, state: eventData }
        )
    })

    it('should handle pagination changes correctly', () => {
        const pageEvent: PageEvent = {
            pageIndex: 1,
            pageSize: 20,
            length: 40
        }

        const spy = jest.spyOn(component, 'getPendingList')
        component.currentFilter = 'pending'
        component.onPaginateChange(pageEvent)

        expect(component.pageIndex).toBe(1)
        expect(component.limit).toBe(20)
        expect(component.currentOffset).toBe(1)
        expect(spy).toHaveBeenCalled()
    })

    it('should reset pagination when page size changes', () => {
        const pageEvent: PageEvent = {
            pageIndex: 1,
            pageSize: 40, // Changed from default 20
            length: 100
        }

        component.currentFilter = 'pending'
        component.onPaginateChange(pageEvent)

        expect(component.pageIndex).toBe(0)
        expect(component.currentOffset).toBe(0)
        expect(component.limit).toBe(40)
    })

    it('should call getOrgsList with correct parameters for organisation type', () => {
        component.requestType = 'organisation'
        component.getPendingList()

        expect(mockRequestService.getOrgsList).toHaveBeenCalledWith({
            serviceName: 'organisation',
            applicationStatus: 'IN_PROGRESS',
            limit: 20,
            offset: 0,
            deptName: 'iGOT'
        })
    })

    it('should call getPositionsList with correct parameters for position type', () => {
        component.requestType = 'position'
        component.getPendingList()

        expect(mockRequestService.getPositionsList).toHaveBeenCalledWith({
            serviceName: 'position',
            applicationStatus: 'IN_PROGRESS',
            limit: 20,
            offset: 0,
            deptName: 'iGOT'
        })
    })

    it('should call detectChanges in ngAfterViewChecked', () => {
        component.ngAfterViewChecked()
        expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalled()
    })
})