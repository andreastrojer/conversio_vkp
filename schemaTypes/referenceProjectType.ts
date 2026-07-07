import {defineField, defineType} from 'sanity'

export const referenceProjectType = defineType({
  name: 'referenceProject',
  title: 'Reference Project',
  type: 'document',
  groups: [
    {name: 'basis', title: 'Basis', default: true},
    {name: 'content', title: 'Inhalt'},
    {name: 'metrics', title: 'Kennzahlen'},
    {name: 'media', title: 'Medien'},
    {name: 'settings', title: 'Einstellungen'},
  ],
  fields: [
    defineField({name: 'title', title: 'Projekttitel', type: 'string', group: 'basis', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'slug',
      title: 'URL-Name',
      type: 'slug',
      group: 'basis',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'targetGroup',
      title: 'Kundengruppe',
      type: 'string',
      group: 'basis',
      options: {
        list: [
          {title: 'Privatkunden', value: 'b2c'},
          {title: 'Geschäftskunden', value: 'b2b'},
          {title: 'Beide', value: 'both'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'customerType',
      title: 'Kundentyp genauer',
      type: 'string',
      group: 'basis',
      options: {
        list: [
          {title: 'Privatkunde', value: 'privat'},
          {title: 'Gewerbe', value: 'gewerbe'},
          {title: 'Industrie', value: 'industrie'},
          {title: 'Gemeinde', value: 'gemeinde'},
          {title: 'Landwirtschaft', value: 'landwirtschaft'},
          {title: 'Bauträger', value: 'bautraeger'},
        ],
      },
    }),
    defineField({name: 'industry', title: 'Branche', type: 'string', group: 'basis'}),
    defineField({name: 'location', title: 'Ort / Region', type: 'string', group: 'basis'}),
    defineField({name: 'projectDate', title: 'Projektzeitraum / Datum', type: 'date', group: 'basis'}),
    defineField({name: 'productCategories', title: 'Kategorien', type: 'array', group: 'content', of: [{type: 'reference', to: [{type: 'productCategory'}]}]}),
    defineField({name: 'description', title: 'Beschreibung', type: 'text', rows: 6, group: 'content'}),
    defineField({name: 'challenge', title: 'Ausgangslage / Herausforderung', type: 'text', rows: 4, group: 'content'}),
    defineField({name: 'solution', title: 'Lösung', type: 'text', rows: 4, group: 'content'}),
    defineField({
      name: 'metrics',
      title: 'Kennzahlen',
      type: 'array',
      group: 'metrics',
      of: [
        {
          type: 'object',
          name: 'projectMetric',
          title: 'Kennzahl',
          fields: [
            defineField({name: 'label', title: 'Bezeichnung', type: 'string'}),
            defineField({name: 'value', title: 'Wert', type: 'string'}),
            defineField({name: 'unit', title: 'Einheit', type: 'string'}),
          ],
          preview: {select: {title: 'label', subtitle: 'value'}},
        },
      ],
    }),
    defineField({name: 'media', title: 'Medien', type: 'array', group: 'media', of: [{type: 'reference', to: [{type: 'mediaAsset'}]}]}),
    defineField({name: 'testimonial', title: 'Zitat / Kundenstimme', type: 'text', rows: 3, group: 'content'}),
    defineField({name: 'sortOrder', title: 'Reihenfolge', type: 'number', group: 'settings', initialValue: 0}),
    defineField({name: 'isFeatured', title: 'Als Referenz hervorheben', type: 'boolean', group: 'settings', initialValue: false}),
    defineField({name: 'isActive', title: 'Aktiv', type: 'boolean', group: 'settings', initialValue: true}),
  ],
  orderings: [{title: 'Reihenfolge', name: 'sortOrderAsc', by: [{field: 'sortOrder', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'location', media: 'media.0.image'}},
})
