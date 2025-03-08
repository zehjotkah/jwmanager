import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'

export const FieldServiceMeetings: CollectionConfig = {
  slug: 'field-service-meetings',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['date', 'time', 'location', 'group', 'conductor'],
    useAsTitle: 'date',
    group: 'JW Manager',
  },
  fields: [
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'MMM d, yyyy',
        },
      },
    },
    {
      name: 'time',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'timeOnly',
          displayFormat: 'h:mm a',
        },
      },
    },
    {
      name: 'group',
      type: 'relationship',
      relationTo: 'groups',
      hasMany: false,
    },
    {
      name: 'location',
      type: 'text',
      required: true,
    },
    {
      name: 'conductor',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  timestamps: true,
}