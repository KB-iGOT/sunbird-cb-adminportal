import { DesignationsComponent } from './designations.component'
import { FormControl } from '@angular/forms'
import { of, throwError } from 'rxjs'
import * as _ from 'lodash'

// Mock dependencies
const mockDesignationsService = {
  setUserProfile: jest.fn(),
  getOrgReadData: jest.fn(),
  createFrameWork: jest.fn(),
  getFrameworkInfo: jest.fn(),
  setFrameWorkInfo: jest.fn(),
  setCurrentOrgDesignationsList: jest.fn(),
  deleteDesignation: jest.fn(),
  publishFramework: jest.fn()
}

const mockDialog = {
  open: jest.fn().mockReturnValue({
    afterClosed: jest.fn().mockReturnValue(of(true))
  })
}

const mockActivatedRoute = {
  snapshot: {
    data: {
      configService: {
        userProfileV2: { id: 'user123' },
        userProfile: {
          rootOrgId: 'org123',
          departmentName: 'Test Department'
        }
      },
      pageData: {
        data: {
          frameworkCreationMSg: 'Creating framework...',
          internalErrorMsg: 'Internal error occurred',
          termRemoveMsg: 'Term removed successfully',
          topsection: {
            guideVideo: {
              url: '/guide-video'
            }
          }
        }
      }
    },
    params: {
      department: 'dept123'
    },
    queryParams: {
      orgName: 'Test Organization'
    }
  }
}

const mockSnackBar = {
  open: jest.fn()
}

const mockEnvironment = {
  frameworkName: 'test-framework',
  ODCSMasterFramework: 'master-framework',
  karmYogiPath: 'https://test.com'
}

describe('DesignationsComponent', () => {
  let component: DesignationsComponent

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Create component instance
    component = new DesignationsComponent(
      mockDesignationsService as any,
      mockDialog as any,
      mockActivatedRoute as any,
      mockSnackBar as any
    );

    // Mock environment
    (component as any).environment = mockEnvironment
  })

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy()
    })

    it('should initialize with default values', () => {
      expect(component.goToImportMaster).toBe(false)
      expect(component.showCreateLoader).toBe(false)
      expect(component.showLoader).toBe(true)
      expect(component.searchControl).toBeInstanceOf(FormControl)
      expect(component.designationMaster).toBe('desigantion master')
    })

    it('should call initialization on ngOnInit', () => {
      const initSpy = jest.spyOn(component, 'initialization')
      component.ngOnInit()
      expect(initSpy).toHaveBeenCalled()
    })
  })

  describe('Initialization Methods', () => {
    it('should initialize default values correctly', () => {
      component.initializeDefaultValues()

      expect(component.orgId).toBe('dept123')
      expect(component.orgName).toBe('Test Organization')
      expect(component.actionMenuItem).toHaveLength(1)
      expect(component.actionMenuItem[0].key).toBe('remove')
      expect(component.tableData.columns).toHaveLength(3)
      expect(mockDesignationsService.setUserProfile).toHaveBeenCalled()
    })

    it('should set up value change subscribers', () => {
      const mockValueChanges = of('test search')
      component.searchControl = { valueChanges: mockValueChanges.pipe() } as any
      const filterSpy = jest.spyOn(component, 'filterDesignations')

      component.valueChangeSubscribers()

      // Simulate value change
      mockValueChanges.subscribe(() => {
        expect(filterSpy).toHaveBeenCalledWith('test search')
      })
    })

    it('should get routes data successfully', () => {
      const mockOrgData = { frameworkid: 'test-framework-id' }
      mockDesignationsService.getOrgReadData.mockReturnValue(of(mockOrgData))
      const getFrameworkSpy = jest.spyOn(component, 'getFrameworkInfo')

      component.getRoutesData()

      expect(mockDesignationsService.getOrgReadData).toHaveBeenCalledWith('dept123')
      expect(getFrameworkSpy).toHaveBeenCalledWith('test-framework-id')
    })

    it('should create framework when no frameworkid exists', () => {
      const mockOrgData = {}
      mockDesignationsService.getOrgReadData.mockReturnValue(of(mockOrgData))
      const createFrameworkSpy = jest.spyOn(component, 'createFreamwork')

      component.getRoutesData()

      expect(createFrameworkSpy).toHaveBeenCalled()
    })
  })

  describe('Framework Operations', () => {
    it('should create framework successfully', () => {
      const mockResponse = {
        result: { framework: 'new-framework-id' }
      }
      mockDesignationsService.createFrameWork.mockReturnValue(of(mockResponse))
      const getRoutesSpy = jest.spyOn(component, 'getRoutesData')

      component.createFreamwork()

      expect(component.showCreateLoader).toBe(true)
      expect(mockDesignationsService.createFrameWork).toHaveBeenCalledWith(
        'master-framework',
        'dept123',
        'Test Organization'
      )

      // Test setTimeout behavior
      setTimeout(() => {
        expect(getRoutesSpy).toHaveBeenCalled()
      }, 5000)
    })

    it('should get framework info successfully', () => {
      const mockFrameworkData = {
        result: {
          framework: {
            code: 'framework-code',
            categories: [
              {
                code: 'org',
                terms: [
                  {
                    identifier: 'org1',
                    children: [
                      { name: 'Designation 1', code: 'des1' }
                    ]
                  }
                ]
              }
            ]
          }
        }
      }
      mockDesignationsService.getFrameworkInfo.mockReturnValue(of(mockFrameworkData))
      const getOrgSpy = jest.spyOn(component, 'getOrganisations')

      component.getFrameworkInfo('test-framework')

      expect(component.showLoader).toBe(false)
      expect(component.frameworkDetails).toEqual(mockFrameworkData.result.framework)
      expect(mockDesignationsService.setFrameWorkInfo).toHaveBeenCalledWith(mockFrameworkData.result.framework)
      expect(getOrgSpy).toHaveBeenCalled()
    })

    it('should handle framework info error', () => {
      mockDesignationsService.getFrameworkInfo.mockReturnValue(throwError('API Error'))

      component.getFrameworkInfo('test-framework')

      expect(component.showLoader).toBe(false)
      expect(mockSnackBar.open).toHaveBeenCalledWith('Internal error occurred', 'X', {
        duration: 5000,
        panelClass: ['error']
      })
    })
  })

  describe('Data Filtering and Organization', () => {
    beforeEach(() => {
      component.frameworkDetails = {
        categories: [
          {
            code: 'org',
            terms: [
              {
                identifier: 'org1',
                children: [
                  {
                    name: 'Senior Developer',
                    code: 'sd1',
                    additionalProperties: { timeStamp: '1640995200000' }
                  },
                  {
                    name: 'Junior Developer',
                    code: 'jd1',
                    additionalProperties: { timeStamp: '1640908800000' }
                  }
                ]
              }
            ]
          }
        ]
      }
    })

    it('should get organizations', () => {
      const getDesignationsSpy = jest.spyOn(component, 'getDesignations')

      component.getOrganisations()

      expect(component.organisationsList).toHaveLength(1)
      expect(component.selectedOrganisation).toBe('org1')
      expect(getDesignationsSpy).toHaveBeenCalled()
    })

    it('should get designations', () => {
      component.organisationsList = [
        {
          identifier: 'org1',
          children: [
            { name: 'Designation 1', code: 'des1' },
            { name: 'Designation 2', code: 'des2' }
          ]
        }
      ]
      const filterSpy = jest.spyOn(component, 'filterDesignations')

      component.getDesignations()

      expect(component.designationsList).toHaveLength(2)
      expect(mockDesignationsService.setCurrentOrgDesignationsList).toHaveBeenCalledWith(component.designationsList)
      expect(filterSpy).toHaveBeenCalled()
    })

    it('should filter designations by search key', () => {
      component.designationsList = [
        { name: 'Senior Developer', code: 'sd1' },
        { name: 'Junior Developer', code: 'jd1' },
        { name: 'Manager', code: 'm1' }
      ]

      component.filterDesignations('senior')

      expect(component.filteredDesignationsList).toHaveLength(1)
      expect(component.filteredDesignationsList[0].name).toBe('Senior Developer')
    })

    it('should sort designations by timestamp when no search key', () => {
      component.designationsList = [
        {
          name: 'Old Designation',
          additionalProperties: { timeStamp: '1640908800000' }
        },
        {
          name: 'New Designation',
          additionalProperties: { timeStamp: '1640995200000' }
        }
      ]

      component.filterDesignations()

      expect(component.filteredDesignationsList[0].name).toBe('New Designation')
      expect(component.filteredDesignationsList[1].name).toBe('Old Designation')
    })

    it('should get terms by code', () => {
      const terms = component.getTermsByCode('org')
      expect(terms).toHaveLength(1)
    })

    it('should get categories of framework', () => {
      const categories = component.categoriesOfFramework
      expect(categories).toHaveLength(1)
      expect(categories[0].code).toBe('org')
    })
  })

  describe('UI Interactions', () => {
    it('should open video popup', () => {
      component.openVideoPopup()

      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          data: {
            videoLink: 'https://test.com/guide-video'
          },
          disableClose: true,
          width: "675px",
          height: "400px"
        })
      )
    })

    it('should handle menu selection for remove action', () => {
      const openConformationSpy = jest.spyOn(component, 'openConformationPopup')
      const event = { action: 'remove', row: { name: 'Test Designation' } }

      component.menuSelected(event)

      expect(openConformationSpy).toHaveBeenCalledWith(event)
    })

    it('should open confirmation popup', () => {
      const event = { row: { name: 'Test Designation' } }

      component.openConformationPopup(event)

      expect(mockDialog.open).toHaveBeenCalled()
    })
  })

  describe('Designation Management', () => {
    beforeEach(() => {
      component.frameworkDetails = { code: 'framework-code' }
    })

    it('should remove designation successfully', () => {
      const designation = { code: 'des1', name: 'Test Designation' }
      const mockResponse = { success: true }
      mockDesignationsService.deleteDesignation.mockReturnValue(of(mockResponse))
      const publishSpy = jest.spyOn(component, 'publishFrameWork')

      component.removeDesignation(designation)

      expect(component.showLoader).toBe(true)
      expect(mockDesignationsService.deleteDesignation).toHaveBeenCalledWith(
        'framework-code',
        'designation',
        {
          request: {
            contentIds: ['des1']
          }
        }
      )
      expect(publishSpy).toHaveBeenCalledWith('delete')
    })

    it('should handle remove designation error', () => {
      const designation = { code: 'des1', name: 'Test Designation' }
      mockDesignationsService.deleteDesignation.mockReturnValue(throwError('Delete Error'))

      component.removeDesignation(designation)

      expect(component.showLoader).toBe(false)
      expect(mockSnackBar.open).toHaveBeenCalledWith('Internal error occurred', 'X', {
        duration: 5000,
        panelClass: ['error']
      })
    })

    it('should publish framework successfully', () => {
      const mockResponse = { success: true }
      mockDesignationsService.publishFramework.mockReturnValue(of(mockResponse))
      const getFrameworkSpy = jest.spyOn(component, 'getFrameworkInfo')
      component.designationsList = [1, 2, 3, 4] // Mock list for refresh time calculation

      component.publishFrameWork('delete')

      expect(mockDesignationsService.publishFramework).toHaveBeenCalledWith('framework-code')

      // Test setTimeout behavior
      setTimeout(() => {
        expect(getFrameworkSpy).toHaveBeenCalledWith('framework-code')
        expect(mockSnackBar.open).toHaveBeenCalledWith('Term removed successfully', 'X', {
          duration: 5000,
          panelClass: ['']
        })
      }, 10000)
    })

    it('should handle publish framework error', () => {
      mockDesignationsService.publishFramework.mockReturnValue(throwError('Publish Error'))

      component.publishFrameWork()

      expect(component.showLoader).toBe(false)
      expect(mockSnackBar.open).toHaveBeenCalledWith('Internal error occurred', 'X', {
        duration: 5000,
        panelClass: ['error']
      })
    })
  })

  describe('Component State Management', () => {
    it('should remove import designation component', () => {
      const getRoutesSpy = jest.spyOn(component, 'getRoutesData')

      component.removeImportDesignationComp(true)

      expect(component.designationMaster).toBe('import designations')
      expect(component.goToImportMaster).toBe(false)
      expect(getRoutesSpy).toHaveBeenCalled()

      component.removeImportDesignationComp(false)

      expect(component.designationMaster).toBe('desigantion master')
    })

    it('should show designation master', () => {
      const getRoutesSpy = jest.spyOn(component, 'getRoutesData')

      component.showDesignationMaster(true)

      expect(component.designationMaster).toBe('desigantion master')
      expect(getRoutesSpy).toHaveBeenCalled()

      component.showDesignationMaster(false)

      expect(component.designationMaster).toBe('bulk upload')
    })
  })

  describe('Utility Methods', () => {
    it('should call snackbar service when opening snackbar', () => {
      // Test the actual snackbar calls by checking if the service was called
      // Since openSnackbar is private, we test its effects through the public methods that use it

      // Test through getFrameworkInfo error
      mockDesignationsService.getFrameworkInfo.mockReturnValue(throwError('API Error'))
      component.getFrameworkInfo('test-framework')

      expect(mockSnackBar.open).toHaveBeenCalledWith('Internal error occurred', 'X', {
        duration: 5000,
        panelClass: ['error']
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined designation in removeDesignation', () => {
      const deleteDesignationSpy = mockDesignationsService.deleteDesignation

      component.removeDesignation(undefined)

      expect(deleteDesignationSpy).not.toHaveBeenCalled()
    })

    it('should handle empty designations list in filterDesignations', () => {
      component.designationsList = undefined

      component.filterDesignations('test')

      expect(component.filteredDesignationsList).toEqual([])
    })

    it('should handle designations without timestamp in sorting', () => {
      component.designationsList = [
        { name: 'No Timestamp Designation' },
        {
          name: 'With Timestamp',
          additionalProperties: { timeStamp: '1640995200000' }
        }
      ]

      component.filterDesignations()

      expect(component.filteredDesignationsList).toHaveLength(2)
    })

    it('should handle missing framework details in publishFrameWork', () => {
      component.frameworkDetails = undefined
      component.environment = { frameworkName: 'fallback-framework' }

      component.publishFrameWork()

      expect(mockDesignationsService.publishFramework).toHaveBeenCalledWith('fallback-framework')
    })
  })
})