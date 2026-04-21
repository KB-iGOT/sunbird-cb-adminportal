
import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { BtnPageBackModule, GroupCheckboxModule, UIAdminTableModule } from '@sunbird-cb/collection'
import { SbUiResolverModule } from '@sunbird-cb/resolver-v2'
import { HomeModule } from '../home/home.module'
import { RouterModule } from '@angular/router'
import { UsersService } from './services/users.service'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatCardModule } from '@angular/material/card'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'

@NgModule({
  imports: [CommonModule, BtnPageBackModule, SbUiResolverModule, MatProgressSpinnerModule, MatProgressBarModule,
    MatSidenavModule, MatIconModule, GroupCheckboxModule, HomeModule, RouterModule, UIAdminTableModule, MatCardModule],
  providers: [UsersService],
})
export class AccessModule { }
