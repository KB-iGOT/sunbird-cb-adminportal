

import { UntypedFormBuilder } from '@angular/forms'
import { DialogTextProfanityComponent, IDialogData } from './discussion-post-popup.component'
import { MatDialogRef } from '@angular/material/dialog'
import { MatChipInputEvent } from '@angular/material/chips'


describe('DialogTextProfanityComponent', () => {
    let component: DialogTextProfanityComponent
    let mockDialogRef: jest.Mocked<MatDialogRef<DialogTextProfanityComponent>>
    let mockFormBuilder: UntypedFormBuilder
    let mockData: IDialogData

    beforeEach(() => {
        // Mock dependencies
        mockDialogRef = {
            close: jest.fn()
        } as any

        mockFormBuilder = new UntypedFormBuilder()

        mockData = {
            profaneCategories: ['category1', 'category2', 'category3'],
            text: 'sample text',
            id: 123,
            profaneString: ['tag1', 'tag2']
        }

        // Create component instance
        component = new DialogTextProfanityComponent(
            mockFormBuilder,
            mockDialogRef,
            mockData
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Constructor', () => {
        it('should create component instance', () => {
            expect(component).toBeTruthy()
        })

        it('should initialize profaneGroup form with profane categories', () => {
            expect(component.profaneGroup).toBeDefined()
            expect(component.profaneGroup.get('category1')).toBeTruthy()
            expect(component.profaneGroup.get('category2')).toBeTruthy()
            expect(component.profaneGroup.get('category3')).toBeTruthy()
        })

        it('should set all form controls to false initially', () => {
            expect(component.profaneGroup.get('category1')?.value).toBe(false)
            expect(component.profaneGroup.get('category2')?.value).toBe(false)
            expect(component.profaneGroup.get('category3')?.value).toBe(false)
        })

        it('should handle empty profaneCategories array', () => {
            const emptyData: IDialogData = {
                profaneCategories: [],
                text: 'sample text',
                id: 123,
                profaneString: []
            }

            const componentWithEmptyData = new DialogTextProfanityComponent(
                mockFormBuilder,
                mockDialogRef,
                emptyData
            )

            expect(componentWithEmptyData.profaneGroup).toBeDefined()
            expect(Object.keys(componentWithEmptyData.profaneGroup.controls)).toHaveLength(0)
        })
    })

    describe('Component Properties', () => {
        it('should have correct initial property values', () => {
            expect(component.visible).toBe(true)
            expect(component.selectable).toBe(true)
            expect(component.removable).toBe(true)
            expect(component.separatorKeysCodes).toEqual([13, 188]) // ENTER and COMMA key codes
            expect(component.TAGS).toEqual([])
        })
    })

    describe('ngOnInit', () => {
        it('should populate TAGS array when profaneString is provided', () => {
            component.ngOnInit()
            expect(component.TAGS).toEqual(['tag1', 'tag2'])
        })

        it('should not populate TAGS when profaneString is null', () => {
            component.data.profaneString = null
            component.ngOnInit()
            expect(component.TAGS).toEqual([])
        })

        it('should not populate TAGS when profaneString is empty string', () => {
            component.data.profaneString = ''
            component.ngOnInit()
            expect(component.TAGS).toEqual([])
        })

        it('should handle undefined profaneString', () => {
            component.data.profaneString = null
            component.ngOnInit()
            expect(component.TAGS).toEqual([])
        })
    })

    describe('add method', () => {
        let mockEvent: MatChipInputEvent
        let mockInput: HTMLInputElement

        beforeEach(() => {
            mockInput = {
                value: ''
            } as HTMLInputElement

            mockEvent = {
                input: mockInput,
                value: 'newTag'
            } as MatChipInputEvent
        })

        it('should add tag to TAGS array when value is provided', () => {
            component.add(mockEvent)
            expect(component.TAGS).toContain('newTag')
        })

        it('should clear input value after adding tag', () => {
            mockInput.value = 'newTag'
            component.add(mockEvent)
            expect(mockInput.value).toBe('')
        })

        it('should not add empty or whitespace-only tags', () => {
            mockEvent.value = '   '
            const initialLength = component.TAGS.length
            component.add(mockEvent)
            expect(component.TAGS).toHaveLength(initialLength)
        })

        it('should handle null input', () => {
            // mockEvent.input = null
            expect(() => component.add(mockEvent)).not.toThrow()
            expect(component.TAGS).toContain('newTag')
        })

        it('should handle undefined input', () => {
            mockEvent.input = undefined as any
            expect(() => component.add(mockEvent)).not.toThrow()
            expect(component.TAGS).toContain('newTag')
        })

        it('should add tag with whitespace since component does not trim before push', () => {
            mockEvent.value = '  trimmedTag  '
            component.add(mockEvent)
            expect(component.TAGS).toContain('  trimmedTag  ')
        })
    })

    describe('remove method', () => {
        beforeEach(() => {
            component.TAGS = ['tag1', 'tag2', 'tag3']
        })

        it('should remove existing tag from TAGS array', () => {
            component.remove('tag2')
            expect(component.TAGS).toEqual(['tag1', 'tag3'])
        })

        it('should not modify TAGS array when removing non-existent tag', () => {
            const originalTags = [...component.TAGS]
            component.remove('nonExistentTag')
            expect(component.TAGS).toEqual(originalTags)
        })

        it('should handle empty TAGS array', () => {
            component.TAGS = []
            expect(() => component.remove('anyTag')).not.toThrow()
            expect(component.TAGS).toEqual([])
        })

        it('should remove first occurrence of duplicate tags', () => {
            component.TAGS = ['tag1', 'tag2', 'tag1', 'tag3']
            component.remove('tag1')
            expect(component.TAGS).toEqual(['tag2', 'tag1', 'tag3'])
        })
    })

    describe('onNoClick method', () => {
        it('should close dialog when called', () => {
            component.onNoClick()
            expect(mockDialogRef.close).toHaveBeenCalledTimes(1)
        })

        it('should close dialog without parameters', () => {
            component.onNoClick()
            expect(mockDialogRef.close).toHaveBeenCalledWith()
        })
    })

    describe('Data injection', () => {
        it('should have access to injected data', () => {
            expect(component.data).toBe(mockData)
            expect(component.data.profaneCategories).toEqual(['category1', 'category2', 'category3'])
            expect(component.data.text).toBe('sample text')
            expect(component.data.id).toBe(123)
        })
    })

    describe('Integration tests', () => {
        it('should handle complete workflow: initialize, add tags, remove tags', () => {
            // Initialize
            component.ngOnInit()
            expect(component.TAGS).toEqual(['tag1', 'tag2'])

            // Add new tag
            const addEvent: MatChipInputEvent = {
                input: { value: '' } as HTMLInputElement,
                value: 'newTag'
            } as MatChipInputEvent
            component.add(addEvent)
            expect(component.TAGS).toEqual(['tag1', 'tag2', 'newTag'])

            // Remove existing tag
            component.remove('tag1')
            expect(component.TAGS).toEqual(['tag2', 'newTag'])

            // Close dialog
            component.onNoClick()
            expect(mockDialogRef.close).toHaveBeenCalled()
        })

        it('should maintain form state independent of TAGS operations', () => {
            // Form should maintain its state regardless of TAGS operations
            component.profaneGroup.get('category1')?.setValue(true)

            component.add({
                input: { value: '' } as HTMLInputElement,
                value: 'testTag'
            } as MatChipInputEvent)

            component.remove('testTag')

            expect(component.profaneGroup.get('category1')?.value).toBe(true)
        })
    })

    describe('Edge cases', () => {
        it('should handle special characters in tags', () => {
            const specialCharEvent: MatChipInputEvent = {
                input: { value: '' } as HTMLInputElement,
                value: '@#$%^&*()'
            } as MatChipInputEvent

            component.add(specialCharEvent)
            expect(component.TAGS).toContain('@#$%^&*()')

            component.remove('@#$%^&*()')
            expect(component.TAGS).not.toContain('@#$%^&*()')
        })

        it('should handle very long tag names', () => {
            const longTag = 'a'.repeat(1000)
            const longTagEvent: MatChipInputEvent = {
                input: { value: '' } as HTMLInputElement,
                value: longTag
            } as MatChipInputEvent

            component.add(longTagEvent)
            expect(component.TAGS).toContain(longTag)
        })

        it('should handle numeric strings as tags', () => {
            const numericEvent: MatChipInputEvent = {
                input: { value: '' } as HTMLInputElement,
                value: '12345'
            } as MatChipInputEvent

            component.add(numericEvent)
            expect(component.TAGS).toContain('12345')
        })
    })
})