import { Component, EventEmitter, OnInit, Output } from '@angular/core'
import { ActivatedRoute } from '@angular/router'

@Component({
  selector: 'ws-app-add-provider-courses',
  templateUrl: './add-provider-courses.component.html',
  styleUrls: ['./add-provider-courses.component.scss']
})
export class AddProviderCoursesComponent implements OnInit {
  @Output() action: EventEmitter<any> = new EventEmitter<any>()
  providerDetails: any
  constructor(
    private activateRoute: ActivatedRoute,
  ) {
  }

  ngOnInit(): void {
    this.activateRoute.data.subscribe(data => {
      if (data.providerDetails && data.providerDetails.data) {
        this.providerDetails = data.providerDetails.data.result
      }
    })
  }

  goBack() {
    this.action.emit({ action: 'goBack' })
  }
}
