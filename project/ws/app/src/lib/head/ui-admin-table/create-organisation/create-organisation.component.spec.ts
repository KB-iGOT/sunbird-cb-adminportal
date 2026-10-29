import { CreateOrganisationComponent } from './create-organisation.component'
import { FormBuilder } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { CreateMDOService } from '../../../routes/home/services/create-mdo.services'
import { ActivatedRoute } from '@angular/router'
import { LoaderService } from '../../../routes/home/services/loader.service'
import { of, throwError } from 'rxjs'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { TestBed } from '@angular/core/testing'

describe('CreateOrganisationComponent', () => {
  let component: CreateOrganisationComponent
  let formBuilder: FormBuilder
  let mockSnackBar: jest.Mocked<MatSnackBar>
  let mockCreateMDOService: jest.Mocked<CreateMDOService>
  let mockActivatedRoute: jest.Mocked<ActivatedRoute>
  let mockLoaderService: jest.Mocked<LoaderService>

  beforeEach(() => {
    formBuilder = new FormBuilder()

    mockSnackBar = {
      open: jest.fn()
    } as any

    mockCreateMDOService = {
      createOrganization: jest.fn(),
      updateOrganization: jest.fn(),
      searchOrgs: jest.fn(),
      getStatesOrMinisteries: jest.fn().mockReturnValue(of({ result: { response: { content: [] } } })),
      uploadOrganizationLogo: jest.fn()
    } as any

    mockActivatedRoute = {
      snapshot: {
        parent: {
          data: {
            configService: {
              userProfile: { userId: 'test-user-id' },
              unMappedUser: { rootOrg: { isState: false, channel: '' } }
            },
            pageData: { data: { excludedOrganizationsSborgId: [] } }
          }
        }
      }
    } as any

    mockLoaderService = {
      changeLoad: {
        next: jest.fn()
      }
    } as any

    component = new CreateOrganisationComponent(
      formBuilder,
      mockSnackBar,
      mockCreateMDOService,
      mockActivatedRoute,
      mockLoaderService
    )

  })

  afterEach(() => {
    component.ngOnDestroy()
  })

  describe('Initialization', () => {
    it('should initialize component correctly', () => {
      component.dropdownList = {
        statesList: [{ orgName: 'State1' }],
        ministriesList: [{ orgName: 'Ministry1' }]
      }

      const groupSpy = jest.spyOn(formBuilder, 'group')
      component.initialization()

      expect(groupSpy).toHaveBeenCalled()
      expect(mockCreateMDOService.getStatesOrMinisteries).toHaveBeenCalledWith('globalngo')
      expect(component.filteredStates).toHaveLength(1)
      expect(component.filteredMinistry).toHaveLength(1)
    })
  })

  describe('Form Validation', () => {
    it('should create duplicate org name validator', () => {
      const organizationNameList = ['existing org']
      const validator = component.createDuplicateOrgNameValidator(organizationNameList)

      const controlMock = { value: 'Existing Org' }
      const result = validator(controlMock as any)

      expect(result).toEqual({ duplicateOrgName: true })
    })
  })

  describe('Organization Creation', () => {
    beforeEach(() => {
      component.ngOnInit()
      component.organisationForm.patchValue({
        organisationName: 'Test Org',
        category: 'ministry',
        description: 'Test Description',
      })
    })

    it('should create organization successfully', () => {
      const mockPayload = {
        orgName: 'Test Org',
        channel: 'Test Org',
        organisationType: 'mdo',
        organisationSubType: 'board',
        isTenant: true,
        requestedBy: 'test-user-id',
        logo: '',
        description: 'Test Description',
        parentMapId: ''
      }

      mockCreateMDOService.createOrganization.mockReturnValue(of({ result: { id: 'org-1' } }))

      const emitSpy = jest.spyOn(component.organizationCreated, 'emit')
      const closeSpy = jest.spyOn(component, 'closeNaveBar')

      component.onSubmitCreateOrganization()

      expect(mockCreateMDOService.createOrganization).toHaveBeenCalledWith(expect.objectContaining(mockPayload))
      expect(emitSpy).toHaveBeenCalled()
      expect(closeSpy).toHaveBeenCalled()
    })

    it('should handle organization creation error', () => {
      mockCreateMDOService.createOrganization.mockReturnValue(throwError(() => new Error('Creation Failed')))

      component.onSubmitCreateOrganization()

      expect(mockLoaderService.changeLoad.next).toHaveBeenCalledWith(false)
    })
  })

  describe('Logo Upload', () => {
    it('should upload logo successfully', () => {
      const mockFile = new File([''], 'test.png', { type: 'image/png' })
      const mockEvent = {
        target: {
          files: [mockFile]
        }
      } as any

      const formData = new FormData()
      formData.append('file', mockFile)

      mockCreateMDOService.uploadOrganizationLogo.mockReturnValue(of({
        result: {
          qrcodepath: 'test-logo-path'
        }
      }))

      component.uploadLogo(mockEvent)

      expect(mockCreateMDOService.uploadOrganizationLogo).toHaveBeenCalled()
      expect(component.selectedLogo).toBe('test-logo-path')
    })

    it('should handle invalid file type', () => {
      const mockFile = new File([''], 'test.gif', { type: 'image/gif' })
      const mockEvent = {
        target: {
          files: [mockFile]
        }
      } as any

      component.uploadLogo(mockEvent)

      expect(mockSnackBar.open).toHaveBeenCalledWith('Invalid file type', 'X', { panelClass: ['error'] })
    })
  })

  describe('State and Ministry Filtering', () => {
    it('should filter states correctly', () => {
      component.statesList = [
        { orgName: 'California' },
        { orgName: 'New York' }
      ]

      component.filterStates('cali')

      expect(component.filteredStates).toHaveLength(1)
      expect(component.filteredStates[0].orgName).toBe('California')
    })

    it('should filter ministries correctly', () => {
      component.ministriesList = [
        { orgName: 'Defense' },
        { orgName: 'Education' }
      ]

      component.filterMinistry('def')

      expect(component.filteredMinistry).toHaveLength(1)
      expect(component.filteredMinistry[0].orgName).toBe('Defense')
    })
  })

  describe('Template accessibility', () => {
    let editLogo: HTMLElement
    let fileInput: HTMLInputElement

    beforeEach(() => {
      TestBed.configureTestingModule({
        declarations: [CreateOrganisationComponent],
        providers: [
          { provide: FormBuilder, useValue: formBuilder },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: CreateMDOService, useValue: mockCreateMDOService },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          { provide: LoaderService, useValue: mockLoaderService },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      })
      const fixture = TestBed.createComponent(CreateOrganisationComponent)
      fixture.componentInstance.openMode = 'viewMode'
      fixture.componentInstance.rowData = { organisation: 'Test Org', type: 'Ministry' }
      fixture.detectChanges()
      editLogo = fixture.nativeElement.querySelector('.edit-logo')
      fileInput = fixture.nativeElement.querySelector('#edit-orgLogo')
    })

    it('should expose the edit logo control as a focusable button', () => {
      expect(editLogo).toBeTruthy()
      expect(editLogo.getAttribute('role')).toBe('button')
      expect(editLogo.getAttribute('tabindex')).toBe('0')
    })

    it('should trigger the edit logo click and open the file picker on Enter', () => {
      const clickSpy = jest.spyOn(editLogo, 'click')
      const fileClickSpy = jest.spyOn(fileInput, 'click').mockImplementation(() => { })
      const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })

      editLogo.dispatchEvent(event)

      expect(clickSpy).toHaveBeenCalled()
      expect(fileClickSpy).toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(true)
    })

    it('should trigger the edit logo click on Space', () => {
      const clickSpy = jest.spyOn(editLogo, 'click')
      jest.spyOn(fileInput, 'click').mockImplementation(() => { })

      editLogo.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true }))

      expect(clickSpy).toHaveBeenCalled()
    })

    it('should not trigger the edit logo click on other keys', () => {
      const clickSpy = jest.spyOn(editLogo, 'click')

      editLogo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }))

      expect(clickSpy).not.toHaveBeenCalled()
    })
  })
})