import {defineField, defineType} from 'sanity'

export const questionSetType = defineType({
  name: 'questionSet',
  title: 'Question Set',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Titel', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'slug',
      title: 'URL-Name',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'targetGroup',
      title: 'Zielgruppe',
      type: 'string',
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
    defineField({name: 'introText', title: 'Intro-Text', type: 'text', rows: 4}),
    defineField({
      name: 'questions',
      title: 'Fragen',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'formQuestion'}]}],
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: 'recommendedDefaultScenarios',
      title: 'Standard-Szenarien für diese Fragenstrecke',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'scenario'}]}],
    }),
    defineField({name: 'resultIntroText', title: 'Text vor Ergebnis', type: 'text', rows: 3}),
    defineField({name: 'sortOrder', title: 'Reihenfolge', type: 'number', initialValue: 0}),
    defineField({name: 'isActive', title: 'Aktiv', type: 'boolean', initialValue: true}),
  ],
  orderings: [{title: 'Reihenfolge', name: 'sortOrderAsc', by: [{field: 'sortOrder', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', targetGroup: 'targetGroup'},
    prepare({title, targetGroup}) {
      return {title: title || 'Unbenannte Fragenstrecke', subtitle: targetGroup || 'keine Zielgruppe'}
    },
  },
})
