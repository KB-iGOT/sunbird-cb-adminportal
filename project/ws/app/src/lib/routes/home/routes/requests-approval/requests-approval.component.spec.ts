import { RequestsApprovalComponent } from './requests-approval.component'
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms'
import { of } from 'rxjs'
import { preventHtmlAndJs } from '../../validators/prevent-html-and-js.validator'

// Mock dependencies
jest.mock('@angular/router')
jest.mock('../../services/onboarding-requests.service')

describe('RequestsApprovalComponent', () => {
    let component: RequestsApprovalComponent
    let mockSnackBar: any
    let mockRoute: any
    let mockActivatedRoute: any
    let mockRequestService: any
    let mockDialog: any

    beforeEach(() => {
        // Mock route with getCurrentNavigation method
        mockRoute = {
            url: '',
            navigate: jest.fn(),
            getCurrentNavigation: jest.fn().mockReturnValue({
                extras: {
                    state: {
                        row: {
                            serviceName: 'position',
                            firstName: 'John',
                            email: 'john@example.com',
                            mobile: '1234567890',
                            position: 'Developer',
                            description: 'Test description',
                            wfId: '123',
                            userId: 'user123',
                            applicationId: 'app123',
                            actorUUID: 'actor123',
                            deptName: 'IT'
                        }
                    }
                }
            })
        }

        // Mock ActivatedRoute with snapshot
        mockActivatedRoute = {
            snapshot: {
                parent: {
                    data: {
                        configService: {
                            unMappedUser: {
                                firstName: 'John',
                                email: 'john@example.com',
                                phone: '1234567890'
                            }
                        }
                    }
                }
            }
        }

        // Mock RequestService
        mockRequestService = {
            approveNewPosition: jest.fn().mockReturnValue(of({})),
            approveNewOrg: jest.fn().mockReturnValue(of({})),
            approveNewDomain: jest.fn().mockReturnValue(of({})),
            addNewPosition: jest.fn().mockReturnValue(of({}))
        }

        // Mock MatDialog with open method
        mockDialog = {
            open: jest.fn().mockReturnValue({
                afterClosed: jest.fn().mockReturnValue(of(true))
            })
        }

        // Mock MatSnackBar with open method
        mockSnackBar = {
            open: jest.fn()
        }

        // Initialize the component with mocked dependencies
        component = new RequestsApprovalComponent(
            mockSnackBar,
            mockRoute,
            mockActivatedRoute,
            mockRequestService,
            mockDialog
        )
    })

    it('should initialize with position data from navigation state', () => {
        // Set up the route.url to not include 'new'
        mockRoute.url = 'position/approve'

        // Initialize component
        component = new RequestsApprovalComponent(
            mockSnackBar, mockRoute, mockActivatedRoute, mockRequestService, mockDialog
        )

        // Check if data from navigation state is set correctly
        expect(component.requestType).toBe('position')
        expect(component.posData.firstName).toBe('John')
        expect(component.posData.email).toBe('john@example.com')
        expect(component.posData.mobile).toBe('1234567890')

        // Check if form was created with the correct values
        expect(component.positionForm).toBeDefined()
        expect(component.positionForm.get('position')).toBeDefined()
        expect(component.positionForm.get('position')?.value).toBe('Developer')
    })

    it('should initialize with new position data when route includes "new"', () => {
        // Set up the route.url to include 'new'
        mockRoute.url = 'position/new'

        // Initialize component
        component = new RequestsApprovalComponent(
            mockSnackBar, mockRoute, mockActivatedRoute, mockRequestService, mockDialog
        )

        // Check if newPosition flag is set
        expect(component.newPosition).toBe(true)
        expect(component.requestType).toBe('position')

        // Check if data from configService is set correctly
        expect(component.posData.firstName).toBe('John')
        expect(component.posData.email).toBe('john@example.com')
        expect(component.posData.mobile).toBe('1234567890')
    })

    it('should submit position approval request successfully', () => {
        // Setup
        component.requestType = 'position'
        component.posData = {
            firstName: 'John',
            email: 'john@example.com',
            mobile: '1234567890',
            wfId: '123',
            userId: 'user123',
            applicationId: 'app123',
            actorUUID: 'actor123',
            deptName: 'IT'
        }

        component.positionForm = new UntypedFormGroup({
            fullname: new UntypedFormControl({ value: component.posData.firstName, disabled: true }),
            email: new UntypedFormControl({ value: component.posData.email, disabled: true }),
            mobile: new UntypedFormControl({ value: component.posData.mobile, disabled: true }),
            position: new UntypedFormControl('Developer', [Validators.required, Validators.maxLength(500)]),
            organisation: new UntypedFormControl(''),
            domain: new UntypedFormControl(''),
            description: new UntypedFormControl('Test description', [preventHtmlAndJs()]),
            wfId: new UntypedFormControl(component.posData.wfId)
        })

        // Execute
        component.onSubmit()

        // Verify
        expect(mockDialog.open).toHaveBeenCalled()
        expect(mockRequestService.approveNewPosition).toHaveBeenCalledWith(expect.objectContaining({
            action: 'APPROVE',
            serviceName: 'position',
            wfId: '123',
            updateFieldValues: expect.arrayContaining([
                expect.objectContaining({
                    toValue: {
                        position: 'Developer'
                    },
                    description: 'Test description'
                })
            ])
        }))
        expect(mockSnackBar.open).toHaveBeenCalledWith('Success!', 'X', { duration: 5000 })
        expect(mockRoute.navigate).toHaveBeenCalledWith(['/app/home/requests/designation'])
    })

    it('should submit organisation approval request successfully', () => {
        // Setup
        component.requestType = 'organisation'
        component.posData = {
            firstName: 'John',
            email: 'john@example.com',
            mobile: '1234567890',
            wfId: '123',
            userId: 'user123',
            applicationId: 'app123',
            actorUUID: 'actor123',
            deptName: 'IT',
            organisation: 'Test Org'
        }

        component.positionForm = new UntypedFormGroup({
            fullname: new UntypedFormControl({ value: component.posData.firstName, disabled: true }),
            email: new UntypedFormControl({ value: component.posData.email, disabled: true }),
            mobile: new UntypedFormControl({ value: component.posData.mobile, disabled: true }),
            position: new UntypedFormControl(''),
            organisation: new UntypedFormControl('Test Org', [Validators.required]),
            domain: new UntypedFormControl(''),
            description: new UntypedFormControl('Test description', [preventHtmlAndJs()]),
            wfId: new UntypedFormControl(component.posData.wfId)
        })

        // Execute
        component.onSubmit()

        // Verify
        expect(mockDialog.open).toHaveBeenCalled()
        expect(mockRequestService.approveNewOrg).toHaveBeenCalledWith(expect.objectContaining({
            action: 'APPROVE',
            serviceName: 'organisation',
            updateFieldValues: expect.arrayContaining([
                expect.objectContaining({
                    toValue: {
                        organisation: 'Test Org'
                    }
                })
            ])
        }))
        expect(mockRoute.navigate).toHaveBeenCalledWith(['/app/home/requests/organisation'])
    })

    it('should submit domain approval request successfully', () => {
        // Setup
        component.requestType = 'domain'
        component.posData = {
            firstName: 'John',
            email: 'john@example.com',
            mobile: '1234567890',
            wfId: '123',
            userId: 'user123',
            applicationId: 'app123',
            actorUUID: 'actor123',
            deptName: 'IT',
            domain: 'example.com'
        }

        component.positionForm = new UntypedFormGroup({
            fullname: new UntypedFormControl({ value: component.posData.firstName, disabled: true }),
            email: new UntypedFormControl({ value: component.posData.email, disabled: true }),
            mobile: new UntypedFormControl({ value: component.posData.mobile, disabled: true }),
            position: new UntypedFormControl(''),
            organisation: new UntypedFormControl(''),
            domain: new UntypedFormControl('example.com', [Validators.required]),
            description: new UntypedFormControl('Test description', [preventHtmlAndJs()]),
            wfId: new UntypedFormControl(component.posData.wfId)
        })

        // Execute
        component.onSubmit()

        // Verify
        expect(mockDialog.open).toHaveBeenCalled()
        expect(mockRequestService.approveNewDomain).toHaveBeenCalledWith(expect.objectContaining({
            action: 'APPROVE',
            serviceName: 'domain',
            updateFieldValues: expect.arrayContaining([
                expect.objectContaining({
                    toValue: {
                        domain: 'example.com'
                    }
                })
            ])
        }))
        expect(mockRoute.navigate).toHaveBeenCalledWith(['/app/home/requests/domain'])
    })

    it('should reject position request successfully', () => {
        // Setup
        component.requestType = 'position'
        component.posData = {
            firstName: 'John',
            email: 'john@example.com',
            mobile: '1234567890',
            position: 'Developer',
            description: 'Test description',
            wfId: '123',
            userId: 'user123',
            applicationId: 'app123',
            actorUUID: 'actor123',
            deptName: 'IT'
        }

        // Mock dialog response with reason
        mockDialog.open = jest.fn().mockReturnValue({
            afterClosed: jest.fn().mockReturnValue(of({ reason: 'Not needed' }))
        })

        // Execute
        component.rejectRequest()

        // Verify
        expect(mockDialog.open).toHaveBeenCalled()
        expect(mockRequestService.approveNewPosition).toHaveBeenCalledWith(expect.objectContaining({
            action: 'REJECT',
            comment: 'Not needed',
            serviceName: 'position',
            updateFieldValues: expect.arrayContaining([
                expect.objectContaining({
                    toValue: {
                        position: 'Developer'
                    }
                })
            ])
        }))
        expect(mockSnackBar.open).toHaveBeenCalledWith('Success!', 'X', { duration: 5000 })
        expect(mockRoute.navigate).toHaveBeenCalledWith(['/app/home/requests/designation'])
    })

    it('should navigate to the appropriate page when rejection is canceled', () => {
        // Setup
        component.requestType = 'position'

        // Mock dialog response with no reason (cancel)
        mockDialog.open = jest.fn().mockReturnValue({
            afterClosed: jest.fn().mockReturnValue(of(null))
        })

        // Execute
        component.rejectRequest()

        // Verify
        expect(mockDialog.open).toHaveBeenCalled()
        expect(mockRequestService.approveNewPosition).not.toHaveBeenCalled()
        expect(mockRoute.navigate).toHaveBeenCalledWith(['/app/home/requests/designation'])
    })

    it('should add new position successfully', () => {
        // Setup
        component.requestType = 'position'
        component.positionForm = new UntypedFormGroup({
            fullname: new UntypedFormControl({ value: 'John', disabled: true }),
            email: new UntypedFormControl({ value: 'john@example.com', disabled: true }),
            mobile: new UntypedFormControl({ value: '1234567890', disabled: true }),
            position: new UntypedFormControl('Senior Developer'),
            organisation: new UntypedFormControl(''),
            domain: new UntypedFormControl(''),
            description: new UntypedFormControl('New position description'),
            wfId: new UntypedFormControl('')
        })

        // Execute
        component.addNewPosistion()

        // Verify
        expect(mockDialog.open).toHaveBeenCalled()
        expect(mockRequestService.addNewPosition).toHaveBeenCalledWith(expect.objectContaining({
            request: {
                contextType: 'position',
                contextName: 'Senior Developer',
                contextData: 'New position description'
            }
        }))
        expect(mockSnackBar.open).toHaveBeenCalledWith('Success!', 'X', { duration: 5000 })
        expect(mockRoute.navigate).toHaveBeenCalledWith(['/app/home/requests/designation'])
    })

    it('should cancel request and navigate to appropriate page', () => {
        // Setup
        component.requestType = 'position'

        // Execute
        component.cancelRequest()

        // Verify
        expect(mockRoute.navigate).toHaveBeenCalledWith(['/app/home/requests/designation'])
    })

    it('should handle navigateTo for different request types', () => {
        // Test position
        component.requestType = 'position'
        component.navigateTo()
        expect(mockRoute.navigate).toHaveBeenCalledWith(['/app/home/requests/designation'])

        // Test organisation
        component.requestType = 'organisation'
        component.navigateTo()
        expect(mockRoute.navigate).toHaveBeenCalledWith(['/app/home/requests/organisation'])

        // Test domain
        component.requestType = 'domain'
        component.navigateTo()
        expect(mockRoute.navigate).toHaveBeenCalledWith(['/app/home/requests/domain'])
    })

    it('should handle dialog cancel in onSubmit', () => {
        // Setup
        mockDialog.open = jest.fn().mockReturnValue({
            afterClosed: jest.fn().mockReturnValue(of(false))
        })
        component.requestType = 'position'

        // Spy on navigateTo
        jest.spyOn(component, 'navigateTo')

        // Execute
        component.onSubmit()

        // Verify
        expect(mockDialog.open).toHaveBeenCalled()
        expect(mockRequestService.approveNewPosition).not.toHaveBeenCalled()
        expect(component.navigateTo).toHaveBeenCalled()
    })
})