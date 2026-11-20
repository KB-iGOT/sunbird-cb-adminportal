export interface ISelectionItem {
  value: string
  label: string
}

export interface IUserGroupEntity {
  value: string
  label: string
}

// The service, cadre and batch selections of a user group, which narrow what the other two of them offer
export interface ICadreSelections {
  services: string[]
  cadres: string[]
  batchYears: number[]
}

export interface ISelectionDialogData {
  entity: string
  entityLabel: string
  selected: ISelectionItem[]
  showSelected: boolean
  narrowBy: ICadreSelections
  // the user search filters of the other conditions of the group, the users a User condition offers are narrowed by them
  filters: { [key: string]: any }
  // the selections are only shown, for a group learners have enrolled through
  readOnly?: boolean
}

// A user picked in a User condition, kept with what the Users dialog shows of them
export interface IUserSelection extends ISelectionItem {
  email: string
  mobile: string
  ministry: string
}

// The conditions a partner level user group can be filtered on. Keys are the criteria keys of the access settings api.
export enum UserGroupEntity {
  User = 'user',
  Organisation = 'rootOrgId',
  Group = 'group',
  Designation = 'designation',
  VerificationStatus = 'profilestatus',
  Service = 'service',
  Cadre = 'cadre',
  Batch = 'batch',
}

// In the order the condition dropdown lists them
export const USER_GROUP_ENTITIES: IUserGroupEntity[] = [
  { value: UserGroupEntity.Organisation, label: 'Organisation' },
  { value: UserGroupEntity.Group, label: 'Group' },
  { value: UserGroupEntity.Designation, label: 'Designation' },
  { value: UserGroupEntity.Service, label: 'Service' },
  { value: UserGroupEntity.Batch, label: 'Batch' },
  { value: UserGroupEntity.Cadre, label: 'Cadre' },
  { value: UserGroupEntity.VerificationStatus, label: 'Verification Status' },
  { value: UserGroupEntity.User, label: 'User' },
]

// The keys of the user search that each condition narrows the count of a user group by
export const USER_FILTER_KEYS: { [entity: string]: string } = {
  [UserGroupEntity.User]: 'identifier',
  [UserGroupEntity.Organisation]: 'rootOrgId',
  [UserGroupEntity.Group]: 'profileDetails.professionalDetails.group',
  [UserGroupEntity.Designation]: 'profileDetails.professionalDetails.designation',
  [UserGroupEntity.VerificationStatus]: 'profileDetails.profileStatus',
  [UserGroupEntity.Service]: 'profileDetails.cadreDetails.civilServiceName',
  [UserGroupEntity.Cadre]: 'profileDetails.cadreDetails.cadreName',
  [UserGroupEntity.Batch]: 'profileDetails.cadreDetails.cadreBatch',
}

// The batch dialog groups the years by these ranges, the same as the creation portal does
export const BATCH_RANGES = [
  { label: '1960-1990', start: 1960, end: 1990 },
  { label: '1991-2020', start: 1991, end: 2020 },
  { label: '2021-2025', start: 2021, end: 2025 },
]

// Laid out the way the creation portal lays them out: a bar of letters or batch ranges above columns that scroll sideways
export const COLUMN_LAYOUT_ENTITIES: string[] = [
  UserGroupEntity.Organisation, UserGroupEntity.Designation, UserGroupEntity.Service, UserGroupEntity.Cadre, UserGroupEntity.Batch,
]

// The most a User, Organisation or Designation condition selects, the cap the creation portal puts on organisations
export const MAX_SELECTIONS = 500
// How many user groups a provider can have when marcket_place.json gives no access_settings.allowGroupLimit
export const DEFAULT_USER_GROUP_LIMIT = 5
// What the info icon of the Unaudited licences tile says when marcket_place.json gives no access_settings.unauditedlicencesinfo
export const DEFAULT_UNAUDITED_LICENCES_INFO = 'Due to a switch of the enrolment check preference, these licence consumptions '
  + 'aren\'t tracked against the user groups set earlier in SPV.'
// What it says while there are none, when marcket_place.json gives no access_settings.unauditedlicenceszeroinfo
export const DEFAULT_UNAUDITED_LICENCES_ZERO_INFO = 'Licences consumed but not recorded against any user group: enrolments '
  + 'while the preference was No, or enrolments that couldn\'t be recorded against a group while settings were being saved.'
export const LIMITED_SELECTION_ENTITIES: string[] = [UserGroupEntity.User, UserGroupEntity.Organisation, UserGroupEntity.Designation]

// The Service dialog lists the services of every type until one type is picked
export const ALL_SERVICES = 'All Services'

// One slice of the Partner Licence Distribution bar
export interface IDistributionSegment {
  name: string
  licences: number
  // share of the over all limit, one decimal
  percent: string
  // share of the bar
  width: number
  colour: string
}

export const ENROLMENT_CHECK_OPTIONS: { value: boolean, title: string, description: string, summary: string }[] = [
  {
    value: true,
    title: 'Yes',
    description: 'Learners must match a user group set here before the course\'s own rules are checked.',
    summary: 'Yes — provider-level access settings',
  },
  {
    value: false,
    title: 'No',
    description: 'Only each course\'s user groups in the Content Portal are checked. User groups can\'t be created here.',
    summary: 'No — each course\'s user groups in the Content Portal',
  },
]

export interface IUserGroupState {
  // the userGroupId the api gives a saved group, none until the group is saved
  id?: string
  name: string
  licences: number
  consumed: number
  conditions: { entity: string, selections: ISelectionItem[] }[]
}

export interface IAccessSettingsState {
  checksEnrolmentHere: boolean | null
  userGroups: IUserGroupState[]
}

// A user group keeps its colour in the distribution bar by its position
export const USER_GROUP_COLOURS = [
  '#1b4ca1', '#f59a38', '#35a08e', '#7b5ea7', '#d1495b', '#8c6d46', '#2f9fd0', '#6b7280',
]

export const VERIFICATION_STATUS_OPTIONS: ISelectionItem[] = [
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'NOT-VERIFIED', label: 'Non-Verified' },
]

// The cadre config (data/v2/system/settings/get/cadreConfig) the Service, Cadre and Batch conditions are listed from
export interface ICadre {
  id: string
  name: string
  startBatchYear: number
  endBatchYear: number
}

export interface ICivilService {
  id: string
  name: string
  commonBatchStartYear: number
  commonBatchEndYear: number
  cadreList?: ICadre[]
}

// A State Service type groups its services one level deeper, per state
export interface ICivilServiceState {
  id: string
  name: string
  displayName?: string
  serviceList?: ICivilService[]
}

export interface ICivilServiceType {
  id: string
  name: string
  // present on the central and all india types
  serviceList?: ICivilService[]
  // present on the State Service type instead of serviceList
  states?: ICivilServiceState[]
}

// A service or a cadre of the config
export interface IConfigItem {
  id: string
  name: string
}

export const ACCESS_SETTINGS_ICON_RESTART = 'access_restart'
export const ACCESS_SETTINGS_ICON_SEARCH_SELECTIONS = 'access_search_selections'

// tslint:disable:max-line-length
export const ACCESS_SETTINGS_ICONS: { [name: string]: string } = {
  [ACCESS_SETTINGS_ICON_RESTART]: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11 20.952C8.98333 20.702 7.3125 19.8228 5.9875 18.3145C4.6625 16.8061 4 15.0353 4 13.002C4 11.902 4.21667 10.8478 4.65 9.83945C5.08333 8.83112 5.7 7.95195 6.5 7.20195L7.925 8.62695C7.29167 9.19362 6.8125 9.85195 6.4875 10.602C6.1625 11.352 6 12.152 6 13.002C6 14.4686 6.46667 15.7645 7.4 16.8895C8.33333 18.0145 9.53333 18.702 11 18.952V20.952ZM13 20.952V18.952C14.45 18.6853 15.6458 17.9936 16.5875 16.877C17.5292 15.7603 18 14.4686 18 13.002C18 11.3353 17.4167 9.91862 16.25 8.75195C15.0833 7.58529 13.6667 7.00195 12 7.00195H11.925L13.025 8.10195L11.625 9.50195L8.125 6.00195L11.625 2.50195L13.025 3.90195L11.925 5.00195H12C14.2333 5.00195 16.125 5.77695 17.675 7.32695C19.225 8.87695 20 10.7686 20 13.002C20 15.0186 19.3375 16.7811 18.0125 18.2895C16.6875 19.7978 15.0167 20.6853 13 20.952Z" fill="black" fill-opacity="0.6"/></svg>',
  [ACCESS_SETTINGS_ICON_SEARCH_SELECTIONS]: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M1.33301 12.6667V11.3333H7.99967V12.6667H1.33301ZM1.33301 9.33333V8H4.66634V9.33333H1.33301ZM1.33301 6V4.66667H4.66634V6H1.33301ZM13.733 12.6667L11.1663 10.1C10.8997 10.2889 10.608 10.4306 10.2913 10.525C9.97467 10.6194 9.65523 10.6667 9.33301 10.6667C8.41079 10.6667 7.62467 10.3417 6.97467 9.69167C6.32467 9.04167 5.99967 8.25556 5.99967 7.33333C5.99967 6.41111 6.32467 5.625 6.97467 4.975C7.62467 4.325 8.41079 4 9.33301 4C10.2552 4 11.0413 4.325 11.6913 4.975C12.3413 5.625 12.6663 6.41111 12.6663 7.33333C12.6663 7.65556 12.6191 7.975 12.5247 8.29167C12.4302 8.60833 12.2886 8.9 12.0997 9.16667L14.6663 11.7333L13.733 12.6667ZM9.33301 9.33333C9.88856 9.33333 10.3608 9.13889 10.7497 8.75C11.1386 8.36111 11.333 7.88889 11.333 7.33333C11.333 6.77778 11.1386 6.30556 10.7497 5.91667C10.3608 5.52778 9.88856 5.33333 9.33301 5.33333C8.77745 5.33333 8.30523 5.52778 7.91634 5.91667C7.52745 6.30556 7.33301 6.77778 7.33301 7.33333C7.33301 7.88889 7.52745 8.36111 7.91634 8.75C8.30523 9.13889 8.77745 9.33333 9.33301 9.33333Z" fill="currentColor"/></svg>',
}
// tslint:enable:max-line-length
