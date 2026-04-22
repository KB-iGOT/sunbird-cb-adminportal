
import { MatDialogRef } from '@angular/material/dialog'
import { ViewUsersComponent } from './view-users.component'

describe('ViewUsersComponent', () => {
    let component: ViewUsersComponent

    const dialogRef: Partial<MatDialogRef<ViewUsersComponent>> = {
        close: jest.fn(),
    }

    const data: any = {
        userArray: [
            { UserName: 'Alice', email: 'alice@example.com' },
            { UserName: 'Bob', email: 'bob@example.com' },
            { UserName: 'Charlie', email: 'charlie@example.com' },
        ],
        noOfUser: '3',
    }

    beforeEach(() => {
        component = new ViewUsersComponent(
            dialogRef as MatDialogRef<ViewUsersComponent>,
            data
        )
        jest.clearAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })

    it('should set userData from injected data', () => {
        expect(component.userData).toEqual(data)
    })

    it('should initialize userDataList as empty array before ngOnInit', () => {
        expect(component.userDataList).toEqual([])
    })

    it('should set userDataList from userData.userArray on ngOnInit', () => {
        component.ngOnInit()
        expect(component.userDataList).toEqual(data.userArray)
    })

    it('should filter userDataList on searchControl value change - case insensitive', () => {
        component.ngOnInit()
        component.searchControl.setValue('alice')
        expect(component.userDataList.length).toBe(1)
        expect(component.userDataList[0].UserName).toBe('Alice')
    })

    it('should filter userDataList with uppercase search term', () => {
        component.ngOnInit()
        component.searchControl.setValue('BOB')
        expect(component.userDataList.length).toBe(1)
        expect(component.userDataList[0].UserName).toBe('Bob')
    })

    it('should return all users when search term matches all', () => {
        component.ngOnInit()
        component.searchControl.setValue('')
        // Empty string matches all
        expect(component.userDataList.length).toBe(3)
    })

    it('should return empty list when no user matches search term', () => {
        component.ngOnInit()
        component.searchControl.setValue('xyz_not_exists')
        expect(component.userDataList.length).toBe(0)
    })

    it('should clear searchControl value on clear()', () => {
        component.ngOnInit()
        component.searchControl.setValue('test')
        component.clear()
        expect(component.searchControl.value).toBe('')
    })

    it('should call dialogRef.close on close()', () => {
        component.close()
        expect(dialogRef.close).toHaveBeenCalled()
    })
})

