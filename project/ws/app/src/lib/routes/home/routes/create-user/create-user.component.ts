import { CreateMDOService } from './../../services/create-mdo.services'
import { Component, DestroyRef, inject, OnInit } from '@angular/core'
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms'
import { UsersService } from '../../services/users.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
import { DirectoryService } from '../../services/directory.services'
import * as _ from 'lodash'
import { environment } from '../../../../../../../../../src/environments/environment'
import { EventService } from '@sunbird-cb/utils-v2'
import { ProfileV2UtillService } from '../../services/home-utill.service'
import { forkJoin } from 'rxjs'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

// const EMAIL_PATTERN_OLD = /^[a-z0-9_-]+(?:\.[a-z0-9_-]+)*@((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?){2,}\.){1,3}(?:\w){2,}$/
const EMAIL_PATTERN = /^[a-zA-Z0-9]+[a-zA-Z0-9._-]*[a-zA-Z0-9]+@[a-zA-Z0-9]+([-a-zA-Z0-9]*[a-zA-Z0-9]+)?(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,4}$/
const MOBILE_PATTERN = '^((\\+91-?)|0)?[0-9]{10}$'

@Component({
  selector: 'ws-app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss'],
  standalone: false,
})
export class CreateUserComponent implements OnInit {
  private destroyRef = inject(DestroyRef)

  createUserForm: UntypedFormGroup
  namePatern = "^[a-zA-Z\\s\\']{1,32}$"
  rolesList: any = []
  departmentName = ''
  toastSuccess: any
  departmentoptions: any = []
  dropdownSettings = {}
  receivedDept: any
  selectedDept: any
  public userRoles: Set<string> = new Set()
  queryParam: any
  deptId: any
  redirectionPath!: string
  selectedMulti = -1
  currentDept: any
  createdDepartment!: any
  selected!: string
  roles: any = []
  selectedRoles: string[] = []
  exact!: string[]
  exactPath!: String
  isStateAdmin = false
  loggedInUserId!: string
  disableCreateButton = false
  displayLoader = false
  emailLengthVal = false
  editUserInfo: any
  updateButton = false
  mdoLeadersCount = 0
  orgName!: string
  isThisExistingLeader = false
  disableRequired = false
  stateAdminRoles = ['STATE_ADMIN', 'PUBLIC']
  rawCurrentDept = ''
  hiddenRolesForOrg = ['CBC_ADMIN', 'CBC_MEMBER']
  organisationType: number = 128

  // hideRole: any = []

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private directoryService: DirectoryService,
    private createMDOService: CreateMDOService,
    private profileUtilSvc: ProfileV2UtillService,
    private usersSvc: UsersService,
    private events: EventService) {
    const navigation = this.router.getCurrentNavigation()
    if (navigation && navigation.extras && navigation.extras.state) {
      const extraData = navigation.extras.state as {
        userData: any,
        updateButton: boolean
      }
      this.editUserInfo = extraData.userData
      this.updateButton = extraData.updateButton
    }
    this.route.queryParams.subscribe(params => {
      this.queryParam = params['id']
      this.deptId = params['id']
      this.orgName = params['orgName']
      this.rawCurrentDept = params['currentDept'] || ''
      this.organisationType = params['organisationType'] || 128
      // this.currentDept = params['currentDept']
      this.currentDept = params['subOrgType']
      this.redirectionPath = params['redirectionPath']
      if (this.currentDept === 'CBP Providers' || this.currentDept === 'cbp-providers') {
        this.currentDept = 'CBP'
      }
      const dept = params['createDept']
      if (dept) {
        this.createdDepartment = JSON.parse(dept)
      }
      // tslint:disable-next-line:radix
      this.queryParam = parseInt(this.queryParam)
      this.getMdoLeader()
    })

    if (!this.currentDept) {
      if (this.route.snapshot.queryParams.createDept) {
        const deptObj = JSON.parse(this.route.snapshot.queryParams.createDept)
        this.currentDept = deptObj.depType
        if (this.currentDept === 'CBP Providers' || this.currentDept === 'cbp-providers') {
          this.currentDept = 'CBP'
        }
      } else {
        this.currentDept = 'SPV'
        // if state admin and not from MDO tab
        this.loggedInUserId = _.get(this.route, 'snapshot.parent.data.configService.userProfile.userId')
        const roles: any[] = _.get(this.route, 'snapshot.parent.data.configService.unMappedUser.roles')
        if (roles.indexOf('STATE_ADMIN') >= 0) {
          this.isStateAdmin = true
          // this is fix for the state admin, for roles in create user form
          this.currentDept = 'STATE'
        }
      }

    }

    if (this.createdDepartment) {
      const email = this.editUserInfo && this.editUserInfo.email || ''
      const name = this.editUserInfo && this.editUserInfo.fullName || ''
      const mobile = this.editUserInfo && this.editUserInfo.mobile || ''
      this.disableRequired = name ? true : false
      this.createUserForm = new UntypedFormGroup({
        fname: new UntypedFormControl({ value: name, disabled: name ? true : false }, [Validators.required]),
        // lname: new FormControl('', [Validators.required]),
        email: new UntypedFormControl(
          { value: this.profileUtilSvc.transformToEmail(email), disabled: email ? true : false },
          [Validators.required, Validators.pattern(EMAIL_PATTERN)]
        ),
        mobileNumber: new UntypedFormControl(
          { value: mobile, disabled: name ? true : false },
          [Validators.required, Validators.pattern(MOBILE_PATTERN), Validators.maxLength(10)]
        ),
        role: new UntypedFormControl('', [Validators.required, Validators.required]),
        dept: new UntypedFormControl(this.orgName, [Validators.required]),
        deptId: new UntypedFormControl(this.createdDepartment.depName, [Validators.required]),
      })
    } else {
      this.createUserForm = new UntypedFormGroup({
        fname: new UntypedFormControl('', [Validators.required]),
        // lname: new FormControl('', [Validators.required]),
        email: new UntypedFormControl('', [Validators.required,
        Validators.pattern(EMAIL_PATTERN)]),
        mobileNumber: new UntypedFormControl('', [Validators.required, Validators.pattern(MOBILE_PATTERN), Validators.maxLength(10)]),
        role: new UntypedFormControl('', [Validators.required, Validators.required]),
        dept: new UntypedFormControl(
          _.get(this.route, 'snapshot.data.configService.unMappedUser.rootOrg.orgName') || '',
          [Validators.required]
        ),
        deptId: new UntypedFormControl(_.get(this.route, 'snapshot.data.configService.unMappedUser.channel') || ''),
      })
    }
    if (this.editUserInfo) {
      if (this.editUserInfo.position) {
        this.editUserInfo.position.forEach((role: any) => {
          if (role === 'MDO_LEADER') {
            this.isThisExistingLeader = true
          }

          this.modifyUserRoles(role)
        })
      }
    }
  }

  ngOnInit() {
    // this.getAllDept()

    this.getAllDepartmentsHeaderAPI()
    // this.getAllDepartmentsKong()
    // this.getAllDepartmentSubType()

    this.dropdownSettings = {
      singleSelection: true,
      idField: 'id',
      textField: 'deptName',
      enableCheckAll: false,
      itemsShowLimit: 10000,
      allowSearchFilter: true,
    }
  }

  getAllDepartmentsHeaderAPI() {
    const roles: any[] = _.get(
      this.route,
      'snapshot.parent.data.configService.unMappedUser.roles'
    )

    forkJoin({
      orgTypeList: this.directoryService.getOrgTypeList$(),
      orgTypeConfig: this.directoryService.getOrgTypeConfig$(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ orgTypeList, orgTypeConfig }: any) => {

        if (
          this.rawCurrentDept === 'organisation' &&
          this.createdDepartment?.depType === 'organisation'
        ) {
          this.roles = this.resolveRolesByValue(
            orgTypeList,
            orgTypeConfig,
            this.organisationType
          )
          return
        }

        if (this.rawCurrentDept === 'volunteer') {
          const allRoles: string[] = []

          orgTypeList?.orgTypeList?.forEach(
            (ele: {
              flags: string[]
              isNgo: boolean
              isHidden: boolean
              roles: string[]
            }) => {
              const isNgo =
                ele?.isNgo ||
                (Array.isArray(ele?.flags) &&
                  ele.flags.includes('isNgo'))

              if (!isNgo || ele?.isHidden || !ele?.roles) {
                return
              }

              ele.roles.forEach(role => {
                if (role && !allRoles.includes(role)) {
                  allRoles.push(role)
                }
              })
            }
          )

          this.roles = allRoles
          return
        }

        orgTypeList?.orgTypeList?.forEach(
          (ele: { name: string; roles: string[] }) => {

            if (
              environment?.cbpProviderRoles &&
              environment.cbpProviderRoles.includes(
                this.currentDept.toLowerCase()
              )
            ) {
              this.currentDept = 'CBP'
            }

            if (
              ele?.name &&
              this.currentDept &&
              ele.name === this.currentDept.toUpperCase()
            ) {
              if (roles?.includes('STATE_ADMIN')) {
                this.roles = this.stateAdminRoles
              } else {
                this.roles = ele.roles
              }
            }
          }
        )
      })
  }


  private resolveRolesByValue(
    departmentHeaderArray: any,
    orgTypeConfig: any,
    value: number,
  ): string[] {

    const roles: any[] = _.get(
      this.route,
      'snapshot.parent.data.configService.unMappedUser.roles'
    )

    const isStateAdmin =
      roles && roles.indexOf('STATE_ADMIN') >= 0

    const orgTypeList = departmentHeaderArray?.orgTypeList ?? []
    const configFields = orgTypeConfig?.fields ?? []

    const deptFlags =
      configFields.find(
        (field: any) => field?.value === Number(value)
      )?.flagNameList ?? []

    const collected = _.flatMap(orgTypeList, (org: any) => {

      const orgFlags = Array.isArray(org?.flags)
        ? org.flags
        : []

      const isMatch = deptFlags.some((flag: string) =>
        orgFlags.includes(flag)
      )

      if (!isMatch || org?.isHidden) {
        return []
      }

      return (org?.roles ?? []).filter(
        (role: string) =>
          !(isStateAdmin && this.hiddenRolesForOrg.includes(role))
      )
    })

    return _.uniq(collected)
  }

  /** methods related to Dropdown */
  onItemSelect(item: any[]) {
    this.selectedDept = item
    this.departmentoptions.forEach((dept: any) => {
      if (dept.id === this.selectedDept.id) {
        this.rolesList = dept.rolesInfo
      }
    })
  }

  emailVerification(emailId: string) {
    this.emailLengthVal = false
    if (emailId && emailId.length > 0) {
      const email = emailId.split('@')
      if (email && email.length === 2) {
        if ((email[0] && email[0].length > 64) || (email[1] && email[1].length > 255)) {
          this.emailLengthVal = true
        }
      } else {
        this.emailLengthVal = false
      }
    }
  }

  /**On unselecting the option */
  onItemDeSelect() {
    this.selectedDept = ''
    this.createUserForm.value.department = ''
  }

  modifyUserRoles(role: string) {
    if (this.userRoles.has(role)) {
      this.userRoles.delete(role)
    } else {
      this.userRoles.add(role)
    }
  }
  // getAllDepartmentSubType() {
  //   this.directoryService.getDepartmentTitles().subscribe(res => {
  //     const departmentHeaderArray = JSON.parse(res.result.response.value)
  //     // console.log(departmentHeaderArray)
  //   })
  // }
  onSubmit(form: any) {
    // form.value.department = this.selectedDept ? this.selectedDept.deptName : this.receivedDept.deptName
    this.disableCreateButton = true
    this.displayLoader = true
    this.raiseTelemetry()
    const userreq: any = {
      personalDetails: {
        email: form.value.email,
        firstName: form.value.fname,
        phone: form.value.mobileNumber,
        // lastName: form.value.lname,
        // channel: form.value.dept,
        channel: form.value.deptId,
        roles: this.createUserForm.value.role,
      },
    }
    if (this.rawCurrentDept === 'volunteer') {
      userreq.personalDetails.designation = 'Volunteer'
    }
    if (userreq.personalDetails.roles.includes('MDO_LEADER') && (this.mdoLeadersCount > 0)) {
      this.openSnackbar([
        'MDO Leader role has already been allocated to another user from the Ministry;',
        'kindly revise the role for that user before assigning a different user as an MDO Leader',
      ].join(' '))
      this.disableCreateButton = false
      this.displayLoader = false
    } else {
      this.usersSvc.createUser(userreq).subscribe(
        userdata => {

          this.displayLoader = false
          this.disableCreateButton = false
          if (userdata.userId) {
            if (this.createdDepartment && this.createdDepartment.id) {
              this.deptId = this.createdDepartment.id
            }
            if (!this.deptId) {
              this.deptId = this.route.snapshot.queryParams && this.route.snapshot.queryParams.id
            }
            if (!this.deptId) {
              this.deptId = _.get(this.route, 'snapshot.parent.data.configService.unMappedUser.rootOrg.rootOrgId')
            }
            // this.createMDOService.assignAdminToDepartment(userdata.userId, this.deptId, this.createUserForm.value.role)
            //   .subscribe(
            //     data => {
            //       // this.displayLoader = false
            //       // this.disableCreateButton = false
            //       this.openSnackbar(`${data.result.response}`)
            //       if (this.redirectionPath.indexOf('/app/home/') < 0) {
            //         // this.exact = this.redirectionPath.split("/app")
            //         // this.exactPath = "/app" + this.exact[1]
            //         // this.exactPath = this.exactPath.replace("%3B", ";")
            //         // this.exactPath = this.exactPath.replace("%3D", "=")
            //         location.replace(this.redirectionPath)
            //       } else {
            //         this.router.navigate(['/app/home/directory'])
            //       }

            //     },
            //     (_err: any) => {
            //       // this.displayLoader = false
            //       // this.disableCreateButton = false
            //       this.router.navigate([`/app/home/users`])
            //       this.openSnackbar(`Error in assigning roles`)
            //     })
            this.openSnackbar('User created successfully!')
            if (this.redirectionPath && this.redirectionPath.indexOf('/app/home/') < 0) {
              location.replace(this.redirectionPath)
            } else {
              this.router.navigate(['/app/home/users'])

            }
          }
        },
        err => {
          this.displayLoader = false
          this.disableCreateButton = false
          if (err.error.params.errmsg) {
            // this.openSnackbar(`${err.error.params.errmsg}`)
            if (err.error.params.errmsg.toLowerCase() === 'this phone is already registered with an existing user') {
              this.openSnackbar('This Phone is already registered with an existing User')
            } else if (err.error.params.errmsg.toLowerCase() === 'this email is already registered with an existing user') {
              this.openSnackbar('This Email is already registered with an existing User')
            } else if (err.error.params.errmsg.toLowerCase() === 'Invalid format for given phone.') {
              this.openSnackbar('Please enter valid phone number')
            } else if (err.error.params.errmsg.toLowerCase().includes('is inactive')) {
              this.openSnackbar(err.error.params.errmsg)
            } else {
              this.openSnackbar('User creation error')
            }
          } else {
            this.openSnackbar('User creation error')
          }
          // this.router.navigate([`/app/home/users`])
        })
    }
  }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }
  raiseTelemetry() {
    this.events.raiseInteractTelemetry(
      {
        type: 'click',
        subType: 'button',
        id: 'button-click',
      },
      {},
    )
  }

  navigateTo() {
    if (this.redirectionPath) {
      try {
        const url = new URL(this.redirectionPath, window.location.origin)
        const queryParams: any = {}
        url.searchParams.forEach((value, key) => {
          queryParams[key] = value
        })
        this.router.navigate([url.pathname], { queryParams })
      } catch (_e) {
        this.router.navigate([this.redirectionPath])
      }
      return
    }
    if (this.createdDepartment) {
      this.router.navigate([`/app/roles/${this.deptId}/users`],
        // tslint:disable-next-line:align
        {
          queryParams:
          {

            // tslint:disable-next-line:max-line-length
            currentDept: this.getCurrentDept() === 'mdo' || this.getCurrentDept() === 'state' ? 'organisation' : this.getCurrentDept() === 'cbp' ? this.getSubOrgType() : this.currentDept,
            roleId: this.deptId,
            depatName: this.createdDepartment.depName,
            subOrgType: this.getSubOrgType(),
            orgName: this.orgName,
            organisationType: this.organisationType,
          },
        })

    } else {
      this.router.navigate(['/app/home/users'])
    }
  }

  getSubOrgType(): string {
    const subOrgTypeLowerCase = this.currentDept?.toLowerCase()
    switch (subOrgTypeLowerCase) {
      case 'mdo':
        return 'ministry'
      case 'state':
        return 'state'
      case 'CBP':
        return 'cbp-providers'
      default:
        return 'cbp-providers'
    }
  }

  getMdoLeader() {
    this.usersSvc.searchMDOLeaders(this.deptId).subscribe(
      userdata => {
        if (userdata.result && userdata.result.response) {
          this.mdoLeadersCount = userdata.result.response.count
          // if (userdata.result.response.count >= 1) {
          //   this.hideRole.push('MDO_LEADER')
          // }
        }
      })
  }

  onUpdate(userData: any) {
    this.displayLoader = true
    const userInfo = userData.value
    if (userInfo.role.includes('MDO_LEADER') && this.isThisExistingLeader) {
      this.roleAssign()
    } else if (userInfo.role.includes('MDO_LEADER') && (this.mdoLeadersCount === 0)) {
      this.roleAssign()
    } else if (!userInfo.role.includes('MDO_LEADER')) {
      this.roleAssign()
    } else {
      this.displayLoader = false
      this.openSnackbar([
        'MDO Leader role has already been allocated to another user from the Ministry;',
        'kindly revise the role for that user before assigning a different user as an MDO Leader',
      ].join(' '))
    }
  }
  roleAssign() {
    const roles = Array.from(this.userRoles)
    this.createMDOService.assignAdminToDepartment(this.editUserInfo.userId, this.deptId, roles)
      .subscribe(
        data => {
          this.displayLoader = false
          // this.disableCreateButton = false
          this.openSnackbar(`${data.result.response}`)
          if (this.redirectionPath.indexOf('/app/home/') < 0 || this.redirectionPath.indexOf('/app/home/roles-users/') < 0) {
            // this.exact = this.redirectionPath.split("/app")
            // this.exactPath = "/app" + this.exact[1]
            // this.exactPath = this.exactPath.replace("%3B", ";")
            // this.exactPath = this.exactPath.replace("%3D", "=")
            location.replace(this.redirectionPath)
          } else {
            this.router.navigate(['/app/home/directory'])
          }

        },
        (_err: any) => {
          this.displayLoader = false
          // this.disableCreateButton = false
          this.router.navigate(['/app/home/users'])
          this.openSnackbar('Error in assigning roles')
        })
  }

  numericOnly(event: any): boolean {
    const pattren = /^([0-9])$/
    const result = pattren.test(event.key)
    return result
  }

  onPasteMobile(e: ClipboardEvent) {
    this.createUserForm.patchValue({ mobileNumber: '' })
    let trimmedData: any
    // tslint:disable-next-line: no-non-null-assertion
    const pastedMob = e.clipboardData!.getData('text')
    if (pastedMob) {
      trimmedData = pastedMob.replace(/\s+/g, ' ').trim()
      this.trimPhoneNumber(trimmedData)
    }
    if (!Number(trimmedData)) {
      e.preventDefault()
    }
  }

  trimPhoneNumber(phone: any) {
    let mobile = phone
    if (phone.startsWith('+91 ')) {
      mobile = phone.slice(4)
      this.createUserForm.patchValue({ mobileNumber: mobile })
    } else if (phone.startsWith('+91')) {
      mobile = phone.slice(3)
      this.createUserForm.patchValue({ mobileNumber: mobile })
    } else {
      this.createUserForm.patchValue({ mobileNumber: mobile })
    }
  }
  getCurrentDept() {
    if (this.currentDept) {
      return this.currentDept.toLowerCase()
    }
    return this.currentDept
  }
}
