import { defineField, defineType } from 'sanity'

const placeholderOptions = [
  { title: 'Kundenname', value: '{{customerName}}' },
  { title: 'Firmenname', value: '{{customerCompany}}' },
  { title: 'Vertriebsmitarbeiter', value: '{{salesPersonName}}' },
  { title: 'E-Mail Vertriebsmitarbeiter', value: '{{salesPersonEmail}}' },
  { title: 'Ausgewähltes Bundle', value: '{{selectedScenario}}' },
  { title: 'Ausgewählte Unterlagen', value: '{{selectedDocuments}}' },
  { title: 'Berechnungszusammenfassung', value: '{{calculationSummary}}' },
  { title: 'Termin-Datum', value: '{{appointmentDate}}' },
  { title: 'Termin-Uhrzeit', value: '{{appointmentTime}}' },
  { title: 'Termin-Ort', value: '{{appointmentLocation}}' },
]

export const emailTemplateType = defineType({
  name: 'emailTemplate',
  title: 'E-Mail-Vorlage',
  type: 'document',

  groups: [
    { name: 'basis', title: 'Basis', default: true },
    { name: 'content', title: 'Mailinhalt' },
    { name: 'delivery', title: 'Versand' },
    { name: 'relations', title: 'Zuordnung' },
    { name: 'settings', title: 'Einstellungen' },
  ],

  fields: [
    defineField({
      name: 'title',
      title: 'Interner Name',
      type: 'string',
      group: 'basis',
      description: 'Nur im CMS sichtbar, z. B. „Produktunterlagen Privatkunden“.',
      validation: (Rule) => Rule.required().min(3).max(120),
    }),

    defineField({
      name: 'templateKey',
      title: 'Technischer Template-Key',
      type: 'string',
      group: 'basis',
      description:
        'Eindeutiger technischer Schlüssel, z. B. „customer-documents-b2c“.',
      validation: (Rule) =>
        Rule.required()
          .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            'Nur Kleinbuchstaben, Zahlen und Bindestriche verwenden.',
          )
          .max(100),
    }),

    defineField({
      name: 'templateType',
      title: 'Template-Typ',
      type: 'string',
      group: 'basis',
      options: {
        list: [
          { title: 'Kundenmail mit Unterlagen', value: 'customer' },
          { title: 'Interne Mail an Vertrieb', value: 'internal' },
          { title: 'Follow-up-Mail', value: 'followUp' },
          { title: 'Terminbestätigung', value: 'appointment' },
        ],
        layout: 'radio',
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
          { title: 'Privatkunden', value: 'b2c' },
          { title: 'Geschäftskunden', value: 'b2b' },
          { title: 'Beide', value: 'both' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'language',
      title: 'Sprache',
      type: 'string',
      group: 'basis',
      initialValue: 'de-AT',
      options: {
        list: [
          { title: 'Deutsch – Österreich', value: 'de-AT' },
          { title: 'Deutsch – Deutschland', value: 'de-DE' },
          { title: 'Englisch', value: 'en' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'subject',
      title: 'Betreff',
      type: 'string',
      group: 'content',
      description:
        'Platzhalter sind erlaubt, z. B. „Ihre Unterlagen zu {{selectedScenario}}“.',
      validation: (Rule) => Rule.required().min(3).max(180),
    }),

    defineField({
      name: 'preheader',
      title: 'Vorschautext optional',
      type: 'string',
      group: 'content',
      description:
        'Kurzer Vorschautext, der in vielen E-Mail-Programmen neben dem Betreff erscheint.',
      validation: (Rule) => Rule.max(200),
    }),

    defineField({
      name: 'body',
      title: 'Mailtext',
      type: 'text',
      rows: 16,
      group: 'content',
      description:
        'Der Text wird serverseitig sicher als Text- und HTML-Mail aufbereitet. Platzhalter können verwendet werden.',
      validation: (Rule) => Rule.required().min(20),
    }),

    defineField({
      name: 'placeholders',
      title: 'Verwendete Platzhalter',
      type: 'array',
      group: 'content',
      description:
        'Dokumentation der Platzhalter, die in Betreff oder Mailtext verwendet werden.',
      of: [
        {
          type: 'string',
          options: {
            list: placeholderOptions,
          },
        },
      ],
      validation: (Rule) => Rule.unique(),
    }),

    defineField({
      name: 'includeSignature',
      title: 'Mitarbeitersignatur anhängen',
      type: 'boolean',
      group: 'delivery',
      initialValue: true,
      description:
        'Name und E-Mail kommen vom aktuell angemeldeten Vertriebsmitarbeiter.',
    }),

    defineField({
      name: 'signatureIntro',
      title: 'Text vor der Signatur',
      type: 'string',
      group: 'content',
      initialValue: 'Freundliche Grüße',
      hidden: ({ document }) => document?.includeSignature !== true,
    }),

    defineField({
      name: 'includeSelectedDocuments',
      title: 'Ausgewählte Produktblätter anhängen',
      type: 'boolean',
      group: 'delivery',
      initialValue: true,
    }),

    defineField({
      name: 'includeCalculationSummary',
      title: 'Berechnungszusammenfassung einfügen',
      type: 'boolean',
      group: 'delivery',
      initialValue: true,
    }),

    defineField({
      name: 'defaultAttachments',
      title: 'Zusätzliche Standard-Unterlagen',
      type: 'array',
      group: 'relations',
      description:
        'Diese Unterlagen werden zusätzlich zu den vom Benutzer ausgewählten PDFs angehängt.',
      of: [
        {
          type: 'reference',
          to: [{ type: 'salesDocument' }],
        },
      ],
      validation: (Rule) => Rule.unique(),
    }),

    defineField({
      name: 'replyTo',
      title: 'Antwortadresse optional',
      type: 'string',
      group: 'delivery',
      description:
        'Leer lassen, damit Antworten an den eingeloggten Mitarbeiter gehen.',
      validation: (Rule) => Rule.email(),
    }),

    defineField({
      name: 'ccRecipients',
      title: 'Standard-CC-Empfänger',
      type: 'array',
      group: 'delivery',
      of: [
        {
          type: 'string',
          validation: (Rule) => Rule.email(),
        },
      ],
      validation: (Rule) => Rule.unique(),
    }),

    defineField({
      name: 'bccRecipients',
      title: 'Standard-BCC-Empfänger',
      type: 'array',
      group: 'delivery',
      description:
        'Nur verwenden, wenn interne Kopien wirklich erforderlich sind.',
      of: [
        {
          type: 'string',
          validation: (Rule) => Rule.email(),
        },
      ],
      validation: (Rule) => Rule.unique(),
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
      description:
        'Wird verwendet, wenn keine speziellere Vorlage gefunden wird.',
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
      templateType: 'templateType',
      targetGroup: 'targetGroup',
      status: 'status',
    },
    prepare({ title, templateType, targetGroup, status }) {
      return {
        title: title || 'E-Mail-Vorlage',
        subtitle: `${templateType || 'Kein Typ'} · ${targetGroup || 'Keine Zielgruppe'} · ${status || 'Kein Status'}`,
      }
    },
  },
})