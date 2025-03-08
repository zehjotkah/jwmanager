import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'

export const Groups: CollectionConfig = {
  slug: 'groups',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'overseer', 'assistant'],
    useAsTitle: 'name',
    group: 'JW Manager',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'overseer',
      label: 'Group Overseer',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
    },
    {
      name: 'assistant',
      label: 'Assistant',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
    },
    {
      name: 'publishers',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
    },
  ],
  timestamps: true,
}