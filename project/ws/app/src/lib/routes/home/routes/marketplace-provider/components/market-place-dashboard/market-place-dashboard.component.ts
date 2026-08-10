import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core'
import { ConformationPopupComponent } from '../../dialogs/conformation-popup/conformation-popup.component'
import { Router } from '@angular/router'
import { MarketplaceService } from '../../services/marketplace.service'
import { HttpErrorResponse } from '@angular/common/http'
import * as _ from 'lodash'
import { debounceTime, distinctUntilChanged, map, takeWhile } from 'rxjs/operators'
import { DatePipe } from '@angular/common'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { GlobalEventsService } from '../../../../../../../../../../../src/app/services/global-events.service'
import { Subject } from 'rxjs'
import { SnackbarComponent } from '@sunbird-cb/consumption'

@Component({
  selector: 'ws-app-market-place-dashboard',
  templateUrl: './market-place-dashboard.component.html',
  styleUrls: ['./market-place-dashboard.component.scss'],
  standalone: false
})
export class MarketPlaceDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  isComponentActive = true
  helpCenterGuide = {
    header: 'SPV Help Center: Video Guides and Tips',
    guideNotes: [
      'Ensure all mandatory fields in the onboarding form regarding the content provider are filled. Once completed, proceed to uploading course catalog for the content provider.',
      'Reach out to support team for authenticating the content provider',
    ],
    helpVideoLink: `/assets/public/content/guide-videos/CIOS_Updated_demo.mp4`,
  }

  providersList: any = []
  apiSubscription: any
  displayLoader = false
  tabledata: any
  searchKey = ''
  paginationDetails: any
  menuItems: {
    icon: string,
    btnText: string,
    action: string
  }[] = []
  providersRequestsList = []
  searchProvider$ = new Subject<string>();
  searchRegisteredProvider$ = new Subject<string>();
  currentTab: string = 'onboardProviders'
  sortData: any = { field: 'updatedOn', direction: 'desc' }
  constructor(
    private dialog: MatDialog,
    private router: Router,
    private marketPlaceSvc: MarketplaceService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private loaderService: GlobalEventsService

  ) { }

  ngOnInit() {
    this.intializeTableData()
    this.searchProvider$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeWhile(() => this.isComponentActive)
    )
      .subscribe(searchKey => {
        this.searchKey = searchKey
        this.getProviders()
      })

    this.searchRegisteredProvider$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeWhile(() => this.isComponentActive)
    )
      .subscribe(searchKey => {
        this.searchKey = searchKey
        this.listProvidersRequests()
      })
  }

  ngAfterViewInit(): void {
    const container = document.querySelector('.container-balanced')
    if (container) {
      container.classList.add('container-balanced-padding')
    }
  }

  ngOnDestroy(): void {
    this.isComponentActive = false
    const container = document.querySelector('.container-balanced')
    if (container) {
      container.classList.remove('container-balanced-padding')
    }
  }

  intializeTableData() {
    this.tabledata = {
      columns: [
        { displayName: 'Content Provider Name', key: 'contentPartnerName', cellType: 'text', imageKey: 'link', hideImage: true },
        {
          displayName: 'Used Licences', key: 'registrations', cellType: 'showInfoIcon',
          infoText: 'This shows the overall license limit and the number of licenses consumed by the partner.',
        },
        { displayName: 'Onboarded On', key: 'createdOn', cellType: 'text', },
        { displayName: 'Last Updated On', key: 'updatedOn', cellType: 'text', },
        {
          displayName: 'Authentication', key: 'isAuthenticate', cellType: 'showInfoIcon',
          infoText: 'This icon indicates the authentication status of the partner with iGOT. Please connect with the technical team for further information.',
        },
        { displayName: 'Status', key: 'isActive', cellType: 'isActive' },
      ],
      needCheckBox: false,
      showDeleteAll: false,
    }

    this.menuItems = []

    this.initializePagination()
    this.getProviders()
  }

  initailizeProviderRequestsTable() {
    this.tabledata = {
      columns: [
        { displayName: 'Content Provider Name', key: 'contentPartnerName', cellType: 'text', imageKey: 'link' },
        { displayName: 'Request Received On', key: 'createdOn', cellType: 'text', },
        { displayName: 'Last Updated On', key: 'updatedOn', cellType: 'text', },
        { displayName: 'Status', key: 'status', cellType: 'status' },
      ],
      needCheckBox: false,
      showDeleteAll: false,
      acceptRejectMenu: true,
    }

    this.menuItems = []
  }

  getProviders(sort = { field: 'updatedOn', direction: 'desc' }) {
    this.displayLoader = true
    this.loaderService.setLoaderState(true)

    // this.providersList = []
    const formBody: any = {
      filterCriteriaMap: {
        // isActive: true,
        providerType: ["external"]

      },
      pageNumber: this.paginationDetails.currentPage - 1,
      pageSize: this.paginationDetails.pageSize,
      facets: [
        'contentPartnerName',
      ],
      orderBy: sort.field,
      orderDirection: sort.direction,
    }

    if (this.searchKey) {
      formBody['searchString'] = this.searchKey
    }

    if (this.apiSubscription) {
      this.apiSubscription.unsubscribe()
    }

    this.apiSubscription = this.marketPlaceSvc.getProvidersList(formBody)
      .pipe(map((responce: any) => {
        const providersDetails = {
          providersList: this.formateProvidersList(_.get(responce, 'result.data', [])),
          totalCount: _.get(responce, 'result.totalCount', 0),
        }
        return providersDetails
      }))
      .subscribe({
        next: (responce: any) => {
          this.displayLoader = false
          this.providersList = responce.providersList
          this.paginationDetails.totalCount = responce.totalCount
          this.loaderService.setLoaderState(false)
        },
        error: (error: HttpErrorResponse) => {
          this.displayLoader = false
          const errmsg = _.get(error, 'error.params.errMsg')
          this.showSnackBar(errmsg, 'error')
          this.loaderService.setLoaderState(false)
        },
      })
  }

  onSearch(searchKey: string) {
    this.searchProvider$.next(searchKey)
  }

  onSearchRegisteredPartners(searchKey: string) {
    this.searchRegisteredProvider$.next(searchKey)
  }

  formateProvidersList(responce: any) {
    const formatedList: any = []
    if (responce) {
      responce.forEach((element: any) => {
        element.createdOn = this.datePipe.transform(new Date(element.createdOn), 'MMM dd, yyyy')
        element.updatedOn = this.datePipe.transform(new Date(element.createdOn), 'MMM dd, yyyy')
        element.registrations = !element.overAllLimit ? '0 / 0' : `${element.licenseConsumedCount || 0} / ${element.overAllLimit}`
        formatedList.push(element)
      })
    }
    return formatedList
  }

  providerEvents(event: any) {
    const providerDetails = {
      id: _.get(event, 'rows.id'),
      providerName: _.get(event, 'rows.contentPartnerName'),
      isAuthenticated: _.get(event, 'rows.isAuthenticate', false),
      partnerCode: _.get(event, 'rows.partnerCode', false),
    }
    switch (event.action) {
      case 'configure':
        this.navigateToConfigurationV2(providerDetails)
        break
      case 'sso_integration':
        const providerDetailsSSO = {
          ...providerDetails,
          tab: 'sso_integration',
        }
        this.navigateToConfigurationV2(providerDetailsSSO)
        break
      case 'deactivate_provider':
        this.openConformationPopup(event.rows)
        break
      case 'activate_provider':
        this.activateProvider(event.rows)
        break
      case 'accept':
        this.acceptRejectProviderStatus('accept', event.rows)
        break
      case 'reject':
        this.acceptRejectProviderStatus('reject', event.rows)
        break
      case 'view':
        if (event?.rows?.status === 'PENDING') {
          this.navigateToConfigurationV2(providerDetails, 'PENDING')
        } else {
          this.navigateToConfigurationV2(providerDetails)
        }
        break
    }
  }

  acceptRejectProviderStatus(status: string, rowData: any) {
    const formBody = {
      id: rowData.id,
      status: status === 'accept' ? 'APPROVED' : 'REJECTED',
    }
    this.loaderService.setLoaderState(true)
    this.marketPlaceSvc.changeStatusRegisterProvider(formBody).subscribe({
      next: () => {
        this.listProvidersRequests()
        this.loaderService.setLoaderState(false)
        this.showSnackBar(`The request has been ${status === 'accept' ? 'approved' : 'rejected'} successfully.`, 'success')
      }
      , error: (error: HttpErrorResponse) => {
        this.loaderService.setLoaderState(false)
        const errmsg = _.get(error, 'error.params.errMsg', 'Something went wrong')
        this.showSnackBar(errmsg, 'error')
      },
    })

  }

  navigateToConfiguration(providerDetails?: any) {
    if (providerDetails) {
      this.router.navigate([`/app/home/marketplace-providers/onboard-partner/${providerDetails.id}`])
    } else {
      this.router.navigate([`/app/home/marketplace-providers/onboard-partner`])
    }
  }

  navigateToConfigurationV2(providerDetails?: any, status?: string) {
    const queryParams: any = {}
    if (providerDetails && providerDetails.id) {
      queryParams.id = providerDetails.id
    }
    if (providerDetails && providerDetails.tab) {
      queryParams.tab = providerDetails.tab
    }
    if (providerDetails && status) {
      queryParams.status = status
    }
    if (providerDetails) {
      this.router.navigate([`/app/home/marketplace-providers/configure-provider`], {
        queryParams: queryParams
      })
    } else {
      this.router.navigate([`/app/home/marketplace-providers/configure-provider`])
    }
  }

  openConformationPopup(provider: any) {
    const dialogData = {
      dialogType: 'warning',
      descriptions: [
        {
          header: 'Deactivating this provider will permanently disable its services after 15 days.',
          headerClass: 'flex items-center justify-center text-blue',
          messages: [
            {
              msgClass: '',
              msg: `Do you still want to proceed?`,
            },
          ],
        },
      ],
      footerClass: 'items-center justify-center',
      buttons: [
        {
          btnText: 'No',
          btnClass: 'btn-outline',
          response: false,
        },
        {
          btnText: 'Yes',
          btnClass: 'btn-full-success',
          response: true,
        },
      ],

    }
    const dialogRef = this.dialog.open(ConformationPopupComponent, {
      panelClass: 'reject-reason',
      data: dialogData,
      autoFocus: false,
      width: '626px',
      maxWidth: '80vw',
      maxHeight: '90vh',
      height: '225px',
      disableClose: true,
    })
    dialogRef.afterClosed().subscribe((res: any) => {
      if (res) {
        this.deleteProvider(_.get(provider, 'id'))
      }
    })
  }

  deleteProvider(partnerId: string) {
    this.displayLoader = true
    this.marketPlaceSvc.deleteProvider(partnerId).subscribe({
      next: (res: any) => {
        if (res) {
          setTimeout(() => {
            this.getProviders()
          }, 2000)
        } else {
          this.displayLoader = false
        }
      },
      error: (error: HttpErrorResponse) => {
        this.displayLoader = false
        const errmsg = _.get(error, 'error.params.errMsg', 'Something went wrong')
        this.showSnackBar(errmsg, 'error')
      },
    })
  }

  onPageChange(event: any) {
    this.paginationDetails.currentPage = event.currentPage
    this.paginationDetails.pageSize = event.pageSize

    if (this.currentTab === 'onboardProviders') {
      this.getProviders(this.sortData)
    } else if (this.currentTab === 'providerRequests') {
      this.listProvidersRequests(this.sortData)
    }
  }

  showSnackBar(message: string, type: 'error' | 'success') {
    this.snackBar.openFromComponent(SnackbarComponent, {
      data: {
        message: message, type: type,
      }, duration: 5000, panelClass: type,
    })
  }

  activateProvider(rowData: any) {
    this.loaderService.setLoaderState(true)
    this.marketPlaceSvc.activateProvider({ partnerId: rowData.id }).subscribe({
      next: (res: any) => {
        if (res) {
          this.getProviders()
          this.loaderService.setLoaderState(false)
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loaderService.setLoaderState(false)
        if (error) {
          this.showSnackBar('Something went wrong please try again', 'error')
        }
      }
    })
  }

  handleOnTabChange(event: any) {
    if (event.index === 0) {
      this.intializeTableData()
      this.currentTab = 'onboardProviders'
    }
    if (event.index === 1) {
      this.initailizeProviderRequestsTable()
      this.initializePagination()
      this.listProvidersRequests()
      this.currentTab = 'providerRequests'
    }
  }

  listProvidersRequests(sort = { field: 'createdOn', direction: 'desc' }) {
    this.loaderService.setLoaderState(true)
    this.providersRequestsList = []
    const formBody: any = {
      filterCriteriaMap: {
        "status": "PENDING"
      },
      pageNumber: this.paginationDetails.currentPage - 1,
      pageSize: this.paginationDetails.pageSize,
      orderBy: sort.field,
      orderDirection: sort.direction,
    }

    if (this.searchKey) {
      formBody['searchString'] = this.searchKey
    }

    if (this.apiSubscription) {
      this.apiSubscription.unsubscribe()
    }

    this.apiSubscription = this.marketPlaceSvc.contentRegisterList(formBody)
      .pipe(map((response: any) => {
        const providersDetails = {
          data: this.formateProvidersList(_.get(response, 'result.data', [])),
          totalCount: _.get(response, 'result.totalCount', 0),
        }
        return providersDetails
      }))
      .subscribe({
        next: (response: any) => {
          this.providersRequestsList = response.data
          this.paginationDetails.totalCount = response.totalCount
          this.loaderService.setLoaderState(false)
        },
        error: (error: HttpErrorResponse) => {
          this.loaderService.setLoaderState(false)
          const errmsg = _.get(error, 'error.params.errMsg')
          this.showSnackBar(errmsg, 'error')
        },
      })
  }

  initializePagination() {
    this.paginationDetails = {
      currentPage: 1,
      pageSize: 20,
      totalCount: 20,
      paginationSizeOptions: [20, 50, 100]
    }
    this.sortData = { field: 'createdOn', direction: 'desc' }
  }

  onSortChange(event: { field: string, direction: string }) {
    if (event.field === 'isActive') return
    this.initializePagination()
    this.sortData = event
    if (this.currentTab === 'onboardProviders') {
      this.getProviders(event)
    } else if (this.currentTab === 'providerRequests') {
      this.listProvidersRequests(event)
    }
  }

}
