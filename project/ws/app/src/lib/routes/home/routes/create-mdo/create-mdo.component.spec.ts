import { CreateMdoComponent } from './create-mdo.component'
import { UntypedFormGroup } from '@angular/forms'
import { of, throwError, BehaviorSubject } from 'rxjs'

// Mock interfaces
interface MockMatDialog {
    open: jest.Mock
}

interface MockMatSnackBar {
    open: jest.Mock
}

interface MockCreateMDOService {
    getStatesOrMinisteries: jest.Mock
    getDeparmentsOfState: jest.Mock
    getOrgsOfDepartment: jest.Mock
    assignAdminToDepartment: jest.Mock
    createDepartment: jest.Mock
    updateDepartment: jest.Mock
    createStateOrMinistry: jest.Mock
    updateStateOrMinistry: jest.Mock
}

interface MockRouter {
    navigate: jest.Mock
}

interface MockDirectoryService {
    getDepartmentTitles: jest.Mock
    getDepartmentSubTitles: jest.Mock
}

interface MockValueService {
    isLtMedium$: BehaviorSubject<boolean>
}

interface MockActivatedRoute {
    params: BehaviorSubject<any>
    snapshot: any
}

interface MockEventService {
    raiseInteractTelemetry: jest.Mock
}

describe('CreateMdoComponent', () => {
    let component: CreateMdoComponent
    let mockDialog: MockMatDialog
    let mockSnackBar: MockMatSnackBar
    let mockCreateMdoService: MockCreateMDOService
    let mockRouter: MockRouter
    let mockDirectoryService: MockDirectoryService
    let mockValueService: MockValueService
    let mockActivatedRoute: MockActivatedRoute
    let mockEventService: MockEventService

    // const mockUserPopupComponent = {}

    beforeEach(() => {
        // Mock all dependencies
        mockDialog = {
            open: jest.fn().mockReturnValue({
                afterClosed: () => of({ data: [{ userId: '123', fullname: 'Test User', email: 'test@test.com' }] })
            })
        }

        mockSnackBar = {
            open: jest.fn()
        }

        mockCreateMdoService = {
            getStatesOrMinisteries: jest.fn().mockReturnValue(of({
                result: { response: { content: [{ orgName: 'Test State', mapId: '1' }] } }
            })),
            getDeparmentsOfState: jest.fn().mockReturnValue(of({
                result: { response: { content: [{ orgName: 'Test Dept', mapId: '2' }] } }
            })),
            getOrgsOfDepartment: jest.fn().mockReturnValue(of({
                result: { response: { content: [{ orgName: 'Test Org', mapId: '3' }] } }
            })),
            assignAdminToDepartment: jest.fn().mockReturnValue(of({ success: true })),
            createDepartment: jest.fn().mockReturnValue(of({
                result: { response: 'SUCCESS', organisationId: '123' }
            })),
            updateDepartment: jest.fn().mockReturnValue(of({
                result: { response: 'SUCCESS' }
            })),
            createStateOrMinistry: jest.fn().mockReturnValue(of({
                responseCode: 'SUCCESS'
            })),
            updateStateOrMinistry: jest.fn().mockReturnValue(of({
                result: { response: 'SUCCESS' },
                responseCode: 'SUCCESS'
            }))
        }

        mockRouter = {
            navigate: jest.fn()
        }

        mockDirectoryService = {
            getDepartmentTitles: jest.fn().mockReturnValue(of({
                result: { response: { value: JSON.stringify({ orgTypeList: [{ name: 'MDO', subTypeList: [] }] }) } }
            })),
            getDepartmentSubTitles: jest.fn().mockReturnValue(of({
                result: { response: { value: JSON.stringify({ fields: [{ value: 1, name: 'Test Type' }] }) } }
            }))
        }

        mockValueService = {
            isLtMedium$: new BehaviorSubject(false)
        }

        mockActivatedRoute = {
            params: new BehaviorSubject({
                data: JSON.stringify({ row: { id: 1, mdo: 'Test MDO', head: 'Test Head', typeid: 1 } }),
                department: 'MDO',
                isFromDirectory: true,
                addAdmin: false
            }),
            snapshot: {
                parent: {
                    data: {
                        configService: {
                            userProfile: { userId: 'user123' },
                            unMappedUser: {
                                roles: ['STATE_ADMIN'],
                                rootOrgId: 'root123'
                            }
                        }
                    }
                }
            }
        }

        mockEventService = {
            raiseInteractTelemetry: jest.fn()
        }

        // Create component instance
        component = new CreateMdoComponent(
            mockDialog as any,
            mockSnackBar as any,
            mockCreateMdoService as any,
            mockRouter as any,
            mockDirectoryService as any,
            mockValueService as any,
            mockActivatedRoute as any,
            mockEventService as any
        )
    })

    describe('Constructor', () => {
        it('should create component instance', () => {
            expect(component).toBeDefined()
            expect(component.loggedInUserId).toBe('user123')
            expect(component.isStateAdmin).toBe(true)
        })

        it('should initialize forms', () => {
            expect(component.contentForm).toBeInstanceOf(UntypedFormGroup)
            expect(component.stateForm).toBeInstanceOf(UntypedFormGroup)
            expect(component.departmentForm).toBeInstanceOf(UntypedFormGroup)
        })

        it('should set formType to department when department is mdo', () => {
            mockActivatedRoute.params.next({ department: 'mdo' })
            component = new CreateMdoComponent(
                mockDialog as any,
                mockSnackBar as any,
                mockCreateMdoService as any,
                mockRouter as any,
                mockDirectoryService as any,
                mockValueService as any,
                mockActivatedRoute as any,
                mockEventService as any
            )
            expect(component.formType).toBe('department')
        })

        it('should set formType to state when department is state', () => {
            mockActivatedRoute.params.next({ department: 'state' })
            component = new CreateMdoComponent(
                mockDialog as any,
                mockSnackBar as any,
                mockCreateMdoService as any,
                mockRouter as any,
                mockDirectoryService as any,
                mockValueService as any,
                mockActivatedRoute as any,
                mockEventService as any
            )
            expect(component.formType).toBe('state')
        })

        it('should handle CBP Providers department name', () => {
            mockActivatedRoute.params.next({ department: 'CBP Providers' })
            component = new CreateMdoComponent(
                mockDialog as any,
                mockSnackBar as any,
                mockCreateMdoService as any,
                mockRouter as any,
                mockDirectoryService as any,
                mockValueService as any,
                mockActivatedRoute as any,
                mockEventService as any
            )
            expect(component.department).toBe('CBP')
        })

        it('should handle addAdmin scenario', () => {
            mockActivatedRoute.params.next({
                addAdmin: true,
                currentDept: 'TestDept',
                department: 'dept123'
            })
            component = new CreateMdoComponent(
                mockDialog as any,
                mockSnackBar as any,
                mockCreateMdoService as any,
                mockRouter as any,
                mockDirectoryService as any,
                mockValueService as any,
                mockActivatedRoute as any,
                mockEventService as any
            )
            expect(component.isAddAdmin).toBe(true)
            expect(component.submittedForm).toBe(false)
            expect(component.departmentRole).toBe('MDO ADMIN')
        })
    })

    describe('ngOnInit', () => {
        it('should call all initialization methods', () => {
            const spyGetAllDepartments = jest.spyOn(component, 'getAllDepartmentsHeaderAPI')
            const spyGetSubDepartment = jest.spyOn(component, 'getSubDepartment')
            const spyFetchDropDown = jest.spyOn(component, 'fetchDropDownValues')
            const spyOnStateChange = jest.spyOn(component, 'onStateChange')
            const spyOnMinisteriesChange = jest.spyOn(component, 'onMinisteriesChange')
            const spyOnDepartmentChange = jest.spyOn(component, 'onDepartmentChange')
            const spyOnOrgsChange = jest.spyOn(component, 'onOrgsChange')

            component.ngOnInit()

            expect(spyGetAllDepartments).toHaveBeenCalled()
            expect(spyGetSubDepartment).toHaveBeenCalled()
            expect(spyFetchDropDown).toHaveBeenCalled()
            expect(spyOnStateChange).toHaveBeenCalled()
            expect(spyOnMinisteriesChange).toHaveBeenCalled()
            expect(spyOnDepartmentChange).toHaveBeenCalled()
            expect(spyOnOrgsChange).toHaveBeenCalled()
        })

        it('should set tabledata configuration', () => {
            component.ngOnInit()
            expect(component.tabledata.columns).toEqual([
                { displayName: 'Full name', key: 'fullName' },
                { displayName: 'Email', key: 'email' },
                { displayName: 'Role', key: 'role' }
            ])
        })
    })

    describe('checkCondition', () => {
        it('should return true for any inputs', () => {
            expect(component.checkCondition('first', 'second')).toBe(true)
            expect(component.checkCondition('', '')).toBe(true)
        })
    })

    describe('showError', () => {
        it('should return true for any error input', () => {
            expect(component.showError('error')).toBe(true)
            expect(component.showError('')).toBe(true)
        })
    })

    describe('openPopup', () => {
        it('should open dialog and handle response', () => {
            component.departmentId = 'dept123'
            component.departmentRole = 'ADMIN'

            component.openPopup()

            expect(mockDialog.open).toHaveBeenCalled()
            expect(mockCreateMdoService.assignAdminToDepartment).toHaveBeenCalledWith('123', 'dept123', 'ADMIN')
        })

        it('should handle assignment error', () => {
            mockCreateMdoService.assignAdminToDepartment.mockReturnValue(
                throwError({ error: { errors: [{ message: 'Assignment failed' }] } })
            )
            const spyOpenSnackbar = jest.spyOn(component, 'openSnackbar' as any)

            component.openPopup()

            expect(spyOpenSnackbar).toHaveBeenCalledWith('Assignment failed')
        })
    })

    describe('specialCharachters', () => {
        it('should validate input and set form errors for invalid characters', () => {
            const event = {
                target: { value: 'invalid@chars' },
                which: 65,
                preventDefault: jest.fn(),
                keyCode: 64
            }

            component.specialCharachters(event, 'cbpProvider')

            expect(component.contentForm.controls['name'].hasError('invalid')).toBe(true)
        })

        it('should prevent space character input', () => {
            const event = {
                target: { value: 'test' },
                which: 32,
                preventDefault: jest.fn(),
                keyCode: 32
            }

            const result = component.specialCharachters(event, 'cbpProvider')

            expect(event.preventDefault).toHaveBeenCalled()
            expect(result).toBe(false)
            expect(component.disableCreateButton).toBe(true)
        })

        it('should handle leading/trailing whitespace', () => {
            const event = {
                target: { value: ' test ' },
                which: 65,
                preventDefault: jest.fn(),
                keyCode: 65
            }
            const spyOpenSnackbar = jest.spyOn(component, 'openSnackbar' as any)

            component.specialCharachters(event, 'cbpProvider')

            expect(spyOpenSnackbar).toHaveBeenCalledWith('Please check for leading or trailing whitespace')
        })

        it('should allow valid characters', () => {
            const event = {
                target: { value: 'validtext' },
                which: 65,
                preventDefault: jest.fn(),
                keyCode: 65
            }

            const result = component.specialCharachters(event, 'cbpProvider')

            expect(result).toBe(true)
            expect(component.disableCreateButton).toBe(false)
        })

        it('should handle different department types', () => {
            const event = {
                target: { value: 'invalid@' },
                which: 65,
                preventDefault: jest.fn(),
                keyCode: 65
            }

            component.specialCharachters(event, 'state')
            expect(component.stateForm.controls['state'].hasError('invalid')).toBe(true)

            component.specialCharachters(event, 'ministry')
            expect(component.departmentForm.controls['ministry'].hasError('invalid')).toBe(true)

            component.specialCharachters(event, 'organization')
            expect(component.departmentForm.controls['organisation'].hasError('invalid')).toBe(true)

            component.specialCharachters(event, 'department')
            expect(component.departmentForm.controls['department'].hasError('invalid')).toBe(true)
        })
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

        it('should handle state admin scenario', () => {
            component.formType = 'department'
            component.isStateAdmin = true
            const spyMinistrySelected = jest.spyOn(component, 'ministrySelected')

            mockCreateMdoService.getStatesOrMinisteries.mockReturnValue(of({
                result: { response: { content: [{ orgName: 'Test State', sbOrgId: 'root123' }] } }
            }))

            component.fetchDropDownValues()

            expect(mockCreateMdoService.getStatesOrMinisteries).toHaveBeenCalledWith('state')
            expect(spyMinistrySelected).toHaveBeenCalled()
        })
    })

    describe('ministrySelected', () => {
        it('should handle ministry selection with valid mapId', () => {
            const ministry = { orgName: 'Test Ministry', mapId: '123' }

            component.ministrySelected(ministry)

            expect(mockCreateMdoService.getDeparmentsOfState).toHaveBeenCalledWith('123')
            expect(component.departmentForm.get('department')?.value).toBe('')
            expect(component.departmentForm.get('organisation')?.value).toBe('')
        })

        it('should set form error for invalid ministry name', () => {
            const ministry = { orgName: 'Invalid@Name', mapId: '123' }

            component.ministrySelected(ministry)

            expect(component.departmentForm.controls['ministry'].hasError('invalid')).toBe(true)
        })
    })

    describe('departmentSelected', () => {
        it('should handle department selection with valid mapId', () => {
            const department = { orgName: 'Test Department', mapId: '456' }

            component.departmentSelected(department)

            expect(mockCreateMdoService.getOrgsOfDepartment).toHaveBeenCalledWith('456')
            expect(component.departmentForm.get('organisation')?.value).toBe('')
        })

        it('should set form error for invalid department name', () => {
            const department = { orgName: 'Invalid@Name', mapId: '456' }

            component.departmentSelected(department)

            expect(component.departmentForm.controls['department'].hasError('invalid')).toBe(true)
        })
    })

    describe('getAllResponse', () => {
        it('should transform response data to user array', () => {
            const response = {
                data: [
                    { userId: '1', fullname: 'User One', email: 'user1@test.com' },
                    { userId: '2', fullname: 'User Two', email: 'user2@test.com' }
                ]
            }

            const result = component.getAllResponse(response)

            expect(result).toHaveLength(2)
            expect(result[0]).toEqual({
                userId: '1',
                fullName: 'User One',
                email: 'user1@test.com',
                role: 'ADMIN'
            })
        })

        it('should return empty array for null/undefined response', () => {
            expect(component.getAllResponse(null)).toEqual([])
            expect(component.getAllResponse(undefined)).toEqual([])
        })
    })

    describe('getAllDepartmentsHeaderAPI', () => {
        it('should fetch department titles and set subDepartments', () => {
            component.department = 'MDO'
            component.getAllDepartmentsHeaderAPI()

            expect(mockDirectoryService.getDepartmentTitles).toHaveBeenCalled()
        })
    })

    describe('getSubDepartment', () => {
        it('should fetch department subtitles and patch form value', () => {
            component.subTypeId = 1
            component.getSubDepartment()

            expect(mockDirectoryService.getDepartmentSubTitles).toHaveBeenCalled()
        })
    })

    describe('selectedType and selectedSubType', () => {
        it('should set department type', () => {
            component.selectedType('testType')
            expect(component.deptType).toBe('testType')
        })

        it('should set department subtype', () => {
            component.selectedSubType('testSubType')
            expect(component.deptSubType).toBe('testSubType')
        })
    })

    describe('onSubmit', () => {
        beforeEach(() => {
            component.contentForm.patchValue({
                name: 'Test Name',
                head: 'Test Head',
                deptSubTypeId: '1'
            })
            component.deptType = 'testType'
            component.department = 'testDept'
        })

        it('should create department when form is valid and not updating', () => {
            component.isUpdate = false
            const spyRaiseTelemetry = jest.spyOn(component, 'raiseTelemetry')

            component.onSubmit()

            expect(spyRaiseTelemetry).toHaveBeenCalled()
            expect(mockCreateMdoService.createDepartment).toHaveBeenCalled()
        })

        it('should update department when form is valid and updating', () => {
            component.isUpdate = true
            component.updateId = 123
            const spyRaiseTelemetry = jest.spyOn(component, 'raiseTelemetry')

            component.onSubmit()

            expect(spyRaiseTelemetry).toHaveBeenCalled()
            expect(mockCreateMdoService.updateDepartment).toHaveBeenCalled()
        })

        it('should handle creation error', () => {
            component.isUpdate = false
            mockCreateMdoService.createDepartment.mockReturnValue(throwError('Creation failed'))
            const spyOpenSnackbar = jest.spyOn(component, 'openSnackbar' as any)

            component.onSubmit()

            expect(spyOpenSnackbar).toHaveBeenCalledWith('Something went wrong, please try again later')
        })

        it('should show error when form is invalid', () => {
            component.contentForm.patchValue({ name: null })

            component.onSubmit()

            expect(mockSnackBar.open).toHaveBeenCalledWith('Form is not valid')
        })
    })

    describe('Filter methods', () => {
        beforeEach(() => {
            component.states = [
                { orgName: 'Test State One' },
                { orgName: 'Another State' }
            ]
            component.ministeries = [
                { orgName: 'Test Ministry' },
                { orgName: 'Another Ministry' }
            ]
            component.departments = [
                { orgName: 'Test Department' },
                { orgName: 'Another Department' }
            ]
            component.orgs = [
                { orgName: 'Test Organization' },
                { orgName: 'Another Organization' }
            ]
        })

        describe('filterStates', () => {
            it('should filter states by name', () => {
                const result = component.filterStates('test')
                expect(result).toHaveLength(1)
                expect(result[0].orgName).toBe('Test State One')
            })

            it('should return all states for empty string', () => {
                const result = component.filterStates('')
                expect(result).toHaveLength(2)
            })

            it('should set validation error for invalid characters', () => {
                component.filterStates('invalid@')
                expect(component.stateForm.controls['state'].hasError('invalid')).toBe(true)
            })
        })

        describe('filterMinisteries', () => {
            it('should filter ministries by name', () => {
                const result = component.filterMinisteries('test')
                expect(result).toHaveLength(1)
                expect(result[0].orgName).toBe('Test Ministry')
            })

            it('should return all ministries for empty string', () => {
                const result = component.filterMinisteries('')
                expect(result).toHaveLength(2)
            })
        })

        describe('filterDepartments', () => {
            it('should filter departments by name', () => {
                const result = component.filterDepartments('test')
                expect(result).toHaveLength(1)
                expect(result[0].orgName).toBe('Test Department')
            })

            it('should return all departments for empty string', () => {
                const result = component.filterDepartments('')
                expect(result).toHaveLength(2)
            })
        })

        describe('filterOrgs', () => {
            it('should filter organizations by name', () => {
                const result = component.filterOrgs('test')
                expect(result).toHaveLength(1)
                expect(result[0].orgName).toBe('Test Organization')
            })

            it('should set validation error for invalid characters', () => {
                component.filterOrgs('invalid@')
                expect(component.departmentForm.controls['organisation'].hasError('invalid')).toBe(true)
            })

            it('should enable create button for valid input', () => {
                component.filterOrgs('valid')
                expect(component.disableCreateButton).toBe(false)
            })
        })
    })

    describe('onStateChange', () => {
        it('should setup observable for state form changes', () => {
            component.states = [{ orgName: 'Test State' }]

            component.onStateChange()

            expect(component.masterStates).toBeDefined()
        })
    })

    describe('onMinisteriesChange', () => {
        it('should setup observable for ministry form changes', () => {
            component.ministeries = [{ orgName: 'Test Ministry' }]

            component.onMinisteriesChange()

            expect(component.masterMinisteries).toBeDefined()
        })
    })

    describe('onDepartmentChange', () => {
        it('should setup observable for department form changes', () => {
            component.departments = [{ orgName: 'Test Department' }]

            component.onDepartmentChange()

            expect(component.masterDepartments).toBeDefined()
        })
    })

    describe('onOrgsChange', () => {
        it('should setup observable for organization form changes', () => {
            component.orgs = [{ orgName: 'Test Organization' }]
            component.disableCreateButton = false

            component.onOrgsChange()

            expect(component.masterOrgs).toBeDefined()
            expect(component.disableCreateButton).toBe(true)
        })
    })

    describe('onSubmitState', () => {
        beforeEach(() => {
            component.stateForm.patchValue({
                state: { orgName: 'Test State', sbOrgType: 'state' }
            })
        })

        it('should create state when form is valid and not updating', () => {
            component.isUpdate = false
            const spyRaiseTelemetry = jest.spyOn(component, 'raiseTelemetry')

            component.onSubmitState()

            expect(spyRaiseTelemetry).toHaveBeenCalled()
            expect(mockCreateMdoService.createStateOrMinistry).toHaveBeenCalled()
        })

        it('should handle already onboarded state', () => {
            component.stateForm.patchValue({
                state: { orgName: 'Test State', sbOrgId: 'existing123' }
            })
            const spyOpenSnackbar = jest.spyOn(component, 'openSnackbar' as any)

            component.onSubmitState()

            expect(spyOpenSnackbar).toHaveBeenCalledWith('Selected State is already onboarded!')
        })

        it('should update state when updating', () => {
            component.isUpdate = true
            const spyRaiseTelemetry = jest.spyOn(component, 'raiseTelemetry')

            component.onSubmitState()

            expect(spyRaiseTelemetry).toHaveBeenCalled()
            expect(mockCreateMdoService.updateStateOrMinistry).toHaveBeenCalled()
        })

        it('should handle creation error', () => {
            component.isUpdate = false
            mockCreateMdoService.createStateOrMinistry.mockReturnValue(throwError('State creation failed'))
            const spyOpenSnackbar = jest.spyOn(component, 'openSnackbar' as any)

            component.onSubmitState()

            expect(spyOpenSnackbar).toHaveBeenCalledWith('Something went wrong, please try again later')
        })

        it('should show error when form is invalid', () => {
            component.stateForm.patchValue({ state: null })

            component.onSubmitState()

            expect(mockSnackBar.open).toHaveBeenCalledWith('State Form is not valid')
        })
    })

    describe('onSubmitDepartment', () => {
        beforeEach(() => {
            component.departmentForm.patchValue({
                ministry: { orgName: 'Test Ministry', mapId: '1' },
                department: { orgName: 'Test Department', mapId: '2' },
                organisation: { orgName: 'Test Organization', mapId: '3' }
            })
        })

        it('should create department when form is valid and not updating', () => {
            component.isUpdate = false
            const spyRaiseTelemetry = jest.spyOn(component, 'raiseTelemetry')

            component.onSubmitDepartment()

            expect(spyRaiseTelemetry).toHaveBeenCalled()
            expect(mockCreateMdoService.createStateOrMinistry).toHaveBeenCalled()
        })

        it('should handle already onboarded organization', () => {
            component.departmentForm.patchValue({
                ministry: { orgName: 'Test Ministry', sbOrgId: 'existing1' },
                department: { orgName: 'Test Department', sbOrgId: 'existing2' },
                organisation: { orgName: 'Test Organization', sbOrgId: 'existing3' }
            })
            const spyOpenSnackbar = jest.spyOn(component, 'openSnackbar' as any)

            component.onSubmitDepartment()

            expect(spyOpenSnackbar).toHaveBeenCalledWith('Selected Org is already onboarded!')
        })

        it('should handle different hierarchy levels', () => {
            // Only ministry selected
            component.departmentForm.patchValue({
                ministry: { orgName: 'Test Ministry', mapId: '1' },
                department: null,
                organisation: null
            })

            component.onSubmitDepartment()

            expect(mockCreateMdoService.createStateOrMinistry).toHaveBeenCalled()

            // Ministry and department selected
            component.departmentForm.patchValue({
                ministry: { orgName: 'Test Ministry', mapId: '1' },
                department: { orgName: 'Test Department', mapId: '2' },
                organisation: null
            })

            component.onSubmitDepartment()

            expect(mockCreateMdoService.createStateOrMinistry).toHaveBeenCalled()
        })

        it('should update department when updating', () => {
            component.isUpdate = true
            const spyRaiseTelemetry = jest.spyOn(component, 'raiseTelemetry')

            component.onSubmitDepartment()

            expect(spyRaiseTelemetry).toHaveBeenCalled()
            expect(mockCreateMdoService.updateStateOrMinistry).toHaveBeenCalled()
        })

        it('should show error when form is invalid', () => {
            component.departmentForm.patchValue({ ministry: null })

            component.onSubmitDepartment()

            expect(mockSnackBar.open).toHaveBeenCalledWith('Department Form not valid')
        })
    })

    describe('getMdoSubDepartmennt', () => {
        beforeEach(() => {
            component.subMDODepartments = [
                { id: 1, name: 'Dept 1' },
                { id: 2, name: 'Dept 2' }
            ]
        })

        it('should return element id when updating', () => {
            component.isUpdate = true
            const result = component.getMdoSubDepartmennt(1)
            expect(result).toBe(1)
        })

        it('should return full element when not updating', () => {
            component.isUpdate = false
            const result = component.getMdoSubDepartmennt(1)
            expect(result).toEqual({ id: 1, name: 'Dept 1' })
        })
    })

    describe('Navigation methods', () => {
        it('should navigate to directory on cancel', () => {
            component.department = 'testDept'
            component.onCancel()
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/directory', { department: 'testDept' }])
        })

        it('should navigate to state directory on cancel state', () => {
            component.onCancelState()
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/directory/state'])
        })
    })

    describe('getRole', () => {
        it('should return MDO ADMIN role', () => {
            expect(component.getRole()).toBe('MDO ADMIN')
        })
    })

    describe('openSnackbar', () => {
        it('should open snackbar with message and default duration', () => {
            (component as any).openSnackbar('Test message')
            expect(mockSnackBar.open).toHaveBeenCalledWith('Test message', 'X', { duration: 5000 })
        })

        it('should open snackbar with custom duration', () => {
            (component as any).openSnackbar('Test message', 3000)
            expect(mockSnackBar.open).toHaveBeenCalledWith('Test message', 'X', { duration: 3000 })
        })
    })

    describe('capitalizeFirstLetter', () => {
        it('should return the same string', () => {
            expect(component.capitalizeFirstLetter('test')).toBe('test')
            expect(component.capitalizeFirstLetter('TEST')).toBe('TEST')
        })
    })

    describe('onDestroy', () => {
        it('should unsubscribe from subscriptions when they exist', () => {
            const mockSubscription = { unsubscribe: jest.fn() }
            component.defaultSideNavBarOpenedSubscription = mockSubscription
            component.bannerSubscription = mockSubscription

            component.onDestroy()

            expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(2)
        })

        it('should handle missing subscriptions gracefully', () => {
            component.defaultSideNavBarOpenedSubscription = null
            component.bannerSubscription = null

            expect(() => component.onDestroy()).not.toThrow()
        })
    })

    describe('raiseTelemetry', () => {
        it('should call event service with correct parameters', () => {
            component.raiseTelemetry()

            expect(mockEventService.raiseInteractTelemetry).toHaveBeenCalledWith(
                {
                    type: 'click',
                    subType: 'button',
                    id: 'button-click',
                },
                {}
            )
        })
    })

    describe('displayFnState', () => {
        it('should return orgName when value exists', () => {
            const value = { orgName: 'Test State' }
            expect(component.displayFnState(value)).toBe('Test State')
        })

        it('should return undefined when value is null', () => {
            expect(component.displayFnState(null)).toBeUndefined()
        })

        it('should return undefined when value has no orgName', () => {
            expect(component.displayFnState({})).toBeUndefined()
        })
    })

    describe('Edge cases and error handling', () => {
        it('should handle empty arrays in filter methods', () => {
            component.states = []
            component.ministeries = []
            component.departments = []
            component.orgs = []

            expect(component.filterStates('test')).toEqual([])
            expect(component.filterMinisteries('test')).toEqual([])
            expect(component.filterDepartments('test')).toEqual([])
            expect(component.filterOrgs('test')).toEqual([])
        })

        it('should handle null event in specialCharachters method', () => {
            const event = null
            expect(() => component.specialCharachters(event, 'cbpProvider')).not.toThrow()
        })

        it('should handle form control getter errors gracefully', () => {
            // Test when form controls might be null
            component.stateForm = new UntypedFormGroup({})
            component.departmentForm = new UntypedFormGroup({})

            expect(() => component.onStateChange()).not.toThrow()
            expect(() => component.onMinisteriesChange()).not.toThrow()
            expect(() => component.onDepartmentChange()).not.toThrow()
            expect(() => component.onOrgsChange()).not.toThrow()
        })
    })
})