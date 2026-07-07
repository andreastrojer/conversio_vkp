import {defineField, defineType} from 'sanity'

export const legalTextType = defineType({
  name: 'legalText',
  title: 'Legal / Consent Text',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Titel', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'legalType',
      title: 'Textart',
      type: 'string',
      options: {
        list: [
          {title: 'Datenschutz', value: 'privacy'},
          {title: 'Einwilligung Mailversand', value: 'mailConsent'},
          {title: 'Kontaktaufnahme', value: 'contactConsent'},
          {title: 'Terminvereinbarung', value: 'appointmentConsent'},
          {title: 'Impressum', value: 'imprint'},
          {title: 'AGB / Hinweis', value: 'terms'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'version', title: 'Version', type: 'string', initialValue: '1.0'}),
    defineField({name: 'validFrom', title: 'Gültig ab', type: 'date'}),
    defineField({name: 'content', title: 'Textinhalt', type: 'text', rows: 12, validation: (Rule) => Rule.required()}),
    defineField({name: 'requiresCheckbox', title: 'Als Checkbox-Einwilligung verwenden', type: 'boolean', initialValue: false}),
    defineField({name: 'checkboxLabel', title: 'Checkbox-Text', type: 'string'}),
    defineField({name: 'isActive', title: 'Aktiv', type: 'boolean', initialValue: true}),
  ],
  preview: {
    select: {title: 'title', type: 'legalType', version: 'version'},
    prepare({title, type, version}) {
      return {title: title || 'Rechtstext', subtitle: `${type || 'Text'} · Version ${version || '1.0'}`}
    },
  },
})
