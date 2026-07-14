import { AfterViewInit, Component, OnInit, OnDestroy, ElementRef, HostListener, ViewChild } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import * as _ from 'lodash'
import { ProfileV2UtillService } from '../../../home/services/home-utill.service'
import { ProfileV2Service } from '../../../home/services/home.servive'
import { UsersService } from '../../../home/services/users.service'
import { LoaderService } from '../../../home/services/loader.service'
import { OrgHierarchyService } from '../../../../head/ui-admin-table/services/org-hierarchy.service'
import { map, switchMap } from 'rxjs/operators'
import { of } from 'rxjs'
// import { UsersService } from '../../services/users.service'
// interface IUSER {
//   profileDetails: any; isDeleted: boolean; userId: string | null; firstName: any
//   lastName: any; email: any; active: any; blocked: any; roles: any[]
// }
@Component({
  selector: 'ws-app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  standalone: false
})

export class UsersComponent implements OnInit, AfterViewInit, OnDestroy {
  tabledata: any = []
  currentTab = 'users'
  data: any = []
  role: any
  tabsData!: any[]
  elementPosition: any
  sticky = false
  basicInfo: any
  id!: string
  currentDept!: string
  deptName!: string
  userWholeData!: any
  userWholeData1!: any
  createdDepartment!: any
  limit: number = 20
  pageIndex = 0
  currentOffset = 0
  totalRecordsCount = 0
  private defaultSideNavBarOpenedSubscription: any
  @ViewChild('stickyMenu', { static: true }) menuElement!: ElementRef
  goToImportMaster = false
  subOrgType: any
  @HostListener('window:scroll', ['$event'])
  handleScroll() {
    const windowScroll = window.pageYOffset
    if (windowScroll >= this.elementPosition) {
      this.sticky = true
    } else {
      this.sticky = false
    }
  }
  isReportsPath = false
  userRoles: any
  allowedCreateRoles = ['DASHBOARD_ADMIN', 'SPV_ADMIN', 'SPV_PUBLISHER', 'STATE_ADMIN']
  orgDataLoaded: boolean = false
  orgData: any
  organisationType: number = 0
  constructor(private usersSvc: UsersService, private router: Router,
    private route: ActivatedRoute,
    private profile: ProfileV2Service,
    private profileUtilSvc: ProfileV2UtillService,
    private usersService: UsersService,
    private orgHieService: OrgHierarchyService,
    private loaderService: LoaderService,
  ) {
  }
  ngOnInit() {
    this.userRoles = this.route.parent && this.route.parent.snapshot.data.configService.userRoles
    this.tabsData = [
      {
        name: 'Users',
        key: 'users',
        render: true,
        enabled: true,
      },
      {
        name: 'Roles and access',
        key: 'rolesandaccess',
        render: true,
        enabled: true,
      },
      // {
      //   name: 'Mentor Management',
      //   key: 'mentormanage',
      //   render: true,
      //   enabled: true,
      // },
      {
        name: 'Designation Master',
        key: 'designation_master',
        render: true,
        enabled: true,
      },
      {
        name: 'User Transfer',
        key: 'user_transfer',
        render: true,
        enabled: true,
      },

      // {
      //   name: 'Grade/Group setting',
      //   key: 'grade_setting',
      //   render: true,
      //   enabled: true,
      // },
    ]

    const queryParam = _.get(this.route, 'snapshot.queryParams')
    if (queryParam) {
      this.orgData = queryParam
    }
    this.checkAndGetOrgData()


    const url = this.router.url.split('/')
    this.role = url[url.length - 2]
    this.route.queryParams.subscribe(params => {
      this.id = params['id']
      this.id = params['roleId']
      this.currentDept = params['currentDept']
      this.deptName = params['depatName']
      this.currentTab = params['tab'] || 'users'
      this.subOrgType = params['subOrgType']
      this.organisationType = params['organisationType'] || 0
      this.isReportsPath = this.router.url.includes('path=reports')

      if (this.currentTab.split('/').length > 1 && this.currentTab.split('/')[1] === 'import-designation') {
        this.currentTab = 'designation_master'
        this.goToImportMaster = true
      }

      if (this.currentDept && this.deptName) {
        const obj = {
          depName: this.deptName,
          depType: this.currentDept,
        }
        this.createdDepartment = obj
      }
      if (this.id === 'SPV ADMIN') {
        this.getAllActiveUsers()
      } else {
        // this.getAllActiveUsersByDepartmentId(this.id)
        this.getAllKongUsers()
      }

    })
    // int left blank
    this.tabledata = {
      columns: [
        { displayName: 'Full name', key: 'fullName' },
        { displayName: 'Email', key: 'email' },
        { displayName: 'Roles', key: 'position' },
      ],
      needCheckBox: false,
      needHash: false,
      sortColumn: '',
      sortState: 'asc',
    }

    // if (this.currentDept === 'organisation') {
    this.tabledata['actions'] = [{ name: 'Edit', label: 'Edit info', optional: true, icon: 'remove_red_eye', type: 'button' }]
    // }

    if (!this.isAllowed(this.allowedCreateRoles)) {
      this.tabsData = this.tabsData.filter(item => !(['designation_master'].includes(item.key)))
    }
    if (this.currentDept === 'cbp-providers') {
      this.tabsData = this.tabsData.filter(tab => tab?.key !== 'mentormanage' && tab?.key !== 'designation_master')
    }
    if (this.currentDept === 'volunteer') {
      this.tabsData = this.tabsData.filter(tab => tab?.key !== 'rolesandaccess' && tab?.key !== 'designation_master' && tab?.key !== 'user_transfer')
    }


  }
  ngAfterViewInit() {
    // this.elementPosition = this.menuElement.nativeElement.parentElement.offsetTop
    this.elementPosition = 127
  }
  onSideNavTabClick(id: string) {
    this.currentTab = id
    if (this.currentTab === 'users') {
      this.getAllActiveUsersByDepartmentId(this.id)
    } else if (this.currentTab === 'mentormanage') {
      this.getMentorManage()
    }
    const el = document.getElementById(id)
    if (el != null) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' })
    }
  }

  /* API call to get all roles*/
  getAllActiveUsersByDepartmentId(id: string) {
    this.usersSvc.getUsersByDepartment(id).subscribe(res => {
      this.data = res.active_users.map((user: any) => {
        const userRole: any[] = []
        user.roleInfo.forEach((role: { roleName: any }) => {
          userRole.push(role.roleName)
        })
        return {
          fullName: `${user.firstName}`,
          // fullName: `${user.firstName} ${user.lastName}`,
          email: this.profileUtilSvc.emailTransform(user.emailId),
          position: userRole,
          role: user.roleInfo.roleName,
        }
      })
    })

  }
  /* API call to get all roles*/
  getAllActiveUsers() {
    this.profile.getMyDepartment().subscribe(res => {
      this.data = res.active_users.map((user: any) => {
        const userRole: any[] = []
        user.roleInfo.forEach((role: { roleName: any }) => {
          userRole.push(role.roleName)
        })
        return {
          fullName: `${user.firstName}`,
          // fullName: `${user.firstName} ${user.lastName}`,
          email: this.profileUtilSvc.emailTransform(user.emailId),
          position: userRole,
          role: user.roleInfo.roleName,
        }
      })
    })
  }
  gotoAddAdmin() {
    this.router.navigate([`/app/roles/${this.id}/basicinfo`, { addAdmin: true, currentDept: this.currentDept }])
  }
  ngOnDestroy() {
    if (this.defaultSideNavBarOpenedSubscription) {
      this.defaultSideNavBarOpenedSubscription.unsubscribe()
    }
  }
  fClickedDepartment(roldata: any) {
    const usersData: any[] = []
    let roles: any[] = []
    this.usersService.getAllRoleUsers(this.id, roldata).subscribe(resdata => {
      if (resdata.count) {
        this.userWholeData1 = resdata.count.content || []
        this.userWholeData1.forEach((user: any) => {
          user.organisations.forEach((org: { organisationId: string, roles: any }) => {
            // if (org.organisationId === rootOrgId) {
            roles = org.roles
            // }

          })
          const email = this.profileUtilSvc.emailTransform(_.get(user, 'profileDetails.personalDetails.primaryEmail'))
          const mobileNumber = _.get(user, 'profileDetails.personalDetails.mobile')
          if (!user.isDeleted && roles.includes(roldata)) {
            usersData.push({
              fullName: user ? `${user.firstName}` : null,
              // fullName: user ? `${user.firstName} ${user.lastName}` : null,
              email: email || 'NA',
              mobile: mobileNumber,
              position: roles,
              userId: user.userId,
            })
          }
        })
      }
      this.data = usersData
      this.currentTab = 'users'
    })

  }
  getAllKongUsers() {
    const status = 1
    this.currentOffset = this.limit * ((this.pageIndex + 1) - 1)
    const query = ''
    this.usersService.getAllKongUsersPaginated(this.id, status, this.limit, this.currentOffset, query).subscribe(data => {
      if (data.result.response.content) {
        this.userWholeData = data.result.response.content || []
        this.totalRecordsCount = data.result.response.count || 0
        this.newKongUser()
      }
    })
  }
  newKongUser() {
    // const rootOrgId = _.get(this.route.snapshot.parent, 'data.configService.unMappedUser.rootOrg.rootOrgId')
    const usersData: any[] = []
    let roles: any[] = []
    this.userWholeData.forEach((user: any) => {
      user.organisations.forEach((org: { organisationId: string, roles: any }) => {
        // if (org.organisationId === rootOrgId) {
        roles = org.roles
        // }

      })
      const email = _.get(user, 'profileDetails.personalDetails.primaryEmail')
      const mobileNumber = _.get(user, 'profileDetails.personalDetails.mobile')
      if (!(user.isDeleted)) {
        usersData.push({
          fullName: user ? `${user.firstName}` : null,
          // fullName: user ? `${user.firstName} ${user.lastName}` : null,
          email: this.profileUtilSvc.emailTransform(email) || this.profileUtilSvc.emailTransform(user.email),
          mobile: mobileNumber,
          position: roles,
          userId: user.userId,
        })
      }
    })
    this.data = usersData
  }

  onEnterkySearch(enterValue: any) {
    let query: string = ''
    let limit: number = 20 // Default limit
    let offset: number = 0 // Default offset
    const status: number = 1

    if (typeof enterValue === 'string') {
      query = enterValue
    } else if (typeof enterValue === 'object') {
      query = enterValue.query || ''
      limit = enterValue.limit || 20 // Fallback to default limit
      offset = enterValue.offset || 0 // Fallback to default offset
    }

    this.usersService.getAllKongUsersPaginated(this.id, status, limit, offset, query).subscribe(data => {
      this.userWholeData = data.result.response.content || []
      this.totalRecordsCount = data.result.response.count || 0
      this.newKongUser()
    }
    )
  }

  editUser(event: any) {
    this.router.navigate(['app/home/create-user'], {
      queryParams: {
        id: this.id, currentDept: this.currentDept,
        createDept: JSON.stringify({ depName: this.deptName, depType: this.currentDept }),
        orgName: this.deptName,
        redirectionPath: window.location.href,
        subOrgType: this.getSubOrgType(),
        organisationType: this.organisationType
      }, state: { userData: event.row, updateButton: true },
    })
  }

  getMentorManage() {

  }

  getSubOrgType(): string {
    const subOrgTypeLowerCase = this.subOrgType?.toLowerCase()
    switch (subOrgTypeLowerCase) {
      case 'ministry':
        return 'mdo'
      case 'state':
        return 'state'
      default:
        return 'cbp-providers'
    }
  }

  isAllowed(allowedRoles: string[]): boolean {
    if (this.userRoles && this.userRoles.size > 0) {
      const lowerConfigRoles = new Set([...this.userRoles].map(role => role.toLowerCase()))
      return allowedRoles.some(role => lowerConfigRoles.has(role.toLowerCase()))
    }
    return false
  }

  async checkAndGetOrgData() {
    const orgReadPromise: Promise<any>[] = []
    orgReadPromise.push(this.getOrgData())
    await Promise.all(orgReadPromise)
  }

  getOrgData() {
    return new Promise<boolean>((resolve) => {
      const requestBody = {
        request: {
          organisationId: this.orgData.roleId,
        }
      }
      this.loaderService.changeLoaderState(true)
      this.orgHieService.getOrgReadData(requestBody).pipe(
        switchMap((data: any) => {
          if (data?.result?.response?.ministryOrStateType === 'ministry' || data?.result?.response?.ministryOrStateType === 'state') {
            const parentReqBody = {
              request: {
                organisationId: data?.result?.response?.ministryOrStateId,
              }
            }
            return this.orgHieService.getOrgReadData(parentReqBody).pipe(
              map((ministryData: any) => {
                return {
                  orgData: data.result.response,
                  parentOrgData: ministryData.result.response
                }
              })
            )
          }
          return of(null)
        })
      ).subscribe((_res) => {
        this.orgHieService.setOrgData(_res?.orgData)
        this.orgHieService.setParentOrgData(_res?.parentOrgData)
        this.orgDataLoaded = true
        resolve(true)
        this.loaderService.changeLoaderState(false)
      })
    })
  }
}
