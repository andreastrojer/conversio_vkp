import { defineArrayMember, defineField, defineType } from 'sanity'

const modelContentItem = defineArrayMember({
  name: 'modelDetailContentItem',
  title: 'Stichpunkt',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Überschrift optional',
      type: 'string',
    }),
    defineField({
      name: 'text',
      title: 'Beschreibung',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Aktiv',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'text',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || subtitle || 'Stichpunkt',
        subtitle: title ? subtitle : undefined,
      }
    },
  },
})

const modelDetailSection = defineArrayMember({
  name: 'modelDetailSection',
  title: 'Tab-Abschnitt',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Abschnittstitel',
      type: 'string',
      description:
        'Zum Beispiel „LEISTUNG & ERTRAG“, „SYSTEMTECHNIK“ oder „GARANTIEN“.',
    }),
    defineField({
      name: 'text',
      title: 'Fließtext',
      type: 'text',
      rows: 10,
    }),
    defineField({
      name: 'specificationRows',
      title: 'Technische Werte',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'modelSpecificationRow',
          title: 'Technischer Wert',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Bezeichnung',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'value',
              title: 'Wert',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'value',
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'image',
      title: 'Eigenes Bild optional',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternativtext',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'media',
      title: 'Medium / Animation optional',
      type: 'reference',
      to: [{ type: 'mediaAsset' }],
    }),
    defineField({
      name: 'isActive',
      title: 'Aktiv',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
    },
    prepare({ title, media }) {
      return {
        title: title || 'Textabschnitt',
        media,
      }
    },
  },
})

export const productModelType = defineType({
  name: 'productModel',
  title: 'Produktmodell',
  type: 'document',

  groups: [
    { name: 'basis', title: 'Basis', default: true },
    { name: 'content', title: 'Modellinhalte' },
    { name: 'media', title: 'Medien' },
    { name: 'settings', title: 'Einstellungen' },
  ],

  fields: [
    defineField({
      name: 'title',
      title: 'Modellbezeichnung',
      type: 'string',
      group: 'basis',
      description: 'Zum Beispiel „BRES-720-375“.',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Technischer Modell-Key',
      type: 'slug',
      group: 'basis',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'seriesLabel',
      title: 'Serienkürzel',
      type: 'string',
      group: 'basis',
      description:
        'Kurzes Label auf der Modellkarte, z. B. „SKS“.',
    }),



    defineField({
      name: 'modelGroupOrder',
      title: 'Reihenfolge der Modellgruppe',
      type: 'number',
      group: 'settings',
      description:
        'Zum Beispiel 10 für Luftgekühlt und 20 für Tauchgekühlt.',
      initialValue: 0,
    }),

    defineField({
      name: 'image',
      title: 'Modellbild optional',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternativtext',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'selectionCardBackground',
      title: 'Hintergrundgrafik der Modellkarte optional',
      type: 'image',
      group: 'media',
      description:
        'Optionale dekorative Grafik für die Modellkarte. Leer lassen, wenn nur der normale graue beziehungsweise gelbe Card-Hintergrund verwendet wird.',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternativtext',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'selectionCardBackground2',
      title: 'Hintergrundgrafik der Modellkarte optional',
      type: 'image',
      group: 'media',
      description:
        'Optionale dekorative Grafik für die Modellkarte. Leer lassen, wenn nur der normale graue beziehungsweise gelbe Card-Hintergrund verwendet wird.',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternativtext',
          type: 'string',
        }),
      ],
    }),

    defineField({
      name: 'media',
      title: 'Modell-Medium optional',
      type: 'reference',
      group: 'media',
      to: [{ type: 'mediaAsset' }],
    }),

    defineField({
      name: 'detailTabs',
      title: 'Modellspezifische Tab-Inhalte',
      type: 'array',
      group: 'content',
      description:
        'Inhalte, die beim Wechsel des Modells in Überblick, Technische Daten, Zusammenspiel und Referenzen angezeigt werden.',
      validation: (Rule) => Rule.required().min(1),

      of: [
        defineArrayMember({
          name: 'modelDetailTab',
          title: 'Modell-Tab',
          type: 'object',

          fields: [
            defineField({
              name: 'title',
              title: 'Tab-Titel',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),

            defineField({
              name: 'key',
              title: 'Technischer Tab-Key',
              type: 'string',
              options: {
                list: [
                  { title: 'Überblick', value: 'overview' },
                  { title: 'Technische Daten', value: 'technical' },
                  { title: 'Zusammenspiel', value: 'interplay' },
                  { title: 'Referenzen', value: 'reference' },
                ],
                layout: 'radio',
              },
              validation: (Rule) => Rule.required(),
            }),

            defineField({
              name: 'introText',
              title: 'Einleitung rechts',
              type: 'text',
              rows: 5,
              hidden: ({ parent }) =>
                parent?.key !== 'interplay' &&
                parent?.key !== 'reference',
            }),

            defineField({
              name: 'contentItems',
              title: 'Stichpunkte rechts',
              type: 'array',
              hidden: ({ parent }) =>
                parent?.key !== 'interplay' &&
                parent?.key !== 'reference',
              of: [modelContentItem],
            }),

            defineField({
              name: 'sections',
              title: 'Abschnitte innerhalb dieses Tabs',
              type: 'array',
              hidden: ({ parent }) =>
                parent?.key === 'interplay' ||
                parent?.key === 'reference',
              of: [modelDetailSection],
            }),

            defineField({
              name: 'isActive',
              title: 'Aktiv',
              type: 'boolean',
              initialValue: true,
            }),
          ],

          preview: {
            select: {
              title: 'title',
              subtitle: 'key',
            },
          },
        }),
      ],
    }),

    defineField({
      name: 'sortOrder',
      title: 'Reihenfolge',
      type: 'number',
      group: 'settings',
      initialValue: 0,
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
      media: 'image',
      isActive: 'isActive',
    },
    prepare({ title, media, isActive }) {
      return {
        title,
        subtitle: isActive === false ? 'Inaktiv' : 'Aktiv',
        media,
      }
    },
  },
})