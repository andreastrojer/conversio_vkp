import {siteSettingsType} from './siteSettingsType'
import {navigationStepType} from './navigationStepType'
import {appScreenType} from './appScreenType'
import {segmentContentType} from './segmentContentType'
import {questionSetType} from './questionSetType'
import {formQuestionType} from './formQuestionType'
import {productCategoryType} from './productCategoryType'
import {scenarioType} from './scenarioType'
import {comparisonMetricType} from './comparisonMetricType'
import {referenceProjectType} from './referenceProjectType'
import {mediaAssetType} from './mediaAssetType'
import {salesDocumentType} from './salesDocumentType'
import {emailTemplateType} from './emailTemplateType'
import {arTargetType} from './arTargetType'
import {appointmentTemplateType} from './appointmentTemplateType'
import {legalTextType} from './legalTextType'
import {editorRoleInfoType} from './editorRoleInfoType'

export const schemaTypes = [
  // Globale App Struktur
  siteSettingsType,
  navigationStepType,
  appScreenType,
  segmentContentType,

  // Beratungsmatrix und Inhalte
  questionSetType,
  formQuestionType,
  productCategoryType,
  scenarioType,
  comparisonMetricType,

  // Medien, Dokumente und Follow-up
  referenceProjectType,
  mediaAssetType,
  salesDocumentType,
  emailTemplateType,
  arTargetType,
  appointmentTemplateType,
  legalTextType,
  editorRoleInfoType,
]
