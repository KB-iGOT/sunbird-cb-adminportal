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
import { MatLegacyInputModule } from '@angular/material/legacy-input'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatIconModule } from '@angular/material/icon'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { MatDialogModule } from '@angular/material/dialog'
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip'
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar'
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox'
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator'
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table'
import { LoaderService } from '../../services/loader.service'
import { ProviderResolveService } from './services/provider-resolve.service'
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select'
import { TransformationsComponent } from './components/transformations/transformations.component'
import { ViaApiParamsTableComponent } from './components/via-api-params-table/via-api-params-table.component'
import { ViaApiComponent } from './components/via-api/via-api.component'
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio'
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle'
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field'
import { ConfigureProviderComponent } from './components/configure-provider/configure-provider.component'
import { MatSidenavModule } from '@angular/material/sidenav'
import { ConfigureProviderMenuComponent } from './components/configure-provider-menu/configure-provider-menu.component'
import { ProviderSettingsComponent } from './components/provider-settings/provider-settings.component'
import { MatRippleModule } from '@angular/material/core'
import { HelpCenterGuideComponentV2 } from './components/help-center-guide-v2/help-center-guide-v2.component'
import { ProviderDetailsV2Component } from './components/provider-details-v2/provider-details-v2.component'
import { MaxLengthNumberDirective } from './directives/max-length-number.directive'

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
    },
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
    MaxLengthNumberDirective
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    MatLegacyInputModule,
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
    MatRippleModule
  ],
  providers: [DatePipe, LoaderService],
  exports: [RouterModule],
})
export class MarketplaceProviderModule { }