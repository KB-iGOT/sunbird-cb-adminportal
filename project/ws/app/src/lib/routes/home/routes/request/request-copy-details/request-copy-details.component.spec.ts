import { RequestCopyDetailsComponent } from './request-copy-details.component'
import { UntypedFormControl } from '@angular/forms'
import { of, throwError } from 'rxjs'

// Mock dependencies
const mockFormBuilder = {
  group: jest.fn()
}

const mockRequestService = {
  getRequestDataById: jest.fn(),
  getFilterEntity: jest.fn(),
  getFilterEntityV2: jest.fn(),
  getRequestTypeList: jest.fn(),
  createDemand: jest.fn()
}

const mockActivatedRoute = {
  queryParams: of({ id: 'test-id', name: 'view' }),
  snapshot: {
    data: {
      configSvc: {
        userProfile: { userId: 'test-user' }
      }
    }
  }
}

const mockSnackBar = {
  open: jest.fn()
}

const mockRouter = {
  navigateByUrl: jest.fn()
}

const mockDialog = {
  open: jest.fn(() => ({
    afterClosed: () => of('confirmed')
  }))
}

const mockInitService = {
  configSvc: {
    competency: {
      competencies_v5: {
        vKey: 'competencies_v5'
      }
    }
  }
}

const mockFormControl = {
  setValue: jest.fn(),
  setValidators: jest.fn(),
  clearValidators: jest.fn(),
  updateValueAndValidity: jest.fn(),
  patchValue: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
  valueChanges: of('test-value'),
  value: []
}

const mockFormGroup = {
  setValue: jest.fn(),
  controls: {
    titleName: mockFormControl,
    Objective: mockFormControl,
    userType: mockFormControl,
    learningMode: mockFormControl,
    compArea: mockFormControl,
    referenceLink: mockFormControl,
    requestType: mockFormControl,
    assignee: mockFormControl,
    providers: mockFormControl,
    providerText: mockFormControl,
    queryThemeControl: mockFormControl,
    querySubThemeControl: mockFormControl,
    competencies_v5: mockFormControl,
    assigneeText: mockFormControl
  },
  get: jest.fn(),
  value: {
    titleName: 'Test Title',
    Objective: 'Test Objective',
    userType: 'Test User',
    learningMode: 'self-paced',
    referenceLink: 'http://test.com',
    requestType: 'Single',
    providers: [],
    assignee: { orgName: 'Test Org', id: '123' },
    competencies_v5: []
  },
  disable: jest.fn(),
  enable: jest.fn()
}

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(() => 'test-user-details')
  }
})

describe('RequestCopyDetailsComponent', () => {
  let component: RequestCopyDetailsComponent

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Setup FormBuilder mock
    mockFormBuilder.group.mockReturnValue(mockFormGroup)

    // Create component instance
    component = new RequestCopyDetailsComponent(
      mockFormBuilder as any,
      mockRequestService as any,
      mockActivatedRoute as any,
      mockSnackBar as any,
      mockRouter as any,
      mockDialog as any,
      mockInitService as any
    )

    // Set up initial state
    component.requestForm = mockFormGroup as any
    component.compentencyKey = { vKey: 'competencies_v5', vCompetencyArea: '', vCompetencyAreaDescription: '', vCompetencyTheme: '', vCompetencySubTheme: '' }
  })

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy()
    })

    it('should initialize with correct default values', () => {
      expect(component.specialCharList).toBe(`( a-z/A-Z , 0-9 . _ - $ /  : [ ]' ' !)`)
      expect(component.learningList).toHaveLength(2)
      expect(component.requestTypeList).toEqual(['Single', 'Broadcast'])
      expect(component.competencyList).toEqual([])
      expect(component.isAssignee).toBe(false)
      expect(component.isBroadCast).toBe(false)
    })

    it('should get current user from sessionStorage', () => {
      expect(component.currentUser).toBe('test-user-details')
    })
  })

  describe('ngOnInit', () => {
    beforeEach(() => {
      mockRequestService.getRequestTypeList.mockReturnValue(of([]))
      mockRequestService.getFilterEntityV2.mockReturnValue(of([[], []]))
      component.valuechangeFuctions = jest.fn()
      component.getRequestTypeList = jest.fn()
      component.initFormFroup = jest.fn()
      component.getFilterEntity = jest.fn()
      component.getFilterEntityV2 = jest.fn()
    })

    it('should initialize form and get data on ngOnInit', () => {
      component.ngOnInit()

      expect(component.getRequestTypeList).toHaveBeenCalled()
      expect(component.initFormFroup).toHaveBeenCalled()
      expect(component.valuechangeFuctions).toHaveBeenCalled()
    })

    it('should call getFilterEntityV2 when competency version is not v5', () => {
      component.compentencyKey = { vKey: 'competencies_v6', vCompetencyArea: '', vCompetencyAreaDescription: '', vCompetencyTheme: '', vCompetencySubTheme: '' }

      component.ngOnInit()

      expect(component.getFilterEntityV2).toHaveBeenCalled()
    })

    it('should call getFilterEntity when competency version is v5', () => {
      component.compentencyKey = { vKey: 'competencies_v5', vCompetencyArea: '', vCompetencyAreaDescription: '', vCompetencyTheme: '', vCompetencySubTheme: '' }

      component.ngOnInit()

      expect(component.getFilterEntity).toHaveBeenCalled()
    })
  })

  describe('Form Initialization', () => {
    it('should initialize form group with all required controls', () => {
      component.initFormFroup()

      expect(mockFormBuilder.group).toHaveBeenCalledWith(
        expect.objectContaining({
          titleName: expect.any(UntypedFormControl),
          Objective: expect.any(UntypedFormControl),
          userType: expect.any(UntypedFormControl),
          learningMode: expect.any(UntypedFormControl),
          compArea: expect.any(UntypedFormControl),
          referenceLink: expect.any(UntypedFormControl),
          requestType: expect.any(UntypedFormControl),
          assignee: expect.any(UntypedFormControl),
          providers: expect.any(UntypedFormControl),
          providerText: expect.any(UntypedFormControl),
          queryThemeControl: expect.any(UntypedFormControl),
          querySubThemeControl: expect.any(UntypedFormControl),
          assigneeText: expect.any(UntypedFormControl)
        })
      )
    })
  })

  describe('Request Type Selection', () => {
    it('should handle Single request type selection', () => {
      component.selectRequestType('Single')

      expect(component.isAssignee).toBe(true)
      expect(component.isBroadCast).toBe(false)
      expect(component.statusValue).toBe('Assigned')
      expect(mockFormControl.setValue).toHaveBeenCalledWith('')
      expect(mockFormControl.setValidators).toHaveBeenCalled()
    })

    it('should handle Broadcast request type selection', () => {
      component.selectRequestType('Broadcast')

      expect(component.statusValue).toBe('Unassigned')
      expect(component.isBroadCast).toBe(true)
      expect(component.isAssignee).toBe(false)
      expect(mockFormControl.setValue).toHaveBeenCalledWith('')
      expect(mockFormControl.setValidators).toHaveBeenCalled()
    })
  })

  describe('Competency Management', () => {
    beforeEach(() => {
      component.allCompetencies = [
        {
          name: 'Test Area',
          id: '1',
          themes: [
            {
              name: 'Test Theme',
              id: '2',
              associations: [
                { name: 'Test Sub Theme', id: '3' }
              ]
            }
          ]
        }
      ]
    })

    it('should select competency area correctly', () => {
      const option = { name: 'Test Area' }
      component.resetCompSubfields = jest.fn()

      component.compAreaSelected(option)

      expect(component.resetCompSubfields).toHaveBeenCalled()
      expect(component.seletedCompetencyArea).toEqual(component.allCompetencies[0])
      expect(component.allCompetencyTheme).toEqual(component.allCompetencies[0].themes)
    })

    it('should select competency theme correctly', () => {
      component.allCompetencyTheme = [
        { name: 'Test Theme', id: '2', associations: [{ name: 'Test Sub Theme', id: '3' }] }
      ]
      const option = { name: 'Test Theme' }

      component.compThemeSelected(option)

      expect(component.seletedCompetencyTheme).toEqual(component.allCompetencyTheme[0])
      expect(component.allCompetencySubtheme).toEqual(component.allCompetencyTheme[0].associations)
    })

    it('should select competency sub-theme correctly', () => {
      component.allCompetencySubtheme = [
        { name: 'Test Sub Theme', id: '3' }
      ]
      const option = { name: 'Test Sub Theme' }

      component.compSubThemeSelected(option)

      expect(component.enableCompetencyAdd).toBe(true)
      expect(component.seletedCompetencySubTheme).toEqual(component.allCompetencySubtheme[0])
    })

    it('should add competency when all selections are valid', () => {
      component.seletedCompetencyArea = { name: 'Area', id: '1', description: 'Area desc' }
      component.seletedCompetencyTheme = {
        name: 'Theme',
        id: '2',
        description: 'Theme desc',
        additionalProperties: { themeType: 'primary' }
      }
      component.seletedCompetencySubTheme = { name: 'SubTheme', id: '3', description: 'Sub desc' }
      component.canPush = jest.fn().mockReturnValue(true)
      component.resetCompfields = jest.fn()
      component.refreshData = jest.fn()

      component.addCompetency()

      expect(mockFormControl.setValue).toHaveBeenCalled()
      expect(component.resetCompfields).toHaveBeenCalled()
      expect(component.refreshData).toHaveBeenCalled()
    })

    it('should not add duplicate competency', () => {
      component.seletedCompetencyArea = { name: 'Area', id: '1' }
      component.seletedCompetencyTheme = { name: 'Theme', id: '2' }
      component.seletedCompetencySubTheme = { name: 'SubTheme', id: '3' }
      component.canPush = jest.fn().mockReturnValue(false)
      component.resetCompfields = jest.fn()

      component.addCompetency()

      expect(mockSnackBar.open).toHaveBeenCalledWith('This competency is already added')
      expect(component.resetCompfields).toHaveBeenCalled()
    })

    it('should remove competency correctly', () => {
      const mockCompetency = {
        competencyAreaId: '1',
        competencyThemeId: '2',
        competencySubThemeId: '3'
      }
      // Create a new mock with proper typing for this test
      const competencyFormControl = {
        ...mockFormControl,
        value: [mockCompetency] as any[]
      }
      component.requestForm.controls[component.compentencyKey.vKey] = competencyFormControl as any
      component.refreshData = jest.fn()

      component.removeCompetency(mockCompetency)

      expect(component.refreshData).toHaveBeenCalled()
    })

    it('should check if competency can be pushed', () => {
      const arr = [
        { competencyAreaId: '1', competencyThemeId: '2', competencySubThemeId: '3' }
      ]
      const obj1 = { competencyAreaId: '1', competencyThemeId: '2', competencySubThemeId: '3' }
      const obj2 = { competencyAreaId: '2', competencyThemeId: '3', competencySubThemeId: '4' }

      expect(component.canPush(arr, obj1)).toBe(false)
      expect(component.canPush(arr, obj2)).toBe(true)
    })
  })

  describe('Data Fetching', () => {
    it('should get filter entity successfully', () => {
      const mockResponse = [{ name: 'Test Competency' }]
      mockRequestService.getFilterEntity.mockReturnValue(of(mockResponse))

      component.getFilterEntity()

      expect(mockRequestService.getFilterEntity).toHaveBeenCalledWith({
        search: { type: 'Competency Area' },
        filter: { isDetail: true }
      })
      expect(component.competencyList).toEqual(mockResponse)
      expect(component.allCompetencies).toEqual(mockResponse)
    })

    it('should get filter entity V2 successfully', () => {
      const mockResponse = [
        { terms: [{ identifier: '1', associations: [] }] },
        { terms: [{ identifier: '2', associations: [{ identifier: '1' }] }] }
      ]
      mockRequestService.getFilterEntityV2.mockReturnValue(of(mockResponse))

      component.getFilterEntityV2()

      expect(mockRequestService.getFilterEntityV2).toHaveBeenCalled()
      expect(component.allCompetencies).toBeDefined()
    })

    it('should get request type list successfully', () => {
      const mockData = [{ orgName: 'Test Org', id: '1' }]
      mockRequestService.getRequestTypeList.mockReturnValue(of(mockData))
      component.getRequestDataById = jest.fn()

      component.getRequestTypeList()

      expect(mockRequestService.getRequestTypeList).toHaveBeenCalledWith({
        request: { filters: { isCbp: true } }
      })
      expect(component.requestTypeData).toEqual(mockData)
      expect(component.filteredRequestType).toEqual(mockData)
    })

    it('should get request data by ID successfully', () => {
      const mockData = {
        title: 'Test Title',
        objective: 'Test Objective',
        requestType: 'Single',
        competencies: []
      }
      mockRequestService.getRequestDataById.mockReturnValue(of(mockData))
      component.setRequestData = jest.fn()
      component.demandId = 'test-id'

      component.getRequestDataById()

      expect(mockRequestService.getRequestDataById).toHaveBeenCalledWith('test-id')
      expect(component.requestObjData).toEqual(mockData)
      expect(component.setRequestData).toHaveBeenCalled()
    })
  })

  describe('Form Submission', () => {
    beforeEach(() => {
      component.showDialogBox = jest.fn()
      component.dialogRefs = { close: jest.fn() }
    })

    it('should submit form successfully', () => {
      mockRequestService.createDemand.mockReturnValue(of('success'))
      component.isBroadCast = true
      component.isAssignee = false

      component.submit()

      expect(component.showDialogBox).toHaveBeenCalledWith('progress')
      expect(mockRequestService.createDemand).toHaveBeenCalled()
    })

    it('should handle form submission error', () => {
      const error = new Error('Submission failed')
      mockRequestService.createDemand.mockReturnValue(throwError(error))

      component.submit()

      expect(mockSnackBar.open).toHaveBeenCalledWith('Request Failed')
    })

    it('should show confirmation popup before submission', () => {
      component.dialogRefs = { afterClosed: () => of('confirmed') }
      component.submit = jest.fn()

      component.showConformationPopUp()

      expect(mockDialog.open).toHaveBeenCalled()
    })
  })

  describe('Utility Methods', () => {
    it('should navigate back correctly', () => {
      component.navigateBack()

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/home/all-request')
    })

    it('should filter values correctly', () => {
      const array = [
        { name: 'Angular' },
        { name: 'React' },
        { name: 'Vue' }
      ]

      const result = component.filterValues('ang', array)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Angular')
    })

    it('should filter org values correctly', () => {
      const array = [
        { orgName: 'Google Inc' },
        { orgName: 'Microsoft Corp' },
        { orgName: 'Apple Inc' }
      ]

      const result = component.filterOrgValues('inc', array)

      expect(result).toHaveLength(2)
      expect(result.map((r: any) => r.orgName)).toEqual(['Google Inc', 'Apple Inc'])
    })

    it('should get hidden options correctly', () => {
      const array = [
        { orgName: 'Google' },
        { orgName: 'Microsoft' }
      ]

      const result = component.getHiddenOptions('goo', array)

      expect(result[0].hideOption).toBe('show')
      expect(result[1].hideOption).toBe('hide')
    })

    it('should reset competency fields', () => {
      component.resetCompfields()

      expect(component.enableCompetencyAdd).toBe(false)
      expect(component.allCompetencyTheme).toEqual([])
      expect(component.allCompetencySubtheme).toEqual([])
      expect(mockFormControl.setValue).toHaveBeenCalledWith('')
    })

    it('should reset competency sub-fields', () => {
      component.resetCompSubfields()

      expect(component.enableCompetencyAdd).toBe(false)
      expect(component.allCompetencySubtheme).toEqual([])
      expect(component.seletedCompetencyTheme).toBe('')
      expect(component.seletedCompetencySubTheme).toBe('')
    })

    it('should clear search correctly', () => {
      const mockEvent = { stopPropagation: jest.fn() }

      component.clearSearch(mockEvent, 'providerText')

      expect(mockEvent.stopPropagation).toHaveBeenCalled()
      expect(mockFormControl.patchValue).toHaveBeenCalledWith('')
    })

    it('should handle opened change correctly', () => {
      component.openedChange(true, 'providerText')

      expect(mockFormControl.patchValue).toHaveBeenCalledWith('')
    })

    it('should check if option is disabled', () => {
      mockFormGroup.get.mockReturnValue({
        value: [1, 2, 3, 4, 5] // 5 items already selected
      })

      const result = component.isOptionDisabled({ id: 6 })

      expect(result).toBe(true)
    })

    it('should remove provider correctly', () => {
      const provider = { id: 1, name: 'Test Provider' }
      mockFormGroup.get.mockReturnValue({
        value: [provider, { id: 2, name: 'Other Provider' }],
        setValue: jest.fn()
      })

      component.onProviderRemoved(provider)

      expect(mockFormGroup.get).toHaveBeenCalledWith('providers')
    })
  })

  describe('Dialog Management', () => {
    it('should show dialog box with correct data for progress', () => {
      component.openDialoagBox = jest.fn()

      component.showDialogBox('progress')

      expect(component.openDialoagBox).toHaveBeenCalledWith({
        type: 'progress',
        icon: 'vega',
        title: 'Processing your request',
        subTitle: 'Wait a second , your request is processing………'
      })
    })

    it('should show dialog box with correct data for progress-completed', () => {
      component.openDialoagBox = jest.fn()

      component.showDialogBox('progress-completed')

      expect(component.openDialoagBox).toHaveBeenCalledWith({
        type: 'progress-completed',
        icon: 'accept_icon',
        title: 'Processing your request',
        subTitle: 'Wait a second , your request is processing………',
        primaryAction: 'Successfully created....'
      })
    })

    it('should open dialog box correctly', () => {
      const dialogData = {
        type: 'test',
        icon: 'test-icon',
        title: 'Test Title',
        subTitle: 'Test Subtitle'
      }

      component.openDialoagBox(dialogData)

      expect(mockDialog.open).toHaveBeenCalled()
    })

    it('should open competency view dialog', () => {
      const item = { id: '1', name: 'Test Competency' }
      component.removeCompetency = jest.fn()

      component.view(item)

      expect(mockDialog.open).toHaveBeenCalled()
    })
  })

  describe('Search and Query Updates', () => {
    it('should update theme query', () => {
      component.allCompetencyTheme = [{ name: 'Test Theme' }]
      component.filterValues = jest.fn().mockReturnValue([{ name: 'Test Theme' }])

      component.updateQuery('theme')

      // Since we're mocking valueChanges, we need to verify the subscription is set up
      expect(component.filteredallCompetencyTheme).toBeDefined()
    })

    it('should update sub-theme query', () => {
      component.allCompetencySubtheme = [{ name: 'Test Sub Theme' }]
      component.filterValues = jest.fn().mockReturnValue([{ name: 'Test Sub Theme' }])

      component.updateQuery('subtheme')

      expect(component.filteredallCompetencySubtheme).toBeDefined()
    })

    it('should reset theme search', () => {
      component.allCompetencyTheme = [{ name: 'Test Theme' }]

      component.resetSearch('theme')

      expect(mockFormControl.setValue).toHaveBeenCalledWith('')
      expect(component.filteredallCompetencyTheme).toEqual(component.allCompetencyTheme)
    })

    it('should reset sub-theme search', () => {
      component.allCompetencySubtheme = [{ name: 'Test Sub Theme' }]

      component.resetSearch('subtheme')

      expect(mockFormControl.setValue).toHaveBeenCalledWith('')
      expect(component.filteredallCompetencySubtheme).toEqual(component.allCompetencySubtheme)
    })
  })

  describe('Error Handling', () => {
    it('should handle error when getting filter entity', () => {
      mockRequestService.getFilterEntity.mockReturnValue(throwError('Error'))

      expect(() => component.getFilterEntity()).not.toThrow()
    })

    it('should handle error when getting request type list', () => {
      mockRequestService.getRequestTypeList.mockReturnValue(throwError('Error'))

      expect(() => component.getRequestTypeList()).not.toThrow()
    })

    it('should handle error when getting request data by ID', () => {
      mockRequestService.getRequestDataById.mockReturnValue(throwError('Error'))
      component.demandId = 'test-id'

      expect(() => component.getRequestDataById()).not.toThrow()
    })
  })
})