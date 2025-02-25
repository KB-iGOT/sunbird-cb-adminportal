import { RequestsApprovalComponent } from './requests-approval.component'
import { Router, ActivatedRoute } from '@angular/router'
import { RequestsService } from '../../services/onboarding-requests.service'
import { of } from 'rxjs'
import { RejectReasonDialogComponent } from '../reject-reason-dialog/reject-reason-dialog.component'
import { DialogConfirmComponent } from '../../../../../../../../../src/app/component/dialog-confirm/dialog-confirm.component'
import * as _ from 'lodash'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'

describe('RequestsApprovalComponent', () => {
    let component: RequestsApprovalComponent
    let snackBar: jest.Mocked<MatSnackBar>
    let router: jest.Mocked<Router>
    let activatedRoute: jest.Mocked<ActivatedRoute>
    let requestService: jest.Mocked<RequestsService>
    let dialogue: jest.Mocked<MatDialog>

    beforeEach(() => {
        snackBar = {
            open: jest.fn(),
        } as any
        router = {
            navigate: jest.fn(),
            url: '/app/home/requests/position',
        } as any
        activatedRoute = {
            snapshot: {
                parent: {
                    data: {
                        configService: {
                            unMappedUser: {
                                firstName: 'John',
                                email: 'john.doe@example.com',
                                phone: '1234567890',
                            },
                        },
                    },
                },
            },
        } as any
        requestService = {
            approveNewPosition: jest.fn(() => of({})),
            approveNewOrg: jest.fn(() => of({})),
            approveNewDomain: jest.fn(() => of({})),
            addNewPosition: jest.fn(() => of({})),
        } as any
        dialogue = {
            open: jest.fn(() => ({
                afterClosed: jest.fn(() => of(true)),
            })),
        } as any

        component = new RequestsApprovalComponent(
            snackBar,
            router,
            activatedRoute,
            requestService,
            dialogue
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should call openSnackbar when onSubmit is successful', () => {
        component.posData = {
            firstName: 'John',
            email: 'john.doe@example.com',
            mobile: '1234567890',
            wfId: '1',
            applicationId: 'app123',
            userId: 'user123',
            actorUUID: 'actor123',
            deptName: 'HR',
        }
        component.requestType = 'position'
        component.positionForm.setValue({
            fullname: 'John Doe',
            email: 'john.doe@example.com',
            mobile: '1234567890',
            position: 'Manager',
            organisation: 'ABC Corp',
            domain: 'abc.com',
            description: 'Description',
            wfId: '1',
        })

        component.onSubmit()
        expect(dialogue.open).toHaveBeenCalledWith(DialogConfirmComponent, expect.any(Object))
        expect(requestService.approveNewPosition).toHaveBeenCalledWith(expect.objectContaining({
            state: 'IN_PROGRESS',
            action: 'APPROVE',
            serviceName: 'position',
        }))
        expect(snackBar.open).toHaveBeenCalledWith('Success!', 'X', { duration: 5000 })
        expect(router.navigate).toHaveBeenCalledWith(['/app/home/requests/designation'])
    })

    it('should navigate when rejectRequest is called', () => {
        component.rejectRequest()
        expect(dialogue.open).toHaveBeenCalledWith(RejectReasonDialogComponent, expect.any(Object))
        expect(requestService.approveNewPosition).toHaveBeenCalled()
        expect(router.navigate).toHaveBeenCalledWith(['/app/home/requests/designation'])
    })

    it('should call openSnackbar when addNewPosistion is successful', () => {
        component.posData = {
            firstName: 'John',
            email: 'john.doe@example.com',
            mobile: '1234567890',
            wfId: '1',
            applicationId: 'app123',
            userId: 'user123',
            actorUUID: 'actor123',
            deptName: 'HR',
        }
        component.positionForm.setValue({
            fullname: 'John Doe',
            email: 'john.doe@example.com',
            mobile: '1234567890',
            position: 'Manager',
            organisation: 'ABC Corp',
            domain: 'abc.com',
            description: 'Description',
            wfId: '1',
        })

        component.addNewPosistion()
        expect(dialogue.open).toHaveBeenCalledWith(DialogConfirmComponent, expect.any(Object))
        expect(requestService.addNewPosition).toHaveBeenCalledWith(expect.objectContaining({
            request: {
                contextType: 'position',
                contextName: 'Manager',
                contextData: 'Description',
            },
        }))
        expect(snackBar.open).toHaveBeenCalledWith('Success!', 'X', { duration: 5000 })
        expect(router.navigate).toHaveBeenCalledWith(['/app/home/requests/designation'])
    })
})
