import { CreateUserComponent } from './create-user.component'
import { of, throwError } from 'rxjs'
import { DirectoryService } from '../../services/directory.services'
import { ProfileV2UtillService } from '../../services/home-utill.service'
import { CreateMDOService } from './../../services/create-mdo.services'
import * as _ from 'lodash'

// Mocking the services
const mockUsersService = {
    createUser: jest.fn(),
    searchMDOLeaders: jest.fn(),
}
const mockMatSnackBar = {
    open: jest.fn(),
}
const mockRouter = {
    navigate: jest.fn(),
    getCurrentNavigation: jest.fn(),
}
const mockActivatedRoute = {
    queryParams: of({
        id: '1',
        orgName: 'OrgName',
        subOrgType: 'CBP',
        redirectionPath: '/app/home/',
    }),
    snapshot: {
        queryParams: {
            createDept: JSON.stringify({
                depName: 'DeptName',
                depType: 'SPV',
            }),
        },
        data: {
            configService: {
                unMappedUser: {
                    rootOrg: {
                        orgName: 'TestOrg',
                    },
                },
            },
        },
    },
}

describe('CreateUserComponent', () => {
    let component: CreateUserComponent

    beforeEach(() => {
        // Instantiate the component with mocks
        component = new CreateUserComponent(
            mockActivatedRoute as any,
            mockRouter as any,
            mockMatSnackBar as any,
            new DirectoryService(null as any),
            new CreateMDOService(null as any),
            new ProfileV2UtillService(null as any),
            mockUsersService as any,
            null as any
        )
    })

    it('should create the component and initialize values', () => {
        expect(component).toBeDefined()
        expect(component.createUserForm).toBeDefined()
        expect(component.createUserForm.controls['fname']).toBeDefined()
    })

    it('should call getMdoLeader on init', () => {
        const getMdoLeaderSpy = jest.spyOn(component, 'getMdoLeader')
        component.ngOnInit()
        expect(getMdoLeaderSpy).toHaveBeenCalled()
    })

    it('should validate email and set emailLengthVal', () => {
        const email = 'test@domain.com'
        component.emailVerification(email)
        expect(component.emailLengthVal).toBe(false)

        const invalidEmail = 'test@domainwithaverylongname.com'
        component.emailVerification(invalidEmail)
        expect(component.emailLengthVal).toBe(true)
    })

    it('should call onSubmit and handle success', () => {
        // Mock the observable to return a successful response
        mockUsersService.createUser.mockReturnValue(of({ userId: '12345' }))

        const form = {
            value: {
                email: 'test@domain.com',
                fname: 'John',
                mobileNumber: '1234567890',
                role: 'user',
                dept: 'DeptName',
                deptId: 'DeptID',
            },
        }

        component.onSubmit(form)

        expect(component.displayLoader).toBe(false)
        expect(component.disableCreateButton).toBe(false)
        expect(mockMatSnackBar.open).toHaveBeenCalledWith('User created successfully!', 'X', {
            duration: 5000,
        })
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/users'])
    })

    it('should call onSubmit and handle error', () => {
        // Mock the observable to return an error
        mockUsersService.createUser.mockReturnValue(
            throwError({
                error: {
                    params: {
                        errmsg: 'This phone is already registered with an existing user',
                    },
                },
            })
        )

        const form = {
            value: {
                email: 'test@domain.com',
                fname: 'John',
                mobileNumber: '1234567890',
                role: 'user',
                dept: 'DeptName',
                deptId: 'DeptID',
            },
        }

        component.onSubmit(form)

        expect(component.displayLoader).toBe(false)
        expect(component.disableCreateButton).toBe(false)
        expect(mockMatSnackBar.open).toHaveBeenCalledWith('This Phone is already registered with an existing User', 'X', {
            duration: 5000,
        })
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/users'])
    })

    it('should handle item select and set roles', () => {
        component.onItemSelect([{ id: 1, deptName: 'Dept1' }])
        expect(component.selectedDept).toEqual([{ id: 1, deptName: 'Dept1' }])
        expect(component.rolesList).toBeDefined()
    })

    it('should toggle user roles', () => {
        component.modifyUserRoles('MDO_LEADER')
        expect(component.userRoles.has('MDO_LEADER')).toBe(true)

        component.modifyUserRoles('MDO_LEADER')
        expect(component.userRoles.has('MDO_LEADER')).toBe(false)
    })
})
