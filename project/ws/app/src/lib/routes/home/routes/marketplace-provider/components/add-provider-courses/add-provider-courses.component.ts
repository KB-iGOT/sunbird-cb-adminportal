import { Component, EventEmitter, Output } from '@angular/core'

@Component({
  selector: 'ws-app-add-provider-courses',
  templateUrl: './add-provider-courses.component.html',
  styleUrls: ['./add-provider-courses.component.scss']
})
export class AddProviderCoursesComponent {

  @Output() action: EventEmitter<any> = new EventEmitter<any>()


  goBack() {
    this.action.emit({ action: 'goBack' })
  }
}
