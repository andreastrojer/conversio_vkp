'use client'

import {
  CONSULTATION_STORAGE_KEY,
  bundleToConsultationBundle,
  defaultConsultationState,
  normalizeConsultationState,
  sanitizeSalesDocumentIds,
  type ConsultationCalculationResult,
  type ConsultationCustomer,
  type ConsultationState,
} from '@/lib/consultation'
import type {CustomerGroup} from '@/lib/customerSelection'
import type {ScenarioMatrixBundle} from '@/lib/scenarioMatrix'
import {useEffect, useSyncExternalStore} from 'react'

type Listener = () => void

let consultationState: ConsultationState = defaultConsultationState
let storageHydrated = false

const listeners = new Set<Listener>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function readStoredState() {
  if (typeof window === 'undefined') {
    return defaultConsultationState
  }

  const rawValue = window.sessionStorage.getItem(CONSULTATION_STORAGE_KEY)

  if (!rawValue) {
    return defaultConsultationState
  }

  try {
    return normalizeConsultationState(JSON.parse(rawValue))
  } catch {
    return defaultConsultationState
  }
}

function persistState(state: ConsultationState) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(CONSULTATION_STORAGE_KEY, JSON.stringify(state))
}

function hydrateFromStorage() {
  if (storageHydrated || typeof window === 'undefined') {
    return
  }

  storageHydrated = true
  consultationState = readStoredState()
  emitChange()
}

function updateConsultationState(
  updater: (currentState: ConsultationState) => ConsultationState,
) {
  hydrateFromStorage()

  consultationState = normalizeConsultationState({
    ...updater(consultationState),
    updatedAt: new Date().toISOString(),
  })
  persistState(consultationState)
  emitChange()
}

function subscribe(listener: Listener) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return consultationState
}

function getServerSnapshot() {
  return defaultConsultationState
}

export function useConsultationStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    hydrateFromStorage()
  }, [])

  return snapshot
}

export function saveCustomerDraft(customer: ConsultationCustomer) {
  updateConsultationState((currentState) => ({
    ...currentState,
    customer,
  }))
}

export function saveCustomerSelection(
  customerType: CustomerGroup,
  customer: ConsultationCustomer,
) {
  updateConsultationState((currentState) => ({
    ...currentState,
    customerType,
    customer,
  }))
}

export function saveScenarioSelection({
  customerType,
  bundle,
  matrixValues,
  calculationResult,
}: {
  customerType: CustomerGroup
  bundle: ScenarioMatrixBundle
  matrixValues: Record<string, number>
  calculationResult?: ConsultationCalculationResult
}) {
  updateConsultationState((currentState) => ({
    ...currentState,
    customerType,
    selectedBundle: bundleToConsultationBundle(bundle),
    matrixValues,
    calculationResult,
  }))
}

export function saveSelectedSalesDocumentIds(documentIds: string[]) {
  updateConsultationState((currentState) => ({
    ...currentState,
    selectedSalesDocumentIds: sanitizeSalesDocumentIds(documentIds),
  }))
}
