import { ParticipantsComponent } from './participants.component'
import { EventsService } from '../services/events.service'
import { HttpClient } from '@angular/common/http'
import { ProfileV2UtillService } from '../services/home-utill.service'
import { MatDialogRef } from '@angular/material/dialog'
import { UntypedFormControl } from '@angular/forms'
import { SelectionModel } from '@angular/cdk/collections'
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table'
import { of } from 'rxjs'
import * as _ from 'lodash'

// Mock the lodash import
jest.mock('lodash', () => ({
    get: jest.fn()
}))

describe('ParticipantsComponent', () => {
    let component: ParticipantsComponent
    let mockEventService: jest.Mocked<EventsService>
    let mockHttpClient: jest.Mocked<HttpClient>
    let mockProfileUtilService: jest.Mocked<ProfileV2UtillService>
    let mockDialogRef: jest.Mocked<MatDialogRef<ParticipantsComponent>>
    let mockData: any

    beforeEach(() => {
        // Create mocks
        mockEventService = {
            searchUser: jest.fn()
        } as any

        mockHttpClient = {} as any

        mockProfileUtilService = {
            emailTransform: jest.fn()
        } as any

        mockDialogRef = {
            close: jest.fn()
        } as any

        mockData = { someData: 'test' }

        // Create component instance
        component = new ParticipantsComponent(
            mockEventService,
            mockHttpClient,
            mockProfileUtilService,
            mockDialogRef,
            mockData
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Component Initialization', () => {
        it('should create component with initial values', () => {
            expect(component).toBeDefined()
            expect(component.participants).toEqual([])
            expect(component.displayedColumns).toEqual(['select', 'fullname', 'email', 'mdoName'])
            expect(component.selection).toBeInstanceOf(SelectionModel)
            expect(component.searchUserCtrl).toBeInstanceOf(UntypedFormControl)
            expect(component.isLoading).toBe(false)
            expect(component.data).toBe(mockData)
        })
    })

    describe('isAllSelected', () => {
        it('should return true when all rows are selected', () => {
            const mockData = [{ id: 1 }, { id: 2 }]
            component.dataSource = new MatTableDataSource(mockData)
            // component.selection.select(mockData[0], mockData[1])

            const result = component.isAllSelected()

            expect(result).toBe(true)
        })

        it('should return false when not all rows are selected', () => {
            const mockData = [{ id: 1 }, { id: 2 }]
            component.dataSource = new MatTableDataSource(mockData)
            // component.selection.select(mockData[0])

            const result = component.isAllSelected()

            expect(result).toBe(false)
        })

        it('should return true when no rows exist', () => {
            component.dataSource = new MatTableDataSource([])

            const result = component.isAllSelected()

            expect(result).toBe(true)
        })
    })

    describe('masterToggle', () => {
        it('should clear selection when all items are selected', () => {
            const mockData = [{ id: 1 }, { id: 2 }]
            component.dataSource = new MatTableDataSource(mockData)
            //component.selection.select(mockData[0], mockData[1])
            jest.spyOn(component, 'isAllSelected').mockReturnValue(true)
            jest.spyOn(component.selection, 'clear')

            component.masterToggle()

            expect(component.selection.clear).toHaveBeenCalled()
        })

        it('should select all items when not all are selected', () => {
            const mockData = [{ id: 1 }, { id: 2 }]
            component.dataSource = new MatTableDataSource(mockData)
            jest.spyOn(component, 'isAllSelected').mockReturnValue(false)
            jest.spyOn(component.selection, 'select')

            component.masterToggle()

            expect(component.selection.select).toHaveBeenCalledWith(mockData[0])
            expect(component.selection.select).toHaveBeenCalledWith(mockData[1])
        })
    })

    describe('isSomeSelected', () => {
        it('should return true when some items are selected', () => {
            // const mockData = [{ id: 1 }, { id: 2 }]
            //component.selection.select(mockData[0])

            const result = component.isSomeSelected()

            expect(result).toBe(true)
        })

        it('should return false when no items are selected', () => {
            const result = component.isSomeSelected()

            expect(result).toBe(false)
        })
    })

    describe('checkboxLabel', () => {
        it('should return "deselect all" when all items are selected and no row provided', () => {
            jest.spyOn(component, 'isAllSelected').mockReturnValue(true)

            const result = component.checkboxLabel()

            expect(result).toBe('deselect all')
        })

        it('should return "select all" when not all items are selected and no row provided', () => {
            jest.spyOn(component, 'isAllSelected').mockReturnValue(false)

            const result = component.checkboxLabel()

            expect(result).toBe('select all')
        })

        it('should return "deselect row" when row is selected', () => {
            const mockRow = { firstname: 'John', email: 123 }
            jest.spyOn(component.selection, 'isSelected').mockReturnValue(true)

            const result = component.checkboxLabel(mockRow)

            expect(result).toBe('deselect row')
        })

        it('should return "select row" when row is not selected', () => {
            const mockRow = { firstname: 'John', email: 123 }
            jest.spyOn(component.selection, 'isSelected').mockReturnValue(false)

            const result = component.checkboxLabel(mockRow)

            expect(result).toBe('select row')
        })
    })

    describe('ngOnInit', () => {
        it('should setup search subscription and process search results', (done) => {
            const mockSearchResponse = {
                result: {
                    response: {
                        content: [
                            {
                                firstName: 'John',
                                lastName: 'Doe',
                                userId: 'user1',
                                rootOrgName: 'Organization1',
                                profileDetails: {
                                    personalDetails: {
                                        primaryEmail: 'john@example.com'
                                    }
                                }
                            },
                            {
                                firstName: 'Jane',
                                lastName: 'Smith',
                                userId: 'user2',
                                rootOrgName: 'Organization2',
                                profileDetails: {
                                    personalDetails: {
                                        primaryEmail: 'jane@example.com'
                                    }
                                }
                            }
                        ]
                    }
                }
            }

            const mockTransformedEmail1 = 'john@example.com'
            const mockTransformedEmail2 = 'jane@example.com'

            mockEventService.searchUser.mockReturnValue(of(mockSearchResponse))
            mockProfileUtilService.emailTransform
                .mockReturnValueOnce(mockTransformedEmail1)
                .mockReturnValueOnce(mockTransformedEmail2);

            (_.get as jest.Mock)
                .mockReturnValueOnce('john@example.com')
                .mockReturnValueOnce('jane@example.com')

            component.ngOnInit()

            // Trigger the search
            component.searchUserCtrl.setValue('test search')

            // Wait for debounce and processing
            setTimeout(() => {
                expect(mockEventService.searchUser).toHaveBeenCalledWith('test search')
                expect(component.dataSource).toBeInstanceOf(MatTableDataSource)
                expect(component.participants).toHaveLength(2)

                expect(component.participants[0]).toEqual({
                    email: mockTransformedEmail1,
                    firstname: 'John',
                    id: 'user1',
                    mdoName: 'Organization1'
                })

                expect(component.participants[1]).toEqual({
                    email: mockTransformedEmail2,
                    firstname: 'Jane',
                    id: 'user2',
                    mdoName: 'Organization2'
                })

                done()
            }, 300)
        })

        it('should handle search results with undefined email', (done) => {
            const mockSearchResponse = {
                result: {
                    response: {
                        content: [
                            {
                                firstName: 'John',
                                userId: 'user1',
                                rootOrgName: 'Organization1',
                                profileDetails: {
                                    personalDetails: {
                                        primaryEmail: 'john@example.com'
                                    }
                                }
                            }
                        ]
                    }
                }
            }

            mockEventService.searchUser.mockReturnValue(of(mockSearchResponse))
            mockProfileUtilService.emailTransform.mockReturnValue(undefined);
            (_.get as jest.Mock).mockReturnValue('john@example.com')

            component.ngOnInit()
            component.searchUserCtrl.setValue('test search')

            setTimeout(() => {
                expect(component.participants).toHaveLength(0)
                done()
            }, 300)
        })

        it('should handle empty search results', (done) => {
            const mockSearchResponse = {
                result: {
                    response: {
                        content: []
                    }
                }
            }

            mockEventService.searchUser.mockReturnValue(of(mockSearchResponse))

            component.ngOnInit()
            component.searchUserCtrl.setValue('test search')

            setTimeout(() => {
                expect(component.participants).toHaveLength(0)
                done()
            }, 300)
        })

        it('should process search results with valid email', (done) => {
            const mockSearchResponse = {
                result: {
                    response: {
                        content: {
                            '0': {
                                firstName: 'John',
                                userId: 'user1',
                                rootOrgName: 'Organization1',
                                profileDetails: {
                                    personalDetails: {
                                        primaryEmail: 'john@example.com'
                                    }
                                }
                            }
                        }
                    }
                }
            }

            const mockTransformedEmail = 'john@example.com'

            mockEventService.searchUser.mockReturnValue(of(mockSearchResponse))
            mockProfileUtilService.emailTransform.mockReturnValue(mockTransformedEmail);
            (_.get as jest.Mock).mockReturnValue('john@example.com')

            component.ngOnInit()
            component.searchUserCtrl.setValue('test search')

            setTimeout(() => {
                expect(component.participants).toHaveLength(1)
                expect(component.participants[0]).toEqual({
                    email: mockTransformedEmail,
                    firstname: 'John',
                    id: 'user1',
                    mdoName: 'Organization1'
                })
                done()
            }, 300)
        })
    })

    describe('confirm', () => {
        it('should close dialog with selected data', () => {
            const mockSelectedData = [
                { firstname: 'John', email: 123 },
                { firstname: 'Jane', email: 456 }
            ]
            component.selection.select(mockSelectedData[0], mockSelectedData[1])

            component.confirm()

            expect(mockDialogRef.close).toHaveBeenCalledWith({
                data: mockSelectedData
            })
        })

        it('should close dialog with empty array when nothing selected', () => {
            component.confirm()

            expect(mockDialogRef.close).toHaveBeenCalledWith({
                data: []
            })
        })
    })

    describe('Component Properties', () => {
        it('should have correct initial property values', () => {
            expect(component.participants).toEqual([])
            expect(component.displayedColumns).toEqual(['select', 'fullname', 'email', 'mdoName'])
            expect(component.isLoading).toBe(false)
            expect(component.errorMsg).toBeUndefined()
            expect(component.filteredUsers).toBeUndefined()
        })

        it('should have selection model configured for multiple selection', () => {
            expect(component.selection.isMultipleSelection()).toBe(true)
            expect(component.selection.selected).toEqual([])
        })

        it('should have searchUserCtrl as UntypedFormControl', () => {
            expect(component.searchUserCtrl).toBeInstanceOf(UntypedFormControl)
            expect(component.searchUserCtrl.value).toBeNull()
        })
    })
})