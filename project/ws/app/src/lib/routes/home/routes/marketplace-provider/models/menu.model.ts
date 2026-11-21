export interface IProviderMenuItem {
  id: number
  label: string
  slug: string
  disabled: boolean
  isNew?: boolean
}

export const MARKETPLACE_CONFIGURE_PROVIDERS_MENU: IProviderMenuItem[] = [
  {
    id: 1,
    label: 'Provider Details',
    slug: 'provider_details',
    disabled: false
  },
  {
    id: 2,
    label: 'Integration',
    slug: 'sso_integration',
    disabled: true
  },
  {
    id: 3,
    label: 'Course Onboarding',
    slug: 'active_courses',
    disabled: true
  },
  {
    id: 4,
    label: 'Configure Certificate',
    slug: 'configure_certificate',
    disabled: true
  },
  {
    id: 5,
    label: 'Provider Settings',
    slug: 'provider_settings',
    disabled: true
  },
  {
    id: 6,
    label: 'Access Settings',
    slug: 'access_settings',
    disabled: true,
    isNew: true,
  },
  {
    id: 7,
    label: 'Licence Notifications',
    slug: 'licence_notifications',
    disabled: true,
    isNew: true,
  },
]

export enum ProviderMenuItems {
  ProviderDetails = 'provider_details',
  SSOIntegration = 'sso_integration',
  ActiveCourses = 'active_courses',
  ConfigureCertificate = 'configure_certificate',
  ProviderSettings = 'provider_settings',
  AccessSettings = 'access_settings',
  LicenceNotifications = 'licence_notifications',
}
