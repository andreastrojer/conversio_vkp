import { defineArrayMember, defineField, defineType } from 'sanity'

export const appointmentTemplateType = defineType({
  name: 'appointmentTemplate',
  title: 'Terminvorlage',
  type: 'document',

  groups: [
    { name: 'basis', title: 'Basis', default: true },
    { name: 'calendar', title: 'Kalendereintrag' },
    { name: 'content', title: 'Kundeninformation' },
    { name: 'relations', title: 'Verknüpfungen' },
    { name: 'settings', title: 'Einstellungen' },
  ],

  fields: [
    defineField({
      name: 'title',
      title: 'Interner Name',
      type: 'string',
      group: 'basis',
      description: 'Nur im CMS sichtbar, z. B. „PV-Beratung Privatkunden“.',
      validation: (Rule) => Rule.required().min(3).max(120),
    }),

    defineField({
      name: 'templateKey',
      title: 'Technischer Template-Key',
      type: 'string',
      group: 'basis',
      description:
        'Eindeutiger Schlüssel, z. B. „pv-consultation-b2c“.',
      validation: (Rule) =>
        Rule.required()
          .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            'Nur Kleinbuchstaben, Zahlen und Bindestriche verwenden.',
          )
          .max(100),
    }),

    defineField({
      name: 'appointmentType',
      title: 'Terminart',
      type: 'string',
      group: 'basis',
      initialValue: 'teams',
      options: {
        list: [
          { title: 'Microsoft Teams', value: 'teams' },
          { title: 'Vor Ort', value: 'onsite' },
          { title: 'Telefon', value: 'phone' },
          { title: 'Nur Kalenderdatei', value: 'ics' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'targetGroup',
      title: 'Kundengruppe',
      type: 'string',
      group: 'basis',
      initialValue: 'both',
      options: {
        list: [
          { title: 'Privatkunden', value: 'b2c' },
          { title: 'Geschäftskunden', value: 'b2b' },
          { title: 'Beide', value: 'both' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'durationMinutes',
      title: 'Standarddauer in Minuten',
      type: 'number',
      group: 'basis',
      initialValue: 60,
      validation: (Rule) =>
        Rule.required().integer().min(15).max(480),
    }),

    defineField({
      name: 'timeZone',
      title: 'Zeitzone',
      type: 'string',
      group: 'basis',
      initialValue: 'Europe/Vienna',
      options: {
        list: [
          { title: 'Europe/Vienna', value: 'Europe/Vienna' },
          { title: 'Europe/Berlin', value: 'Europe/Berlin' },
          { title: 'UTC', value: 'UTC' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'calendarTitle',
      title: 'Titel im Kalender',
      type: 'string',
      group: 'calendar',
      description:
        'Zum Beispiel „Energieberatung – {{customerName}}“. Falls leer, wird der interne Name verwendet.',
      validation: (Rule) => Rule.max(180),
    }),

    defineField({
      name: 'calendarDescription',
      title: 'Beschreibung im Kalendereintrag',
      type: 'text',
      rows: 8,
      group: 'calendar',
      description:
        'Platzhalter wie {{customerName}}, {{selectedScenario}} und {{salesPersonName}} sind erlaubt.',
    }),

    defineField({
      name: 'locationText',
      title: 'Ort / Standard-Ort',
      type: 'string',
      group: 'calendar',
      hidden: ({ document }) =>
        document?.appointmentType !== 'onsite',
      validation: (Rule) => Rule.max(250),
    }),

    defineField({
      name: 'createOnlineMeeting',
      title: 'Teams-Besprechung automatisch erstellen',
      type: 'boolean',
      group: 'calendar',
      initialValue: true,
      hidden: ({ document }) =>
        document?.appointmentType !== 'teams',
    }),

    defineField({
      name: 'reminders',
      title: 'Erinnerungen',
      type: 'array',
      group: 'calendar',
      initialValue: [
        { method: 'email', minutesBefore: 1440 },
        { method: 'popup', minutesBefore: 30 },
      ],
      of: [
        defineArrayMember({
          name: 'appointmentReminder',
          title: 'Erinnerung',
          type: 'object',
          fields: [
            defineField({
              name: 'method',
              title: 'Art',
              type: 'string',
              options: {
                list: [
                  { title: 'E-Mail', value: 'email' },
                  { title: 'Popup', value: 'popup' },
                ],
                layout: 'radio',
              },
              validation: (Rule) => Rule.required(),
            }),

            defineField({
              name: 'minutesBefore',
              title: 'Minuten vor dem Termin',
              type: 'number',
              validation: (Rule) =>
                Rule.required().integer().min(0).max(40320),
            }),
          ],

          preview: {
            select: {
              method: 'method',
              minutes: 'minutesBefore',
            },
            prepare({ method, minutes }) {
              return {
                title:
                  method === 'email'
                    ? 'E-Mail-Erinnerung'
                    : 'Popup-Erinnerung',
                subtitle: `${minutes ?? 0} Minuten vorher`,
              }
            },
          },
        }),
      ],
    }),

    defineField({
      name: 'preparationText',
      title: 'Vorbereitungshinweis für den Kunden',
      type: 'text',
      rows: 5,
      group: 'content',
      description:
        'Zum Beispiel benötigte Stromrechnung, Verbrauchsdaten oder Gebäudeinformationen.',
    }),

    defineField({
      name: 'followUpText',
      title: 'Follow-up-Hinweis',
      type: 'text',
      rows: 5,
      group: 'content',
      description:
        'Hinweis für die weitere Bearbeitung nach dem Termin.',
    }),

    defineField({
      name: 'confirmationEmailTemplate',
      title: 'Vorlage für Terminbestätigung',
      type: 'reference',
      group: 'relations',
      to: [{ type: 'emailTemplate' }],
      options: {
        filter: 'templateType == $templateType && isActive == true',
        filterParams: {
          templateType: 'appointment',
        },
      },
    }),

    defineField({
      name: 'followUpEmailTemplate',
      title: 'Vorlage für Follow-up-Mail',
      type: 'reference',
      group: 'relations',
      to: [{ type: 'emailTemplate' }],
      options: {
        filter: 'templateType == $templateType && isActive == true',
        filterParams: {
          templateType: 'followUp',
        },
      },
    }),

    defineField({
      name: 'version',
      title: 'Version',
      type: 'string',
      group: 'settings',
      initialValue: '1.0',
    }),

    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'settings',
      initialValue: 'draft',
      options: {
        list: [
          { title: 'Entwurf', value: 'draft' },
          { title: 'Aktiv', value: 'active' },
          { title: 'Archiviert', value: 'archived' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'isDefault',
      title: 'Standardvorlage',
      type: 'boolean',
      group: 'settings',
      initialValue: false,
    }),

    defineField({
      name: 'sortOrder',
      title: 'Reihenfolge',
      type: 'number',
      group: 'settings',
      initialValue: 0,
      validation: (Rule) => Rule.integer().min(0),
    }),

    defineField({
      name: 'isActive',
      title: 'Aktiv',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
    }),
  ],

  orderings: [
    {
      title: 'Reihenfolge',
      name: 'sortOrderAsc',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
  ],

  preview: {
    select: {
      title: 'title',
      appointmentType: 'appointmentType',
      duration: 'durationMinutes',
      targetGroup: 'targetGroup',
      status: 'status',
    },

    prepare({
      title,
      appointmentType,
      duration,
      targetGroup,
      status,
    }) {
      return {
        title: title || 'Terminvorlage',
        subtitle: `${appointmentType || 'Termin'} · ${duration || '?'} Min. · ${targetGroup || 'Keine Zielgruppe'} · ${status || 'Kein Status'}`,
      }
    },
  },
})