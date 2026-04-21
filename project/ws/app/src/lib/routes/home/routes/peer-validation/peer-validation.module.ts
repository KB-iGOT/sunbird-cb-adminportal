import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { PeerValidationRoutingModule } from './peer-validation-routing.module'
import { LOADER_SERVICE, PeerValidationLibModule } from '@sunbird-cb/consumption'
import { LoaderService } from '../../services/loader.service'



@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    PeerValidationLibModule,
    PeerValidationRoutingModule,
  ],
  providers: [
    { provide: LOADER_SERVICE, useExisting: LoaderService }
  ]
})
export class PeerValidationModule { }
