import { CreateMdoComponent, forbiddenNamesValidator } from './create-mdo.component'
import { of, throwError } from 'rxjs'

// Mock dependencies
const mockDialog = {
    open: jest.fn().mockReturnValue({
        afterClosed: jest.fn().mockReturnValue(of({}))
    })
}

const mockSnackBar = {
    open: jest.fn()
}

const mockCreateMdoService = {
    getStatesOrMinisteries: jest.fn(),
    getDeparmentsOfState: jest.fn(),
    getOrgsOfDepartment: jest.fn(),
    createDepartment: jest.fn(),
    updateDepartment: jest.fn(),
    createStateOrMinistry: jest.fn(),
    updateStateOrMinistry: jest.fn(),
    assignAdminToDepartment: jest.fn()
}

const mockRouter = {
    navigate: jest.fn()
}

const mockDirectoryService = {
    getDepartmentTitles: jest.fn(),
    getDepartmentSubTitles: jest.fn()
}

const mockValueService = {
    isLtMedium$: of(false)
}

const mockActivatedRoute = {
    params: of({
        data: null,
        department: 'MDO',
        isFromDirectory: false,
        addAdmin: false
    }),
    snapshot: {
        parent: {
            data: {
                configService: {
                    userProfile: { userId: 'test-user-id' },
                    unMappedUser: {
                        roles: ['STATE_ADMIN'],
                        rootOrgId: 'root-org-id'
                    }
                }
            }
        }
    }
}

const mockEvents = {
    raiseInteractTelemetry: jest.fn()
}

describe('CreateMdoComponent', () => {
    let component: CreateMdoComponent

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks()

        // Create component instance
        component = new CreateMdoComponent(
            mockDialog as any,
            mockSnackBar as any,
            mockCreateMdoService as any,
            mockRouter as any,
            mockDirectoryService as any,
            mockValueService as any,
            mockActivatedRoute as any,
            mockEvents as any
        )
    })

    describe('Component Initialization', () => {
        it('should create component', () => {
            expect(component).toBeTruthy()
        })

        it('should initialize with default values', () => {
            expect(component.isSubmitPressed).toBe(false)
            expect(component.nextAction).toBe('done')
            expect(component.stage).toBe(1)
            expect(component.formType).toBe('department')
            expect(component.canUpdate).toBe(true)
            expect(component.canExpiry).toBe(true)
        })

        it('should set isStateAdmin to true when user has STATE_ADMIN role', () => {
            expect(component.isStateAdmin).toBe(true)
        })

        it('should initialize forms correctly', () => {
            expect(component.contentForm).toBeDefined()
            expect(component.stateForm).toBeDefined()
            expect(component.departmentForm).toBeDefined()
        })
    })

    describe('ngOnInit', () => {
        beforeEach(() => {
            mockDirectoryService.getDepartmentTitles.mockReturnValue(of({
                result: {
                    response: {
                        value: JSON.stringify({
                            orgTypeList: [{
                                name: 'MDO',
                                subTypeList: [{ id: 1, name: 'Sub Dept 1' }]
                            }]
                        })
                    }
                }
            }))

            mockDirectoryService.getDepartmentSubTitles.mockReturnValue(of({
                result: {
                    response: {
                        value: JSON.stringify({
                            fields: [{ value: 1, name: 'Test Field' }]
                        })
                    }
                }
            }))

            mockCreateMdoService.getStatesOrMinisteries.mockReturnValue(of({
                result: {
                    response: {
                        content: [{ id: 1, orgName: 'Test State' }]
                    }
                }
            }))
        })

        it('should call getAllDepartmentsHeaderAPI', () => {
            component.ngOnInit()
            expect(mockDirectoryService.getDepartmentTitles).toHaveBeenCalled()
        })

        it('should initialize table data correctly', () => {
            component.ngOnInit()
            expect(component.tabledata).toEqual({
                columns: [
                    { displayName: 'Full name', key: 'fullName' },
                    { displayName: 'Email', key: 'email' },
                    { displayName: 'Role', key: 'role' },
                ],
                needCheckBox: false,
                needHash: false,
                sortColumn: '',
                sortState: 'asc',
            })
        })
    })

    describe('Form Validation', () => {
        describe('forbiddenNamesValidator', () => {
            it('should return null when optionsArray is null', () => {
                const validator = forbiddenNamesValidator(null)
                const result = validator({ value: { orgName: 'test' } } as any)
                expect(result).toBeNull()
            })

            it('should return null when control value is null', () => {
                const validator = forbiddenNamesValidator([])
                const result = validator({ value: null } as any)
                expect(result).toBeNull()
            })

            it('should return error when orgName exists in options', () => {
                const options = [{ orgName: 'existing' }]
                const validator = forbiddenNamesValidator(options)
                const result = validator({ value: { orgName: 'existing' } } as any)
                expect(result).toEqual({ forbiddenNames: { value: 'existing' } })
            })

            it('should return null when orgName does not exist in options', () => {
                const options = [{ orgName: 'existing' }]
                const validator = forbiddenNamesValidator(options)
                const result = validator({ value: { orgName: 'new' } } as any)
                expect(result).toBeNull()
            })
        })

        describe('specialCharachters', () => {
            it('should prevent space character input', () => {
                const event = { which: 32, preventDefault: jest.fn() }
                const result = component.specialCharachters(event, 'cbpProvider')
                expect(event.preventDefault).toHaveBeenCalled()
                expect(result).toBe(false)
            })

            it('should allow valid characters', () => {
                const event = { which: 65, keyCode: 65, preventDefault: jest.fn() } // 'A'
                const result = component.specialCharachters(event, 'cbpProvider')
                expect(result).toBe(true)
            })

            it('should prevent invalid characters', () => {
                const event = { which: 64, keyCode: 64, preventDefault: jest.fn() } // '@'
                const result = component.specialCharachters(event, 'cbpProvider')
                expect(event.preventDefault).toHaveBeenCalled()
                expect(result).toBe(false)
            })

            it('should set form errors for invalid input in cbpProvider field', () => {
                const event = {
                    target: { value: 'test@123' },
                    which: 65,
                    keyCode: 65,
                    preventDefault: jest.fn()
                }
                component.specialCharachters(event, 'cbpProvider')
                expect(component.contentForm.controls['name'].errors).toEqual({ invalid: true })
            })
        })
    })

    describe('Dropdown Methods', () => {
        beforeEach(() => {
            mockCreateMdoService.getStatesOrMinisteries.mockReturnValue(of({
                result: {
                    response: {
                        content: [{ id: 1, orgName: 'Test State' }]
                    }
                }
            }))

            mockCreateMdoService.getDeparmentsOfState.mockReturnValue(of({
                result: {
                    response: {
                        content: [{ id: 1, orgName: 'Test Department' }]
                    }
                }
            }))

            mockCreateMdoService.getOrgsOfDepartment.mockReturnValue(of({
                result: {
                    response: {
                        content: [{ id: 1, orgName: 'Test Organization' }]
                    }
                }
            }))
        })

        describe('fetchDropDownValues', () => {
            it('should fetch states when formType is state', () => {
                component.formType = 'state'
                component.fetchDropDownValues()
                expect(mockCreateMdoService.getStatesOrMinisteries).toHaveBeenCalledWith('state')
            })

            it('should fetch ministries when formType is department and not state admin', () => {
                component.formType = 'department'
                component.isStateAdmin = false
                component.fetchDropDownValues()
                expect(mockCreateMdoService.getStatesOrMinisteries).toHaveBeenCalledWith('ministry')
            })
        })

        describe('ministrySelected', () => {
            it('should clear department and organisation fields', () => {
                const mockValue = { orgName: 'Test Ministry', mapId: 'map-1' }
                component.ministrySelected(mockValue)
                expect(component.departmentForm.get('department')?.value).toBe('')
                expect(component.departmentForm.get('organisation')?.value).toBe('')
            })

            it('should fetch departments when mapId is provided', () => {
                const mockValue = { orgName: 'Test Ministry', mapId: 'map-1' }
                component.ministrySelected(mockValue)
                expect(mockCreateMdoService.getDeparmentsOfState).toHaveBeenCalledWith('map-1')
            })
        })

        describe('departmentSelected', () => {
            it('should clear organisation field', () => {
                const mockValue = { orgName: 'Test Department', mapId: 'map-1' }
                component.departmentSelected(mockValue)
                expect(component.departmentForm.get('organisation')?.value).toBe('')
            })

            it('should fetch organizations when mapId is provided', () => {
                const mockValue = { orgName: 'Test Department', mapId: 'map-1' }
                component.departmentSelected(mockValue)
                expect(mockCreateMdoService.getOrgsOfDepartment).toHaveBeenCalledWith('map-1')
            })
        })
    })

    describe('Filter Methods', () => {
        beforeEach(() => {
            component.states = [
                { orgName: 'Test State 1' },
                { orgName: 'Another State' },
                { orgName: 'Test State 2' }
            ]
            component.ministeries = [
                { orgName: 'Test Ministry 1' },
                { orgName: 'Another Ministry' }
            ]
            component.departments = [
                { orgName: 'Test Department 1' },
                { orgName: 'Another Department' }
            ]
            component.orgs = [
                { orgName: 'Test Organization 1' },
                { orgName: 'Another Organization' }
            ]
        })

        it('should filter states correctly', () => {
            const result = component.filterStates('Test')
            expect(result).toHaveLength(2)
            expect(result[0].orgName).toBe('Test State 1')
            expect(result[1].orgName).toBe('Test State 2')
        })

        it('should filter ministries correctly', () => {
            const result = component.filterMinisteries('Test')
            expect(result).toHaveLength(1)
            expect(result[0].orgName).toBe('Test Ministry 1')
        })

        it('should filter departments correctly', () => {
            const result = component.filterDepartments('Another')
            expect(result).toHaveLength(1)
            expect(result[0].orgName).toBe('Another Department')
        })

        it('should filter organizations correctly', () => {
            const result = component.filterOrgs('Test')
            expect(result).toHaveLength(1)
            expect(result[0].orgName).toBe('Test Organization 1')
        })
    })

    describe('Form Submission', () => {
        describe('onSubmit', () => {
            beforeEach(() => {
                component.contentForm.patchValue({
                    name: 'Test Department',
                    head: 'Test Head',
                    deptSubTypeId: 1
                })
                component.deptType = 'test-type'
                component.department = 'MDO'
                component.loggedInUserId = 'test-user'
            })

            it('should create department when form is valid and not updating', () => {
                mockCreateMdoService.createDepartment.mockReturnValue(of({
                    result: {
                        response: 'SUCCESS',
                        organisationId: 'org-123'
                    }
                }))

                component.isUpdate = false
                component.onSubmit()

                expect(mockCreateMdoService.createDepartment).toHaveBeenCalledWith(
                    component.contentForm.value,
                    'test-type',
                    'MDO',
                    'test-user'
                )
                expect(mockRouter.navigate).toHaveBeenCalled()
            })

            it('should update department when form is valid and updating', () => {
                mockCreateMdoService.updateDepartment.mockReturnValue(of({
                    result: { response: 'SUCCESS' }
                }))

                component.isUpdate = true
                component.updateId = 123
                component.onSubmit()

                expect(mockCreateMdoService.updateDepartment).toHaveBeenCalledWith(
                    123,
                    'test-type',
                    'MDO',
                    'test-user',
                    component.contentForm.value
                )
            })

            it('should show error when form is invalid', () => {
                component.contentForm.patchValue({ name: null })
                component.onSubmit()
                expect(mockSnackBar.open).toHaveBeenCalledWith('Form is not valid')
            })

            it('should handle create department error', () => {
                mockCreateMdoService.createDepartment.mockReturnValue(
                    throwError({ error: 'Create failed' })
                )

                component.isUpdate = false
                component.onSubmit()

                expect(mockSnackBar.open).toHaveBeenCalledWith(
                    "Something went wrong, please try again later", "X", { "duration": 5000 }
                )
            })
        })

        describe('onSubmitState', () => {
            beforeEach(() => {
                component.stateForm.patchValue({
                    state: { orgName: 'Test State', sbOrgType: 'state' }
                })
                component.loggedInUserId = 'test-user'
            })

            it('should create state when form is valid', () => {
                mockCreateMdoService.createStateOrMinistry.mockReturnValue(of({
                    responseCode: 200
                }))

                component.isUpdate = false
                component.onSubmitState()

                expect(mockCreateMdoService.createStateOrMinistry).toHaveBeenCalled()
                expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/directory'])
            })

            it('should show error when state is already onboarded', () => {
                component.stateForm.patchValue({
                    state: { orgName: 'Test State', sbOrgId: 'existing-id' }
                })

                component.onSubmitState()
                expect(mockSnackBar.open).toHaveBeenCalledWith("Selected State is already onboarded!", "X", { "duration": 5000 })
            })

            it('should show error when state form is invalid', () => {
                component.stateForm.patchValue({ state: null })
                component.onSubmitState()
                expect(mockSnackBar.open).toHaveBeenCalledWith('State Form is not valid')
            })
        })

        describe('onSubmitDepartment', () => {
            beforeEach(() => {
                component.departmentForm.patchValue({
                    ministry: { orgName: 'Test Ministry', mapId: 'map-1' },
                    department: null,
                    organisation: null
                })
                component.loggedInUserId = 'test-user'
            })

            it('should create department when form is valid', () => {
                mockCreateMdoService.createStateOrMinistry.mockReturnValue(of({
                    responseCode: 200
                }))

                component.isUpdate = false
                component.onSubmitDepartment()

                expect(mockCreateMdoService.createStateOrMinistry).toHaveBeenCalled()
            })

            it('should show error when department form is invalid', () => {
                component.departmentForm.patchValue({ ministry: null })
                component.onSubmitDepartment()
                expect(mockSnackBar.open).toHaveBeenCalledWith('Department Form not valid')
            })
        })
    })

    describe('User Management', () => {
        describe('openPopup', () => {
            it('should open user popup dialog', () => {
                component.openPopup()
                expect(mockDialog.open).toHaveBeenCalled()
            })
        })

        describe('getAllResponse', () => {
            it('should transform user response correctly', () => {
                const mockResponse = {
                    data: [
                        { userId: 'user-1', fullname: 'John Doe', email: 'john@example.com' },
                        { userId: 'user-2', fullname: 'Jane Smith', email: 'jane@example.com' }
                    ]
                }

                const result = component.getAllResponse(mockResponse)
                expect(result).toHaveLength(2)
                expect(result[0]).toEqual({
                    userId: 'user-1',
                    fullName: 'John Doe',
                    email: 'john@example.com',
                    role: 'ADMIN'
                })
            })

            it('should return empty array when response is null', () => {
                const result = component.getAllResponse(null)
                expect(result).toEqual([])
            })
        })
    })

    describe('Utility Methods', () => {
        describe('checkCondition', () => {
            it('should return true', () => {
                const result = component.checkCondition('first', 'second')
                expect(result).toBe(true)
            })
        })

        describe('showError', () => {
            it('should return true', () => {
                const result = component.showError('error message')
                expect(result).toBe(true)
            })
        })

        describe('getRole', () => {
            it('should return MDO ADMIN', () => {
                const result = component.getRole()
                expect(result).toBe('MDO ADMIN')
            })
        })

        describe('capitalizeFirstLetter', () => {
            it('should return the same string', () => {
                const result = component.capitalizeFirstLetter('test')
                expect(result).toBe('test')
            })
        })

        describe('displayFnState', () => {
            it('should return orgName when value exists', () => {
                const result = component.displayFnState({ orgName: 'Test State' })
                expect(result).toBe('Test State')
            })

            it('should return undefined when value is null', () => {
                const result = component.displayFnState(null)
                expect(result).toBeUndefined()
            })
        })
    })

    describe('Navigation Methods', () => {
        it('should navigate to directory on cancel', () => {
            component.department = 'MDO'
            component.onCancel()
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/directory', { department: 'MDO' }])
        })

        it('should navigate to state directory on cancel state', () => {
            component.onCancelState()
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/directory/state'])
        })
    })

    describe('Telemetry', () => {
        it('should raise telemetry event', () => {
            component.raiseTelemetry()
            expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalledWith(
                {
                    type: 'click',
                    subType: 'button',
                    id: 'button-click',
                },
                {}
            )
        })
    })

    describe('Error Handling', () => {
        it('should handle API errors gracefully', () => {
            mockCreateMdoService.createDepartment.mockReturnValue(
                throwError({ error: { errors: [{ message: 'API Error' }] } })
            )

            component.contentForm.patchValue({
                name: 'Test',
                deptSubTypeId: 1
            })
            component.deptType = 'test'
            component.department = 'MDO'
            component.loggedInUserId = 'user'
            component.isUpdate = false

            component.onSubmit()

            expect(mockSnackBar.open).toHaveBeenCalledWith(
                "Something went wrong, please try again later", "X", { "duration": 5000 }
            )
        })
    })

    describe('Department Type Selection', () => {
        it('should set department type', () => {
            component.selectedType('test-type')
            expect(component.deptType).toBe('test-type')
        })

        it('should set department sub type', () => {
            component.selectedSubType('test-sub-type')
            expect(component.deptSubType).toBe('test-sub-type')
        })
    })

    describe('Component Cleanup', () => {
        it('should unsubscribe from subscriptions on destroy', () => {
            const mockSubscription = { unsubscribe: jest.fn() }
            component.defaultSideNavBarOpenedSubscription = mockSubscription
            component.bannerSubscription = mockSubscription

            component.onDestroy()

            expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(2)
        })
    })
})