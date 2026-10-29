import { Directive, NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { QandaCardComponent } from './qanda-card.component'

@Directive({ selector: 'mat-menu', exportAs: 'matMenu', standalone: false })
class MatMenuStubDirective { }

@Pipe({ name: 'pipeLimitTo', standalone: false })
class PipeLimitToStubPipe implements PipeTransform {
    transform(value: any) {
        return value
    }
}

describe('QandaCardComponent', () => {
    let component: QandaCardComponent

    beforeAll(() => {
        component = new QandaCardComponent(

        )
    })

    beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })

    describe('question heading template', () => {
        let fixture: ComponentFixture<QandaCardComponent>

        const buildItem = (overrides: any) => ({
            id: 'q1',
            status: 'Active',
            title: '',
            abstract: '',
            body: '<b>Question body</b>',
            highlight: {},
            tags: [],
            replyCount: 0,
            hasAcceptedAnswer: false,
            dtCreated: '2024-01-01',
            activity: { activityData: { upVote: 1, downVote: 0, like: 0 } },
            postCreator: { postCreatorId: 'creator', name: 'Creator' },
            ...overrides,
        })

        const renderHeadings = (item: any): HTMLElement[] => {
            fixture.componentInstance.item = item
            fixture.detectChanges()
            return Array.from(fixture.nativeElement.querySelectorAll('h2.question-text'))
        }

        beforeEach(() => {
            TestBed.configureTestingModule({
                declarations: [QandaCardComponent, MatMenuStubDirective, PipeLimitToStubPipe],
                schemas: [NO_ERRORS_SCHEMA],
            })
            fixture = TestBed.createComponent(QandaCardComponent)
        })

        it('should render the body html inside a span when the title is highlighted', () => {
            const headings = renderHeadings(buildItem({ title: 'Title', highlight: { title: ['<em>Title</em>'] } }))

            expect(headings.length).toBe(1)
            const span = headings[0].querySelector('span') as HTMLElement
            expect(span).toBeTruthy()
            expect(span.innerHTML).toBe('<b>Question body</b>')
            expect(headings[0].children.length).toBe(1)
        })

        it('should render the highlighted body html inside a span when there is no title or abstract', () => {
            const headings = renderHeadings(buildItem({ highlight: { body: ['<em>match</em> text'] } }))
            const htmlHeadings = headings.filter(h => h.querySelector('span'))

            expect(htmlHeadings.length).toBe(1)
            expect((htmlHeadings[0].querySelector('span') as HTMLElement).innerHTML).toBe('<em>match</em> text')
        })

        it('should render the body html inside a span when there is no title, abstract or highlighted body', () => {
            const headings = renderHeadings(buildItem({}))
            const htmlHeadings = headings.filter(h => h.querySelector('span'))

            expect(htmlHeadings.length).toBe(1)
            expect((htmlHeadings[0].querySelector('span') as HTMLElement).innerHTML).toBe('<b>Question body</b>')
        })

        it('should render the plain title without an inner span when the title is not highlighted', () => {
            const headings = renderHeadings(buildItem({ title: 'Plain title' }))

            expect(headings.length).toBe(1)
            expect(headings[0].querySelector('span')).toBeNull()
            expect(headings[0].textContent!.trim()).toBe('Plain title')
        })
    })
})
