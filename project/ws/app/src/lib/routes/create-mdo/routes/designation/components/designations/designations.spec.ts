import { DesignationsComponent } from './designations.component'
import { of, throwError } from 'rxjs'
import { DesignationsService } from '../../services/designations.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute } from '@angular/router'
import * as _ from 'lodash'
import { MatDialog } from '@angular/material/dialog'

jest.mock('../../services/designations.service')
jest.mock('@angular/material/dialog')
jest.mock('@angular/material/snack-bar')
jest.mock('@angular/router')

describe('DesignationsComponent', () => {
  let component: DesignationsComponent
  let designationsService: jest.Mocked<DesignationsService>
  let dialog: jest.Mocked<MatDialog>
  let snackBar: jest.Mocked<MatSnackBar>
  let activateRoute: jest.Mocked<ActivatedRoute>

  beforeEach(() => {
    designationsService = new DesignationsService(null as any, null as any) as jest.Mocked<DesignationsService>
    // dialog = new MatDialog() as jest.Mocked<MatDialog>
    // snackBar = new MatSnackBar() as jest.Mocked<MatSnackBar>
    activateRoute = new ActivatedRoute() as jest.Mocked<ActivatedRoute>

    // Mocking ActivatedRoute snapshot
    activateRoute.snapshot = {
      data: {
        configService: { userProfileV2: { departmentName: 'DepartmentName' } },
        pageData: { data: {} }
      },
      params: { department: '1' },
      queryParams: { orgName: 'OrganizationName' },
    } as any

    // Create the component
    component = new DesignationsComponent(
      designationsService,
      dialog,
      activateRoute,
      snackBar
    )
  })

  it('should initialize the component correctly', () => {
    jest.spyOn(component, 'initialization')
    component.ngOnInit()
    expect(component.initialization).toHaveBeenCalled()
  })

  it('should call initialization method', () => {
    const initializationSpy = jest.spyOn(component, 'initialization')
    component.initialization()
    expect(initializationSpy).toHaveBeenCalled()
  })

  it('should initialize default values', () => {
    jest.spyOn(designationsService, 'setUserProfile')

    component.initializeDefaultValues()
    expect(designationsService.setUserProfile).toHaveBeenCalledWith(_.get(activateRoute.snapshot.data, 'configService.userProfileV2'))
    expect(component.orgId).toBe('1')
    expect(component.orgName).toBe('OrganizationName')
    expect(component.actionMenuItem.length).toBeGreaterThan(0)
  })

  it('should call getRoutesData and handle success', () => {
    const mockResponse = { frameworkid: 'framework-id' }
    jest.spyOn(designationsService, 'getOrgReadData').mockReturnValue(of(mockResponse))
    jest.spyOn(component, 'getFrameworkInfo')

    component.getRoutesData()
    expect(designationsService.getOrgReadData).toHaveBeenCalledWith('1')
    expect(component.getFrameworkInfo).toHaveBeenCalledWith('framework-id')
  })

  it('should handle error in getRoutesData', () => {
    const mockError = new Error('Error')
    jest.spyOn(designationsService, 'getOrgReadData').mockReturnValue(throwError(mockError))

    component.getRoutesData()
    expect(component.showLoader).toBe(false)
    expect(snackBar.open).toHaveBeenCalledWith('Internal Error', 'X', { duration: 5000, panelClass: ['error'] })
  })

  it('should call getFrameworkInfo and handle success', () => {
    const mockFrameworkResponse = { result: { framework: 'mock-framework' } }
    jest.spyOn(designationsService, 'getFrameworkInfo').mockReturnValue(of(mockFrameworkResponse))

    component.getFrameworkInfo('framework-id')
    expect(designationsService.getFrameworkInfo).toHaveBeenCalledWith('framework-id')
    expect(component.frameworkDetails).toEqual(mockFrameworkResponse.result.framework)
  })

  it('should handle error in getFrameworkInfo', () => {
    const mockError = new Error('Error')
    jest.spyOn(designationsService, 'getFrameworkInfo').mockReturnValue(throwError(mockError))

    component.getFrameworkInfo('framework-id')
    expect(component.showLoader).toBe(false)
    expect(snackBar.open).toHaveBeenCalledWith('Internal Error', 'X', { duration: 5000, panelClass: ['error'] })
  })

  it('should call openSnackbar', () => {
    // const openSnackbarSpy = jest.spyOn(component, 'openSnackbar')
    // component.openSnackbar('Test Message')
    // expect(openSnackbarSpy).toHaveBeenCalledWith('Test Message', 5000, undefined)
  })

  it('should handle removeDesignation method correctly', () => {
    const mockDesignation = { code: 'designation-code' }
    jest.spyOn(designationsService, 'deleteDesignation').mockReturnValue(of({}))
    jest.spyOn(component, 'publishFrameWork')

    component.removeDesignation(mockDesignation)

    expect(designationsService.deleteDesignation).toHaveBeenCalledWith('mock-framework', 'designation', { request: { contentIds: ['designation-code'] } })
    expect(component.publishFrameWork).toHaveBeenCalledWith('delete')
  })

  it('should handle publishFramework method correctly', () => {
    const mockResponse = {}
    jest.spyOn(designationsService, 'publishFramework').mockReturnValue(of(mockResponse))

    component.publishFrameWork('delete')
    expect(designationsService.publishFramework).toHaveBeenCalledWith('mock-framework')
    expect(snackBar.open).toHaveBeenCalledWith('Term remove message', 'X', { duration: 5000, panelClass: [''] })
  })

  it('should handle openConformationPopup', () => {
    const event = { action: 'remove', row: { code: 'mock-code' } }
    jest.spyOn(component, 'removeDesignation')

    component.openConformationPopup(event)

    expect(dialog.open).toHaveBeenCalled()
  })
})
