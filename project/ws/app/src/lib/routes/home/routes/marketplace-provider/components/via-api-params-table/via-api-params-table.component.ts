import { Component, Input, OnInit } from '@angular/core'
import { FormArray, FormBuilder, FormGroup } from '@angular/forms'
import { JsonEditorOptions } from 'ang-jsoneditor'

@Component({
    selector: 'ws-app-via-api-params-table',
    templateUrl: './via-api-params-table.component.html',
    styleUrls: ['./via-api-params-table.component.scss'],
    standalone: false,
})
export class ViaApiParamsTableComponent implements OnInit {
  //#region (global varialbles)
  //#region (view chaild, input and output)
  @Input() tableListFormGroup?: FormGroup
  @Input() paramsType = 'params'
  //#endregion

  paramsHeader = 'Query Params'
  showTable = true
  editorOptions = new JsonEditorOptions()
  //#endregion

  constructor(
    private formBuilder: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.initialization()
  }

  initialization() {
    if (this.paramsType !== 'authentication') {
      this.addParams()
    }
    switch (this.paramsType) {
      case 'params':
        this.paramsHeader = 'Query Params'
        break
      case 'headers':
        this.paramsHeader = 'Headers'
        break
      case 'body':
        this.paramsHeader = 'Body'
        this.editorOptions.mode = 'text'
        this.editorOptions.mainMenuBar = false
        this.editorOptions.navigationBar = false
        this.editorOptions.statusBar = false
        this.editorOptions.enableSort = false
        this.editorOptions.enableTransform = false
        this.onBodyTypeChange()
        break
      case 'authentication':
        this.paramsHeader = 'Authentication'
        this.editorOptions.mode = 'text'
        this.editorOptions.mainMenuBar = false
        this.editorOptions.navigationBar = false
        this.editorOptions.statusBar = false
        this.editorOptions.enableSort = false
        this.editorOptions.enableTransform = false
        this.showTable = false
        break

    }
  }

  get tableList(): FormArray {
    if (this.tableListFormGroup) {
      return this.tableListFormGroup.controls.tableListFormArray as FormArray
    }
    return this.formBuilder.array([])
  }

  addParams(): void {
    const nameGroup = this.formBuilder.group({
      key: [''],
      value: [''],
    })
    this.tableList.push(nameGroup)
  }

  onParamInput(index: number) {
    if (index + 1 === this.tableList.controls.length) {
      this.addParams()
    }
  }

  onBodyTypeChange() {
    if (this.tableListFormGroup && this.tableListFormGroup.controls && this.tableListFormGroup.controls.bodyType) {
      this.tableListFormGroup.controls.bodyType.valueChanges.subscribe((val: string) => {
        this.showTable = val === 'urlencoded' ? true : false
      })
    }
  }

}
