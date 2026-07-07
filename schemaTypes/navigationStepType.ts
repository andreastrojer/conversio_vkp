import {defineField, defineType} from 'sanity'

const targetAudienceOptions = [
  {title: 'Privatkunden', value: 'b2c'},
  {title: 'Geschäftskunden', value: 'b2b'},
  {title: 'Beide', value: 'both'},
]

export const navigationStepType = defineType({
  name: 'navigationStep',
  title: 'Navigation Step',
  type: 'document',
  groups: [
    {name: 'basis', title: 'Basis', default: true},
    {name: 'flow', title: 'Flow'},
    {name: 'settings', title: 'Einstellungen'},
  ],
  fields: [
    defineField({name: 'title', title: 'Titel', type: 'string', group: 'basis', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'stepKey',
      title: 'Technischer Schlüssel',
      type: 'slug',
      group: 'basis',
      description: 'Muss mit dem Screen-Key des verknüpften App Screens übereinstimmen, z. B. „scenario-matrix“.',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Reihenfolge',
      type: 'number',
      group: 'flow',
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: 'chapter',
      title: 'Kapitel / Progress',
      type: 'string',
      group: 'flow',
      options: {
        list: [
          {title: 'Start', value: 'start'},
          {title: 'Intro', value: 'intro'},
          {title: 'Auswahl', value: 'selection'},
          {title: 'Vertrauen', value: 'about'},
          {title: 'Leistungen', value: 'offer'},
          {title: 'Bedarf erfassen', value: 'needs'},
          {title: 'Matrix', value: 'matrix'},
          {title: 'Medien & Referenzen', value: 'media'},
          {title: 'Abschluss', value: 'closing'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'visibleFor',
      title: 'Sichtbar für',
      type: 'string',
      group: 'flow',
      initialValue: 'both',
      options: {list: targetAudienceOptions, layout: 'radio'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'screen', title: 'Verknüpfter Screen', type: 'reference', group: 'flow', to: [{type: 'appScreen'}]}),
    defineField({name: 'requiresCustomerType', title: 'Kundengruppe muss gewählt sein', type: 'boolean', group: 'settings', initialValue: false}),
    defineField({name: 'isOptional', title: 'Optionaler Schritt', type: 'boolean', group: 'settings', initialValue: false}),
    defineField({name: 'showNextButton', title: 'Weiter-Button anzeigen', type: 'boolean', group: 'settings', initialValue: true}),
    defineField({name: 'showBackButton', title: 'Zurück-Button anzeigen', type: 'boolean', group: 'settings', initialValue: true}),
    defineField({name: 'isActive', title: 'Aktiv', type: 'boolean', group: 'settings', initialValue: true}),
  ],
  orderings: [{title: 'Reihenfolge', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', order: 'order', chapter: 'chapter', visibleFor: 'visibleFor'},
    prepare({title, order, chapter, visibleFor}) {
      return {
        title: `${order ? `${order}. ` : ''}${title || 'Unbenannter Schritt'}`,
        subtitle: `${chapter || 'kein Kapitel'} · ${visibleFor || 'keine Zielgruppe'}`,
      }
    },
  },
})
