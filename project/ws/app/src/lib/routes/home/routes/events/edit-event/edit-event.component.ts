import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ChangeDetectorRef } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { EventsService } from '../services/events.service'
import { MatSnackBar, MatPaginator } from '@angular/material'
import { MatSort } from '@angular/material/sort'
import { ITableData } from '../interfaces/interfaces'
import { MatDialog } from '@angular/material/dialog'
import { ParticipantsComponent } from '../participants/participants.component'
import { SuccessComponent } from '../success/success.component'
import { Router, ActivatedRoute } from '@angular/router'
import { ConfigurationsService, EventService } from '@sunbird-cb/utils'
import * as moment from 'moment'
/* tslint:disable */
import _ from 'lodash'
import { TelemetryEvents } from '../model/telemetry.event.model'
import { ProfileV2UtillService } from '../services/home-utill.service'
/* tslint:enable */
@Component({
  selector: 'ws-app-edit-event',
  templateUrl: './edit-event.component.html',
  styleUrls: ['./edit-event.component.scss'],
})
export class EditEventComponent implements OnInit {

  artifactURL: any
  participantsArr: any = []
  presentersArr: any = []
  displayedColumns: string[] = ['fullname', 'email', 'type', 'mdoName']
  @Input() tableData!: ITableData | undefined
  @Input() data?: []
  @Input() isUpload?: boolean
  @Input() isCreate?: boolean

  @Output() clicked?: EventEmitter<any>
  @Output() actionsClick?: EventEmitter<any>
  @Output() eOnRowClick = new EventEmitter<any>()
  @Output() eOnCreateClick = new EventEmitter<any>()

  createEventForm: FormGroup
  namePatern = `^[a-zA-Z\\s\\']{1,32}$`
  department: any = {}
  departmentName = ''
  toastSuccess: any
  pictureObj: any
  myreg = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi

  // eventTypes = [
  //   { title: 'Webinar', desc: 'General discussion involving', border: 'rgb(0, 116, 182)', disabled: false },
  // ]

  evntTypesList = ['Webinar', 'Karmayogi Talks']

  timeArr = [
    { value: '00:00' }, { value: '00:30' }, { value: '01:00' }, { value: '01:30' },
    { value: '02:00' }, { value: '02:30' }, { value: '03:00' }, { value: '03:30' },
    { value: '04:00' }, { value: '04:30' }, { value: '05:00' }, { value: '05:30' },
    { value: '06:00' }, { value: '06:30' }, { value: '07:00' }, { value: '07:30' },
    { value: '08:00' }, { value: '08:30' }, { value: '09:00' }, { value: '09:30' },
    { value: '10:00' }, { value: '10:30' }, { value: '11:00' }, { value: '11:30' },
    { value: '12:00' }, { value: '12:30' }, { value: '13:00' }, { value: '13:30' },
    { value: '14:00' }, { value: '14:30' }, { value: '15:00' }, { value: '15:30' },
    { value: '16:00' }, { value: '16:30' }, { value: '17:00' }, { value: '17:30' },
    { value: '18:00' }, { value: '18:30' }, { value: '19:00' }, { value: '19:30' },
    { value: '20:00' }, { value: '20:30' }, { value: '21:00' }, { value: '21:30' },
    { value: '22:00' }, { value: '22:30' }, { value: '23:00' }, { value: '23:30' },
  ]

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator
  @ViewChild(MatSort, { static: true }) sort?: MatSort

  dataSource!: any
  widgetData: any
  length!: number
  pageSize = 5
  pageSizeOptions = [5, 10, 20]
  dialogRef: any
  activeUsers: any
  imageSrc: any
  imageSrcURL: any
  currentTab = 'eventInfo'
  userId: any
  username: any
  minDate: any
  maxDate: any
  todayDate: any
  todayTime: any
  hours: any
  minutes: any
  eventimageURL: any
  departmentID: any
  orgtimeArr!: {
    value: string
  }[]
  newtimearray: any = []
  disableCreateButton = false
  displayLoader = false
  eventId: any
  eventObject: any
  reqPayload: any

  constructor(private snackBar: MatSnackBar, private eventsSvc: EventsService, private matDialog: MatDialog,
    // tslint:disable-next-line:align
    private router: Router, private configSvc: ConfigurationsService, private changeDetectorRefs: ChangeDetectorRef,
    // tslint:disable-next-line:align
    private activeRoute: ActivatedRoute, private events: EventService, private profileUtilSvc: ProfileV2UtillService
  ) {

    if (this.configSvc.userProfile) {
      this.userId = this.configSvc.userProfile.userId
      this.username = this.configSvc.userProfile.userName
      this.department = this.configSvc.userProfile.departmentName
    } else {
      if (_.get(this.activeRoute, 'snapshot.data.configService.userProfile.rootOrgId')) {
        this.departmentID = _.get(this.activeRoute, 'snapshot.data.configService.userProfile.rootOrgId')
      }
      if (_.get(this.activeRoute, 'snapshot.data.configService.userProfile.departmentName')) {
        this.department = _.get(this.activeRoute, 'snapshot.data.configService.userProfile.departmentName')
      }
      if (_.get(this.activeRoute, 'snapshot.data.configService.userProfile.userId')) {
        this.userId = _.get(this.activeRoute, 'snapshot.data.configService.userProfile.userId')
      }
      if (_.get(this.activeRoute, 'snapshot.data.configService.userProfile.userName')) {
        this.username = _.get(this.activeRoute, 'snapshot.data.configService.userProfile.userName')
      }
    }

    this.createEventForm = new FormGroup({
      eventPicture: new FormControl(''),
      eventTitle: new FormControl('', [Validators.required]),
      summary: new FormControl('', [Validators.required]),
      description: new FormControl('', [Validators.required]),
      agenda: new FormControl('', [Validators.required]),
      // isItKarmayogiTalk: new FormControl('', []),
      eventType: new FormControl('', [Validators.required]),
      eventDate: new FormControl('', [Validators.required]),
      eventTime: new FormControl('', [Validators.required]),
      eventDurationHours: new FormControl('', [Validators.required]),
      eventDurationMinutes: new FormControl('', []),
      conferenceLink: new FormControl('', [Validators.required, Validators.pattern(this.myreg)]),
      presenters: new FormControl('', [Validators.required]),
    })

    this.activeRoute.params.subscribe(params => {
      this.eventId = params['id']
      this.eventsSvc.getEventDetails(this.eventId).subscribe(res => {
        const eventObj = res.result.event
        this.eventObject = eventObj
        this.createEventForm.controls['eventTitle'].setValue(eventObj.name)
        this.createEventForm.controls['summary'].setValue(eventObj.instructions)
        this.createEventForm.controls['description'].setValue(eventObj.description)
        this.createEventForm.controls['agenda'].setValue(eventObj.learningObjective)
        this.createEventForm.controls['conferenceLink'].setValue(eventObj.registrationLink)
        this.createEventForm.controls['eventTime'].setValue(eventObj.endDate)
        this.createEventForm.controls['eventType'].setValue(eventObj.resourceType)
        this.todayDate = new Date((new Date(eventObj.endDate).getTime()))
        const dateStr = eventObj.startTime.split(':')
        this.todayTime = `${dateStr[0]}:${dateStr[1]}`
        this.hours = eventObj.duration / 60
        this.minutes = eventObj.duration % 60
        this.imageSrcURL = eventObj.appIcon
        this.eventimageURL = eventObj.appIcon
        // this.eventimageURL = eventObj.appIcon && (eventObj.appIcon !== null || eventObj.appIcon !== undefined) ?
        //   this.eventsSvc.getPublicUrl(eventObj.appIcon) : this.eventsSvc.getPublicUrl('/assets/icons/Events_default.png')
        const presents = eventObj.creatorDetails
        if (presents) {
          this.presentersArr = []
          for (const obj of JSON.parse(presents.replace(/\\/g, ''))) {
            const setSelectedPresentersObj = {
              firstname: obj.name,
              email: obj.email,
              type: 'Karmayogi User',
              mdoName: obj.mdoName,
            }
            this.presentersArr.push(setSelectedPresentersObj)
            this.participantsArr.push(setSelectedPresentersObj)
            this.changeDetectorRefs.detectChanges()
            this.createEventForm.controls['presenters'].setValue(this.presentersArr)
          }
        }
      })
    })

    // this.createEventForm.controls['eventDurationHours'].setValue(0)
    // this.createEventForm.controls['eventDurationMinutes'].setValue(30)
    // this.createEventForm.controls['eventType'].setValue('Webinar')
    const minCurrentDate = new Date()
    const maxNewDate = new Date()
    this.minDate = minCurrentDate
    this.maxDate = maxNewDate.setMonth(maxNewDate.getMonth() + 1)
    // this.todayDate = new Date((new Date().getTime()))
    // this.todayTime = '00:00'
  }

  ngOnInit() {

    this.orgtimeArr = this.timeArr

    // if (this.timeArr) {
    //   const hr = new Date().getHours()
    //   const min = new Date().getMinutes()

    //   // tslint:disable-next-line:prefer-template
    //   const nhr = ('0' + hr).slice(-2)
    //   // tslint:disable-next-line:prefer-template
    //   const nmin = ('0' + min).slice(-2)

    //   const currentTime = `${nhr}:${nmin}`
    //   const newtimearray: any = []
    //   this.timeArr.forEach((time: any) => {
    //     if (time.value > currentTime) {
    //       newtimearray.push(time)
    //     }
    //   })
    //   this.newtimearray = newtimearray
    //   this.timeArr = newtimearray
    //   this.todayTime = this.timeArr[0].value
    // }
  }

  openDialog() {
    this.dialogRef = this.matDialog.open(ParticipantsComponent, {
      width: '850px',
      height: '600px',
    })
    this.dialogRef.afterClosed().subscribe((response: any) => {
      if (response) {
        this.addPresenters(response)
      }
    })
    this.events.raiseInteractTelemetry(
      {
        type: TelemetryEvents.EnumInteractTypes.CLICK,
        subType: TelemetryEvents.EnumInteractSubTypes.BTN_CONTENT,
      },
      {}
    )
  }

  addPresenters(responseObj: any) {
    Object.keys(responseObj.data).forEach((index: any) => {
      const obj = responseObj.data[index]
      const setSelectedPresentersObj = {
        firstname: obj.firstName || obj.firstname,
        email: this.profileUtilSvc.emailTransform(obj.profileDetails.personalDetails.primaryEmail),
        type: 'Karmayogi User',
        mdoName: obj.rootOrgName,
      }

      this.presentersArr.push(setSelectedPresentersObj)
      this.participantsArr.push(setSelectedPresentersObj)
      this.changeDetectorRefs.detectChanges()
      this.createEventForm.controls['presenters'].setValue(this.presentersArr)
    })
  }

  close() {
    this.dialogRef.close()
  }

  selectCover() {
    this.pictureObj = document.getElementById('coverPicture')
    this.pictureObj.click()
    this.events.raiseInteractTelemetry(
      {
        type: TelemetryEvents.EnumInteractTypes.CLICK,
        subType: TelemetryEvents.EnumInteractSubTypes.BTN_CONTENT,
      },
      {}
    )
  }

  onFileSelect(event: any) {
    if (event.target.files.length > 0) {
      const reader = new FileReader()
      const file = event.target.files[0]
      reader.onload = () => this.imageSrcURL = reader.result
      reader.readAsDataURL(file)
      this.imageSrc = file
      this.createEventForm.controls['eventPicture'].setValue(this.imageSrc)

      const org = []
      const createdforarray: any[] = []
      createdforarray.push(this.departmentID)
      org.push(this.department)

      const request = {
        request: {
          content: {
            name: 'image asset',
            creator: this.username,
            createdBy: this.userId,
            code: 'image asset',
            mimeType: this.imageSrc.type,
            mediaType: 'image',
            contentType: 'Asset',
            primaryCategory: 'Asset',
            organisation: org,
            createdFor: createdforarray,
          },
        },
      }
      // start the upload and save the progress map
      this.eventsSvc.crreateAsset(request).subscribe((res: any) => {
        const contentID = res.result.identifier
        const formData: FormData = new FormData()
        formData.append('data', file)

        this.eventsSvc.uploadFile(contentID, formData).subscribe((fdata: any) => {
          this.eventimageURL = fdata.result.artifactUrl
        })
      })
    }
  }

  removeSelectedFile() {
    this.imageSrcURL = ''
    this.createEventForm.controls['eventPicture'].setValue('')
    this.eventimageURL = ''
  }

  changeEventType(event: any) {
    this.createEventForm.controls['eventType'].setValue(event.target.value)
  }

  updateDate(event: any) {
    const dd = event.value.getDate()
    const mm = event.value.getMonth() + 1
    const yr = event.value.getFullYear()
    const selectedDate = `${dd}-${mm}-${yr}`

    const dd1 = new Date().getDate()
    const mm1 = new Date().getMonth() + 1
    const yr1 = new Date().getFullYear()
    const todaysDate = `${dd1}-${mm1}-${yr1}`

    if (selectedDate === todaysDate) {
      this.timeArr = this.newtimearray
      this.todayTime = this.timeArr[0].value
    } else {
      this.timeArr = this.orgtimeArr
      this.todayTime = this.timeArr[0].value
    }
  }

  onSubmit() {
    this.disableCreateButton = true
    this.displayLoader = true
    const eventDurationMinutes = this.addMinutes(
      this.createEventForm.controls['eventDurationHours'].value,
      this.createEventForm.controls['eventDurationMinutes'].value
    )
    const timeArr = this.createEventForm.controls['eventTime'].value.split(':')
    const todayDate = moment(new Date()).toDate()
    const eventDate = moment(this.createEventForm.controls['eventDate'].value).toDate()
    const expiryDateTime = moment(this.createEventForm.controls['eventDate'].value)
      .set('hour', timeArr[0])
      .set('minute', timeArr[1]).format('YYYYMMDDTHHmmss+0000')

    const startTimeArr = this.createEventForm.controls['eventTime'].value.split(':')
    // tslint:disable-next-line:radix
    const startMinutes = (startTimeArr[0] * 60) + parseInt(startTimeArr[1])
    // tslint:disable-next-line:radix
    const endMinutes = parseInt(this.createEventForm.controls['eventDurationHours'].value) * 60
    // tslint:disable-next-line:radix
    const totalMinutes = startMinutes + endMinutes + parseInt(this.createEventForm.controls['eventDurationMinutes'].value || 0)
    // tslint:disable-next-line:prefer-template
    let hours = (Math.floor(totalMinutes / 60) < 10) ? '0' + Math.floor(totalMinutes / 60) : Math.floor(totalMinutes / 60)
    hours = Number(hours)
    const minutes = totalMinutes % 60
    let finalTime
    let newendDate
    if (hours < 24) {
      if (minutes === 0) {
        // tslint:disable-next-line:prefer-template
        finalTime = hours + ':' + '00' + ':00+05:30'
      } else if (hours === 0) {
        // tslint:disable-next-line:prefer-template
        finalTime = '00' + ':' + minutes + ':00+05:30'
      } else {
        // tslint:disable-next-line:prefer-template
        finalTime = hours + ':' + minutes + ':00+05:30'
      }
    } else {
      if (hours === 0) {
        // tslint:disable-next-line:prefer-template
        finalTime = '00' + ':' + minutes + ':00+05:30'
      } else {
        const fhr = Number(hours)
        // tslint:disable-next-line:prefer-template
        const nhr = ('0' + (fhr - 24)).slice(-2)
        if (minutes === 0) {
          // tslint:disable-next-line:prefer-template
          finalTime = nhr + ':' + '00' + ':00+05:30'
        } else {
          // tslint:disable-next-line:prefer-template
          finalTime = nhr + ':' + minutes + ':00+05:30'
        }
        const selectedStartDate = this.createEventForm.controls['eventDate'].value
        // tslint:disable-next-line:prefer-template
        const date = ('0' + (new Date(selectedStartDate).getDate() + 1)).slice(-2)
        // tslint:disable-next-line:prefer-template
        const month = ('0' + (new Date(selectedStartDate).getMonth() + 1)).slice(-2)
        const year = new Date(selectedStartDate).getFullYear()
        newendDate = `${year}-${month}-${date}`
      }
      this.events.raiseInteractTelemetry(
        {
          type: TelemetryEvents.EnumInteractTypes.CLICK,
          subType: TelemetryEvents.EnumInteractSubTypes.BTN_CONTENT,
        },
        {}
      )
    }

    const createdforarray: any[] = []
    createdforarray.push(this.departmentID)

    if (eventDate < todayDate) {
      const linkArry = []
      linkArry.push(this.createEventForm.controls['conferenceLink'].value)
      // form.request.event.recordedLinks = arry
      this.reqPayload = {
        request: {
          event: {
            mimeType: 'application/html',
            locale: 'en',
            isExternal: true,
            name: this.createEventForm.controls['eventTitle'].value,
            description: this.createEventForm.controls['description'].value,
            instructions: this.createEventForm.controls['summary'].value,
            appIcon: this.eventimageURL,
            category: 'Event',
            createdBy: this.userId,
            authoringDisabled: false,
            isContentEditingDisabled: false,
            isMetaEditingDisabled: false,
            learningObjective: this.createEventForm.controls['agenda'].value,
            expiryDate: expiryDateTime,
            duration: eventDurationMinutes,
            // registrationLink: this.createEventForm.controls['conferenceLink'].value,
            recordedLinks: linkArry,
            resourceType: this.createEventForm.controls['eventType'].value,
            categoryType: 'Article',
            creatorDetails: this.createEventForm.controls['presenters'].value,
            sourceName: this.department,
            startDate: moment(this.createEventForm.controls['eventDate'].value).format('YYYY-MM-DD'),
            endDate: newendDate ? newendDate : moment(this.createEventForm.controls['eventDate'].value).format('YYYY-MM-DD'),
            // tslint:disable-next-line:prefer-template
            startTime: this.createEventForm.controls['eventTime'].value + ':00+05:30',
            endTime: finalTime,
            code: this.createEventForm.controls['eventTitle'].value,
            eventType: 'Online',
            registrationEndDate: moment(this.createEventForm.controls['eventDate'].value).format('YYYY-MM-DD'),
            owner: this.department,
            createdFor: createdforarray,
            identifier: this.eventId,
            versionKey: this.eventObject.versionKey,
          },
        },
      }
    } else {
      this.reqPayload = {
        request: {
          event: {
            mimeType: 'application/html',
            locale: 'en',
            isExternal: true,
            name: this.createEventForm.controls['eventTitle'].value,
            description: this.createEventForm.controls['description'].value,
            instructions: this.createEventForm.controls['summary'].value,
            appIcon: this.eventimageURL,
            category: 'Event',
            createdBy: this.userId,
            authoringDisabled: false,
            isContentEditingDisabled: false,
            isMetaEditingDisabled: false,
            learningObjective: this.createEventForm.controls['agenda'].value,
            expiryDate: expiryDateTime,
            duration: eventDurationMinutes,
            registrationLink: this.createEventForm.controls['conferenceLink'].value,
            resourceType: this.createEventForm.controls['eventType'].value,
            categoryType: 'Article',
            creatorDetails: this.createEventForm.controls['presenters'].value,
            sourceName: this.department,
            startDate: moment(this.createEventForm.controls['eventDate'].value).format('YYYY-MM-DD'),
            endDate: newendDate ? newendDate : moment(this.createEventForm.controls['eventDate'].value).format('YYYY-MM-DD'),
            // tslint:disable-next-line:prefer-template
            startTime: this.createEventForm.controls['eventTime'].value + ':00+05:30',
            endTime: finalTime,
            code: this.createEventForm.controls['eventTitle'].value,
            eventType: 'Online',
            registrationEndDate: moment(this.createEventForm.controls['eventDate'].value).format('YYYY-MM-DD'),
            owner: this.department,
            createdFor: createdforarray,
            identifier: this.eventId,
            versionKey: this.eventObject.versionKey,
          },
        },
      }
    }
    // const formJson = this.encodeToBase64(form)
    if (eventDurationMinutes === 0) {
      this.displayLoader = false
      this.disableCreateButton = false
      this.openSnackbar('Duration cannot be zero')
    } else {
      this.eventsSvc.updateEvent(this.eventId, this.reqPayload).subscribe(
        (res: any) => {
          if (res) {
            // console.log('res', res)
            this.displayLoader = false
            this.disableCreateButton = false
            this.openSnackbar('Event details are successfuly updated.')
            this.router.navigate([`/app/home/events`])
          }
        },
        (err: any) => {
          this.displayLoader = false
          this.disableCreateButton = false
          this.openSnackbar(err.error.split(':')[1])
        }
      )
    }
  }

  encodeToBase64(body: any) {
    const sString = JSON.stringify(body)
    const aUTF16CodeUnits = new Uint16Array(sString.length)
    Array.prototype.forEach.call(aUTF16CodeUnits, (_el, idx, arr) => arr[idx] = sString.charCodeAt(idx))
    return { data: btoa(new Uint8Array(aUTF16CodeUnits.buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')) }
  }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

  addMinutes(hrs: number, mins: number) {
    if (mins > 0) {
      return (hrs * 60) + mins
    }
    const minutes = (hrs * 60) + 0
    return minutes
  }

  goToList() {
    this.router.navigate([`/app/home/events`]),
      // this.telemetrySvc.impression()
      this.events.raiseInteractTelemetry(
        {
          type: TelemetryEvents.EnumInteractTypes.CLICK,
          subType: TelemetryEvents.EnumInteractSubTypes.BTN_CONTENT,
        },
        {}
      )
  }
  showSuccess(res: any) {
    this.dialogRef = this.matDialog.open(SuccessComponent, {
      width: '612px',
      data: res,
      panelClass: 'remove-overflow',
    })
    this.dialogRef.afterClosed().subscribe(() => {
      this.router.navigate([`/app/home/events`])
    })
  }

  omit_special_char(event: any) {
    const k = event.charCode
    return ((k > 64 && k < 91) || (k > 96 && k < 123) || k === 8 || k === 32 || (k >= 48 && k <= 57))
  }
}
