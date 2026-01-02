export interface FilterNode {
  displayName: string
  count: number
  children?: FilterNode[]
  checked?: boolean
  isDisabled?: boolean
}

export interface FlatFilterNode {
  expandable: boolean
  displayName: string
  count: number
  level: number
  checked: boolean
  isDisabled: boolean
}
export interface SsoConfiguration {
  ssoId: string
  acsUrl: string
  ssoUrl: string
  status: boolean
  clientId: string
  ssoTested: boolean
  ssoTestUrl: string
  partnerName: string
  ssoProtocol: string
  configuration: string
  emailAttribute: string
  firstNameAttribute: string
  userIdAttribute: string
  lastNameAttribute: string
  isActive: boolean
  isAuthenticate: boolean
}
