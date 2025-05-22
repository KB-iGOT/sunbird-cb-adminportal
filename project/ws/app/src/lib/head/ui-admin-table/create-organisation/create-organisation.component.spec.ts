import { CreateOrganisationComponent } from './create-organisation.component'
import { FormBuilder, FormControl } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { CreateMDOService } from '../../../routes/home/services/create-mdo.services'
import { LoaderService } from '../../../routes/home/services/loader.service'
import { of, throwError, Subject } from 'rxjs'

describe('CreateOrganisationComponent', () => {
  let component: CreateOrganisationComponent
  let mockFormBuilder: jest.Mocked<FormBuilder>
  let mockSnackBar: jest.Mocked<MatSnackBar>
  let mockCreateMDOService: jest.Mocked<CreateMDOService>
  let mockActivatedRoute: any
  let mockLoaderService: jest.Mocked<LoaderService>

  beforeEach(() => {
    // Mock dependencies
    mockFormBuilder = {
      group: jest.fn()
    } as any

    mockSnackBar = {
      open: jest.fn()
    } as any

    mockCreateMDOService = {
      createOrganization: jest.fn(),
      updateOrganizationV2: jest.fn(),
      uploadOrganizationLogo: jest.fn(),
      searchOrgs: jest.fn(),
      signUpSearch: jest.fn()
    } as any

    mockActivatedRoute = {
      snapshot: {
        parent: {
          data: {
            configService: {
              userProfile: {
                userId: 'test-user-id'
              },
              unMappedUser: {
                rootOrg: null,
                rootOrgId: 'test-root-org-id'
              }
            },
            pageData: {
              data: {
                excludedOrganizationsSborgId: ['excluded-org-1']
              }
            }
          }
        }
      }
    }

    mockLoaderService = {
      changeLoad: new Subject()
    } as any

    // Create component instance
    component = new CreateOrganisationComponent(
      mockFormBuilder,
      mockSnackBar,
      mockCreateMDOService,
      mockActivatedRoute,
      mockLoaderService
    )

    // Mock DOM methods
    Object.defineProperty(document, 'body', {
      value: {
        classList: {
          add: jest.fn(),
          remove: jest.fn()
        }
      },
      writable: true
    })

    // Setup default component properties
    component.orgList = [
      { organisation: 'Test Org 1' },
      { organisation: 'Test Org 2' }
    ]
    component.dropdownList = {
      statesList: [
        { orgName: 'State 1', mapId: 'state-1-id' },
        { orgName: 'State 2', mapId: 'state-2-id' }
      ],
      ministriesList: [
        { orgName: 'Ministry 1', mapId: 'ministry-1-id', sbOrgId: 'ministry-1' },
        { orgName: 'Ministry 2', mapId: 'ministry-2-id', sbOrgId: 'excluded-org-1' }
      ]
    }

    // Mock FormGroup and FormControls
    const mockFormGroup = {
      controls: {
        organisationName: new FormControl(''),
        category: new FormControl(''),
        state: new FormControl(''),
        ministry: new FormControl(''),
        description: new FormControl('')
      },
      get: jest.fn(),
      setValue: jest.fn(),
      updateValueAndValidity: jest.fn()
    } as any

    // Add additional methods to form controls
    Object.keys(mockFormGroup.controls).forEach(key => {
      mockFormGroup.controls[key].setValidators = jest.fn()
      mockFormGroup.controls[key].clearValidators = jest.fn()
      mockFormGroup.controls[key].updateValueAndValidity = jest.fn()
      mockFormGroup.controls[key].setValue = jest.fn()
      mockFormGroup.controls[key].valueChanges = of('')
      mockFormGroup.controls[key].setErrors = jest.fn()
      mockFormGroup.controls[key].errors = null
      // Mock the value property as a getter
      Object.defineProperty(mockFormGroup.controls[key], 'value', {
        get: jest.fn(() => ''),
        configurable: true
      })
    })

    mockFormBuilder.group.mockReturnValue(mockFormGroup)
    component.organisationForm = mockFormGroup
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy()
    })

    it('should initialize with default values', () => {
      expect(component.openMode).toBe('')
      expect(component.orgList).toEqual([])
      expect(component.dropdownList.statesList).toEqual([])
      expect(component.dropdownList.ministriesList).toEqual([])
      expect(component.selectedLogoName).toBe('')
      expect(component.isLoading).toBe(false)
      expect(component.isMatcompleteOpened).toBe(false)
      expect(component.isStateLogin).toBe(false)
      expect(component.disableStateBlock).toBe(false)
    })

    it('should add overflow-hidden class to body on construction', () => {
      expect(document.body.classList.add).toHaveBeenCalledWith('overflow-hidden')
    })
  })

  describe('ngOnInit', () => {
    beforeEach(() => {
      jest.spyOn(component, 'initialization')
      jest.spyOn(component, 'editOrganization')
      jest.spyOn(component, 'checkState')
    })

    it('should set logged in user id from activated route', () => {
      component.ngOnInit()
      expect(component.loggedInUserId).toBe('test-user-id')
    })

    it('should set excluded ministries from activated route', () => {
      component.ngOnInit()
      expect(component.EXCLUDED_MINISRIES).toEqual(['excluded-org-1'])
    })

    it('should call initialization and checkState', () => {
      component.ngOnInit()
      expect(component.initialization).toHaveBeenCalled()
      expect(component.checkState).toHaveBeenCalled()
    })

    it('should call editOrganization when in edit mode', () => {
      component.openMode = 'editMode'
      component.rowData = { id: 'test-id' }
      component.ngOnInit()
      expect(component.editOrganization).toHaveBeenCalledWith(component.rowData)
    })

    it('should create organization name list from orgList', () => {
      component.ngOnInit()
      expect(component.organizationNameList).toEqual(['test org 1', 'test org 2'])
    })
  })

  describe('checkState', () => {
    it('should handle state login correctly', () => {
      mockActivatedRoute.snapshot.parent.data.configService.unMappedUser.rootOrg = {
        isState: true,
        channel: 'State 1'
      }

      jest.spyOn(component, 'getOrganization')

      component.checkState()

      expect(component.isStateLogin).toBe(true)
      expect(component.stateName).toBe('State 1')
      expect(component.disableStateBlock).toBe(true)
      expect(component.getOrganization).toHaveBeenCalledWith('State 1', 'state')
    })

    it('should not set state login when rootOrg is not state', () => {
      mockActivatedRoute.snapshot.parent.data.configService.unMappedUser.rootOrg = {
        isState: false,
        channel: 'Non-State Org'
      }

      component.checkState()

      expect(component.isStateLogin).toBe(false)
      expect(component.disableStateBlock).toBe(false)
    })
  })

  describe('initialization', () => {
    it('should initialize filtered lists correctly', () => {
      component.initialization()

      expect(component.statesList).toEqual(component.dropdownList.statesList)
      expect(component.filteredStates).toEqual(component.dropdownList.statesList)
      expect(component.ministriesList).toHaveLength(1) // Excludes excluded ministry
      expect(component.filteredMinistry).toHaveLength(1)
    })

    it('should filter out excluded ministries', () => {
      component.EXCLUDED_MINISRIES = ['ministry-1']
      component.initialization()

      expect(component.ministriesList).toEqual([
        { orgName: 'Ministry 2', mapId: 'ministry-2-id', sbOrgId: 'excluded-org-1' }
      ])
    })

    it('should create form with correct validators', () => {
      component.initialization()
      expect(mockFormBuilder.group).toHaveBeenCalled()
    })
  })

  describe('Form Validation', () => {
    it('should create duplicate org name validator', () => {
      const validator = component.createDuplicateOrgNameValidator(['existing org'])
      const control = new FormControl('existing org')

      const result = validator(control)
      expect(result).toEqual({ duplicateOrgName: true })
    })

    it('should return null for unique org name', () => {
      const validator = component.createDuplicateOrgNameValidator(['existing org'])
      const control = new FormControl('new org')

      const result = validator(control)
      expect(result).toBeNull()
    })

    it('should return null for empty control value', () => {
      const validator = component.createDuplicateOrgNameValidator(['existing org'])
      const control = new FormControl('')

      const result = validator(control)
      expect(result).toBeNull()
    })
  })

  describe('Filtering Methods', () => {
    beforeEach(() => {
      component.statesList = [
        { orgName: 'State One' },
        { orgName: 'State Two' },
        { orgName: 'Another State' }
      ]
      component.ministriesList = [
        { orgName: 'Ministry One' },
        { orgName: 'Ministry Two' },
        { orgName: 'Another Ministry' }
      ]
    })

    it('should filter states correctly', () => {
      component.filterStates('one')
      expect(component.filteredStates).toEqual([
        { orgName: 'State One' }
      ])
    })

    it('should filter ministries correctly', () => {
      component.filterMinistry('two')
      expect(component.filteredMinistry).toEqual([
        { orgName: 'Ministry Two' }
      ])
    })

    it('should handle case insensitive filtering', () => {
      component.filterStates('STATE')
      expect(component.filteredStates).toHaveLength(3)
    })
  })

  describe('Form Submission', () => {
    beforeEach(() => {
      // Mock form control values using Object.defineProperty
      Object.defineProperty(component.organisationForm.controls.organisationName, 'value', {
        get: () => 'Test Org',
        configurable: true
      })
      Object.defineProperty(component.organisationForm.controls.description, 'value', {
        get: () => 'Test Description',
        configurable: true
      })
      Object.defineProperty(component.organisationForm.controls.category, 'value', {
        get: () => 'state',
        configurable: true
      })
      Object.defineProperty(component.organisationForm.controls.state, 'value', {
        get: () => ({ mapId: 'state-map-id' }),
        configurable: true
      })

      component.loggedInUserId = 'test-user'
      component.uploadedLogoResponse = {
        qrcodepath: 'logo-path',
        name: 'test-logo.png',
        url: 'http://example.com/logo.png'
      }
    })

    it('should create organization payload correctly for state category', () => {
      jest.spyOn(component as any, 'createOrganization')

      component.onSubmitCreateOrganization()

      expect((component as any).createOrganization).toHaveBeenCalledWith(
        expect.objectContaining({
          orgName: 'Test Org',
          channel: 'Test Org',
          organisationType: 'mdo',
          organisationSubType: 'board',
          isTenant: true,
          requestedBy: 'test-user',
          logo: 'logo-path',
          description: 'Test Description',
          parentMapId: 'state-map-id',
          sbRootOrgId: 'test-root-org-id'
        })
      )
    })

    it('should create organization payload correctly for ministry category', () => {
      Object.defineProperty(component.organisationForm.controls.category, 'value', {
        get: () => 'ministry',
        configurable: true
      })
      Object.defineProperty(component.organisationForm.controls.ministry, 'value', {
        get: () => ({ mapId: 'ministry-map-id' }),
        configurable: true
      })
      jest.spyOn(component as any, 'createOrganization')

      component.onSubmitCreateOrganization()

      expect((component as any).createOrganization).toHaveBeenCalledWith(
        expect.objectContaining({
          parentMapId: 'ministry-map-id'
        })
      )
    })

    it('should call updateOrganization when in edit mode', () => {
      component.openMode = 'editMode'
      jest.spyOn(component as any, 'updateOrganization')

      component.onSubmitCreateOrganization()

      expect((component as any).updateOrganization).toHaveBeenCalled()
    })
  })

  describe('Create Organization', () => {
    it('should handle successful organization creation', () => {
      const payload = { orgName: 'Test Org' }
      const response = { result: true }
      mockCreateMDOService.createOrganization.mockReturnValue(of(response))
      jest.spyOn(component.organizationCreated, 'emit')
      jest.spyOn(component, 'closeNaveBar');

      (component as any).createOrganization(payload)

      expect(component.isLoading).toBe(false)
      expect(component.organizationCreated.emit).toHaveBeenCalledWith(payload)
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Organization successfully created.',
        'X',
        { panelClass: ['success'] }
      )
      expect(component.closeNaveBar).toHaveBeenCalled()
    })

    it('should handle organization creation error', () => {
      const payload = { orgName: 'Test Org' }
      mockCreateMDOService.createOrganization.mockReturnValue(throwError('Error'));

      (component as any).createOrganization(payload)

      expect(component.isLoading).toBe(false)
    })
  })

  describe('Update Organization', () => {
    beforeEach(() => {
      component.rowData = { id: 'org-id', logo: 'existing-logo' }
      component.uploadedLogoResponse = {
        qrcodepath: 'new-logo',
        name: 'new-logo.png',
        url: 'http://example.com/new-logo.png'
      }
    })

    it('should handle successful organization update', () => {
      const request = { description: 'Updated description' }
      const response = { result: true }
      mockCreateMDOService.updateOrganizationV2.mockReturnValue(of(response))
      jest.spyOn(component.organizationCreated, 'emit')
      jest.spyOn(component, 'closeNaveBar');

      (component as any).updateOrganization(request)

      expect(mockCreateMDOService.updateOrganizationV2).toHaveBeenCalledWith({
        orgId: 'org-id',
        logo: 'new-logo',
        description: 'Updated description'
      })
      expect(component.isLoading).toBe(false)
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Organization successfully updated.',
        'X',
        { panelClass: ['success'] }
      )
    })

    it('should use existing logo when no new logo uploaded', () => {
      component.uploadedLogoResponse = undefined as any
      const request = { description: 'Updated description' }
      const response = { result: true }
      mockCreateMDOService.updateOrganizationV2.mockReturnValue(of(response));

      (component as any).updateOrganization(request)

      expect(mockCreateMDOService.updateOrganizationV2).toHaveBeenCalledWith(
        expect.objectContaining({
          logo: 'existing-logo'
        })
      )
    })

    it('should handle organization update error', () => {
      const request = { description: 'Updated description' }
      mockCreateMDOService.updateOrganizationV2.mockReturnValue(throwError('Error'));

      (component as any).updateOrganization(request)

      expect(component.isLoading).toBe(false)
    })
  })

  describe('Logo Upload', () => {
    let mockFile: File
    let mockEvent: any

    beforeEach(() => {
      mockFile = new File([''], 'test.png', { type: 'image/png' })
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }) // 1MB

      mockEvent = {
        target: {
          files: [mockFile]
        }
      }
    })

    it('should handle valid file upload', () => {
      jest.spyOn(component, 'uploadOrganizationLogo')

      component.uploadLogo(mockEvent)

      expect(component.selectedLogoFile).toBe(mockFile)
      expect(component.selectedLogoName).toBe('test.png')
      expect(component.uploadOrganizationLogo).toHaveBeenCalled()
    })

    it('should reject invalid file type', () => {
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' })
      mockEvent.target.files = [invalidFile]

      component.uploadLogo(mockEvent)

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Invalid file type',
        'X',
        { panelClass: ['error'] }
      )
    })

    it('should reject file size exceeding limit', () => {
      const largeFile = new File([''], 'large.png', { type: 'image/png' })
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 }) // 6MB
      mockEvent.target.files = [largeFile]

      component.uploadLogo(mockEvent)

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'File size exceeds 5 MB. Please select a smaller file.',
        'X',
        { panelClass: ['error'] }
      )
    })

    it('should handle successful logo upload', () => {
      const response = { result: { qrcodepath: 'uploaded-logo-path', name: 'logo.png', url: 'http://example.com/logo.png' } }
      mockCreateMDOService.uploadOrganizationLogo.mockReturnValue(of(response))
      component.selectedLogoFile = mockFile

      component.uploadOrganizationLogo()

      expect(component.isLoading).toBe(false)
      expect(component.uploadedLogoResponse).toEqual(response.result)
      expect(component.selectedLogo).toBe('uploaded-logo-path')
    })

    it('should handle logo upload error', () => {
      mockCreateMDOService.uploadOrganizationLogo.mockReturnValue(throwError('Error'))
      component.selectedLogoFile = mockFile
      component.selectedLogoName = 'test.png'

      component.uploadOrganizationLogo()

      expect(component.isLoading).toBe(false)
      expect(component.selectedLogoFile).toBeNull()
      expect(component.selectedLogoName).toBe('')
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        "Couldn't upload the logo, Please try again",
        'X',
        { panelClass: ['error'] }
      )
    })
  })

  describe('Utility Methods', () => {
    it('should display function return orgName', () => {
      const option = { orgName: 'Test Org' }
      expect(component.displayFn(option)).toBe('Test Org')
    })

    it('should display function return empty string for null option', () => {
      expect(component.displayFn(null)).toBe('')
    })

    it('should get category from form', () => {
      Object.defineProperty(component.organisationForm.controls.category, 'value', {
        get: () => 'state',
        configurable: true
      })
      expect(component.getCategory).toBe('state')
    })

    it('should close navbar', () => {
      jest.spyOn(component.buttonClick, 'emit')

      component.closeNaveBar()

      expect(component.buttonClick.emit).toHaveBeenCalledWith({
        action: 'close'
      })
    })

    it('should handle autocomplete opened/closed events', () => {
      component.onAutoCompleteOpened()
      expect(component.isMatcompleteOpened).toBe(true)

      component.onAutoCompleteClosed()
      expect(component.isMatcompleteOpened).toBe(false)
    })

    it('should handle keydown event', () => {
      component.isMatcompleteOpened = true
      expect(component.onkeyDown({})).toBe(true)
    })
  })

  describe('Service Calls', () => {
    it('should get organization details', () => {
      const response = {
        result: {
          response: [
            { orgName: 'Test Org', id: 'org-id' }
          ]
        }
      }
      mockCreateMDOService.searchOrgs.mockReturnValue(of(response))

      component.getOrganization('Test Org', 'state')

      expect(mockCreateMDOService.searchOrgs).toHaveBeenCalledWith('Test Org', 'state')
      expect(component.heirarchyObject).toEqual({ orgName: 'Test Org', id: 'org-id' })
    })

    it('should edit organization', () => {
      const org = { id: 'org-id', name: 'Test Org' }

      component.editOrganization(org)

      expect(component.heirarchyObject).toEqual(org)
    })

    it('should handle select state/ministry', () => {
      jest.spyOn(component, 'getOrganization')
      Object.defineProperty(component.organisationForm.controls.category, 'value', {
        get: () => 'state',
        configurable: true
      })

      component.onSelectStateMinistry({ orgName: 'Test State' })

      expect(component.getOrganization).toHaveBeenCalledWith('Test State', 'state')
    })
  })

  describe('ngOnDestroy', () => {
    it('should cleanup on destroy', () => {
      jest.spyOn(component.untilDestroyed$, 'next')
      jest.spyOn(component.untilDestroyed$, 'complete')

      component.ngOnDestroy()

      expect(document.body.classList.remove).toHaveBeenCalledWith('overflow-hidden')
      expect(component.untilDestroyed$.next).toHaveBeenCalled()
      expect(component.untilDestroyed$.complete).toHaveBeenCalled()
    })
  })

  describe('Form Control Getters', () => {
    it('should return form controls', () => {
      expect(component.controls).toBe(component.organisationForm.controls)
    })
  })
})