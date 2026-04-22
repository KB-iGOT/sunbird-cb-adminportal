import { RequestCopyDetailsV2Component } from './request-copy-details-v2.component'
import { of, throwError } from 'rxjs'

const mockActivatedRouter = {
  queryParams: { subscribe: jest.fn((cb: any) => cb({ id: 'demand-1', name: 'Test' }) || { unsubscribe: jest.fn() }) },
}

const mockSnackBar = { open: jest.fn() }

const mockRouter = { navigateByUrl: jest.fn() }

const mockDialogRef = {
  close: jest.fn(),
  afterClosed: jest.fn().mockReturnValue(of(null)),
}

const mockDialog = {
  open: jest.fn().mockReturnValue(mockDialogRef),
}

const mockRequestService = {
  createDemand: jest.fn(),
}

describe('RequestCopyDetailsV2Component', () => {
  let component: RequestCopyDetailsV2Component

  beforeEach(() => {
    jest.clearAllMocks()
    // Set up sessionStorage mock
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ id: 'user-1' }))

    component = new RequestCopyDetailsV2Component(
      mockActivatedRouter as any,
      mockSnackBar as any,
      mockRouter as any,
      mockDialog as any,
      mockRequestService as any,
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should set currentUser from sessionStorage in constructor', () => {
    expect(component.currentUser).toBeTruthy()
  })

  it('should set currentUser to empty string when sessionStorage is empty', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    const comp = new RequestCopyDetailsV2Component(
      mockActivatedRouter as any,
      mockSnackBar as any,
      mockRouter as any,
      mockDialog as any,
      mockRequestService as any,
    )
    expect(comp.currentUser).toBe('')
  })

  it('ngOnInit should set demandId and actionBtnName from queryParams', () => {
    component.ngOnInit()
    expect(component.demandId).toBe('demand-1')
    expect(component.actionBtnName).toBe('Test')
  })

  it('ngOnInit should not set demandId when id param is missing', () => {
    const routerWithoutId = {
      queryParams: { subscribe: jest.fn((cb: any) => cb({}) || { unsubscribe: jest.fn() }) },
    }
    const comp = new RequestCopyDetailsV2Component(
      routerWithoutId as any, mockSnackBar as any, mockRouter as any, mockDialog as any, mockRequestService as any,
    )
    comp.ngOnInit()
    expect(comp.demandId).toBeUndefined()
  })

  it('navigateBack should navigate to all-request', () => {
    component.navigateBack()
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/home/all-request')
  })

  it('showDialogBox should open dialog for progress event', () => {
    component.showDialogBox('progress')
    expect(mockDialog.open).toHaveBeenCalled()
    const call = mockDialog.open.mock.calls[0]
    expect(call[1].data.type).toBe('progress')
    expect(call[1].data.title).toBe('Processing your request')
  })

  it('showDialogBox should open dialog for progress-completed event', () => {
    component.showDialogBox('progress-completed')
    expect(mockDialog.open).toHaveBeenCalled()
    const call = mockDialog.open.mock.calls[0]
    expect(call[1].data.type).toBe('progress-completed')
    expect(call[1].data.primaryAction).toBe('Successfully created....')
  })

  it('showDialogBox with unknown event should not set type', () => {
    component.showDialogBox('unknown')
    expect(mockDialog.open).toHaveBeenCalled()
    const call = mockDialog.open.mock.calls[0]
    expect(call[1].data.type).toBeUndefined()
  })

  it('openDialoagBox should open dialog and subscribe to afterClosed', () => {
    component.openDialoagBox({ type: 'progress', icon: 'vega', title: 'Test', subTitle: 'Sub' })
    expect(mockDialog.open).toHaveBeenCalled()
    expect(mockDialogRef.afterClosed).toHaveBeenCalled()
  })

  it('submit should call createDemand and navigate on success', (done) => {
    jest.useFakeTimers()
    const mockResData = { id: 'result-1' }
    mockRequestService.createDemand.mockReturnValue(of(mockResData))
    component.dialogRefs = mockDialogRef

    component.submit({ someRequest: 'data' })

    expect(mockRequestService.createDemand).toHaveBeenCalledWith({ someRequest: 'data' })
    expect(mockDialogRef.close).toHaveBeenCalled()

    jest.runAllTimers()
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/home/all-request')
    expect(mockSnackBar.open).toHaveBeenCalledWith('Request submitted successfully ')
    jest.useRealTimers()
    done()
  })

  it('submit should show snackbar on error', () => {
    mockRequestService.createDemand.mockReturnValue(throwError({ message: 'error' }))
    component.dialogRefs = mockDialogRef

    component.submit({ someRequest: 'data' })

    expect(mockSnackBar.open).toHaveBeenCalledWith('Request Failed')
  })
})
