import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { InfoModalComponent } from './info-modal.component'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'

@NgModule({
  declarations: [InfoModalComponent],
  imports: [
    CommonModule, MatDialogModule, MatIconModule, MatButtonModule,
  ],
})
export class InfoModalModule { }
