
import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BtnPageBackModule, GroupCheckboxModule, UIAdminTableModule } from '@sunbird-cb/collection'
import { SbUiResolverModule } from '@sunbird-cb/resolver-v2'
import { HomeModule } from '../home/home.module'
import { RouterModule } from '@angular/router'
import { UsersService } from './services/users.service'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'

@NgModule({
  imports: [CommonModule, BtnPageBackModule, SbUiResolverModule, MatProgressSpinnerModule, MatProgressBarModule,
    MatSidenavModule, MatIconModule, GroupCheckboxModule, HomeModule, RouterModule, UIAdminTableModule, MatCardModule],
  providers: [UsersService],
})
export class AccessModule { }
