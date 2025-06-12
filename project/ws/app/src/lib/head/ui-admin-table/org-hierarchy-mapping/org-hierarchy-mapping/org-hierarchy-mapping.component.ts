import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core'
import { FormControl } from '@angular/forms'
import { MatSelect } from '@angular/material/select'
import { environment } from '../../../../../../../../../src/environments/environment'
import { OrgHierarchyService } from '../../services/org-hierarchy.service'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { GlobalEventsService } from '../../../../../../../../../src/app/services/global-events.service'

@Component({
  selector: 'ws-app-org-hierarchy-mapping',
  templateUrl: './org-hierarchy-mapping.component.html',
  styleUrls: ['./org-hierarchy-mapping.component.scss']
})
export class OrgHierarchyMappingComponent implements OnInit, AfterViewInit {
  @ViewChild('singleSelect') singleSelect!: MatSelect
  @ViewChild('searchInput') searchInput!: ElementRef

  orgTypeList = [
    { name: 'Center', value: 'center' },
    { name: 'State', value: 'state' },
  ]

  allOrganizations = [];

  defaultOrgConfig = {
    config: [{
      index: 1,
      category: 'competencyarea',
      icon: 'person',
      color: '#F8B861',
      createBtnEnabled: false,
      iconEnabled: false,
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
    private loaderService: GlobalEventsService
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

}