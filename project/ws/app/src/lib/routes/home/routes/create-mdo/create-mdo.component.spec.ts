import { CreateMdoComponent } from './create-mdo.component'
import { of, Subject } from 'rxjs'
import { UntypedFormGroup } from '@angular/forms'

describe('CreateMdoComponent', () => {
    let component: CreateMdoComponent
    let mockDialog: any
    let mockSnackBar: any
    let mockCreateMdoService: any
    let mockRouter: any
    let mockDirectoryService: any
    let mockValueService: any
    let mockActivatedRoute: any
    let mockEventService: any



    beforeEach(() => {
        mockDialog = {
            open: jest.fn().mockReturnValue({
                afterClosed: () => of({ data: [] })
            })
        }

        mockSnackBar = {
            open: jest.fn()
        }

        mockCreateMdoService = {
            createDepartment: jest.fn().mockReturnValue(of({ result: { response: 'SUCCESS', organisationId: '123' } })),
            updateDepartment: jest.fn().mockReturnValue(of({ result: { response: 'SUCCESS' } })),
            getStatesOrMinisteries: jest.fn().mockReturnValue(of({
                result: {
                    response: {
                        content: [
                            { orgName: 'State1', mapId: '1' },
                            { orgName: 'State2', mapId: '2' }
                        ]
                    }
                }
            })),
            getDeparmentsOfState: jest.fn().mockReturnValue(of({
                result: {
                    response: {
                        content: []
                    }
                }
            })),
            assignAdminToDepartment: jest.fn().mockReturnValue(of(true))
        }

        mockRouter = {
            navigate: jest.fn()
        }

        mockDirectoryService = {
            getDepartmentTitles: jest.fn().mockReturnValue(of({
                result: {
                    response: {
                        value: JSON.stringify({
                            orgTypeList: [
                                {
                                    name: 'TestDept',
                                    subTypeList: []
                                }
                            ]
                        })
                    }
                }
            })),
            getDepartmentSubTitles: jest.fn().mockReturnValue(of({
                result: {
                    response: {
                        value: JSON.stringify({
                            fields: []
                        })
                    }
                }
            }))
        }

        mockValueService = {
            isLtMedium$: new Subject()
        }

        mockActivatedRoute = {
            params: of({}),
            snapshot: {
                parent: {
                    data: {
                        configService: {
                            userProfile: {
                                userId: 'test-user'
                            },
                            unMappedUser: {
                                roles: []
                            }
                        }
                    }
                }
            }
        }

        mockEventService = {
            raiseInteractTelemetry: jest.fn()
        }

        component = new CreateMdoComponent(
            mockDialog,
            mockSnackBar,
            mockCreateMdoService,
            mockRouter,
            mockDirectoryService,
            mockValueService,
            mockActivatedRoute,
            mockEventService
        )
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should initialize component and fetch required data', () => {
            const getAllDepartmentsSpy = jest.spyOn(component, 'getAllDepartmentsHeaderAPI')
            const getSubDepartmentSpy = jest.spyOn(component, 'getSubDepartment')

            component.ngOnInit()

            expect(getAllDepartmentsSpy).toHaveBeenCalled()
            expect(getSubDepartmentSpy).toHaveBeenCalled()
            expect(component.tabledata).toBeDefined()
        })
    })

    describe('onSubmit', () => {
        beforeEach(() => {

            component.contentForm = new UntypedFormGroup({})
            jest.spyOn(component.contentForm, 'valid', 'get').mockReturnValue(true)
        })

        it('should create department successfully when form is valid and not updating', () => {
            component.isUpdate = false
            component.department = 'TestDept'
            jest.spyOn(component.contentForm, 'value', 'get').mockReturnValue({
                name: 'Test Department',
                deptSubTypeId: '1'
            })

            component.onSubmit()

            expect(mockCreateMdoService.createDepartment).toHaveBeenCalled()
            expect(mockSnackBar.open).toHaveBeenCalledWith('Success')
            expect(mockRouter.navigate).toHaveBeenCalled()
        })

        it('should update department successfully when form is valid and updating', () => {
            component.isUpdate = true
            component.updateId = 1
            component.department = 'TestDept'
            jest.spyOn(component.contentForm, 'value', 'get').mockReturnValue({
                name: 'Test Department',
                deptSubTypeId: '1'
            })

            component.onSubmit()

            expect(mockCreateMdoService.updateDepartment).toHaveBeenCalled()
            expect(mockSnackBar.open).toHaveBeenCalledWith('Success')
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/directory'])
        })

        it('should show error when form is invalid', () => {
            jest.spyOn(component.contentForm, 'valid', 'get').mockReturnValue(false)

            component.onSubmit()

            expect(mockSnackBar.open).toHaveBeenCalledWith('Form is not valid')
        })
    })

    describe('openPopup', () => {
        it('should open dialog and handle admin assignment', () => {
            const mockDialogResponse = {
                data: [{
                    userId: '123',
                    fullname: 'Test User',
                    email: 'test@test.com'
                }]
            }

            mockDialog.open.mockReturnValue({
                afterClosed: () => of(mockDialogResponse)
            })

            component.departmentId = 'dept123'
            component.departmentRole = 'ADMIN'
            component.department = 'TestDept'

            component.openPopup()

            expect(mockDialog.open).toHaveBeenCalled()
            expect(mockCreateMdoService.assignAdminToDepartment).toHaveBeenCalled()
            expect(mockSnackBar.open).toHaveBeenCalledWith('Admin assigned Successfully')
        })
    })

    describe('specialCharachters', () => {
        it('should validate input for special characters', () => {
            const event = {
                target: { value: 'Test Department' },
                which: 65, // ASCII for 'A'
                preventDefault: jest.fn()
            }

            const result = component.specialCharachters(event, 'cbpProvider')

            expect(result).toBe(true)
        })

        it('should prevent space as first character', () => {
            const event = {
                target: { value: ' Test' },
                which: 32, // ASCII for space
                preventDefault: jest.fn()
            }

            const result = component.specialCharachters(event, 'cbpProvider')

            expect(result).toBe(false)
            expect(event.preventDefault).toHaveBeenCalled()
        })
    })

    describe('ministrySelected', () => {
        it('should fetch departments when valid ministry is selected', () => {
            const value = {
                orgName: 'Test Ministry',
                mapId: '123'
            }

            component.ministrySelected(value)

            expect(mockCreateMdoService.getDeparmentsOfState).toHaveBeenCalledWith('123')
        })
    })

    describe('onCancel', () => {
        it('should navigate to directory with department parameter', () => {
            component.department = 'TestDept'

            component.onCancel()

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/directory', { department: 'TestDept' }])
        })
    })
})