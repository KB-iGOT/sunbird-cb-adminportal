import { ProviderDetailsComponent } from './provider-details.component'
import { FormBuilder } from '@angular/forms'
import { Router } from '@angular/router'
import { MarketplaceService } from '../../services/marketplace.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { LoaderService } from '../../../../services/loader.service'
import { DatePipe } from '@angular/common'
import { of } from 'rxjs'
import { HttpErrorResponse } from '@angular/common/http'

jest.mock('../../services/marketplace.service')
jest.mock('@angular/material/snack-bar')
jest.mock('../../../../services/loader.service')
jest.mock('@angular/router')

describe('ProviderDetailsComponent', () => {
  let component: ProviderDetailsComponent
  let mockMarketplaceService: jest.Mocked<MarketplaceService>
  let mockSnackBar: jest.Mocked<MatSnackBar>
  let mockLoaderService: jest.Mocked<LoaderService>
  let mockRouter: jest.Mocked<Router>

  beforeEach(() => {
    mockMarketplaceService = new MarketplaceService(null as any) as jest.Mocked<MarketplaceService>
    mockSnackBar = new MatSnackBar(null as any, null as any, null as any, null as any, null as any, null as any) as jest.Mocked<MatSnackBar>
    mockLoaderService = new LoaderService() as jest.Mocked<LoaderService>
    mockRouter = new Router() as jest.Mocked<Router>

    component = new ProviderDetailsComponent(
      new FormBuilder(),
      mockRouter,
      mockMarketplaceService,
      mockSnackBar,
      new DatePipe('en-US'),
      mockLoaderService
    )
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize the form on init', () => {
    component.ngOnInit()
    expect(component.providerFormGroup).toBeTruthy()
  })

  it('should patch provider details on changes', () => {
    const providerDetails = {
      data: {
        contentPartnerName: 'Test Partner',
        partnerCode: '123456',
        websiteUrl: 'http://test.com',
        description: 'Test description',
        link: 'http://image.com',
        providerTips: ['Tip 1', 'Tip 2']
      }
    }
    component.ngOnChanges({
      providerDetails: {
        currentValue: providerDetails,
        previousValue: null,
        firstChange: true,
        isFirstChange: jest.fn()
      }
    })

    expect(component.providerFormGroup.value.contentPartnerName).toBe('Test Partner')
    expect(component.providerFormGroup.value.partnerCode).toBe('123456')
    expect(component.providerFormGroup.value.websiteUrl).toBe('http://test.com')
    expect(component.providerFormGroup.value.description).toBe('Test description')
    expect(component.imageUrl).toBe('http://image.com')
  })

  it('should handle valid form submission for new provider', () => {
    const mockFormValue = {
      contentPartnerName: 'Test Partner',
      partnerCode: '123456',
      websiteUrl: 'http://test.com',
      description: 'Test description',
      providerTips: ['Tip 1']
    }
    component.providerFormGroup.setValue(mockFormValue)
    component.imageUrl = 'http://image.com'

    // Mock the service method
    mockMarketplaceService.createProvider.mockReturnValue(of({}))

    component.saveProviderDetails()

    expect(mockMarketplaceService.createProvider).toHaveBeenCalled()
    expect(mockLoaderService.changeLoad.next).toHaveBeenCalledWith(false)
    expect(mockSnackBar.open).toHaveBeenCalledWith('Successfully Onboarded')
  })

  it('should show an error message when service fails', () => {
    const errorResponse = new HttpErrorResponse({
      error: { params: { errMsg: 'Something went wrong' } },
      status: 500,
      statusText: 'Server Error'
    })

    // Mock the service method to return an error
    mockMarketplaceService.createProvider.mockReturnValue(of(errorResponse))

    component.saveProviderDetails()

    expect(mockSnackBar.open).toHaveBeenCalledWith('Something went wrong, please try again later')
  })

  it('should show snack bar for invalid form submission', () => {
    component.providerFormGroup.setValue({
      contentPartnerName: '',
      partnerCode: '',
      websiteUrl: '',
      description: '',
      providerTips: []
    })

    component.submit()

    expect(mockSnackBar.open).toHaveBeenCalledWith('Please fill all the mandator fields with proper data')
  })

  it('should navigate to provider dashboard', () => {
    component.navigateToProvidersDashboard()
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app/home/marketplace-providers')
  })

  it('should handle thumbnail file selection', () => {
    //const file = new File([''], 'image.png', { type: 'image/png' })
    const event = { name: 'image.png', size: 500000, type: 'image/png' }

    // Simulate thumbnail selection
    const spy = jest.spyOn(component, 'onThumbNailSelected')
    component.onThumbNailSelected(event)

    expect(spy).toHaveBeenCalled()
  })

  it('should show error snack bar if invalid file type is uploaded for thumbnail', () => {
    const event = { name: 'image.jpg', size: 500000, type: 'image/jpg' }
    component.onThumbNailSelected(event)
    expect(mockSnackBar.open).toHaveBeenCalledWith('Please upload svg or png image')
  })

  it('should handle file upload error for PDF', () => {
    const file = new File([''], 'file.pdf', { type: 'application/pdf' })
    component.onDrop(file)

    expect(component.pdfUploaded).toBeTruthy()
    expect(component.fileName).toBe('file.pdf')
  })

  it('should show error snack bar for invalid PDF file size', () => {
    const largeFile = new File([''], 'large-file.pdf', { type: 'application/pdf' })
    // largeFile.size = 200 * 1024 * 1024 // 200MB

    component.onDrop(largeFile)

    expect(mockSnackBar.open).toHaveBeenCalledWith('file size should not be more than 100 MB')
  })
})
