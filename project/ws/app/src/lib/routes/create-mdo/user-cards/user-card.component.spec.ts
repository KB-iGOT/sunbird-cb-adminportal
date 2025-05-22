import { UserCardComponent } from './user-card.component'
import { FormGroup, UntypedFormGroup } from '@angular/forms'
import { of } from 'rxjs'

// Mock dependencies
const mockUsersService = {
    getUserById: jest.fn(),
    getMasterNationlity: jest.fn(),
    addUserToDepartmentMentor: jest.fn(),
    mentorList$: { next: jest.fn() }
}

const mockRolesService = {
    getAllRoles: jest.fn()
}

const mockMatDialog = {
    open: jest.fn()
}

const mockActivatedRoute = {
    snapshot: {
        parent: {
            data: {
                configService: {
                    userRoles: new Set(['spv_admin'])
                }
            }
        }
    }
}

const mockMatSnackBar = {
    open: jest.fn()
}

const mockEventService = {
    raiseInteractTelemetry: jest.fn()
}

const mockChangeDetectorRef = {
    detectChanges: jest.fn()
}

describe('UserCardComponent', () => {
    let component: UserCardComponent

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks()

        // Initialize component with mocked dependencies
        component = new UserCardComponent(
            mockUsersService as any,
            mockRolesService as any,
            mockMatDialog as any,
            mockActivatedRoute as any,
            mockMatSnackBar as any,
            mockEventService as any,
            mockChangeDetectorRef as any
        )
    })

    describe('Component Initialization', () => {
        it('should create component with default values', () => {
            expect(component).toBeDefined()
            expect(component.startIndex).toBe(0)
            expect(component.lastIndex).toBe(20)
            expect(component.pageSize).toBe(20)
            expect(component.forMentor).toBe(false)
            expect(component.isSPVAdmin).toBe(true)
        })

        it('should initialize forms with proper structure', () => {
            expect(component.updateUserDataForm).toBeInstanceOf(FormGroup)
            expect(component.approveUserDataForm).toBeInstanceOf(UntypedFormGroup)

            // Check if required form controls exist
            expect(component.updateUserDataForm.get('designation')).toBeDefined()
            expect(component.updateUserDataForm.get('group')).toBeDefined()
            expect(component.updateUserDataForm.get('primaryEmail')).toBeDefined()
            expect(component.updateUserDataForm.get('mobile')).toBeDefined()
            expect(component.updateUserDataForm.get('roles')).toBeDefined()
        })

        it('should initialize arrays and objects', () => {
            expect(component.rolesList).toEqual([])
            expect(component.rolesObject).toEqual([])
            expect(component.uniqueRoles).toEqual([])
            expect(component.userRoles).toBeInstanceOf(Set)
            expect(component.selectedtags).toEqual([])
            expect(component.genderList).toEqual(['Male', 'Female', 'Others'])
            expect(component.categoryList).toEqual(['General', 'OBC', 'SC', 'ST'])
        })
    })

    describe('ngOnInit', () => {
        it('should call init method', async () => {
            const initSpy = jest.spyOn(component, 'init').mockResolvedValue()

            await component.ngOnInit()

            expect(initSpy).toHaveBeenCalled()
        })
    })

    describe('ngOnChanges', () => {
        it('should sort usersData by firstName when usersData exists', () => {
            const mockUsersData = [
                { firstName: 'John', profileDetails: { personalDetails: { firstname: 'John' } } },
                { firstName: 'Alice', profileDetails: { personalDetails: { firstname: 'Alice' } } },
                { firstName: 'Bob', profileDetails: { personalDetails: { firstname: 'Bob' } } }
            ]

            component.usersData = mockUsersData
            component.ngOnChanges()

            expect(component.usersData[0].firstName).toBe('Alice')
            expect(component.usersData[1].firstName).toBe('Bob')
            expect(component.usersData[2].firstName).toBe('John')
        })

        it('should handle users without profileDetails', () => {
            const mockUsersData = [
                { firstName: 'John' },
                { firstName: 'Alice' }
            ]

            component.usersData = mockUsersData
            component.ngOnChanges()

            expect(component.usersData[0].firstName).toBe('Alice')
            expect(component.usersData[1].firstName).toBe('John')
        })
    })

    describe('enableUpdateButton', () => {
        it('should return true when no needApprovalList', () => {
            const appData: any = {}
            const result = component.enableUpdateButton(appData)
            expect(result).toBe(true)
        })

        it('should return false when Group field is invalid', () => {
            component.approveUserDataForm.controls['approveGroup'].setErrors({ required: true })
            const appData: any = {
                needApprovalList: [{ label: 'Group' }]
            }

            const result = component.enableUpdateButton(appData)
            expect(result).toBe(false)
        })

        it('should return false when Designation field is invalid', () => {
            component.approveUserDataForm.controls['approveDesignation'].setErrors({ required: true })
            const appData: any = {
                needApprovalList: [{ label: 'Designation' }]
            }

            const result = component.enableUpdateButton(appData)
            expect(result).toBe(false)
        })

        it('should return true when all required fields are valid', () => {
            const appData: any = {
                needApprovalList: [
                    { label: 'Group' },
                    { label: 'Designation' }
                ]
            }

            const result = component.enableUpdateButton(appData)
            expect(result).toBe(true)
        })
    })

    describe('loadRoles', () => {
        it('should load roles and set orgTypeList', async () => {
            const mockRoleData = {
                result: {
                    response: {
                        value: JSON.stringify({
                            orgTypeList: [
                                { name: 'MDO', roles: ['ADMIN', 'USER'] }
                            ]
                        })
                    }
                }
            }

            mockRolesService.getAllRoles.mockReturnValue(of(mockRoleData))

            await component.loadRoles()

            expect(mockRolesService.getAllRoles).toHaveBeenCalled()
            expect(component.orgTypeList).toEqual([{ name: 'MDO', roles: ['ADMIN', 'USER'] }])
        })
    })

    describe('getUserMappedData', () => {
        it('should process approval data and fetch user details', async () => {
            const mockUser = {
                profileDetails: {
                    profileStatus: 'ACTIVE',
                    professionalDetails: [{ designation: 'Manager', group: 'IT' }]
                }
            }

            const approvalData: any[] = [
                {
                    userWorkflow: {
                        userInfo: { wid: 'user123' }
                    },
                    needApprovalList: [{ feildName: 'group' }]
                }
            ]

            mockUsersService.getUserById.mockReturnValue(of(mockUser))
            component.currentFilter = 'transfers'

            await component.getUserMappedData(approvalData)

            expect(mockUsersService.getUserById).toHaveBeenCalledWith('user123')
        })
    })

    describe('getFieldsMappedData', () => {
        it('should process workflow info and create needApprovalList', async () => {
            const approvalData: any[] = [
                {
                    userWorkflow: {
                        wfInfo: [
                            {
                                wfId: 'wf123',
                                updateFieldValues: JSON.stringify([
                                    {
                                        fieldKey: 'designation',
                                        toValue: { designation: 'Senior Manager' }
                                    }
                                ])
                            }
                        ]
                    }
                }
            ]

            await component.getFieldsMappedData(approvalData)

            expect(approvalData[0].needApprovalList).toBeDefined()
            expect(approvalData[0].needApprovalList.length).toBe(1)
            expect(approvalData[0].needApprovalList[0].label).toBe('Designation')
            expect(approvalData[0].needApprovalList[0].value).toBe('Senior Manager')
        })
    })

    describe('closeOtherPanels', () => {
        it('should close all panels except the open one', () => {
            const openPanel = { close: jest.fn() } as any
            const panel1 = { close: jest.fn() } as any
            const panel2 = { close: jest.fn() } as any

            component.panels = {
                forEach: (callback: any) => {
                    [openPanel, panel1, panel2].forEach(callback)
                }
            } as any

            component.closeOtherPanels(openPanel)

            expect(openPanel.close).not.toHaveBeenCalled()
            expect(panel1.close).toHaveBeenCalled()
            expect(panel2.close).toHaveBeenCalled()
        })
    })

    describe('otherDropDownChange', () => {
        it('should set designation value when field is designation and value is not Other', () => {
            const setValueSpy = jest.spyOn(component.updateUserDataForm.controls['designation'], 'setValue')

            component.otherDropDownChange('Manager', 'designation')

            expect(setValueSpy).toHaveBeenCalledWith('Manager')
        })

        it('should not set value when value is Other', () => {
            const setValueSpy = jest.spyOn(component.updateUserDataForm.controls['designation'], 'setValue')

            component.otherDropDownChange('Other', 'designation')

            expect(setValueSpy).not.toHaveBeenCalled()
        })

        it('should not set value when field is not designation', () => {
            const setValueSpy = jest.spyOn(component.updateUserDataForm.controls['designation'], 'setValue')

            component.otherDropDownChange('Manager', 'group')

            expect(setValueSpy).not.toHaveBeenCalled()
        })
    })

    describe('numericOnly', () => {
        it('should return true for numeric keys', () => {
            const event = { key: '5' }
            const result = component.numericOnly(event)
            expect(result).toBe(true)
        })

        it('should return false for non-numeric keys', () => {
            const event = { key: 'a' }
            const result = component.numericOnly(event)
            expect(result).toBe(false)
        })

        it('should return false for special characters', () => {
            const event = { key: '@' }
            const result = component.numericOnly(event)
            expect(result).toBe(false)
        })
    })

    describe('onEditUser', () => {
        it('should fetch user data and enable edit mode', () => {
            const mockUser: any = {
                userId: 'user123',
                profileDetails: { personalDetails: { firstname: 'John' } }
            }

            const mockFullUser: any = {
                ...mockUser,
                profileDetails: {
                    ...mockUser.profileDetails,
                    professionalDetails: [{ designation: 'Manager' }]
                }
            }

            const mockPanel = { open: jest.fn() }

            mockUsersService.getUserById.mockReturnValue(of(mockFullUser))
            component.usersData = [mockUser, { userId: 'user456' }]

            const setUserDetailsSpy = jest.spyOn(component, 'setUserDetails').mockImplementation()

            component.onEditUser(mockUser, mockPanel)

            expect(mockUsersService.getUserById).toHaveBeenCalledWith('user123')
            expect(mockPanel.open).toHaveBeenCalled()
            expect(setUserDetailsSpy).toHaveBeenCalledWith(mockFullUser)
        })
    })

    describe('mapRoles', () => {
        it('should map user roles when orgTypeList is available', () => {
            const mockUser: any = {
                organisations: [
                    { roles: ['ADMIN', 'USER'] }
                ]
            }

            component.orgTypeList = [
                { name: 'MDO', roles: ['ADMIN', 'USER', 'MDO_LEADER'] }
            ]

            component.mapRoles(mockUser)

            expect(component.userRoles.has('ADMIN')).toBe(true)
            expect(component.userRoles.has('USER')).toBe(true)
            expect(component.uniqueRoles.length).toBeGreaterThan(0)
        })

        it('should handle user without organisations', () => {
            const mockUser: any = { organisations: [] }
            component.orgTypeList = [{ name: 'MDO', roles: ['ADMIN'] }]

            component.mapRoles(mockUser)

            expect(component.userRoles.size).toBe(0)
        })
    })

    describe('setUserDetails', () => {
        it('should populate form with user profile data', () => {
            const mockUser: any = {
                profileDetails: {
                    additionalProperties: { externalSystemId: 'EXT123' },
                    professionalDetails: [{ designation: 'Manager', group: 'IT' }],
                    personalDetails: {
                        primaryEmail: 'test@example.com',
                        mobile: '1234567890',
                        gender: 'MALE',
                        dob: '1990-01-01',
                        domicileMedium: 'English',
                        category: 'General'
                    },
                    employmentDetails: {
                        pinCode: '123456',
                        employeeCode: 'EMP001'
                    }
                }
            }

            const mapRolesSpy = jest.spyOn(component, 'mapRoles').mockImplementation()

            component.setUserDetails(mockUser)

            expect(component.updateUserDataForm.get('ehrmsID')?.value).toBe('EXT123')
            expect(component.updateUserDataForm.get('designation')?.value).toBe('Manager')
            expect(component.updateUserDataForm.get('group')?.value).toBe('IT')
            expect(component.updateUserDataForm.get('primaryEmail')?.value).toBe('test@example.com')
            expect(component.updateUserDataForm.get('mobile')?.value).toBe('1234567890')
            expect(component.updateUserDataForm.get('gender')?.value).toBe('Male')
            expect(mapRolesSpy).toHaveBeenCalledWith(mockUser)
        })

        it('should handle missing profile sections gracefully', () => {
            const mockUser: any = { profileDetails: {} }

            const mapRolesSpy = jest.spyOn(component, 'mapRoles').mockImplementation()

            component.setUserDetails(mockUser)

            expect(mapRolesSpy).toHaveBeenCalledWith(mockUser)
        })
    })

    describe('getDateFromText', () => {
        it('should parse ISO date string', () => {
            const dateString = '2023-01-01T00:00:00Z'
            const result = component['getDateFromText'](dateString)
            expect(result).toBe('2023-01-01')
        })

        it('should parse DD-MM-YYYY format', () => {
            const dateString = '01-01-2023'
            const result = component['getDateFromText'](dateString)
            expect(result).toBeInstanceOf(Date)
        })

        it('should return empty string for invalid input', () => {
            const result = component['getDateFromText']('')
            expect(result).toBe('')
        })
    })

    describe('getUseravatarName', () => {
        it('should return firstname from profile details', () => {
            const user: any = {
                profileDetails: {
                    personalDetails: { firstname: 'John' }
                }
            }

            const result = component.getUseravatarName(user)
            expect(result).toBe('John')
        })

        it('should return firstName as fallback', () => {
            const user: any = { firstName: 'Jane' }

            const result = component.getUseravatarName(user)
            expect(result).toBe('Jane')
        })
    })

    describe('cancelSubmit', () => {
        it('should reset form and toggle edit mode', () => {
            const user: any = { enableEdit: true }
            const resetSpy = jest.spyOn(component.updateUserDataForm, 'reset')

            component.cancelSubmit(user)

            expect(resetSpy).toHaveBeenCalled()
            expect(user.enableEdit).toBe(false)
        })
    })

    describe('modifyUserRoles', () => {
        it('should add role if not present', () => {
            component.modifyUserRoles('ADMIN')
            expect(component.userRoles.has('ADMIN')).toBe(true)
        })

        it('should remove role if present', () => {
            component.userRoles.add('ADMIN')
            component.modifyUserRoles('ADMIN')
            expect(component.userRoles.has('ADMIN')).toBe(false)
        })
    })

    describe('updateTags', () => {
        it('should set selectedtags from profile data', () => {
            const profileData: any = {
                additionalProperties: { tag: ['tag1', 'tag2'] }
            }

            component.updateTags(profileData)

            expect(component.selectedtags).toEqual(['tag1', 'tag2'])
        })

        it('should set empty array when no tags', () => {
            const profileData: any = {}

            component.updateTags(profileData)

            expect(component.selectedtags).toEqual([])
        })
    })

    describe('addActivity', () => {
        it('should add tag to selectedtags', () => {
            const event: any = {
                input: { value: '' },
                value: 'newTag'
            }

            component.addActivity(event)

            expect(component.selectedtags).toContain('newTag')
            expect(component.isTagsEdited).toBe(true)
            expect(event.input.value).toBe('')
        })

        it('should not add empty tag', () => {
            const event: any = {
                input: { value: '' },
                value: '   '
            }

            const initialLength = component.selectedtags.length
            component.addActivity(event)

            expect(component.selectedtags.length).toBe(initialLength)
        })
    })

    describe('removeActivity', () => {
        it('should remove tag from selectedtags', () => {
            component.selectedtags = ['tag1', 'tag2', 'tag3']

            component.removeActivity('tag2')

            expect(component.selectedtags).toEqual(['tag1', 'tag3'])
            expect(component.isTagsEdited).toBe(true)
        })

        it('should not remove non-existent tag', () => {
            component.selectedtags = ['tag1', 'tag2']

            component.removeActivity('tag3')

            expect(component.selectedtags).toEqual(['tag1', 'tag2'])
        })
    })

    describe('onChangePage', () => {
        it('should emit pagination data', () => {
            const emitSpy = jest.spyOn(component.paginationData, 'emit')
            const pageEvent: any = { pageIndex: 2, pageSize: 10 }

            component.onChangePage(pageEvent)

            expect(component.startIndex).toBe(20)
            expect(component.lastIndex).toBe(10)
            expect(emitSpy).toHaveBeenCalledWith({ pageIndex: 20, pageSize: 10 })
        })
    })

    describe('onSearch', () => {
        it('should emit search event', () => {
            const emitSpy = jest.spyOn(component.searchByEnterKey, 'emit')
            const searchEvent: any = { target: { value: 'search term' } }

            component.onSearch(searchEvent)

            expect(emitSpy).toHaveBeenCalledWith(searchEvent)
        })
    })

    describe('getUserRoles', () => {
        it('should return true if user has MENTOR role', () => {
            const user: any = {
                roles: [
                    { role: 'USER' },
                    { role: 'MENTOR' }
                ]
            }

            const result = component.getUserRoles(user)

            expect(result).toBe(true)
        })

        it('should return false if user does not have MENTOR role', () => {
            const user: any = {
                roles: [
                    { role: 'USER' },
                    { role: 'ADMIN' }
                ]
            }

            const result = component.getUserRoles(user)

            expect(result).toBe(false)
        })

        it('should return false if user has no roles', () => {
            const user: any = { roles: [] }

            const result = component.getUserRoles(user)

            expect(result).toBe(false)
        })
    })
})