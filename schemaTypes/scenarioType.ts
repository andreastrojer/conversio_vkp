import { defineField, defineType } from 'sanity'

const targetGroupOptions = [
  { title: 'Privatkunden', value: 'b2c' },
  { title: 'Geschäftskunden', value: 'b2b' },
  { title: 'Beide', value: 'both' },
]

export const scenarioType = defineType({
  name: 'scenario',
  title: 'Scenario',
  type: 'document',
  groups: [
    { name: 'basis', title: 'Basis', default: true },
    { name: 'logic', title: 'Logik' },
    { name: 'content', title: 'Inhalt' },
    { name: 'output', title: 'Output' },
    { name: 'settings', title: 'Einstellungen' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Titel', type: 'string', group: 'basis', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'slug',
      title: 'URL-Name',
      type: 'slug',
      group: 'basis',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'targetGroup',
      title: 'Zielgruppe',
      type: 'string',
      group: 'basis',
      options: { list: targetGroupOptions, layout: 'radio' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'includedItems',
      title: 'Enthaltene Leistungen',
      type: 'array',
      group: 'content',
      description:
        'Leistungen, die unter „ENTHALTEN“ im Bundle angezeigt werden.',
      of: [
        {
          type: 'object',
          name: 'includedItem',
          title: 'Enthaltene Leistung',
          fields: [
            defineField({
              name: 'amount',
              title: 'Menge / Leistung',
              type: 'string',
              description: 'Zum Beispiel „10 kWp“, „8 kWh“ oder „1x“.',
            }),
            defineField({
              name: 'label',
              title: 'Bezeichnung',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              amount: 'amount',
              label: 'label',
            },
            prepare({ amount, label }) {
              return {
                title: `${amount ? `${amount} ` : ''}${label}`,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'scenarioType',
      title: 'Szenario-Typ',
      type: 'string',
      group: 'basis',
      options: {
        list: [
          { title: 'B2C: Reine PV', value: 'b2c_pv' },
          { title: 'B2C: PV + Speicher', value: 'b2c_pv_speicher' },
          { title: 'B2C: Komplettlösung', value: 'b2c_komplett' },
          { title: 'B2B: Einstieg', value: 'b2b_einstieg' },
          { title: 'B2B: Autark & abgesichert', value: 'b2b_autark_abgesichert' },
          { title: 'B2B: Wachstum & Mobilität', value: 'b2b_wachstum_mobilitaet' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'shortDescription', title: 'Kurzbeschreibung', type: 'text', rows: 3, group: 'content' }),
    defineField({ name: 'description', title: 'Beschreibung', type: 'text', rows: 5, group: 'content' }),
    defineField({ name: 'usageSituation', title: 'Nutzungs-/Kundensituation', type: 'text', rows: 4, group: 'content' }),
    defineField({ name: 'recommendationLogic', title: 'Empfehlungslogik', type: 'text', rows: 5, group: 'logic' }),
    defineField({ name: 'scoreMin', title: 'Score von', type: 'number', group: 'logic' }),
    defineField({ name: 'scoreMax', title: 'Score bis', type: 'number', group: 'logic' }),
    defineField({
      name: 'recommendedCategories',
      title: 'Empfohlene Produktkategorien',
      type: 'array',
      group: 'logic',
      of: [{ type: 'reference', to: [{ type: 'productCategory' }] }],
    }),
    defineField({
      name: 'comparisonValues',
      title: 'Vergleichswerte für Matrix',
      type: 'array',
      group: 'logic',
      description: 'Redaktionelle Demo-/Richtwerte. Exakte Berechnungen bleiben in der Web-App/Backend-Logik.',
      of: [
        {
          type: 'object',
          name: 'scenarioComparisonValue',
          title: 'Vergleichswert',
          fields: [
            defineField({ name: 'metric', title: 'Metrik', type: 'reference', to: [{ type: 'comparisonMetric' }] }),
            defineField({ name: 'value', title: 'Wert', type: 'string' }),
            defineField({ name: 'note', title: 'Hinweis', type: 'text', rows: 2 }),
          ],
          preview: { select: { title: 'metric.title', subtitle: 'value' } },
        },
      ],
    }),
    defineField({
      name: 'recommendedDocuments',
      title: 'Empfohlene Vertriebsunterlagen',
      type: 'array',
      group: 'output',
      of: [{ type: 'reference', to: [{ type: 'salesDocument' }] }],
    }),
    defineField({ name: 'resultText', title: 'Ergebnistext für App', type: 'text', rows: 5, group: 'output' }),
    defineField({ name: 'nextStepText', title: 'Nächster Schritt', type: 'text', rows: 3, group: 'output' }),
    defineField({ name: 'sortOrder', title: 'Reihenfolge', type: 'number', group: 'settings', initialValue: 0 }),
    defineField({ name: 'isActive', title: 'Aktiv', type: 'boolean', group: 'settings', initialValue: true }),
  ],
  orderings: [{ title: 'Reihenfolge', name: 'sortOrderAsc', by: [{ field: 'sortOrder', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', scenarioType: 'scenarioType', targetGroup: 'targetGroup' },
    prepare({ title, scenarioType, targetGroup }) {
      return { title: title || 'Unbenanntes Szenario', subtitle: `${scenarioType || 'kein Typ'} · ${targetGroup || 'keine Zielgruppe'}` }
    },
  },
})
