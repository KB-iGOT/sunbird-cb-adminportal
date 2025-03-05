import { TransformationsComponent } from './transformations.component'
import { MarketplaceService } from '../../services/marketplace.service'
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import * as _ from 'lodash'

describe('TransformationsComponent', () => {
  let component: TransformationsComponent
  let mockMarketplaceService: jest.Mocked<MarketplaceService>
  let formBuilder: FormBuilder
  let mockSnackBar: jest.Mocked<MatSnackBar>
  let mockDialog: jest.Mocked<MatDialog>
  let mockActivatedRoute: jest.Mocked<ActivatedRoute>

  // Utility function to create a more realistic form group
  function createMockFormGroup(initialValues: { [key: string]: any } = {}, validators: any[] = []): FormGroup {
    const formBuilder = new FormBuilder()
    const controls: { [key: string]: FormControl } = {}

    Object.keys(initialValues).forEach(key => {
      controls[key] = new FormControl(initialValues[key], validators)
    })

    return formBuilder.group(controls)
  }

  beforeEach(() => {
    // Create actual FormBuilder
    formBuilder = new FormBuilder()

    mockMarketplaceService = {
      updateProvider: jest.fn(),
      uploadContent: jest.fn(),
      uploadProgress: jest.fn(),
      uploadCIOSContract: jest.fn(),
    } as any

    mockSnackBar = {
      open: jest.fn(),
    } as any

    mockDialog = {
      open: jest.fn().mockReturnValue({
        close: jest.fn(),
      }),
    } as any

    mockActivatedRoute = {
      data: {
        subscribe: jest.fn().mockImplementation((callback) => {
          callback({
            pageData: {
              data: {
                trasformContentJson: [{ spec: {} }],
              },
            },
          })
        }),
      },
    } as any

    // Create component instance
    component = new TransformationsComponent(
      mockMarketplaceService,
      formBuilder,
      mockSnackBar,
      mockDialog,
      mockActivatedRoute
    )

    // Setup component properties
    component.providerConfiguration = {
      trasformContentJson: [{ spec: {} }],
    }
    component.providerDetails = {
      id: '123',
      data: { partnerCode: 'PARTNER1' }
    }
    component.providerDetalsBeforUpdate = {
      data: { isActive: false },
      trasformContentJson: [{ spec: {} }],
    }
    component.transformationType = 'trasformContentJson'
    component.transforamtionType = 'viaForm'
    component.transFormContentKeysAndControls = [
      {
        lable: 'header1',
        controlName: 'header1',
        path: 'path/to/column'
      }
    ]

    // Create a real form group for testing
    component.transforamtionForm = createMockFormGroup(
      { header1: 'test value' },
      [Validators.required]
    )

    // Create a real form control for transformation spec
    component.transformationSpecForm = new FormControl(
      { spec: {} },
      Validators.required
    )
  })

  describe('Transformation Methods', () => {
    test('upDateTransforamtionDetails should call updateProvider on valid form', () => {
      // Mock successful update
      mockMarketplaceService.updateProvider.mockReturnValue(of({}))

      // Ensure form is valid
      component.transforamtionForm.patchValue({ header1: 'valid value' })

      // Call method
      component.upDateTransforamtionDetails()

      // Assertions
      expect(mockMarketplaceService.updateProvider).toHaveBeenCalled()
      expect(mockSnackBar.open).toHaveBeenCalledWith(expect.stringContaining('saved successfully'))
    })

    test('upDateTransforamtionDetails should show error on invalid form', () => {
      // Make form invalid
      component.transforamtionForm.patchValue({ header1: '' })
      component.transforamtionForm.markAllAsTouched()

      // Call method
      component.upDateTransforamtionDetails()

      // Assertions
      expect(mockSnackBar.open).toHaveBeenCalledWith('Please provide all mandatory fields')
    })
  })

  describe('File Upload Methods', () => {
    test('onDrop should handle CSV file', () => {
      // Create a mock File object
      const mockFile = new File(['test,data'], 'test.csv', { type: 'text/csv' })

      // Setup file reader mock
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: jest.fn(),
        onerror: jest.fn(),
        result: 'header1,header2\nvalue1,value2',
      } as any
      jest.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader)

      // Call method
      component.transformationType = ''
      component.onDrop(mockFile)

      // Trigger onload manually
      if (mockFileReader.onload) {
        mockFileReader.onload({
          target: { result: 'header1,header2\nvalue1,value2' }
        })
      }

      // Assertions
      expect(component.fileName).toBe('test.csv')
      expect(component.contentFileUploaded).toBeTruthy()
    })
  })

  describe('Utility Methods', () => {
    test('getUploadHeader should return correct header', () => {
      const testCases = [
        { type: 'trasformContentJson', expected: 'Upload Course Catalog' },
        { type: 'transformProgressJson', expected: 'Upload Course Progress' },
        { type: 'certificateTemplateUrl', expected: 'Upload Course Certificate' },
      ]

      testCases.forEach(({ type, expected }) => {
        component.transformationType = type
        expect(component.getUploadHeader).toBe(expected)
      })
    })
  })
})