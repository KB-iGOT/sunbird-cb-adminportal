import { CreateUserComponent } from './create-user.component'
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms'
import { of, throwError } from 'rxjs'

describe('CreateUserComponent', () => {
    let component: CreateUserComponent
    let mockRoute: any
    let mockRouter: any
    let mockSnackBar: any
    let mockDirectoryService: any
    let mockCreateMDOService: any
    let mockProfileUtilSvc: any
    let mockUsersSvc: any
    let mockEvents: any

    beforeEach(() => {
        // Mock ActivatedRoute
        mockRoute = {
            queryParams: of({
                id: '123',
                orgName: 'Test Org',
                subOrgType: 'MDO',
                redirectionPath: '/app/home/users',
                createDept: JSON.stringify({ depType: 'MDO', id: '123', depName: 'Test Department' })
            }),
            snapshot: {
                queryParams: {
                    id: '123',
                    createDept: JSON.stringify({ depType: 'MDO', id: '123', depName: 'Test Department' })
                },
                parent: {
                    data: {
                        configService: {
                            userProfile: { userId: 'user123' },
                            unMappedUser: {
                                roles: ['MDO_ADMIN'],
                                rootOrg: { orgName: 'Root Org', rootOrgId: 'root123' },
                                channel: 'channel123'
                            }
                        }
                    }
                },
                data: {
                    configService: {
                        unMappedUser: {
                            rootOrg: { orgName: 'Root Org' },
                            channel: 'channel123'
                        }
                    }
                }
            }
        }

        // Mock Router
        mockRouter = {
            getCurrentNavigation: jest.fn().mockReturnValue({
                extras: {
                    state: {
                        userData: {
                            email: 'test@example.com',
                            fullName: 'Test User',
                            mobile: '1234567890',
                            position: ['MDO_LEADER']
                        },
                        updateButton: true
                    }
                }
            }),
            navigate: jest.fn()
        }

        // Mock MatSnackBar
        mockSnackBar = {
            open: jest.fn()
        }

        // Mock DirectoryService
        mockDirectoryService = {
            getDepartmentTitles: jest.fn().mockReturnValue(of({
                result: {
                    response: {
                        value: JSON.stringify({
                            orgTypeList: [
                                {
                                    name: 'MDO',
                                    isHidden: false,
                                    roles: ['MDO_ADMIN', 'MDO_LEADER']
                                }
                            ]
                        })
                    }
                }
            }))
        }

        // Mock CreateMDOService
        mockCreateMDOService = {
            assignAdminToDepartment: jest.fn().mockReturnValue(of({
                result: { response: 'Role assigned successfully' }
            }))
        }

        // Mock ProfileV2UtillService
        mockProfileUtilSvc = {
            transformToEmail: jest.fn().mockImplementation((email) => email)
        }

        // Mock UsersService
        mockUsersSvc = {
            createUser: jest.fn().mockReturnValue(of({ userId: 'newUser123' })),
            searchMDOLeaders: jest.fn().mockReturnValue(of({
                result: { response: { count: 0 } }
            }))
        }

        // Mock EventService
        mockEvents = {
            raiseInteractTelemetry: jest.fn()
        }

        // Create component instance
        component = new CreateUserComponent(
            mockRoute,
            mockRouter,
            mockSnackBar,
            mockDirectoryService,
            mockCreateMDOService,
            mockProfileUtilSvc,
            mockUsersSvc,
            mockEvents
        )
    })

    describe('Constructor', () => {
        it('should create component', () => {
            expect(component).toBeTruthy()
        })

        it('should initialize form with created department data', () => {
            expect(component.createUserForm).toBeDefined()
            expect(component.createUserForm.get('dept')?.value).toBe('Test Org')
            expect(component.createUserForm.get('deptId')?.value).toBe('Test Department')
        })

        it('should set updateButton and editUserInfo from navigation state', () => {
            expect(component.updateButton).toBe(true)
            expect(component.editUserInfo).toBeDefined()
            expect(component.editUserInfo.email).toBe('test@example.com')
        })

        it('should handle CBP Providers department type', () => {
            mockRoute.queryParams = of({
                subOrgType: 'CBP Providers'
            })

            component = new CreateUserComponent(
                mockRoute,
                mockRouter,
                mockSnackBar,
                mockDirectoryService,
                mockCreateMDOService,
                mockProfileUtilSvc,
                mockUsersSvc,
                mockEvents
            )

            expect(component.currentDept).toBe('CBP')
        })

        it('should set isStateAdmin when user has STATE_ADMIN role', () => {
            mockRoute.snapshot.parent.data.configService.unMappedUser.roles = ['STATE_ADMIN']

            component = new CreateUserComponent(
                mockRoute,
                mockRouter,
                mockSnackBar,
                mockDirectoryService,
                mockCreateMDOService,
                mockProfileUtilSvc,
                mockUsersSvc,
                mockEvents
            )

            expect(component.isStateAdmin).toBe(true)
            expect(component.currentDept).toBe('STATE')
        })
    })

    describe('ngOnInit', () => {
        it('should call getAllDepartmentsHeaderAPI', () => {
            const spy = jest.spyOn(component, 'getAllDepartmentsHeaderAPI')
            component.ngOnInit()
            expect(spy).toHaveBeenCalled()
        })

        it('should set dropdown settings', () => {
            component.ngOnInit()
            expect(component.dropdownSettings).toEqual({
                singleSelection: true,
                idField: 'id',
                textField: 'deptName',
                enableCheckAll: false,
                itemsShowLimit: 10000,
                allowSearchFilter: true,
            })
        })
    })

    describe('getAllDepartmentsHeaderAPI', () => {
        it('should fetch and set roles for current department', () => {
            component.currentDept = 'MDO'
            component.getAllDepartmentsHeaderAPI()

            expect(mockDirectoryService.getDepartmentTitles).toHaveBeenCalled()
            expect(component.roles).toEqual(['MDO_ADMIN', 'MDO_LEADER'])
        })

        it('should set state admin roles when user is STATE_ADMIN', () => {
            mockRoute.snapshot.parent.data.configService.unMappedUser.roles = ['STATE_ADMIN']
            component.currentDept = 'MDO'
            component.getAllDepartmentsHeaderAPI()

            expect(component.roles).toEqual(['MDO_LEADER', 'PUBLIC'])
        })
    })

    describe('emailVerification', () => {
        it('should set emailLengthVal to true when local part exceeds 64 characters', () => {
            const longEmail = 'a'.repeat(65) + '@example.com'
            component.emailVerification(longEmail)
            expect(component.emailLengthVal).toBe(true)
        })

        it('should set emailLengthVal to true when domain part exceeds 255 characters', () => {
            const longDomain = 'test@' + 'a'.repeat(256) + '.com'
            component.emailVerification(longDomain)
            expect(component.emailLengthVal).toBe(true)
        })

        it('should set emailLengthVal to false for valid email', () => {
            component.emailVerification('test@example.com')
            expect(component.emailLengthVal).toBe(false)
        })

        it('should handle empty email', () => {
            component.emailVerification('')
            expect(component.emailLengthVal).toBe(false)
        })
    })

    describe('modifyUserRoles', () => {
        it('should add role if not present', () => {
            component.modifyUserRoles('MDO_ADMIN')
            expect(component.userRoles.has('MDO_ADMIN')).toBe(true)
        })

        it('should remove role if already present', () => {
            component.userRoles.add('MDO_ADMIN')
            component.modifyUserRoles('MDO_ADMIN')
            expect(component.userRoles.has('MDO_ADMIN')).toBe(false)
        })
    })

    describe('onSubmit', () => {
        beforeEach(() => {
            component.createUserForm = new UntypedFormGroup({
                fname: new UntypedFormControl('John Doe'),
                email: new UntypedFormControl('john@example.com'),
                mobileNumber: new UntypedFormControl('1234567890'),
                role: new UntypedFormControl(['MDO_ADMIN']),
                dept: new UntypedFormControl('Test Org'),
                deptId: new UntypedFormControl('dept123')
            })
        })

        it('should create user successfully', () => {
            //  const formValue = component.createUserForm.value
            component.redirectionPath = '/app/home/users'

            component.onSubmit(component.createUserForm)

            expect(component.disableCreateButton).toBe(true)
            expect(component.displayLoader).toBe(true)
            expect(mockUsersSvc.createUser).toHaveBeenCalledWith({
                personalDetails: {
                    email: 'john@example.com',
                    firstName: 'John Doe',
                    phone: '1234567890',
                    channel: 'dept123',
                    roles: ['MDO_ADMIN']
                }
            })
        })

        it('should show error when MDO_LEADER already exists', () => {
            component.mdoLeadersCount = 1
            component.createUserForm.patchValue({ role: ['MDO_LEADER'] })

            component.onSubmit(component.createUserForm)

            expect(mockSnackBar.open).toHaveBeenCalledWith(
                'MDO Leader role has already been allocated to another user from the Ministry; kindly revise the role for that user before assigning a different user as an MDO Leader',
                'X',
                { duration: 5000 }
            )
            expect(component.disableCreateButton).toBe(false)
            expect(component.displayLoader).toBe(false)
        })

        it('should handle user creation error', () => {
            const error = {
                error: {
                    params: {
                        errmsg: 'This email is already registered with an existing user'
                    }
                }
            }
            mockUsersSvc.createUser.mockReturnValue(throwError(error))

            component.onSubmit(component.createUserForm)

            expect(mockSnackBar.open).toHaveBeenCalledWith(
                'This Email is already registered with an existing User',
                'X',
                { duration: 5000 }
            )
        })

        it('should handle phone already registered error', () => {
            const error = {
                error: {
                    params: {
                        errmsg: 'This phone is already registered with an existing user'
                    }
                }
            }
            mockUsersSvc.createUser.mockReturnValue(throwError(error))

            component.onSubmit(component.createUserForm)

            expect(mockSnackBar.open).toHaveBeenCalledWith(
                'This Phone is already registered with an existing User',
                'X',
                { duration: 5000 }
            )
        })

        it('should handle invalid phone format error', () => {
            const error = {
                error: {
                    params: {
                        errmsg: 'Invalid format for given phone.'
                    }
                }
            }
            mockUsersSvc.createUser.mockReturnValue(throwError(error))

            component.onSubmit(component.createUserForm)

            expect(mockSnackBar.open).toHaveBeenCalledWith(
                'Please enter valid phone number',
                'X',
                { duration: 5000 }
            )
        })
    })

    describe('getMdoLeader', () => {
        it('should fetch MDO leaders count', () => {
            component.deptId = '123'
            component.getMdoLeader()

            expect(mockUsersSvc.searchMDOLeaders).toHaveBeenCalledWith('123')
            expect(component.mdoLeadersCount).toBe(0)
        })

        it('should handle missing response', () => {
            mockUsersSvc.searchMDOLeaders.mockReturnValue(of({ result: null }))
            component.getMdoLeader()

            expect(component.mdoLeadersCount).toBe(0)
        })
    })

    describe('onUpdate', () => {
        beforeEach(() => {
            component.editUserInfo = { userId: 'user123' }
            component.deptId = 'dept123'
            component.userRoles.add('MDO_ADMIN')
        })

        it('should update roles for existing MDO_LEADER', () => {
            const userData = {
                value: { role: ['MDO_LEADER'] }
            }
            component.isThisExistingLeader = true

            component.onUpdate(userData)

            expect(component.displayLoader).toBe(true)
            expect(mockCreateMDOService.assignAdminToDepartment).toHaveBeenCalledWith(
                'user123',
                'dept123',
                ['MDO_ADMIN']
            )
        })

        it('should update roles when no existing MDO_LEADER', () => {
            const userData = {
                value: { role: ['MDO_LEADER'] }
            }
            component.mdoLeadersCount = 0

            component.onUpdate(userData)

            expect(mockCreateMDOService.assignAdminToDepartment).toHaveBeenCalled()
        })

        it('should show error when MDO_LEADER already exists', () => {
            const userData = {
                value: { role: ['MDO_LEADER'] }
            }
            component.mdoLeadersCount = 1
            component.isThisExistingLeader = false

            component.onUpdate(userData)

            expect(mockSnackBar.open).toHaveBeenCalledWith(
                'MDO Leader role has already been allocated to another user from the Ministry; kindly revise the role for that user before assigning a different user as an MDO Leader',
                'X',
                { duration: 5000 }
            )
        })
    })

    describe('roleAssign', () => {
        beforeEach(() => {
            component.editUserInfo = { userId: 'user123' }
            component.deptId = 'dept123'
            component.userRoles.add('MDO_ADMIN')
            component.redirectionPath = '/app/home/users'
        })

        it('should assign roles successfully', () => {
            component.roleAssign()

            expect(mockCreateMDOService.assignAdminToDepartment).toHaveBeenCalledWith(
                'user123',
                'dept123',
                ['MDO_ADMIN']
            )
        })

        it('should handle role assignment error', () => {
            mockCreateMDOService.assignAdminToDepartment.mockReturnValue(throwError('Error'))

            component.roleAssign()

            expect(mockSnackBar.open).toHaveBeenCalledWith(
                'Error in assigning roles',
                'X',
                { duration: 5000 }
            )
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/users'])
        })
    })

    describe('numericOnly', () => {
        it('should return true for numeric key', () => {
            const event = { key: '5' }
            const result = component.numericOnly(event)
            expect(result).toBe(true)
        })

        it('should return false for non-numeric key', () => {
            const event = { key: 'a' }
            const result = component.numericOnly(event)
            expect(result).toBe(false)
        })
    })

    describe('onPasteMobile', () => {
        beforeEach(() => {
            component.createUserForm = new UntypedFormGroup({
                mobileNumber: new UntypedFormControl('')
            })
        })

        it('should handle pasted mobile number', () => {
            const mockEvent = {
                clipboardData: {
                    getData: jest.fn().mockReturnValue('1234567890')
                },
                preventDefault: jest.fn()
            } as any

            component.onPasteMobile(mockEvent)

            expect(component.createUserForm.get('mobileNumber')?.value).toBe('1234567890')
        })

        it('should prevent default for non-numeric paste', () => {
            const mockEvent = {
                clipboardData: {
                    getData: jest.fn().mockReturnValue('abc123')
                },
                preventDefault: jest.fn()
            } as any

            component.onPasteMobile(mockEvent)

            expect(mockEvent.preventDefault).toHaveBeenCalled()
        })
    })

    describe('trimPhoneNumber', () => {
        beforeEach(() => {
            component.createUserForm = new UntypedFormGroup({
                mobileNumber: new UntypedFormControl('')
            })
        })

        it('should trim +91 with space prefix', () => {
            component.trimPhoneNumber('+91 1234567890')
            expect(component.createUserForm.get('mobileNumber')?.value).toBe('1234567890')
        })

        it('should trim +91 without space prefix', () => {
            component.trimPhoneNumber('+911234567890')
            expect(component.createUserForm.get('mobileNumber')?.value).toBe('1234567890')
        })

        it('should keep number as is if no prefix', () => {
            component.trimPhoneNumber('1234567890')
            expect(component.createUserForm.get('mobileNumber')?.value).toBe('1234567890')
        })
    })

    describe('getSubOrgType', () => {
        it('should return ministry for mdo', () => {
            component.currentDept = 'mdo'
            expect(component.getSubOrgType()).toBe('ministry')
        })

        it('should return state for state', () => {
            component.currentDept = 'state'
            expect(component.getSubOrgType()).toBe('state')
        })

        it('should return cbp-providers for CBP', () => {
            component.currentDept = 'CBP'
            expect(component.getSubOrgType()).toBe('cbp-providers')
        })

        it('should return cbp-providers as default', () => {
            component.currentDept = 'unknown'
            expect(component.getSubOrgType()).toBe('cbp-providers')
        })
    })

    describe('getCurrentDept', () => {
        it('should return lowercase department name', () => {
            component.currentDept = 'MDO'
            expect(component.getCurrentDept()).toBe('mdo')
        })

        it('should return undefined if currentDept is not set', () => {
            component.currentDept = undefined
            expect(component.getCurrentDept()).toBeUndefined()
        })
    })

    describe('navigateTo', () => {
        it('should navigate to roles page when created department exists', () => {
            component.createdDepartment = { depName: 'Test Dept' }
            component.deptId = '123'
            component.currentDept = 'MDO'

            component.navigateTo()

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/roles/123/users'], {
                queryParams: {
                    currentDept: 'ministry',
                    roleId: '123',
                    depatName: 'Test Dept',
                    subOrgType: 'ministry'
                }
            })
        })

        it('should navigate to users page when no created department', () => {
            component.createdDepartment = null

            component.navigateTo()

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/users'])
        })
    })

    describe('Form Validation', () => {
        it('should create form with required validators', () => {
            expect(component.createUserForm.get('fname')?.hasError('required')).toBe(false)
            expect(component.createUserForm.get('email')?.hasError('required')).toBe(false)
            expect(component.createUserForm.get('mobileNumber')?.hasError('required')).toBe(false)
        })

        it('should validate email pattern', () => {
            const emailControl = component.createUserForm.get('email')
            emailControl?.setValue('invalid-email')
            expect(emailControl?.hasError('pattern')).toBe(true)

            emailControl?.setValue('valid@example.com')
            expect(emailControl?.hasError('pattern')).toBe(false)
        })

        it('should validate mobile pattern', () => {
            const mobileControl = component.createUserForm.get('mobileNumber')
            mobileControl?.setValue('123')
            expect(mobileControl?.hasError('pattern')).toBe(true)

            mobileControl?.setValue('1234567890')
            expect(mobileControl?.hasError('pattern')).toBe(false)
        })
    })
})