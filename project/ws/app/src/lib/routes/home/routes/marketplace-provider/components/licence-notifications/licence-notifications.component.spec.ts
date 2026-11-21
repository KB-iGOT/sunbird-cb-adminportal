import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of, throwError } from 'rxjs'

import { LicenceNotificationsComponent } from './licence-notifications.component'
import { MarketplaceService } from '../../services/marketplace.service'

describe('LicenceNotificationsComponent', () => {
  let component: LicenceNotificationsComponent
  let fixture: ComponentFixture<LicenceNotificationsComponent>
  let snackBar: { openFromComponent: jest.Mock }
  let marketPlaceSvc: any

  const page = () => fixture.nativeElement as HTMLElement
  const text = (selector: string) => page().querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim()
  const typeThreshold = (value: number | null) => component.thresholdControl.setValue(value)
  const typeRecipient = (email: string, name = 'Partner Desk') => component.recipientForm.setValue({ name, email })
  const lastToast = () => snackBar.openFromComponent.mock.calls[snackBar.openFromComponent.mock.calls.length - 1][1].data

  beforeEach(() => {
    snackBar = { openFromComponent: jest.fn() }
    marketPlaceSvc = {
      readNotificationSettings: jest.fn().mockReturnValue(of(null)),
      readProviderAccessSettings: jest.fn().mockReturnValue(of(null)),
      upsertNotificationSettings: jest.fn().mockReturnValue(of({ result: { message: 'Licence notification settings saved successfully' } })),
    }
    TestBed.configureTestingModule({
      declarations: [LicenceNotificationsComponent],
      imports: [FormsModule, ReactiveFormsModule],
      providers: [
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MarketplaceService, useValue: marketPlaceSvc },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    fixture = TestBed.createComponent(LicenceNotificationsComponent)
    component = fixture.componentInstance
    component.ngOnChanges({
      providerDetails: new SimpleChange(null, {
        data: { contentPartnerName: 'SIMPLILEARN', overAllLimit: 40000, licenseConsumedCount: 20996 },
      }, true),
    })
    fixture.detectChanges()
  })

  describe('thresholds', () => {
    it('should read the over all limit and what is consumed of it', () => {
      expect(component.overAllLimit).toBe(40000)
      expect(component.consumedPercent).toBeCloseTo(52.49, 2)
      expect(text('.consumed-cell')).toContain('52.5% (20,996)')
    })

    it('should start with the suggested thresholds, each with the licences it stands for', () => {
      expect(component.thresholds).toEqual([50, 75, 90, 100])
      expect(component.thresholds.map(threshold => component.thresholdLicences(threshold))).toEqual([20000, 30000, 36000, 40000])
    })

    it('should read nothing consumed while the provider has no over all limit', () => {
      component.ngOnChanges({ providerDetails: new SimpleChange(null, { data: { overAllLimit: 0 } }, true) })
      expect(component.consumedPercent).toBe(0)
    })

    it('should add a threshold in order and clear the field', () => {
      component.removeThreshold(90)
      typeThreshold(80)

      component.addThreshold()

      expect(component.thresholds).toEqual([50, 75, 80, 100])
      expect(component.thresholdControl.value).toBeNull()
    })

    it('should take whole numbers from 1 to 100 only, each once, telling what is wrong in a toast on Add', () => {
      const addButton = () => page().querySelector('.threshold-chips .pill-button') as HTMLButtonElement
      const toasts = () => snackBar.openFromComponent.mock.calls.map(call => [call[1].data.message, call[1].panelClass])
      for (const value of [-3, 0, 101, 12.5]) {
        typeThreshold(value)
        expect(component.thresholdError).toBe('Enter a whole number from 1 to 100.')
      }
      fixture.detectChanges()
      expect(addButton().disabled).toBe(false)
      expect(page().querySelector('.field-error')).toBeNull()

      addButton().click()
      expect(toasts()).toEqual([['Enter a whole number from 1 to 100.', ['error', 'licence-notifications-toast']]])
      expect(component.thresholds).toEqual([50, 75, 90, 100])
      expect(component.thresholdControl.value).toBe(12.5)

      typeThreshold(75)
      component.addThreshold()
      expect(toasts()[1]).toEqual(['75% is already a threshold.', ['error', 'licence-notifications-toast']])
      expect(component.thresholds).toEqual([50, 75, 90, 100])

      typeThreshold(null)
      expect(component.thresholdError).toBe('')
      expect(component.canAddThreshold).toBe(false)
      component.addThreshold()
      expect(snackBar.openFromComponent).toHaveBeenCalledTimes(2)
    })

    it('should take up to 5 thresholds', () => {
      typeThreshold(25)
      component.addThreshold()
      typeThreshold(30)

      expect(component.thresholds.length).toBe(5)
      expect(component.thresholdError).toBe('Up to 5 thresholds. Remove one to add another.')
      component.addThreshold()
      expect(component.thresholds.length).toBe(5)
    })

    it('should show Max 5 in place of the field once there are 5 thresholds', () => {
      expect(page().querySelector('.threshold-input')).not.toBeNull()
      expect(page().querySelector('.max-note')).toBeNull()

      typeThreshold(25)
      component.addThreshold()
      fixture.detectChanges()

      expect(page().querySelector('.threshold-input')).toBeNull()
      expect(page().querySelector('.threshold-chips .pill-button')).toBeNull()
      expect(text('.max-note')).toBe('Max 5')
    })

    it('should mark the thresholds consumption has reached crossed, green with a tick, and the others not reached yet', () => {
      // 52.5% is consumed
      const chips = Array.from(page().querySelectorAll('.threshold-chip')) as HTMLElement[]
      expect(chips.map(chip => chip.textContent?.replace(/\s+/g, ' ').replace('×', '').trim()))
        .toEqual(['✓ 50% · 20,000', '75% · 30,000', '90% · 36,000', '100% · 40,000'])
      expect(chips.map(chip => chip.classList.contains('crossed'))).toEqual([true, false, false, false])
      expect(component.thresholds.map(threshold => component.isCrossed(threshold))).toEqual([true, false, false, false])
    })

    it('should not be a checkbox: clicking a threshold changes nothing', () => {
      const chip = page().querySelectorAll('.threshold-chip')[1] as HTMLElement
      expect(chip.getAttribute('role')).toBeNull()
      expect(chip.getAttribute('aria-checked')).toBeNull()

      chip.click()
      fixture.detectChanges()

      expect(chip.classList).not.toContain('crossed')
      expect(component.hasUnsavedChanges).toBe(false)
    })

    it('should remove a threshold', () => {
      const removeButton = page().querySelectorAll('.chip-remove')[1] as HTMLButtonElement
      removeButton.click()

      expect(component.thresholds).toEqual([50, 90, 100])
    })

    it('should mark a threshold added below consumption crossed, with Alert sent on hover', () => {
      typeThreshold(25)
      component.addThreshold()
      fixture.detectChanges()

      expect((page().querySelectorAll('.threshold-chip')[0] as HTMLElement).classList).toContain('crossed')
      expect(component.thresholdTooltip(25)).toBe('Alert sent')
    })

    it('should explain crossed thresholds only once a new one that is already crossed is added, until it is saved', () => {
      const note = () => page().querySelector('.crossed-note')
      // 52.5% is consumed: the 50% the provider starts with is crossed, but it isn't new
      expect(component.isCrossed(50)).toBe(true)
      expect(note()).toBeNull()

      // an existing threshold taken off and added back isn't new
      component.removeThreshold(50)
      typeThreshold(50)
      component.addThreshold()
      fixture.detectChanges()
      expect(note()).toBeNull()

      // new, but not crossed
      component.removeThreshold(90)
      typeThreshold(60)
      component.addThreshold()
      fixture.detectChanges()
      expect(note()).toBeNull()

      typeThreshold(25)
      component.addThreshold()
      fixture.detectChanges()
      expect(text('.crossed-note')).toBe('ⓘ A threshold that\'s already below current consumption when you save is marked ✓ crossed '
        + 'and no email is sent for it.')

      component.removeThreshold(25)
      fixture.detectChanges()
      expect(note()).toBeNull()

      typeThreshold(25)
      component.addThreshold()
      component.save()
      fixture.detectChanges()
      expect(note()).toBeNull()

      // once saved, 25% is an existing threshold too
      component.removeThreshold(25)
      typeThreshold(25)
      component.addThreshold()
      fixture.detectChanges()
      expect(note()).toBeNull()
    })

    it('should start with alerts on', () => {
      expect(component.alertsEnabled).toBe(true)
    })

    it('should disable the thresholds while alerts are off, keeping them as they are', () => {
      component.removeThreshold(100)
      component.alertsEnabled = false
      typeThreshold(80)
      fixture.detectChanges()

      expect((page().querySelector('fieldset.threshold-chips') as HTMLFieldSetElement).disabled).toBe(true)
      expect(component.canAddThreshold).toBe(false)
      component.addThreshold()
      expect(component.thresholds).toEqual([50, 75, 90])
    })
  })

  describe('saved settings', () => {
    // as the notification read gives them, with the licence totals of the access settings read
    const savedSettings = {
      result: {
        alertsEnabled: true,
        maxRecipients: 100,
        thresholds: [75, 50, 90, 100],
        recipients: [
          { name: 'Partner Ops', email: 'ops@simplilearn.com', addedOn: '2026-10-29T10:20:11Z' },
          { email: 'licensing@simplilearn.com', addedOn: '2026-10-29T10:20:11Z' },
        ],
      },
    }
    const open = (partnerId: string) => component.ngOnChanges({
      providerDetails: new SimpleChange(null, { id: partnerId, data: { contentPartnerName: 'SIMPLILEARN', overAllLimit: 40000 } }, true),
    })
    const chips = () => Array.from(page().querySelectorAll('.threshold-chip')) as HTMLElement[]

    beforeEach(() => {
      marketPlaceSvc.readNotificationSettings.mockReturnValue(of(savedSettings))
      marketPlaceSvc.readProviderAccessSettings.mockReturnValue(of({ result: { licence: { consumed: 21496 } } }))
      open('partner-1')
      fixture.detectChanges()
    })

    it('should open with the saved settings, and what is consumed from the licence totals of the access settings read', () => {
      expect(marketPlaceSvc.readNotificationSettings).toHaveBeenCalledWith('partner-1')
      expect(marketPlaceSvc.readProviderAccessSettings).toHaveBeenCalledWith('partner-1')
      expect(component.thresholds).toEqual([50, 75, 90, 100])
      expect(component.thresholds.map(threshold => component.thresholdLicences(threshold))).toEqual([20000, 30000, 36000, 40000])
      expect(text('.consumed-cell')).toContain('53.7% (21,496)')
      expect(component.recipients).toEqual([
        { name: 'Partner Ops', email: 'ops@simplilearn.com', addedOn: '2026-10-29T10:20:11Z' },
        { name: '', email: 'licensing@simplilearn.com', addedOn: '2026-10-29T10:20:11Z' },
      ])
      expect(component.hasUnsavedChanges).toBe(false)
    })

    it('should read the settings once for a provider, and alerts as off when saved off', () => {
      marketPlaceSvc.readNotificationSettings.mockReturnValue(of({ result: { ...savedSettings.result, alertsEnabled: false } }))
      open('partner-1')
      expect(marketPlaceSvc.readNotificationSettings).toHaveBeenCalledTimes(1)

      open('partner-2')
      fixture.detectChanges()
      expect(component.alertsEnabled).toBe(false)
      expect((page().querySelector('fieldset.threshold-chips') as HTMLFieldSetElement).disabled).toBe(true)
    })

    it('should open with the crossed thresholds green with a tick, the others blue', () => {
      expect(chips().map(chip => chip.textContent?.replace(/\s+/g, ' ').replace('×', '').trim()))
        .toEqual(['✓ 50% · 20,000', '75% · 30,000', '90% · 36,000', '100% · 40,000'])
      expect(chips().map(chip => chip.classList.contains('crossed'))).toEqual([true, false, false, false])
      expect(component.hasUnsavedChanges).toBe(false)
    })

    it('should say Alert sent on hover for a threshold consumption has reached, and Not reached yet for the others', () => {
      // 53.7% is consumed
      expect(component.thresholdTooltip(50)).toBe('Alert sent')
      expect(component.thresholdTooltip(75)).toBe('Not reached yet')
      expect(component.thresholdTooltip(100)).toBe('Not reached yet')
    })

    it('should mark crossed by consumption alone, with no sent key in the read', () => {
      // 21,496 of 40,000 is 53.74%: 53% is reached, 54% isn't
      typeThreshold(53)
      component.addThreshold()
      component.removeThreshold(100)
      typeThreshold(54)
      component.addThreshold()
      fixture.detectChanges()

      expect(chips().map(chip => chip.classList.contains('crossed'))).toEqual([true, true, false, false, false])
      expect(component.thresholdTooltip(53)).toBe('Alert sent')
      expect(component.thresholdTooltip(54)).toBe('Not reached yet')
    })

    it('should count the saved thresholds as existing ones, so no crossed note shows for them on opening', () => {
      // 53.7% is consumed, past the saved 50%
      expect(page().querySelector('.crossed-note')).toBeNull()

      typeThreshold(25)
      component.addThreshold()
      fixture.detectChanges()
      expect(page().querySelector('.crossed-note')).not.toBeNull()
    })

    it('should save the alerts switch, the thresholds and the recipients', () => {
      component.alertsEnabled = false
      typeRecipient('desk@simplilearn.com', 'Desk')
      component.addRecipient()

      component.save()

      expect(marketPlaceSvc.upsertNotificationSettings).toHaveBeenCalledWith({
        partnerId: 'partner-1',
        alertsEnabled: false,
        thresholds: [50, 75, 90, 100],
        recipients: [
          { name: 'Partner Ops', email: 'ops@simplilearn.com' },
          { email: 'licensing@simplilearn.com' },
          { name: 'Desk', email: 'desk@simplilearn.com' },
        ],
      })
      expect(lastToast()).toEqual({ message: 'Licence notifications saved successfully', type: 'success' })
      expect(component.hasUnsavedChanges).toBe(false)
    })

    it('should save the thresholds as they were added and removed', () => {
      component.removeThreshold(100)
      typeThreshold(60)
      component.addThreshold()

      component.save()

      expect(marketPlaceSvc.upsertNotificationSettings.mock.calls[0][0].thresholds).toEqual([50, 60, 75, 90])
      expect(component.hasUnsavedChanges).toBe(false)
    })

    it('should read thresholds that come as { threshold }', () => {
      marketPlaceSvc.readNotificationSettings.mockReturnValue(of({
        result: { ...savedSettings.result, thresholds: [{ threshold: 90 }, { threshold: 50 }, { threshold: 75 }] },
      }))
      open('partner-2')

      expect(component.thresholds).toEqual([50, 75, 90])
      expect(component.hasUnsavedChanges).toBe(false)
    })

    it('should keep the changes unsaved and say why when the save fails', () => {
      marketPlaceSvc.upsertNotificationSettings.mockReturnValue(throwError({ error: { params: { errMsg: 'Invalid email' } } }))
      component.removeRecipient(0)

      component.save()

      expect(lastToast()).toEqual({ message: 'Invalid email', type: 'error' })
      expect(component.hasUnsavedChanges).toBe(true)
      expect(component.canSave).toBe(true)
    })

    it('should say what the api gives when a read fails, and open with the defaults', () => {
      marketPlaceSvc.readNotificationSettings.mockReturnValue(throwError({ error: { params: { errMsg: 'Invalid partnerId: partner-3' } } }))
      open('partner-3')

      expect(lastToast()).toEqual({ message: 'Invalid partnerId: partner-3', type: 'error' })
      expect(component.thresholds).toEqual([50, 75, 90, 100])
      expect(component.recipients).toEqual([])
    })
  })

  describe('recipients', () => {
    it('should name the provider the list is for', () => {
      expect(text('.notification-section:nth-of-type(2) .section-title')).toBe('Recipients for SIMPLILEARN')
    })

    it('should add a recipient with the day it was added, and clear the fields', () => {
      typeRecipient(' Rohit.Mehta@Simplilearn.com ', ' Rohit Mehta ')

      component.addRecipient()

      expect(component.recipients).toEqual([
        { name: 'Rohit Mehta', email: 'rohit.mehta@simplilearn.com', addedOn: expect.any(String) },
      ])
      expect(new Date(component.recipients[0].addedOn).toDateString()).toBe(new Date().toDateString())
      expect(component.recipientForm.value).toEqual({ name: '', email: '' })
    })

    it('should keep the table with its headings while it is empty, warning that no alerts will be sent', () => {
      const headings = Array.from(page().querySelectorAll('.recipients-table th')).map(heading => heading.textContent?.trim())
      expect(headings).toEqual(['Name', 'Email', 'Added on', ''])
      expect(text('.recipients-table .empty-recipients')).toBe('No recipients yet. Alerts won\'t be sent.')
      expect(text('.no-recipients-warning')).toBe('⚠ No recipients — alerts won\'t be sent.')

      typeRecipient('desk@simplilearn.com')
      component.addRecipient()
      fixture.detectChanges()
      expect(page().querySelector('.empty-recipients')).toBeNull()
      expect(page().querySelector('.no-recipients-warning')).toBeNull()
    })

    it('should show a name or e-mail id cut short by its column in full on hover, and give one that fits no tooltip', () => {
      const longEmail = `srikanthmutte.dev@gmail.co${'m'.repeat(40)}`
      typeRecipient(longEmail, 'Rohit Mehta')
      component.addRecipient()
      fixture.detectChanges()
      const [nameCell, emailCell] = Array.from(page().querySelectorAll('.recipients-table tbody .ellipsis-cell')) as HTMLElement[]
      // jsdom does no layout, so the email is made to overflow its cell
      Object.defineProperty(emailCell, 'scrollWidth', { value: 600 })
      Object.defineProperty(emailCell, 'clientWidth', { value: 300 })

      emailCell.dispatchEvent(new MouseEvent('mouseenter'))
      nameCell.dispatchEvent(new MouseEvent('mouseenter'))

      expect(emailCell.title).toBe(longEmail)
      expect(nameCell.title).toBe('')
      // a pointer over the text cut short, the arrow over the rest
      expect(emailCell.classList).toContain('truncated')
      expect(nameCell.classList).not.toContain('truncated')
    })

    it('should show Name * and email@partner.com * as the placeholders, with Add on before anything is typed', () => {
      const inputs = Array.from(page().querySelectorAll('.recipient-form input')) as HTMLInputElement[]
      expect(inputs.map(input => input.placeholder)).toEqual(['Name *', 'email@partner.com *'])
      expect(inputs.every(input => input.required)).toBe(true)
      expect((page().querySelector('.recipient-form .pill-button') as HTMLButtonElement).disabled).toBe(false)
    })

    it('should ask for a name first, then a valid email, in a toast on Add', () => {
      const addButton = page().querySelector('.recipient-form .pill-button') as HTMLButtonElement
      const toasts = () => snackBar.openFromComponent.mock.calls.map(call => call[1].data.message)

      addButton.click()
      typeRecipient('desk@simplilearn.com', '   ')
      addButton.click()
      typeRecipient('', 'Partner Desk')
      addButton.click()

      expect(toasts()).toEqual(['Enter a name.', 'Enter a name.', 'Enter a valid email address.'])
      expect(component.recipients).toEqual([])
      expect(component.recipientForm.value).toEqual({ name: 'Partner Desk', email: '' })
    })

    it('should list a saved recipient without a name with a dash', () => {
      component.recipients = [{ name: '', email: 'licensing@simplilearn.com', addedOn: '2026-10-20T00:00:00.000Z' }]
      fixture.detectChanges()

      const cells = Array.from(page().querySelectorAll('.recipients-table tbody td')).map(cell => cell.textContent?.trim())
      expect(cells[0]).toBe('—')
      expect(cells[1]).toBe('licensing@simplilearn.com')
      expect(text('.recipient-count')).toBe('1 / 100')
    })

    it('should take valid e-mail ids only, each once, telling what is wrong in a toast on Add', () => {
      const toasts = () => snackBar.openFromComponent.mock.calls.map(call => [call[1].data.message, call[1].panelClass])
      const addButton = () => page().querySelector('.recipient-form .pill-button') as HTMLButtonElement
      typeRecipient('rohit.mehta@simplilearn')
      fixture.detectChanges()
      expect(addButton().disabled).toBe(false)
      expect(page().querySelector('.field-error')).toBeNull()

      addButton().click()
      expect(toasts()).toEqual([['Enter a valid email address.', ['error', 'licence-notifications-toast']]])
      expect(component.recipients).toEqual([])
      expect(component.recipientForm.value.email).toBe('rohit.mehta@simplilearn')

      typeRecipient('rohit.mehta@simplilearn.com')
      component.addRecipient()
      typeRecipient('Rohit.Mehta@simplilearn.com')
      component.addRecipient()
      expect(toasts()[1]).toEqual(['That email is already on the list.', ['error', 'licence-notifications-toast']])
      expect(component.recipients.length).toBe(1)

      typeRecipient('')
      expect(component.canAddRecipient).toBe(true)
      component.addRecipient()
      expect(toasts()[2]).toEqual(['Enter a valid email address.', ['error', 'licence-notifications-toast']])
      expect(component.recipients.length).toBe(1)
    })

    it('should take up to 100 recipients, then disable Add and say Maximum 100 recipients beside it', () => {
      const addButton = () => page().querySelector('.recipient-form .pill-button') as HTMLButtonElement
      component.recipients = Array.from({ length: 99 }, (_value, index) =>
        ({ name: '', email: `user${index}@simplilearn.com`, addedOn: '2026-10-20T00:00:00.000Z' }))
      typeRecipient('user99@simplilearn.com')
      fixture.detectChanges()
      expect(addButton().disabled).toBe(false)
      expect(page().querySelector('.max-recipients')).toBeNull()

      component.addRecipient()
      typeRecipient('one.more@simplilearn.com')
      fixture.detectChanges()

      expect(component.recipients.length).toBe(100)
      expect(addButton().disabled).toBe(true)
      expect(addButton().nextElementSibling?.textContent?.trim()).toBe('Maximum 100 recipients')
      expect(page().querySelector('.field-error')).toBeNull()
      component.addRecipient()
      expect(component.recipients.length).toBe(100)

      component.removeRecipient(0)
      fixture.detectChanges()
      expect(addButton().disabled).toBe(false)
      expect(page().querySelector('.max-recipients')).toBeNull()
    })

    describe('paging', () => {
      const listOf = (count: number) => Array.from({ length: count }, (_value, index) =>
        ({ name: '', email: `user${index}@simplilearn.com`, addedOn: '2026-10-20T00:00:00.000Z' }))
      const emails = () => Array.from(page().querySelectorAll('.recipients-table tbody tr td:nth-child(2)'))
        .map(cell => cell.textContent?.trim())

      it('should page the list 20 to a page, with 50 and 100 to choose from, once there are recipients', () => {
        expect(page().querySelector('mat-paginator')).toBeNull()
        component.recipients = listOf(45)
        fixture.detectChanges()

        expect(page().querySelector('mat-paginator')).not.toBeNull()
        expect(component.pageSizeOptions).toEqual([20, 50, 100])
        expect(emails().length).toBe(20)
        expect(emails()[0]).toBe('user0@simplilearn.com')

        component.onPage({ pageIndex: 2, pageSize: 20, length: 45 })
        fixture.detectChanges()
        expect(emails()).toEqual(['user40', 'user41', 'user42', 'user43', 'user44'].map(user => `${user}@simplilearn.com`))

        component.onPage({ pageIndex: 0, pageSize: 50, length: 45 })
        fixture.detectChanges()
        expect(emails().length).toBe(45)
      })

      it('should remove the recipient shown on the page, and step back once that page is empty', () => {
        component.recipients = listOf(21)
        component.onPage({ pageIndex: 1, pageSize: 20, length: 21 })
        fixture.detectChanges()
        expect(emails()).toEqual(['user20@simplilearn.com'])

        const deleteButton = page().querySelector('.recipients-table tbody .remove-cell button') as HTMLButtonElement
        deleteButton.click()
        fixture.detectChanges()

        expect(component.recipients.map(recipient => recipient.email)).not.toContain('user20@simplilearn.com')
        expect(component.recipients.length).toBe(20)
        expect(component.pageIndex).toBe(0)
        expect(emails().length).toBe(20)
      })

      it('should show the page a new recipient lands on', () => {
        component.recipients = listOf(20)
        typeRecipient('new.desk@simplilearn.com')

        component.addRecipient()
        fixture.detectChanges()

        expect(component.pageIndex).toBe(1)
        expect(emails()).toEqual(['new.desk@simplilearn.com'])
      })
    })

    it('should remove a recipient', () => {
      typeRecipient('a@simplilearn.com')
      component.addRecipient()
      typeRecipient('b@simplilearn.com')
      component.addRecipient()

      component.removeRecipient(0)

      expect(component.recipients.map(recipient => recipient.email)).toEqual(['b@simplilearn.com'])
    })
  })

  describe('save', () => {
    const saveButton = () => page().querySelector('.header-actions button') as HTMLButtonElement

    it('should have nothing to save while nothing has changed', () => {
      expect(component.hasUnsavedChanges).toBe(false)
      expect(saveButton().disabled).toBe(true)
    })

    it('should offer Save once something changes, and nothing more once saved', () => {
      component.alertsEnabled = false
      fixture.detectChanges()
      expect(saveButton().disabled).toBe(false)

      component.save()
      fixture.detectChanges()

      expect(component.hasUnsavedChanges).toBe(false)
      expect(saveButton().disabled).toBe(true)
    })

    it('should count thresholds and recipients as changes', () => {
      component.removeThreshold(50)
      expect(component.hasUnsavedChanges).toBe(true)
      component.save()

      typeThreshold(60)
      component.addThreshold()
      expect(component.hasUnsavedChanges).toBe(true)
      component.removeThreshold(60)
      expect(component.hasUnsavedChanges).toBe(false)

      typeRecipient('desk@simplilearn.com')
      component.addRecipient()
      expect(component.hasUnsavedChanges).toBe(true)
      component.save()

      component.removeRecipient(0)
      expect(component.hasUnsavedChanges).toBe(true)
    })
  })
})
