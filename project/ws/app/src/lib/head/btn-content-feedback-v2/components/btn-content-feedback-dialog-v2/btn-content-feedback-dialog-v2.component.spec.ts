import { BtnContentFeedbackDialogV2Component } from './btn-content-feedback-dialog-v2.component'
import { UntypedFormGroup, Validators } from '@angular/forms'
import { of, throwError } from 'rxjs'
import { EFeedbackType, EFeedbackRole } from '../../models/feedback.model'

describe('BtnContentFeedbackDialogV2Component', () => {
    let component: BtnContentFeedbackDialogV2Component
    let mockDialogRef: any
    let mockFeedbackService: any
    let mockSnackBar: any
    let mockContent: any

    beforeEach(() => {
        mockDialogRef = {
            close: jest.fn()
        }

        mockFeedbackService = {
            getFeedbackConfig: jest.fn(),
            submitContentFeedback: jest.fn()
        }

        mockSnackBar = {
            openFromComponent: jest.fn()
        }

        mockContent = {
            identifier: 'test-content-id'
        }

        component = new BtnContentFeedbackDialogV2Component(
            mockContent,
            mockDialogRef,
            mockFeedbackService,
            mockSnackBar
        )
    })

    describe('initialization', () => {
        it('should initialize with default values', () => {
            expect(component.positiveFeedbackSendStatus).toBe('none')
            expect(component.negativeFeedbackSendStatus).toBe('none')
            expect(component.singleFeedbackSendStatus).toBe('none')
            expect(component.configFetchStatus).toBe('none')
        })

        it('should create form groups with validators', () => {
            expect(component.feedbackForm instanceof UntypedFormGroup).toBeTruthy()
            expect(component.singleFeedbackForm instanceof UntypedFormGroup).toBeTruthy()

            const positiveControl = component.feedbackForm.get('positive')
            expect(positiveControl?.hasValidator(Validators.minLength(1))).toBeTruthy()
            expect(positiveControl?.hasValidator(Validators.maxLength(2000))).toBeTruthy()
        })
    })

    describe('ngOnInit', () => {
        it('should fetch feedback config successfully', () => {
            const mockConfig = { someConfig: 'value' }
            mockFeedbackService.getFeedbackConfig.mockReturnValue(of(mockConfig))

            component.ngOnInit()

            expect(component.configFetchStatus).toBe('done')
            expect(component.feedbackConfig).toEqual(mockConfig)
        })

        it('should handle feedback config fetch error', () => {
            mockFeedbackService.getFeedbackConfig.mockReturnValue(throwError(() => new Error('error')))

            component.ngOnInit()

            expect(component.configFetchStatus).toBe('error')
        })
    })

    describe('submitPositiveFeedback', () => {
        it('should submit positive feedback successfully', () => {
            mockFeedbackService.submitContentFeedback.mockReturnValue(of({}))
            const testText = 'Great content!'

            component.submitPositiveFeedback(testText)

            expect(mockFeedbackService.submitContentFeedback).toHaveBeenCalledWith({
                text: testText,
                contentId: mockContent.identifier,
                sentiment: 'positive',
                type: EFeedbackType.Content,
                role: EFeedbackRole.User,
            })
            expect(component.positiveFeedbackSendStatus).toBe('done')
            expect(mockDialogRef.close).toHaveBeenCalled()
            expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
        })

        it('should handle positive feedback submission error', () => {
            mockFeedbackService.submitContentFeedback.mockReturnValue(throwError(() => new Error('error')))

            component.submitPositiveFeedback('test')

            expect(component.positiveFeedbackSendStatus).toBe('error')
            expect(mockSnackBar.openFromComponent).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    data: { action: 'content_feedback_submit', code: 'failure' }
                })
            )
        })
    })

    describe('submitNegativeFeedback', () => {
        it('should submit negative feedback successfully', () => {
            mockFeedbackService.submitContentFeedback.mockReturnValue(of({}))
            const testText = 'Could be better'

            component.submitNegativeFeedback(testText)

            expect(mockFeedbackService.submitContentFeedback).toHaveBeenCalledWith({
                text: testText,
                contentId: mockContent.identifier,
                sentiment: 'negative',
                type: EFeedbackType.Content,
                role: EFeedbackRole.User,
            })
            expect(component.negativeFeedbackSendStatus).toBe('done')
            expect(mockDialogRef.close).toHaveBeenCalled()
        })

        it('should handle negative feedback submission error', () => {
            mockFeedbackService.submitContentFeedback.mockReturnValue(throwError(() => new Error('error')))

            component.submitNegativeFeedback('test')

            expect(component.negativeFeedbackSendStatus).toBe('error')
        })
    })

    describe('submitSingleFeedback', () => {
        it('should submit single feedback successfully', () => {
            mockFeedbackService.submitContentFeedback.mockReturnValue(of({}))
            component.singleFeedbackForm.patchValue({ feedback: 'Test feedback' })

            component.submitSingleFeedback()

            expect(mockFeedbackService.submitContentFeedback).toHaveBeenCalledWith({
                text: 'Test feedback',
                contentId: mockContent.identifier,
                role: EFeedbackRole.User,
                type: EFeedbackType.Content,
            })
            expect(component.singleFeedbackSendStatus).toBe('done')
            expect(mockDialogRef.close).toHaveBeenCalled()
        })

        it('should handle single feedback submission error', () => {
            mockFeedbackService.submitContentFeedback.mockReturnValue(throwError(() => new Error('error')))
            component.singleFeedbackForm.patchValue({ feedback: 'Test feedback' })

            component.submitSingleFeedback()

            expect(component.singleFeedbackSendStatus).toBe('error')
        })
    })

    describe('submitFeedback', () => {
        it('should submit both positive and negative feedback when both are valid', () => {
            const submitPositiveSpy = jest.spyOn(component, 'submitPositiveFeedback')
            const submitNegativeSpy = jest.spyOn(component, 'submitNegativeFeedback')

            component.feedbackForm.patchValue({
                positive: 'Good points',
                negative: 'Areas for improvement'
            })

            component.submitFeedback()

            expect(submitPositiveSpy).toHaveBeenCalledWith('Good points')
            expect(submitNegativeSpy).toHaveBeenCalledWith('Areas for improvement')
        })

        it('should only submit positive feedback when negative is empty', () => {
            const submitPositiveSpy = jest.spyOn(component, 'submitPositiveFeedback')
            const submitNegativeSpy = jest.spyOn(component, 'submitNegativeFeedback')

            component.feedbackForm.patchValue({
                positive: 'Good points',
                negative: null
            })

            component.submitFeedback()

            expect(submitPositiveSpy).toHaveBeenCalledWith('Good points')
            expect(submitNegativeSpy).not.toHaveBeenCalled()
        })
    })
})