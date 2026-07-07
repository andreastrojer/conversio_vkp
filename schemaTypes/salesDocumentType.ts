import {defineField, defineType} from 'sanity'

export const salesDocumentType = defineType({
  name: 'salesDocument',
  title: 'Sales Document',
  type: 'document',
  groups: [
    {name: 'basis', title: 'Basis', default: true},
    {name: 'relations', title: 'Zuordnung'},
    {name: 'asset', title: 'Datei / Link'},
    {name: 'settings', title: 'Einstellungen'},
  ],
  fields: [
    defineField({name: 'title', title: 'Titel', type: 'string', group: 'basis', validation: (Rule) => Rule.required()}),
    defineField({name: 'description', title: 'Beschreibung', type: 'text', rows: 4, group: 'basis'}),
    defineField({
      name: 'documentType',
      title: 'Dokumenttyp',
      type: 'string',
      group: 'basis',
      options: {
        list: [
          {title: 'Produktunterlage', value: 'product'},
          {title: 'Kategorie-Unterlage', value: 'category'},
          {title: 'Referenzunterlage', value: 'reference'},
          {title: 'Förderinformation', value: 'funding'},
          {title: 'Nachfassunterlage', value: 'followUp'},
          {title: 'Sonstiges', value: 'other'},
        ],
      },
      initialValue: 'product',
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
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'categories', title: 'Kategorien', type: 'array', group: 'relations', of: [{type: 'reference', to: [{type: 'productCategory'}]}]}),
    defineField({name: 'scenarios', title: 'Szenarien', type: 'array', group: 'relations', of: [{type: 'reference', to: [{type: 'scenario'}]}]}),
    defineField({name: 'referenceProjects', title: 'Referenzprojekte', type: 'array', group: 'relations', of: [{type: 'reference', to: [{type: 'referenceProject'}]}]}),
    defineField({name: 'version', title: 'Version', type: 'string', group: 'settings', initialValue: '1.0'}),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'settings',
      initialValue: 'active',
      options: {
        list: [
          {title: 'Entwurf', value: 'draft'},
          {title: 'Aktiv', value: 'active'},
          {title: 'Archiviert', value: 'archived'},
        ],
      },
    }),
    defineField({name: 'pdfFile', title: 'PDF-Datei in Sanity', type: 'file', group: 'asset'}),
    defineField({name: 'sharePointUrl', title: 'SharePoint-/PDF-Link', type: 'url', group: 'asset'}),
    defineField({name: 'previewImage', title: 'Vorschaubild', type: 'image', group: 'asset', options: {hotspot: true}}),
    defineField({name: 'sortOrder', title: 'Reihenfolge', type: 'number', group: 'settings', initialValue: 0}),
    defineField({name: 'isActive', title: 'Aktiv verfügbar', type: 'boolean', group: 'settings', initialValue: true}),
  ],
  orderings: [{title: 'Reihenfolge', name: 'sortOrderAsc', by: [{field: 'sortOrder', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'documentType', media: 'previewImage'}},
})
