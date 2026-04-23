import { ConfigurationsService, EventService } from '@sunbird-cb/utils-v2'
import { DomSanitizer } from '@angular/platform-browser'
import { SimpleChange } from '@angular/core'
import { LearningCardComponent } from './learning-card.component'

describe('LearningCardComponent', () => {
    let component: LearningCardComponent
    let events: any
    let configSvc: any
    let domSanitizer: any

    beforeEach(() => {
        events = {
            raiseInteractTelemetry: jest.fn(),
        }
        configSvc = {
            instanceConfig: {
                logos: {
                    defaultContent: 'default-thumbnail.png',
                },
            },
        }
        domSanitizer = {
            bypassSecurityTrustHtml: jest.fn((html: string) => `safe:${html}`),
        }

        component = new LearningCardComponent(
            events as EventService,
            configSvc as ConfigurationsService,
            domSanitizer as DomSanitizer,
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })

    it('should set defaultThumbnail from instanceConfig.logos.defaultContent on ngOnInit', () => {
        component.ngOnInit()
        expect(component.defaultThumbnail).toBe('default-thumbnail.png')
    })

    it('should set defaultThumbnail to empty string if instanceConfig is null', () => {
        configSvc.instanceConfig = null
        component = new LearningCardComponent(events, configSvc, domSanitizer)
        component.ngOnInit()
        expect(component.defaultThumbnail).toBe('')
    })

    it('should set defaultThumbnail to empty string if logos is undefined', () => {
        configSvc.instanceConfig = {}
        component = new LearningCardComponent(events, configSvc, domSanitizer)
        component.ngOnInit()
        expect(component.defaultThumbnail).toBe('')
    })

    it('should sanitize description and remove <br> tags on ngOnChanges when content has description', () => {
        component.content = { identifier: 'id1', description: 'Hello<br>World' } as any
        const changes = {
            content: new SimpleChange(null, component.content, false),
        }
        component.ngOnChanges(changes)
        expect(component.content.description).toBe('HelloWorld')
        expect(domSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith('HelloWorld')
        expect(component.description).toBe('safe:HelloWorld')
    })

    it('should not sanitize if content has no description on ngOnChanges', () => {
        component.content = { identifier: 'id1', description: '' } as any
        const changes = {
            content: new SimpleChange(null, component.content, false),
        }
        component.ngOnChanges(changes)
        expect(domSanitizer.bypassSecurityTrustHtml).not.toHaveBeenCalled()
    })

    it('should not sanitize for changes other than content', () => {
        const changes = {
            displayType: new SimpleChange(null, 'advanced', false),
        }
        component.ngOnChanges(changes)
        expect(domSanitizer.bypassSecurityTrustHtml).not.toHaveBeenCalled()
    })

    it('should call raiseInteractTelemetry with correct params on raiseTelemetry', () => {
        component.content = { identifier: 'content-123' } as any
        component.raiseTelemetry()
        expect(events.raiseInteractTelemetry).toHaveBeenCalledWith(
            { type: 'click', subType: 'cardSearch' },
            { contentId: 'content-123' },
        )
    })

    it('should initialize displayType as basic', () => {
        expect(component.displayType).toBe('basic')
    })

    it('should initialize isExpanded as false', () => {
        expect(component.isExpanded).toBe(false)
    })
})
