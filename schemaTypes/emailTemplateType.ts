import {defineField, defineType} from 'sanity'

export const emailTemplateType = defineType({
  name: 'emailTemplate',
  title: 'Email Template',
  type: 'document',
  groups: [
    {name: 'basis', title: 'Basis', default: true},
    {name: 'content', title: 'Mailinhalt'},
    {name: 'relations', title: 'Zuordnung'},
    {name: 'settings', title: 'Einstellungen'},
  ],
  fields: [
    defineField({name: 'title', title: 'Interner Name', type: 'string', group: 'basis', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'templateType',
      title: 'Template-Typ',
      type: 'string',
      group: 'basis',
      options: {
        list: [
          {title: 'Kundenmail', value: 'customer'},
          {title: 'Interne Mail an Vertrieb', value: 'internal'},
          {title: 'Follow-up', value: 'followUp'},
          {title: 'Terminbestätigung', value: 'appointment'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
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
    defineField({name: 'subject', title: 'Betreff', type: 'string', group: 'content', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'body',
      title: 'Mailtext',
      type: 'text',
      rows: 10,
      group: 'content',
      description: 'Platzhalter möglich: {{customerName}}, {{salesPersonName}}, {{selectedDocuments}}, {{selectedScenario}}, {{appointmentDate}}',
    }),
    defineField({
      name: 'placeholders',
      title: 'Verwendete Platzhalter',
      type: 'array',
      group: 'content',
      of: [{type: 'string'}],
      initialValue: ['{{customerName}}', '{{salesPersonName}}', '{{selectedDocuments}}'],
    }),
    defineField({name: 'includeSignature', title: 'Signaturbereich verwenden', type: 'boolean', group: 'content', initialValue: true}),
    defineField({name: 'signatureHint', title: 'Signatur-Hinweis', type: 'text', rows: 3, group: 'content'}),
    defineField({name: 'defaultAttachments', title: 'Standard-Unterlagen', type: 'array', group: 'relations', of: [{type: 'reference', to: [{type: 'salesDocument'}]}]}),
    defineField({name: 'sortOrder', title: 'Reihenfolge', type: 'number', group: 'settings', initialValue: 0}),
    defineField({name: 'isActive', title: 'Aktiv', type: 'boolean', group: 'settings', initialValue: true}),
  ],
  orderings: [{title: 'Reihenfolge', name: 'sortOrderAsc', by: [{field: 'sortOrder', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'templateType'}},
})
