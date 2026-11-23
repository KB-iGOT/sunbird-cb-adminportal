import { NsAccessControlConfig } from '@sunbird-cb/access-settings'

// The Access Settings tab is the provider access settings of @sunbird-cb/access-settings, in its SPV portal mode
const SelectionType = NsAccessControlConfig.SelectionType

// What the user lists of the Users popup show, as the creation portal shows them
const USERS_TABLE: NsAccessControlConfig.ITableParameters = {
  displayedColumns: ['select', 'firstName', 'email', 'ministry', 'mobile'],
  type: 'allLearners',
  initialPaginationSize: 5,
  initialPaginationSizeOptions: [5, 10, 25, 100],
  canShowPagination: true,
  canShowMasterSelect: true,
  canShowRefreshBtn: false,
  canShowDeleteBtn: false,
  canShowSelectedItems: true,
  canSortColumn: true,
}

// The library's config for the SPV portal. The conditions are offered in this order; the access type radio, the
// visibility toggle, bulk upload and custom fields are not used here.
export const SPV_ACCESS_CONTROL_CONFIG: NsAccessControlConfig.IAccessControlConfig = {
  application: NsAccessControlConfig.Application.SPV,
  accessControlCriteriaSelection: {
    optionsEntity: [
      { value: SelectionType.Organizations, label: 'Organisation', disabled: false },
      { value: SelectionType.Group, label: 'Group', disabled: false },
      { value: SelectionType.Designation, label: 'Designation', disabled: false },
      { value: SelectionType.Service, label: 'Service', disabled: false },
      { value: SelectionType.Batch, label: 'Batch', disabled: false },
      { value: SelectionType.Cadre, label: 'Cadre', disabled: false },
      { value: SelectionType.VerificationStatus, label: 'Verification Status', disabled: false },
      { value: SelectionType.Users, label: 'User', disabled: false },
    ],
    optionsConditions: [{ value: 'is', label: 'is' }],
    organizationRadioSelection: [{ value: 'all', label: 'All Organisation' }, { value: 'selected', label: 'Selected Organisation' }],
    designationRadioSelection: [{ value: 'all', label: 'All Designation' }, { value: 'selected', label: 'Selected Designation' }],
    servicesRadioSelection: [{ value: 'all', label: 'All Services' }, { value: 'selected', label: 'Selected Services' }],
    cadreRadioSelection: [{ value: 'all', label: 'All Cadre' }, { value: 'selected', label: 'Selected Cadre' }],
    batchRadioSelection: [{ value: 'all', label: 'All Batches' }, { value: 'selected', label: 'Selected Batches' }],
    groupsOptions: [],
    verificationStatus: [{ value: 'VERIFIED', label: 'Verified' }, { value: 'NOT-VERIFIED', label: 'Non-Verified' }],
    accessTypes: [],
    readOnly: false,
    canShowAccessTypeRadio: false,
    shouldShowVisibilityToggle: false,
    allowCustomsField: false,
    paginationLimit: 100,
  },
  usersTableConfig: {
    allLearners: USERS_TABLE,
    selectedUsers: { ...USERS_TABLE, type: 'selectedUsers', initialPaginationSize: 100, canShowPagination: false },
    bulkUploadTable: { ...USERS_TABLE, type: 'bulkUploadTable', initialPaginationSize: 100, canShowPagination: false },
  },
  bulkUploadKarmayogi: {
    uploadInstructions: [],
    downloadSampleFile: { path: '', fileName: '' },
    bulkUploadTable: { ...USERS_TABLE, type: 'bulkUploadTable' },
  },
  accessControlGuide: { summaryText: '', canShowSummaryTab: false, canShowTranscriptTab: false, instructionVideoPath: '' },
  visiblilityOnOff: { label: '', disabled: true, on: '', off: '', default: 'on' },
  userConfig: { userRoles: new Set<string>() },
  content: null,
  mdoContent: null,
  context: { type: 'spv-provider-access-settings' },
}

// tslint:disable:max-line-length
export const ACCESS_SETTINGS_ICONS: { [name: string]: string } = {
  svg_search: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M1.33301 12.6667V11.3333H7.99967V12.6667H1.33301ZM1.33301 9.33333V8H4.66634V9.33333H1.33301ZM1.33301 6V4.66667H4.66634V6H1.33301ZM13.733 12.6667L11.1663 10.1C10.8997 10.2889 10.608 10.4306 10.2913 10.525C9.97467 10.6194 9.65523 10.6667 9.33301 10.6667C8.41079 10.6667 7.62467 10.3417 6.97467 9.69167C6.32467 9.04167 5.99967 8.25556 5.99967 7.33333C5.99967 6.41111 6.32467 5.625 6.97467 4.975C7.62467 4.325 8.41079 4 9.33301 4C10.2552 4 11.0413 4.325 11.6913 4.975C12.3413 5.625 12.6663 6.41111 12.6663 7.33333C12.6663 7.65556 12.6191 7.975 12.5247 8.29167C12.4302 8.60833 12.2886 8.9 12.0997 9.16667L14.6663 11.7333L13.733 12.6667ZM9.33301 9.33333C9.88856 9.33333 10.3608 9.13889 10.7497 8.75C11.1386 8.36111 11.333 7.88889 11.333 7.33333C11.333 6.77778 11.1386 6.30556 10.7497 5.91667C10.3608 5.52778 9.88856 5.33333 9.33301 5.33333C8.77745 5.33333 8.30523 5.52778 7.91634 5.91667C7.52745 6.30556 7.33301 6.77778 7.33301 7.33333C7.33301 7.88889 7.52745 8.36111 7.91634 8.75C8.30523 9.13889 8.77745 9.33333 9.33301 9.33333Z" fill="currentColor"/></svg>',
}
// tslint:enable:max-line-length
