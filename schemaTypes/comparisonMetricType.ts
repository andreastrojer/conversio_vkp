import {defineField, defineType} from 'sanity'

export const comparisonMetricType = defineType({
  name: 'comparisonMetric',
  title: 'Comparison Metric',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Titel', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'metricKey',
      title: 'Technischer Key',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'targetGroup',
      title: 'Kundengruppe',
      type: 'string',
      initialValue: 'both',
      options: {
        list: [
          {title: 'Privatkunden', value: 'b2c'},
          {title: 'Geschäftskunden', value: 'b2b'},
          {title: 'Beide', value: 'both'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'metricType',
      title: 'Metrik-Typ',
      type: 'string',
      options: {
        list: [
          {title: 'Autarkiegrad', value: 'autarkiegrad'},
          {title: 'Eigenverbrauch', value: 'eigenverbrauch'},
          {title: 'Investition grob', value: 'investition'},
          {title: 'Jährlicher Ertrag', value: 'jahresertrag'},
          {title: 'CO₂-Einsparung', value: 'co2'},
          {title: 'Lastspitzen / Versorgungssicherheit', value: 'lastspitzen'},
          {title: 'Nutzenargument', value: 'nutzenargument'},
          {title: 'Badge / Label', value: 'badge'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'unit', title: 'Einheit', type: 'string', description: 'z. B. %, kWh, €, kg CO₂'}),
    defineField({
      name: 'displayType',
      title: 'Anzeigeart',
      type: 'string',
      initialValue: 'text',
      options: {
        list: [
          {title: 'Zahl', value: 'number'},
          {title: 'Balken', value: 'bar'},
          {title: 'Badge', value: 'badge'},
          {title: 'Text', value: 'text'},
        ],
      },
    }),
    defineField({name: 'description', title: 'Erklärung', type: 'text', rows: 4}),
    defineField({name: 'sortOrder', title: 'Reihenfolge', type: 'number', initialValue: 0}),
    defineField({name: 'isActive', title: 'Aktiv', type: 'boolean', initialValue: true}),
  ],
  orderings: [{title: 'Reihenfolge', name: 'sortOrderAsc', by: [{field: 'sortOrder', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', subtitle: 'metricType', targetGroup: 'targetGroup'},
    prepare({title, subtitle, targetGroup}) {
      return {title, subtitle: `${subtitle || 'Metrik'} · ${targetGroup || 'both'}`}
    },
  },
})
