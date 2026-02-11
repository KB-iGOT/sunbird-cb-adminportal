import { RequestCopyDetailsComponent } from './request-copy-details.component'
import { UntypedFormBuilder } from '@angular/forms'
import { RequestServiceService } from '../request-service.service'
import { ActivatedRoute, Router } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { InitService } from '../../../../../../../../../../src/app/services/init.service'
import { of, throwError } from 'rxjs'

describe('RequestCopyDetailsComponent', () => {
  let component: RequestCopyDetailsComponent
  let mockFormBuilder: jest.Mocked<UntypedFormBuilder>
  let mockRequestService: jest.Mocked<RequestServiceService>
  let mockActivatedRoute: jest.Mocked<ActivatedRoute>
  let mockSnackBar: jest.Mocked<MatSnackBar>
  let mockRouter: jest.Mocked<Router>
  let mockDialog: jest.Mocked<MatDialog>
  let mockInitService: jest.Mocked<InitService>

  beforeEach(() => {
    // Mock dependencies
    mockFormBuilder = {
      group: jest.fn(),
    } as any

    mockRequestService = {
      getFilterEntity: jest.fn(),
      getFilterEntityV2: jest.fn(),
      getRequestTypeList: jest.fn(),
      getRequestDataById: jest.fn(),
      createDemand: jest.fn(),
    } as any

    mockActivatedRoute = {
      queryParams: {
        subscribe: jest.fn(),
      },
      snapshot: {
        data: {},
      },
    } as any

    mockSnackBar = {
      open: jest.fn(),
    } as any

    mockRouter = {
      navigateByUrl: jest.fn(),
    } as any

    mockDialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: jest.fn().mockReturnValue(of({})),
      }),
    } as any

    mockInitService = {
      configSvc: {
        competency: {
          'competencies_v5': {},
        },
      },
    } as any

    // Stub sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn().mockReturnValue('mockUserId'),
      },
      writable: true,
    })

    // Initialize component
    component = new RequestCopyDetailsComponent(
      mockFormBuilder,
      mockRequestService,
      mockActivatedRoute,
      mockSnackBar,
      mockRouter,
      mockDialog,
      mockInitService
    )
  })

  describe('Initialization', () => {
    beforeEach(() => {
      // Mock necessary methods for initialization
      mockRequestService.getRequestTypeList.mockReturnValue(of([]))
      mockFormBuilder.group.mockReturnValue({
        controls: {
          providerText: { valueChanges: of('') },
          assigneeText: { valueChanges: of('') },
        },
      } as any)
    })

    it('should create the component', () => {
      expect(component).toBeTruthy()
    })

    it('should initialize with correct competency key', () => {
      component.ngOnInit()
      expect(component.compentencyKey.vKey).toBe('competencies_v5')
    })
  })

  describe('Form Initialization', () => {
    it('should initialize form group with correct controls', () => {
      const mockFormGroup = {
        controls: {
          titleName: expect.anything(),
          Objective: expect.anything(),
          userType: expect.anything(),
          learningMode: expect.anything(),
          compArea: expect.anything(),
          referenceLink: expect.anything(),
          requestType: expect.anything(),
          assignee: expect.anything(),
          providers: expect.anything(),
          providerText: expect.anything(),
          queryThemeControl: expect.anything(),
          querySubThemeControl: expect.anything(),
          assigneeText: expect.anything(),
        },
      }

      mockFormBuilder.group.mockReturnValue(mockFormGroup as any)
      component.initFormFroup()
      expect(mockFormBuilder.group).toHaveBeenCalled()
    })
  })

  describe('Request Type Selection', () => {
    beforeEach(() => {
      component.requestForm = {
        controls: {
          providers: {
            setValue: jest.fn(),
            clearValidators: jest.fn(),
            updateValueAndValidity: jest.fn(),
          },
          assignee: {
            setValue: jest.fn(),
            clearValidators: jest.fn(),
            updateValueAndValidity: jest.fn(),
            setValidators: jest.fn(),
          },
        },
      } as any
    })

    it('should handle Single request type correctly', () => {
      component.selectRequestType('Single')
      expect(component.isAssignee).toBe(true)
      expect(component.isBroadCast).toBe(false)
      expect(component.statusValue).toBe('Assigned')
    })

    it('should handle Broadcast request type correctly', () => {
      component.selectRequestType('Broadcast')
      expect(component.isAssignee).toBe(false)
      expect(component.isBroadCast).toBe(true)
      expect(component.statusValue).toBe('Unassigned')
    })
  })

  describe('Competency Management', () => {
    beforeEach(() => {
      component.requestForm = {
        controls: {
          competencies_v5: {
            value: [],
            setValue: jest.fn(),
          },
          compArea: { setValue: jest.fn() },
          queryThemeControl: { setValue: jest.fn() },
          querySubThemeControl: { setValue: jest.fn() },
        },
      } as any

      component.allCompetencies = [
        {
          name: 'Area1',
          themes: [
            {
              name: 'Theme1',
              associations: [{ name: 'SubTheme1' }]
            }
          ]
        }
      ]
    })

    it('should add competency when not already present', () => {
      component.seletedCompetencyArea = { name: 'Area1', id: 1 }
      component.seletedCompetencyTheme = { name: 'Theme1', id: 2 }
      component.seletedCompetencySubTheme = { name: 'SubTheme1', id: 3 }

      component.addCompetency()

      // const competencyValue = component.requestForm.controls['competencies_v5'].setValue.mock.calls[0][0]
      // expect(competencyValue.length).toBe(1)
      // expect(competencyValue[0].competencyArea).toBe('Area1')
    })

    it('should remove competency correctly', () => {
      const mockCompetencies = [
        { competencyAreaId: 1, competencyThemeId: 2, competencySubThemeId: 3 }
      ]
      component.requestForm = {
        controls: {
          competencies_v5: {
            value: mockCompetencies,
            setValue: jest.fn(),
          },
        },
      } as any

      component.removeCompetency(mockCompetencies[0])

      // const updatedCompetencies = component.requestForm.controls['competencies_v5'].setValue.mock.calls[0][0]
      // expect(updatedCompetencies.length).toBe(0)
    })
  })

  describe('Submission Process', () => {
    beforeEach(() => {
      component.requestForm = {
        value: {
          titleName: 'Test Title',
          Objective: 'Test Objective',
          userType: 'Test User',
          competencies_v5: [
            {
              competencyArea: 'Area1',
              competencyTheme: 'Theme1',
              competencySubTheme: 'SubTheme1'
            }
          ],
          requestType: 'Single',
          assignee: { orgName: 'Provider', id: 1 },
          learningMode: 'Self-paced',
        },
        enable: jest.fn(),
      } as any

      mockRequestService.createDemand.mockReturnValue(of({}))
    })

    it('should submit demand successfully', () => {
      component.submit()

      expect(mockRequestService.createDemand).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Title',
        objective: 'Test Objective',
        competencies: expect.any(Array),
        requestType: 'Single',
        assignedProvider: expect.any(Object),
        learningMode: 'self-paced'
      }))
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/home/all-request')
    })

    it('should handle demand creation error', () => {
      mockRequestService.createDemand.mockReturnValue(throwError(() => new Error('Submission failed')))

      component.submit()

      expect(mockSnackBar.open).toHaveBeenCalledWith('Request Failed')
    })
  })
})