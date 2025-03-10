import { InterestComponent } from './interest.component'
import { of, throwError } from 'rxjs'
import { ElementRef } from '@angular/core'

describe('InterestComponent', () => {
    let component: InterestComponent
    let mockActivatedRoute: any
    let mockContentSvc: any
    let mockPlaylistSvc: any
    let mockConfigSvc: any
    let mockRouter: any
    let mockSnackbar: any

    const mockInterestData = {
        'Technology': ['tech1', 'tech2'],
        'Design': ['design1', 'design2'],
        'Management': ['mgmt1', 'mgmt2']
    }

    const mockContentData = [
        { identifier: 'tech1', name: 'Tech Course 1' },
        { identifier: 'tech2', name: 'Tech Course 2' }
    ]

    const mockPlaylist = {
        id: 'playlist1',
        name: 'Learn Later',
        contents: [
            { identifier: 'tech1' },
            { identifier: 'design1' }
        ]
    }

    beforeEach(() => {
        mockActivatedRoute = {
            data: of({
                pageData: {
                    data: mockInterestData
                }
            })
        }

        mockContentSvc = {
            fetchMultipleContent: jest.fn().mockReturnValue(of(mockContentData))
        }

        mockPlaylistSvc = {
            getAllPlaylists: jest.fn().mockReturnValue(of([mockPlaylist])),
            addPlaylistContent: jest.fn().mockReturnValue(of({})),
            deletePlaylistContent: jest.fn().mockReturnValue(of({})),
            upsertPlaylist: jest.fn().mockReturnValue(of({}))
        }

        mockConfigSvc = {
            pageNavBar: { backgroundColor: 'blue' }
        }

        mockRouter = {
            navigate: jest.fn()
        }

        mockSnackbar = {
            open: jest.fn()
        }

        component = new InterestComponent(
            mockActivatedRoute,
            mockContentSvc,
            mockPlaylistSvc,
            mockConfigSvc,
            mockRouter,
            mockSnackbar
        )

        // Mock ViewChild references
        component.createPlaylistSuccessMessage = { nativeElement: { value: 'Success message' } } as ElementRef
        component.createPlaylistErrorMessage = { nativeElement: { value: 'Error message' } } as ElementRef
    })

    afterEach(() => {
        if (component.playlistsSubscription) {
            component.playlistsSubscription.unsubscribe()
        }
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should initialize component and fetch playlists', () => {
            component.ngOnInit()

            expect(mockPlaylistSvc.getAllPlaylists).toHaveBeenCalled()
            expect(component.interestsData).toEqual(['Technology', 'Design', 'Management'])
            expect(component.playlistForInterest).toEqual(mockPlaylist)
            expect(component.addedInterest.size).toBe(2)
            expect(component.addedInterest.has('tech1')).toBeTruthy()
            expect(component.addedInterest.has('design1')).toBeTruthy()
        })

        it('should call selectInterest by default', () => {
            const spy = jest.spyOn(component, 'selectInterest')
            component.ngOnInit()
            expect(spy).toHaveBeenCalledWith()
        })
    })

    describe('selectInterest', () => {
        it('should select interest and fetch content', () => {
            component.interestsData = ['Technology', 'Design', 'Management']
            component.interestRES = mockInterestData

            component.selectInterest(0)

            expect(component.selectedContent).toBe(0)
            expect(component.fetchStatus).toBe('done')
            expect(component.selectedInterest).toBe('Technology')
            expect(mockContentSvc.fetchMultipleContent).toHaveBeenCalledWith(['tech1', 'tech2'])
            expect(component.interestContent).toEqual(mockContentData)
        })

        it('should not fetch if status is already fetching', () => {
            component.fetchStatus = 'fetching'
            component.selectInterest(1)
            expect(mockContentSvc.fetchMultipleContent).not.toHaveBeenCalled()
        })

        it('should handle error while fetching content', () => {
            component.interestsData = ['Technology', 'Design', 'Management']
            component.interestRES = mockInterestData
            mockContentSvc.fetchMultipleContent.mockReturnValue(throwError('Error'))

            component.selectInterest(0)

            expect(component.fetchStatus).toBe('error')
        })
    })

    describe('interestAdd', () => {
        it('should add interest when checked is true', () => {
            component.interestAdd('tech3', true)
            expect(component.addedInterest.has('tech3')).toBeTruthy()
        })

        it('should remove interest when checked is false', () => {
            component.addedInterest.add('tech3')
            component.interestAdd('tech3', false)
            expect(component.addedInterest.has('tech3')).toBeFalsy()
        })
    })

    describe('isInterestAdded', () => {
        it('should return true if any interest from category is added', () => {
            component.interestRES = mockInterestData
            component.addedInterest.add('tech1')

            const result = component.isInterestAdded('Technology')

            expect(result).toBeTruthy()
        })

        it('should return false if no interest from category is added', () => {
            component.interestRES = mockInterestData
            component.addedInterest.add('other1')

            const result = component.isInterestAdded('Technology')

            expect(result).toBeFalsy()
        })
    })

    describe('addInterest', () => {
        beforeEach(() => {
            component.interestRES = mockInterestData
            component.interestsData = ['Technology', 'Design', 'Management']
        })

        it('should update existing playlist when playlistForInterest exists', () => {
            // component.playlistForInterest = { ...mockPlaylist }
            component.addedInterest.add('tech1')
            component.addedInterest.add('tech2')
            component.alreadyAddedInterest.add('tech1')
            component.alreadyAddedInterest.add('design1')

            component.addInterest()

            // Should remove design1 and add tech2
            expect(mockPlaylistSvc.deletePlaylistContent).toHaveBeenCalledWith(
                component.playlistForInterest,
                ['design1']
            )
            expect(mockPlaylistSvc.addPlaylistContent).toHaveBeenCalledWith(
                component.playlistForInterest,
                ['tech2']
            )
            expect(mockSnackbar.open).toHaveBeenCalledWith('Success message')
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/setup/home/done'])
        })

        it('should create new playlist when playlistForInterest is null', () => {
            component.playlistForInterest = null
            component.addedInterest.add('tech1')
            component.addedInterest.add('tech2')

            component.addInterest()

            expect(mockPlaylistSvc.upsertPlaylist).toHaveBeenCalledWith({
                playlist_title: 'Learn Later',
                content_ids: ['tech1', 'tech2'],
                visibility: 'private'
            })
            expect(mockSnackbar.open).toHaveBeenCalledWith('Success message')
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/setup/home/done'])
        })

        it('should handle error when adding to playlist', () => {
            // component.playlistForInterest = { ...mockPlaylist }
            component.addedInterest.add('tech1')
            component.addedInterest.add('tech2')
            mockPlaylistSvc.addPlaylistContent.mockReturnValue(throwError('Error'))

            component.addInterest()

            expect(mockSnackbar.open).toHaveBeenCalledWith('Error message')
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/setup/home/done'])
        })

        it('should handle error when creating playlist', () => {
            component.playlistForInterest = null
            component.addedInterest.add('tech1')
            mockPlaylistSvc.upsertPlaylist.mockReturnValue(throwError('Error'))

            component.addInterest()

            expect(mockSnackbar.open).toHaveBeenCalledWith('Error message')
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/setup/home/done'])
        })

        it('should navigate to done if no interests are added', () => {
            component.addedInterest.clear()
            component.alreadyAddedInterest.clear()

            component.addInterest()

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/setup/home/done'])
            expect(mockPlaylistSvc.addPlaylistContent).not.toHaveBeenCalled()
            expect(mockPlaylistSvc.upsertPlaylist).not.toHaveBeenCalled()
        })
    })
})