export interface IUserProfile {
  userId: string
  userName?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  rootOrgId?: string
  rootOrgName?: string
  channel?: string
  status: number // 1 = active, 0 = inactive
  roles?: string[]
  organisations?: IUserOrganisation[]
  profileDetails?: IProfileDetails
  maskedEmail?: string
  maskedPhone?: string
  identifier?: string
  isDeleted?: boolean
  sourceCreationType?: string
  createdDate?: string
  updatedDate?: string
}

export interface IUserOrganisation {
  organisationId: string
  orgName?: string
  roles?: string[]
  hashTagId?: string
  isDeleted?: boolean
}

export interface IProfileDetails {
  profileStatus?: string
  mandatoryFieldsExists?: boolean
  personalDetails?: IPersonalDetails
  professionalDetails?: IProfessionalDetails[]
  employmentDetails?: IEmploymentDetails
  additionalProperties?: IAdditionalProperties
  cadreDetails?: ICadreDetails
  verifiedKarmayogi?: boolean
  ministryOrStateOrgName?: string
}

export interface ICadreDetails {
  civilServiceTypeId?: string
  civilServiceType?: string
  civilServiceId?: string
  civilServiceName?: string
  cadreId?: string
  cadreName?: string
  cadreBatch?: number
  cadreControllingAuthorityName?: string
  isOnCentralDeputation?: boolean
}

export interface IEmploymentDetails {
  departmentName?: string
  employeeCode?: string
}

export interface IPersonalDetails {
  firstname?: string
  surname?: string
  primaryEmail?: string
  mobile?: string
  phoneVerified?: boolean
  dob?: string
  gender?: string
  category?: string
  nationality?: string
  domicileMedium?: string
  pincode?: string
  employeeCode?: string
  // Cadre / Civil Service
  isCadre?: boolean
  typeOfCivilService?: string
  serviceType?: string
  cadre?: string
  batch?: number
  cadreControllingAuthority?: string
  isOnCentralDeputation?: boolean
}

export interface IProfessionalDetails {
  designation?: string
  group?: string
  cadre?: string
  organisationType?: string
  allotmentYearOfService?: string
  dojOfService?: string
  payType?: string
  civilListNo?: string
  employeeCode?: string
  verifiedKarmayogi?: boolean
}

export interface IAdditionalProperties {
  externalSystemId?: string
  externalSystem?: string
  tag?: string[]
  [key: string]: any
}

export interface ISearchUsersRequest {
  request: {
    fields: string[]
    facets: string[]
    limit: number
    filters: { [key: string]: any }
    offset: number
  }
  query?: string
}

export interface ISearchUsersResponse {
  id: string
  result: {
    response: {
      count: number
      content: IUserProfile[]
    }
    facets?: IFacet[]
  }
}

export interface IFacet {
  name: string
  values: IFacetValue[]
}

export interface IFacetValue {
  name: string
  count: number
}

export interface IOrganization {
  orgName: string
  channel: string
  identifier?: string
  hashTagId?: string
  rootOrgId?: string
  orgId?: string
}

export type SearchType = 'name' | 'email' | 'phone' | 'userId' | 'roles' | 'maskedEmail' | 'maskedPhone'

export type UserStatus = 'active' | 'inactive' | 'all'

export interface ISearchFieldMapping {
  type: SearchType
  path: string
  label: string
  validation?: RegExp
  validationMsg?: string
}

export const SEARCH_FIELD_MAPPINGS: ISearchFieldMapping[] = [
  { type: 'name', path: 'query', label: 'Name' },
  {
    type: 'email', path: 'profileDetails.personalDetails.primaryEmail', label: 'Email',
    validation: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    validationMsg: 'Please enter a valid email address',
  },
  {
    type: 'phone', path: 'profileDetails.personalDetails.mobile', label: 'Phone Number',
    validation: /^\+?[0-9]{10,15}$/,
    validationMsg: 'Please enter a valid phone number (10-15 digits)',
  },
  { type: 'roles', path: 'organisations.roles', label: 'Roles' },
]

export const USER_STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'active', label: 'Active Users' },
  { value: 'inactive', label: 'Inactive Users' },
  { value: 'all', label: 'All Users' },
]

export interface ICreateUserPayload {
  firstName: string
  email: string
  phone: string
  channel: string
}

export interface IMigrateUserPayload {
  userId: string
  channel: string
  forceMigration: boolean
  softDeleteOldOrg: boolean
  notifyMigration: boolean
}

export interface IResetPasswordPayload {
  userId: string
  type: string
  key: string
}

export interface IPendingRequest {
  wfTransferRequest?: boolean
  wfProfileGroupRequest?: boolean
  wfProfileDesignationRequest?: boolean
}

export const EDITABLE_FIELDS = [
  { displayName: 'Name', identifier: 'firstname', path: 'profileDetails.personalDetails.firstname' },
  { displayName: 'Email', identifier: 'email', path: 'profileDetails.personalDetails.primaryEmail' },
  { displayName: 'Phone Number', identifier: 'phone', path: 'profileDetails.personalDetails.mobile' },
  { displayName: 'External System ID', identifier: 'externalSystemId', path: 'profileDetails.additionalProperties.externalSystemId' },
  { displayName: 'External System', identifier: 'externalSystem', path: 'profileDetails.additionalProperties.externalSystem' },
]
