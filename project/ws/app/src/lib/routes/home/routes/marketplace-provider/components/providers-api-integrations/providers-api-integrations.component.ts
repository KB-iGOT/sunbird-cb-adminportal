import { Component, Input, OnInit, SimpleChanges, OnChanges, ViewChild } from '@angular/core'
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute } from '@angular/router'
import { SnackbarComponent } from '@sunbird-cb/consumption'
import { JsonEditorComponent, JsonEditorOptions } from 'ang-jsoneditor'
import * as _ from 'lodash'
import { MarketplaceService } from '../../services/marketplace.service'

@Component({
  selector: 'ws-app-providers-api-integrations',
  templateUrl: './providers-api-integrations.component.html',
  styleUrls: ['./providers-api-integrations.component.scss']
})
export class ProvidersApiIntegrationsComponent implements OnInit, OnChanges {
  @ViewChild('jsonEditor') jsonEditor: JsonEditorComponent | undefined
  @Input() providerDetails: any

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
  providerConfiguration: any
  transformationType = 'transformContentViaApi'

  constructor(
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private activateRoute: ActivatedRoute,
    private marketPlaceSvc: MarketplaceService
  ) { }

  ngOnInit(): void {
    this.activateRoute.data.subscribe(data => {
      if (data.pageData.data) {
        this.providerConfiguration = data.pageData.data
      }
    })

    this.initializeFormGroups()
    this.setupValueChangeListeners()
    this.delayTabLoad = false

    // Load configuration after forms are initialized
    if (this.providerDetails) {
      this.getCoursesConfiguration()
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Ensure forms are initialized before attempting to patch data
    if (changes.providerDetails &&
      changes.providerDetails.previousValue === undefined &&
      this.providerDetails &&
      this.transformationSpecForm) {
      this.getCoursesConfiguration()
    }
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

  getCoursesConfiguration(): void {
    // Ensure forms are initialized
    if (!this.transformationSpecForm) {
      return
    }
    const contentApisId = _.get(this.providerDetails, 'serviceRegistryDetails.contentApisId', null)
    if (contentApisId) {
      this.marketPlaceSvc.getConfiguraionDetails(contentApisId).subscribe((responce: any) => {
        this.patchFormData(responce)
      })
    } else {
      const transformContent = _.get(this.providerConfiguration, this.transformationType)
      if (transformContent) {
        this.transformationSpecForm.patchValue(transformContent)
      }
    }
  }

  patchFormData(configurationDetails: any): void {
    const urlSplit = _.get(configurationDetails, 'url')
    const headerMap = _.get(configurationDetails, 'requestPayload.headerMap')
    const requestMap = _.get(configurationDetails, 'requestPayload.requestMap')
    const authPayload = _.get(configurationDetails, 'authPayload', {})

    this.servicesFormGroup.setValue({
      serviceName: _.get(configurationDetails, 'serviceName'),
      serviceCode: _.get(configurationDetails, 'serviceCode'),
      serviceDescription: _.get(configurationDetails, 'serviceDescription'),
      strictCache: _.get(configurationDetails, 'requestPayload.strictCache', false),
      strictCacheTimeInMinutes: _.get(configurationDetails, 'requestPayload.strictCacheTimeInMinutes', 0),
      isAuthenticated: false
    })

    this.onToggleChange()
    this.servicesFormGroup.controls.serviceCode.disable()

    this.viaApiFormGroup.setValue({
      apiType: _.get(configurationDetails, 'requestMethod'),
      apiUrl: urlSplit
    })

    if (headerMap) {
      this.pushObjectToFormArray(this.headersFormGroup.controls.tableListFormArray as FormArray, headerMap)
    }

    if (requestMap) {
      if (configurationDetails.isFormData) {
        this.bodyFormGroup.controls.bodyType.patchValue('urlencoded')
        this.pushObjectToFormArray(this.bodyFormGroup.controls.tableListFormArray as FormArray, requestMap)
      } else {
        this.bodyFormGroup.controls.bodyType.patchValue('raw')
        this.bodyFormGroup.controls.rawData.patchValue(requestMap)
      }
    }

    if (JSON.stringify(authPayload) !== '{}') {
      this.servicesFormGroup.controls.isAuthenticated.patchValue(true)
      this.authenticationFormGroup.controls.rawData.patchValue(authPayload)
    }

    const transformContent = _.get(this.providerDetails, this.transformationType, _.get(this.providerConfiguration, this.transformationType))
    this.transformationSpecForm.patchValue(transformContent)
  }

  pushObjectToFormArray(formArray: FormArray, object: any): void {
    if (formArray && object) {
      for (const key in object) {
        if (object.hasOwnProperty(key)) {
          const formGroup = this.formBuilder.group({
            key: new FormControl(key),
            value: new FormControl(object[key])
          })
          formArray.insert(formArray.length - 1, formGroup)
        }
      }
    }
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
