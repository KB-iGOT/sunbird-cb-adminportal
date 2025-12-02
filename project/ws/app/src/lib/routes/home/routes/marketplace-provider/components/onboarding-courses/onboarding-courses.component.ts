import { Component, EventEmitter, Input, Output } from '@angular/core'

@Component({
  selector: 'ws-app-onboarding-courses',
  templateUrl: './onboarding-courses.component.html',
  styleUrls: ['./onboarding-courses.component.scss']
})
export class OnboardingCoursesComponent {
  @Input() providerDetails: any
  @Output() loadProviderDetails = new EventEmitter<any>()

  addCoursesFlag: boolean = false
  DUMMY_PLACEHOLDER_CONTENT = [
    {
      "externalId": "CEPL504OD2",
      "partnerId": "77b23955-7938-463d-9e0b-7244540daaec",
      "isActive": false,
      "createdDate": "2025-11-10 12:18:52.75",
      "updatedDate": "2025-11-10 12:18:52.75",
      "fileId": "7c1b235a-8560-44f7-b459-24b740f1dfd5",
      "partnerCode": "NANDI",
      "appIcon": "https://s3.amazonaws.com/ecornell/content/On-Demand/Homepages/Banners/CEPL504-OD2_homepage-banner_v1.jpg",
      "redirectUrl": "https://admin-test.ecornell.com/scorm?username=<username>&org=G003459&course=CEPL504OD2",
      "name": "Leading Project Teams: Assess Motivational and Participative Leadership Styles",
      "topic": "Engineering, Leadership, Project Management",
      "duration": "45",
      "objectives": "<ul>_x000D_,\t<li>Explore the leadership strategies that you can employ when your project team needs motivation or participation</li>_x000D_,\t<li>Identify the relative pros and cons of each leadership style with the aid of reusable worksheets</li>_x000D_,\t<li>Consider the conditions under which a project leader would get involved with the project team work</li>_x000D_,</ul>",
      "description": "There is a common weakness shared by autocratic, democratic, and laissez-faire leadership styles: they assume that motivation is inherent or automatic. For many people, this is not the case. In addition, these three leadership styles do not provide guidance on how leaders can connect with team members on an emotional level. In fact, any one of these three styles, applied at the wrong time, can be extremely demotivating to people.",
      "source": "test2.xlsx",
      "publishedOn": "0000-00-00 00:00:00.000",
      "contentSearchTags": [
        "leading project teams: assess motivational and participative leadership styles"
      ],
      "contentPartner": {
        "contentPartnerName": "TestingV",
        "link": "https://portal.dev.karmayogibharat.net/content-store/cios-icon/1742904591214_Pi7_Tool_CDAC_LogoTransp3.png",
        "partnerCode": "NANDI",
        "id": "77b23955-7938-463d-9e0b-7244540daaec",
        "providerTips": []
      },
      "accessSettingsEnabled": false,
      "status": "draft",
      "contentId": "ext_114440670271528960125",
      "competencies_v6": [
        {
          "competencyAreaName": "Functional",
          "competencyThemeName": "Data Analytics",
          "competencyAreaIdentifier": "kcmfinal_fw_competencyarea_af8caa53-7f84-499e-86b2-e32e5b59908e",
          "competencyAreaRefId": "COMAREA-000003",
          "competencyThemeIdentifier": "kcmfinal_fw_theme_15d3a33f-4520-4520-b712-9b22c492e07a",
          "competencyThemeRefId": "COMTHEME-000046",
          "competencySubThemeName": "Data Analysis & Visualization",
          "competencyThemeType": "theme",
          "competencyThemeAdditionalProperties": {
            "displayName": "Data Analytics",
            "timeStamp": 1724677555268
          },
          "competencySubThemeIdentifier": "kcmfinal_fw_subtheme_97c028cc-8d48-433c-92de-4c96f4998d13",
          "competencyAreaDescription": "Functional competencies are common among many domains, cutting across MDOs, as well as roles and activities.",
          "competencyThemeDescription": "Data Analytics competency Theme",
          "competencySubThemeDescription": "Data Analysis & Visualization Competency Sub-Theme",
          "competencySubThemeRefId": "COMSUBTHEME-000243",
          "competencySubThemeAdditionalProperties": {
            "displayName": "Data Analysis & Visualization",
            "timeStamp": 1724765671413
          }
        }
      ],
      "searchTags": [
        "leading project teams: assess motivational and participative leadership styles"
      ]
    }
  ]

  addCourses() {
    this.addCoursesFlag = true
  }

  actionHandler(event: any) {
    if (event.action === 'goBack') {
      this.addCoursesFlag = false
    }
  }
}
