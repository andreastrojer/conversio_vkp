import {defineField, defineType} from 'sanity'

export const formQuestionType = defineType({
  name: 'formQuestion',
  title: 'Form Question',
  type: 'document',
  groups: [
    {name: 'basis', title: 'Basis', default: true},
    {name: 'answers', title: 'Antworten'},
    {name: 'logic', title: 'Logik'},
    {name: 'settings', title: 'Einstellungen'},
  ],
  fields: [
    defineField({name: 'title', title: 'Interner Titel', type: 'string', group: 'basis', validation: (Rule) => Rule.required()}),
    defineField({name: 'questionText', title: 'Frage im Formular', type: 'string', group: 'basis', validation: (Rule) => Rule.required()}),
    defineField({name: 'helpText', title: 'Hilfetext', type: 'text', rows: 2, group: 'basis'}),
    defineField({
      name: 'targetGroup',
      title: 'Zielgruppe',
      type: 'string',
      group: 'basis',
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
      name: 'answerType',
      title: 'Antworttyp',
      type: 'string',
      group: 'answers',
      options: {
        list: [
          {title: 'Ja / Nein', value: 'yesNo'},
          {title: 'Einfachauswahl', value: 'singleSelect'},
          {title: 'Mehrfachauswahl', value: 'multiSelect'},
          {title: 'Zahl', value: 'number'},
          {title: 'Text', value: 'text'},
          {title: 'Personen', value: 'persons'},
          {title: 'Datum', value: 'date'},
          {title: 'Kontaktfeld', value: 'contact'},
          {title: 'Datei-Upload Hinweis', value: 'fileUploadHint'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'unit', title: 'Einheit', type: 'string', group: 'answers', description: 'z. B. kWh, m², Personen, €'}),
    defineField({name: 'placeholder', title: 'Placeholder', type: 'string', group: 'answers'}),
    defineField({
      name: 'options',
      title: 'Antwortoptionen',
      type: 'array',
      group: 'answers',
      of: [
        {
          type: 'object',
          name: 'answerOption',
          title: 'Antwortoption',
          fields: [
            defineField({name: 'label', title: 'Text', type: 'string'}),
            defineField({name: 'value', title: 'Wert', type: 'string'}),
            defineField({name: 'score', title: 'Score / Gewichtung', type: 'number', initialValue: 0}),
            defineField({
              name: 'relatedCategories',
              title: 'Verknüpfte Kategorien',
              type: 'array',
              of: [{type: 'reference', to: [{type: 'productCategory'}]}],
            }),
            defineField({
              name: 'relatedScenarios',
              title: 'Verknüpfte Szenarien',
              type: 'array',
              of: [{type: 'reference', to: [{type: 'scenario'}]}],
            }),
          ],
          preview: {select: {title: 'label', subtitle: 'value'}},
        },
      ],
    }),
    defineField({name: 'isRequired', title: 'Pflichtfeld', type: 'boolean', group: 'settings', initialValue: false}),
    defineField({name: 'sortOrder', title: 'Reihenfolge', type: 'number', group: 'settings', initialValue: 0}),
    defineField({name: 'isActive', title: 'Aktiv', type: 'boolean', group: 'settings', initialValue: true}),
  ],
  orderings: [{title: 'Reihenfolge', name: 'sortOrderAsc', by: [{field: 'sortOrder', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'answerType'}},
})
