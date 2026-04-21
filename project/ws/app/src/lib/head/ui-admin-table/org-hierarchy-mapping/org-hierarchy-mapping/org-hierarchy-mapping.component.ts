import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core'
import { FormControl } from '@angular/forms'
import { MatSelect } from '@angular/material/select'
import { environment } from '../../../../../../../../../src/environments/environment'
import { OrgHierarchyService } from '../../services/org-hierarchy.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { GlobalEventsService } from '../../../../../../../../../src/app/services/global-events.service'
import { ActivatedRoute, Router } from '@angular/router'
import * as _ from 'lodash'
import { Subject, of } from 'rxjs'
import { switchMap, finalize, debounceTime } from 'rxjs/operators'
import { MatDialog } from '@angular/material/dialog'
import { BulkUploadOrgComponent } from '../../bulk-upload-org/bulk-upload-org.component'

@Component({
    selector: 'ws-app-org-hierarchy-mapping',
    templateUrl: './org-hierarchy-mapping.component.html',
    styleUrls: ['./org-hierarchy-mapping.component.scss'],
    standalone: false
})
export class OrgHierarchyMappingComponent implements OnInit, AfterViewInit {
  @ViewChild('singleSelect') singleSelect!: MatSelect
  @ViewChild('searchInput') searchInput!: ElementRef
  @ViewChild('fileInput') fileInput!: ElementRef

  orgTypeList = [
    { name: 'Center', value: 'ministry' },
    { name: 'State', value: 'state' },
  ]
  private destroy$ = new Subject<void>();
  bulkUploadRefresh: boolean = false
  showTreeView: boolean = false
  orgSearchData: any
  orgReadData: any
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
      showSearch: true,
      addOrgEnabled: true,
      enableInfoIcon: true
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
    private router: Router,
    private activeRoute: ActivatedRoute,
    private dialog: MatDialog
  ) { }

  get userRoles() {
    return _.get(this.activeRoute, 'snapshot.parent.data.configService.userRoles')
  }
  get orgId() {
    return _.get(this.activeRoute, 'snapshot.parent.data.configService.userProfile.rootOrgId')
  }

  ngOnInit() {
    // Initialize with all organizations
    this.filteredOrganizations = [...this.allOrganizations]

    if (this.checkIfStateAdmin()) {
      this.getOrgReadAndDetails()
    } else {
      // Listen for search input changes
      this.searchControl.valueChanges.pipe(
        debounceTime(700)).subscribe(value => {
          if (this.selectedOrgType) {
            this.getCentenrOrStateList(this.selectedOrgType, value)
          }
        })

      if (this.selectedOrgType) {
        this.getCentenrOrStateList(this.selectedOrgType, '')
      }
    }

    // Listen for organization selection changes to recreate tree view
    this.organizationCtrl.valueChanges.subscribe(() => {
      this.recreateTreeView()
    })
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  ngAfterViewInit() {
    // When the dropdown is opened, focus on the search input
    this.singleSelect?.openedChange.subscribe(opened => {
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

  async getCentenrOrStateList(orgType: string, value?: string) {
    let requestBody = {
      request: {
        filters: {
          status: 1,
          sbOrgType: '',
        },
        sort_by: {
          createdDate: "desc"
        },
        query: value || '',
        limit: 200,
        offset: 0,
        fields: [
          'identifier',
          'orgName',
          'description',
          'parentOrgName',
          'orgHierarchyFrameworkId',
          'orgHierarchyFrameworkStatus',
          'sbOrgType',
          'sbOrgSubType'
        ]
      }
    }
    if (orgType === 'ministry') {
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
    } else {
      this.loaderService.setLoaderState(false)
      this.allOrganizations = []
      this.filteredOrganizations = []
      // this.snackbar.open(`No organizations found for ${orgType}`)

    }
  }

  getOrgDetails(): any {
    if (!this.organizationCtrl.value || (!this.checkIfStateAdmin() && !this.filteredOrganizations?.length)) {
      return null
    }
    let selectedOrg: any

    if (this.checkIfStateAdmin()) {
      selectedOrg = this.orgReadData
    } else {
      selectedOrg = this.filteredOrganizations.find(organization =>
        organization.identifier === this.organizationCtrl.value
      ) || null
    }
    return selectedOrg
  }

  hasOrgHierarchyFrameworkId(): boolean {
    if (!this.organizationCtrl?.value) {
      return false
    }
    let selectedOrg: any
    if (this.checkIfStateAdmin()) {
      selectedOrg = this.orgReadData
    } else {
      selectedOrg = this.filteredOrganizations.find(org => org.identifier === this.organizationCtrl.value)
    }

    return !!selectedOrg && !!selectedOrg.orgHierarchyFrameworkId
  }

  cancelHierarchyCreation() {
    this.organizationCtrl.reset()
    this.filteredOrganizations = [...this.allOrganizations]
    this.singleSelect?.close()
  }

  async createNewHierarchy() {
    const selectedOrg = (this.checkIfStateAdmin()) ? this.orgReadData : this.getOrgDetails()
    if (selectedOrg) {
      const requestBody = {
        frameworkName: `org_hierarchy`,
        identifier: (this.checkIfStateAdmin()) ? selectedOrg.id : selectedOrg.identifier
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
          if (!this.checkIfStateAdmin()) {
            this.getCentenrOrStateList(this.selectedOrgType)
            this.organizationCtrl.setValue(selectedOrg.identifier)
          }
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
    this.router.navigate([`/app/roles/${event.additionalProperties.orgId}/users`], {
      queryParams:
      {
        currentDept: 'organisation',
        roleId: event.additionalProperties.orgId,
        depatName: event.name,
        orgName: event.name,
        tab: 'users',
        // subOrgType: !this.isAllowed(this.allowedCreateRoles) ? 'ministry' : role.data.type ? role.data.type : 'cbp-providers'
        // subOrgType: !this.isAllowed(this.allowedCreateRoles) ? 'ministry' : role.data.type ? role.data.type : 'ministry'
        subOrgType: (this.checkIfStateAdmin()) ? 'state' : this.selectedOrgType
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
    if (this.checkIfStateAdmin()) {
      return this.orgReadData
    } else {
      if (this.allOrganizations.filter((v: any) => v.identifier === this.organizationCtrl.value).length) {
        return this.allOrganizations.filter((v: any) => v.identifier === this.organizationCtrl.value)[0]
      }
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

  checkIfStateAdmin() {
    return this.userRoles && this.userRoles.has('state_admin') && !this.userRoles.has('spv_admin')
  }

  getOrgReadAndDetails() {
    const requestBody = {
      request: {
        organisationId: this.orgId,
      }
    }
    this.loaderService.setLoaderState(true)
    this.orgHieService.getOrgReadData(requestBody).pipe(
      switchMap((res: any) => {
        if (res && res.params && res.params.status.toLowerCase() === 'success') {
          // Get the organization ID from the first response
          this.orgReadData = res.result?.response || null
          if (this.orgReadData) {
            const secondRequestBody = {
              request: {
                filters: {
                  status: 1,
                  ministryOrStateType: this.orgReadData.sbOrgType,
                  ministryOrStateId: this.orgReadData.ministryOrStateId
                }
              }
            }
            if (!secondRequestBody?.request?.filters?.ministryOrStateType) {
              delete secondRequestBody?.request?.filters?.ministryOrStateType
            }
            if (!secondRequestBody?.request?.filters?.ministryOrStateId) {
              delete secondRequestBody?.request?.filters?.ministryOrStateId
            }
            this.organizationCtrl.setValue(this.orgReadData.ministryOrStateId || this.orgReadData.rootOrgId)
            return this.orgHieService.getOrganizationDetails(secondRequestBody)
          }
        }
        this.loaderService.setLoaderState(false)
        if (res?.error?.params?.errMsg) {
          this.snackbar.open(`${res.error.params.errMsg}`)
        }
        return of(null)
      }),
      finalize(() => this.loaderService.setLoaderState(false))
    ).subscribe({
      next: (detailsRes: any) => {
        if (detailsRes && detailsRes.result && detailsRes.result.content) {
          this.orgSearchData = detailsRes.result.content
        }
      },
      error: (err: any) => {
        console.error('Error in API chain:', err)
        if (err?.error?.params?.errMsg) {
          this.snackbar.open(`${err.error.params.errMsg}`)
        }
      }
    })
  }

  openBulkUploadDialog() {
    const bulkUploadConfig = {
      mainHeading: '',
      sampleFileDownloadInstructuons: {
        title: 'Open & follow these instruction',
        instructions: [
          'Keep the row of the items you wish to process',
          'Keep the row of the items you wish to process',
          'Delete the entire row you donot intend to process'
        ],
      },
      sampleFileDownloadText: 'Download Sample File',
      supportedFileTypeText2: '',
      supportedFileTypeText: 'XLSX',
      maxFileSizeText: '100 MB',
      frameworkData: this.getselectedOrgData(),
    }
    this.bulkUploadRefresh = true
    const dialogRef = this.dialog.open(BulkUploadOrgComponent, {
      data: { bulkUploadConfig },
      position: { top: '60px' },
      height: '80%',
      width: '65%',
      panelClass: 'org-bulk-upload-dialog',
      maxWidth: '100vw',
      maxHeight: '100vh',
      autoFocus: false,
    })
    dialogRef.afterClosed().subscribe(async result => {
      if (this.checkIfStateAdmin()) {
        await this.getOrgReadAndDetails()
      } else {
        await this.getCentenrOrStateList(this.selectedOrgType)
      }
      this.bulkUploadRefresh = false
      console.log('The dialog was closed', result)
    })
  }

  recreateTreeView() {
    // Destroy the tree view component
    this.showTreeView = false
    // Recreate the tree view component in the next change detection cycle
    setTimeout(() => {
      this.showTreeView = true
    }, 0)
  }

}