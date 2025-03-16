import { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'

export const Visitors: CollectionConfig = {
  slug: 'visitors',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
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
      name: 'congregation',
      type: 'text',
      required: false,
    },
    {
      name: 'notes',
      type: 'textarea',
      required: false,
    },
  ],
  timestamps: true,
}
