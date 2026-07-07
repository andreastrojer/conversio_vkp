import {defineField, defineType} from 'sanity'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    {name: 'basis', title: 'Basis', default: true},
    {name: 'branding', title: 'Branding'},
    {name: 'seo', title: 'SEO'},
    {name: 'contact', title: 'Kontakt'},
    {name: 'legal', title: 'Rechtliches'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Name der Anwendung',
      type: 'string',
      group: 'basis',
      initialValue: 'Conversio Energie Web-App',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'companyName',
      title: 'Unternehmensname',
      type: 'string',
      group: 'basis',
      initialValue: 'Conversio Energie',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'logo', title: 'Logo', type: 'image', group: 'branding', options: {hotspot: true}}),
    defineField({name: 'logoDark', title: 'Logo für dunklen Hintergrund', type: 'image', group: 'branding', options: {hotspot: true}}),
    defineField({name: 'favicon', title: 'Favicon', type: 'image', group: 'branding'}),
    defineField({
      name: 'branding',
      title: 'Branding',
      type: 'object',
      group: 'branding',
      fields: [
        defineField({name: 'primaryColor', title: 'Primärfarbe', type: 'string', initialValue: '#efb804'}),
        defineField({name: 'secondaryColor', title: 'Sekundärfarbe', type: 'string', initialValue: '#3d4248'}),
        defineField({name: 'backgroundColor', title: 'Hintergrundfarbe', type: 'string', initialValue: '#f7f5ef'}),
        defineField({name: 'fontPrimary', title: 'Schriftart primär', type: 'string', initialValue: 'Inter'}),
        defineField({name: 'fontSecondary', title: 'Schriftart sekundär', type: 'string'}),
      ],
    }),
    defineField({
      name: 'defaultMeta',
      title: 'Default-Metadaten',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({name: 'title', title: 'Meta-Titel', type: 'string', initialValue: 'Conversio Energie | Interaktive Energieberatung'}),
        defineField({
          name: 'description',
          title: 'Meta-Beschreibung',
          type: 'text',
          rows: 3,
          initialValue: 'Interaktive Web-App für die digitale Energieberatung von Conversio Energie – mit passenden Lösungen für Privatkunden, Unternehmen und Gemeinden.',
        }),
        defineField({name: 'ogImage', title: 'Social Preview Bild', type: 'image', options: {hotspot: true}}),
      ],
    }),
    defineField({
      name: 'contact',
      title: 'Kontakt',
      type: 'object',
      group: 'contact',
      fields: [
        defineField({name: 'email', title: 'E-Mail', type: 'string'}),
        defineField({name: 'phone', title: 'Telefon', type: 'string'}),
        defineField({name: 'address', title: 'Adresse', type: 'text', rows: 3}),
        defineField({name: 'websiteUrl', title: 'Website', type: 'url'}),
      ],
    }),
    defineField({
      name: 'legalLinks',
      title: 'Rechtliche Links',
      type: 'array',
      group: 'legal',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'label', title: 'Beschriftung', type: 'string', validation: (Rule) => Rule.required()}),
            defineField({name: 'url', title: 'URL', type: 'url', validation: (Rule) => Rule.required()}),
          ],
          preview: {select: {title: 'label', subtitle: 'url'}},
        },
      ],
    }),
    defineField({name: 'maintenanceMode', title: 'Wartungsmodus', type: 'boolean', group: 'basis', initialValue: false}),
  ],
  preview: {select: {title: 'title', subtitle: 'companyName', media: 'logo'}},
})
