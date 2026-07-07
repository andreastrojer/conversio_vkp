export type SanityDocumentBase = {
  _id: string
  _type: string
  _createdAt?: string
  _updatedAt?: string
}

export type SiteSettings = SanityDocumentBase & {
  _type: 'siteSettings'
  title?: string
  companyName?: string
}
