import { defineField, defineType } from 'sanity'

const targetAudienceOptions = [
  { title: 'Privatkunden', value: 'b2c' },
  { title: 'Geschäftskunden', value: 'b2b' },
  { title: 'Beide', value: 'both' },
]

export const appScreenType = defineType({
  name: 'appScreen',
  title: 'App Screen',
  type: 'document',
  groups: [
    { name: 'basis', title: 'Basis', default: true },
    { name: 'content', title: 'Inhalt' },
    { name: 'media', title: 'Medien' },
    { name: 'actions', title: 'Aktionen' },
    { name: 'settings', title: 'Einstellungen' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Interner Titel',
      type: 'string',
      group: 'basis',
      description: 'Interner Name im CMS, z. B. „Kundengruppe auswählen“.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'screenKey',
      title: 'Technischer Screen-Key',
      type: 'slug',
      group: 'basis',
      description: 'Muss mit dem Navigation-Step-Key übereinstimmen, z. B. „customer-selection“.',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'screenType',
      title: 'Screen-Typ',
      type: 'string',
      group: 'basis',
      description: 'Legt fest, welche technische Screen-Komponente in der Web-App verwendet wird.',
      options: {
        list: [
          { title: 'Start / Hero', value: 'hero' },
          { title: 'Content / Start', value: 'welcome' },
          { title: 'Kundengruppe auswählen', value: 'customerSelection' },
          { title: 'Wer wir sind', value: 'about' },
          { title: 'Was wir bieten', value: 'offer' },
          { title: 'Der Prozess', value: 'process' },
          { title: 'Was passt zu ihnen', value: 'whatfits' },
          { title: 'Fragebogen / Beratung', value: 'questionnaire' },
          { title: 'Szenario-Matrix', value: 'scenarioMatrix' },
          { title: 'Szenario / Empfehlung', value: 'recommendation' },
          { title: 'Medien & Referenzen', value: 'mediaReferences' },
          { title: 'Dokumentauswahl', value: 'documentSelection' },
          { title: 'Kontakt / Lead-Erfassung', value: 'contact' },
          { title: 'AR / Scan', value: 'ar' },
          { title: 'Abschluss / Zusammenfassung', value: 'closing' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'contentPurpose',
      title: 'Inhaltlicher Zweck',
      type: 'string',
      group: 'basis',
      description: 'Beschreibt, wofür der Screen fachlich im Beratungsflow verwendet wird.',
      options: {
        list: [
          { title: 'Startseite', value: 'start' },
          { title: 'Startseite nach Login', value: 'welcome' },
          { title: 'Intro', value: 'intro' },
          { title: 'Kundengruppe', value: 'customerGroup' },
          { title: 'Wer wir sind', value: 'about' },
          { title: 'Was wir bieten', value: 'offer' },
          { title: 'Was passt zu ihnen', value: 'whatfits' },
          { title: 'Vorteile / Nutzen', value: 'benefits' },
          { title: 'Ablauf / Prozess', value: 'process' },
          { title: 'Bedarf erfassen', value: 'needs' },
          { title: 'Beratungsmatrix', value: 'scenarioMatrix' },
          { title: 'Empfehlung', value: 'recommendation' },
          { title: 'Medien & Referenzen', value: 'mediaReferences' },
          { title: 'Dokumente / Unterlagen', value: 'salesDocuments' },
          { title: 'Kontakt', value: 'contact' },
          { title: 'Abschluss', value: 'closing' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'targetAudience',
      title: 'Zielgruppe',
      type: 'string',
      group: 'basis',
      description: 'Legt fest, ob der Screen für Privatkunden, Geschäftskunden oder beide gedacht ist.',
      options: { list: targetAudienceOptions, layout: 'radio' },
      initialValue: 'both',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      group: 'content',
      description: 'Große sichtbare Überschrift im Screen.',
    }),
    defineField({
      name: 'subline',
      title: 'Subline',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'Kurzer Erklärungstext unter der Headline.',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero-Bild',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
    }),
    defineField({
      name: 'heroImage2',
      title: 'Hero-Bild2',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
    }),
    defineField({
      name: 'heroMedia',
      title: 'Hero-Medium / Video optional',
      type: 'reference',
      group: 'media',
      to: [{ type: 'mediaAsset' }],
      description: 'Optionales Bild, Video oder externer Link aus der Mediathek.',
    }),
    defineField({
      name: 'sections',
      title: 'Sections / Inhalte',
      type: 'array',
      group: 'content',
      description: 'Flexible Inhaltsbereiche für Text, Bild, Karten, Medien oder CTAs.',
      of: [
        {
          type: 'object',
          name: 'screenSection',
          title: 'Section',
          fields: [
            defineField({ name: 'title', title: 'Section-Titel', type: 'string' }),
            defineField({ name: 'eyebrow', title: 'Kleines Label / Eyebrow', type: 'string' }),
            defineField({ name: 'text', title: 'Text', type: 'text', rows: 5 }),
            defineField({ name: 'image', title: 'Bild', type: 'image', options: { hotspot: true } }),
            defineField({
              name: 'media',
              title: 'Medium / Video optional',
              type: 'reference',
              to: [{ type: 'mediaAsset' }],
            }),
            defineField({
              name: 'cta',
              title: 'Section CTA / Button',
              type: 'object',
              fields: [
                defineField({
                  name: 'label',
                  title: 'Button-Text',
                  type: 'string',
                  initialValue: 'JETZT STARTEN',
                }),
                defineField({
                  name: 'image',
                  title: 'Button-Bild / Pfeil-Bild',
                  type: 'image',
                  description: 'Bild für den CTA, z. B. ein Pfeil-Icon oder runder Weiter-Button.',
                  options: {
                    hotspot: true,
                  },
                }),
                defineField({
                  name: 'target',
                  title: 'Ziel / Aktion',
                  type: 'string',
                  description: 'Z. B. customer-type:b2c, customer-type:b2b oder ein Screen-Key.',
                }),
                defineField({
                  name: 'style',
                  title: 'Button-Stil',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Dunkel', value: 'dark' },
                      { title: 'Hell', value: 'light' },
                      { title: 'Gelb', value: 'yellow' },
                    ],
                    layout: 'radio',
                  },
                  initialValue: 'dark',
                }),
              ],
            }),
            defineField({
              name: 'visibleFor',
              title: 'Sichtbar für',
              type: 'string',
              description: 'Damit einzelne Sections je nach B2B/B2C unterschiedlich angezeigt werden können.',
              options: { list: targetAudienceOptions, layout: 'radio' },
              initialValue: 'both',
            }),
            defineField({
              name: 'layout',
              title: 'Layout',
              type: 'string',
              options: {
                list: [
                  { title: 'Text', value: 'text' },
                  { title: 'Text + Bild', value: 'textImage' },
                  { title: 'Karten', value: 'cards' },
                  { title: 'Medien / Video', value: 'media' },
                  { title: 'Vergleich / Matrix', value: 'comparison' },
                  { title: 'Timeline / Prozess', value: 'timeline' },
                  { title: 'CTA', value: 'cta' },
                ],
              },
              initialValue: 'text',
            }),
            defineField({ name: 'sortOrder', title: 'Reihenfolge', type: 'number', initialValue: 0 }),
          ],
          preview: {
            select: { title: 'title', subtitle: 'layout', media: 'image' },
            prepare({ title, subtitle, media }) {
              return {
                title: title || 'Unbenannte Section',
                subtitle: subtitle ? `Layout: ${subtitle}` : 'Keine Layout-Auswahl',
                media,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'productBottomNavigation',
      title: 'Untere Produktnavigation',
      type: 'array',
      group: 'content',
      description:
        'Navigation am unteren Rand der Produktdetailseite.',
      hidden: ({ document }) => document?.screenType !== 'whatfits',

      of: [
        {
          name: 'productNavigationItem',
          title: 'Navigationseintrag',
          type: 'object',

          fields: [
            defineField({
              name: 'itemType',
              title: 'Eintragstyp',
              type: 'string',
              options: {
                list: [
                  {
                    title: 'Zurück zum Katalog',
                    value: 'catalog',
                  },
                  {
                    title: 'Produkt',
                    value: 'product',
                  },
                  {
                    title: 'Anderer App Screen',
                    value: 'screen',
                  },
                ],
                layout: 'radio',
              },
              validation: (Rule) => Rule.required(),
            }),

            defineField({
              name: 'label',
              title: 'Beschriftung',
              type: 'string',
              description:
                'Zum Beispiel „MATRIX“. Bei Produkten kann der Produktname verwendet werden.',
            }),

            defineField({
              name: 'product',
              title: 'Produkt',
              type: 'reference',
              to: [{ type: 'productCategory' }],
              hidden: ({ parent }) => parent?.itemType !== 'product',
            }),

            defineField({
              name: 'screenKey',
              title: 'Ziel-Screen-Key',
              type: 'string',
              description:
                'Zum Beispiel „scenario-matrix“.',
              hidden: ({ parent }) => parent?.itemType !== 'screen',
            }),

            defineField({
              name: 'iconImage',
              title: 'Icon-Bild optional',
              type: 'image',
              description:
                'Zum Beispiel das kleine Listen-Symbol für den Katalog-Button.',
              options: {
                hotspot: true,
              },
              hidden: ({ parent }) => parent?.itemType !== 'catalog',
            }),
          ],

          preview: {
            select: {
              itemType: 'itemType',
              label: 'label',
              productTitle: 'product.title',
              media: 'iconImage',
            },

            prepare({ itemType, label, productTitle, media }) {
              return {
                title:
                  label ||
                  productTitle ||
                  (itemType === 'catalog'
                    ? 'Zurück zum Katalog'
                    : 'Navigationseintrag'),
                subtitle: itemType,
                media,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'primaryCta',
      title: 'Primärer CTA',
      type: 'object',
      group: 'actions',
      fields: [
        defineField({ name: 'label', title: 'Button-Text', type: 'string' }),
        defineField({
          name: 'target',
          title: 'Ziel / Route',
          type: 'string',
          description: 'Z. B. „next“, „back“ oder ein Screen-Key wie „customer-selection“.',
        }),
      ],
    }),
    defineField({
      name: 'secondaryCta',
      title: 'Sekundärer CTA',
      type: 'object',
      group: 'actions',
      fields: [
        defineField({ name: 'label', title: 'Button-Text', type: 'string' }),
        defineField({ name: 'target', title: 'Ziel / Route', type: 'string' }),
      ],
    }),
    defineField({ name: 'sortOrder', title: 'Reihenfolge', type: 'number', group: 'settings', initialValue: 0 }),
    defineField({ name: 'isActive', title: 'Aktiv', type: 'boolean', group: 'settings', initialValue: true }),
  ],
  orderings: [{ title: 'Reihenfolge', name: 'sortOrderAsc', by: [{ field: 'sortOrder', direction: 'asc' }] }],
  preview: {
    select: {
      title: 'title',
      screenType: 'screenType',
      contentPurpose: 'contentPurpose',
      targetAudience: 'targetAudience',
      media: 'heroImage',
    },
    prepare({ title, screenType, contentPurpose, targetAudience, media }) {
      return {
        title: title || 'Unbenannter Screen',
        subtitle: `${screenType || 'kein Typ'} · ${contentPurpose || 'kein Zweck'} · ${targetAudience || 'keine Zielgruppe'}`,
        media,
      }
    },
  },
})
