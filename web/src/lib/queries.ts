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
  secondaryCta,
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

export const WELCOME_SCREEN_QUERY = defineQuery(groq`*[
  _type == "appScreen" &&
  screenKey.current == "welcome" &&
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
  secondaryCta,
  sections[]{
    _key,
    title,
    eyebrow,
    text,
    cta,
    layout,
    visibleFor,
    sortOrder,
    image
  }
}`)

export const CUSTOMER_SELECTION_SCREEN_QUERY = defineQuery(groq`*[
  _type == "appScreen" &&
  screenKey.current == "customer-selection" &&
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
  secondaryCta,
  sections[]{
    _key,
    title,
    eyebrow,
    text,
    visibleFor,
    layout,
    sortOrder,
    cta,
    image{
      ...,
      "assetUrl": asset->url,
      "mimeType": asset->mimeType,
      "extension": asset->extension,
      "originalFilename": asset->originalFilename
    },
    media->{
      title,
      altText,
      mediaType,
      image{
        ...,
        "assetUrl": asset->url,
        "mimeType": asset->mimeType,
        "extension": asset->extension,
        "originalFilename": asset->originalFilename
      }
    },
    "patternUrl": coalesce(media->image.asset->url, image.asset->url)
  }
}`)

export const CUSTOMER_SEGMENT_CONTENT_QUERY = defineQuery(groq`*[
  _type == "segmentContent" &&
  isActive == true
] | order(sortOrder asc){
  title,
  "segmentKey": segmentKey.current,
  targetGroup,
  headline,
  mainText,
  focusText,
  ctaText,
  sortOrder
}`)

export const CUSTOMER_INFO_QUESTION_SET_QUERY = defineQuery(groq`*[
  _type == "questionSet" &&
  slug.current == "customer-info" &&
  isActive == true
][0]{
  title,
  "slug": slug.current,
  introText,
  questions[]->{
    title,
    questionText,
    helpText,
    targetGroup,
    answerType,
    unit,
    placeholder,
    isRequired,
    sortOrder
  }
}`)

export const CUSTOMER_INFO_FORM_QUESTIONS_QUERY = defineQuery(groq`*[
  _type == "formQuestion" &&
  isActive == true &&
  answerType in ["name", "telefon", "email"]
] | order(sortOrder asc){
  title,
  questionText,
  helpText,
  targetGroup,
  answerType,
  unit,
  placeholder,
  isRequired,
  sortOrder
}`)

export const SITE_SETTINGS_QUERY = defineQuery(groq`*[_type == "siteSettings"][0]{
  _id,
  _type,
  title,
  companyName,
  logo{
    ...,
    "assetUrl": asset->url,
    "mimeType": asset->mimeType,
    "extension": asset->extension,
    "originalFilename": asset->originalFilename
  },
  logoDark{
    ...,
    "assetUrl": asset->url,
    "mimeType": asset->mimeType,
    "extension": asset->extension,
    "originalFilename": asset->originalFilename
  },
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

export const WELCOME_PROFILE_CHEVRON_QUERY = defineQuery(groq`*[
  _type == "mediaAsset" &&
  mediaType == "image" &&
  isActive == true &&
  defined(image.asset) &&
  (
    title == "Profilcken" ||
    title == "Profilhaken" ||
    title == "Profil Haken" ||
    title == "Profil-Haken" ||
    title == "profile-chevron" ||
    title == "welcome-profile-chevron" ||
    category == "profil-haken" ||
    category == "profile-chevron" ||
    category == "welcome-profile-chevron" ||
    "profil-haken" in tags[] ||
    "profile-chevron" in tags[] ||
    "welcome-profile-chevron" in tags[] ||
    image.asset->originalFilename match "*Profilhacken*"
  )
] | order(sortOrder asc, title asc)[0]{
  title,
  altText,
  image{
    ...,
    "assetUrl": asset->url,
    "mimeType": asset->mimeType,
    "extension": asset->extension,
    "originalFilename": asset->originalFilename
  }
}`)

export const WELCOME_PROFILE_FALLBACK_QUERY = defineQuery(groq`*[
  _type == "mediaAsset" &&
  mediaType == "image" &&
  isActive == true &&
  defined(image.asset) &&
  (
    title == "Profilcon" ||
    title == "Profilicon" ||
    title == "Welcome Profilicon" ||
    category == "welcome-profile-fallback" ||
    category == "profile-fallback" ||
    "welcome-profile-fallback" in tags[] ||
    "profile-fallback" in tags[] ||
    image.asset->originalFilename match "*Profilicon*"
  )
] | order(_updatedAt desc)[0]{
  title,
  altText,
  image{
    ...,
    "assetUrl": asset->url,
    "mimeType": asset->mimeType,
    "extension": asset->extension,
    "originalFilename": asset->originalFilename
  }
}`)

export const ACCOUNT_INFORMATION_ICON_QUERY = defineQuery(groq`*[
  _type == "mediaAsset" &&
  isActive != false &&
  defined(image.asset) &&
  (
    title == "InformationIcon" ||
    title == "Information Icon" ||
    title == "Information-Icon" ||
    title == "InfoIcon" ||
    title == "Info Icon" ||
    title == "Info-Icon" ||
    title == "information-icon" ||
    title == "info-icon" ||
    title match "*Information*" ||
    title match "*information*" ||
    title match "*Info*" ||
    title match "*info*" ||
    category == "information-icon" ||
    category == "info-icon" ||
    category == "information" ||
    category == "info" ||
    usage match "*Information*" ||
    usage match "*information*" ||
    usage match "*Info*" ||
    usage match "*info*" ||
    altText match "*Information*" ||
    altText match "*information*" ||
    altText match "*Info*" ||
    altText match "*info*" ||
    caption match "*Information*" ||
    caption match "*information*" ||
    caption match "*Info*" ||
    caption match "*info*" ||
    "information-icon" in tags[] ||
    "InformationIcon" in tags[] ||
    "info-icon" in tags[] ||
    "info" in tags[] ||
    image.asset->originalFilename match "*Information*" ||
    image.asset->originalFilename match "*information*" ||
    image.asset->originalFilename match "*Info*" ||
    image.asset->originalFilename match "*info*"
  )
] | order(_updatedAt desc)[0]{
  title,
  altText,
  image{
    ...,
    "assetUrl": asset->url,
    "mimeType": asset->mimeType,
    "extension": asset->extension,
    "originalFilename": asset->originalFilename
  }
}`)
