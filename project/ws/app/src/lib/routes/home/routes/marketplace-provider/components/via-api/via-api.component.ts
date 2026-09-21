import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core'
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { MarketplaceService } from '../../services/marketplace.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import * as _ from 'lodash'
import { HttpErrorResponse } from '@angular/common/http'
import { ActivatedRoute } from '@angular/router'
import { JsonEditorComponent, JsonEditorOptions } from 'ang-jsoneditor'

@Component({
    selector: 'ws-app-via-api',
    templateUrl: './via-api.component.html',
    styleUrls: ['./via-api.component.scss'],
    standalone: false,
})
export class ViaApiComponent implements OnInit, OnChanges {
  //#region (global varialbles)
  @ViewChild('jsonEditor') jsonEditor: JsonEditorComponent | undefined
  //#region (view chaild, input and output)
  @Input() providerDetails?: any
  @Input() viaApiTabIndex = 0
  @Input() tabIndex = -1
  @Input() transformationType = ''

  @Output() loadProviderDetails = new EventEmitter<Boolean>()
  //#endregion

  servicesFormGroup!: FormGroup
  viaApiFormGroup!: FormGroup
  headersFormGroup!: FormGroup
  paramsFormGroup!: FormGroup
  bodyFormGroup!: FormGroup
  authenticationFormGroup!: FormGroup
  //#region (values added dummy)
  // transforamtionForm!: FormGroup
  // providerDetalsBeforUpdate: any
  // transFormContentKeysAndControls: {
  //   lable: string,
  //   controlName: string,
  //   path: string
  // }[] = []
  //#endregion
  apiTypesList: any[] = []
  delayTabLoad = true
  displayUrl = ''
  apiUrlEdited = false

  //#region (transformation variables)
  transformationSpecForm!: FormControl
  transforamtionType = 'viaSpec'
  editorOptions = new JsonEditorOptions()
  transformationsUpdated = false
  providerConfiguration: any
  configured = false
  //#endregion
  //#endregion

  constructor(
    private formBuilder: FormBuilder,
    private marketPlaceSvc: MarketplaceService,
    private snackBar: MatSnackBar,
    private activateRoute: ActivatedRoute
  ) {
    this.getRoutesData()
    // this.initializaTion()
  }

  getRoutesData() {
    this.activateRoute.data.subscribe(data => {
      if (data.pageData.data) {
        this.providerConfiguration = data.pageData.data
      }
      this.initializaTion()
    })
  }

  initializaTion() {
    this.servicesFormGroup = this.formBuilder.group({
      serviceName: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9.\-_$/:\[\] ' !]*$/)]),
      serviceCode: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9.\-_$/:\[\] ' !]*$/)]),
      serviceDescription: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9,.\-_$/:\[\] ' !]*$/)]),
      isAuthenticated: new FormControl(false),
      strictCache: new FormControl(false),
      strictCacheTimeInMinutes: new FormControl(),
    })

    this.viaApiFormGroup = this.formBuilder.group({
      apiType: new FormControl('', [Validators.required]),
      apiUrl: new FormControl('', Validators.required),
    })

    this.paramsFormGroup = this.formBuilder.group({
      tableListFormArray: this.formBuilder.array([]),
    })

    this.headersFormGroup = this.formBuilder.group({
      tableListFormArray: this.formBuilder.array([]),
    })

    this.bodyFormGroup = this.formBuilder.group({
      tableListFormArray: this.formBuilder.array([]),
      bodyType: new FormControl('urlencoded'),
      rawData: new FormControl(''),
    })

    this.authenticationFormGroup = this.formBuilder.group({
      bodyType: new FormControl('urlencoded'),
      rawData: new FormControl('', Validators.required),
    })

    this.apiTypesList = [
      {
        type: 'Get',
        value: 'GET',
      },
      {
        type: 'Post',
        value: 'POST',
      },
    ]

    this.editorOptions.mode = 'text'
    this.editorOptions.mainMenuBar = false
    this.editorOptions.navigationBar = false
    this.editorOptions.statusBar = false
    this.editorOptions.enableSort = false
    this.editorOptions.enableTransform = false

    this.transformationSpecForm = new FormControl({}, Validators.required)

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

  get actualUrl(): string {
    const actualUrl = this.viaApiFormGroup.controls.apiUrl.value.split('?')[0]
    return actualUrl
  }

  constructDisplayUrl(paramsArray: any) {
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

  get constructParams(): { key: string; value: string }[] {
    const paramsArray: any = [
    ]
    const urlAndParams = this.displayUrl ? this.displayUrl.split('?') : []
    const paramsUrlArray = urlAndParams[1] ? urlAndParams[1].split('&') : []
    paramsUrlArray.forEach(e => {
      const keyValue = e.split('=')
      const param = {
        key: keyValue[0],
        value: keyValue[1],
      }
      paramsArray.push(param)
    })
    paramsArray.push({
      key: '',
      value: '',
    })

    return paramsArray
  }

  get paramsFormArray(): FormArray {
    return this.paramsFormGroup.controls.tableListFormArray as FormArray
  }

  constructParamsFormArray() {
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
          value: new FormControl(object.value),
        })
        this.paramsFormArray.insert(this.paramsFormArray.length - 1, formGroup)
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.viaApiTabIndex && changes.viaApiTabIndex.currentValue === this.tabIndex) {
      this.delayTabLoad = false
    }
    // if (changes.providerDetails &&
    //   changes.providerDetails.currentValue) {
    //   this.providerDetalsBeforUpdate = JSON.parse(JSON.stringify(changes.providerDetails.currentValue))
    //   this.initializTransforamtionControls()
    // }
    if (changes.providerDetails && changes.providerDetails.previousValue === undefined) {
      this.getCoursesConfiguration()
    }
  }

  getCoursesConfiguration() {
    const contentApisId = _.get(this.providerDetails, 'serviceRegistryDetails.contentApisId', null)
    if (contentApisId) {
      this.marketPlaceSvc.getConfiguraionDetails(contentApisId).subscribe((responce: any) => {
        this.patchFormData(responce)
      })
    } else {
      const transformContent = _.get(this.providerConfiguration, this.transformationType)
      this.transformationSpecForm.patchValue(transformContent)
    }
  }

  patchFormData(configurationDetails: any) {
    const urlSplit = _.get(configurationDetails, 'url')
    const headerMap = _.get(configurationDetails, 'requestPayload.headerMap')
    // const urlMap = _.get(configurationDetails, 'requestPayload.urlMap')
    const requestMap = _.get(configurationDetails, 'requestPayload.requestMap')
    const authPayload = _.get(configurationDetails, 'authPayload', {})
    this.servicesFormGroup.setValue({
      serviceName: _.get(configurationDetails, 'serviceName'),
      serviceCode: _.get(configurationDetails, 'serviceCode'),
      serviceDescription: _.get(configurationDetails, 'serviceDescription'),
      strictCache: _.get(configurationDetails, 'requestPayload.strictCache', false),
      strictCacheTimeInMinutes: _.get(configurationDetails, 'requestPayload.strictCacheTimeInMinutes', 0),
      isAuthenticated: false,
    })
    this.onToggleChange()
    this.servicesFormGroup.controls.serviceCode.disable()
    this.viaApiFormGroup.setValue({
      apiType: _.get(configurationDetails, 'requestMethod'),
      apiUrl: urlSplit,
    })

    if (headerMap) {
      this.pushObjectToFormArray(this.headersFormGroup.controls.tableListFormArray as FormArray, headerMap)
    }

    // if (urlMap) {
    //   this.pushObjectToFormArray(this.paramsFormGroup.controls.tableListFormArray as FormArray, urlMap)
    // }

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

    const transformContent = _.get(
      this.providerDetails,
      this.transformationType,
      _.get(this.providerConfiguration, this.transformationType)
    )
    this.transformationSpecForm.patchValue(transformContent)

  }

  pushObjectToFormArray(formArray: FormArray, object: any) {
    if (formArray && object) {
      for (const key in object) {
        if (object.hasOwnProperty(key)) {
          const formGroup = this.formBuilder.group({
            key: new FormControl(key),
            value: new FormControl(object[key]),
          })
          formArray.insert(formArray.length - 1, formGroup)
        }
      }
    }
  }

  //#region (code to remove. added dummy data)
  // initializTransforamtionControls() {
  //   this.transformationSpecForm = new FormControl(
  //     _.get(this.providerDetalsBeforUpdate, this.transformationType, {}), Validators.required)
  //   this.transforamtionForm = this.formBuilder.group({})
  //   this.providerDetalsBeforUpdate['certificateTemplateUrl'] =
  //     _.get(this.providerDetalsBeforUpdate, 'certificateTemplateUrl', '').replace(' ', '')
  //   let trasformationJson: any = {}
  //   if (this.transformationType === 'transformContentViaApi') {
  //     trasformationJson = _.get(this.providerConfiguration, 'trasformContentJson[0].spec')
  //   } else if (this.transformationType === 'transformProgressJson') {
  //     trasformationJson = _.get(this.providerConfiguration, 'transformProgressJson[0].spec')
  //     // } else if (_.get(this.providerDetalsBeforUpdate, 'certificateTemplateUrl')) {
  //     //   this.contentFileUploaded = true
  //   }

  //   if (trasformationJson) {
  //     Object.entries(trasformationJson).forEach(([key, path]) => {
  //       const transFormContentKeysAndControl: {
  //         lable: string,
  //         controlName: string,
  //         path: string
  //       } = {
  //         lable: key,
  //         controlName: key.replace(' ', ''),
  //         path: path as string,
  //       }
  //       this.transforamtionForm.addControl(key.replace(' ', ''), new FormControl('', Validators.required))
  //       this.transFormContentKeysAndControls.push(transFormContentKeysAndControl)
  //     })
  //   }
  // }

  ngOnInit(): void {
  }

  getControlValidation(controlName: string, validator: string): Boolean {
    const control = this.servicesFormGroup.get(controlName)
    if (control && control.errors && control.errors[validator]) {
      return true
    }
    return false
  }

  getTextLength(controlName: string) {
    return _.get(this.servicesFormGroup.get(controlName), 'value.length', 0)
  }

  authenticationToggleChange() {
    if (!this.servicesFormGroup.controls.isAuthenticated.value) {
      this.servicesFormGroup.controls.strictCache.patchValue(false)
      this.servicesFormGroup.controls.strictCacheTimeInMinutes.clearValidators()
      this.servicesFormGroup.controls.strictCacheTimeInMinutes.reset()
      this.servicesFormGroup.controls.strictCacheTimeInMinutes.updateValueAndValidity()
    }
  }

  onToggleChange() {
    if (this.servicesFormGroup.controls.strictCache.value) {
      this.servicesFormGroup.controls.strictCacheTimeInMinutes.setValidators([Validators.required])
    } else {
      this.servicesFormGroup.controls.strictCacheTimeInMinutes.clearValidators()
    }
    this.servicesFormGroup.controls.strictCacheTimeInMinutes.updateValueAndValidity()
  }

  get getUpdateBtnText(): string {
    let btnText = ''
    if (this.transformationType === 'transformContentViaApi') {
      if (this.providerConfiguration && this.providerConfiguration.transformContentViaApi) {
        btnText = 'Update Transform Content'
      } else {
        btnText = 'Save Transform Content'
      }
    } else if (this.transformationType === 'transformProgressViaApi') {
      if (this.providerConfiguration && this.providerConfiguration.transformProgressViaApi) {
        btnText = 'Update Transform Progress'
      } else {
        btnText = 'Save Transform Progress'
      }
    }
    return btnText
  }

  configure() {
    this.configured = true
    if (this.servicesFormGroup.valid && this.viaApiFormGroup.valid && this.transformationsUpdated) {
      const formBody: any = this.generatCoursesConfiguration()
      if (_.get(this.providerDetails, 'serviceRegistryDetails.contentApisId', null)) {
        formBody['id'] = _.get(this.providerDetails, 'serviceRegistryDetails.contentApisId')
        this.marketPlaceSvc.updateConfiguration(formBody).subscribe({
          next: responce => {
            if (responce) {
              const message = 'Courses get api configuration updated successfully'
              this.showSnackBar(message)
            }
          },
          error: (error: HttpErrorResponse) => {
            const errmsg = _.get(error, 'message', 'Some thing went wrong please try again')
            this.showSnackBar(errmsg)
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
            this.showSnackBar(errmsg)
          },
        })
      }
    } else {
      this.servicesFormGroup.markAllAsTouched()
      this.viaApiFormGroup.markAllAsTouched()
      this.transformationSpecForm.markAsTouched()
      if (!this.transformationsUpdated) {
        const message = 'Please update transform content'
        this.showSnackBar(message)
      }
    }
  }

  generatCoursesConfiguration() {
    const serviceDetails = this.servicesFormGroup.value
    serviceDetails['serviceCode'] = this.servicesFormGroup.controls.serviceCode.value.toUpperCase()
    const params = this.getParamsAndUrl()
    const isFormData = this.bodyFormGroup.value.tableListFormArray[0].key ? true : false
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
        requestMap: isFormData
          ? this.generateObjectFromForm(this.bodyFormGroup.value.tableListFormArray)
          : this.bodyFormGroup.value.rawData,
        headerMap: this.generateObjectFromForm(this.headersFormGroup.value.tableListFormArray),
        urlMap: this.generateObjectFromForm(this.paramsFormGroup.value.tableListFormArray, true),
      },
      authPayload: authPayload ? authPayload : {},
      strictCache: serviceDetails.strictCache,
      strictCacheTimeInMinutes: serviceDetails.strictCacheTimeInMinutes,
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

  upDateTransforamtionDetails() {
    this.providerDetails['data']['isActive'] = true
    const hasTransformationAlready = this.providerDetails[this.transformationType] ? true : false
    this.transformationSpecForm.markAsTouched()
    try {
      this.jsonEditor!.get()
      if (this.transformationSpecForm.valid && JSON.stringify(this.transformationSpecForm.value) !== '{}') {
        this.providerDetails[this.transformationType] = this.transformationSpecForm.value
        this.marketPlaceSvc.updateProvider(this.providerDetails).subscribe({
          next: (responce: any) => {
            if (responce) {
              setTimeout(() => {
                let successMsg = 'Saved Successfully'
                successMsg = hasTransformationAlready ? 'Transform Content updated successfully.' : 'Transform Content saved successfully.'
                this.showSnackBar(successMsg)
                this.transformationsUpdated = true
                this.loadProviderDetails.emit(true)
              },         1000)
            }
          },
          error: (error: HttpErrorResponse) => {
            const errmsg = _.get(error, 'error.params.errMsg', 'Something went worng, please try again later')
            this.showSnackBar(errmsg)
          },
        })

      } else {
        const message = this.transforamtionType === 'viaForm' ? 'Please provide all mandatory fields' : 'Please provide valid spec json'
        this.showSnackBar(message)
      }
    } catch (err) {
      const message = 'Please provied valid spec json'
      this.showSnackBar(message)
    }
  }

  updateProviderDetails() {
    this.marketPlaceSvc.updateProvider(this.providerDetails).subscribe({
      next: (responce: any) => {
        if (responce) {
          setTimeout(() => {
            const successMsg = 'Courses get api configured successfully'
            this.showSnackBar(successMsg)
            this.loadProviderDetails.emit(true)
          },         1000)
        }
      },
      error: (error: HttpErrorResponse) => {
        const errmsg = _.get(error, 'error.params.errMsg', 'Something went worng, please try again later')
        this.showSnackBar(errmsg)
      },
    })
  }

  showSnackBar(message: string) {
    this.snackBar.open(message)
  }

}
