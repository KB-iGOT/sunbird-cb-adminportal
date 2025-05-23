import { FormArray, FormBuilder, FormGroup } from '@angular/forms'
import { JsonEditorOptions } from 'ang-jsoneditor'
import { ViaApiParamsTableComponent } from './via-api-params-table.component'

describe('ViaApiParamsTableComponent', () => {
  let component: ViaApiParamsTableComponent
  let formBuilder: FormBuilder
  let mockFormGroup: FormGroup
  let mockFormArray: FormArray

  beforeEach(() => {
    formBuilder = new FormBuilder()
    mockFormArray = formBuilder.array([])
    mockFormGroup = formBuilder.group({
      tableListFormArray: mockFormArray,
      bodyType: ['urlencoded']
    })

    component = new ViaApiParamsTableComponent(formBuilder)
    component.tableListFormGroup = mockFormGroup
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Initialization', () => {
    it('should create component instance', () => {
      expect(component).toBeTruthy()
    })

    it('should initialize with default values', () => {
      expect(component.paramsType).toBe('params')
      expect(component.paramsHeader).toBe('Query Params')
      expect(component.showTable).toBe(true)
      expect(component.editorOptions).toBeInstanceOf(JsonEditorOptions)
    })

    it('should call initialization on ngOnInit', () => {
      const initializationSpy = jest.spyOn(component, 'initialization')
      component.ngOnInit()
      expect(initializationSpy).toHaveBeenCalled()
    })
  })

  describe('initialization method', () => {
    beforeEach(() => {
      jest.spyOn(component, 'addParams')
      jest.spyOn(component, 'onBodyTypeChange')
    })

    it('should call addParams when paramsType is not authentication', () => {
      component.paramsType = 'params'
      component.initialization()
      expect(component.addParams).toHaveBeenCalled()
    })

    it('should not call addParams when paramsType is authentication', () => {
      component.paramsType = 'authentication'
      component.initialization()
      expect(component.addParams).not.toHaveBeenCalled()
    })

    it('should set correct header and options for params type', () => {
      component.paramsType = 'params'
      component.initialization()
      expect(component.paramsHeader).toBe('Query Params')
    })

    it('should set correct header and options for headers type', () => {
      component.paramsType = 'headers'
      component.initialization()
      expect(component.paramsHeader).toBe('Headers')
    })

    it('should set correct header and options for body type', () => {
      component.paramsType = 'body'
      component.initialization()

      expect(component.paramsHeader).toBe('Body')
      expect(component.editorOptions.mode).toBe('text')
      expect(component.editorOptions.mainMenuBar).toBe(false)
      expect(component.editorOptions.navigationBar).toBe(false)
      expect(component.editorOptions.statusBar).toBe(false)
      expect(component.editorOptions.enableSort).toBe(false)
      expect(component.editorOptions.enableTransform).toBe(false)
      expect(component.onBodyTypeChange).toHaveBeenCalled()
    })

    it('should set correct header and options for authentication type', () => {
      component.paramsType = 'authentication'
      component.initialization()

      expect(component.paramsHeader).toBe('Authentication')
      expect(component.editorOptions.mode).toBe('text')
      expect(component.editorOptions.mainMenuBar).toBe(false)
      expect(component.editorOptions.navigationBar).toBe(false)
      expect(component.editorOptions.statusBar).toBe(false)
      expect(component.editorOptions.enableSort).toBe(false)
      expect(component.editorOptions.enableTransform).toBe(false)
      expect(component.showTable).toBe(false)
    })
  })

  describe('tableList getter', () => {
    it('should return FormArray when tableListFormGroup exists', () => {
      const result = component.tableList
      expect(result).toBe(mockFormArray)
    })

    it('should return empty FormArray when tableListFormGroup is undefined', () => {
      component.tableListFormGroup = undefined
      const result = component.tableList
      expect(result).toBeInstanceOf(FormArray)
      expect(result.length).toBe(0)
    })

    it('should return empty FormArray when tableListFormGroup is null', () => {
      component.tableListFormGroup = null as any
      const result = component.tableList
      expect(result).toBeInstanceOf(FormArray)
      expect(result.length).toBe(0)
    })
  })

  describe('addParams method', () => {
    it('should add a new FormGroup to tableList', () => {
      const initialLength = component.tableList.length
      component.addParams()

      expect(component.tableList.length).toBe(initialLength + 1)

      const addedGroup = component.tableList.at(component.tableList.length - 1) as FormGroup
      expect(addedGroup.get('key')).toBeTruthy()
      expect(addedGroup.get('value')).toBeTruthy()
      expect(addedGroup.get('key')?.value).toBe('')
      expect(addedGroup.get('value')?.value).toBe('')
    })

    it('should create FormGroup with correct structure', () => {
      component.addParams()

      const addedGroup = component.tableList.at(0) as FormGroup
      expect(addedGroup.contains('key')).toBe(true)
      expect(addedGroup.contains('value')).toBe(true)
    })
  })

  describe('onParamInput method', () => {
    beforeEach(() => {
      jest.spyOn(component, 'addParams')
    })

    it('should call addParams when index is the last item', () => {
      // Add some items first
      component.addParams()
      component.addParams()

      const lastIndex = component.tableList.length - 1
      component.onParamInput(lastIndex)

      expect(component.addParams).toHaveBeenCalled()
    })

    it('should not call addParams when index is not the last item', () => {
      // Add some items first
      component.addParams()
      component.addParams()
      component.addParams()

      component.onParamInput(0) // First item, not last

      expect(component.addParams).not.toHaveBeenCalled()
    })

    it('should handle empty array case', () => {
      expect(() => component.onParamInput(0)).not.toThrow()
    })
  })

  describe('onBodyTypeChange method', () => {
    it('should subscribe to bodyType valueChanges when form control exists', () => {
      const bodyTypeControl = mockFormGroup.get('bodyType')
      const subscribeSpy = jest.spyOn(bodyTypeControl!.valueChanges, 'subscribe')

      component.onBodyTypeChange()

      expect(subscribeSpy).toHaveBeenCalled()
    })

    it('should set showTable to true when bodyType is urlencoded', () => {
      component.onBodyTypeChange()

      const bodyTypeControl = mockFormGroup.get('bodyType')
      bodyTypeControl?.setValue('urlencoded')

      expect(component.showTable).toBe(true)
    })

    it('should set showTable to false when bodyType is not urlencoded', () => {
      component.onBodyTypeChange()

      const bodyTypeControl = mockFormGroup.get('bodyType')
      bodyTypeControl?.setValue('json')

      expect(component.showTable).toBe(false)
    })

    it('should handle missing tableListFormGroup gracefully', () => {
      component.tableListFormGroup = undefined
      expect(() => component.onBodyTypeChange()).not.toThrow()
    })

    it('should handle missing controls gracefully', () => {
      component.tableListFormGroup = formBuilder.group({})
      expect(() => component.onBodyTypeChange()).not.toThrow()
    })

    it('should handle missing bodyType control gracefully', () => {
      component.tableListFormGroup = formBuilder.group({
        otherControl: ['']
      })
      expect(() => component.onBodyTypeChange()).not.toThrow()
    })
  })

  describe('Input Properties', () => {
    it('should accept tableListFormGroup input', () => {
      const testFormGroup = formBuilder.group({
        tableListFormArray: formBuilder.array([])
      })

      component.tableListFormGroup = testFormGroup
      expect(component.tableListFormGroup).toBe(testFormGroup)
    })

    it('should accept paramsType input with default value', () => {
      expect(component.paramsType).toBe('params')

      component.paramsType = 'headers'
      expect(component.paramsType).toBe('headers')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle null FormBuilder gracefully', () => {
      const componentWithNullBuilder = new ViaApiParamsTableComponent(null as any)
      expect(componentWithNullBuilder).toBeTruthy()
    })

    it('should handle tableList access when FormArray is missing', () => {
      component.tableListFormGroup = formBuilder.group({
        // Missing tableListFormArray
      })

      expect(() => component.tableList).not.toThrow()
    })

    it('should handle addParams when tableList is empty', () => {
      component.tableListFormGroup = formBuilder.group({
        tableListFormArray: formBuilder.array([])
      })

      expect(() => component.addParams()).not.toThrow()
      expect(component.tableList.length).toBe(1)
    })
  })

  describe('Integration Tests', () => {
    it('should properly initialize for params workflow', () => {
      component.paramsType = 'params'
      component.ngOnInit()

      expect(component.paramsHeader).toBe('Query Params')
      expect(component.showTable).toBe(true)
      expect(component.tableList.length).toBeGreaterThan(0)
    })

    it('should properly initialize for authentication workflow', () => {
      component.paramsType = 'authentication'
      component.ngOnInit()

      expect(component.paramsHeader).toBe('Authentication')
      expect(component.showTable).toBe(false)
      expect(component.editorOptions.mode).toBe('text')
    })

    it('should handle complete body type workflow', () => {
      component.paramsType = 'body'
      component.ngOnInit()

      expect(component.paramsHeader).toBe('Body')
      expect(component.editorOptions.mode).toBe('text')

      // Test body type change
      const bodyTypeControl = mockFormGroup.get('bodyType')
      bodyTypeControl?.setValue('json')
      expect(component.showTable).toBe(false)

      bodyTypeControl?.setValue('urlencoded')
      expect(component.showTable).toBe(true)
    })
  })
})