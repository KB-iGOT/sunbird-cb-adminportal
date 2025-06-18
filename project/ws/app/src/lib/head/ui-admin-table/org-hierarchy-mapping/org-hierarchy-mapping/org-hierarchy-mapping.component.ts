import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core'
import { FormControl } from '@angular/forms'
import { MatSelect } from '@angular/material/select'
import { environment } from '../../../../../../../../../src/environments/environment'
import { OrgHierarchyService } from '../../services/org-hierarchy.service'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { GlobalEventsService } from '../../../../../../../../../src/app/services/global-events.service'
import { Router } from '@angular/router'

@Component({
  selector: 'ws-app-org-hierarchy-mapping',
  templateUrl: './org-hierarchy-mapping.component.html',
  styleUrls: ['./org-hierarchy-mapping.component.scss']
})
export class OrgHierarchyMappingComponent implements OnInit, AfterViewInit {
  @ViewChild('singleSelect') singleSelect!: MatSelect
  @ViewChild('searchInput') searchInput!: ElementRef

  @ViewChild('fileInput') fileInput!: ElementRef

  orgTypeList = [
    { name: 'Center', value: 'center' },
    { name: 'State', value: 'state' },
  ]

  bulkUploadRefresh: boolean = false

  allOrganizations = [];

  defaultOrgConfig = {
    config: [{
      index: 1,
      category: 'competencyarea',
      icon: 'person',
      color: '#F8B861',
      createBtnEnabled: false,
      iconEnabled: false,
      levelNameEdit: true,
      // categoryDisplayName: 'Competency Area',
      // labelName: 'Competency Area',
      enableManageOrganization: true,
      enableUpdateHierarchy: true,
      enabaleRemoveConnection: true,
      enableThreeDot: true,
      showSearch: false,
      addOrgEnabled: true,
    }]
  }

  environmentVal: any = environment

  filteredOrganizations: any[] = [];
  selectedOrgType: string = 'state'; // Default selected organization type

  // Form controls
  public organizationCtrl: FormControl = new FormControl();
  public searchControl: FormControl = new FormControl();

  constructor(
    private snackbar: MatSnackBar,
    private orgHieService: OrgHierarchyService,
    private loaderService: GlobalEventsService,
    private router: Router
  ) { }

  ngOnInit() {
    // Initialize with all organizations
    this.filteredOrganizations = [...this.allOrganizations]

    // Listen for search input changes
    this.searchControl.valueChanges.subscribe(value => {
      this.filterOrganizations(value)
    })

    if (this.selectedOrgType) {
      this.getCentenrOrStateList(this.selectedOrgType)
    }
  }

  ngAfterViewInit() {
    // When the dropdown is opened, focus on the search input
    this.singleSelect.openedChange.subscribe(opened => {
      if (opened) {
        setTimeout(() => {
          this.searchInput.nativeElement.focus()
        })
      } else {
        // Optional: Reset search when dropdown closes
        this.searchControl.setValue('')
      }
    })
  }

  filterOrganizations(value: string) {
    if (!value) {
      this.filteredOrganizations = [...this.allOrganizations]
      return
    }

    const filterValue = value.toLowerCase()
    this.filteredOrganizations = this.allOrganizations.filter((org: any) =>
      org.orgName.toLowerCase().includes(filterValue)
    )
  }

  orgSelected(event: any) {
    this.organizationCtrl.reset()
    if (event !== this.selectedOrgType) {
      this.selectedOrgType = event
      this.getCentenrOrStateList(this.selectedOrgType)
    }
  }

  async getCentenrOrStateList(orgType: string) {
    let requestBody = {
      request: {
        filters: {
          status: 1,
          sbOrgType: '',
          ministryOrStateType: "SPV"
        },
        sort_by: {
          createdDate: "desc"
        },
        limit: 200,
        offset: 0,
        fields: [
          'identifier',
          'orgName',
          'description',
          'parentOrgName',
          'orgHierarchyFrameworkId',
          'orgHierarchyFrameworkStatus',
          'sbOrgType'
        ]
      }
    }
    if (orgType === 'center') {
      requestBody.request.filters.sbOrgType = 'ministry'
    } else if (orgType === 'state') {
      requestBody.request.filters.sbOrgType = 'state'
    }
    this.loaderService.setLoaderState(true)
    const listRes = await this.orgHieService.getCenterOrStateList(requestBody).toPromise().catch(_err => {
      this.loaderService.setLoaderState(false)
    })
    if (listRes && listRes.result && listRes.result.response &&
      listRes.result.response.content && listRes.result.response.content.length > 0
    ) {
      this.loaderService.setLoaderState(false)
      this.allOrganizations = listRes.result.response.content
      this.filteredOrganizations = [...this.allOrganizations]
    }
  }

  getOrgDetails(): any {
    if (!this.organizationCtrl.value || !this.filteredOrganizations?.length) {
      return null
    }

    return this.filteredOrganizations.find(organization =>
      organization.identifier === this.organizationCtrl.value
    ) || null
  }

  hasOrgHierarchyFrameworkId(): boolean {
    if (!this.organizationCtrl?.value) {
      return false
    }

    const selectedOrg = this.filteredOrganizations.find(org => org.identifier === this.organizationCtrl.value)
    return !!selectedOrg && !!selectedOrg.orgHierarchyFrameworkId
  }

  cancelHierarchyCreation() {
    this.organizationCtrl.reset()
    this.filteredOrganizations = [...this.allOrganizations]
    this.singleSelect.close()
  }

  async createNewHierarchy() {
    const selectedOrg = this.getOrgDetails()
    if (selectedOrg) {
      const requestBody = {
        frameworkName: `org_hierarchy`,
        identifier: selectedOrg.identifier
      }
      this.loaderService.setLoaderState(true)
      const createFrameworkData = await this.orgHieService.createMasterFrameWork(requestBody).toPromise().catch(_err => {
        this.loaderService.setLoaderState(false)
        if (_err && _err.error && _err.error.params && _err.error.params.errMsg) {
          this.snackbar.open(`${_err.error.params.errMsg}`)
          this.cancelHierarchyCreation()
        }
      })
      if (createFrameworkData && createFrameworkData.result && createFrameworkData.result.framework) {
        this.cancelHierarchyCreation()
        setTimeout(() => {
          this.loaderService.setLoaderState(false)
          this.getCentenrOrStateList(this.selectedOrgType)
          this.organizationCtrl.setValue(selectedOrg.identifier)
          this.snackbar.open(`Framework created successfully for ${selectedOrg.orgName}`)
        }, 2000)
      } else {
        this.loaderService.setLoaderState(false)
        this.snackbar.open(`Failed to create framework for ${selectedOrg.orgName}`)
      }
    }
  }

  checkloader($event: boolean) {
    this.loaderService.setLoaderState($event)
  }

  redirectOrg(event: any) {
    console.log('redirectOrg', event)
    this.router.navigate([`/app/roles/${event.additionalProperties.orgId}/users`], {
      queryParams:
      {
        currentDept: 'organisation',
        roleId: event.additionalProperties.orgId,
        depatName: event.additionalProperties.orgName,
        orgName: event.additionalProperties.orgName,
        tab: 'users',
        // subOrgType: !this.isAllowed(this.allowedCreateRoles) ? 'ministry' : role.data.type ? role.data.type : 'cbp-providers'
        // subOrgType: !this.isAllowed(this.allowedCreateRoles) ? 'ministry' : role.data.type ? role.data.type : 'ministry'
        subOrgType: event.additionalProperties.ministryOrStateType
      }
    })
  }

  async downloadTemplate() {
    const frameworkData: any = this.getselectedOrgData()
    if (frameworkData && frameworkData.orgHierarchyFrameworkId) {
      this.loaderService.setLoaderState(true)
      const fileData: any = await this.orgHieService.downloadSampleTemplate(frameworkData.orgHierarchyFrameworkId).toPromise().catch(_err => {
        this.loaderService.setLoaderState(false)
        if (_err && _err.error && _err.error.params && _err.error.params.errMsg) {
          this.snackbar.open(`${_err.error.params.errMsg}`)
        }
      })
      if (fileData) {
        this.snackbar.open(`Download successfully`)
      }
    }
  }

  async exportData() {
    const frameworkData: any = this.getselectedOrgData()
    if (frameworkData && frameworkData.orgHierarchyFrameworkId) {
      this.loaderService.setLoaderState(true)
      const fileData: any = await this.orgHieService.exportFramework(frameworkData.orgHierarchyFrameworkId).toPromise().catch(_err => {
        this.loaderService.setLoaderState(false)
        if (_err && _err.error && _err.error.params && _err.error.params.errMsg) {
          this.snackbar.open(`${_err.error.params.errMsg}`)
        }
      })
      if (fileData) {
        this.snackbar.open(`Exported successfully for ${frameworkData.orgName}`)
      }
    }
  }

  getselectedOrgData() {
    if (this.allOrganizations.filter((v: any) => v.identifier === this.organizationCtrl.value).length) {
      return this.allOrganizations.filter((v: any) => v.identifier === this.organizationCtrl.value)[0]
    }
    return null
  }

  onFileSelected(event: any) {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      if (!this.isValidExcelFile(file)) {
        this.showMessage('Please select a valid Excel file (.xlsx)')
        this.clearFileInput()
        return
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showMessage('File size should not exceed 5MB')
        this.clearFileInput()
        return
      }
      this.uploadExcelFile(file)
    }
  }

  isValidExcelFile(file: File): boolean {
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    console.log('File type: ', allowedTypes)
    return allowedTypes.includes(file.type)
  }

  async uploadExcelFile(file: File) {
    // Create form data
    const formData = new FormData()
    formData.append('file', file)
    this.loaderService.setLoaderState(true)
    this.bulkUploadRefresh = true
    const uploadFileRes = await this.orgHieService.uploadFreameworkTemplate(formData, this.getselectedOrgData()).toPromise().catch((_err: any) => {
      this.loaderService.setLoaderState(false)
      this.bulkUploadRefresh = false
      if (_err && _err.error && _err.error.params && _err.error.params.errMsg) {
        this.snackbar.open(`${_err.error.params.errMsg}`)
      }
    })

    if (uploadFileRes && uploadFileRes.result && uploadFileRes.result.fileName) {
      this.loaderService.setLoaderState(false)
      this.snackbar.open(`File uploaded successfully. Please check after 5 minutes for the results.`)
    }
  }

  clearFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = ''
    }
  }

  showMessage(message: string) {
    this.snackbar.open(message, 'Close', {
      duration: 5000,
    })
  }

}