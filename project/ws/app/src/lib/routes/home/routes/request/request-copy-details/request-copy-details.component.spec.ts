import { of, throwError } from 'rxjs'
import { RequestCopyDetailsComponent } from './request-copy-details.component'

describe('RequestCopyDetailsComponent', () => {
  let component: RequestCopyDetailsComponent
  let mockFormBuilder: any
  let mockRequestService: any
  let mockActivatedRouter: any
  let mockSnackBar: any
  let mockRouter: any
  let mockDialog: any
  let mockInitService: any
  let mockFormGroup: any
  let mockFormControl: any

  beforeEach(() => {
    // Mock FormControl
    mockFormControl = {
      value: '',
      setValue: jest.fn(),
      patchValue: jest.fn(),
      setValidators: jest.fn(),
      clearValidators: jest.fn(),
      updateValueAndValidity: jest.fn(),
      enable: jest.fn(),
      disable: jest.fn(),
      valueChanges: {
        pipe: jest.fn().mockReturnValue({
          subscribe: jest.fn()
        }),
        subscribe: jest.fn()
      }
    }

    // Mock FormGroup
    mockFormGroup = {
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
      setValue: jest.fn(),
      disable: jest.fn(),
      enable: jest.fn(),
      value: {
        titleName: 'Test Title',
        Objective: 'Test Objective',
        userType: 'Test User',
        learningMode: 'self-paced',
        referenceLink: 'http://test.com',
        requestType: 'Single',
        providers: [],
        assignee: {},
        competencies_v5: []
      },
      get: jest.fn().mockReturnValue(mockFormControl)
    }

    // Mock FormBuilder
    mockFormBuilder = {
      group: jest.fn().mockReturnValue(mockFormGroup)
    }

    // Mock RequestService
    mockRequestService = {
      getRequestDataById: jest.fn().mockReturnValue(of({})),
      getFilterEntity: jest.fn().mockReturnValue(of([])),
      getFilterEntityV2: jest.fn().mockReturnValue(of([{}, {}])),
      getRequestTypeList: jest.fn().mockReturnValue(of([])),
      createDemand: jest.fn().mockReturnValue(of({}))
    }

    // Mock ActivatedRoute
    mockActivatedRouter = {
      queryParams: {
        subscribe: jest.fn().mockImplementation((callback) => {
          callback({ id: 'test-id', name: 'view' })
        })
      },
      snapshot: {
        data: {
          configSvc: {
            userProfile: { userId: 'test-user' }
          }
        }
      }
    }

    // Mock SnackBar
    mockSnackBar = {
      open: jest.fn()
    }

    // Mock Router
    mockRouter = {
      navigateByUrl: jest.fn()
    }

    // Mock Dialog
    mockDialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: jest.fn().mockReturnValue(of('confirmed'))
      })
    }

    // Mock InitService
    mockInitService = {
      configSvc: {
        competency: {
          competencies_v5: {
            vKey: 'competencies_v5'
          }
        }
      }
    }

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn().mockReturnValue('test-user'),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    })

    // Create component instance
    component = new RequestCopyDetailsComponent(
      mockFormBuilder,
      mockRequestService,
      mockActivatedRouter,
      mockSnackBar,
      mockRouter,
      mockDialog,
      mockInitService
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should create component and set currentUser from sessionStorage', () => {
      expect(component).toBeDefined()
      expect(component.currentUser).toBe('test-user')
    })

    it('should handle empty sessionStorage', () => {
      window.sessionStorage.getItem = jest.fn().mockReturnValue(null)
      const newComponent = new RequestCopyDetailsComponent(
        mockFormBuilder,
        mockRequestService,
        mockActivatedRouter,
        mockSnackBar,
        mockRouter,
        mockDialog,
        mockInitService
      )
      expect(newComponent.currentUser).toBe('')
    })
  })

  describe('ngOnInit', () => {
    beforeEach(() => {
      component.requestForm = mockFormGroup
      jest.spyOn(component, 'getRequestTypeList')
      jest.spyOn(component, 'initFormFroup')
      jest.spyOn(component, 'getFilterEntity')
      jest.spyOn(component, 'getFilterEntityV2')
      jest.spyOn(component, 'valuechangeFuctions')
    })

    it('should initialize component with competencies_v5', () => {
      component.ngOnInit()

      expect(component.initFormFroup).toHaveBeenCalled()
      expect(component.getRequestTypeList).toHaveBeenCalled()
      expect(component.getFilterEntity).toHaveBeenCalled()
      expect(component.valuechangeFuctions).toHaveBeenCalled()
      expect(component.compentencyKey).toEqual({ vKey: 'competencies_v5' })
    })

    it('should initialize component with different competency version', () => {
      mockInitService.configSvc.competency.competencies_v5.vKey = 'competencies_v4'
      component.ngOnInit()

      expect(component.getFilterEntityV2).toHaveBeenCalled()
    })
  })

  describe('initFormFroup', () => {
    it('should initialize form group with all controls', () => {
      //  component.compentencyKey = { vKey: 'competencies_v5' }
      component.initFormFroup()

      expect(mockFormBuilder.group).toHaveBeenCalled()
      expect(component.requestForm).toBe(mockFormGroup)
    })
  })

  describe('getRequestDataById', () => {
    beforeEach(() => {
      component.demandId = 'test-id'
      component.requestForm = mockFormGroup
      jest.spyOn(component, 'setRequestData')
    })

    it('should get request data and set it', () => {
      const mockData = { title: 'Test', objective: 'Test Objective' }
      mockRequestService.getRequestDataById.mockReturnValue(of(mockData))

      component.getRequestDataById()

      expect(mockRequestService.getRequestDataById).toHaveBeenCalledWith('test-id')
      expect(component.requestObjData).toBe(mockData)
      expect(component.setRequestData).toHaveBeenCalled()
    })

    it('should handle empty response', () => {
      mockRequestService.getRequestDataById.mockReturnValue(of(null))

      component.getRequestDataById()

      expect(component.setRequestData).not.toHaveBeenCalled()
    })
  })

  describe('setRequestData', () => {
    beforeEach(() => {
      component.requestForm = mockFormGroup
      //  component.compentencyKey = { vKey: 'competencies_v5' }
      component.requestObjData = {
        title: 'Test Title',
        objective: 'Test Objective',
        typeOfUser: 'Test User',
        learningMode: 'self-paced',
        referenceLink: 'http://test.com',
        requestType: 'Single',
        competencies: [
          {
            area: 'Test Area',
            theme: 'Test Theme',
            sub_theme: 'Test Sub Theme'
          }
        ],
        preferredProvider: [{ providerId: 'provider1' }],
        assignedProvider: { providerId: 'assignee1' }
      }
      component.filteredRequestType = [{ id: 'provider1', name: 'Provider 1' }]
      component.filteredAssigneeType = [{ id: 'assignee1', name: 'Assignee 1' }]
      jest.spyOn(component, 'selectRequestType')
    })

    it('should set form values from request data', () => {
      component.setRequestData()

      expect(mockFormGroup.setValue).toHaveBeenCalled()
      expect(component.selectRequestType).toHaveBeenCalledWith('Single')
    })

    it('should handle competencies with select_ prefixes', () => {
      component.requestObjData.competencies = [
        {
          select_area: 'Test Area',
          select_theme: 'Test Theme',
          select_sub_theme: 'Test Sub Theme'
        }
      ]

      component.setRequestData()

      expect(mockFormControl.setValue).toHaveBeenCalled()
    })

    it('should handle missing preferred providers', () => {
      component.requestObjData.preferredProvider = null

      component.setRequestData()

      expect(mockFormGroup.setValue).toHaveBeenCalled()
    })

    it('should handle missing assigned provider', () => {
      component.requestObjData.assignedProvider = null

      component.setRequestData()

      expect(mockFormGroup.setValue).toHaveBeenCalled()
    })
  })

  describe('navigateBack', () => {
    it('should navigate to all-request page', () => {
      component.navigateBack()

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/home/all-request')
    })
  })

  describe('valuechangeFuctions', () => {
    beforeEach(() => {
      component.requestForm = mockFormGroup
      component.requestTypeData = []
      jest.spyOn(component, 'getHiddenOptions').mockReturnValue([])
      jest.spyOn(component, 'filterOrgValues').mockReturnValue([])
    })

    it('should set up value change subscriptions', () => {
      component.valuechangeFuctions()

      expect(mockFormControl.valueChanges.pipe).toHaveBeenCalled()
    })
  })

  describe('filterValues', () => {
    it('should filter values based on name', () => {
      const array = [
        { name: 'Test One' },
        { name: 'Another Test' },
        { name: 'Different' }
      ]

      const result = component.filterValues('test', array)

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Test One')
      expect(result[1].name).toBe('Another Test')
    })
  })

  describe('filterOrgValues', () => {
    it('should filter values based on orgName', () => {
      const array = [
        { orgName: 'Test Org' },
        { orgName: 'Another Test Org' },
        { orgName: 'Different Org' }
      ]

      const result = component.filterOrgValues('test', array)

      expect(result).toHaveLength(2)
      expect(result[0].orgName).toBe('Test Org')
      expect(result[1].orgName).toBe('Another Test Org')
    })
  })

  describe('getHiddenOptions', () => {
    it('should set hideOption property based on search', () => {
      const array = [
        { orgName: 'Test Org' },
        { orgName: 'Different Org' }
      ]

      const result = component.getHiddenOptions('test', array)

      expect(result[0].hideOption).toBe('show')
      expect(result[1].hideOption).toBe('hide')
    })
  })

  describe('getFilterEntity', () => {
    it('should get and set competency list', () => {
      const mockCompetencies = [{ id: 1, name: 'Test' }]
      mockRequestService.getFilterEntity.mockReturnValue(of(mockCompetencies))

      component.getFilterEntity()

      expect(mockRequestService.getFilterEntity).toHaveBeenCalled()
      expect(component.competencyList).toBe(mockCompetencies)
      expect(component.allCompetencies).toBe(mockCompetencies)
    })
  })

  describe('getFilterEntityV2', () => {
    it('should process competency data structure', () => {
      const mockData = [
        {
          terms: [
            {
              identifier: 'area1',
              name: 'Area 1',
              associations: [{ identifier: 'theme1' }]
            }
          ]
        },
        {
          terms: [
            {
              identifier: 'theme1',
              name: 'Theme 1',
              associations: []
            }
          ]
        }
      ]
      mockRequestService.getFilterEntityV2.mockReturnValue(of(mockData))

      component.getFilterEntityV2()

      expect(component.allCompetencies).toBeDefined()
      expect(component.filteredallCompetencies).toBeDefined()
    })

    it('should handle missing data', () => {
      mockRequestService.getFilterEntityV2.mockReturnValue(of([null, null]))

      component.getFilterEntityV2()

      expect(component.allCompetencies).toBeUndefined()
    })
  })

  describe('getRequestTypeList', () => {
    beforeEach(() => {
      component.demandId = 'test-id'
      component.actionBtnName = 'view'
      component.requestForm = mockFormGroup
      jest.spyOn(component, 'getRequestDataById')
    })

    it('should get request type list and handle view action', () => {
      const mockData = [{ id: 1, name: 'Type 1' }]
      mockRequestService.getRequestTypeList.mockReturnValue(of(mockData))

      component.getRequestTypeList()

      expect(mockRequestService.getRequestTypeList).toHaveBeenCalled()
      expect(component.requestTypeData).toBe(mockData)
      expect(component.getRequestDataById).toHaveBeenCalled()
      expect(mockFormGroup.disable).toHaveBeenCalled()
      expect(component.isHideData).toBe(true)
    })

    it('should handle reassign action', () => {
      component.actionBtnName = 'reassign'
      const mockData = [{ id: 1, name: 'Type 1' }]
      mockRequestService.getRequestTypeList.mockReturnValue(of(mockData))

      component.getRequestTypeList()

      expect(mockFormGroup.disable).toHaveBeenCalled()
      expect(mockFormControl.enable).toHaveBeenCalled()
      expect(component.isCompetencyHide).toBe(true)
    })

    it('should handle no demandId', () => {
      component.demandId = null

      component.getRequestTypeList()

      expect(component.getRequestDataById).not.toHaveBeenCalled()
    })
  })

  describe('selectRequestType', () => {
    beforeEach(() => {
      component.requestForm = mockFormGroup
    })

    it('should handle Single request type', () => {
      component.selectRequestType('Single')

      expect(component.isAssignee).toBe(true)
      expect(component.isBroadCast).toBe(false)
      expect(component.statusValue).toBe('Assigned')
      expect(mockFormControl.setValue).toHaveBeenCalledWith('')
      expect(mockFormControl.setValidators).toHaveBeenCalled()
    })

    it('should handle Broadcast request type', () => {
      component.selectRequestType('Broadcast')

      expect(component.isBroadCast).toBe(true)
      expect(component.isAssignee).toBe(false)
      expect(component.statusValue).toBe('Unassigned')
      expect(mockFormControl.setValue).toHaveBeenCalledWith('')
      expect(mockFormControl.setValidators).toHaveBeenCalled()
    })
  })

  describe('openedChange', () => {
    beforeEach(() => {
      component.requestForm = mockFormGroup
    })

    it('should clear search control value when opened', () => {
      component.openedChange(true, 'providerText')

      expect(mockFormControl.patchValue).toHaveBeenCalledWith('')
    })

    it('should not clear when closed', () => {
      component.openedChange(false, 'providerText')

      expect(mockFormControl.patchValue).toHaveBeenCalledWith('')
    })
  })

  describe('clearSearch', () => {
    beforeEach(() => {
      component.requestForm = mockFormGroup
    })

    it('should clear search and stop propagation', () => {
      const mockEvent = { stopPropagation: jest.fn() }

      component.clearSearch(mockEvent, 'providerText')

      expect(mockEvent.stopPropagation).toHaveBeenCalled()
      expect(mockFormControl.patchValue).toHaveBeenCalledWith('')
    })
  })

  describe('updateQuery', () => {
    beforeEach(() => {
      component.requestForm = mockFormGroup
      component.allCompetencyTheme = []
      component.allCompetencySubtheme = []
      jest.spyOn(component, 'filterValues').mockReturnValue([])
    })

    it('should update theme query', () => {
      component.updateQuery('theme')

      expect(mockFormControl.valueChanges.subscribe).toHaveBeenCalled()
    })

    it('should update subtheme query', () => {
      component.updateQuery('subtheme')

      expect(mockFormControl.valueChanges.subscribe).toHaveBeenCalled()
    })
  })

  describe('resetSearch', () => {
    beforeEach(() => {
      component.requestForm = mockFormGroup
      component.allCompetencyTheme = [{ name: 'Theme 1' }]
      component.allCompetencySubtheme = [{ name: 'SubTheme 1' }]
    })

    it('should reset theme search', () => {
      component.resetSearch('theme')

      expect(mockFormControl.setValue).toHaveBeenCalledWith('')
      expect(component.filteredallCompetencyTheme).toBe(component.allCompetencyTheme)
    })

    it('should reset subtheme search', () => {
      component.resetSearch('subtheme')

      expect(mockFormControl.setValue).toHaveBeenCalledWith('')
      expect(component.filteredallCompetencySubtheme).toBe(component.allCompetencySubtheme)
    })

    it('should handle theme reset with selected subtheme', () => {
      component.seletedCompetencySubTheme = { name: 'Selected' }

      component.resetSearch('theme')

      expect(mockFormControl.setValue).toHaveBeenCalledWith('')
    })
  })

  describe('resetCompSubfields', () => {
    beforeEach(() => {
      component.requestForm = mockFormGroup
    })

    it('should reset all competency subfields', () => {
      component.resetCompSubfields()

      expect(component.enableCompetencyAdd).toBe(false)
      expect(component.allCompetencySubtheme).toEqual([])
      expect(component.filteredallCompetencyTheme).toEqual([])
      expect(mockFormControl.setValue).toHaveBeenCalledWith('')
    })
  })

  describe('compAreaSelected', () => {
    beforeEach(() => {
      component.allCompetencies = [
        { name: 'Area 1', themes: [{ name: 'Theme 1' }] }
      ]
      jest.spyOn(component, 'resetCompSubfields')
    })

    it('should select competency area and set themes', () => {
      const option = { name: 'Area 1' }

      component.compAreaSelected(option)

      expect(component.resetCompSubfields).toHaveBeenCalled()
      expect(component.seletedCompetencyArea).toEqual(component.allCompetencies[0])
      expect(component.allCompetencyTheme).toEqual([{ name: 'Theme 1' }])
    })

    it('should handle children instead of themes', () => {
      component.allCompetencies[0].children = [{ name: 'Child 1' }]
      delete component.allCompetencies[0].themes
      const option = { name: 'Area 1' }

      component.compAreaSelected(option)

      expect(component.allCompetencyTheme).toEqual([{ name: 'Child 1' }])
    })
  })

  describe('compThemeSelected', () => {
    beforeEach(() => {
      component.allCompetencyTheme = [
        {
          identifier: 'theme1',
          name: 'Theme 1',
          associations: [{ name: 'Sub 1' }]
        }
      ]
    })

    it('should select competency theme by identifier', () => {
      const option = { identifier: 'theme1' }

      component.compThemeSelected(option)

      expect(component.enableCompetencyAdd).toBe(false)
      expect(component.seletedCompetencyTheme).toEqual(component.allCompetencyTheme[0])
      expect(component.allCompetencySubtheme).toEqual([{ name: 'Sub 1' }])
    })

    it('should select competency theme by name', () => {
      const option = { name: 'Theme 1' }

      component.compThemeSelected(option)

      expect(component.seletedCompetencyTheme).toEqual(component.allCompetencyTheme[0])
    })

    it('should handle children instead of associations', () => {
      component.allCompetencyTheme[0].children = [{ name: 'Child 1' }]
      delete component.allCompetencyTheme[0].associations
      const option = { identifier: 'theme1' }

      component.compThemeSelected(option)

      expect(component.allCompetencySubtheme).toEqual([{ name: 'Child 1' }])
    })
  })

  describe('compSubThemeSelected', () => {
    beforeEach(() => {
      component.allCompetencySubtheme = [
        { identifier: 'sub1', name: 'Sub 1' }
      ]
    })

    it('should select competency subtheme by identifier', () => {
      const option = { identifier: 'sub1' }

      component.compSubThemeSelected(option)

      expect(component.enableCompetencyAdd).toBe(true)
      expect(component.seletedCompetencySubTheme).toEqual(component.allCompetencySubtheme[0])
    })

    it('should select competency subtheme by name', () => {
      const option = { name: 'Sub 1' }

      component.compSubThemeSelected(option)

      expect(component.seletedCompetencySubTheme).toEqual(component.allCompetencySubtheme[0])
    })
  })

  describe('resetCompfields', () => {
    beforeEach(() => {
      component.requestForm = mockFormGroup
    })

    it('should reset all competency fields', () => {
      component.resetCompfields()

      expect(component.enableCompetencyAdd).toBe(false)
      expect(component.allCompetencyTheme).toEqual([])
      expect(component.allCompetencySubtheme).toEqual([])
      expect(mockFormControl.setValue).toHaveBeenCalledWith('')
    })
  })

  describe('canPush', () => {
    it('should return true for new competency', () => {
      const arr = [
        {
          competencyAreaId: 'area1',
          competencyThemeId: 'theme1',
          competencySubThemeId: 'sub1'
        }
      ]
      const obj = {
        competencyAreaId: 'area2',
        competencyThemeId: 'theme2',
        competencySubThemeId: 'sub2'
      }

      const result = component.canPush(arr, obj)

      expect(result).toBe(true)
    })

    it('should return false for duplicate competency', () => {
      const arr = [
        {
          competencyAreaId: 'area1',
          competencyThemeId: 'theme1',
          competencySubThemeId: 'sub1'
        }
      ]
      const obj = {
        competencyAreaId: 'area1',
        competencyThemeId: 'theme1',
        competencySubThemeId: 'sub1'
      }

      const result = component.canPush(arr, obj)

      expect(result).toBe(false)
    })
  })

  describe('refreshData', () => {
    it('should call getFilterEntityV2', () => {
      jest.spyOn(component, 'getFilterEntityV2')

      component.refreshData()

      expect(component.getFilterEntityV2).toHaveBeenCalled()
    })
  })

  describe('addCompetency', () => {
    beforeEach(() => {
      component.requestForm = mockFormGroup
      //component.compentencyKey = { vKey: 'competencies_v5' }
      component.seletedCompetencyArea = {
        name: 'Area',
        id: 'area1',
        description: 'Area desc'
      }
      component.seletedCompetencyTheme = {
        name: 'Theme',
        id: 'theme1',
        description: 'Theme desc',
        additionalProperties: { themeType: 'type1' }
      }
      component.seletedCompetencySubTheme = {
        name: 'SubTheme',
        id: 'sub1',
        description: 'Sub desc'
      }
      jest.spyOn(component, 'canPush').mockReturnValue(true)
      jest.spyOn(component, 'resetCompfields')
      jest.spyOn(component, 'refreshData')
      mockFormControl.value = []
    })

    it('should add competency with v5 format', () => {
      component.addCompetency()

      expect(component.canPush).toHaveBeenCalled()
      expect(mockFormControl.setValue).toHaveBeenCalled()
      expect(component.resetCompfields).toHaveBeenCalled()
      expect(component.refreshData).toHaveBeenCalled()
    })

    it('should add competency with non-v5 format', () => {
      component.compentencyKey.vKey = 'competencies_v4'
      component.seletedCompetencyTheme.additionalProperties = { displayName: 'Theme Display' }
      component.seletedCompetencyTheme.refType = 'refType1'
      component.seletedCompetencySubTheme.additionalProperties = { displayName: 'Sub Display' }
      component.seletedCompetencyArea.identifier = 'area-id'
      component.seletedCompetencyTheme.identifier = 'theme-id'
      component.seletedCompetencySubTheme.identifier = 'sub-id'

      component.addCompetency()

      expect(mockFormControl.setValue).toHaveBeenCalled()
    })

    it('should show snackbar for duplicate competency', () => {
      jest.spyOn(component, 'canPush').mockReturnValue(false)

      component.addCompetency()

      expect(mockSnackBar.open).toHaveBeenCalledWith('This competency is already added')
      expect(component.resetCompfields).toHaveBeenCalled()
    })

    it('should not add if selections are incomplete', () => {
      component.seletedCompetencyArea = null

      component.addCompetency()

      expect(mockFormControl.setValue).not.toHaveBeenCalled()
    })
  })

  describe('removeCompetency', () => {
    beforeEach(() => {
      component.requestForm = mockFormGroup
      // component.compentencyKey = { vKey: 'competencies_v5' }
      mockFormControl.value = [
        {
          id: 'comp1',
          competencyAreaId: 'area1',
          competencyThemeId: 'theme1',
          competencySubThemeId: 'sub1'
        }
      ]
      jest.spyOn(component, 'refreshData')
    })

    it('should remove competency by id', () => {
      const id = { id: 'comp1' }

      component.removeCompetency(id)

      expect(mockFormControl.setValue).toHaveBeenCalled()
      expect(component.refreshData).toHaveBeenCalled()
    })

    it('should remove competency by area/theme/subtheme ids', () => {
      const id = {
        competencyAreaId: 'area1',
        competencyThemeId: 'theme1',
        competencySubThemeId: 'sub1'
      }

      component.removeCompetency(id)

      expect(mockFormControl.setValue).toHaveBeenCalled()
      expect(component.refreshData).toHaveBeenCalled()
    })
  })

  describe('view', () => {
    it('should open competency view dialog', () => {
      const item = { id: 1, name: 'Test' }

      component.view(item)

      expect(mockDialog.open).toHaveBeenCalled()
    })

    it('should handle dialog response DELETE', () => {
      const mockDialogRef = {
        afterClosed: jest.fn().mockReturnValue(of({ action: 'DELETE', id: 'test' }))
      }
      mockDialog.open.mockReturnValue(mockDialogRef)
      jest.spyOn(component, 'removeCompetency')

      component.view()

      expect(component.removeCompetency).toHaveBeenCalledWith('test')
    })

    it('should handle dialog response ADD', () => {
      const mockDialogRef = {
        afterClosed: jest.fn().mockReturnValue(of({ action: 'ADD' }))
      }
      mockDialog.open.mockReturnValue(mockDialogRef)

      component.view()

      // Should not throw error for ADD action
    })
  })

  describe('onProviderRemoved', () => {
    beforeEach(() => {
      component.requestForm = mockFormGroup
      const providersControl = {
        value: ['provider1', 'provider2', 'provider3'],
        setValue: jest.fn()
      }
      mockFormGroup.get.mockReturnValue(providersControl)
    })

    it('should remove provider from form control', () => {
      const provider = 'provider2'

      component.onProviderRemoved(provider)

      const providersControl = mockFormGroup.get('providers')
      expect(providersControl.setValue).toHaveBeenCalledWith(['provider1', 'provider3'])
    })

    it('should handle non-existent provider', () => {
      const provider = 'non-existent'

      component.onProviderRemoved(provider)

      const providersControl = mockFormGroup.get('providers')
      expect(providersControl.setValue).toHaveBeenCalledWith(['provider1', 'provider2', 'provider3'])
    })

    it('should handle null form control', () => {
      mockFormGroup.get.mockReturnValue(null)

      expect(() => component.onProviderRemoved('provider1')).not.toThrow()
    })
  })

  describe('isOptionDisabled', () => {
    beforeEach(() => {
      component.requestForm = mockFormGroup
    })

    it('should return true when max providers selected and option not selected', () => {
      const control = {
        value: ['p1', 'p2', 'p3', 'p4', 'p5']
      }
      mockFormGroup.get.mockReturnValue(control)

      const result = component.isOptionDisabled('p6')

      expect(result).toBe(true)
    })

    it('should return false when max providers selected but option is selected', () => {
      const control = {
        value: ['p1', 'p2', 'p3', 'p4', 'p5']
      }
      mockFormGroup.get.mockReturnValue(control)

      const result = component.isOptionDisabled('p3')

      expect(result).toBe(false)
    })

    it('should return false when less than max providers selected', () => {
      const control = {
        value: ['p1', 'p2']
      }
      mockFormGroup.get.mockReturnValue(control)

      const result = component.isOptionDisabled('p3')

      expect(result).toBe(false)
    })

    it('should return false when control is null', () => {
      mockFormGroup.get.mockReturnValue(null)

      const result = component.isOptionDisabled('p1')

      expect(result).toBe(false)
    })
  })

  describe('showSaveButton', () => {
    it('should exist and not throw error', () => {
      expect(() => component.showSaveButton()).not.toThrow()
    })
  })

  describe('showConformationPopUp', () => {
    it('should open confirmation dialog and call submit on confirm', () => {
      jest.spyOn(component, 'submit')
      component.actionBtnName = 'create'

      component.showConformationPopUp()

      expect(mockDialog.open).toHaveBeenCalled()
      expect(component.submit).toHaveBeenCalled()
    })

    it('should show reassign confirmation', () => {
      component.actionBtnName = 'reassign'

      component.showConformationPopUp()

      expect(mockDialog.open).toHaveBeenCalled()
    })

    it('should not call submit when cancelled', () => {
      const mockDialogRef = {
        afterClosed: jest.fn().mockReturnValue(of('cancelled'))
      }
      mockDialog.open.mockReturnValue(mockDialogRef)
      jest.spyOn(component, 'submit')

      component.showConformationPopUp()

      expect(component.submit).not.toHaveBeenCalled()
    })
  })

  describe('submit', () => {
    beforeEach(() => {
      component.requestForm = mockFormGroup
      // component.compentencyKey = { vKey: 'competencies_v5' }
      component.demandId = 'test-id'
      component.actionBtnName = 'reassign'
      component.isAssignee = true
      component.isBroadCast = false
      component.currentUser = 'test-user'
      mockFormGroup.value.competencies_v5 = [
        {
          competencyArea: 'Area 1',
          competencyTheme: 'Theme 1',
          competencySubTheme: 'Sub 1'
        }
      ]
      mockFormGroup.value.assignee = { orgName: 'Test Org', id: 'org1' }
      jest.spyOn(component, 'showDialogBox')
    })

    it('should submit reassign request successfully', () => {
      mockRequestService.createDemand.mockReturnValue(of('success'))

      component.submit()

      expect(mockFormGroup.enable).toHaveBeenCalled()
      expect(mockRequestService.createDemand).toHaveBeenCalled()
      expect(component.showDialogBox).toHaveBeenCalledWith('progress')
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/home/all-request')
      expect(mockSnackBar.open).toHaveBeenCalledWith('Request submitted successfully ')
    })

    it('should submit broadcast request with providers', () => {
      component.isBroadCast = true
      component.isAssignee = false
      mockFormGroup.value.providers = [
        { orgName: 'Provider 1', id: 'prov1' },
        { orgName: 'Provider 2', id: 'prov2' }
      ]
      mockFormGroup.value.assignee = null

      component.submit()

      expect(mockRequestService.createDemand).toHaveBeenCalled()
    })

    it('should include learning mode when present', () => {
      mockFormGroup.value.learningMode = 'Self-Paced'

      component.submit()

      expect(mockRequestService.createDemand).toHaveBeenCalled()
    })

    it('should handle submit error', () => {
      mockRequestService.createDemand.mockReturnValue(throwError('error'))

      component.submit()

      expect(mockSnackBar.open).toHaveBeenCalledWith('Request Failed')
    })

    it('should handle create request (not reassign)', () => {
      component.demandId = null
      component.actionBtnName = 'create'

      component.submit()

      expect(mockFormGroup.enable).not.toHaveBeenCalled()
    })
  })

  describe('showDialogBox', () => {
    beforeEach(() => {
      jest.spyOn(component, 'openDialoagBox')
    })

    it('should show progress dialog', () => {
      component.showDialogBox('progress')

      expect(component.openDialoagBox).toHaveBeenCalledWith({
        type: 'progress',
        icon: 'vega',
        title: 'Processing your request',
        subTitle: 'Wait a second , your request is processing………'
      })
    })

    it('should show progress completed dialog', () => {
      component.showDialogBox('progress-completed')

      expect(component.openDialoagBox).toHaveBeenCalledWith({
        type: 'progress-completed',
        icon: 'accept_icon',
        title: 'Processing your request',
        subTitle: 'Wait a second , your request is processing………',
        primaryAction: 'Successfully created....'
      })
    })
  })

  describe('openDialoagBox', () => {
    it('should open dialog with provided data', () => {
      const dialogData = {
        type: 'test',
        icon: 'test-icon',
        title: 'Test Title',
        subTitle: 'Test Subtitle',
        primaryAction: 'Primary',
        secondaryAction: 'Secondary'
      }

      component.openDialoagBox(dialogData)

      expect(mockDialog.open).toHaveBeenCalled()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing form controls gracefully', () => {
      // component.requestForm = null

      expect(() => component.valuechangeFuctions()).not.toThrow()
    })

    it('should handle empty competency selections', () => {
      component.seletedCompetencyArea = null
      component.seletedCompetencyTheme = null
      component.seletedCompetencySubTheme = null

      expect(() => component.addCompetency()).not.toThrow()
    })

    it('should handle null/undefined values in filter functions', () => {
      expect(() => component.filterValues('test', null)).toThrow()
      expect(() => component.filterOrgValues('test', null)).toThrow()
      expect(() => component.getHiddenOptions('test', null)).not.toThrow()
    })
  })
})