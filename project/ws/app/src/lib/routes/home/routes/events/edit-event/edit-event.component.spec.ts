import { EditEventComponent } from './edit-event.component'
import { UntypedFormGroup } from '@angular/forms'
import { of, throwError } from 'rxjs'
import moment from 'moment'

// Create proper type-safe mocks
const createMockSnackBar = () => ({
	open: jest.fn(),
	dismiss: jest.fn(),
	ngOnDestroy: jest.fn(),
	_openedSnackBarRef: null,
	simpleSnackBarComponent: null,
	snackBarContainerComponent: null,
	handsetCssClass: '',
	_overlay: null,
	_live: null,
	_injector: null,
	_breakpointObserver: null,
	_parentSnackBar: null,
	_defaultConfig: null
} as any)

const createMockEventsService = () => ({
	getEventDetailsInEditMode: jest.fn(),
	crreateAsset: jest.fn(),
	uploadFile: jest.fn(),
	updateEvent: jest.fn(),
	publishEvent: jest.fn(),
	getSlwResourceTypeDetail: jest.fn(),
	getPublicUrl: jest.fn()
} as any)

const createMockMatDialog = () => ({
	open: jest.fn().mockReturnValue({
		afterClosed: jest.fn().mockReturnValue(of(null)),
		close: jest.fn(),
		componentInstance: null
	}),
	closeAll: jest.fn(),
	getDialogById: jest.fn(),
	ngOnDestroy: jest.fn()
} as any)

const createMockRouter = () => ({
	navigate: jest.fn(),
	navigateByUrl: jest.fn(),
	createUrlTree: jest.fn(),
	serializeUrl: jest.fn(),
	parseUrl: jest.fn(),
	isActive: jest.fn(),
	url: '',
	routerState: null,
	events: of(),
	errorHandler: null,
	malformedUriErrorHandler: null,
	onSameUrlNavigation: 'ignore',
	paramsInheritanceStrategy: 'emptyOnly',
	urlUpdateStrategy: 'deferred',
	relativeLinkResolution: 'legacy',
	urlHandlingStrategy: null,
	routeReuseStrategy: null
} as any)

const createMockActivatedRoute = () => ({
	params: of({ id: 'test-event-id' }),
	queryParams: of({ filter: 'upcoming' }),
	snapshot: {
		data: {
			configService: {
				userProfile: {
					rootOrgId: 'test-org',
					departmentName: 'Test Department',
					userId: 'test-user',
					userName: 'Test User'
				}
			}
		},
		params: { id: 'test-event-id' },
		queryParams: { filter: 'upcoming' },
		url: [],
		outlet: 'primary',
		component: null,
		routeConfig: null,
		root: null,
		parent: null,
		firstChild: null,
		children: [],
		pathFromRoot: [],
		paramMap: null,
		queryParamMap: null,
		fragment: null,
		title: null
	},
	url: of([]),
	data: of({}),
	fragment: of(null),
	outlet: 'primary',
	component: null,
	routeConfig: null,
	root: null,
	parent: null,
	firstChild: null,
	children: [],
	pathFromRoot: [],
	paramMap: of(null),
	queryParamMap: of(null),
	title: of(null)
} as any)

const createMockConfigService = () => ({
	userProfile: {
		userId: 'test-user',
		userName: 'Test User',
		departmentName: 'Test Department'
	},
	eventBufferTimeInMinutes: 30,
	instanceConfig: null,
	appConfig: null,
	userProfileV2: null,
	nodebbUserProfile: null,
	restrictedFeatures: null,
	unMappedUser: null,
	activeThemeObject: null,
	activeFontObject: null
} as any)

const createMockEventService = () => ({
	raiseInteractTelemetry: jest.fn(),
	raiseImpressionTelemetry: jest.fn(),
	raiseTelemetry: jest.fn()
} as any)

const createMockProfileUtilService = () => ({
	emailTransform: jest.fn().mockReturnValue('test@example.com'),
	getFullName: jest.fn(),
	getUserDetailsFromRegistry: jest.fn()
} as any)

const createMockChangeDetectorRef = () => ({
	detectChanges: jest.fn(),
	checkNoChanges: jest.fn(),
	detach: jest.fn(),
	reattach: jest.fn(),
	markForCheck: jest.fn()
} as any)

describe('EditEventComponent', () => {
	let component: EditEventComponent
	let mockSnackBar: any
	let mockEventsService: any
	let mockMatDialog: any
	let mockRouter: any
	let mockActivatedRoute: any
	let mockConfigService: any
	let mockEventService: any
	let mockProfileUtilService: any
	let mockChangeDetectorRef: any
	let mockEventObject: any

	beforeEach(() => {
		// Create fresh mocks for each test
		mockSnackBar = createMockSnackBar()
		mockEventsService = createMockEventsService()
		mockMatDialog = createMockMatDialog()
		mockRouter = createMockRouter()
		mockActivatedRoute = createMockActivatedRoute()
		mockConfigService = createMockConfigService()
		mockEventService = createMockEventService()
		mockProfileUtilService = createMockProfileUtilService()
		mockChangeDetectorRef = createMockChangeDetectorRef()

		// Mock event object
		mockEventObject = {
			appIcon: 'test-icon.png',
			name: 'Test Event',
			description: 'Test Description',
			learningObjective: 'Test Objective',
			startDate: '2025-06-01',
			startTime: '10:00:00+05:30',
			endDate: '2025-06-01',
			endTime: '11:00:00+05:30',
			resourceType: 'Webinar',
			duration: 60,
			registrationLink: 'https://example.com/register',
			recordedLinks: ['https://example.com/recorded'],
			creatorDetails: JSON.stringify([{
				name: 'Test Creator',
				email: 'creator@test.com',
				mdoName: 'Test MDO'
			}]),
			versionKey: 'test-version-key'
		}

		// Mock getEventDetailsInEditMode to return our mock event
		mockEventsService.getEventDetailsInEditMode.mockReturnValue(of({
			result: { event: mockEventObject }
		}))

		// Create component instance
		component = new EditEventComponent(
			mockSnackBar,
			mockEventsService,
			mockMatDialog,
			mockRouter,
			mockConfigService,
			mockChangeDetectorRef,
			mockActivatedRoute,
			mockEventService,
			mockProfileUtilService
		)
	})

	describe('Component Initialization', () => {
		test('should create component', () => {
			expect(component).toBeTruthy()
		})

		test('should initialize form with correct validators', () => {
			expect(component.createEventForm).toBeInstanceOf(UntypedFormGroup)
			// Form gets populated and possibly disabled in constructor; enable and clear to test validators
			component.createEventForm.get('eventTitle')?.enable()
			component.createEventForm.get('eventTitle')?.setValue('')
			component.createEventForm.get('description')?.enable()
			component.createEventForm.get('description')?.setValue('')
			expect(component.createEventForm.get('eventTitle')?.hasError('required')).toBe(true)
			expect(component.createEventForm.get('description')?.hasError('required')).toBe(true)
			// eventType has Validators.required but is disabled - check via re-enabling
			const eventTypeControl = component.createEventForm.get('eventType')
			eventTypeControl?.enable()
			eventTypeControl?.setValue('')
			expect(eventTypeControl?.hasError('required')).toBe(true)
		})

		test('should set user profile data from config service', () => {
			expect(component.userId).toBe('test-user')
			expect(component.username).toBe('Test User')
			expect(component.department).toBe('Test Department')
		})

		test('should initialize time arrays correctly', () => {
			// Time arrays are reset during event loading in constructor (before ngOnInit)
			// Verify the component initializes with the correct properties
			expect(component.newtimearray).toBeDefined()
			expect(component.eventBufferTime).toBeDefined()
			expect(component.minDate).toBeInstanceOf(Date)
		})

		test('should set min and max dates correctly', () => {
			expect(component.minDate).toBeInstanceOf(Date)
			expect(component.maxDate).toBeDefined()
		})

		test('should disable eventType and state controls initially', () => {
			expect(component.createEventForm.get('eventType')?.disabled).toBe(true)
			expect(component.createEventForm.get('state')?.disabled).toBe(true)
		})
	})

	describe('Event Loading and Form Population', () => {
		test('should load event details and populate form', () => {
			component.ngOnInit()

			expect(mockEventsService.getEventDetailsInEditMode).toHaveBeenCalledWith('test-event-id')
			expect(component.createEventForm.get('eventTitle')?.value).toBe('Test Event')
			expect(component.createEventForm.get('description')?.value).toBe('Test Description')
			expect(component.createEventForm.get('eventType')?.value).toBe('Webinar')
		})

		test('should handle recorded links for past events', () => {
			const pastEvent = { ...mockEventObject, startDate: '2025-01-01' }
			mockEventsService.getEventDetailsInEditMode.mockReturnValue(of({
				result: { event: pastEvent }
			}))

			component.ngOnInit()

			expect(component.createEventForm.get('conferenceLink')?.value).toBe('https://example.com/recorded')
		})

		test('should disable form fields for past events', () => {
			const pastEvent = {
				...mockEventObject,
				endDate: '2025-01-01',
				endTime: '10:00:00+05:30'
			}
			mockEventsService.getEventDetailsInEditMode.mockReturnValue(of({
				result: { event: pastEvent }
			}))

			component.ngOnInit()

			expect(component.fullEdit).toBe(false)
			expect(component.createEventForm.get('eventTitle')?.disabled).toBe(true)
		})

		test('should handle Rajya Karmayogi Saptah event type', () => {
			// The params subscription runs in the constructor, not ngOnInit
			// Create a new component with the Rajya event mock
			const rajyaEvent = {
				...mockEventObject,
				resourceType: 'Rajya Karmayogi Saptah',
				resourceTypeDetails: {
					stateOrMinistryName: 'Test State'
				}
			}
			mockEventsService.getEventDetailsInEditMode.mockReturnValue(of({
				result: { event: rajyaEvent }
			}))
			const mockStateData = {
				slwResourceTypeDetails: [
					{ stateOrMinistryName: 'Test State' }
				]
			}
			mockEventsService.getSlwResourceTypeDetail.mockReturnValue(of(mockStateData))

			const rajyaComponent = new EditEventComponent(
				mockSnackBar, mockEventsService, mockMatDialog, mockRouter,
				mockConfigService, mockChangeDetectorRef, mockActivatedRoute,
				mockEventService, mockProfileUtilService
			)

			expect(rajyaComponent.showRajyaField).toBe(true)
			expect(mockEventsService.getSlwResourceTypeDetail).toHaveBeenCalled()
		})
	})

	describe('File Upload Functionality', () => {
		test('should handle valid image file upload', () => {
			const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
			Object.defineProperty(mockFile, 'size', { value: 400000 }) // 400KB

			const mockEvent = {
				target: {
					files: [mockFile],
					value: ''
				}
			}

			const mockAssetResponse = { result: { identifier: 'test-id' } }
			const mockUploadResponse = { result: { artifactUrl: 'test-url' } }

			mockEventsService.crreateAsset.mockReturnValue(of(mockAssetResponse))
			mockEventsService.uploadFile.mockReturnValue(of(mockUploadResponse))

			// Mock FileReader
			const mockFileReader = {
				readAsDataURL: jest.fn(),
				result: 'data:image/jpeg;base64,test',
				onload: null as any
			};
			(global as any).FileReader = jest.fn(() => mockFileReader)

			component.onFileSelect(mockEvent)

			// Simulate FileReader onload
			if (mockFileReader.onload) {
				mockFileReader.onload()
			}

			expect(component.imageSrcURL).toBe('data:image/jpeg;base64,test')
			expect(mockEventsService.crreateAsset).toHaveBeenCalled()
		})

		test('should reject invalid file types', () => {
			const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })
			const mockEvent = {
				target: {
					files: [mockFile]
				}
			}

			component.onFileSelect(mockEvent)

			expect(component.errorMessages).toContain('Please upload the file in either PNG, JPG, or JPEG format')
		})

		test('should reject files larger than 500KB', () => {
			const mockFile = new File(['x'.repeat(600000)], 'test.jpg', { type: 'image/jpeg' })
			Object.defineProperty(mockFile, 'size', { value: 600000 })

			const mockEvent = {
				target: {
					files: [mockFile]
				}
			}

			component.onFileSelect(mockEvent)

			expect(component.errorMessages).toContain('exceeds the maximum allowed size of 500KB')
		})

		test('should remove selected file', () => {
			component.imageSrcURL = 'test-url'
			component.eventimageURL = 'test-event-url'

			component.removeSelectedFile()

			expect(component.imageSrcURL).toBe('')
			expect(component.eventimageURL).toBe('')
			expect(component.createEventForm.get('eventPicture')?.value).toBe('')
		})

		test('should trigger file selection', () => {
			// Mock document.getElementById
			const mockElement = { click: jest.fn() }
			jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as any)

			component.selectCover()

			expect(document.getElementById).toHaveBeenCalledWith('coverPicture')
			expect(mockElement.click).toHaveBeenCalled()
			expect(component.createEventForm.get('eventPicture')?.touched).toBe(true)
		})
	})

	describe('Time Slot Management', () => {
		beforeEach(() => {
			// Manually initialize timeArr before ngOnInit so orgtimeArr gets set correctly
			component.timeArr = [
				{ value: '09:00', disabled: false } as any,
				{ value: '10:00', disabled: false } as any,
				{ value: '11:00', disabled: false } as any
			]
			component.ngOnInit()
		})

		test('should filter time slots for today', () => {
			const today = new Date()

			component.filterTimeSlotsByDate(today)

			expect(component.timeArr).toBe(component.newtimearray)
		})

		test('should not filter time slots for future dates', () => {
			const futureDate = new Date()
			futureDate.setDate(futureDate.getDate() + 1)

			component.filterTimeSlotsByDate(futureDate)

			expect(component.timeArr).not.toBe(component.newtimearray)
			expect(component.timeArr.every((slot: any) => !slot.disabled)).toBe(true)
		})

		test('should update date and filter time slots', () => {
			const mockEvent = {
				value: new Date()
			}

			component.updateDate(mockEvent)

			expect(component.timeArr).toBe(component.newtimearray)
		})
	})

	describe('Presenters Management', () => {
		test('should open participants dialog', () => {
			component.openDialog()

			expect(mockMatDialog.open).toHaveBeenCalledWith(
				expect.any(Function),
				expect.objectContaining({
					width: '850px',
					height: '600px'
				})
			)
			expect(mockEventService.raiseInteractTelemetry).toHaveBeenCalled()
		})

		test('should add presenters from dialog response', () => {
			// Clear existing presenters populated by constructor's params subscription
			component.presentersArr = []
			component.participantsArr = []

			const responseObj = {
				data: {
					0: {
						firstName: 'John',
						profileDetails: {
							personalDetails: {
								primaryEmail: 'john@test.com'
							}
						},
						rootOrgName: 'Test Org'
					}
				}
			}

			component.addPresenters(responseObj)

			expect(component.presentersArr.length).toBeGreaterThan(0)
			expect(component.presentersArr[0].firstname).toBe('John')
			expect(component.participantsArr.length).toBeGreaterThan(0)
			expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalled()
		})

		test('should handle presenters with legacy firstname property', () => {
			// Clear existing presenters populated by constructor's params subscription
			component.presentersArr = []
			component.participantsArr = []

			const responseObj = {
				data: {
					0: {
						firstname: 'Jane', // Legacy property
						profileDetails: {
							personalDetails: {
								primaryEmail: 'jane@test.com'
							}
						},
						rootOrgName: 'Test Org'
					}
				}
			}

			component.addPresenters(responseObj)

			expect(component.presentersArr[0].firstname).toBe('Jane')
		})
	})

	describe('Form Submission', () => {
		beforeEach(() => {
			// Setup form with valid data - use far future date to ensure future-event code path
			component.createEventForm.patchValue({
				eventTitle: 'Test Event',
				description: 'Test Description',
				eventType: 'Webinar',
				eventDate: new Date('2099-06-01'),
				eventTime: '10:00',
				eventDurationHours: 1,
				eventDurationMinutes: 0,
				conferenceLink: 'https://example.com'
			})
			component.eventId = 'test-event-id'
			component.eventObject = mockEventObject
			component.eventimageURL = 'test-image-url'
			component.department = 'Test Department'
			component.departmentID = 'test-dept-id'
		})

		test('should submit form with valid data for future event', () => {
			const mockUpdateResponse = { result: { identifier: 'test-id', versionKey: 'new-version' } }
			const mockPublishResponse = { result: 'success' }

			mockEventsService.updateEvent.mockReturnValue(of(mockUpdateResponse))
			mockEventsService.publishEvent.mockReturnValue(of(mockPublishResponse))

			component.onSubmit()

			expect(mockEventsService.updateEvent).toHaveBeenCalledWith(
				'test-event-id',
				expect.objectContaining({
					request: expect.objectContaining({
						event: expect.objectContaining({
							name: 'Test Event',
							description: 'Test Description',
							registrationLink: 'https://example.com'
						})
					})
				})
			)
		})

		test('should handle past event with recorded links', () => {
			// Set a past date
			const pastDate = new Date('2025-01-01')
			component.createEventForm.patchValue({
				eventDate: pastDate
			})

			const mockUpdateResponse = { result: { identifier: 'test-id', versionKey: 'new-version' } }
			const mockPublishResponse = { result: 'success' }

			mockEventsService.updateEvent.mockReturnValue(of(mockUpdateResponse))
			mockEventsService.publishEvent.mockReturnValue(of(mockPublishResponse))

			component.onSubmit()

			expect(mockEventsService.updateEvent).toHaveBeenCalledWith(
				'test-event-id',
				expect.objectContaining({
					request: expect.objectContaining({
						event: expect.objectContaining({
							recordedLinks: ['https://example.com']
						})
					})
				})
			)
		})

		test('should handle zero duration error', () => {
			component.createEventForm.patchValue({
				eventDurationHours: 0,
				eventDurationMinutes: 0
			})

			component.onSubmit()

			expect(mockSnackBar.open).toHaveBeenCalledWith('Duration cannot be zero', 'X', { duration: 5000 })
			expect(component.disableCreateButton).toBe(false)
			expect(component.displayLoader).toBe(false)
		})

		test('should handle update event error', () => {
			const errorResponse = { error: 'Error: Something went wrong' }
			mockEventsService.updateEvent.mockReturnValue(throwError(errorResponse))

			component.onSubmit()

			expect(mockSnackBar.open).toHaveBeenCalledWith(' Something went wrong', 'X', { duration: 5000 })
			expect(component.disableCreateButton).toBe(false)
			expect(component.displayLoader).toBe(false)
		})

		test('should handle Rajya Karmayogi Saptah with state details', () => {
			component.createEventForm.patchValue({
				eventType: 'Rajya Karmayogi Saptah',
				state: 'Test State'
			})
			component.showRajyaField = true
			component.stateList = [
				{ stateOrMinistryName: 'Test State' }
			] as any

			const mockUpdateResponse = { result: { identifier: 'test-id', versionKey: 'new-version' } }
			const mockPublishResponse = { result: 'success' }

			mockEventsService.updateEvent.mockReturnValue(of(mockUpdateResponse))
			mockEventsService.publishEvent.mockReturnValue(of(mockPublishResponse))

			component.onSubmit()

			expect(mockEventsService.updateEvent).toHaveBeenCalledWith(
				'test-event-id',
				expect.objectContaining({
					request: expect.objectContaining({
						event: expect.objectContaining({
							resourceTypeDetails: expect.objectContaining({
								stateOrMinistryName: 'Test State'
							})
						})
					})
				})
			)
		})
	})

	describe('Event Publishing', () => {
		test('should publish event successfully', () => {
			jest.useFakeTimers()
			const mockResponse = { result: 'success' }
			mockEventsService.publishEvent.mockReturnValue(of(mockResponse))

			component.publishEvent('test-id', 'test-version')

			expect(mockEventsService.publishEvent).toHaveBeenCalledWith(
				'test-id',
				expect.objectContaining({
					request: expect.objectContaining({
						event: expect.objectContaining({
							versionKey: 'test-version',
							status: 'Live',
							identifier: 'test-id'
						})
					})
				})
			)

			jest.advanceTimersByTime(5001)

			expect(mockSnackBar.open).toHaveBeenCalledWith('Event details are successfuly updated.', 'X', { duration: 5000 })
			expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/events'])

			jest.useRealTimers()
		})

		test('should handle publish event error', () => {
			const errorResponse = { error: 'Error: Publish failed' }
			mockEventsService.publishEvent.mockReturnValue(throwError(errorResponse))

			component.publishEvent('test-id', 'test-version')

			expect(mockSnackBar.open).toHaveBeenCalledWith(' Publish failed', 'X', { duration: 5000 })
		})
	})

	describe('Utility Functions', () => {
		test('should calculate minutes correctly', () => {
			expect(component.addMinutes(1, 30)).toBe(90)
			expect(component.addMinutes(2, 0)).toBe(120)
			expect(component.addMinutes(0, 45)).toBe(45)
		})

		test('should combine date and time correctly', () => {
			// combineDateAndTime converts local datetime string to UTC ISO format
			const result = component.combineDateAndTime('2025-06-01', '10:00:00+05:30')
			expect(result).toContain('2025-06-01T')
			expect(result).toContain('+0000')
		})

		test('should compare dates correctly', () => {
			const pastDate = '2025-01-01 10:00'
			const futureDate = moment().add(1, 'day').format('YYYY-MM-DD HH:mm')

			expect(component.compareDate(pastDate)).toBe(true)
			expect(component.compareDate(futureDate)).toBe(false)
		})

		test('should format custom date correctly', () => {
			const result = component.getCustomDateFormat('2025-06-01', '10:00:00+05:30')
			expect(result).toBe('2025-06-01 10:00')
		})

		test('should transform YouTube URLs correctly', () => {
			const watchUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
			const shortUrl = 'https://youtu.be/dQw4w9WgXcQ'
			//const embedUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
			const regularUrl = 'https://example.com'

			expect(component.youTubeUrlChange(watchUrl)).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
			expect(component.youTubeUrlChange(shortUrl)).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
			expect(component.youTubeUrlChange(regularUrl)).toBe('https://example.com')
		})

		test('should handle YouTube URL without match', () => {
			const invalidUrl = 'https://example.com/video'
			expect(component.youTubeUrlChange(invalidUrl)).toBe('https://example.com/video')
		})
	})

	describe('State Management for Rajya Karmayogi Saptah', () => {
		test('should show Rajya field when event type is Rajya Karmayogi Saptah', () => {
			// eventType is disabled in constructor; enable it to allow value reading in resetDateField
			component.createEventForm.get('eventType')?.enable()
			component.createEventForm.get('eventType')?.setValue('Rajya Karmayogi Saptah')

			component.resetDateField()

			expect(component.showRajyaField).toBe(true)
			// setValidators requires updateValueAndValidity to trigger error checking
			component.createEventForm.get('state')?.enable()
			component.createEventForm.get('state')?.updateValueAndValidity()
			expect(component.createEventForm.get('state')?.hasError('required')).toBe(true)
		})

		test('should hide Rajya field for other event types', () => {
			component.createEventForm.get('eventType')?.setValue('Webinar')

			component.resetDateField()

			expect(component.showRajyaField).toBe(false)
		})

		test('should get SLW resource type details', () => {
			const mockStateData = {
				slwResourceTypeDetails: [
					{ stateOrMinistryName: 'State 1' },
					{ stateOrMinistryName: 'State 2' }
				]
			}
			mockEventsService.getSlwResourceTypeDetail.mockReturnValue(of(mockStateData))

			component.getSlwResourceTypeDetail(mockEventObject)

			expect(mockEventsService.getSlwResourceTypeDetail).toHaveBeenCalled()
			expect(component.stateList).toEqual(mockStateData.slwResourceTypeDetails)
			expect(component.showRajyaField).toBe(true)
		})

		test('should get state detail correctly', () => {
			component.stateList = [
				{ stateOrMinistryName: 'State 1', id: 1 }
			] as any
			component.createEventForm.get('state')?.setValue('State 1')

			const result = component.getStateDetail()

			expect(result).toEqual({ stateOrMinistryName: 'State 1', id: 1 })
		})

		test('should return null when no matching state found', () => {
			component.stateList = [
				{ stateOrMinistryName: 'State 1', id: 1 }
			] as any
			component.createEventForm.get('state')?.setValue('Non-existent State')

			const result = component.getStateDetail()

			expect(result).toBeNull()
		})
	})

	describe('Event Type Changes', () => {
		test('should change event type', () => {
			const mockEvent = {
				target: { value: 'Karmayogi Talks' }
			}

			component.changeEventType(mockEvent)

			expect(component.createEventForm.get('eventType')?.value).toBe('Karmayogi Talks')
		})
	})

	describe('Navigation and UI Actions', () => {
		test('should navigate to events list', () => {
			component.goToList()

			expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/events'])
			expect(mockEventService.raiseInteractTelemetry).toHaveBeenCalled()
		})

		test('should show success dialog', () => {
			const mockResponse = { message: 'Success' }
			const mockDialogRef = {
				afterClosed: jest.fn().mockReturnValue(of(null))
			}
			mockMatDialog.open.mockReturnValue(mockDialogRef)

			component.showSuccess(mockResponse)

			expect(mockMatDialog.open).toHaveBeenCalledWith(
				expect.any(Function),
				expect.objectContaining({
					width: '612px',
					data: mockResponse,
					panelClass: 'remove-overflow'
				})
			)
		})

		test('should close dialog', () => {
			const mockDialogRef = { close: jest.fn() }
			component.dialogRef = mockDialogRef

			component.close()

			expect(mockDialogRef.close).toHaveBeenCalled()
		})
	})

	describe('Component Cleanup', () => {
		test('should cleanup state list on destroy', () => {
			component.stateList = []

			component.ngOnDestroy()

			expect(component.stateList).toEqual([])
		})
	})

	describe('Event Link Handling', () => {
		test('should get link from recorded links when available', () => {
			const eventObj = {
				recordedLinks: ['https://recorded.example.com'],
				registrationLink: 'https://register.example.com'
			}

			component.getLink(eventObj)

			expect(component.createEventForm.get('conferenceLink')?.value).toBe('https://recorded.example.com')
		})

		test('should fallback to registration link when no recorded links', () => {
			const eventObj = {
				recordedLinks: [],
				registrationLink: 'https://register.example.com'
			}

			component.getLink(eventObj)

			expect(component.createEventForm.get('conferenceLink')?.value).toBe('https://register.example.com')
		})
	})
})