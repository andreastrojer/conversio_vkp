import groq from 'groq'

export const SITE_SETTINGS_QUERY = groq`*[_type == "siteSettings"][0]{
  _id,
  _type,
  title,
  companyName
}`
