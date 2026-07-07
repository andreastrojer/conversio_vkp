import {defineField, defineType} from 'sanity'

export const arTargetType = defineType({
  name: 'arTarget',
  title: 'AR Target',
  type: 'document',
  groups: [
    {name: 'basis', title: 'Basis', default: true},
    {name: 'content', title: 'AR-Inhalt'},
    {name: 'relations', title: 'Zuordnung'},
    {name: 'settings', title: 'Einstellungen'},
  ],
  fields: [
    defineField({name: 'title', title: 'Titel', type: 'string', group: 'basis', validation: (Rule) => Rule.required()}),
    defineField({name: 'markerImage', title: 'Marker / Bildtracker', type: 'image', group: 'basis', options: {hotspot: true}}),
    defineField({
      name: 'trackingType',
      title: 'Tracking-Typ',
      type: 'string',
      group: 'basis',
      initialValue: 'image',
      options: {
        list: [
          {title: 'Bildmarker', value: 'image'},
          {title: 'QR-Code', value: 'qr'},
          {title: 'Produktblatt / Print', value: 'print'},
        ],
      },
    }),
    defineField({name: 'linkedMedia', title: 'Verknüpftes Video / Medium', type: 'reference', group: 'content', to: [{type: 'mediaAsset'}]}),
    defineField({name: 'infoText', title: 'AR-Infotext', type: 'text', rows: 5, group: 'content'}),
    defineField({name: 'model3dUrl', title: '3D-Modell-Link optional', type: 'url', group: 'content'}),
    defineField({name: 'ctaText', title: 'CTA-Text', type: 'string', group: 'content'}),
    defineField({name: 'productReference', title: 'Produktbezug', type: 'reference', group: 'relations', to: [{type: 'productCategory'}]}),
    defineField({name: 'scenarioReference', title: 'Szenario-Bezug', type: 'reference', group: 'relations', to: [{type: 'scenario'}]}),
    defineField({name: 'sortOrder', title: 'Reihenfolge', type: 'number', group: 'settings', initialValue: 0}),
    defineField({name: 'isActive', title: 'Aktiv', type: 'boolean', group: 'settings', initialValue: true}),
  ],
  orderings: [{title: 'Reihenfolge', name: 'sortOrderAsc', by: [{field: 'sortOrder', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'trackingType', media: 'markerImage'}},
})
