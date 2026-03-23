import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { Router, Event, NavigationEnd, ActivatedRoute } from '@angular/router'
import { ConfigurationsService, ValueService } from '@sunbird-cb/utils-v2'
import { map } from 'rxjs/operators'
import * as _ from 'lodash'
import { ILeftMenu } from '@sunbird-cb/collection'
import { NsWidgetResolver } from '@sunbird-cb/resolver-v2'
import { Subscription } from 'rxjs'

@Component({
  standalone: false,
  selector: 'ws-users-home',
  templateUrl: './users-home.component.html',
  styleUrls: ['./users-home.component.scss'],
  host: { class: 'margin-top-l' },
})
export class UsersHomeComponent implements OnInit, OnDestroy {
  sideNavBarOpened = true
  widgetData!: NsWidgetResolver.IWidgetData<ILeftMenu>
  myRoles!: Set<string>
  public screenSizeIsLtMedium = false
  isLtMedium$ = this.valueSvc.isLtMedium$
  mode$ = this.isLtMedium$.pipe(map(isMedium => (isMedium ? 'over' : 'side')))
  @ViewChild('stickyMenu', { static: true }) menuElement!: ElementRef
  elementPosition: any
  sticky = false
  private defaultSideNavBarOpenedSubscription: any
  private routeSub!: Subscription

  @HostListener('window:scroll', ['$event'])
  handleScroll() {
    const windowScroll = window.pageYOffset
    if (windowScroll >= this.elementPosition) {
      this.sticky = true
    } else {
      this.sticky = false
    }
  }

  constructor(
    private valueSvc: ValueService,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private configSvc: ConfigurationsService,
  ) {
    // Prefer roles from configService route data (if resolver is set), fall back to ConfigurationsService
    if (_.get(this.activeRoute, 'snapshot.data.configService.userRoles')) {
      this.myRoles = _.get(this.activeRoute, 'snapshot.data.configService.userRoles')
    } else if (this.configSvc.userRoles) {
      this.myRoles = this.configSvc.userRoles
    }
  }

  ngOnInit(): void {
    this.defaultSideNavBarOpenedSubscription = this.isLtMedium$.subscribe(isLtMedium => {
      this.sideNavBarOpened = !isLtMedium
      this.screenSizeIsLtMedium = isLtMedium
    })
    this.buildMenu()
    this.routeSub = this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.buildMenu()
      }
    })
  }

  ngOnDestroy(): void {
    if (this.defaultSideNavBarOpenedSubscription) {
      this.defaultSideNavBarOpenedSubscription.unsubscribe()
    }
    if (this.routeSub) {
      this.routeSub.unsubscribe()
    }
  }

  buildMenu(): void {
    // If the CMS/API returned pageData with menus (like Home component), use that
    if (this.activeRoute.snapshot.data.pageData &&
      _.get(this.activeRoute, 'snapshot.data.pageData.data.menus')) {
      const leftData = this.activeRoute.snapshot.data.pageData.data.menus
      // Patch in dynamic values (logo, org name, roles) - same pattern as home.component.ts
      _.set(leftData, 'widgetData.logo', true)
      _.set(leftData, 'widgetData.logoPath',
        _.get(this.activeRoute, 'snapshot.data.department.data.logo',
          _.get(this.configSvc, 'unMappedUser.thumbnail', '')))
      _.set(leftData, 'widgetData.name',
        _.get(this.activeRoute, 'snapshot.data.configService.unMappedUser.rootOrg.orgName',
          _.get(this.configSvc, 'unMappedUser.rootOrg.orgName', 'User Management')))
      _.set(leftData, 'widgetData.userRoles', this.myRoles)
      this.widgetData = leftData
    } else {
      // Fallback: build menu data manually when no CMS pageData is available
      const url = this.router.url
      const menus: any[] = [
        {
          name: 'Users',
          key: 'users',
          render: true,
          enabled: true,
          routerLink: '/app/users',
        },
      ]
      if (url.includes('/detail/')) {
        menus.push({
          name: 'User Details',
          key: 'detail',
          render: true,
          enabled: true,
          routerLink: url,
        })
      }
      this.widgetData = {
        widgetType: 'leftMenu',
        widgetSubType: 'leftMenu',
        widgetData: {
          name: _.get(this.configSvc, 'unMappedUser.rootOrg.orgName', 'User Management'),
          logo: true,
          logoPath: _.get(this.configSvc, 'unMappedUser.thumbnail', ''),
          menus,
          userRoles: this.myRoles,
        },
      } as NsWidgetResolver.IWidgetData<ILeftMenu>
    }
  }
}
