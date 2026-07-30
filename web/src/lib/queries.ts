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

export const ABOUT_SCREEN_QUERY = defineQuery(groq`coalesce(
  *[_type == "appScreen" && screenType == "about" && targetAudience == $customerType && isActive == true][0],
  *[_type == "appScreen" && screenType == "about" && targetAudience == "both" && isActive == true][0],
  *[_type == "appScreen" && screenType == "about" && isActive == true][0]
){
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

export const OFFER_SCREEN_QUERY = defineQuery(groq`coalesce(
  *[_type == "appScreen" && screenType == $screenType && targetAudience == $customerType && isActive == true][0],
  *[_type == "appScreen" && screenType == $screenType && targetAudience == "both" && isActive == true][0],
  *[_type == "appScreen" && screenType == $screenType && isActive == true][0]
){
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
  productBottomNavigation[]{
    _key,
    itemType,
    label,
    screenKey,
    product->{
      _id,
      title,
      "slug": slug.current,
      navigationLabel,
      targetGroup,
      isActive
    }
  },
  "productNavigationAssets": *[
    _type == "mediaAsset" &&
    mediaType == "image" &&
    isActive != false &&
    title in [
      "Linker Nav Pfeil",
      "Rechter Nav Pfeil",
      "Linker Navbutton",
      "Linker Navbutton 2"
    ]
  ] | order(coalesce(sortOrder, 999999) asc, _createdAt asc){
    title,
    image{
      ...,
      "assetUrl": asset->url,
      "mimeType": asset->mimeType,
      "extension": asset->extension,
      "originalFilename": asset->originalFilename
    }
  },
  "hotspotExpandedMedia": *[
    _type == "mediaAsset" &&
    mediaType == "image" &&
    isActive != false &&
    lower(title) match "*aufklapp*pfeil*"
  ] | order(coalesce(sortOrder, 999999) asc, _createdAt asc)[0]{
    title,
    altText,
    mediaType,
    externalUrl,
    "fileUrl": file.asset->url,
    image{
      ...,
      "assetUrl": asset->url,
      "mimeType": asset->mimeType,
      "extension": asset->extension,
      "originalFilename": asset->originalFilename
    }
  },
  "interplayMarkerMedia": *[
    _type == "mediaAsset" &&
    mediaType == "image" &&
    isActive != false &&
    lower(title) match "stichpunkte pfeil*"
  ] | order(coalesce(sortOrder, 999999) asc, _createdAt asc)[0]{
    title,
    altText,
    mediaType,
    externalUrl,
    "fileUrl": file.asset->url,
    image{
      ...,
      "assetUrl": asset->url,
      "mimeType": asset->mimeType,
      "extension": asset->extension,
      "originalFilename": asset->originalFilename
    }
  },
  b2cHouseConfig{
    backgroundMedia->{
      title,
      altText,
      mediaType,
      externalUrl,
      "fileUrl": file.asset->url,
      image{
        ...,
        "assetUrl": asset->url,
        "mimeType": asset->mimeType,
        "extension": asset->extension,
        "originalFilename": asset->originalFilename
      }
    },
    defaultHotspotMedia->{
      title,
      altText,
      mediaType,
      externalUrl,
      "fileUrl": file.asset->url,
      image{
        ...,
        "assetUrl": asset->url,
        "mimeType": asset->mimeType,
        "extension": asset->extension,
        "originalFilename": asset->originalFilename
      }
    },
    "hotspots": hotspots[
      isActive != false &&
      defined(product._ref)
    ] | order(coalesce(sortOrder, 999999) asc){
      _key,
      label,
      xPercent,
      yPercent,
      sortOrder,
      isActive,
      media->{
        title,
        altText,
        mediaType,
        externalUrl,
        "fileUrl": file.asset->url,
        image{
          ...,
          "assetUrl": asset->url,
          "mimeType": asset->mimeType,
          "extension": asset->extension,
          "originalFilename": asset->originalFilename
        }
      },
      product->{
        _id,
        title,
        "slug": slug.current,
        targetGroup,
        isActive,
        detailTitle,
        navigationLabel,
        b2cDetailConfig{
          isEnabled,
          overlayOpacity,
          backgroundMedia->{
            title,
            altText,
            mediaType,
            externalUrl,
            "fileUrl": file.asset->url,
            image{
              ...,
              "assetUrl": asset->url,
              "mimeType": asset->mimeType,
              "extension": asset->extension,
              "originalFilename": asset->originalFilename
            }
          },
          processMarkerMedia->{
            title,
            altText,
            mediaType,
            externalUrl,
            "fileUrl": file.asset->url,
            image{
              ...,
              "assetUrl": asset->url,
              "mimeType": asset->mimeType,
              "extension": asset->extension,
              "originalFilename": asset->originalFilename
            }
          },
          benefitMarkerMedia->{
            title,
            altText,
            mediaType,
            externalUrl,
            "fileUrl": file.asset->url,
            image{
              ...,
              "assetUrl": asset->url,
              "mimeType": asset->mimeType,
              "extension": asset->extension,
              "originalFilename": asset->originalFilename
            }
          }
        },
        detailTabs[
          isActive != false &&
          key in ["overview", "functions", "interplay"]
        ]{
          _key,
          title,
          key,
          isActive,
          contentTitle,
          introText,
          contentItemsTitle,
          contentItems[isActive != false]{
            _key,
            title,
            text,
            isActive
          },
          "functionSteps": functionSteps[isActive != false] | order(
            coalesce(sortOrder, 999999) asc,
            stepNumber asc
          ){
            _key,
            stepNumber,
            title,
            text,
            sortOrder,
            isActive
          },
          functionNavigation{
            visibleSteps,
            stepMarkerMedia->{
              title,
              altText,
              mediaType,
              externalUrl,
              "fileUrl": file.asset->url,
              image{
                ...,
                "assetUrl": asset->url,
                "mimeType": asset->mimeType,
                "extension": asset->extension,
                "originalFilename": asset->originalFilename
              }
            },
            upArrowMedia->{
              title,
              altText,
              mediaType,
              externalUrl,
              "fileUrl": file.asset->url,
              image{
                ...,
                "assetUrl": asset->url,
                "mimeType": asset->mimeType,
                "extension": asset->extension,
                "originalFilename": asset->originalFilename
              }
            },
            downArrowMedia->{
              title,
              altText,
              mediaType,
              externalUrl,
              "fileUrl": file.asset->url,
              image{
                ...,
                "assetUrl": asset->url,
                "mimeType": asset->mimeType,
                "extension": asset->extension,
                "originalFilename": asset->originalFilename
              }
            }
          },
          "sections": sections[isActive != false] | order(
            coalesce(sortOrder, 999999) asc
          ){
            _key,
            title,
            stepNumber,
            text,
            sortOrder,
            isActive
          }
        }
      }
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

export const B2C_PRODUCT_DETAILS_QUERY = defineQuery(groq`*[
  _type == "productCategory" &&
  isActive == true &&
  targetGroup in ["b2c", "both"] &&
  b2cDetailConfig.isEnabled == true
]{
  _id,
  title,
  "slug": slug.current,
  targetGroup,
  isActive,
  detailTitle,
  navigationLabel,
  b2cDetailConfig{
    isEnabled,
    overlayOpacity,
    backgroundMedia->{
      title,
      altText,
      mediaType,
      externalUrl,
      "fileUrl": file.asset->url,
      image{
        ...,
        "assetUrl": asset->url,
        "mimeType": asset->mimeType,
        "extension": asset->extension,
        "originalFilename": asset->originalFilename
      }
    },
    processMarkerMedia->{
      title,
      altText,
      mediaType,
      externalUrl,
      "fileUrl": file.asset->url,
      image{
        ...,
        "assetUrl": asset->url,
        "mimeType": asset->mimeType,
        "extension": asset->extension,
        "originalFilename": asset->originalFilename
      }
    },
    benefitMarkerMedia->{
      title,
      altText,
      mediaType,
      externalUrl,
      "fileUrl": file.asset->url,
      image{
        ...,
        "assetUrl": asset->url,
        "mimeType": asset->mimeType,
        "extension": asset->extension,
        "originalFilename": asset->originalFilename
      }
    }
  },
  detailTabs[
    isActive != false &&
    key in ["overview", "functions", "interplay"]
  ]{
    _key,
    title,
    key,
    isActive,
    contentTitle,
    introText,
    contentItemsTitle,
    contentItems[isActive != false]{
      _key,
      title,
      text,
      isActive
    },
    "functionSteps": functionSteps[isActive != false] | order(
      coalesce(sortOrder, 999999) asc,
      stepNumber asc
    ){
      _key,
      stepNumber,
      title,
      text,
      sortOrder,
      isActive
    },
    functionNavigation{
      visibleSteps,
      stepMarkerMedia->{
        title,
        altText,
        mediaType,
        externalUrl,
        "fileUrl": file.asset->url,
        image{
          ...,
          "assetUrl": asset->url,
          "mimeType": asset->mimeType,
          "extension": asset->extension,
          "originalFilename": asset->originalFilename
        }
      },
      upArrowMedia->{
        title,
        altText,
        mediaType,
        externalUrl,
        "fileUrl": file.asset->url,
        image{
          ...,
          "assetUrl": asset->url,
          "mimeType": asset->mimeType,
          "extension": asset->extension,
          "originalFilename": asset->originalFilename
        }
      },
      downArrowMedia->{
        title,
        altText,
        mediaType,
        externalUrl,
        "fileUrl": file.asset->url,
        image{
          ...,
          "assetUrl": asset->url,
          "mimeType": asset->mimeType,
          "extension": asset->extension,
          "originalFilename": asset->originalFilename
        }
      }
    },
    "sections": sections[isActive != false] | order(
      coalesce(sortOrder, 999999) asc
    ){
      _key,
      title,
      stepNumber,
      text,
      sortOrder,
      isActive
    }
  }
}`)

export const PROCESS_SCREEN_QUERY = defineQuery(groq`*[
  _type == "appScreen" &&
  screenKey.current == $screenKey &&
  screenType == "process" &&
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
  heroImage2{
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

export const SCENARIO_MATRIX_PAGE_QUERY = defineQuery(groq`coalesce(
  *[
    _type == "appScreen" &&
    screenType == "scenarioMatrix" &&
    targetAudience == $customerType &&
    isActive == true
  ] | order(coalesce(sortOrder, 999999) asc)[0],
  *[
    _type == "appScreen" &&
    screenKey.current == "scenario-matrix" &&
    targetAudience == $customerType &&
    isActive == true
  ] | order(coalesce(sortOrder, 999999) asc)[0],
  *[
    _type == "appScreen" &&
    screenType == "scenarioMatrix" &&
    targetAudience == "both" &&
    isActive == true
  ] | order(coalesce(sortOrder, 999999) asc)[0],
  *[
    _type == "appScreen" &&
    screenKey.current == "scenario-matrix" &&
    targetAudience == "both" &&
    isActive == true
  ] | order(coalesce(sortOrder, 999999) asc)[0],
  *[
    _type == "appScreen" &&
    screenType == "scenarioMatrix" &&
    isActive == true
  ] | order(coalesce(sortOrder, 999999) asc)[0],
  *[
    _type == "appScreen" &&
    screenKey.current == "scenario-matrix" &&
    isActive == true
  ] | order(coalesce(sortOrder, 999999) asc)[0]
){
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
    "assetUrl": asset->url,
    "mimeType": asset->mimeType,
    "extension": asset->extension,
    "originalFilename": asset->originalFilename
  },
  heroImage2{
    ...,
    "assetUrl": asset->url,
    "mimeType": asset->mimeType,
    "extension": asset->extension,
    "originalFilename": asset->originalFilename
  },
  heroMedia->{
    title,
    altText,
    mediaType,
    externalUrl,
    "fileUrl": file.asset->url,
    image{
      ...,
      "assetUrl": asset->url,
      "mimeType": asset->mimeType,
      "extension": asset->extension,
      "originalFilename": asset->originalFilename
    }
  },
  calculatorConfig{
    calculatorTabLabel,
    bundleTabLabel,
    calculateButtonLabel,
    sliders[]{
      _key,
      label,
      key,
      min,
      max,
      step,
      defaultValue,
      unit
    },
    resultMetrics[]->{
      _id,
      title,
      "metricKey": metricKey.current,
      targetGroup,
      metricType,
      unit,
      displayType,
      description,
      sortOrder,
      isActive
    },
    calculationParameters[]{
      _key,
      key,
      label,
      value,
      unit
    },
    bundleScenarios[]->{
      _id,
      title,
      "slug": slug.current,
      targetGroup,
      scenarioType,
      shortDescription,
      description,
      resultText,
      nextStepText,
      bundleImage{
        ...,
        "assetUrl": asset->url,
        "mimeType": asset->mimeType,
        "extension": asset->extension,
        "originalFilename": asset->originalFilename
      },
      bundleImageAlt,
      sortOrder,
      isActive,
      includedItems[]{
        _key,
        amount,
        label
      },
      recommendedCategories[]->{
        _id,
        title,
        "slug": slug.current,
        navigationLabel
      },
      comparisonValues[]{
        _key,
        value,
        note,
        metric->{
          _id,
          title,
          "metricKey": metricKey.current,
          metricType,
          unit,
          displayType,
          sortOrder,
          isActive
        }
      }
    }
  },
  "sharedCalculationParameters": *[
    _type == "appScreen" &&
    screenType == "scenarioMatrix" &&
    targetAudience == "b2c" &&
    isActive == true
  ] | order(coalesce(sortOrder, 999999) asc)[0].calculatorConfig.calculationParameters[]{
    _key,
    key,
    label,
    value,
    unit
  },
  "fallbackBundleScenarios": *[
    _type == "scenario" &&
    isActive != false &&
    (!defined(targetGroup) || targetGroup in [$customerType, "both"])
  ] | order(coalesce(sortOrder, 999999) asc){
    _id,
    title,
    "slug": slug.current,
    targetGroup,
    scenarioType,
    shortDescription,
    description,
    resultText,
    nextStepText,
    bundleImage{
      ...,
      "assetUrl": asset->url,
      "mimeType": asset->mimeType,
      "extension": asset->extension,
      "originalFilename": asset->originalFilename
    },
    bundleImageAlt,
    sortOrder,
    isActive,
    includedItems[]{
      _key,
      amount,
      label
    },
    recommendedCategories[]->{
      _id,
      title,
      "slug": slug.current,
      navigationLabel
    },
    comparisonValues[]{
      _key,
      value,
      note,
      metric->{
        _id,
        title,
        "metricKey": metricKey.current,
        metricType,
        unit,
        displayType,
        sortOrder,
        isActive
      }
    }
  },
  "offerSections": *[
    _type == "appScreen" &&
    screenType == "offer" &&
    isActive == true &&
    targetAudience == $customerType
  ] | order(coalesce(sortOrder, 999999) asc)[0].sections[]{
    _key,
    title,
    eyebrow,
    visibleFor,
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
    }
  },
  "b2cOfferSections": *[
    _type == "appScreen" &&
    screenType == "offer" &&
    isActive == true &&
    targetAudience == "b2c"
  ] | order(coalesce(sortOrder, 999999) asc)[0].sections[]{
    _key,
    title,
    eyebrow,
    visibleFor,
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
    }
  }
}`)

export const NEXT_STEP_PAGE_QUERY = defineQuery(groq`{
  "screen": coalesce(
    *[
      _type == "appScreen" &&
      screenType == "documentSelection" &&
      targetAudience == $customerType &&
      isActive == true
    ] | order(coalesce(sortOrder, 999999) asc)[0],
    *[
      _type == "appScreen" &&
      screenKey.current == "next-step" &&
      targetAudience == $customerType &&
      isActive == true
    ] | order(coalesce(sortOrder, 999999) asc)[0],
    *[
      _type == "appScreen" &&
      screenType == "documentSelection" &&
      targetAudience == "both" &&
      isActive == true
    ] | order(coalesce(sortOrder, 999999) asc)[0],
    *[
      _type == "appScreen" &&
      screenKey.current == "next-step" &&
      targetAudience == "both" &&
      isActive == true
    ] | order(coalesce(sortOrder, 999999) asc)[0],
    *[
      _type == "appScreen" &&
      screenType == "documentSelection" &&
      isActive == true
    ] | order(coalesce(sortOrder, 999999) asc)[0]
  ){
    title,
    "screenKey": screenKey.current,
    screenType,
    targetAudience,
    headline,
    subline,
    isActive,
    primaryCta,
    heroImage{
      ...,
      "assetUrl": asset->url,
      "mimeType": asset->mimeType,
      "extension": asset->extension,
      "originalFilename": asset->originalFilename
    },
    heroImage2{
      ...,
      "assetUrl": asset->url,
      "mimeType": asset->mimeType,
      "extension": asset->extension,
      "originalFilename": asset->originalFilename
    },
    heroMedia->{
      title,
      altText,
      mediaType,
      externalUrl,
      "fileUrl": file.asset->url,
      image{
        ...,
        "assetUrl": asset->url,
        "mimeType": asset->mimeType,
        "extension": asset->extension,
        "originalFilename": asset->originalFilename
      }
    },
    documentSelectionConfig{
      documentsHeadline,
      emailLabel,
      sendButtonLabel,
      emptyDocumentsText,
      emailTemplate->{
        _id,
        title,
        subject,
        body,
        signatureHint
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
        "assetUrl": asset->url,
        "mimeType": asset->mimeType,
        "extension": asset->extension,
        "originalFilename": asset->originalFilename
      },
      selectionCardBackground{
        ...,
        "assetUrl": asset->url,
        "mimeType": asset->mimeType,
        "extension": asset->extension,
        "originalFilename": asset->originalFilename
      },
      selectionCardBackground2{
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
        externalUrl,
        "fileUrl": file.asset->url,
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
  },
  "defaultEmailTemplate": *[
    _type == "emailTemplate" &&
    isActive != false &&
    templateType == "customer" &&
    (!defined(targetGroup) || targetGroup in [$customerType, "both"])
  ] | order(coalesce(sortOrder, 999999) asc)[0]{
    _id,
    title,
    subject,
    body,
    signatureHint
  }
}`)

export const NEXT_STEP_SCENARIO_DOCUMENT_CATEGORIES_QUERY = defineQuery(groq`*[
  _type == "scenario" &&
  _id == $scenarioId &&
  isActive != false &&
  (!defined(targetGroup) || targetGroup in [$customerType, "both"])
][0]{
  _id,
  title,
  "slug": slug.current,
  targetGroup,
  scenarioType,
  recommendedCategories[]->{
    _id,
    title,
    navigationLabel,
    "slug": slug.current,
    categoryType,
    targetGroup,
    isActive,
    sortOrder,
    "documents": documents[]->[
      isActive != false &&
      status == "active" &&
      (!defined(targetGroup) || targetGroup in [$customerType, "both"]) &&
      (!defined(scenarios[0]) || $scenarioId in scenarios[]._ref) &&
      defined(pdfFile.asset)
    ] | order(coalesce(sortOrder, 999999) asc){
      _id,
      title,
      description,
      documentType,
      targetGroup,
      status,
      isActive,
      version,
      sortOrder,
      "scenarioIds": scenarios[]._ref,
      "pdfUrl": pdfFile.asset->url,
      "pdfMimeType": pdfFile.asset->mimeType,
      "pdfOriginalFilename": pdfFile.asset->originalFilename
    },
    "referencedDocuments": *[
      _type == "salesDocument" &&
      references(^._id) &&
      isActive != false &&
      status == "active" &&
      (!defined(targetGroup) || targetGroup in [$customerType, "both"]) &&
      (!defined(scenarios[0]) || $scenarioId in scenarios[]._ref) &&
      defined(pdfFile.asset)
    ] | order(coalesce(sortOrder, 999999) asc){
      _id,
      title,
      description,
      documentType,
      targetGroup,
      status,
      isActive,
      version,
      sortOrder,
      "scenarioIds": scenarios[]._ref,
      "pdfUrl": pdfFile.asset->url,
      "pdfMimeType": pdfFile.asset->mimeType,
      "pdfOriginalFilename": pdfFile.asset->originalFilename
    }
  }
}`)

export const NEXT_STEP_EMAIL_TEMPLATE_QUERY = defineQuery(groq`{
  "screenTemplate": coalesce(
    *[
      _type == "appScreen" &&
      screenType == "documentSelection" &&
      targetAudience == $customerType &&
      isActive == true
    ] | order(coalesce(sortOrder, 999999) asc)[0].documentSelectionConfig.emailTemplate->,
    *[
      _type == "appScreen" &&
      screenKey.current == "next-step" &&
      targetAudience == $customerType &&
      isActive == true
    ] | order(coalesce(sortOrder, 999999) asc)[0].documentSelectionConfig.emailTemplate->,
    *[
      _type == "appScreen" &&
      screenType == "documentSelection" &&
      targetAudience == "both" &&
      isActive == true
    ] | order(coalesce(sortOrder, 999999) asc)[0].documentSelectionConfig.emailTemplate->,
    *[
      _type == "appScreen" &&
      screenKey.current == "next-step" &&
      targetAudience == "both" &&
      isActive == true
    ] | order(coalesce(sortOrder, 999999) asc)[0].documentSelectionConfig.emailTemplate->,
    *[
      _type == "appScreen" &&
      screenType == "documentSelection" &&
      isActive == true
    ] | order(coalesce(sortOrder, 999999) asc)[0].documentSelectionConfig.emailTemplate->
  ){
    _id,
    title,
    subject,
    body,
    signatureHint,
    includeSignature
  },
  "defaultTemplate": *[
    _type == "emailTemplate" &&
    isActive != false &&
    templateType == "customer" &&
    (!defined(targetGroup) || targetGroup in [$customerType, "both"])
  ] | order(coalesce(sortOrder, 999999) asc)[0]{
    _id,
    title,
    subject,
    body,
    signatureHint,
    includeSignature
  }
}`)

export const WHAT_FITS_PAGE_QUERY = defineQuery(groq`{
  "screen": *[
    _type == "appScreen" &&
    screenType == "whatfits" &&
    isActive == true &&
    targetAudience == $customerType
  ] | order(coalesce(sortOrder, 999999) asc)[0]{
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
      "assetUrl": asset->url,
      "mimeType": asset->mimeType,
      "extension": asset->extension,
      "originalFilename": asset->originalFilename
    },
    heroMedia->{
      title,
      altText,
      mediaType,
      externalUrl,
      "fileUrl": file.asset->url,
      image{
        ...,
        "assetUrl": asset->url,
        "mimeType": asset->mimeType,
        "extension": asset->extension,
        "originalFilename": asset->originalFilename
      }
    },
    productBottomNavigation[]{
      ...,
      "slug": slug.current,
      "screenKey": screenKey.current,
      iconImage{
        ...,
        "assetUrl": asset->url,
        "mimeType": asset->mimeType,
        "extension": asset->extension,
        "originalFilename": asset->originalFilename
      },
      product->{
        _id,
        title,
        "slug": slug.current,
        navigationLabel,
        isActive
      }
    }
  },
  "products": *[
    _type == "productCategory" &&
    isActive == true &&
    _id in (
      *[
        _type == "appScreen" &&
        screenType == "whatfits" &&
        isActive == true &&
        targetAudience == $customerType
      ] | order(coalesce(sortOrder, 999999) asc)[0].productBottomNavigation[].product._ref
    )
  ] | order(coalesce(sortOrder, 999999) asc){
    _id,
    title,
    "slug": slug.current,
    categoryType,
    targetGroup,
    catalogLabel,
    catalogCtaLabel,
    sortOrder,
    isActive,
    catalogImage{
      ...,
      "assetUrl": asset->url,
      "mimeType": asset->mimeType,
      "extension": asset->extension,
      "originalFilename": asset->originalFilename
    },
    catalogMedia->{
      title,
      altText,
      mediaType,
      externalUrl,
      "fileUrl": file.asset->url,
      image{
        ...,
        "assetUrl": asset->url,
        "mimeType": asset->mimeType,
        "extension": asset->extension,
        "originalFilename": asset->originalFilename
      }
    },
    detailTitle,
    navigationLabel,
    detailImage{
      ...,
      "assetUrl": asset->url,
      "mimeType": asset->mimeType,
      "extension": asset->extension,
      "originalFilename": asset->originalFilename
    },
    detailMedia->{
      title,
      altText,
      mediaType,
      externalUrl,
      "fileUrl": file.asset->url,
      image{
        ...,
        "assetUrl": asset->url,
        "mimeType": asset->mimeType,
        "extension": asset->extension,
        "originalFilename": asset->originalFilename
      }
    },
    detailTabs[]{
      _key,
      title,
      key,
      isActive,
      contentTitle,
      introText,
      contentItemsTitle,
      contentItems[]{
        _key,
        title,
        text,
        isActive
      },
      sections[]{
        _key,
        title,
        text,
        specificationRows[]{
          _key,
          label,
          value
        },
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
          externalUrl,
          "fileUrl": file.asset->url,
          image{
            ...,
            "assetUrl": asset->url,
            "mimeType": asset->mimeType,
            "extension": asset->extension,
            "originalFilename": asset->originalFilename
          }
        },
        isActive
      }
    },
    modelSeriesTitle,
    modelGroupLabels,
    "models": models[]-> | order(coalesce(modelGroupOrder, 999999) asc, coalesce(sortOrder, 999999) asc){
      _id,
      title,
      cardTitle,
      "slug": slug.current,
      seriesLabel,
      coolingType,
      modelGroupOrder,
      sortOrder,
      isActive,
      image{
        ...,
        "assetUrl": asset->url,
        "mimeType": asset->mimeType,
        "extension": asset->extension,
        "originalFilename": asset->originalFilename
      },
      selectionCardBackground{
        ...,
        "assetUrl": asset->url,
        "mimeType": asset->mimeType,
        "extension": asset->extension,
        "originalFilename": asset->originalFilename
      },
      selectionCardBackground2{
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
        externalUrl,
        "fileUrl": file.asset->url,
        image{
          ...,
          "assetUrl": asset->url,
          "mimeType": asset->mimeType,
          "extension": asset->extension,
          "originalFilename": asset->originalFilename
        }
      },
      detailTabs[]{
        _key,
        title,
        key,
        isActive,
        introText,
        contentItems[]{
          _key,
          title,
          text,
          isActive
        },
        sections[]{
          _key,
          title,
          text,
          specificationRows[]{
            _key,
            label,
            value
          },
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
            externalUrl,
            "fileUrl": file.asset->url,
            image{
              ...,
              "assetUrl": asset->url,
              "mimeType": asset->mimeType,
              "extension": asset->extension,
              "originalFilename": asset->originalFilename
            }
          },
          isActive
        }
      }
    }
  },
  "bottomNavigation": *[
    _type == "productBottomNavigation" &&
    isActive != false
  ] | order(coalesce(sortOrder, order, 999999) asc){
    ...,
    "slug": slug.current,
    "screenKey": screenKey.current,
    items[]{
      ...,
      "slug": slug.current,
      "screenKey": screenKey.current,
      product->{
        _id,
        title,
        "slug": slug.current,
        navigationLabel,
        isActive
      }
    },
    product->{
      _id,
      title,
      "slug": slug.current,
      navigationLabel,
      isActive
    }
  },
  "matrixStep": *[
    _type == "navigationStep" &&
    isActive == true &&
    chapter == "matrix" &&
    (!defined(visibleFor) || visibleFor in [$customerType, "both"])
  ] | order(coalesce(order, 999999) asc)[0]{
    title,
    "stepKey": stepKey.current,
    order,
    screen->{
      title,
      "screenKey": screenKey.current
    }
  },
  "productNavigationAssets": *[
    _type == "mediaAsset" &&
    mediaType == "image" &&
    isActive != false &&
    (
      title in [
        "Linker Nav Pfeil",
        "Rechter Nav Pfeil",
        "Linker Navbutton",
        "Linker Navbutton 2",
        "Buttonpfeil",
        "orangene card",
        "graue card",
        "Katalogdetailpunktorange",
        "Schwarzer Kachel",
        "Schwarze Kachel",
        "Katalogdetailpunktweiß",
        "Katalogdetailpunktweiss",
        "Modellgruppe Tauchgekühlt",
        "Modellgruppe Tauchgekuehlt",
        "Modellgruppe Luftgekühlt",
        "Modellgruppe Luftgekuehlt"
      ] ||
      (
        (title match "*Schwarz*" || title match "*schwarz*") &&
        (title match "*Kachel*" || title match "*kachel*")
      ) ||
      (
        title match "*Modellgruppe*" &&
        (
          title match "*Tauch*" ||
          title match "*Luft*"
        )
      )
    )
  ] | order(coalesce(sortOrder, 999999) asc, _createdAt asc){
    title,
    image{
      ...,
      "assetUrl": asset->url,
      "mimeType": asset->mimeType,
      "extension": asset->extension,
      "originalFilename": asset->originalFilename
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

export const BUSINESS_BUTTON_ARROW_QUERY = defineQuery(groq`*[
  _type == "mediaAsset" &&
  mediaType == "image" &&
  isActive != false &&
  defined(image.asset) &&
  (
    title == "Buttonpfeil Gewerbe" ||
    title match "*Buttonpfeil Gewerbe*" ||
    usage match "*Buttonpfeil Gewerbe*" ||
    category match "*Buttonpfeil Gewerbe*" ||
    "Buttonpfeil Gewerbe" in tags[] ||
    "buttonpfeil-gewerbe" in tags[] ||
    (
      (
        title match "*Buttonpfeil*" ||
        usage match "*Buttonpfeil*" ||
        category match "*Buttonpfeil*" ||
        image.asset->originalFilename match "*Buttonpfeil*"
      ) &&
      (
        targetGroup == "b2b" ||
        title match "*Gewerbe*" ||
        usage match "*Gewerbe*" ||
        category match "*Gewerbe*" ||
        "gewerbe" in tags[] ||
        "b2b" in tags[]
      )
    )
  )
] | order(sortOrder asc, _updatedAt desc)[0]{
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
  favicon{
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
