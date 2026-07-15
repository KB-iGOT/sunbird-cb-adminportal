import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
@Component({
    selector: 'ws-public-home',
    templateUrl: './public-home.component.html',
    styleUrls: ['./public-home.component.scss'],
    standalone: false,
})
export class PublicHomeComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
    this.router.events.subscribe(() => {
      if (window.location.href.includes('public/home')) {
        window.location.href = '/public/logout'
      }
    })
  }

}
