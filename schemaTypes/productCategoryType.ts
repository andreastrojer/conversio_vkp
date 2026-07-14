import { defineArrayMember, defineField, defineType } from 'sanity'

const targetGroupOptions = [
  { title: 'Privatkunden', value: 'b2c' },
  { title: 'Geschäftskunden', value: 'b2b' },
  { title: 'Beide', value: 'both' },
]

export const productCategoryType = defineType({
  name: 'productCategory',
  title: 'Product Category',
  type: 'document',

  groups: [
    { name: 'basis', title: 'Basis', default: true },
    { name: 'catalog', title: 'Katalogansicht' },
    { name: 'detail', title: 'Produktdetail' },
    { name: 'general', title: 'Allgemeine Inhalte' },
    { name: 'media', title: 'Weitere Medien' },
    { name: 'settings', title: 'Einstellungen' },
  ],

  fields: [
    // ==================================================
    // BASIS
    // ==================================================

    defineField({
      name: 'title',
      title: 'Produktname',
      type: 'string',
      group: 'basis',
      description: 'Vollständiger Produktname, z. B. „Photovoltaik“.',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'URL-Name',
      type: 'slug',
      group: 'basis',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'categoryType',
      title: 'Kategorie-Typ',
      type: 'string',
      group: 'basis',
      options: {
        list: [
          { title: 'Photovoltaik', value: 'pv' },
          { title: 'Speicher', value: 'speicher' },
          { title: 'Wärmepumpe', value: 'waermepumpe' },
          { title: 'Ladeinfrastruktur', value: 'ladeinfrastruktur' },
          { title: 'Energiegemeinschaft', value: 'energiegemeinschaft' },
          { title: 'Gebäudeautomation', value: 'gebaeudeautomation' },
          { title: 'Service / Wartung', value: 'service' },
          { title: 'Drohnencheck', value: 'drohnencheck' },
          { title: 'Sonstiges', value: 'sonstiges' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'targetGroup',
      title: 'Zielgruppe',
      type: 'string',
      group: 'basis',
      initialValue: 'both',
      options: {
        list: targetGroupOptions,
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),

    // ==================================================
    // KATALOGANSICHT
    // Erste gezeigte Seite: „UNSER KATALOG“
    // ==================================================

    defineField({
      name: 'catalogLabel',
      title: 'Name in der Katalogliste',
      type: 'string',
      group: 'catalog',
      description:
        'Name neben der Nummer. Kann vom normalen Produktnamen abweichen, z. B. „BEG“.',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'catalogImage',
      title: 'Bild in der Katalogansicht',
      type: 'image',
      group: 'catalog',
      description:
        'Das vollständig dargestellte Produktbild auf der linken Seite von „Unser Katalog“.',
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
      name: 'catalogMedia',
      title: 'Katalog-Medium / Animation optional',
      type: 'reference',
      group: 'catalog',
      description:
        'Optionales Medium aus den Media Assets. Wird bevorzugt verwendet, wenn vorhanden.',
      to: [{ type: 'mediaAsset' }],
    }),

    defineField({
      name: 'catalogCtaLabel',
      title: 'CTA-Text im Katalog',
      type: 'string',
      group: 'catalog',
      description: 'Zum Beispiel „ZU PHOTOVOLTAIK“.',
      validation: (Rule) => Rule.required(),
    }),

    // ==================================================
    // PRODUKTDETAIL
    // Zweite gezeigte Seite: „PHOTOVOLTAIK“
    // ==================================================

    defineField({
      name: 'detailTitle',
      title: 'Titel der Produktdetailseite',
      type: 'string',
      group: 'detail',
      description:
        'Große Überschrift oben, z. B. „PHOTOVOLTAIK“. Falls leer, kann das Frontend den normalen Produktnamen verwenden.',
    }),

    defineField({
      name: 'navigationLabel',
      title: 'Name in der unteren Navigation',
      type: 'string',
      group: 'detail',
      description:
        'Beschriftung in der unteren Produktnavigation, z. B. „ENERGIEGEMEINSCHAFT“.',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'detailImage',
      title: 'Hauptbild der Produktdetailseite',
      type: 'image',
      group: 'detail',
      description:
        'Großes beziehungsweise angeschnittenes Produktbild links in der Detailansicht.',
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
      name: 'detailMedia',
      title: 'Hauptmedium / Animation optional',
      type: 'reference',
      group: 'detail',
      description:
        'Optionales Video oder eine Animation für die Produktdetailseite.',
      to: [{ type: 'mediaAsset' }],
    }),

    defineField({
      name: 'detailTabs',
      title: 'Obere Produkt-Tabs',
      type: 'array',
      group: 'detail',
      description:
        'Die Tabs „Überblick“, „Technische Daten“ und „Zusammenspiel“.',
      validation: (Rule) => Rule.required().min(1),
      of: [
        defineArrayMember({
          name: 'productDetailTab',
          title: 'Produkt-Tab',
          type: 'object',

          fields: [
            defineField({
              name: 'title',
              title: 'Tab-Titel',
              type: 'string',
              description:
                'Sichtbarer Titel, z. B. „ÜBERBLICK“, „TECHNISCHE DATEN“ oder „ZUSAMMENSPIEL“.',
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
                ],
                layout: 'radio',
              },
              validation: (Rule) => Rule.required(),
            }),

            defineField({
              name: 'sections',
              title: 'Abschnitte innerhalb dieses Tabs',
              type: 'array',
              description:
                'Beim Überblick meist ein Textabschnitt. Bei technischen Daten mehrere aufklappbare Abschnitte.',
              validation: (Rule) => Rule.required().min(1),

              of: [
                defineArrayMember({
                  name: 'productDetailSection',
                  title: 'Tab-Abschnitt',
                  type: 'object',

                  fields: [
                    defineField({
                      name: 'title',
                      title: 'Abschnittstitel',
                      type: 'string',
                      description:
                        'Zum Beispiel „LEISTUNG & ERTRAG“, „SYSTEMTECHNIK“ oder „GARANTIEN“. Beim Überblick darf das Feld leer bleiben.',
                    }),

                    defineField({
                      name: 'text',
                      title: 'Fließtext',
                      type: 'text',
                      rows: 10,
                      description:
                        'Text für den Abschnitt. Beim Überblick können hier mehrere Absätze eingetragen werden.',
                    }),

                    defineField({
                      name: 'specificationRows',
                      title: 'Technische Werte',
                      type: 'array',
                      description:
                        'Wertepaare wie „Modulleistung – 425–440 WP“.',
                      of: [
                        defineArrayMember({
                          name: 'specificationRow',
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
                      title: 'Eigenes Bild für diesen Abschnitt optional',
                      type: 'image',
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
                }),
              ],
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

    // ==================================================
    // BESTEHENDE ALLGEMEINE INHALTE
    // Bleiben für andere Funktionen erhalten
    // ==================================================

    defineField({
      name: 'shortDescription',
      title: 'Kurzbeschreibung',
      type: 'text',
      rows: 3,
      group: 'general',
    }),

    defineField({
      name: 'description',
      title: 'Allgemeine Detailbeschreibung',
      type: 'text',
      rows: 6,
      group: 'general',
    }),

    defineField({
      name: 'benefits',
      title: 'Nutzenargumente',
      type: 'array',
      group: 'general',
      of: [{ type: 'string' }],
    }),

    defineField({
      name: 'technicalNotes',
      title: 'Allgemeine technische Hinweise',
      type: 'text',
      rows: 5,
      group: 'general',
    }),

    defineField({
      name: 'fundingNotes',
      title: 'Förderhinweise',
      type: 'text',
      rows: 4,
      group: 'general',
    }),

    // ==================================================
    // WEITERE MEDIEN
    // ==================================================

    defineField({
      name: 'icon',
      title: 'Icon / Symbol',
      type: 'string',
      group: 'media',
      description:
        'Optionaler Icon-Key für andere Bereiche der App.',
    }),

    defineField({
      name: 'media',
      title: 'Weitere verknüpfte Medien',
      type: 'array',
      group: 'media',
      of: [
        {
          type: 'reference',
          to: [{ type: 'mediaAsset' }],
        },
      ],
    }),

    defineField({
      name: 'documents',
      title: 'Verknüpfte Unterlagen',
      type: 'array',
      group: 'media',
      of: [
        {
          type: 'reference',
          to: [{ type: 'salesDocument' }],
        },
      ],
    }),

    // ==================================================
    // EINSTELLUNGEN
    // ==================================================

    defineField({
      name: 'sortOrder',
      title: 'Allgemeine Reihenfolge',
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
      categoryType: 'categoryType',
      targetGroup: 'targetGroup',
      media: 'catalogImage',
    },

    prepare({ title, categoryType, targetGroup, media }) {
      return {
        title,
        subtitle: `${categoryType ?? 'Kein Typ'} · ${targetGroup ?? 'Keine Zielgruppe'}`,
        media,
      }
    },
  },
})