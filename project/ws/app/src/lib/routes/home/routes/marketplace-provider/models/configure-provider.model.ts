// tslint:disable-next-line:interface-name
export interface FilterNode {
  displayName: string
  count: number
  children?: FilterNode[]
  checked?: boolean
  isDisabled?: boolean
}

// tslint:disable-next-line:interface-name
export interface FlatFilterNode {
  expandable: boolean
  displayName: string
  count: number
  level: number
  checked: boolean
  isDisabled: boolean
}
// tslint:disable-next-line:interface-name
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
  // tslint:disable-next-line:prefer-array-literal
  mappers?: Array<{ key: string, value: string }> | { [key: string]: string },
  includeAuthnStatement?: boolean,
  signDocuments?: boolean,
  optimizeRedirectSigningKeyLookup?: boolean,
  signAssertions?: boolean,
  signatureAlgorithm?: string,
  samlSignatureKeyName?: string,
  forcePOSTBinding?: boolean,
  encryptAssertions?: boolean,
  forceNameIdFormat?: boolean,
  clientSignatureRequired?: boolean,
  nameIdFormat?: string,
  rootUrl?: string,
  validRedirectUrls?: string[]
}
