import {defineField, defineType} from 'sanity'

const targetGroupOptions = [
  {title: 'Privatkunden', value: 'b2c'},
  {title: 'Geschäftskunden', value: 'b2b'},
  {title: 'Beide', value: 'both'},
]

export const productCategoryType = defineType({
  name: 'productCategory',
  title: 'Product Category',
  type: 'document',
  groups: [
    {name: 'basis', title: 'Basis', default: true},
    {name: 'content', title: 'Inhalt'},
    {name: 'media', title: 'Medien'},
    {name: 'settings', title: 'Einstellungen'},
  ],
  fields: [
    defineField({name: 'title', title: 'Titel', type: 'string', group: 'basis', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'slug',
      title: 'URL-Name',
      type: 'slug',
      group: 'basis',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'categoryType',
      title: 'Kategorie-Typ',
      type: 'string',
      group: 'basis',
      options: {
        list: [
          {title: 'Photovoltaik', value: 'pv'},
          {title: 'Speicher', value: 'speicher'},
          {title: 'Wärmepumpe', value: 'waermepumpe'},
          {title: 'Ladeinfrastruktur', value: 'ladeinfrastruktur'},
          {title: 'Energiegemeinschaft', value: 'energiegemeinschaft'},
          {title: 'Gebäudeautomation', value: 'gebaeudeautomation'},
          {title: 'Service / Wartung', value: 'service'},
          {title: 'Drohnencheck', value: 'drohnencheck'},
          {title: 'Sonstiges', value: 'sonstiges'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'targetGroup',
      title: 'Zielgruppe',
      type: 'string',
      group: 'basis',
      initialValue: 'both',
      options: {list: targetGroupOptions, layout: 'radio'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'shortDescription', title: 'Kurzbeschreibung', type: 'text', rows: 3, group: 'content'}),
    defineField({name: 'description', title: 'Detailbeschreibung', type: 'text', rows: 6, group: 'content'}),
    defineField({name: 'benefits', title: 'Nutzenargumente', type: 'array', group: 'content', of: [{type: 'string'}]}),
    defineField({name: 'technicalNotes', title: 'Technische Hinweise', type: 'text', rows: 5, group: 'content'}),
    defineField({name: 'fundingNotes', title: 'Förderhinweise', type: 'text', rows: 4, group: 'content'}),
    defineField({name: 'icon', title: 'Icon / Symbol', type: 'string', group: 'media', description: 'Optionaler Icon-Key für die App, z. B. „solar“, „battery“, „charging“. '}),
    defineField({name: 'image', title: 'Bild', type: 'image', group: 'media', options: {hotspot: true}}),
    defineField({name: 'media', title: 'Verknüpfte Medien', type: 'array', group: 'media', of: [{type: 'reference', to: [{type: 'mediaAsset'}]}]}),
    defineField({name: 'documents', title: 'Verknüpfte Unterlagen', type: 'array', group: 'media', of: [{type: 'reference', to: [{type: 'salesDocument'}]}]}),
    defineField({name: 'sortOrder', title: 'Reihenfolge', type: 'number', group: 'settings', initialValue: 0}),
    defineField({name: 'isActive', title: 'Aktiv', type: 'boolean', group: 'settings', initialValue: true}),
  ],
  orderings: [{title: 'Reihenfolge', name: 'sortOrderAsc', by: [{field: 'sortOrder', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'categoryType', media: 'image'}},
})
