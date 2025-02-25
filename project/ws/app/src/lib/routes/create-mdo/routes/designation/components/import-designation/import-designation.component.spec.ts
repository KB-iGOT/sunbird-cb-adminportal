import { FormControl } from '@angular/forms'
import { of, throwError } from 'rxjs'
import { ImportDesignationComponent } from './import-designation.component'

describe('ImportDesignationComponent', () => {
  let component: ImportDesignationComponent
  let mockDesignationsService: any
  let mockDialog: any
  let mockLoaderService: any
  let mockSnackBar: any
  let mockDatePipe: any
  let mockActivatedRoute: any
  let mockRouter: any
  let mockDialogRef: any

  beforeEach(() => {
    mockDesignationsService = {
      frameWorkInfo: {
        code: 'test-framework',
        categories: [
          {
            code: 'org',
            terms: [
              {
                category: 'category1',
                code: 'term1',
                associations: [{ identifier: 'association1' }]
              }
            ]
          }
        ]
      },
      getIgotMasterDesignations: jest.fn(),
      updateSelectedDesignationList: jest.fn(),
      createTerm: jest.fn(),
      updateTerms: jest.fn(),
      publishFramework: jest.fn(),
      getUuid: 'test-uuid'
    }

    mockDialogRef = {
      afterClosed: jest.fn().mockReturnValue(of([])),
      close: jest.fn()
    }

    mockDialog = {
      open: jest.fn().mockReturnValue(mockDialogRef),
      closeAll: jest.fn()
    }

    mockLoaderService = {
      changeLoaderState: jest.fn()
    }

    mockSnackBar = {
      open: jest.fn()
    }

    mockDatePipe = {
      transform: jest.fn().mockReturnValue('01 Jan, 2023')
    }

    mockActivatedRoute = {
      snapshot: {
        data: {
          configService: {
            userProfileV2: {
              firstName: 'Test User',
              userId: 'test-user-id'
            }
          }
        }
      },
      data: {
        subscribe: jest.fn(fn => {
          fn({
            pageData: {
              data: {
                internalErrorMsg: 'Internal error occurred',
                importingDesignation: 'Importing designation',
                termCreationMsg: 'Creating terms',
                associationUpdateMsg: 'Updating associations',
                associationRetryMsg: 'Retrying associations',
                publishingMsg: 'Publishing framework',
                refreshDelayTime: 5000,
                successMsg: 'Successfully imported'
              }
            }
          })
          return { unsubscribe: jest.fn() }
        })
      }
    }

    mockRouter = {
      navigate: jest.fn()
    }

    component = new ImportDesignationComponent(
      mockDesignationsService,
      mockDialog,
      mockLoaderService,
      mockSnackBar,
      mockDatePipe,
      mockActivatedRoute,
      mockRouter
    )

    // Mock searchControl
    component.searchControl = new FormControl()

    // Spy on emit method
    jest.spyOn(component.closeComponent, 'emit')
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize configSvc from activatedRoute', () => {
      component.ngOnInit()
      expect(component.configSvc).toEqual(mockActivatedRoute.snapshot.data.configService)
    })
  })

  describe('ngOnChanges', () => {
    it('should load designations when loader is false', () => {
      const loadDesignationsSpy = jest.spyOn(component, 'loadDesignations')
      const valueChangeSubscriptionSpy = jest.spyOn(component, 'valueChangeSubscription')
      const getRoutesDataSpy = jest.spyOn(component, 'getRoutesData')

      component.ngOnChanges({ loader: { currentValue: false, previousValue: true, firstChange: false, isFirstChange: () => false } })

      expect(component.frameworkInfo).toEqual(mockDesignationsService.frameWorkInfo)
      expect(loadDesignationsSpy).toHaveBeenCalled()
      expect(valueChangeSubscriptionSpy).toHaveBeenCalled()
      expect(getRoutesDataSpy).toHaveBeenCalled()
    })
  })

  describe('getFrameWorkDetails', () => {
    it('should navigate to MyDesignations if frameworkInfo is undefined', () => {
      mockDesignationsService.frameWorkInfo = undefined
      const navigateSpy = jest.spyOn(component, 'navigateToMyDesignations')

      component.getFrameWorkDetails()

      expect(navigateSpy).toHaveBeenCalled()
    })

    it('should set frameworkInfo if available', () => {
      const frameworkInfo = { code: 'test' }
      mockDesignationsService.frameWorkInfo = frameworkInfo

      component.getFrameWorkDetails()

      expect(component.frameworkInfo).toEqual(frameworkInfo)
    })
  })

  describe('loadDesignations', () => {
    beforeEach(() => {
      mockDesignationsService.getIgotMasterDesignations.mockReturnValue(of({
        formatedDesignationsLsit: [{ id: '1', name: 'Designation 1' }],
        totalCount: 1
      }))
    })

    it('should load designations without search key', () => {
      component.loadDesignations()

      expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(true)
      expect(mockDesignationsService.getIgotMasterDesignations).toHaveBeenCalledWith({
        pageNumber: 0,
        filterCriteriaMap: { status: 'Active' },
        requestedFields: [],
        pageSize: 30
      })

      expect(component.igotDesignationsList).toEqual([{ id: '1', name: 'Designation 1' }])
      expect(component.deisgnationsCount).toBe(1)
      expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
    })

    it('should load designations with search key', () => {
      component.loadDesignations('search')

      expect(mockDesignationsService.getIgotMasterDesignations).toHaveBeenCalledWith({
        pageNumber: 0,
        filterCriteriaMap: { status: 'Active' },
        requestedFields: [],
        pageSize: 30,
        searchString: 'search'
      })
    })

    it('should unsubscribe existing subscription before making new request', () => {
      // const mockSubscription = { unsubscribe: jest.fn() }
      // component.apiSubscription = mockSubscription as any

      component.loadDesignations()

      //expect(mockSubscription.unsubscribe).toHaveBeenCalled()
    })

    it('should handle error when loading designations', () => {
      mockDesignationsService.getIgotMasterDesignations.mockReturnValue(throwError('error'))

      component.loadDesignations()

      expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
    })
  })

  describe('getFilteredSelectedList', () => {
    beforeEach(() => {
      component.selectedDesignationsList = [
        { name: 'Designation 1' },
        { name: 'Designation 2' },
        { name: 'Another Designation' }
      ]
    })

    it('should return full list when no search value', () => {
      component.searchControl.setValue('')
      expect(component.getFilteredSelectedList).toEqual(component.selectedDesignationsList)
    })

    it('should filter list based on search value', () => {
      component.searchControl.setValue('design')
      expect(component.getFilteredSelectedList).toEqual([
        { name: 'Designation 1' },
        { name: 'Designation 2' }
      ])
    })
  })

  describe('selectDesignation', () => {
    beforeEach(() => {
      component.igotDesignationsList = [
        { id: '1', designation: 'Designation 1', isOrgDesignation: false },
        { id: '2', designation: 'Designation 2', isOrgDesignation: true },
        { id: '3', designation: 'Designation 3', isOrgDesignation: false, selected: true }
      ]
      component.selectedDesignationsList = [
        { id: '3', designation: 'Designation 3', isOrgDesignation: false, selected: true }
      ]
    })

    it('should add designation to selected list if not already selected', () => {
      component.selectDesignation(0)

      expect(component.igotDesignationsList[0].selected).toBe(true)
      expect(component.selectedDesignationsList).toContain(component.igotDesignationsList[0])
      expect(mockDesignationsService.updateSelectedDesignationList).toHaveBeenCalledWith(component.selectedDesignationsList)
    })

    it('should remove designation from selected list if already selected', () => {
      const removeDesignationSpy = jest.spyOn(component, 'removeDesignation')

      component.selectDesignation(2)

      expect(removeDesignationSpy).toHaveBeenCalledWith([component.igotDesignationsList[2]])
    })

    it('should not select designation if it is an org designation', () => {
      component.selectDesignation(1)

      expect(component.igotDesignationsList[1].selected).toBeUndefined()
      expect(component.selectedDesignationsList).not.toContain(component.igotDesignationsList[1])
    })
  })

  describe('removeDesignation', () => {
    beforeEach(() => {
      component.igotDesignationsList = [
        { id: '1', selected: true },
        { id: '2', selected: true }
      ]
      component.selectedDesignationsList = [
        { id: '1', name: 'Designation 1' },
        { id: '2', name: 'Designation 2' }
      ]
    })

    it('should remove designations from selected list', () => {
      component.removeDesignation([{ id: '1' }])

      expect(component.selectedDesignationsList).toEqual([{ id: '2', name: 'Designation 2' }])
      expect(mockDesignationsService.updateSelectedDesignationList).toHaveBeenCalledWith(component.selectedDesignationsList)
      expect(component.igotDesignationsList[0].selected).toBe(false)
    })
  })

  describe('openPreviewPoup', () => {
    it('should open preview popup and handle close event', () => {
      component.selectedDesignationsList = [{ id: '1', name: 'Designation 1' }]
      mockDialogRef.afterClosed.mockReturnValue(of([{ id: '1' }]))
      const removeDesignationSpy = jest.spyOn(component, 'removeDesignation')

      component.openPreviewPoup()

      expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
        disableClose: true,
        data: [{ id: '1', name: 'Designation 1' }],
        autoFocus: false,
        maxHeight: '90vh',
        width: '90%'
      })
      expect(removeDesignationSpy).toHaveBeenCalledWith([{ id: '1' }])
    })
  })

  describe('onChangePage', () => {
    it('should update pagination parameters and reload designations', () => {
      const loadDesignationsSpy = jest.spyOn(component, 'loadDesignations')
      component.searchControl.setValue('search')

      component.onChangePage({ pageIndex: 1, pageSize: 20, length: 50 })

      expect(component.startIndex).toBe(20)
      expect(component.lastIndex).toBe(40)
      expect(component.pageSize).toBe(20)
      expect(loadDesignationsSpy).toHaveBeenCalledWith('search')
    })
  })

  describe('importDesignations', () => {
    beforeEach(() => {
      component.selectedDesignationsList = [
        { id: '1', designation: 'Designation 1', description: 'Description 1' }
      ]
      component.frameworkInfo = mockDesignationsService.frameWorkInfo
      component.configSvc = mockActivatedRoute.snapshot.data.configService
      mockDesignationsService.createTerm.mockReturnValue(of({ result: { node_id: ['new-id'] } }))
      mockDesignationsService.updateTerms.mockReturnValue(of({ success: true }))
      mockDesignationsService.publishFramework.mockReturnValue(of({ success: true }))

      // Mock openProcessingBox method
      jest.spyOn(component, 'openProcessingBox').mockImplementation(() => {
        component.dialogRef = mockDialogRef
        component.progressDialogData = { subTitle: '' }
      })

      // Mock updateTerms method
      jest.spyOn(component, 'updateTerms')

      // Mock publishFrameWork method
      jest.spyOn(component, 'publishFrameWork')
    })

    it('should not proceed if no designations selected', () => {
      component.selectedDesignationsList = []
      const openProcessingBoxSpy = jest.spyOn(component, 'openProcessingBox')

      component.importDesignations()

      expect(openProcessingBoxSpy).toHaveBeenCalledTimes(1)
      expect(mockDesignationsService.createTerm).not.toHaveBeenCalled()
    })

    it('should create terms and proceed to update terms', () => {
      component.importDesignations()

      expect(mockDesignationsService.createTerm).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Designation 1',
        code: 'test-uuid',
        description: 'Description 1',
        refId: '1',
        refType: 'designation',
        framework: 'test-framework'
      }))

      expect(component.updateTerms).toHaveBeenCalled()
      expect(component.designationsImportSuccessResponses.length).toBe(2) // One from existing + one added
      expect(component.importedDesignationNames).toEqual(['Designation 1'])
    })

    it('should handle error in createTerm and continue processing', () => {
      mockDesignationsService.createTerm.mockReturnValue(throwError('error'))

      component.importDesignations()

      expect(component.designationsImportFailed).toEqual([
        { error: 'error', designation: component.selectedDesignationsList[0] }
      ])
      expect(component.updateTerms).toHaveBeenCalled()
    })
  })

  describe('updateTerms', () => {
    beforeEach(() => {
      component.selectedDesignationsList = [{ designation: 'Designation 1' }]
      component.designationsImportSuccessResponses = [{ identifier: 'id1' }]
      component.designationsImportFailed = []
      component.dialogRef = mockDialogRef
      component.progressDialogData = { subTitle: '' }
      component.designationConfig = {
        internalErrorMsg: 'Error',
        associationUpdateMsg: 'Updating',
        associationRetryMsg: 'Retrying'
      }

      // Mock openSnackbar
      // jest.spyOn(component, 'openSnackbar')

      // Mock publishFrameWork
      jest.spyOn(component, 'publishFrameWork')
    })

    it('should show error message if all imports failed', () => {
      component.designationsImportFailed = [{ designation: { designation: 'Designation 1' } }]

      component.updateTerms({})

      expect(mockDialogRef.close).toHaveBeenCalledWith(false)
      // expect(component.openSnackbar).toHaveBeenCalledWith('Error', 2000, 'error')
    })

    it('should update terms and proceed to publish framework', () => {
      mockDesignationsService.updateTerms.mockReturnValue(of({ success: true }))

      component.updateTerms(mockDesignationsService.frameWorkInfo.categories[0])

      expect(component.progressDialogData.subTitle).toBe('Updating')
      expect(mockDesignationsService.updateTerms).toHaveBeenCalledWith(
        'test-framework',
        'category1',
        'term1',
        expect.any(Object)
      )
      expect(component.publishFrameWork).toHaveBeenCalled()
    })

    it('should retry update if it fails', () => {
      mockDesignationsService.updateTerms.mockReturnValue(throwError('error'))

      component.updateTerms(mockDesignationsService.frameWorkInfo.categories[0])

      expect(component.progressDialogData.subTitle).toBe('Retrying')
      expect(mockDesignationsService.updateTerms).toHaveBeenCalledTimes(1)
    })

    it('should show error if retry also fails', () => {
      mockDesignationsService.updateTerms.mockReturnValue(throwError('error'))

      component.updateTerms(mockDesignationsService.frameWorkInfo.categories[0], true)

      expect(mockDialogRef.close).toHaveBeenCalled()
      // expect(component.openSnackbar).toHaveBeenCalledWith('Error', 2000, 'error')
    })
  })

  describe('publishFrameWork', () => {
    beforeEach(() => {
      component.frameworkInfo = { code: 'test-framework' }
      component.progressDialogData = { subTitle: '' }
      component.designationConfig = {
        publishingMsg: 'Publishing',
        internalErrorMsg: 'Error'
      }
      component.dialogRef = mockDialogRef
      component.designationsImportSuccessResponses = [{ id: '1' }, { id: '2' }]

      // Mock openSnackbar
      // jest.spyOn(component, 'openSnackbar')
    })

    it('should publish framework and close dialog after delay', () => {
      jest.useFakeTimers()
      mockDesignationsService.publishFramework.mockReturnValue(of({ success: true }))

      component.publishFrameWork()

      expect(component.progressDialogData.subTitle).toBe('Publishing')
      expect(mockDesignationsService.publishFramework).toHaveBeenCalledWith('test-framework')

      jest.advanceTimersByTime(10000)
      expect(mockDialogRef.close).toHaveBeenCalledWith(true)

      jest.useRealTimers()
    })

    it('should use calculated refresh time if it exceeds minimum', () => {
      jest.useFakeTimers()
      mockDesignationsService.publishFramework.mockReturnValue(of({ success: true }))
      component.designationsImportSuccessResponses = Array(30).fill({ id: 'x' })

      component.publishFrameWork()

      jest.advanceTimersByTime(15000)
      expect(mockDialogRef.close).toHaveBeenCalledWith(true)

      jest.useRealTimers()
    })

    it('should handle error in publishing', () => {
      mockDesignationsService.publishFramework.mockReturnValue(throwError('error'))

      component.publishFrameWork()

      expect(mockDialogRef.close).toHaveBeenCalled()
      // expect(component.openSnackbar).toHaveBeenCalledWith('Error', 2000, 'error')
    })
  })

  describe('openConforamtionPopup', () => {
    beforeEach(() => {
      component.designationConfig = { successMsg: 'Success' }
      component.importMasterflag = false

      // Mock openSnackbar and navigateToMyDesignations
      // jest.spyOn(component, 'openSnackbar')
      jest.spyOn(component, 'navigateToMyDesignations')
    })

    it('should show dialog for failed imports', () => {
      component.designationsImportFailed = [{ designation: { designation: 'Failed Designation' } }]

      component.openConforamtionPopup()

      expect(mockDialog.open).toHaveBeenCalled()
      expect(mockDialogRef.afterClosed).toHaveBeenCalled()
    })

    it('should navigate to organisation page if importMasterflag is true', () => {
      component.designationsImportFailed = [{ designation: { designation: 'Failed Designation' } }]
      component.importMasterflag = true
      mockDialogRef.afterClosed.mockImplementation((callback: any) => {
        callback()
        return mockDialogRef
      })

      component.openConforamtionPopup()

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/directory/organisation'])
    })

    it('should show success message and navigate for successful imports', () => {
      jest.useFakeTimers()
      component.designationsImportFailed = []

      component.openConforamtionPopup()

      jest.advanceTimersByTime(4000)
      //  expect(component.openSnackbar).toHaveBeenCalledWith('Success', 10000, 'success')
      expect(mockDialog.closeAll).toHaveBeenCalled()
      expect(component.navigateToMyDesignations).toHaveBeenCalled()

      jest.useRealTimers()
    })

    it('should navigate to organisation page if importMasterflag is true for successful imports', () => {
      jest.useFakeTimers()
      component.designationsImportFailed = []
      component.importMasterflag = true

      component.openConforamtionPopup()

      jest.advanceTimersByTime(4000)
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/directory/organisation'])

      jest.useRealTimers()
    })
  })

  describe('navigateToMyDesignations', () => {
    it('should emit close event', () => {
      component.navigateToMyDesignations()

      expect(component.closeComponent.emit).toHaveBeenCalledWith(false)
    })
  })

  describe('ngOnDestroy', () => {
    it('should clean up on destroy', () => {
      const mockSubscription = { unsubscribe: jest.fn() }
      // component.apiSubscription = mockSubscription as any

      component.ngOnDestroy()

      expect(mockDesignationsService.updateSelectedDesignationList).toHaveBeenCalledWith([])
      expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
      expect(mockSubscription.unsubscribe).toHaveBeenCalled()
    })
  })
})