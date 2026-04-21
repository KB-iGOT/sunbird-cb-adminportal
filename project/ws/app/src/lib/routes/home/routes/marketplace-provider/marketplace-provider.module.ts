import { NgModule } from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'
import { MarketPlaceDashboardComponent } from './components/market-place-dashboard/market-place-dashboard.component'
import { ProviderDetailsComponent } from './components/provider-details/provider-details.component'
import { RouterModule, Routes } from '@angular/router'
import { ConfigureMarketplaceProvidersComponent } from './components/configure-marketplace-providers/configure-marketplace-providers.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { BreadcrumbsOrgModule } from '@sunbird-cb/collection'
import { HelpCenterGuideComponent } from './components/help-center-guide/help-center-guide.component'
import { ConformationPopupComponent } from './dialogs/conformation-popup/conformation-popup.component'
import { ContentUploadComponent } from './components/content-upload/content-upload.component'
import { CoursesTableComponent } from './components/courses-table/courses-table.component'
import { DragDropDirective } from './directives/drag-drop.directive'
import { PageResolve } from '@sunbird-cb/utils-v2'
import { NgJsonEditorModule } from 'ang-jsoneditor'
import { MatInputModule } from '@angular/material/input'
import { MatCardModule } from '@angular/material/card'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatTabsModule as MatTabsModule } from '@angular/material/tabs'
import { MatMenuModule } from '@angular/material/menu'
import { MatDialogModule } from '@angular/material/dialog'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatProgressBarModule as MatProgressBarModule } from '@angular/material/progress-bar'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatTableModule } from '@angular/material/table'
import { LoaderService } from '../../services/loader.service'
import { ProviderResolveService } from './services/provider-resolve.service'
import { MatSelectModule } from '@angular/material/select'
import { TransformationsComponent } from './components/transformations/transformations.component'
import { ViaApiParamsTableComponent } from './components/via-api-params-table/via-api-params-table.component'
import { ViaApiComponent } from './components/via-api/via-api.component'
import { MatRadioModule } from '@angular/material/radio'
import { MatSlideToggleModule as MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatRippleModule } from '@angular/material/core'
import { PaginationModule } from '@sunbird-cb/consumption'
import { ConfigureProviderComponent } from './components/configure-provider/configure-provider.component'
import { ConfigureProviderMenuComponent } from './components/configure-provider-menu/configure-provider-menu.component'
import { ProviderSettingsComponent } from './components/provider-settings/provider-settings.component'
import { HelpCenterGuideComponentV2 } from './components/help-center-guide-v2/help-center-guide-v2.component'
import { ProviderDetailsV2Component } from './components/provider-details-v2/provider-details-v2.component'
import { OnboardingCoursesComponent } from './components/onboarding-courses/onboarding-courses.component'
import { CoursesListTableComponent } from './components/courses-list-table/courses-list-table.component'
import { AddProviderCoursesComponent } from './components/add-provider-courses/add-provider-courses.component'
import { BulkUploadCoursesComponent } from './components/bulk-upload-courses/bulk-upload-courses.component'
import { ProvidersApiIntegrationsComponent } from './components/providers-api-integrations/providers-api-integrations.component'
import { CertificateConfigurationComponent } from './components/certificate-configuration/certificate-configuration.component'
import { SsoIntegrationComponent } from './components/sso-integration/sso-integration.component'
import { SsoConfigureSettingsComponent } from './components/sso-configure-settings/sso-configure-settings.component'
import { LoadingPopupComponent } from './dialogs/loading-popup/loading-popup.component'
import { MaxLengthNumberDirective } from './directives/max-length-number.directive'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatOptionModule } from '@angular/material/core'

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: MarketPlaceDashboardComponent,
  },
  {
    path: 'onboard-partner/:id',
    pathMatch: 'full',
    component: ConfigureMarketplaceProvidersComponent,
    data: {
      pageId: 'app/home/marketplace-providers/onboard-partner',
      module: 'marketplace-providers',
      pageType: 'feature',
      pageKey: 'marcket_place',
    },
    resolve: {
      pageData: PageResolve,
      providerDetails: ProviderResolveService,
    },
  },
  {
    path: 'onboard-partner',
    pathMatch: 'full',
    component: ConfigureMarketplaceProvidersComponent,
    data: {
      pageId: 'app/home/marketplace-providers/onboard-partner',
      module: 'marketplace-providers',
      pageType: 'feature',
      pageKey: 'marcket_place',
    },
    resolve: {
      pageData: PageResolve,
    },
  },
  {
    path: 'configure-provider',
    pathMatch: 'full',
    component: ConfigureProviderComponent,
    data: {
      pageId: 'app/home/marketplace-providers/onboard-partner',
      module: 'marketplace-providers',
      pageType: 'feature',
      pageKey: 'marcket_place',
    },
    resolve: {
      pageData: PageResolve,
      providerDetails: ProviderResolveService,

    },
    runGuardsAndResolvers: 'paramsOrQueryParamsChange'
  },

]

@NgModule({
  declarations: [
    ConformationPopupComponent,
    MarketPlaceDashboardComponent,
    ProviderDetailsComponent,
    ConfigureMarketplaceProvidersComponent,
    HelpCenterGuideComponent,
    ContentUploadComponent,
    CoursesTableComponent,
    DragDropDirective,
    TransformationsComponent,
    ViaApiParamsTableComponent,
    ViaApiComponent,
    ConfigureProviderComponent,
    ConfigureProviderMenuComponent,
    ProviderSettingsComponent,
    ProviderSettingsComponent,
    ProviderDetailsV2Component,
    HelpCenterGuideComponentV2,
    OnboardingCoursesComponent,
    CoursesListTableComponent,
    AddProviderCoursesComponent,
    BulkUploadCoursesComponent,
    ProvidersApiIntegrationsComponent,
    CertificateConfigurationComponent,
    SsoIntegrationComponent,
    SsoConfigureSettingsComponent,
    LoadingPopupComponent,
    MaxLengthNumberDirective
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatTabsModule,
    BreadcrumbsOrgModule,
    MatMenuModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatTooltipModule,
    NgJsonEditorModule,
    MatSelectModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatSidenavModule,
    MatRippleModule,
    PaginationModule,
    MatAutocompleteModule,
    MatOptionModule
  ],
  providers: [DatePipe, LoaderService],
  exports: [RouterModule],
})
export class MarketplaceProviderModule { }