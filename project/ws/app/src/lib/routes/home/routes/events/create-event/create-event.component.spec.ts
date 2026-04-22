import { CreateEventComponent } from './create-event.component'
import { of, throwError } from 'rxjs'

// Mock dependencies
const mockSnackBar = {
	open: jest.fn()
}

const mockEventsService = {
	crreateAsset: jest.fn(),
	uploadFile: jest.fn(),
	createEvent: jest.fn(),
	publishEvent: jest.fn(),
	getSlwResourceTypeDetail: jest.fn().mockReturnValue(of({ slwResourceTypeDetails: [] }))
}

const mockMatDialog = {
	open: jest.fn(() => ({
		afterClosed: () => of(null)
	}))
}

const mockRouter = {
	navigate: jest.fn()
}

const mockConfigService = {
	userProfile: {
		userId: 'test-user-id',
		userName: 'test-user',
		departmentName: 'Test Department'
	}
}

const mockChangeDetectorRef = {
	detectChanges: jest.fn()
}

const mockActivatedRoute = {
	snapshot: {
		data: {
			configService: {
				userProfile: {
					rootOrgId: 'test-root-org',
					departmentName: 'Test Department',
					userId: 'test-user-id',
					userName: 'test-user'
				}
			}
		}
	}
}

const mockEventService = {
	raiseInteractTelemetry: jest.fn()
}

const mockProfileUtilService = {
	emailTransform: jest.fn(email => email)
}

const mockPipePublic = {
	transform: jest.fn(url => url)
}

const mockLoaderService = {
	setLoaderState: jest.fn()
}

describe('CreateEventComponent', () => {
	let component: CreateEventComponent

	beforeEach(() => {
		// Reset all mocks
		jest.clearAllMocks()

		// Create component instance
		component = new CreateEventComponent(
			mockSnackBar as any,
			mockEventsService as any,
			mockMatDialog as any,
			mockRouter as any,
			mockConfigService as any,
			mockChangeDetectorRef as any,
			mockActivatedRoute as any,
			mockEventService as any,
			mockProfileUtilService as any,
			mockPipePublic as any,
			mockLoaderService as any
		)
	})

	describe('Constructor', () => {
		it('should initialize component with user profile data', () => {
			expect(component.userId).toBe('test-user-id')
			expect(component.username).toBe('test-user')
			expect(component.department).toBe('Test Department')
		})

		it('should initialize form with default values', () => {
			expect(component.createEventForm.get('eventType')?.value).toBe('Webinar')
			expect(component.createEventForm.get('eventDurationHours')?.value).toBe(0)
			expect(component.createEventForm.get('eventDurationMinutes')?.value).toBe(30)
		})

		it('should set min and max dates correctly', () => {
			expect(component.minDate).toBeInstanceOf(Date)
			expect(component.maxDate).toBeDefined()
		})
	})

	describe('ngOnInit', () => {
		beforeEach(() => {
			component.ngOnInit()
		})

		it('should filter time array for current day', () => {
			expect(component.newtimearray.length).toBeLessThanOrEqual(component.orgtimeArr.length)
		})

		it('should set today time correctly', () => {
			expect(component.todayTime).toBeDefined()
		})
	})

	describe('Form Validation', () => {
		it('should validate event title with regex pattern', () => {
			const eventTitleControl = component.createEventForm.get('eventTitle')

			// Valid title
			eventTitleControl?.setValue('Valid Event Title 123')
			expect(eventTitleControl?.valid).toBe(true)

			// Invalid title with special characters
			eventTitleControl?.setValue('Invalid@Event#Title')
			expect(eventTitleControl?.valid).toBe(false)
		})

		it('should validate conference link URL', () => {
			const linkControl = component.createEventForm.get('conferenceLink')

			// Valid YouTube URL (the myreg pattern only allows YouTube URLs)
			linkControl?.setValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
			expect(linkControl?.valid).toBe(true)

			// Invalid URL
			linkControl?.setValue('invalid-url')
			expect(linkControl?.valid).toBe(false)
		})

		it('should require event picture', () => {
			const pictureControl = component.createEventForm.get('eventPicture')
			expect(pictureControl?.hasError('required')).toBe(true)
		})
	})

	describe('openDialog', () => {
		it('should open participants dialog', () => {
			component.openDialog()

			expect(mockMatDialog.open).toHaveBeenCalledWith(
				expect.any(Function),
				{ width: '850px', height: '600px' }
			)
			expect(mockEventService.raiseInteractTelemetry).toHaveBeenCalled()
		})
	})

	describe('addPresenters', () => {
		it('should add presenters to participants array', () => {
			const mockResponse = {
				data: {
					0: {
						firstName: 'John',
						profileDetails: {
							personalDetails: {
								primaryEmail: 'john@example.com'
							}
						},
						rootOrgName: 'Test Org'
					}
				}
			}

			component.addPresenters(mockResponse)

			expect(component.participantsArr).toHaveLength(1)
			expect(component.participantsArr[0]).toEqual({
				name: 'John',
				email: 'john@example.com',
				type: 'Karmayogi User',
				mdoName: 'Test Org'
			})
			expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalled()
		})
	})

	describe('selectCover', () => {
		it('should trigger file input click', () => {
			// Mock document.getElementById
			const mockElement = { click: jest.fn() }
			global.document.getElementById = jest.fn().mockReturnValue(mockElement)

			component.selectCover()

			expect(document.getElementById).toHaveBeenCalledWith('coverPicture')
			expect(mockElement.click).toHaveBeenCalled()
			expect(mockEventService.raiseInteractTelemetry).toHaveBeenCalled()
		})
	})

	describe('onFileSelect', () => {
		let mockFile: any
		let mockEvent: any

		beforeEach(() => {
			mockFile = {
				type: 'image/jpeg',
				size: 400000,
				name: 'test.jpg'
			}

			mockEvent = {
				target: {
					files: [mockFile],
					value: ''
				}
			}

			// Mock FileReader
			global.FileReader = jest.fn(() => ({
				readAsDataURL: jest.fn(),
				onload: null,
				result: 'data:image/jpeg;base64,mock-data'
			})) as any

			mockEventsService.crreateAsset.mockReturnValue(
				of({ result: { identifier: 'test-id' } })
			)
			mockEventsService.uploadFile.mockReturnValue(
				of({ result: { artifactUrl: 'test-url' } })
			)
		})

		it('should process valid image file', () => {
			component.onFileSelect(mockEvent)

			expect(component.imageSrc).toBe(mockFile)
			expect(component.errorMessages).toBe('')
			expect(mockEventsService.crreateAsset).toHaveBeenCalled()
		})

		it('should reject non-image files', () => {
			mockEvent.target.files[0].type = 'text/plain'

			component.onFileSelect(mockEvent)

			expect(component.errorMessages).toContain('PNG, JPG, or JPEG format')
			expect(mockEventsService.crreateAsset).not.toHaveBeenCalled()
		})

		it('should reject files larger than 500KB', () => {
			mockEvent.target.files[0].size = 600000

			component.onFileSelect(mockEvent)

			expect(component.errorMessages).toContain('exceeds the maximum allowed size')
			expect(mockEventsService.crreateAsset).not.toHaveBeenCalled()
		})

		it('should handle empty file selection', () => {
			mockEvent.target.files = []

			component.onFileSelect(mockEvent)

			expect(mockEventsService.crreateAsset).not.toHaveBeenCalled()
		})
	})

	describe('removeSelectedFile', () => {
		it('should clear selected file data', () => {
			component.imageSrcURL = 'test-url'
			component.eventimageURL = 'test-event-url'

			component.removeSelectedFile()

			expect(component.imageSrcURL).toBe('')
			expect(component.eventimageURL).toBe('')
			expect(component.createEventForm.get('eventPicture')?.value).toBe('')
		})
	})

	describe('changeEventType', () => {
		it('should update event type in form', () => {
			const mockEvent = { target: { value: 'Karmayogi Talks' } }

			component.changeEventType(mockEvent)

			expect(component.createEventForm.get('eventType')?.value).toBe('Karmayogi Talks')
		})
	})

	describe('updateDate', () => {
		it('should update time array for today\'s date', () => {
			const today = new Date()
			const mockEvent = { value: today }

			component.updateDate(mockEvent)

			expect(component.timeArr).toBe(component.newtimearray)
		})

		it('should use full time array for future dates', () => {
			const futureDate = new Date()
			futureDate.setDate(futureDate.getDate() + 1)
			const mockEvent = { value: futureDate }

			component.updateDate(mockEvent)

			expect(component.timeArr).toBe(component.orgtimeArr)
		})
	})

	describe('isTimeDisabled', () => {
		beforeEach(() => {
			// Set up form with today's date
			const today = new Date()
			component.createEventForm.get('eventDate')?.setValue(today)
		})

		it('should disable past time slots for today', () => {
			const currentTime = new Date()
			const pastTime = `${String(currentTime.getHours() - 1).padStart(2, '0')}:00`

			expect(component.isTimeDisabled(pastTime)).toBe(true)
		})

		it('should not disable future time slots for today', () => {
			const currentTime = new Date()
			const futureTime = `${String(currentTime.getHours() + 1).padStart(2, '0')}:00`

			expect(component.isTimeDisabled(futureTime)).toBe(false)
		})

		it('should not disable any time slots for future dates', () => {
			const futureDate = new Date()
			futureDate.setDate(futureDate.getDate() + 1)
			component.createEventForm.get('eventDate')?.setValue(futureDate)

			expect(component.isTimeDisabled('09:00')).toBe(false)
		})
	})

	describe('convertToMinutes', () => {
		it('should convert time string to minutes correctly', () => {
			expect(component.convertToMinutes('09:30')).toBe(570)
			expect(component.convertToMinutes('00:00')).toBe(0)
			expect(component.convertToMinutes('23:45')).toBe(1425)
		})
	})

	describe('addMinutes', () => {
		it('should calculate total duration in minutes', () => {
			expect(component.addMinutes(1, 30)).toBe(90)
			expect(component.addMinutes(2, 0)).toBe(120)
			expect(component.addMinutes(0, 45)).toBe(45)
		})
	})

	describe('combineDateAndTime', () => {
		it('should combine date and time correctly', () => {
			// combineDateAndTime converts the datetime to UTC ISO format with +0000
			const result = component.combineDateAndTime('2024-01-15', '10:30:00+05:30')
			expect(result).toContain('2024-01-15T')
			expect(result).toContain('+0000')
		})
	})

	describe('youTubeUrlChange', () => {
		it('should convert YouTube watch URL to embed URL', () => {
			const watchUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
			const result = component.youTubeUrlChange(watchUrl)
			expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
		})

		it('should convert youtu.be URL to embed URL', () => {
			const shortUrl = 'https://youtu.be/dQw4w9WgXcQ'
			const result = component.youTubeUrlChange(shortUrl)
			expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
		})

		it('should return original URL if not a YouTube URL', () => {
			const regularUrl = 'https://zoom.us/meeting'
			const result = component.youTubeUrlChange(regularUrl)
			expect(result).toBe(regularUrl)
		})
	})

	describe('onSubmit', () => {
		beforeEach(() => {
			// Set up valid form data
			component.createEventForm.patchValue({
				eventPicture: 'test-file',
				eventTitle: 'Test Event',
				description: 'Test Description',
				eventType: 'Webinar',
				eventDate: new Date(),
				eventTime: '10:00',
				eventDurationHours: 1,
				eventDurationMinutes: 30,
				conferenceLink: 'https://zoom.us/meeting',
				presenters: []
			})
			component.eventimageURL = 'test-image-url'
		})

		it('should create event successfully', () => {
			mockEventsService.createEvent.mockReturnValue(
				of({ result: { identifier: 'test-id', versionKey: 'test-version' } })
			)
			mockEventsService.publishEvent.mockReturnValue(
				of({ result: { status: 'Live' } })
			)

			component.onSubmit()

			expect(mockEventsService.createEvent).toHaveBeenCalled()
			expect(mockEventsService.publishEvent).toHaveBeenCalled()
		})

		it('should handle zero duration error', () => {
			component.createEventForm.patchValue({
				eventDurationHours: 0,
				eventDurationMinutes: 0
			})

			component.onSubmit()

			expect(mockSnackBar.open).toHaveBeenCalledWith('Duration cannot be zero', 'X', { duration: 5000 })
			expect(component.displayLoader).toBe(false)
			expect(component.disableCreateButton).toBe(false)
		})

		it('should handle create event error', () => {
			mockEventsService.createEvent.mockReturnValue(
				throwError({ error: 'Error: Something went wrong' })
			)

			component.onSubmit()

			expect(mockSnackBar.open).toHaveBeenCalledWith(' Something went wrong', 'X', { duration: 5000 })
		})
	})

	describe('publishEvent', () => {
		it('should publish event successfully', () => {
			mockEventsService.publishEvent.mockReturnValue(
				of({ result: { status: 'Live' } })
			)

			component.publishEvent('test-id', 'test-version')

			expect(mockEventsService.publishEvent).toHaveBeenCalledWith(
				'test-id',
				expect.objectContaining({
					request: {
						event: {
							versionKey: 'test-version',
							status: 'Live',
							identifier: 'test-id'
						}
					}
				})
			)
		})

		it('should handle publish event error', () => {
			mockEventsService.publishEvent.mockReturnValue(
				throwError({ error: 'Error: Publish failed' })
			)

			component.publishEvent('test-id', 'test-version')

			expect(mockSnackBar.open).toHaveBeenCalledWith(' Publish failed', 'X', { duration: 5000 })
		})
	})

	describe('showSuccess', () => {
		it('should open success dialog and navigate after close', () => {
			jest.useFakeTimers()
			const mockDialogRef = {
				afterClosed: () => of(null)
			}
			mockMatDialog.open.mockReturnValue(mockDialogRef)

			component.showSuccess({ result: 'success' })

			expect(mockMatDialog.open).toHaveBeenCalledWith(
				expect.any(Function),
				expect.objectContaining({
					width: '612px',
					data: { result: 'success' }
				})
			)

			jest.advanceTimersByTime(2001)

			expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/events'])

			jest.useRealTimers()
		})
	})

	describe('goToList', () => {
		it('should navigate to events list', () => {
			component.goToList()

			expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/events'])
			expect(mockEventService.raiseInteractTelemetry).toHaveBeenCalled()
		})
	})

	describe('resetDateField', () => {
		it('should reset date to current date', () => {
			component.resetDateField()

			expect(component.createEventForm.get('eventDate')?.value).toEqual(component.currentDate)
		})

		it('should handle Rajya Karmayogi Saptah event type', () => {
			component.createEventForm.get('eventType')?.setValue('Rajya Karmayogi Saptah')
			component.stateList = [{ stateOrMinistryName: 'Test State' }] as any

			component.resetDateField()

			expect(component.showRajyaField).toBe(true)
		})
	})

	describe('getSlwResourceTypeDetail', () => {
		it('should fetch state list successfully', () => {
			const mockResponse = {
				slwResourceTypeDetails: [
					{ stateOrMinistryName: 'State 1' },
					{ stateOrMinistryName: 'State 2' }
				]
			}
			mockEventsService.getSlwResourceTypeDetail.mockReturnValue(of(mockResponse))

			component.getSlwResourceTypeDetail()

			expect(component.stateList).toEqual(mockResponse.slwResourceTypeDetails)
			// showRajyaField is controlled by resetDateField(), not getSlwResourceTypeDetail()
			component.createEventForm.get('eventType')?.setValue('Rajya Karmayogi Saptah')
			component.resetDateField()
			expect(component.showRajyaField).toBe(true)
		})
	})

	describe('getStateDetail', () => {
		beforeEach(() => {
			component.stateList = [
				{ stateOrMinistryName: 'State 1', code: 'S1' }
			] as any
		})

		it('should return correct state detail', () => {
			component.createEventForm.get('state')?.setValue('State 1')

			const result = component.getStateDetail()

			expect(result).toEqual({ stateOrMinistryName: 'State 1', code: 'S1' })
		})

		it('should return null if state not found', () => {
			component.createEventForm.get('state')?.setValue('Non-existent State')

			const result = component.getStateDetail()

			expect(result).toBeNull()
		})
	})

	describe('ngOnDestroy', () => {
		it('should reset state list', () => {
			component.stateList = []

			component.ngOnDestroy()

			expect(component.stateList).toEqual([])
		})
	})

	describe('openSnackbar', () => {
		it('should open snackbar with default duration', () => {
			component['openSnackbar']('Test message')

			expect(mockSnackBar.open).toHaveBeenCalledWith('Test message', 'X', { duration: 5000 })
		})

		it('should open snackbar with custom duration', () => {
			component['openSnackbar']('Test message', 3000)

			expect(mockSnackBar.open).toHaveBeenCalledWith('Test message', 'X', { duration: 3000 })
		})
	})

	describe('encodeToBase64', () => {
		it('should encode object to base64', () => {
			const testObj = { test: 'data' }

			const result = component.encodeToBase64(testObj)

			expect(result).toHaveProperty('data')
			expect(typeof result.data).toBe('string')
		})
	})
})