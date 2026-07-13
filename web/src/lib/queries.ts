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

export const ABOUT_SCREEN_QUERY = defineQuery(groq`*[
  _type == "appScreen" &&
  screenKey.current == "about" &&
  isActive == true
][0]{
  title,
  "screenKey": screenKey.current,
  headline,
  subline,
  targetAudience,
  isActive,
  sections[]{
    _key,
    title,
    eyebrow,
    text,
    visibleFor,
    layout,
    sortOrder,
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
    cta{
      label,
      target,
      style,
      image{
        ...,
        "assetUrl": asset->url,
        "mimeType": asset->mimeType,
        "extension": asset->extension,
        "originalFilename": asset->originalFilename
      }
    }
  }
}`)

export const OFFER_SCREEN_QUERY = defineQuery(groq`*[
  _type == "appScreen" &&
  screenKey.current == "offer" &&
  screenType == "offer" &&
  isActive == true
][0]{
  title,
  "screenKey": screenKey.current,
  screenType,
  "purpose": contentPurpose,
  targetAudience,
  headline,
  subline,
  isActive,
  primaryCta,
  secondaryCta,
  heroImage{
    ...,
    "assetUrl": asset->url
  },
  heroMedia->{
    title,
    altText,
    mediaType,
    externalUrl,
    "fileUrl": file.asset->url,
    image{
      ...,
      "assetUrl": asset->url
    }
  },
  "sections": sections[] | order(coalesce(sortOrder, 999999) asc){
    _key,
    title,
    eyebrow,
    text,
    visibleFor,
    layout,
    sortOrder,
    image{
      ...,
      "assetUrl": asset->url
    },
    media->{
      title,
      altText,
      mediaType,
      externalUrl,
      "fileUrl": file.asset->url,
      image{
        ...,
        "assetUrl": asset->url
      }
    },
    cta{
      label,
      target,
      style,
      image{
        ...,
        "assetUrl": asset->url
      }
    }
  }
}`)

export const ABOUT_BUSINESS_MAP_QUERY = defineQuery(groq`*[
  _type == "mediaAsset" &&
  mediaType == "image" &&
  isActive != false &&
  defined(image.asset) &&
  (
    targetGroup == "b2b" ||
    targetGroup == "both" ||
    "b2b" in tags[] ||
    "gewerbe" in tags[]
  ) &&
  (
    title match "*Österreich*" ||
    title match "*Oesterreich*" ||
    title match "*Austria*" ||
    title match "*Karte*" ||
    title match "*Map*" ||
    title match "*Standort*" ||
    usage match "*Österreich*" ||
    usage match "*Oesterreich*" ||
    usage match "*Austria*" ||
    usage match "*Karte*" ||
    usage match "*Map*" ||
    usage match "*Standort*" ||
    category match "*karte*" ||
    category match "*map*" ||
    "österreich" in tags[] ||
    "oesterreich" in tags[] ||
    "austria" in tags[] ||
    "karte" in tags[] ||
    "map" in tags[] ||
    "standorte" in tags[] ||
    image.asset->originalFilename match "*Österreich*" ||
    image.asset->originalFilename match "*Oesterreich*" ||
    image.asset->originalFilename match "*Austria*" ||
    image.asset->originalFilename match "*Karte*" ||
    image.asset->originalFilename match "*Map*"
  )
] | order(_updatedAt desc, sortOrder asc)[0]{
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

export const NAVIGATION_STEPS_QUERY = defineQuery(groq`*[
  _type == "navigationStep" &&
  isActive == true
] | order(order asc){
  _id,
  title,
  "stepKey": stepKey.current,
  order,
  chapter,
  visibleFor,
  requiresCustomerType,
  showNextButton,
  showBackButton,
  screen->{
    title,
    "screenKey": screenKey.current,
    primaryCta
  }
}`)

export const ABOUT_NAVIGATION_ARROW_QUERY = defineQuery(groq`*[
  _type == "mediaAsset" &&
  mediaType == "image" &&
  isActive != false &&
  defined(image.asset) &&
  (
    key == "chapter-navigation-arrow" ||
    key.current == "chapter-navigation-arrow" ||
    assetKey == "chapter-navigation-arrow" ||
    slug.current == "chapter-navigation-arrow" ||
    category == "chapter-navigation-arrow" ||
    category == "kapitel-pfeil" ||
    title == "Kapitel Pfeil" ||
    title == "Kapitelpfeil" ||
    title == "Chapter Arrow" ||
    title match "*Kapitel*" ||
    title match "*kapitel*" ||
    usage match "*Kapitel*" ||
    usage match "*kapitel*" ||
    "chapter-navigation-arrow" in tags[] ||
    "kapitel-pfeil" in tags[] ||
    "black-arrow" in tags[]
  ) &&
  (
    title match "*Pfeil*" ||
    title match "*pfeil*" ||
    title match "*Arrow*" ||
    title match "*arrow*" ||
    usage match "*Pfeil*" ||
    usage match "*pfeil*" ||
    usage match "*Arrow*" ||
    usage match "*arrow*" ||
    category match "*pfeil*" ||
    category match "*arrow*" ||
    "pfeil" in tags[] ||
    "arrow" in tags[] ||
    "black-arrow" in tags[] ||
    image.asset->originalFilename match "*Pfeil*" ||
    image.asset->originalFilename match "*pfeil*" ||
    image.asset->originalFilename match "*Arrow*" ||
    image.asset->originalFilename match "*arrow*"
  )
] | order(_updatedAt desc, sortOrder asc)[0]{
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

export const CUSTOMER_SELECTION_PRIVATE_CTA_ICON_QUERY = defineQuery(groq`*[
  _type == "mediaAsset" &&
  mediaType == "image" &&
  isActive != false &&
  defined(image.asset) &&
  (
    targetGroup == "b2c" ||
    title match "*Privat*" ||
    title match "*privat*" ||
    usage match "*Privat*" ||
    usage match "*privat*" ||
    category match "*privat*" ||
    category match "*Privat*" ||
    "privat" in tags[] ||
    "b2c" in tags[]
  ) &&
  (
    title match "*Pfeil*" ||
    title match "*pfeil*" ||
    title match "*Arrow*" ||
    title match "*arrow*" ||
    usage match "*Pfeil*" ||
    usage match "*pfeil*" ||
    usage match "*Arrow*" ||
    usage match "*arrow*" ||
    category match "*pfeil*" ||
    category match "*arrow*" ||
    "pfeil" in tags[] ||
    "arrow" in tags[] ||
    "white-arrow" in tags[] ||
    image.asset->originalFilename match "*Pfeil*" ||
    image.asset->originalFilename match "*pfeil*" ||
    image.asset->originalFilename match "*Arrow*" ||
    image.asset->originalFilename match "*arrow*"
  )
] | order(_updatedAt desc, sortOrder asc)[0]{
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

export const CUSTOMER_SELECTION_BUSINESS_CTA_ICON_QUERY = defineQuery(groq`*[
  _type == "mediaAsset" &&
  mediaType == "image" &&
  isActive != false &&
  defined(image.asset) &&
  (
    targetGroup == "b2b" ||
    title match "*Gewerbe*" ||
    title match "*gewerbe*" ||
    title match "*Business*" ||
    title match "*business*" ||
    title match "*Schwarz*" ||
    title match "*schwarz*" ||
    title match "*Black*" ||
    title match "*black*" ||
    usage match "*Gewerbe*" ||
    usage match "*gewerbe*" ||
    usage match "*Business*" ||
    usage match "*business*" ||
    usage match "*Schwarz*" ||
    usage match "*schwarz*" ||
    usage match "*Black*" ||
    usage match "*black*" ||
    category match "*gewerbe*" ||
    category match "*business*" ||
    category match "*schwarz*" ||
    category match "*black*" ||
    "gewerbe" in tags[] ||
    "business" in tags[] ||
    "schwarz" in tags[] ||
    "black" in tags[] ||
    "black-arrow" in tags[] ||
    "b2b" in tags[]
  ) &&
  (
    title match "*Pfeil*" ||
    title match "*pfeil*" ||
    title match "*Arrow*" ||
    title match "*arrow*" ||
    usage match "*Pfeil*" ||
    usage match "*pfeil*" ||
    usage match "*Arrow*" ||
    usage match "*arrow*" ||
    category match "*pfeil*" ||
    category match "*arrow*" ||
    "pfeil" in tags[] ||
    "arrow" in tags[] ||
    "black-arrow" in tags[] ||
    image.asset->originalFilename match "*Pfeil*" ||
    image.asset->originalFilename match "*pfeil*" ||
    image.asset->originalFilename match "*Arrow*" ||
    image.asset->originalFilename match "*arrow*"
  )
] | order(_updatedAt desc, sortOrder asc)[0]{
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

export const ACCOUNT_MENU_PATTERN_QUERY = defineQuery(groq`*[
  _type == "mediaAsset" &&
  mediaType == "image" &&
  isActive != false &&
  defined(image.asset) &&
  (
    key == "account-menu-pattern" ||
    key.current == "account-menu-pattern" ||
    assetKey == "account-menu-pattern" ||
    slug.current == "account-menu-pattern" ||
    category == "account-menu-pattern" ||
    category == "profile-menu-pattern" ||
    category == "black-pattern" ||
    category == "dark-pattern" ||
    category == "schwarzes-muster" ||
    category == "dunkles-muster" ||
    category == "konto-muster" ||
    category == "profil-muster" ||
    "account-menu-pattern" in tags[] ||
    "profile-menu-pattern" in tags[] ||
    "black-pattern" in tags[] ||
    "dark-pattern" in tags[] ||
    "schwarzes-muster" in tags[] ||
    "dunkles-muster" in tags[] ||
    "konto-muster" in tags[] ||
    "profil-muster" in tags[] ||
    (
      (
        title match "*Muster*" ||
        title match "*muster*" ||
        title match "*Pattern*" ||
        title match "*pattern*" ||
        usage match "*Muster*" ||
        usage match "*muster*" ||
        usage match "*Pattern*" ||
        usage match "*pattern*" ||
        category match "*muster*" ||
        category match "*pattern*" ||
        "muster" in tags[] ||
        "pattern" in tags[]
      ) &&
      (
        title match "*Profil*" ||
        title match "*profil*" ||
        title match "*Konto*" ||
        title match "*konto*" ||
        title match "*Privat*" ||
        title match "*privat*" ||
        title match "*Conversio*" ||
        title match "*conversio*" ||
        title match "*Schwarz*" ||
        title match "*schwarz*" ||
        title match "*Black*" ||
        title match "*black*" ||
        title match "*Dunkel*" ||
        title match "*dunkel*" ||
        usage match "*Profil*" ||
        usage match "*profil*" ||
        usage match "*Konto*" ||
        usage match "*konto*" ||
        usage match "*Privat*" ||
        usage match "*privat*" ||
        usage match "*Schwarz*" ||
        usage match "*schwarz*" ||
        usage match "*Black*" ||
        usage match "*black*" ||
        usage match "*Dunkel*" ||
        usage match "*dunkel*" ||
        category match "*profil*" ||
        category match "*konto*" ||
        category match "*privat*" ||
        category match "*schwarz*" ||
        category match "*black*" ||
        category match "*dunkel*" ||
        "profil" in tags[] ||
        "konto" in tags[] ||
        "privat" in tags[] ||
        "conversio" in tags[] ||
        "schwarz" in tags[] ||
        "black" in tags[] ||
        "dunkel" in tags[]
      )
    )
  )
] | order(_updatedAt desc, sortOrder asc)[0]{
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
