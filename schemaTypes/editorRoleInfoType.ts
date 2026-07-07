import {defineField, defineType} from 'sanity'

export const editorRoleInfoType = defineType({
  name: 'editorRoleInfo',
  title: 'Sanity Rollen Info',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Rollenname', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'roleType',
      title: 'Rolle',
      type: 'string',
      options: {
        list: [
          {title: 'Admin', value: 'admin'},
          {title: 'Editor', value: 'editor'},
          {title: 'Viewer', value: 'viewer'},
          {title: 'Content-Pflege', value: 'contentMaintenance'},
          {title: 'Vertrieb / App-Nutzer', value: 'salesUser'},
        ],
      },
    }),
    defineField({name: 'description', title: 'Beschreibung', type: 'text', rows: 4}),
    defineField({name: 'responsibilities', title: 'Aufgaben', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'notResponsibleFor', title: 'Nicht zuständig für', type: 'array', of: [{type: 'string'}]}),
  ],
})
