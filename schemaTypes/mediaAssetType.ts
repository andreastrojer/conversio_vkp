import {defineField, defineType} from 'sanity'

export const mediaAssetType = defineType({
  name: 'mediaAsset',
  title: 'Media Asset',
  type: 'document',
  groups: [
    {name: 'basis', title: 'Basis', default: true},
    {name: 'asset', title: 'Asset'},
    {name: 'relations', title: 'Zuordnung'},
    {name: 'settings', title: 'Einstellungen'},
  ],
  fields: [
    defineField({name: 'title', title: 'Titel', type: 'string', group: 'basis', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'mediaType',
      title: 'Medientyp',
      type: 'string',
      group: 'basis',
      options: {
        list: [
          {title: 'Bild', value: 'image'},
          {title: 'Video', value: 'video'},
          {title: 'PDF', value: 'pdf'},
          {title: 'Externer Link', value: 'link'},
          {title: 'Drohnenvideo', value: 'droneVideo'},
          {title: 'Sonstiges', value: 'other'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'image', title: 'Bild', type: 'image', group: 'asset', options: {hotspot: true}}),
    defineField({name: 'file', title: 'Datei', type: 'file', group: 'asset'}),
    defineField({name: 'externalUrl', title: 'Externer Link / Video-Link', type: 'url', group: 'asset'}),
    defineField({name: 'altText', title: 'Alternativtext', type: 'string', group: 'asset'}),
    defineField({name: 'caption', title: 'Bild-/Videounterschrift', type: 'string', group: 'asset'}),
    defineField({
      name: 'targetGroup',
      title: 'Kundengruppe',
      type: 'string',
      group: 'relations',
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
    defineField({name: 'category', title: 'Kategorie / Verwendung', type: 'string', group: 'relations'}),
    defineField({name: 'usage', title: 'Verwendungshinweis', type: 'text', rows: 3, group: 'relations'}),
    defineField({name: 'productCategories', title: 'Produktbezug', type: 'array', group: 'relations', of: [{type: 'reference', to: [{type: 'productCategory'}]}]}),
    defineField({name: 'scenarios', title: 'Szenario-Bezug', type: 'array', group: 'relations', of: [{type: 'reference', to: [{type: 'scenario'}]}]}),
    defineField({name: 'tags', title: 'Tags', type: 'array', group: 'relations', of: [{type: 'string'}]}),
    defineField({name: 'sortOrder', title: 'Reihenfolge', type: 'number', group: 'settings', initialValue: 0}),
    defineField({name: 'isActive', title: 'Aktiv', type: 'boolean', group: 'settings', initialValue: true}),
  ],
  orderings: [{title: 'Reihenfolge', name: 'sortOrderAsc', by: [{field: 'sortOrder', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'mediaType', media: 'image'}},
})
