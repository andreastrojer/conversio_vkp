import {defineField, defineType} from 'sanity'

export const appointmentTemplateType = defineType({
  name: 'appointmentTemplate',
  title: 'Appointment Template',
  type: 'document',
  groups: [
    {name: 'basis', title: 'Basis', default: true},
    {name: 'content', title: 'Inhalt'},
    {name: 'settings', title: 'Einstellungen'},
  ],
  fields: [
    defineField({name: 'title', title: 'Termintitel', type: 'string', group: 'basis', validation: (Rule) => Rule.required()}),
    defineField({name: 'description', title: 'Beschreibung', type: 'text', rows: 5, group: 'content'}),
    defineField({name: 'durationMinutes', title: 'Standarddauer in Minuten', type: 'number', group: 'basis', initialValue: 60, validation: (Rule) => Rule.min(15)}),
    defineField({
      name: 'appointmentType',
      title: 'Terminart',
      type: 'string',
      group: 'basis',
      options: {
        list: [
          {title: 'Microsoft Teams', value: 'teams'},
          {title: 'Vor Ort', value: 'onsite'},
          {title: 'Telefon', value: 'phone'},
          {title: '.ics Kalenderdatei', value: 'ics'},
        ],
      },
      initialValue: 'teams',
    }),
    defineField({
      name: 'targetGroup',
      title: 'Kundengruppe',
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
    defineField({name: 'locationText', title: 'Ort / Standard-Ort', type: 'string', group: 'basis'}),
    defineField({name: 'preparationText', title: 'Vorbereitungstext', type: 'text', rows: 4, group: 'content'}),
    defineField({name: 'followUpText', title: 'Follow-up-Text', type: 'text', rows: 5, group: 'content'}),
    defineField({name: 'sortOrder', title: 'Reihenfolge', type: 'number', group: 'settings', initialValue: 0}),
    defineField({name: 'isActive', title: 'Aktiv', type: 'boolean', group: 'settings', initialValue: true}),
  ],
  orderings: [{title: 'Reihenfolge', name: 'sortOrderAsc', by: [{field: 'sortOrder', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', type: 'appointmentType', duration: 'durationMinutes'},
    prepare({title, type, duration}) {
      return {title: title || 'Terminvorlage', subtitle: `${type || 'Termin'} · ${duration || '?'} Min.`}
    },
  },
})
