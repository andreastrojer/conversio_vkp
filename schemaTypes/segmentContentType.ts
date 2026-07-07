import {defineField, defineType} from 'sanity'

export const segmentContentType = defineType({
  name: 'segmentContent',
  title: 'Segment Content',
  type: 'document',
  groups: [
    {name: 'basis', title: 'Basis', default: true},
    {name: 'content', title: 'Inhalt'},
    {name: 'sales', title: 'Vertrieb'},
    {name: 'settings', title: 'Einstellungen'},
  ],
  fields: [
    defineField({name: 'title', title: 'Titel', type: 'string', group: 'basis', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'segmentKey',
      title: 'Segment-Key',
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
    defineField({name: 'headline', title: 'Segment-Headline', type: 'string', group: 'content'}),
    defineField({name: 'mainText', title: 'Haupttext', type: 'text', rows: 6, group: 'content'}),
    defineField({name: 'focusText', title: 'Fokus / Kernaussage', type: 'text', rows: 3, group: 'content'}),
    defineField({
      name: 'productCategories',
      title: 'Relevante Produktkategorien',
      type: 'array',
      group: 'content',
      of: [{type: 'reference', to: [{type: 'productCategory'}]}],
    }),
    defineField({name: 'benefits', title: 'Nutzenargumente', type: 'array', group: 'sales', of: [{type: 'string'}]}),
    defineField({
      name: 'objections',
      title: 'Einwände',
      type: 'array',
      group: 'sales',
      of: [
        {
          type: 'object',
          name: 'objectionItem',
          title: 'Einwand',
          fields: [
            defineField({name: 'objection', title: 'Einwand', type: 'string'}),
            defineField({name: 'answer', title: 'Antwort / Entkräftung', type: 'text', rows: 3}),
          ],
          preview: {select: {title: 'objection', subtitle: 'answer'}},
        },
      ],
    }),
    defineField({name: 'trustFactors', title: 'Trust-Faktoren', type: 'array', group: 'sales', of: [{type: 'string'}]}),
    defineField({name: 'ctaText', title: 'CTA-Text je Kundengruppe', type: 'string', group: 'sales'}),
    defineField({name: 'sortOrder', title: 'Reihenfolge', type: 'number', group: 'settings', initialValue: 0}),
    defineField({name: 'isActive', title: 'Aktiv', type: 'boolean', group: 'settings', initialValue: true}),
  ],
  orderings: [{title: 'Reihenfolge', name: 'sortOrderAsc', by: [{field: 'sortOrder', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', targetGroup: 'targetGroup'},
    prepare({title, targetGroup}) {
      return {title: title || 'Segment Content', subtitle: targetGroup || 'keine Zielgruppe'}
    },
  },
})
