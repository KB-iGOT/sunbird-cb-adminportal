import { Component, OnInit } from '@angular/core'
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { SnackbarComponent } from '@sunbird-cb/consumption'
import { JsonEditorOptions } from 'ang-jsoneditor'
import * as _ from 'lodash'

@Component({
  selector: 'ws-app-providers-api-integrations',
  templateUrl: './providers-api-integrations.component.html',
  styleUrls: ['./providers-api-integrations.component.scss']
})
export class ProvidersApiIntegrationsComponent implements OnInit {
  // Form Groups
  servicesFormGroup!: FormGroup
  viaApiFormGroup!: FormGroup
  headersFormGroup!: FormGroup
  paramsFormGroup!: FormGroup
  bodyFormGroup!: FormGroup
  authenticationFormGroup!: FormGroup
  transforamtionForm!: FormGroup

  // API Configuration
  apiTypesList: any[] = []
  apiMetadata = [
    { name: 'Params', value: 'Params' },
    { name: 'Headers', value: 'Headers' },
    { name: 'Body', value: 'Body' }
  ]

  // UI Properties
  delayTabLoad = true
  displayUrl = ''
  apiUrlEdited = false
  selectedApiTab: string = 'Params'

  // Transformation Properties
  transformationSpecForm!: FormControl
  transforamtionType = 'viaSpec'
  editorOptions = new JsonEditorOptions()
  transformationsUpdated = false
  executed = false
  availableHeadrsList: string[] = []
  transFormContentKeysAndControls: any[] = []

  constructor(
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.initializeFormGroups()
    this.setupValueChangeListeners()
    this.delayTabLoad = false
  }

  private initializeFormGroups(): void {
    this.servicesFormGroup = this.formBuilder.group({
      serviceName: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9.\-_$/:\[\]'!]*$/)]),
      serviceCode: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9.\-_$/:\[\]'!]*$/)]),
      serviceDescription: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9,.\-_$/:\[\]'!]*$/)]),
      isAuthenticated: new FormControl(false),
      strictCache: new FormControl(false),
      strictCacheTimeInMinutes: new FormControl()
    })

    this.viaApiFormGroup = this.formBuilder.group({
      apiType: new FormControl('', Validators.required),
      apiUrl: new FormControl('', Validators.required)
    })

    this.paramsFormGroup = this.formBuilder.group({
      tableListFormArray: this.formBuilder.array([])
    })

    this.headersFormGroup = this.formBuilder.group({
      tableListFormArray: this.formBuilder.array([])
    })

    this.bodyFormGroup = this.formBuilder.group({
      tableListFormArray: this.formBuilder.array([]),
      bodyType: new FormControl('urlencoded'),
      rawData: new FormControl('')
    })

    this.authenticationFormGroup = this.formBuilder.group({
      bodyType: new FormControl('urlencoded'),
      rawData: new FormControl('', Validators.required)
    })

    this.transforamtionForm = this.formBuilder.group({})

    this.apiTypesList = [
      { type: 'Get', value: 'GET' },
      { type: 'Post', value: 'POST' }
    ]

    // Configure JSON Editor Options
    this.editorOptions.mode = 'text'
    this.editorOptions.mainMenuBar = false
    this.editorOptions.navigationBar = false
    this.editorOptions.statusBar = false
    this.editorOptions.enableSort = false
    this.editorOptions.enableTransform = false

    this.transformationSpecForm = new FormControl({}, Validators.required)
  }

  private setupValueChangeListeners(): void {
    this.paramsFormArray.valueChanges.subscribe((params: any) => {
      if (!this.apiUrlEdited) {
        this.constructDisplayUrl(params)
      } else {
        this.apiUrlEdited = false
      }
    })

    this.viaApiFormGroup.controls.apiUrl.valueChanges.subscribe((event: string) => {
      const trimValue = event.replace(' ', '')
      if (trimValue !== event) {
        this.viaApiFormGroup.controls.apiUrl.patchValue(trimValue)
      } else if (event !== this.displayUrl) {
        this.displayUrl = event
        this.apiUrlEdited = true
        this.constructParamsFormArray()
      }
    })
  }

  get paramsFormArray(): FormArray {
    return this.paramsFormGroup.controls.tableListFormArray as FormArray
  }

  private constructDisplayUrl(paramsArray: any): void {
    let paramsToUrl = ''
    paramsArray.forEach((param: any) => {
      if (param.key) {
        paramsToUrl = `${paramsToUrl}${paramsToUrl === '' ? '?' : '&'}${param.key}`
      }
      if (!param.key && param.value) {
        paramsToUrl = `${paramsToUrl}${paramsToUrl === '' ? '?&' : '&'}`
      }
      if (param.value) {
        paramsToUrl = `${paramsToUrl}=${param.value}`
      }
    })
    if (paramsToUrl) {
      this.displayUrl = this.actualUrl + paramsToUrl
      this.viaApiFormGroup.controls.apiUrl.patchValue(this.displayUrl)
    }
  }

  get actualUrl(): string {
    const actualUrl = this.viaApiFormGroup.controls.apiUrl.value.split('?')[0]
    return actualUrl
  }

  get constructParams(): { key: string; value: string }[] {
    const paramsArray: any = []
    const urlAndParams = this.displayUrl ? this.displayUrl.split('?') : []
    const paramsUrlArray = urlAndParams[1] ? urlAndParams[1].split('&') : []
    paramsUrlArray.forEach((e) => {
      const keyValue = e.split('=')
      const param = {
        key: keyValue[0],
        value: keyValue[1]
      }
      paramsArray.push(param)
    })
    paramsArray.push({ key: '', value: '' })
    return paramsArray
  }

  private constructParamsFormArray(): void {
    const paramsArray = this.constructParams
    this.paramsFormArray.patchValue(paramsArray)
    if (this.paramsFormArray && paramsArray) {
      while (this.paramsFormArray.length > paramsArray.length) {
        this.apiUrlEdited = true
        this.paramsFormArray.removeAt(this.paramsFormArray.length - 1)
      }

      while (paramsArray.length > this.paramsFormArray.length) {
        const object = paramsArray[this.paramsFormArray.length]
        this.apiUrlEdited = true
        const formGroup = this.formBuilder.group({
          key: new FormControl(object.key),
          value: new FormControl(object.value)
        })
        this.paramsFormArray.insert(this.paramsFormArray.length - 1, formGroup)
      }
    }
  }

  onApiTabChange(tabValue: string): void {
    this.selectedApiTab = tabValue
  }

  getControlValidation(controlName: string, errorType: string): boolean {
    const control = this.servicesFormGroup.get(controlName)
    return !!(control && control.hasError(errorType) && (control.dirty || control.touched))
  }

  getTextLength(controlName: string): number {
    const control = this.servicesFormGroup.get(controlName)
    return control?.value?.length || 0
  }

  authenticationToggleChange(): void {
    const isAuthenticated = this.servicesFormGroup.controls.isAuthenticated.value
    if (!isAuthenticated) {
      this.servicesFormGroup.controls.strictCache.patchValue(false)
    }
  }

  onToggleChange(): void {
    const strictCache = this.servicesFormGroup.controls.strictCache.value
    if (!strictCache) {
      this.servicesFormGroup.controls.strictCacheTimeInMinutes.patchValue(null)
    }
  }

  onSelectChange(): void {
    this.transformationsUpdated = false
  }

  updateTransformationDetails(): void {
    if (this.transforamtionType === 'viaForm') {
      if (this.transforamtionForm.valid) {
        this.transformationsUpdated = true
        this.showSnackBar('Transformation updated successfully', 'success')
      }
    } else if (this.transforamtionType === 'viaSpec') {
      if (this.transformationSpecForm.valid) {
        this.transformationsUpdated = true
        this.showSnackBar('Transformation updated successfully', 'success')

      }
    }
  }

  get getUpdateBtnText(): string {
    return this.transformationsUpdated ? 'Update' : 'Add'
  }

  configure(): void {
    if (this.servicesFormGroup.valid && this.viaApiFormGroup.valid && this.transformationsUpdated) {
      console.log('Configuration:', {
        services: this.servicesFormGroup.value,
        api: this.viaApiFormGroup.value,
        transformation: this.transforamtionType === 'viaForm' ? this.transforamtionForm.value : this.transformationSpecForm.value
      })
      this.showSnackBar('API Configuration saved successfully', 'success')
    } else {
      this.showSnackBar('Please fill all required fields and add transformation', 'error')

      this.executed = true
    }
  }

  showSnackBar(message: string, type: 'error' | 'success') {
    this.snackBar.openFromComponent(SnackbarComponent, {
      data: {
        message: message, type: type,
      }, duration: 5000, panelClass: type,
    })
  }
}
