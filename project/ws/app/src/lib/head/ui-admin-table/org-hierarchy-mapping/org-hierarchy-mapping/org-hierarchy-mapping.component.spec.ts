import { OrgHierarchyMappingComponent } from './org-hierarchy-mapping.component'
import { FormControl } from '@angular/forms'
import { of, throwError, Subject } from 'rxjs'

// Mock dependencies
const mockSnackBar = {
  open: jest.fn()
}

const mockOrgHieService = {
  getCenterOrStateList: jest.fn(),
  createMasterFrameWork: jest.fn(),
  downloadSampleTemplate: jest.fn(),
  exportFramework: jest.fn(),
  uploadFreameworkTemplate: jest.fn(),
  getOrgReadData: jest.fn(),
  getOrganizationDetails: jest.fn()
}

const mockLoaderService = {
  setLoaderState: jest.fn()
}

const mockRouter = {
  navigate: jest.fn()
}

const mockActiveRoute = {
  snapshot: {
    parent: {
      data: {
        configService: {
          userRoles: new Set(['state_admin']),
          userProfile: {
            rootOrgId: 'test-org-id'
          }
        }
      }
    }
  }
}

const mockDialog = {
  open: jest.fn().mockReturnValue({
    afterClosed: jest.fn().mockReturnValue(of({}))
  })
}

const mockMatSelect = {
  openedChange: of(true),
  close: jest.fn()
}

const mockElementRef = {
  nativeElement: {
    focus: jest.fn(),
    value: ''
  }
}

describe('OrgHierarchyMappingComponent', () => {
  let component: OrgHierarchyMappingComponent

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Create component instance
    component = new OrgHierarchyMappingComponent(
      mockSnackBar as any,
      mockOrgHieService as any,
      mockLoaderService as any,
      mockRouter as any,
      mockActiveRoute as any,
      mockDialog as any
    )

    // Setup ViewChild mocks
    component.singleSelect = mockMatSelect as any
    component.searchInput = mockElementRef as any
    component.fileInput = mockElementRef as any

    // Initialize component properties
    component.organizationCtrl = new FormControl()
    component.searchControl = new FormControl()
  })

  describe('Component Initialization', () => {
    test('should create component with default values', () => {
      expect(component).toBeDefined()
      expect(component.selectedOrgType).toBe('state')
      expect(component.bulkUploadRefresh).toBe(false)
      expect(component.orgTypeList).toEqual([
        { name: 'Center', value: 'ministry' },
        { name: 'State', value: 'state' }
      ])
    })

    test('should initialize form controls', () => {
      expect(component.organizationCtrl).toBeInstanceOf(FormControl)
      expect(component.searchControl).toBeInstanceOf(FormControl)
    })
  })

  describe('Getters', () => {
    test('should return user roles from activeRoute', () => {
      const userRoles = component.userRoles
      expect(userRoles).toEqual(new Set(['state_admin']))
    })

    test('should return orgId from activeRoute', () => {
      const orgId = component.orgId
      expect(orgId).toBe('test-org-id')
    })
  })

  describe('ngOnInit', () => {
    test('should call getOrgReadAndDetails for state admin', () => {
      jest.spyOn(component, 'checkIfStateAdmin').mockReturnValue(true)
      jest.spyOn(component, 'getOrgReadAndDetails').mockImplementation()

      component.ngOnInit()

      expect(component.getOrgReadAndDetails).toHaveBeenCalled()
    })

    test('should setup search control subscription for non-state admin', () => {
      jest.spyOn(component, 'checkIfStateAdmin').mockReturnValue(false)
      jest.spyOn(component, 'getCentenrOrStateList').mockImplementation()

      component.ngOnInit()

      // Simulate search control value change
      component.searchControl.setValue('test search')

      setTimeout(() => {
        expect(component.getCentenrOrStateList).toHaveBeenCalledWith('state', 'test search')
      }, 800)
    })

    test('should call getCentenrOrStateList with selectedOrgType for non-state admin', () => {
      jest.spyOn(component, 'checkIfStateAdmin').mockReturnValue(false)
      jest.spyOn(component, 'getCentenrOrStateList').mockImplementation()

      component.ngOnInit()

      expect(component.getCentenrOrStateList).toHaveBeenCalledWith('state', '')
    })
  })

  describe('ngAfterViewInit', () => {
    test('should focus search input when dropdown opens', (done) => {
      const openedChangeSubject = new Subject<boolean>()
      //component.singleSelect.openedChange = openedChangeSubject.asObservable()

      component.ngAfterViewInit()

      openedChangeSubject.next(true)

      setTimeout(() => {
        expect(component.searchInput.nativeElement.focus).toHaveBeenCalled()
        done()
      }, 10)
    })

    test('should reset search control when dropdown closes', () => {
      const openedChangeSubject = new Subject<boolean>()
      // component.singleSelect.openedChange = openedChangeSubject.asObservable()

      component.ngAfterViewInit()

      openedChangeSubject.next(false)

      expect(component.searchControl.value).toBe('')
    })
  })

  describe('filterOrganizations', () => {
    beforeEach(() => {
      component.allOrganizations = [
      ]
    })

    test('should return all organizations when no filter value', () => {
      component.filterOrganizations('')
      expect(component.filteredOrganizations).toEqual(component.allOrganizations)
    })

    test('should filter organizations by name', () => {
      component.filterOrganizations('Test')
      expect(component.filteredOrganizations).toHaveLength(2)
      expect(component.filteredOrganizations[0].orgName).toBe('Test Organization 1')
      expect(component.filteredOrganizations[1].orgName).toBe('Test Organization 2')
    })

    test('should be case insensitive', () => {
      component.filterOrganizations('test')
      expect(component.filteredOrganizations).toHaveLength(2)
    })
  })

  describe('orgSelected', () => {
    test('should reset organization control and update selectedOrgType', () => {
      jest.spyOn(component.organizationCtrl, 'reset')
      jest.spyOn(component, 'getCentenrOrStateList').mockImplementation()

      component.selectedOrgType = 'state'
      component.orgSelected('ministry')

      expect(component.organizationCtrl.reset).toHaveBeenCalled()
      expect(component.selectedOrgType).toBe('ministry')
      expect(component.getCentenrOrStateList).toHaveBeenCalledWith('ministry')
    })

    test('should not call getCentenrOrStateList if same org type selected', () => {
      jest.spyOn(component, 'getCentenrOrStateList').mockImplementation()

      component.selectedOrgType = 'state'
      component.orgSelected('state')

      expect(component.getCentenrOrStateList).not.toHaveBeenCalled()
    })
  })

  describe('getCentenrOrStateList', () => {
    const mockResponse = {
      result: {
        response: {
          content: [
            { identifier: '1', orgName: 'Org 1' },
            { identifier: '2', orgName: 'Org 2' }
          ]
        }
      }
    }

    test('should fetch ministry organizations', async () => {
      mockOrgHieService.getCenterOrStateList.mockReturnValue(of(mockResponse))

      await component.getCentenrOrStateList('ministry', 'search')

      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(true)
      expect(mockOrgHieService.getCenterOrStateList).toHaveBeenCalledWith({
        request: {
          filters: {
            status: 1,
            sbOrgType: 'ministry',
          },
          sort_by: {
            createdDate: "desc"
          },
          query: 'search',
          limit: 200,
          offset: 0,
          fields: [
            'identifier',
            'orgName',
            'description',
            'parentOrgName',
            'orgHierarchyFrameworkId',
            'orgHierarchyFrameworkStatus',
            'sbOrgType',
            'sbOrgSubType'
          ]
        }
      })
      expect(component.allOrganizations).toEqual(mockResponse.result.response.content)
      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(false)
    })

    test('should fetch state organizations', async () => {
      mockOrgHieService.getCenterOrStateList.mockReturnValue(of(mockResponse))

      await component.getCentenrOrStateList('state')

      const expectedRequestBody = expect.objectContaining({
        request: expect.objectContaining({
          filters: expect.objectContaining({
            sbOrgType: 'state'
          })
        })
      })

      expect(mockOrgHieService.getCenterOrStateList).toHaveBeenCalledWith(expectedRequestBody)
    })

    test('should handle empty response', async () => {
      mockOrgHieService.getCenterOrStateList.mockReturnValue(of({ result: { response: { content: [] } } }))

      await component.getCentenrOrStateList('state')

      expect(component.allOrganizations).toEqual([])
      expect(component.filteredOrganizations).toEqual([])
    })

    test('should handle error response', async () => {
      mockOrgHieService.getCenterOrStateList.mockReturnValue(throwError('API Error'))

      await component.getCentenrOrStateList('state')

      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(false)
    })
  })

  describe('getOrgDetails', () => {
    test('should return null if no organization selected', () => {
      component.organizationCtrl.setValue(null)
      const result = component.getOrgDetails()
      expect(result).toBeNull()
    })

    test('should return orgReadData for state admin', () => {
      jest.spyOn(component, 'checkIfStateAdmin').mockReturnValue(true)
      component.orgReadData = { id: '1', orgName: 'Test Org' }
      component.organizationCtrl.setValue('1')

      const result = component.getOrgDetails()
      expect(result).toEqual(component.orgReadData)
    })

    test('should return selected organization for non-state admin', () => {
      jest.spyOn(component, 'checkIfStateAdmin').mockReturnValue(false)
      component.filteredOrganizations = [
        { identifier: '1', orgName: 'Org 1' },
        { identifier: '2', orgName: 'Org 2' }
      ]
      component.organizationCtrl.setValue('2')

      const result = component.getOrgDetails()
      expect(result).toEqual({ identifier: '2', orgName: 'Org 2' })
    })
  })

  describe('hasOrgHierarchyFrameworkId', () => {
    test('should return false if no organization selected', () => {
      component.organizationCtrl.setValue(null)
      const result = component.hasOrgHierarchyFrameworkId()
      expect(result).toBe(false)
    })

    test('should return true if organization has framework id', () => {
      jest.spyOn(component, 'checkIfStateAdmin').mockReturnValue(false)
      component.filteredOrganizations = [
        { identifier: '1', orgName: 'Org 1', orgHierarchyFrameworkId: 'framework-1' }
      ]
      component.organizationCtrl.setValue('1')

      const result = component.hasOrgHierarchyFrameworkId()
      expect(result).toBe(true)
    })

    test('should return false if organization has no framework id', () => {
      jest.spyOn(component, 'checkIfStateAdmin').mockReturnValue(false)
      component.filteredOrganizations = [
        { identifier: '1', orgName: 'Org 1', orgHierarchyFrameworkId: null }
      ]
      component.organizationCtrl.setValue('1')

      const result = component.hasOrgHierarchyFrameworkId()
      expect(result).toBe(false)
    })
  })

  describe('cancelHierarchyCreation', () => {
    test('should reset form and close dropdown', () => {
      jest.spyOn(component.organizationCtrl, 'reset')
      component.allOrganizations = []

      component.cancelHierarchyCreation()

      expect(component.organizationCtrl.reset).toHaveBeenCalled()
      expect(component.filteredOrganizations).toEqual(component.allOrganizations)
      expect(component.singleSelect.close).toHaveBeenCalled()
    })
  })

  describe('createNewHierarchy', () => {
    const mockSelectedOrg = { identifier: '1', orgName: 'Test Org' }

    test('should create framework for non-state admin', async () => {
      jest.spyOn(component, 'checkIfStateAdmin').mockReturnValue(false)
      jest.spyOn(component, 'getOrgDetails').mockReturnValue(mockSelectedOrg)
      jest.spyOn(component, 'cancelHierarchyCreation').mockImplementation()
      jest.spyOn(component, 'getCentenrOrStateList').mockImplementation()

      const mockResponse = { result: { framework: { id: 'framework-1' } } }
      mockOrgHieService.createMasterFrameWork.mockReturnValue(of(mockResponse))

      await component.createNewHierarchy()

      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(true)
      expect(mockOrgHieService.createMasterFrameWork).toHaveBeenCalledWith({
        frameworkName: 'org_hierarchy',
        identifier: '1'
      })
      expect(component.cancelHierarchyCreation).toHaveBeenCalled()
    })

    test('should create framework for state admin', async () => {
      jest.spyOn(component, 'checkIfStateAdmin').mockReturnValue(true)
      component.orgReadData = { id: '1', orgName: 'Test Org' }
      jest.spyOn(component, 'cancelHierarchyCreation').mockImplementation()

      const mockResponse = { result: { framework: { id: 'framework-1' } } }
      mockOrgHieService.createMasterFrameWork.mockReturnValue(of(mockResponse))

      await component.createNewHierarchy()

      expect(mockOrgHieService.createMasterFrameWork).toHaveBeenCalledWith({
        frameworkName: 'org_hierarchy',
        identifier: '1'
      })
    })

    test('should handle error response', async () => {
      jest.spyOn(component, 'checkIfStateAdmin').mockReturnValue(false)
      jest.spyOn(component, 'getOrgDetails').mockReturnValue(mockSelectedOrg)
      jest.spyOn(component, 'cancelHierarchyCreation').mockImplementation()

      const mockError = {
        error: {
          params: {
            errMsg: 'Framework creation failed'
          }
        }
      }
      mockOrgHieService.createMasterFrameWork.mockReturnValue(throwError(mockError))

      await component.createNewHierarchy()

      expect(mockSnackBar.open).toHaveBeenCalledWith('Framework creation failed')
      expect(component.cancelHierarchyCreation).toHaveBeenCalled()
    })
  })

  describe('checkloader', () => {
    test('should set loader state', () => {
      component.checkloader(true)
      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(true)

      component.checkloader(false)
      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(false)
    })
  })

  describe('redirectOrg', () => {
    test('should navigate to roles page for state admin', () => {
      jest.spyOn(component, 'checkIfStateAdmin').mockReturnValue(true)
      const event = {
        additionalProperties: { orgId: 'org-123' },
        name: 'Test Organization'
      }

      component.redirectOrg(event)

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/roles/org-123/users'], {
        queryParams: {
          currentDept: 'organisation',
          roleId: 'org-123',
          depatName: 'Test Organization',
          orgName: 'Test Organization',
          tab: 'users',
          subOrgType: 'state'
        }
      })
    })

    test('should navigate to roles page for non-state admin', () => {
      jest.spyOn(component, 'checkIfStateAdmin').mockReturnValue(false)
      component.selectedOrgType = 'ministry'
      const event = {
        additionalProperties: { orgId: 'org-123' },
        name: 'Test Organization'
      }

      component.redirectOrg(event)

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/roles/org-123/users'], {
        queryParams: expect.objectContaining({
          subOrgType: 'ministry'
        })
      })
    })
  })

  describe('downloadTemplate', () => {
    test('should download template successfully', async () => {
      const mockFrameworkData = { orgHierarchyFrameworkId: 'framework-1' }
      jest.spyOn(component, 'getselectedOrgData').mockReturnValue(mockFrameworkData)
      mockOrgHieService.downloadSampleTemplate.mockReturnValue(of('file-data'))

      await component.downloadTemplate()

      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(true)
      expect(mockOrgHieService.downloadSampleTemplate).toHaveBeenCalledWith('framework-1')
      expect(mockSnackBar.open).toHaveBeenCalledWith('Download successfully')
    })

    test('should handle download error', async () => {
      const mockFrameworkData = { orgHierarchyFrameworkId: 'framework-1' }
      jest.spyOn(component, 'getselectedOrgData').mockReturnValue(mockFrameworkData)

      const mockError = {
        error: { params: { errMsg: 'Download failed' } }
      }
      mockOrgHieService.downloadSampleTemplate.mockReturnValue(throwError(mockError))

      await component.downloadTemplate()

      expect(mockSnackBar.open).toHaveBeenCalledWith('Download failed')
      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(false)
    })
  })

  describe('exportData', () => {
    test('should export data successfully', async () => {
      const mockFrameworkData = { orgHierarchyFrameworkId: 'framework-1', orgName: 'Test Org' }
      jest.spyOn(component, 'getselectedOrgData').mockReturnValue(mockFrameworkData)
      mockOrgHieService.exportFramework.mockReturnValue(of('export-data'))

      await component.exportData()

      expect(mockOrgHieService.exportFramework).toHaveBeenCalledWith('framework-1')
      expect(mockSnackBar.open).toHaveBeenCalledWith('Exported successfully for Test Org')
    })
  })

  describe('getselectedOrgData', () => {
    test('should return orgReadData for state admin', () => {
      jest.spyOn(component, 'checkIfStateAdmin').mockReturnValue(true)
      component.orgReadData = { id: '1', orgName: 'Test Org' }

      const result = component.getselectedOrgData()
      expect(result).toEqual(component.orgReadData)
    })

    test('should return selected organization for non-state admin', () => {
      jest.spyOn(component, 'checkIfStateAdmin').mockReturnValue(false)
      component.allOrganizations = [
      ]
      component.organizationCtrl.setValue('2')

      const result = component.getselectedOrgData()
      expect(result).toEqual({ identifier: '2', orgName: 'Org 2' })
    })

    test('should return null if no organization found', () => {
      jest.spyOn(component, 'checkIfStateAdmin').mockReturnValue(false)
      component.allOrganizations = []
      component.organizationCtrl.setValue('1')

      const result = component.getselectedOrgData()
      expect(result).toBeNull()
    })
  })

  describe('File Upload Methods', () => {
    describe('onFileSelected', () => {
      const mockFile = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      test('should process valid file', () => {
        jest.spyOn(component, 'isValidExcelFile').mockReturnValue(true)
        jest.spyOn(component, 'uploadExcelFile').mockImplementation()

        const mockEvent = { target: { files: [mockFile] } }
        component.onFileSelected(mockEvent)

        expect(component.isValidExcelFile).toHaveBeenCalledWith(mockFile)
        expect(component.uploadExcelFile).toHaveBeenCalledWith(mockFile)
      })

      test('should reject invalid file type', () => {
        jest.spyOn(component, 'isValidExcelFile').mockReturnValue(false)
        jest.spyOn(component, 'showMessage').mockImplementation()
        jest.spyOn(component, 'clearFileInput').mockImplementation()

        const mockEvent = { target: { files: [mockFile] } }
        component.onFileSelected(mockEvent)

        expect(component.showMessage).toHaveBeenCalledWith('Please select a valid Excel file (.xlsx)')
        expect(component.clearFileInput).toHaveBeenCalled()
      })

      test('should reject file size exceeding limit', () => {
        const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        jest.spyOn(component, 'isValidExcelFile').mockReturnValue(true)
        jest.spyOn(component, 'showMessage').mockImplementation()
        jest.spyOn(component, 'clearFileInput').mockImplementation()

        const mockEvent = { target: { files: [largeFile] } }
        component.onFileSelected(mockEvent)

        expect(component.showMessage).toHaveBeenCalledWith('File size should not exceed 5MB')
        expect(component.clearFileInput).toHaveBeenCalled()
      })
    })

    describe('isValidExcelFile', () => {
      test('should return true for valid Excel file', () => {
        const validFile = new File(['test'], 'test.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        const result = component.isValidExcelFile(validFile)
        expect(result).toBe(true)
      })

      test('should return false for invalid file type', () => {
        const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })

        const result = component.isValidExcelFile(invalidFile)
        expect(result).toBe(false)
      })
    })

    describe('uploadExcelFile', () => {
      const mockFile = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      test('should upload file successfully', async () => {
        jest.spyOn(component, 'getselectedOrgData').mockReturnValue({ id: '1' })
        mockOrgHieService.uploadFreameworkTemplate.mockReturnValue(of({
          result: { fileName: 'uploaded-file.xlsx' }
        }))

        await component.uploadExcelFile(mockFile)

        expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(true)
        expect(component.bulkUploadRefresh).toBe(true)
        expect(mockOrgHieService.uploadFreameworkTemplate).toHaveBeenCalled()
        expect(mockSnackBar.open).toHaveBeenCalledWith('File uploaded successfully. Please check after 5 minutes for the results.')
      })

      test('should handle upload error', async () => {
        jest.spyOn(component, 'getselectedOrgData').mockReturnValue({ id: '1' })
        const mockError = {
          error: { params: { errMsg: 'Upload failed' } }
        }
        mockOrgHieService.uploadFreameworkTemplate.mockReturnValue(throwError(mockError))

        await component.uploadExcelFile(mockFile)

        expect(mockSnackBar.open).toHaveBeenCalledWith('Upload failed')
        expect(component.bulkUploadRefresh).toBe(false)
      })
    })

    describe('clearFileInput', () => {
      test('should clear file input value', () => {
        component.clearFileInput()
        expect(component.fileInput.nativeElement.value).toBe('')
      })
    })

    describe('showMessage', () => {
      test('should display snackbar message', () => {
        component.showMessage('Test message')
        expect(mockSnackBar.open).toHaveBeenCalledWith('Test message', 'Close', {
          duration: 5000,
        })
      })
    })
  })

  describe('checkIfStateAdmin', () => {
    test('should return true if user has state_admin role', () => {
      const result = component.checkIfStateAdmin()
      expect(result).toBe(true)
    })

    test('should return false if user does not have state_admin role', () => {
      mockActiveRoute.snapshot.parent.data.configService.userRoles = new Set(['other_role'])

      const result = component.checkIfStateAdmin()
      expect(result).toBe(false)
    })
  })

  describe('getOrgReadAndDetails', () => {
    test('should fetch organization data successfully', () => {
      const mockOrgReadResponse = {
        params: { status: 'success' },
        result: {
          response: {
            id: '1',
            sbOrgType: 'state',
            ministryOrStateId: 'ministry-1'
          }
        }
      }

      const mockDetailsResponse = {
        result: {
          content: [{ id: '1', name: 'Test Organization' }]
        }
      }

      mockOrgHieService.getOrgReadData.mockReturnValue(of(mockOrgReadResponse))
      mockOrgHieService.getOrganizationDetails.mockReturnValue(of(mockDetailsResponse))

      component.getOrgReadAndDetails()

      expect(mockLoaderService.setLoaderState).toHaveBeenCalledWith(true)
      expect(mockOrgHieService.getOrgReadData).toHaveBeenCalled()
    })

    test('should handle error in organization data fetch', () => {
      const mockError = {
        error: { params: { errMsg: 'Fetch failed' } }
      }

      mockOrgHieService.getOrgReadData.mockReturnValue(throwError(mockError))

      component.getOrgReadAndDetails()

      expect(mockSnackBar.open).toHaveBeenCalledWith('Fetch failed')
    })
  })

  describe('openBulkUploadDialog', () => {
    test('should open bulk upload dialog', () => {
      jest.spyOn(component, 'getselectedOrgData').mockReturnValue({ id: '1', orgName: 'Test Org' })
      jest.spyOn(component, 'checkIfStateAdmin').mockReturnValue(false)
      jest.spyOn(component, 'getCentenrOrStateList').mockImplementation()

      component.openBulkUploadDialog()

      expect(component.bulkUploadRefresh).toBe(true)
      expect(mockDialog.open).toHaveBeenCalled()
    })

    test('should refresh data after dialog closes for state admin', async () => {
      jest.spyOn(component, 'getselectedOrgData').mockReturnValue({ id: '1' })
      jest.spyOn(component, 'checkIfStateAdmin').mockReturnValue(true)
      // jest.spyOn(component, 'getOrgReadAndDetails').mockResolvedValue()

      component.openBulkUploadDialog()

      // Wait for dialog to close
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(component.getOrgReadAndDetails).toHaveBeenCalled()
      expect(component.bulkUploadRefresh).toBe(false)
    })
  })

  describe('ngOnDestroy', () => {
    test('should complete destroy subject', () => {
      const destroySpy = jest.spyOn(component['destroy$'], 'next')
      const completeSpy = jest.spyOn(component['destroy$'], 'complete')

      component.ngOnDestroy()

      expect(destroySpy).toHaveBeenCalled()
      expect(completeSpy).toHaveBeenCalled()
    })
  })
})