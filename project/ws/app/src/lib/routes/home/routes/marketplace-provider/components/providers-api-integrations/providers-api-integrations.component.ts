import { Component, Input, OnInit, SimpleChanges, OnChanges, ViewChild } from '@angular/core'
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute } from '@angular/router'
import { SnackbarComponent } from '@sunbird-cb/consumption'
import { JsonEditorComponent, JsonEditorOptions } from 'ang-jsoneditor'
import * as _ from 'lodash'
import { MarketplaceService } from '../../services/marketplace.service'
import { HttpErrorResponse } from '@angular/common/http'

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
  // transforamtionForm!: FormGroup

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
      this.providerDetails) {
      this.getCoursesConfiguration()
    }
  }

  private initializeFormGroups(): void {
    this.servicesFormGroup = this.formBuilder.group({
      serviceName: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9.\-_$/:\[\]'!\s]*$/)]),
      serviceCode: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9.\-_$/:\[\]'!]*$/)]),
      serviceDescription: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9,.\-_$/:\[\]'!\s\n]*$/)]),
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

    // this.transforamtionForm = this.formBuilder.group({})

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
    // if (!this.transformationSpecForm) {
    //   return
    // }
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
      this.authenticationToggleChange()
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
      this.apiMetadata = this.apiMetadata.filter(item => item.name !== 'Authentication')
    } else {
      this.apiMetadata.push({ name: 'Authentication', value: 'authPayload' })
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
    const hasTransformationAlready = this.providerDetails[this.transformationType] ? true : false
    // if (this.transforamtionType === 'viaForm') {
    //   if (this.transforamtionForm.valid) {
    //     this.transformationsUpdated = true
    //     this.showSnackBar('Transformation updated successfully', 'success')
    //   }
    // } else if (this.transforamtionType === 'viaSpec') {
    this.transformationSpecForm.markAsTouched()
    if (this.transformationSpecForm.valid) {
      try {
        if (this.jsonEditor) {
          this.jsonEditor!.get()
        }
        if (this.transformationSpecForm.valid && JSON.stringify(this.transformationSpecForm.value) !== '{}') {
          this.providerDetails[this.transformationType] = this.transformationSpecForm.value
          this.marketPlaceSvc.updateProvider(this.providerDetails).subscribe({
            next: (responce: any) => {
              if (responce) {
                setTimeout(() => {
                  let successMsg = 'Saved Successfully'
                  successMsg = hasTransformationAlready ? 'Transformation updated successfully.' : 'Transformation saved successfully.'
                  this.showSnackBar(successMsg, 'success')
                  this.transformationsUpdated = true
                }, 1000)
              }
            },
            error: (error: HttpErrorResponse) => {
              const errmsg = _.get(error, 'error.params.errMsg', 'Something went worng, please try again later')
              this.showSnackBar(errmsg, 'error')
            },
          })

        } else {
          const message = 'Please provied valid spec json'
          this.showSnackBar(message, 'error')
        }
      } catch (err) {
        const message = 'Please provied valid spec json'
        this.showSnackBar(message, 'error')
      }
    }
    // }
  }

  get getUpdateBtnText(): string {
    return _.get(this.providerConfiguration, this.transformationType) ? 'Update' : 'Add'
  }

  configure(): void {
    if (this.servicesFormGroup.valid && this.viaApiFormGroup.valid && this.transformationsUpdated) {
      const formBody: any = this.generatCoursesConfiguration()
      if (_.get(this.providerDetails, 'serviceRegistryDetails.contentApisId', null)) {
        formBody['id'] = _.get(this.providerDetails, 'serviceRegistryDetails.contentApisId')
        this.marketPlaceSvc.updateConfiguration(formBody).subscribe({
          next: responce => {
            if (responce) {
              const message = 'API Configuration saved successfully'
              this.showSnackBar(message, 'success')
            }
          },
          error: (error: HttpErrorResponse) => {
            const errmsg = _.get(error, 'message', 'Some thing went wrong please try again')
            this.showSnackBar(errmsg, 'error')
          },
        })
      } else {
        this.marketPlaceSvc.createConfiguration(formBody).subscribe({
          next: (responce: any) => {
            if (responce) {
              if (this.providerDetails['serviceRegistryDetails']) {
                this.providerDetails['serviceRegistryDetails']['contentApisId'] = responce.id
              } else {
                this.providerDetails['serviceRegistryDetails'] = {
                  contentApisId: responce.id,
                }
              }
              this.updateProviderDetails()
            }
          },
          error: (error: HttpErrorResponse) => {
            const errmsg = _.get(error, 'message', 'Some thing went wrong please try again')
            this.showSnackBar(errmsg, 'error')
          },
        })
      }
    } else {
      this.servicesFormGroup.markAllAsTouched()
      this.viaApiFormGroup.markAllAsTouched()
      if (this.servicesFormGroup.invalid || this.viaApiFormGroup.invalid) {
        this.showSnackBar('Please fill all required fields and add transformation', 'error')
      } else if (!this.transformationsUpdated) {
        if (_.get(this.providerConfiguration, this.transformationType)) {
          this.showSnackBar('Please update transform content', 'error')
        } else {
          this.showSnackBar('Please add transform content', 'error')
        }
      }
      this.executed = true
    }
  }

  generatCoursesConfiguration() {
    const serviceDetails = this.servicesFormGroup.value
    serviceDetails['serviceCode'] = this.servicesFormGroup.controls.serviceCode.value.toUpperCase()
    const params = this.getParamsAndUrl()
    const isFormData = _.get(this.bodyFormGroup, 'value.tableListFormArray[0].key') ? true : false
    const authPayload = _.get(this.authenticationFormGroup, 'value.rawData', '{}')
    const formBody = {
      isFormData,
      requestMethod: this.viaApiFormGroup.controls.apiType.value,
      url: params.url,
      serviceCode: serviceDetails.serviceCode,
      serviceName: serviceDetails.serviceName,
      serviceDescription: serviceDetails.serviceDescription,
      operationType: 'PEER_TO_PEER',
      urlPlaceholder: params.urlPlaceholder,
      isActive: true,
      isSecureHeader: true,
      urlSegment: null,
      hostAddress: null,
      partnerCode: _.get(this.providerDetails, 'data.partnerCode'),
      requestPayload: {
        requestMap: isFormData ? this.generateObjectFromForm(this.bodyFormGroup.value.tableListFormArray) : this.bodyFormGroup.value.rawData,
        headerMap: this.generateObjectFromForm(this.headersFormGroup.value.tableListFormArray),
        urlMap: this.generateObjectFromForm(this.paramsFormGroup.value.tableListFormArray, true)
      },
      authPayload: authPayload ? authPayload : {},
      strictCache: serviceDetails.strictCache,
      strictCacheTimeInMinutes: serviceDetails.strictCacheTimeInMinutes
    }
    return formBody
  }

  getParamsAndUrl() {
    const parmsAndUrl = {
      url: `${this.actualUrl}`,
      urlPlaceholder: '',
    }
    const params = this.paramsFormGroup.value.tableListFormArray
    if (params && params[0].key) {
      let paramsUrl = ''
      params.forEach((element: any) => {
        if (element.key) {
          paramsUrl = `${paramsUrl}&${element['key']}={${element['key']}}`
          parmsAndUrl.urlPlaceholder =
            `${parmsAndUrl.urlPlaceholder}${parmsAndUrl.urlPlaceholder.length === 0 ? '{' : ',{'}${element['key']}}`
        }
      })
      if (paramsUrl) {
        parmsAndUrl.url = `${parmsAndUrl.url}?${paramsUrl}`
      }
    }
    return parmsAndUrl
  }

  generateObjectFromForm(form: any, isParams = false) {
    const generatedObject: any = {}
    if (form && form[0] && form[0].key) {
      form.forEach((element: any) => {
        if (element.key) {
          generatedObject[element.key] = isParams ? `{${element.key}}` : element.value
        }
      })
    }
    return generatedObject
  }

  updateProviderDetails() {
    this.marketPlaceSvc.updateProvider(this.providerDetails).subscribe({
      next: (responce: any) => {
        if (responce) {
          setTimeout(() => {
            const successMsg = 'API Configuration saved successfully'
            this.showSnackBar(successMsg, 'success')
          }, 1000)
        }
      },
      error: (error: HttpErrorResponse) => {
        const errmsg = _.get(error, 'error.params.errMsg', 'Something went worng, please try again later')
        this.showSnackBar(errmsg, 'error')
      },
    })
  }

  showSnackBar(message: string, type: 'error' | 'success') {
    this.snackBar.openFromComponent(SnackbarComponent, {
      data: {
        message: message, type: type,
      }, duration: 5000, panelClass: type,
    })
  }
}
