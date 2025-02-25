import { SearchComponent } from './search.component'
import { EventEmitter } from '@angular/core'
import { of } from 'rxjs'

// Mock services
class MockUsersService {
    getAllValidUsers = jest.fn();
}

class MockLoaderService {
    changeLoaderState = jest.fn();
}

class MockMatDialog {
    open = jest.fn();
}

describe('SearchComponent', () => {
    let component: SearchComponent
    let usersService: MockUsersService
    let loaderService: MockLoaderService
    let dialog: MockMatDialog

    beforeEach(() => {
        usersService = new MockUsersService()
        loaderService = new MockLoaderService()
        dialog = new MockMatDialog()

        // Create component instance
        component = new SearchComponent(dialog as any, usersService as any, loaderService as any)
        // Mock output EventEmitters
        component.handleApiData = new EventEmitter()
        component.handleapproveAll = new EventEmitter()
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should emit event when calling emitSearchRequest', () => {
        const emitSpy = jest.spyOn(component.handleApiData, 'emit')
        component.emitSearchRequest()
        expect(emitSpy).toHaveBeenCalledWith({
            searchText: '',
            filters: undefined,
            sortOrder: '',
        })
    })

    it('should call getContent and emit true when data is returned', () => {
        // Mock the usersService response
        usersService.getAllValidUsers.mockReturnValue(of({}))
        const emitSpy = jest.spyOn(component.handleApiData, 'emit')
        component.getContent()
        expect(loaderService.changeLoaderState).toHaveBeenCalledWith(true)
        expect(usersService.getAllValidUsers).toHaveBeenCalled()
        expect(emitSpy).toHaveBeenCalledWith(true)
        expect(loaderService.changeLoaderState).toHaveBeenCalledWith(false)
    })

    it('should change searchText and emit search request when searchData is called', () => {
        const event = { target: { value: 'search text' } }
        const emitSpy = jest.spyOn(component.handleApiData, 'emit')
        component.searchData(event)
        expect(component.searchText).toBe('search text')
        expect(emitSpy).toHaveBeenCalled()
    })

    it('should update sortOrder and emit search request when sortData is called', () => {
        const sortOrder = 'asc'
        const emitSpy = jest.spyOn(component.handleApiData, 'emit')
        component.sortData(sortOrder)
        expect(component.sortOrder).toBe('asc')
        expect(emitSpy).toHaveBeenCalled()
    })

    it('should emit applyFilters event when hideFilter is called with applyFilter', () => {
        const event = { filter: 'applyFilter', filtersList: ['filter1'] }
        const emitSpy = jest.spyOn(component.handleApiData, 'emit')
        component.hideFilter(event)
        expect(emitSpy).toHaveBeenCalled()
        expect(component.filtersList).toBe(event.filtersList)
    })

    it('should emit approveAll event when approveAll is called', () => {
        const emitSpy = jest.spyOn(component.handleapproveAll, 'emit')
        component.approveAll()
        expect(emitSpy).toHaveBeenCalled()
    })

    it('should open confirmation dialog when confirmApproval is called', () => {
        const template = {}
        dialog.open.mockReturnValue({
            afterClosed: jest.fn().mockReturnValue(of(true)),
        })

        const emitSpy = jest.spyOn(component.handleapproveAll, 'emit')
        component.confirmApproval(template)

        expect(dialog.open).toHaveBeenCalledWith(template, { width: '500px' })
        expect(emitSpy).toHaveBeenCalled()
    })

    it('should reset pageIndex and pageSize when resetPageIndex is called', () => {
        component.pageIndex = 5
        component.pageSize = 100
        component.resetPageIndex()
        expect(component.pageIndex).toBe(0)
        expect(component.pageSize).toBe(20)
    })
})
