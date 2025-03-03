import { BtnContentFeedbackV2Component } from './btn-content-feedback-v2.component'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { BtnContentFeedbackDialogV2Component } from '../btn-content-feedback-dialog-v2/btn-content-feedback-dialog-v2.component'
import { IWidgetBtnContentFeedbackV2 } from '../../models/btn-content-feedback-v2.model'

describe('BtnContentFeedbackV2Component', () => {
    let component: BtnContentFeedbackV2Component
    let dialog: MatDialog
    let configSvc: ConfigurationsService
    const mockWidgetData: IWidgetBtnContentFeedbackV2 = {
        identifier: '',
        name: ''
    }

    beforeEach(() => {
        // Mock the dialog and config service
        dialog = { open: jest.fn() } as any
        configSvc = { restrictedFeatures: new Set() } as any

        // Create the component instance with the mocked dependencies
        component = new BtnContentFeedbackV2Component(dialog, configSvc)
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize isFeedbackEnabled based on configSvc.restrictedFeatures', () => {
        // Case 1: restrictedFeatures does not contain 'contentFeedback'
        configSvc.restrictedFeatures = new Set()
        component.ngOnInit()
        expect(component.isFeedbackEnabled).toBe(true)

        // Case 2: restrictedFeatures contains 'contentFeedback'
        configSvc.restrictedFeatures = new Set(['contentFeedback'])
        component.ngOnInit()
        expect(component.isFeedbackEnabled).toBe(false)
    })

    it('should open feedback dialog when openFeedbackDialog is called and forPreview is false', () => {
        // Mock the widgetData
        component.widgetData = mockWidgetData
        component.forPreview = false

        // Call the method
        component.openFeedbackDialog()

        // Check if dialog.open was called
        expect(dialog.open).toHaveBeenCalledWith(
            BtnContentFeedbackDialogV2Component,
            {
                data: mockWidgetData,
                minWidth: '320px',
                width: '500px',
            }
        )
    })

    it('should not open feedback dialog when openFeedbackDialog is called and forPreview is true', () => {
        component.widgetData = mockWidgetData
        component.forPreview = true

        // Call the method
        component.openFeedbackDialog()

        // Check if dialog.open was not called
        expect(dialog.open).not.toHaveBeenCalled()
    })
})
