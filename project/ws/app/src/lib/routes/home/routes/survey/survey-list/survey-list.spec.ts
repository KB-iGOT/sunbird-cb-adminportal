import { SurveyListComponent } from './survey-list.component'
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table'
import { SelectionModel } from '@angular/cdk/collections'
import { EventEmitter } from '@angular/core'
// Mock classes
class MockMatPaginator {
  pageIndex = 0;
  pageSize = 20;
  firstPage() {
    this.pageIndex = 0
  }
}

class MockMatSnackBar {
  open(message: string) {
    return { message }
  }
}

class MockActivatedRoute {
  parent = {
    snapshot: {
      data: {
        configService: {}
      }
    }
  };
}

class MockChangeDetectorRef {
  detectChanges() { }
}

export enum EContentTypes {
  PROGRAM = "Learning Path",
  CHANNEL = "Channel",
  COURSE = "Course",
  KNOWLEDGE_ARTIFACT = "Knowledge Artifact",
  KNOWLEDGE_BOARD = "Knowledge Board",
  LEARNING_JOURNEY = "Learning Journeys",
  MODULE = "Collection",
  RESOURCE = "Resource"
}

export enum EDisplayContentTypes {
  ASSESSMENT = "ASSESSMENT",
  AUDIO = "AUDIO",
  CERTIFICATION = "CERTIFICATION",
  CHANNEL = "Channel",
  CLASS_DIAGRAM = "CLASS_DIAGRAM",
  COURSE = "COURSE",
  DEFAULT = "DEFAULT",
  DRAG_DROP = "DRAG_DROP",
  EXTERNAL_CERTIFICATION = "EXTERNAL_CERTIFICATION",
  EXTERNAL_COURSE = "EXTERNAL_COURSE",
  GOALS = "GOALS",
  HANDS_ON = "HANDS_ON",
  IAP = "IAP",
  INSTRUCTOR_LED = "INSTRUCTOR_LED",
  INTERACTIVE_VIDEO = "INTERACTIVE_VIDEO",
  KNOWLEDGE_ARTIFACT = "KNOWLEDGE_ARTIFACT",
  MODULE = "MODULE",
  PDF = "PDF",
  PLAYLIST = "PLAYLIST",
  PROGRAM = "PROGRAM",
  QUIZ = "QUIZ",
  RESOURCE = "RESOURCE",
  RDBMS_HANDS_ON = "RDBMS_HANDS_ON",
  VIDEO = "VIDEO",
  WEB_MODULE = "WEB_MODULE",
  WEB_PAGE = "WEB_PAGE",
  YOUTUBE = "YOUTUBE",
  KNOWLEDGE_BOARD = "Knowledge Board",
  LEARNING_JOURNEY = "Learning Journeys"
}

export enum EMimeTypes {
  COLLECTION = "application/vnd.ekstep.content-collection",
  HTML = "application/html",
  HTML_TEXT = "text/html",
  ILP_FP = "application/ilpfp",
  IAP = "application/iap-assessment",
  M4A = "audio/m4a",
  MP3 = "audio/mpeg",
  MP4 = "video/mp4",
  M3U8 = "application/x-mpegURL",
  INTERACTION = "video/interactive",
  PDF = "application/pdf",
  QUIZ = "application/quiz",
  DRAG_DROP = "application/drag-drop",
  HTML_PICKER = "application/htmlpicker",
  WEB_MODULE = "application/web-module",
  WEB_MODULE_EXERCISE = "application/web-module-exercise",
  YOUTUBE = "video/x-youtube",
  HANDS_ON = "application/integrated-hands-on",
  RDBMS_HANDS_ON = "application/rdbms",
  CLASS_DIAGRAM = "application/class-diagram",
  CHANNEL = "application/channel",
  COLLECTION_RESOURCE = "resource/collection",
  CERTIFICATION = "application/certification",
  PLAYLIST = "application/playlist",
  UNKNOWN = "application/unknown"
}

// Mock document functions
document.createElement = jest.fn().mockImplementation((tagName) => {
  if (tagName === 'textarea') {
    return {
      style: {
        position: '',
        left: '',
        top: '',
        opacity: ''
      },
      value: '',
      focus: jest.fn(),
      select: jest.fn()
    }
  }
  return {}
})

document.body.appendChild = jest.fn()
document.body.removeChild = jest.fn()
document.execCommand = jest.fn().mockReturnValue(true)

describe('SurveyListComponent', () => {
  let component: SurveyListComponent
  let mockSnackBar: MockMatSnackBar
  let mockActivatedRoute: MockActivatedRoute
  let mockChangeDetectorRef: MockChangeDetectorRef

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Create mock instances
    mockSnackBar = new MockMatSnackBar()
    mockActivatedRoute = new MockActivatedRoute()
    mockChangeDetectorRef = new MockChangeDetectorRef()

    // Create component with dependencies
    component = new SurveyListComponent(
      mockSnackBar as any,
      mockActivatedRoute as any,
      mockChangeDetectorRef as any,
      {
        content: {
          addedOn: '',
          appIcon: '',
          artifactUrl: '',
          certificationUrl: '',
          children: [],
          complexityLevel: '',
          contentId: '',
          contentType: EContentTypes.PROGRAM,
          contentUrlAtSource: '',
          creatorContacts: [],
          creatorDetails: [],
          creatorLogo: '',
          creatorPosterImage: '',
          creatorThumbnail: '',
          curatedTags: [],
          description: '',
          displayContentType: EDisplayContentTypes.ASSESSMENT,
          duration: 0,
          hasAccess: false,
          identifier: '',
          isExternal: false,
          isIframeSupported: 'Yes',
          lastUpdatedOn: '',
          learningObjective: '',
          me_totalSessionsCount: 0,
          mediaType: '',
          mimeType: EMimeTypes.COLLECTION,
          name: '',
          preRequisites: '',
          primaryCategory: '',
          publishedOn: '',
          resourceType: '',
          skills: [],
          sourceName: '',
          sourceShortName: '',
          status: 'Draft',
          tags: [],
          topics: [],
          track: []
        }
      } // MAT_DIALOG_DATA
    )

    // Set up ViewChild manually
    component.paginator = new MockMatPaginator() as any
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize with default values', () => {
    expect(component.dataSource).toBeInstanceOf(MatTableDataSource)
    expect(component.selection).toBeInstanceOf(SelectionModel)
    expect(component.clicked).toBeInstanceOf(EventEmitter)
    expect(component.pageSize).toBe(20)
    expect(component.pageSizeOptions).toEqual([20, 30, 40])
  })

  it('should set displayedColumns and dataSource.data in ngOnInit', () => {
    // Arrange
    const mockTableData = {
      columns: ['col1', 'col2']
    }
    const mockData = [{ id: 1 }, { id: 2 }]

    component.tableData = mockTableData as any
    component.data = mockData as any

    // Act
    component.ngOnInit()

    // Assert
    expect(component.displayedColumns).toEqual(mockTableData.columns)
    expect(component.dataSource.data).toEqual(mockData)
    expect(component.pendingListRecord).toBe(mockData.length)
  })

  it('should update data and reset paginator in ngOnChanges', () => {
    // Arrange
    const mockTableData = {
      columns: ['col1', 'col2']
    }
    const mockData = [{ id: 1 }, { id: 2 }]

    component.tableData = mockTableData as any
    component.data = mockData as any

    // Mock paginator's firstPage method
    const firstPageSpy = jest.spyOn(component.paginator, 'firstPage')

    // Act
    component.ngOnChanges()

    // Assert
    expect(component.displayedColumns).toEqual(mockTableData.columns)
    expect(component.dataSource.data).toEqual(mockData)
    expect(component.pendingListRecord).toBe(mockData.length)
    expect(component.length).toBe(mockData.length)
    expect(firstPageSpy).toHaveBeenCalled()
  })

  it('should set dataSource.paginator in ngAfterViewInit', () => {
    // Act
    component.ngAfterViewInit()

    // Assert
    expect(component.dataSource.paginator).toBe(component.paginator)
  })

  it('should call detectChanges in ngAfterViewChecked', () => {
    // Arrange
    const detectChangesSpy = jest.spyOn(mockChangeDetectorRef, 'detectChanges')

    // Act
    component.ngAfterViewChecked()

    // Assert
    expect(detectChangesSpy).toHaveBeenCalled()
  })

  it('should copy link and show snackbar when actionsClick is called with ViewCount action', () => {
    // Arrange
    const mockEvent = {
      action: 'ViewCount',
      row: {
        SOLUTION_ID: '123456'
      }
    }
    const copyTextSpy = jest.spyOn(component, 'copyText')
    const snackbarSpy = jest.spyOn(mockSnackBar, 'open')

    // Act
    component.actionsClick(mockEvent)

    // Assert
    expect(copyTextSpy).toHaveBeenCalledWith('123456')
    expect(snackbarSpy).toHaveBeenCalledWith('Link Copied Successfully')
  })

  it('should not copy link when actionsClick is called with different action', () => {
    // Arrange
    const mockEvent = {
      action: 'OtherAction',
      row: {
        SOLUTION_ID: '123456'
      }
    }
    const copyTextSpy = jest.spyOn(component, 'copyText')

    // Act
    component.actionsClick(mockEvent)

    // Assert
    expect(copyTextSpy).not.toHaveBeenCalled()
  })

  it('should copy text to clipboard in copyText method', () => {
    // Arrange
    const solutionId = '123456'
    const environment = { karmYogiPath: 'https://example.com' };
    (global as any).environment = environment

    const createElementSpy = jest.spyOn(document, 'createElement')
    const appendChildSpy = jest.spyOn(document.body, 'appendChild')
    const removeChildSpy = jest.spyOn(document.body, 'removeChild')
    const execCommandSpy = jest.spyOn(document, 'execCommand')

    // Act
    component.copyText(solutionId)

    // Assert
    expect(createElementSpy).toHaveBeenCalledWith('textarea')
    expect(appendChildSpy).toHaveBeenCalled()
    expect(execCommandSpy).toHaveBeenCalledWith('copy')
    expect(removeChildSpy).toHaveBeenCalled()
  })
})