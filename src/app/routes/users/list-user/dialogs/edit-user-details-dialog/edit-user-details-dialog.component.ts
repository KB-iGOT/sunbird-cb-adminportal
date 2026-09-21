import { Component, Inject, OnInit, ViewChild } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { forkJoin, of } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { UsersService } from '../../../users.service'
import { EDITABLE_FIELDS, IUserProfile } from '../../../models/users.models'
import { DesignationSelectorComponent } from '../../../shared/designation-selector/designation-selector.component'

// Cadre config interfaces
interface ICadre { id: string; name: string; startBatchYear: number; endBatchYear: number; exculsionYearList?: number[] }
interface ICivilService {
  id: string
  name: string
  cadreList?: ICadre[]
  cadreControllingAuthority?: string
  commonBatchStartYear?: number
  commonBatchEndYear?: number
  commonBatchExclusionYearList?: number[]
}
interface ICivilServiceType { id: string; name: string; serviceList: ICivilService[] }

const CADRE_SERVICES = ['Indian Administrative Service (IAS)', 'Indian Police Service (IPS)', 'Indian Forest Service (IFoS)']

@Component({
  standalone: false,
  selector: 'ws-edit-user-details-dialog',
  templateUrl: './edit-user-details-dialog.component.html',
  styleUrls: ['./edit-user-details-dialog.component.scss'],
})
export class EditUserDetailsDialogComponent implements OnInit {
  @ViewChild(DesignationSelectorComponent) designationSelectorRef!: DesignationSelectorComponent
  editForm!: FormGroup
  isLoading = false
  isSaving = false
  fields = EDITABLE_FIELDS
  user: IUserProfile

  // Group & Designation
  groups: string[] = []

  // Cadre
  cadreConfig: any = null
  civilServiceTypes: string[] = []
  serviceNamesList: string[] = []
  cadreList: string[] = []
  yearArray: number[] = []
  cadreControllingAuthority = ''
  showCadreDropdown = false
  showBatchDropdown = false
  showControllingAuthority = false
  showCentralDeputation = false

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { user: IUserProfile },
    private dialogRef: MatDialogRef<EditUserDetailsDialogComponent>,
    private usersService: UsersService,
    private snackBar: MatSnackBar,
  ) {
    this.user = data.user
  }

  ngOnInit(): void {
    const personal = this.user.profileDetails?.personalDetails || {} as any
    const prof = (this.user.profileDetails?.professionalDetails?.[0] || {}) as any
    const additional = this.user.profileDetails?.additionalProperties || {} as any
    const cadreDetails = (this.user.profileDetails as any)?.cadreDetails || {} as any

    this.editForm = this.fb.group({
      // Personal
      firstname: [personal.firstname || this.user.firstName || ''],
      email: [personal.primaryEmail || ''],
      phone: [personal.mobile != null ? String(personal.mobile) : ''],
      // Additional
      externalSystemId: [additional.externalSystemId || ''],
      externalSystem: [additional.externalSystem || ''],
      // Professional
      group: [prof.group || '', Validators.required],
      designation: [prof.designation || '', Validators.required],
      // Cadre — isCadre from personalDetails is the sole source of truth
      // Only pre-fill sub-fields if isCadre is currently true
      isCadre: [personal.isCadre === true || personal.isCadre === 'true'],
      civilServiceType: [(personal.isCadre === true || personal.isCadre === 'true') ? (cadreDetails.civilServiceType || '') : ''],
      civilServiceName: [(personal.isCadre === true || personal.isCadre === 'true') ? (cadreDetails.civilServiceName || '') : ''],
      cadreName: [(personal.isCadre === true || personal.isCadre === 'true') ? (cadreDetails.cadreName || '') : ''],
      cadreBatch: [
        (personal.isCadre === true || personal.isCadre === 'true') && cadreDetails.cadreBatch != null
          ? String(cadreDetails.cadreBatch) : '',
      ],
      isOnCentralDeputation: [(personal.isCadre === true || personal.isCadre === 'true') && cadreDetails.isOnCentralDeputation === true],
    })

    this.isLoading = true
    forkJoin({
      groups: this.usersService.fetchGroups().pipe(catchError(() => of(null))),
      cadre: this.usersService.fetchCadreData().pipe(catchError(() => of(null))),
    }).subscribe(
      (res: any) => {
        // Groups
        this.groups = res.groups?.result?.response || []

        // Cadre config: result.response.value can be a string or object
        try {
          const rawValue = res.cadre?.result?.response?.value
          const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue
          this.cadreConfig = parsed || null
          // tslint:disable-next-line:no-console
          console.log('[EditDialog] cadreConfig parsed:', this.cadreConfig)
        } catch (e) {
          // tslint:disable-next-line:no-console
          console.error('[EditDialog] Failed to parse cadre config:', e)
          this.cadreConfig = null
        }

        this.rebuildCadreOptions()
        this.isLoading = false
      },
      () => {
        this.isLoading = false
        this.snackBar.open('Failed to load form options', 'X', { duration: 5000 })
      },
    )

    // Watch cadre field changes
    this.editForm.get('isCadre')?.valueChanges.subscribe(() => this.onCadreToggle())
    this.editForm.get('civilServiceType')?.valueChanges.subscribe(() => this.onCivilServiceTypeChange())
    this.editForm.get('civilServiceName')?.valueChanges.subscribe(() => this.onCivilServiceNameChange())
    this.editForm.get('cadreName')?.valueChanges.subscribe(() => this.onCadreNameChange())
    this.editForm.get('cadreBatch')?.valueChanges.subscribe(() => this.updateVisibility())
  }

  // ── Cadre cascading logic ──

  private rebuildCadreOptions(): void {
    const cadreRoot = this.cadreConfig?.civilServiceType || this.cadreConfig
    // tslint:disable-next-line:no-console
    console.log('[EditDialog] cadreRoot:', cadreRoot, 'civilServiceTypeList:', cadreRoot?.civilServiceTypeList)
    if (cadreRoot?.civilServiceTypeList) {
      this.civilServiceTypes = cadreRoot.civilServiceTypeList.map((s: ICivilServiceType) => s.name)
    }
    // Rebuild downstream lists from existing values
    this.rebuildServiceNames()
    this.rebuildCadreList()
    this.rebuildYears()
    this.updateVisibility()
  }

  private getSelectedServiceType(): ICivilServiceType | null {
    const cadreRoot = this.cadreConfig?.civilServiceType || this.cadreConfig
    if (!cadreRoot?.civilServiceTypeList) { return null }
    return cadreRoot.civilServiceTypeList.find(
      (s: ICivilServiceType) => s.name === this.editForm.get('civilServiceType')?.value,
    ) || null
  }

  private getSelectedService(): ICivilService | null {
    const st = this.getSelectedServiceType()
    if (!st?.serviceList) { return null }
    return st.serviceList.find(
      (s: ICivilService) => s.name === this.editForm.get('civilServiceName')?.value,
    ) || null
  }

  private getSelectedCadre(): ICadre | null {
    const svc = this.getSelectedService()
    if (!svc?.cadreList) { return null }
    return svc.cadreList.find(
      (c: ICadre) => c.name === this.editForm.get('cadreName')?.value,
    ) || null
  }

  private rebuildServiceNames(): void {
    const st = this.getSelectedServiceType()
    this.serviceNamesList = st?.serviceList?.map((s: ICivilService) => s.name) || []
  }

  private rebuildCadreList(): void {
    const svc = this.getSelectedService()
    this.cadreList = svc?.cadreList?.map((c: ICadre) => c.name) || []
  }

  private rebuildYears(): void {
    const cadre = this.getSelectedCadre()
    const svc = this.getSelectedService()
    let startYear: number | undefined
    let endYear: number | undefined
    let exclusionYears: number[] = []
    if (cadre) {
      startYear = cadre.startBatchYear
      endYear = cadre.endBatchYear
      exclusionYears = cadre.exculsionYearList || []
    } else if (svc && (!svc.cadreList || svc.cadreList.length === 0)) {
      startYear = svc.commonBatchStartYear
      endYear = svc.commonBatchEndYear
      exclusionYears = svc.commonBatchExclusionYearList || []
    }
    if (startYear == null || endYear == null) {
      this.yearArray = []
      return
    }
    this.yearArray = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear! + i)
      .filter(y => !exclusionYears.includes(y))

    // Update controlling authority
    const service = this.getSelectedService()
    this.cadreControllingAuthority = service?.cadreControllingAuthority || ''
  }

  private updateVisibility(): void {
    const isCadre = this.editForm.get('isCadre')?.value
    const csType = this.editForm.get('civilServiceType')?.value
    const csName = this.editForm.get('civilServiceName')?.value
    const cadreName = this.editForm.get('cadreName')?.value
    const batch = this.editForm.get('cadreBatch')?.value

    this.showCadreDropdown = isCadre && !!csType && !!csName && CADRE_SERVICES.includes(csName)
    this.showBatchDropdown = isCadre && !!csType && !!csName && (CADRE_SERVICES.includes(csName) ? !!cadreName : true)
    this.showControllingAuthority = isCadre && !!batch && !!this.cadreControllingAuthority
    this.showCentralDeputation = isCadre && csType === 'All India Services' && !!cadreName && !!batch
  }

  private onCadreToggle(): void {
    // Always clear sub-fields on any toggle — fresh start in both directions
    this.editForm.patchValue({
      civilServiceType: '', civilServiceName: '', cadreName: '', cadreBatch: '', isOnCentralDeputation: false,
      // tslint:disable-next-line:align
    }, { emitEvent: false })
    this.rebuildServiceNames()
    this.rebuildCadreList()
    this.rebuildYears()
    this.updateVisibility()
  }

  private onCivilServiceTypeChange(): void {
    this.editForm.patchValue({
      civilServiceName: '', cadreName: '', cadreBatch: '', isOnCentralDeputation: false,
      // tslint:disable-next-line:align
    }, { emitEvent: false })
    this.rebuildServiceNames()
    this.cadreList = []
    this.yearArray = []
    this.updateVisibility()
  }

  private onCivilServiceNameChange(): void {
    this.editForm.patchValue({
      cadreName: '', cadreBatch: '', isOnCentralDeputation: false,
      // tslint:disable-next-line:align
    }, { emitEvent: false })
    this.rebuildCadreList()
    this.rebuildYears()
    this.updateVisibility()
  }

  private onCadreNameChange(): void {
    this.editForm.patchValue({ cadreBatch: '', isOnCentralDeputation: false }, { emitEvent: false })
    this.rebuildYears()
    this.updateVisibility()
  }

  onDesignationSelected(designation: string): void {
    this.editForm.get('designation')?.setValue(designation)
  }

  // ── Submit ──

  onSubmit(): void {
    if (this.editForm.get('group')?.invalid || this.editForm.get('designation')?.invalid) {
      this.editForm.markAllAsTouched()
      this.designationSelectorRef?.markAsTouched()
      return
    }

    const f = this.editForm.getRawValue()
    const personal = this.user.profileDetails?.personalDetails || {} as any
    const prof = (this.user.profileDetails?.professionalDetails?.[0] || {}) as any
    const additional = this.user.profileDetails?.additionalProperties || {} as any
    const origCadre = (this.user.profileDetails as any)?.cadreDetails || {} as any

    // Detect personal/additional changes
    const personalChanged =
      f.firstname !== (personal.firstname || this.user.firstName || '') ||
      f.email !== (personal.primaryEmail || '') ||
      f.phone !== (personal.mobile != null ? String(personal.mobile) : '') ||
      f.externalSystemId !== (additional.externalSystemId || '') ||
      f.externalSystem !== (additional.externalSystem || '')

    // Detect professional changes
    const professionalChanged =
      f.group !== (prof.group || '') ||
      f.designation !== (prof.designation || '')

    // Detect cadre changes — isCadre from personalDetails is the sole source of truth
    const origIsCadre = personal.isCadre === true || personal.isCadre === 'true'
    const cadreChanged =
      String(f.isCadre) !== String(origIsCadre) ||
      f.civilServiceType !== (origCadre.civilServiceType || '') ||
      f.civilServiceName !== (origCadre.civilServiceName || '') ||
      f.cadreName !== (origCadre.cadreName || '') ||
      String(f.cadreBatch) !== (origCadre.cadreBatch != null ? String(origCadre.cadreBatch) : '') ||
      String(f.isOnCentralDeputation) !== String(origCadre.isOnCentralDeputation === true)

    if (!personalChanged && !professionalChanged && !cadreChanged) {
      this.snackBar.open('No changes were made', 'X', { duration: 5000 })
      this.dialogRef.close()
      return
    }

    this.isSaving = true
    this.dialogRef.disableClose = true

    // Build requests sequentially via chained calls
    // tslint:disable-next-line:prefer-array-literal
    const requests: Array<() => Promise<void>> = []

    // 1) Personal + Additional via extPatchUser
    if (personalChanged) {
      requests.push(() => new Promise<void>((resolve, reject) => {
        const existingPD = JSON.parse(JSON.stringify(this.user.profileDetails || {}))
        if (!existingPD.personalDetails) { existingPD.personalDetails = {} }
        if (!existingPD.additionalProperties) { existingPD.additionalProperties = {} }

        const payload: any = { request: { userId: this.user.userId, profileDetails: existingPD } }

        if (f.firstname !== (personal.firstname || this.user.firstName || '')) {
          payload.request.firstName = f.firstname
          payload.request.profileDetails.personalDetails.firstname = f.firstname
        }
        if (f.email !== (personal.primaryEmail || '')) {
          payload.request.email = f.email
          payload.request.profileDetails.personalDetails.primaryEmail = f.email
        }
        if (f.phone !== (personal.mobile != null ? String(personal.mobile) : '')) {
          payload.request.phone = f.phone
          payload.request.profileDetails.personalDetails.mobile = f.phone
        }
        if (f.externalSystemId !== (additional.externalSystemId || '')) {
          payload.request.profileDetails.additionalProperties.externalSystemId = f.externalSystemId
        }
        if (f.externalSystem !== (additional.externalSystem || '')) {
          payload.request.profileDetails.additionalProperties.externalSystem = f.externalSystem
        }

        // Clean internal flags
        delete payload.request.profileDetails?.verifiedKarmayogi
        if (payload.request.profileDetails?.professionalDetails?.[0]) {
          delete payload.request.profileDetails.professionalDetails[0].verifiedKarmayogi
        }

        this.usersService.extPatchUser(payload).subscribe(() => resolve(), (err: any) => reject(err))
      }))
    }

    // 2) Cadre details via extPatchUser — cadreDetails alongside personalDetails.isCadre
    if (cadreChanged) {
      requests.push(() => new Promise<void>((resolve, reject) => {
        const selectedServiceType = this.getSelectedServiceType()
        const selectedService = this.getSelectedService()
        const selectedCadre = this.getSelectedCadre()

        const profileDetails: any = {
          personalDetails: { isCadre: !!f.isCadre },
        }
        if (f.isCadre) {
          profileDetails.cadreDetails = {
            civilServiceTypeId: selectedServiceType?.id || '',
            civilServiceType: f.civilServiceType || '',
            civilServiceId: selectedService?.id || '',
            civilServiceName: f.civilServiceName || '',
            cadreId: selectedCadre?.id || '',
            cadreName: f.cadreName || '',
            cadreBatch: f.cadreBatch ? Number(f.cadreBatch) : null,
            cadreControllingAuthorityName: this.cadreControllingAuthority || '',
            isOnCentralDeputation: f.isOnCentralDeputation || false,
          }
        }
        const cadrePayload: any = {
          // tslint:disable-next-line:object-shorthand-properties-first
          request: { userId: this.user.userId, profileDetails },
        }
        this.usersService.extPatchUser(cadrePayload).subscribe(() => resolve(), (err: any) => reject(err))
      }))
    }

    // 3) Professional details via extPatchUser
    if (professionalChanged) {
      requests.push(() => new Promise<void>((resolve, reject) => {
        const existingProf = (this.user.profileDetails?.professionalDetails?.[0] || {}) as any
        const extPayload = {
          request: {
            userId: this.user.userId,
            profileDetails: {
              professionalDetails: [{
                ...existingProf,
                group: f.group,
                designation: f.designation,
              }],
            },
          },
        }
        delete extPayload.request.profileDetails.professionalDetails[0]?.verifiedKarmayogi
        this.usersService.extPatchUser(extPayload).subscribe(() => resolve(), (err: any) => reject(err))
      }))
    }

    // Execute sequentially
    this.executeSequential(requests, 0)
  }
  // tslint:disable-next-line:prefer-array-literal
  private executeSequential(requests: Array<() => Promise<void>>, idx: number): void {
    if (idx >= requests.length) {
      this.isSaving = false
      this.snackBar.open('User details updated successfully', 'X', { duration: 5000, panelClass: ['success'] })
      this.dialogRef.close({ success: true })
      return
    }
    requests[idx]().then(
      () => this.executeSequential(requests, idx + 1),
      (err: any) => {
        this.isSaving = false
        this.dialogRef.disableClose = false
        this.snackBar.open(err?.error?.params?.errmsg || 'Failed to update user details', 'X', { duration: 5000, panelClass: ['error'] })
      },
    )
  }

  onCancel(): void {
    this.dialogRef.close()
  }
}
