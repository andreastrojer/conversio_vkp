import groq, {defineQuery} from 'groq'

export const LOGIN_SCREEN_QUERY = defineQuery(groq`*[
  _type == "appScreen" &&
  screenKey.current == "login" &&
  isActive == true
][0]{
  title,
  "screenKey": screenKey.current,
  headline,
  subline,
  heroImage,
  heroMedia->{
    title,
    altText,
    mediaType,
    image
  },
  primaryCta,
  sections[]{
    _key,
    title,
    eyebrow,
    text,
    layout,
    visibleFor,
    sortOrder,
    image
  }
}`)

export const SITE_SETTINGS_QUERY = defineQuery(groq`*[_type == "siteSettings"][0]{
  _id,
  _type,
  title,
  companyName,
  logo,
  logoDark,
  contact{
    address
  },
  legalLinks[]{
    label,
    url
  }
}`)

export const LOGIN_RIGHT_PATTERN_QUERY = defineQuery(groq`*[
  _type == "mediaAsset" &&
  mediaType == "image" &&
  isActive == true &&
  (
    key == "login-right-pattern" ||
    key.current == "login-right-pattern" ||
    assetKey == "login-right-pattern" ||
    slug.current == "login-right-pattern" ||
    category == "login-right-pattern" ||
    "login-right-pattern" in tags[] ||
    "loginRightPattern" in tags[] ||
    title == "login-right-pattern"
  )
] | order(sortOrder asc)[0]{
  title,
  altText,
  image
}`)
