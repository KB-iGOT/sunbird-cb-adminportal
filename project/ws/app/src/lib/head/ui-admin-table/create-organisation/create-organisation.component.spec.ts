import { CreateOrganisationComponent } from './create-organisation.component'
import { FormBuilder } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { CreateMDOService } from '../../../routes/home/services/create-mdo.services'
import { ActivatedRoute } from '@angular/router'
import { LoaderService } from '../../../routes/home/services/loader.service'
import { of, throwError } from 'rxjs'
import * as _ from 'lodash'

describe('CreateOrganisationComponent', () => {
  let component: CreateOrganisationComponent
  let mockFormBuilder: jest.Mocked<FormBuilder>
  let mockSnackBar: jest.Mocked<MatSnackBar>
  let mockCreateMDOService: jest.Mocked<CreateMDOService>
  let mockActivatedRoute: jest.Mocked<ActivatedRoute>
  let mockLoaderService: jest.Mocked<LoaderService>

  beforeEach(() => {
    mockFormBuilder = {
      group: jest.fn(),
      control: jest.fn()
    } as any

    mockSnackBar = {
      open: jest.fn()
    } as any

    mockCreateMDOService = {
      createOrganization: jest.fn(),
      updateOrganization: jest.fn(),
      searchOrgs: jest.fn(),
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

    // Mock lodash get method
    jest.spyOn(_, 'get').mockImplementation((obj, path, defaultValue) => {
      return _.get(obj, path) || defaultValue
    })

    component = new CreateOrganisationComponent(
      mockFormBuilder,
      mockSnackBar,
      mockCreateMDOService,
      mockActivatedRoute,
      mockLoaderService
    )

    // Setup mock form
    const mockForm = {
      controls: {
        organisationName: {
          value: 'Test Org',
          setValue: jest.fn(),
          setValidators: jest.fn(),
          updateValueAndValidity: jest.fn()
        },
        category: {
          value: 'ministry',
          valueChanges: of('ministry'),
          setValue: jest.fn(),
          setValidators: jest.fn(),
          updateValueAndValidity: jest.fn()
        },
        state: {
          setValue: jest.fn(),
          clearValidators: jest.fn(),
          updateValueAndValidity: jest.fn()
        },
        ministry: {
          setValue: jest.fn(),
          clearValidators: jest.fn(),
          updateValueAndValidity: jest.fn()
        },
        description: {
          value: 'Test Description'
        }
      },
      value: {}
    }

    mockFormBuilder.group.mockReturnValue(mockForm as any)
  })

  describe('Initialization', () => {
    it('should initialize component correctly', () => {
      component.dropdownList = {
        statesList: [{ orgName: 'State1' }],
        ministriesList: [{ orgName: 'Ministry1' }]
      }

      component.initialization()

      expect(mockFormBuilder.group).toHaveBeenCalled()
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

      mockCreateMDOService.createOrganization.mockReturnValue(of({ result: true }))

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
})