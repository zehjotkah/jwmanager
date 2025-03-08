import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'

export const PublicTalkTitles: CollectionConfig = {
  slug: 'public-talk-titles',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['number', 'title'],
    useAsTitle: 'title',
    group: 'JW Manager',
  },
  fields: [
    {
      name: 'number',
      type: 'number',
      required: true,
      admin: {
        description: 'Talk number from S-99 form',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'deliveryDates',
      type: 'array',
      label: 'Delivery Dates',
      admin: {
        description: 'Track when this talk has been delivered',
      },
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
        },
        {
          name: 'speaker',
          type: 'text',
          admin: {
            description: 'Name of the speaker who delivered the talk',
          },
        },
      ],
    },
  ],
  timestamps: true,
}