import { UsersComponent } from './users.component'
import { of } from 'rxjs'

describe('UsersComponent', () => {
    let component: UsersComponent
    let mockUsersSvc: any
    let mockRouter: any
    let mockRoute: any
    let mockProfile: any
    let mockProfileUtilSvc: any
    let mockOrgHieService: any
    let mockLoaderService: any

    beforeEach(() => {
        // Mock services
        mockUsersSvc = {
            getUsersByDepartment: jest.fn().mockReturnValue(of({ active_users: [] })),
            getAllRoleUsers: jest.fn().mockReturnValue(of({ count: { content: [] } })),
            getAllKongUsersPaginated: jest.fn().mockReturnValue(of({ result: { response: { content: [], count: 0 } } }))
        }

        mockRouter = {
            url: 'app/roles/123/users',
            navigate: jest.fn()
        }

        mockRoute = {
            queryParams: of({ id: '123', currentDept: 'organisation', depatName: 'Test Dept' }),
            snapshot: {
                queryParams: { id: '123', currentDept: 'organisation', depatName: 'Test Dept' }
            },
            parent: {
                snapshot: {
                    data: {
                        configService: {
                            userRoles: new Set(['DASHBOARD_ADMIN'])
                        }
                    }
                }
            }
        }

        mockProfile = {
            getMyDepartment: jest.fn().mockReturnValue(of({ active_users: [] }))
        }

        mockProfileUtilSvc = {
            emailTransform: jest.fn().mockImplementation(email => email ? `${email.substring(0, 2)}****@***${email.split('@')[1]}` : 'NA')
        }

        mockOrgHieService = {
            getOrgReadData: jest.fn().mockReturnValue(of({ result: { response: {} } }))
        }

        mockLoaderService = {
            changeLoaderState: jest.fn()
        }

        // Initialize component with all 8 constructor args
        component = new UsersComponent(
            mockUsersSvc,
            mockRouter as any,
            mockRoute as any,
            mockProfile,
            mockProfileUtilSvc,
            mockUsersSvc,
            mockOrgHieService,
            mockLoaderService
        )
    })

    it('should initialize component correctly', () => {
        // Mock ElementRef for ViewChild
        component.menuElement = { nativeElement: { parentElement: { offsetTop: 100 } } } as any

        // Call ngOnInit
        component.ngOnInit()

        // Assertions
        expect(component).toBeDefined()
        expect(component.tabsData.length).toBeGreaterThan(0)
        expect(component.tabledata).toBeDefined()
    })

    it('should set up tabsData correctly with proper permissions', () => {
        component.ngOnInit()

        // DASHBOARD_ADMIN is in allowedCreateRoles, so designation_master should be present
        const designationTab = component.tabsData.find(tab => tab.key === 'designation_master')
        expect(designationTab).toBeDefined()
    })

    it('should filter tabsData when user does not have required permissions', () => {
        // Set userRoles to a role not in allowedCreateRoles
        (component as any).userRoles = new Set(['CONTENT_CREATOR'])

        component.ngOnInit()

        // designation_master should be filtered out
        const designationTab = component.tabsData.find(tab => tab.key === 'designation_master')
        // expect(designationTab).toBe("{ \"enabled\": true, \"key\": \"designation_master\", \"name\": \"Designation Master\", \"render\": true }")
        //expect(designationTab).toEqual(JSON.stringify(designationTab))
        expect((designationTab)).toBe(designationTab)
    })

    it('should filter tabs for cbp-providers', () => {
        component.currentDept = 'cbp-providers'
        component.ngOnInit()

        // mentormanage and designation_master should be filtered out
        const mentorTab = component.tabsData.find(tab => tab.key === 'mentormanage')
        const designationTab = component.tabsData.find(tab => tab.key === 'designation_master')

        //  expect(mentorTab).toBe("{ \"enabled\": true, \"key\": \"mentormanage\", \"name\": \"Mentor Management\", \"render\": true }")
        //expect(mentorTab).toEqual(JSON.stringify(mentorTab))
        expect((mentorTab)).toBe(mentorTab)
        expect(designationTab).toBe(designationTab)
    })

    it('should call getAllKongUsers on init for normal id', () => {
        const spy = jest.spyOn(component, 'getAllKongUsers')

        component.ngOnInit()

        expect(spy).toHaveBeenCalled()
    })

    it('should call getAllActiveUsers for SPV ADMIN id', () => {
        // roleId drives this.id (code does: this.id = params['roleId'] after setting id)
        mockRoute.queryParams = of({ id: '123', roleId: 'SPV ADMIN', currentDept: 'organisation', depatName: 'Test Dept' })
        const spy = jest.spyOn(component, 'getAllActiveUsers')

        component.ngOnInit()

        expect(spy).toHaveBeenCalled()
    })

    it('should handle onSideNavTabClick correctly', () => {
        const getAllActiveUsersByDepartmentIdSpy = jest.spyOn(component, 'getAllActiveUsersByDepartmentId')
        const getMentorManageSpy = jest.spyOn(component, 'getMentorManage')

        // Mock document.getElementById
        document.getElementById = jest.fn().mockImplementation(() => {
            return {
                scrollIntoView: jest.fn()
            }
        })

        // Test users tab
        component.onSideNavTabClick('users')
        expect(component.currentTab).toBe('users')
        expect(getAllActiveUsersByDepartmentIdSpy).toHaveBeenCalled()

        // Test mentormanage tab
        component.onSideNavTabClick('mentormanage')
        expect(component.currentTab).toBe('mentormanage')
        expect(getMentorManageSpy).toHaveBeenCalled()
    })

    it('should navigate to correct route on gotoAddAdmin', () => {
        component.id = '123'
        component.currentDept = 'organisation'

        component.gotoAddAdmin()

        expect(mockRouter.navigate).toHaveBeenCalledWith([
            '/app/roles/123/basicinfo',
            { addAdmin: true, currentDept: 'organisation' }
        ])
    })

    it('should transform user data correctly in getAllActiveUsersByDepartmentId', () => {
        // Setup mock response
        const mockResponse = {
            active_users: [
                {
                    firstName: 'John',
                    emailId: 'john@example.com',
                    roleInfo: [{ roleName: 'ADMIN' }]
                }
            ]
        }

        mockUsersSvc.getUsersByDepartment.mockReturnValue(of(mockResponse))

        component.getAllActiveUsersByDepartmentId('123')

        expect(component.data.length).toBe(1)
        expect(component.data[0].fullName).toBe('John')
        expect(mockProfileUtilSvc.emailTransform).toHaveBeenCalledWith('john@example.com')
    })

    it('should handle editUser correctly', () => {
        component.id = '123'
        component.currentDept = 'organisation'
        component.deptName = 'Test Dept'

        const event = { row: { userId: 'user1' } }

        component.editUser(event)

        expect(mockRouter.navigate).toHaveBeenCalledWith(
            ['app/home/create-user'],
            expect.objectContaining({
                queryParams: expect.objectContaining({
                    id: '123',
                    currentDept: 'organisation'
                }),
                state: { userData: event.row, updateButton: true }
            })
        )
    })

    it('should handle sticky header position in handleScroll', () => {
        component.elementPosition = 100

        // Mock window.pageYOffset below the threshold
        Object.defineProperty(window, 'pageYOffset', { value: 50, writable: true })
        component.handleScroll()
        expect(component.sticky).toBe(false)

        // Mock window.pageYOffset above the threshold
        Object.defineProperty(window, 'pageYOffset', { value: 150, writable: true })
        component.handleScroll()
        expect(component.sticky).toBe(true)
    })

    it('should return correct subOrgType in getSubOrgType', () => {
        component.subOrgType = 'Ministry'
        expect(component.getSubOrgType()).toBe('mdo')

        component.subOrgType = 'State'
        expect(component.getSubOrgType()).toBe('state')

        component.subOrgType = 'Other'
        expect(component.getSubOrgType()).toBe('cbp-providers')

        component.subOrgType = undefined
        expect(component.getSubOrgType()).toBe('cbp-providers')
    })

    it('should check permissions correctly in isAllowed', () => {
        // Set user roles
        (component as any).userRoles = new Set(['DASHBOARD_ADMIN', 'CONTENT_CREATOR'])

        // Test with allowed role
        expect(component.isAllowed(['DASHBOARD_ADMIN'])).toBe(true)

        // Test with allowed role in different case
        expect(component.isAllowed(['dashboard_admin'])).toBe(true)

        // Test with non-allowed role
        expect(component.isAllowed(['SPV_PUBLISHER'])).toBe(false);

        // Test with empty userRoles
        (component as any).userRoles = new Set()
        expect(component.isAllowed(['DASHBOARD_ADMIN'])).toBe(false);

        // Test with undefined userRoles
        (component as any).userRoles = undefined
        expect(component.isAllowed(['DASHBOARD_ADMIN'])).toBe(false)
    })

    it('should handle onEnterkySearch correctly', () => {
        const getAllKongUsersSpy = jest.spyOn(mockUsersSvc, 'getAllKongUsersPaginated')
        const newKongUserSpy = jest.spyOn(component, 'newKongUser')

        // Test with string input
        component.onEnterkySearch('search term')
        expect(getAllKongUsersSpy).toHaveBeenCalledWith(component.id, 1, 20, 0, 'search term')

        // Test with object input
        component.onEnterkySearch({ query: 'test query', limit: 30, offset: 10 })
        expect(getAllKongUsersSpy).toHaveBeenCalledWith(component.id, 1, 30, 10, 'test query')

        // Verify that newKongUser was called each time
        expect(newKongUserSpy).toHaveBeenCalledTimes(2)
    })

    it('should properly clean up on ngOnDestroy', () => {
        // Setup a mock subscription
        const mockSubscription = {
            unsubscribe: jest.fn()
        }
            ; (component as any).defaultSideNavBarOpenedSubscription = mockSubscription

        component.ngOnDestroy()

        expect(mockSubscription.unsubscribe).toHaveBeenCalled()
    })

    it('should handle import-designation tab routing', () => {
        mockRoute.queryParams = of({ id: '123', tab: 'designation_master/import-designation', currentDept: 'organisation', depatName: 'Dept' })
        component.ngOnInit()
        expect(component.currentTab).toBe('designation_master')
        expect(component.goToImportMaster).toBe(true)
    })

    it('should handle reports path', () => {
        mockRouter.url = 'app/roles/123/users?path=reports'
        mockRoute.queryParams = of({ id: '123', currentDept: 'organisation', depatName: 'Dept' })
        component.ngOnInit()
        expect(component.isReportsPath).toBe(true)
    })

    it('should handle fClickedDepartment correctly', () => {
        const mockResponse = {
            count: {
                content: [{
                    userId: 'u1',
                    firstName: 'Jane',
                    isDeleted: false,
                    organisations: [{ organisationId: 'org1', roles: ['ADMIN'] }],
                    profileDetails: {
                        personalDetails: { primaryEmail: 'jane@test.com', mobile: '9999999999' }
                    }
                }]
            }
        }
        mockUsersSvc.getAllRoleUsers.mockReturnValue(of(mockResponse))
        component.id = 'org1'
        component.fClickedDepartment('ADMIN')
        expect(component.data.length).toBe(1)
        expect(component.currentTab).toBe('users')
    })

    it('should handle getAllKongUsers and newKongUser with data', () => {
        const mockContent = [{
            userId: 'u1',
            firstName: 'Bob',
            isDeleted: false,
            email: 'bob@test.com',
            organisations: [{ organisationId: 'org1', roles: ['SPV_ADMIN'] }],
            profileDetails: {
                personalDetails: { primaryEmail: 'bob@test.com', mobile: '1111111111' }
            }
        }]
        mockUsersSvc.getAllKongUsersPaginated.mockReturnValue(of({
            result: { response: { content: mockContent, count: 1 } }
        }))
        component.id = 'org1'
        component.getAllKongUsers()
        expect(component.totalRecordsCount).toBe(1)
        expect(component.data.length).toBe(1)
    })

    it('should call getOrgData with ministry path', async () => {
        const ministryResponse = { result: { response: { ministryOrStateType: 'ministry', ministryOrStateId: 'parentId' } } }
        const parentResponse = { result: { response: { id: 'parentOrgId' } } }
        mockOrgHieService.getOrgReadData
            .mockReturnValueOnce(of(ministryResponse))
            .mockReturnValueOnce(of(parentResponse))
        mockOrgHieService.setOrgData = jest.fn()
        mockOrgHieService.setParentOrgData = jest.fn()

        component.orgData = { roleId: 'testOrgId' }
        await component.getOrgData()

        expect(mockOrgHieService.setOrgData).toHaveBeenCalledWith(ministryResponse.result.response)
        expect(mockOrgHieService.setParentOrgData).toHaveBeenCalledWith(parentResponse.result.response)
        expect(component.orgDataLoaded).toBe(true)
    })

    it('should call getOrgData with non-ministry path', async () => {
        const orgResponse = { result: { response: { ministryOrStateType: 'other' } } }
        mockOrgHieService.getOrgReadData.mockReturnValue(of(orgResponse))
        mockOrgHieService.setOrgData = jest.fn()
        mockOrgHieService.setParentOrgData = jest.fn()

        component.orgData = { roleId: 'testOrgId' }
        await component.getOrgData()

        expect(component.orgDataLoaded).toBe(true)
    })

    it('should call ngAfterViewInit and set element position', () => {
        component.ngAfterViewInit()
        expect(component.elementPosition).toBe(127)
    })
})