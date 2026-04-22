import { of, throwError } from 'rxjs'
import { OnboardingCoursesComponent } from './onboarding-courses.component'

const mockMarketPlaceSvc = {
  getContentList: jest.fn(),
  getCoursesList: jest.fn(),
  deleteUnPublishedCourses: jest.fn(),
  downloadLogs: jest.fn(),
}

const mockDatePipe = {
  transform: jest.fn().mockReturnValue('01 Jan 2024 10:00 AM'),
}

const mockSnackBar = {
  openFromComponent: jest.fn(),
}

function createComponent() {
  return new OnboardingCoursesComponent(
    mockMarketPlaceSvc as any,
    mockDatePipe as any,
    mockSnackBar as any,
  )
}

describe('OnboardingCoursesComponent', () => {
  let component: OnboardingCoursesComponent

  beforeEach(() => {
    jest.clearAllMocks()
    component = createComponent()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize table data', () => {
      component.providerDetails = { id: '1', data: { partnerCode: 'ABC' } }
      mockMarketPlaceSvc.getContentList.mockReturnValue(of([]))
      mockMarketPlaceSvc.getCoursesList.mockReturnValue(of({ totalCount: 0, data: [] }))
      component.ngOnInit()
      expect(component.contentTableData).toBeDefined()
      expect(component.unPublishedCoursesTableData).toBeDefined()
      expect(component.publishedCoursesTableData).toBeDefined()
    })

    it('should not call getTablesData if no providerDetails', () => {
      const spy = jest.spyOn(component, 'getTablesData')
      component.ngOnInit()
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('ngOnChanges', () => {
    it('should call getTablesData when providerDetails changes', () => {
      const spy = jest.spyOn(component, 'getTablesData')
      mockMarketPlaceSvc.getContentList.mockReturnValue(of([]))
      mockMarketPlaceSvc.getCoursesList.mockReturnValue(of({ totalCount: 0, data: [] }))
      component.tableDataInitialization()
      component.ngOnChanges({
        providerDetails: {
          currentValue: { id: '1', data: { partnerCode: 'ABC' } },
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      })
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('tableDataInitialization', () => {
    it('should set up table data structures', () => {
      component.tableDataInitialization()
      expect(component.contentTableData.columns.length).toBeGreaterThan(0)
      expect(component.contenetMenuItems.length).toBeGreaterThan(0)
    })
  })

  describe('getTablesData', () => {
    it('should call all three data fetch methods', () => {
      const spyContent = jest.spyOn(component, 'getContentList')
      const spyPublished = jest.spyOn(component, 'getPublishedCoursesList')
      const spyUnpublished = jest.spyOn(component, 'getUnPublishedCoursesList')
      mockMarketPlaceSvc.getContentList.mockReturnValue(of([]))
      mockMarketPlaceSvc.getCoursesList.mockReturnValue(of({ totalCount: 0, data: [] }))
      component.tableDataInitialization()
      component.getTablesData()
      expect(spyContent).toHaveBeenCalled()
      expect(spyPublished).toHaveBeenCalled()
      expect(spyUnpublished).toHaveBeenCalled()
    })
  })

  describe('getContentList', () => {
    it('should set uploadedContentList on success', () => {
      component.providerDetails = { id: 'pid', data: {} }
      const mockResponse = [
        { status: 'success', fileName: 'file.csv', initiatedOn: '2024-01-01', completedOn: '2024-01-02', gcpfileName: 'gcp.csv' }
      ]
      mockMarketPlaceSvc.getContentList.mockReturnValue(of(mockResponse))
      component.getContentList()
      expect(component.uploadedContentList.length).toBe(1)
      expect(component.showUploadedStatusLoader).toBe(false)
    })

    it('should show snackBar on error', () => {
      component.providerDetails = { id: 'pid', data: {} }
      mockMarketPlaceSvc.getContentList.mockReturnValue(throwError(() => ({ error: { params: { errMsg: 'Content error' } } })))
      component.getContentList()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should not call service if no providerDetails', () => {
      component.providerDetails = null
      component.getContentList()
      expect(mockMarketPlaceSvc.getContentList).not.toHaveBeenCalled()
    })
  })

  describe('formateContentList', () => {
    it('should format content list correctly', () => {
      const data = [
        { status: 'success', fileName: 'file.csv', initiatedOn: '2024-01-01T10:00:00', completedOn: '2024-01-02T10:00:00', gcpfileName: 'gcp.csv' },
        { status: 'InProgress', fileName: 'file2.csv', initiatedOn: '2024-01-03T10:00:00', completedOn: '2024-01-04T10:00:00', gcpfileName: 'gcp2.csv' },
        { status: 'failed', fileName: 'file3.csv', initiatedOn: '2024-01-05T10:00:00', completedOn: '2024-01-06T10:00:00', gcpfileName: 'gcp3.csv' },
      ]
      const result = component.formateContentList(data)
      // sorted by date descending: 2024-01-05 (failed), 2024-01-03 (InProgress), 2024-01-01 (success)
      expect(result[0].status).toBe('Failed')
      expect(result[1].status).toBe('In Progress')
      expect(result[2].status).toBe('Live')
    })

    it('should return empty list for falsy input', () => {
      expect(component.formateContentList(null)).toEqual([])
    })
  })

  describe('getPublishedCoursesList', () => {
    it('should fetch published courses when partnerCode is set', () => {
      component.providerDetails = { data: { partnerCode: 'ABC' } }
      const mockRes = { totalCount: 2, data: [{ name: 'Course1', isActive: true }] }
      mockMarketPlaceSvc.getCoursesList.mockReturnValue(of(mockRes))
      component.tableDataInitialization()
      component.getPublishedCoursesList()
      expect(component.publishedCoursesList.length).toBe(1)
    })

    it('should show snackBar on error (non-index_not_found)', () => {
      component.providerDetails = { data: { partnerCode: 'ABC' } }
      mockMarketPlaceSvc.getCoursesList.mockReturnValue(throwError(() => ({
        status: 500,
        error: { params: { errMsg: 'Server error' }, message: 'Some error' }
      })))
      component.tableDataInitialization()
      component.getPublishedCoursesList()
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should not show snackBar for index_not_found_exception 400 error', () => {
      component.providerDetails = { data: { partnerCode: 'ABC' } }
      const error = { status: 400, error: { params: { errMsg: 'Not found' }, message: 'index_not_found_exception' } }
      mockMarketPlaceSvc.getCoursesList.mockReturnValue(throwError(error))
      component.tableDataInitialization()
      component.getPublishedCoursesList()
      expect(mockSnackBar.openFromComponent).not.toHaveBeenCalled()
    })
  })

  describe('getUnPublishedCoursesList', () => {
    it('should fetch unpublished courses when partnerCode is set', () => {
      component.providerDetails = { data: { partnerCode: 'ABC' } }
      const mockRes = { totalCount: 1, data: [{ name: 'DraftCourse', isActive: false }] }
      mockMarketPlaceSvc.getCoursesList.mockReturnValue(of(mockRes))
      component.tableDataInitialization()
      component.getUnPublishedCoursesList()
      expect(component.unPublishedCoursesList.length).toBe(1)
    })

    it('should not fetch if partnerCode is missing', () => {
      component.providerDetails = { data: {} }
      component.getUnPublishedCoursesList()
      expect(mockMarketPlaceSvc.getCoursesList).not.toHaveBeenCalled()
    })
  })

  describe('formateCoursesList', () => {
    it('should format courses correctly', () => {
      const courses = [
        { externalId: 'ext1', name: 'Course1', appIcon: '', source: 'S1', isActive: true, publishedOn: '2024-01-01', createdDate: '2024-01-01' }
      ]
      const result = component.formateCoursesList(courses)
      expect(result[0].courseName).toBe('Course1')
      expect(result[0].courseStatus).toBe('Published')
    })

    it('should handle N/A for invalid dates', () => {
      const courses = [
        { externalId: 'ext2', name: 'Course2', appIcon: '', source: 'S2', isActive: false, publishedOn: 'invalid', createdDate: '' }
      ]
      const result = component.formateCoursesList(courses)
      expect(result[0].publishedOn).toBe('N/A')
      expect(result[0].listedOn).toBe('N/A')
    })
  })

  describe('setPagination', () => {
    it('should set published pagination details', () => {
      component.tableDataInitialization()
      const pagination = { currentPage: 2, pageSize: 10, totalCount: 50 }
      component.setPagination('published', pagination)
      expect(component.publishedCoursesTablePaginationDetails.currentPage).toBe(2)
    })

    it('should set notPublished pagination details', () => {
      component.tableDataInitialization()
      const pagination = { currentPage: 3, pageSize: 20, totalCount: 60 }
      component.setPagination('notPublished', pagination)
      expect(component.unPublishedCoursesTablePaginationDetails.currentPage).toBe(3)
    })
  })

  describe('searchCourses', () => {
    it('should call getPublishedCoursesList for published search', () => {
      const spy = jest.spyOn(component, 'getPublishedCoursesList')
      mockMarketPlaceSvc.getCoursesList.mockReturnValue(of({ totalCount: 0, data: [] }))
      component.tableDataInitialization()
      component.searchCourses(true, 'test')
      expect(spy).toHaveBeenCalled()
      expect(component.publishedCoursesSerachKey).toBe('test')
    })

    it('should call getUnPublishedCoursesList for unpublished search', () => {
      const spy = jest.spyOn(component, 'getUnPublishedCoursesList')
      mockMarketPlaceSvc.getCoursesList.mockReturnValue(of({ totalCount: 0, data: [] }))
      component.tableDataInitialization()
      component.searchCourses(false, 'draft')
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('pageChange', () => {
    it('should update published pagination and refresh', () => {
      const spy = jest.spyOn(component, 'getPublishedCoursesList')
      mockMarketPlaceSvc.getCoursesList.mockReturnValue(of({ totalCount: 0, data: [] }))
      component.tableDataInitialization()
      component.pageChange({ currentPage: 2 }, 'published')
      expect(spy).toHaveBeenCalled()
    })

    it('should update notPublished pagination and refresh', () => {
      const spy = jest.spyOn(component, 'getUnPublishedCoursesList')
      mockMarketPlaceSvc.getCoursesList.mockReturnValue(of({ totalCount: 0, data: [] }))
      component.tableDataInitialization()
      component.pageChange({ currentPage: 3 }, 'notPublished')
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('contentEvents', () => {
    it('should call deletedSelectedCourses for delete action', () => {
      const spy = jest.spyOn(component, 'deletedSelectedCourses')
      component.providerDetails = { data: { partnerCode: 'ABC' } }
      mockMarketPlaceSvc.deleteUnPublishedCourses.mockReturnValue(of({ result: 'ok' }))
      mockMarketPlaceSvc.getCoursesList.mockReturnValue(of({ totalCount: 0, data: [] }))
      component.tableDataInitialization()
      component.contentEvents({ action: 'delete', rows: [] })
      expect(spy).toHaveBeenCalled()
    })

    it('should call getTablesData for refresh action', () => {
      const spy = jest.spyOn(component, 'getTablesData')
      mockMarketPlaceSvc.getContentList.mockReturnValue(of([]))
      mockMarketPlaceSvc.getCoursesList.mockReturnValue(of({ totalCount: 0, data: [] }))
      component.tableDataInitialization()
      component.contentEvents({ action: 'refresh', rows: null })
      expect(spy).toHaveBeenCalled()
    })

    it('should call downloadLog for downloadLog action with gcpfileName', () => {
      const spy = jest.spyOn(component, 'downloadLog')
      mockMarketPlaceSvc.downloadLogs.mockReturnValue(of(new Blob()))
      component.contentEvents({ action: 'downloadLog', rows: { gcpfileName: 'file.csv', name: 'file' } })
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('deletedSelectedCourses', () => {
    it('should delete selected courses and show success', () => {
      jest.useFakeTimers()
      component.providerDetails = { data: { partnerCode: 'ABC' } }
      mockMarketPlaceSvc.deleteUnPublishedCourses.mockReturnValue(of(true))
      mockMarketPlaceSvc.getCoursesList.mockReturnValue(of({ totalCount: 0, data: [] }))
      component.tableDataInitialization()
      component.deletedSelectedCourses({ rows: [{ id: 'e1' }] })
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
      jest.useRealTimers()
    })

    it('should show error on delete failure', () => {
      component.providerDetails = { data: { partnerCode: 'ABC' } }
      mockMarketPlaceSvc.deleteUnPublishedCourses.mockReturnValue(throwError(() => ({ error: { params: { errMsg: 'Delete failed' } } })))
      component.deletedSelectedCourses({ rows: [{ id: 'e1' }] })
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should show snackBar when no rows selected', () => {
      component.deletedSelectedCourses({ rows: [] })
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })

  describe('downloadLog', () => {
    it('should download blob and show success', () => {
      const mockBlob = new Blob(['content'], { type: 'text/csv' })
      mockMarketPlaceSvc.downloadLogs.mockReturnValue(of(mockBlob))
      const mockUrl = 'blob:http://localhost/fake'
      URL.createObjectURL = jest.fn().mockReturnValue(mockUrl)
      URL.revokeObjectURL = jest.fn()
      document.createElement = jest.fn().mockReturnValue({
        href: '', download: '', click: jest.fn()
      }) as any
      component.downloadLog('gcp.csv', 'file')
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })

    it('should show error on download failure', () => {
      mockMarketPlaceSvc.downloadLogs.mockReturnValue(throwError(() => ({ error: { params: { errMsg: 'Download failed' } } })))
      component.downloadLog('gcp.csv', 'file')
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })

  describe('addCourses', () => {
    it('should set addCoursesFlag to true', () => {
      component.addCourses()
      expect(component.addCoursesFlag).toBe(true)
    })
  })

  describe('actionHandler', () => {
    it('should set addCoursesFlag to false on goBack action', () => {
      component.addCoursesFlag = true
      mockMarketPlaceSvc.getContentList.mockReturnValue(of([]))
      mockMarketPlaceSvc.getCoursesList.mockReturnValue(of({ totalCount: 0, data: [] }))
      component.tableDataInitialization()
      component.actionHandler({ action: 'goBack' })
      expect(component.addCoursesFlag).toBe(false)
    })
  })

  describe('showSnackBar', () => {
    it('should call snackBar.openFromComponent', () => {
      component.showSnackBar('Test message', 'success')
      expect(mockSnackBar.openFromComponent).toHaveBeenCalled()
    })
  })
})

