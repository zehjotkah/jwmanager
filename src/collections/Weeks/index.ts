import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'

export const Weeks: CollectionConfig = {
  slug: 'weeks',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['weekStartDate', 'midweekMeeting.openingSong', 'weekendMeeting.chairman'],
    useAsTitle: 'weekStartDate',
    group: 'JW Manager',
  },
  fields: [
    {
      name: 'weekStartDate',
      label: 'Week Start Date (Monday)',
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
      name: 'midweekMeeting',
      label: 'Midweek Meeting (Life and Ministry)',
      type: 'group',
      fields: [
        {
          name: 'calculatedTime',
          label: 'Meeting Time',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'Automatically calculated based on congregation settings',
          },
        },
        // Opening
        {
          name: 'opening',
          type: 'group',
          fields: [
            {
              name: 'song',
              type: 'number',
              label: 'Opening Song',
              min: 1,
              max: 151,
            },
            {
              name: 'prayer',
              type: 'relationship',
              relationTo: 'users',
              hasMany: false,
            },
          ],
        },
        // Treasures from God's Word section
        {
          name: 'treasures',
          label: 'TREASURES FROM GOD\'S WORD',
          type: 'group',
          fields: [
            {
              name: 'talk',
              type: 'group',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'assignee',
                  type: 'relationship',
                  relationTo: 'users',
                  hasMany: false,
                },
                {
                  name: 'time',
                  type: 'text',
                  admin: {
                    description: 'Calculated time for this assignment',
                  },
                },
              ],
            },
            {
              name: 'spiritualGems',
              label: 'Spiritual Gems',
              type: 'group',
              fields: [
                {
                  name: 'assignee',
                  type: 'relationship',
                  relationTo: 'users',
                  hasMany: false,
                },
                {
                  name: 'time',
                  type: 'text',
                  admin: {
                    description: 'Calculated time for this assignment',
                  },
                },
              ],
            },
            {
              name: 'bibleReading',
              label: 'Bible Reading',
              type: 'group',
              fields: [
                {
                  name: 'scripture',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'assignee',
                  type: 'relationship',
                  relationTo: 'users',
                  hasMany: false,
                },
                {
                  name: 'time',
                  type: 'text',
                  admin: {
                    description: 'Calculated time for this assignment',
                  },
                },
              ],
            },
          ],
        },
        // Apply Yourself to the Field Ministry section
        {
          name: 'fieldMinistry',
          label: 'APPLY YOURSELF TO THE FIELD MINISTRY',
          type: 'array',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'lesson',
              type: 'text',
            },
            {
              name: 'assignee',
              type: 'relationship',
              relationTo: 'users',
              hasMany: false,
            },
            {
              name: 'assistant',
              type: 'relationship',
              relationTo: 'users',
              hasMany: false,
            },
            {
              name: 'time',
              type: 'text',
              admin: {
                description: 'Calculated time for this assignment',
              },
            },
          ],
        },
        // Living as Christians section
        {
          name: 'livingAsChristians',
          label: 'LIVING AS CHRISTIANS',
          type: 'group',
          fields: [
            {
              name: 'song',
              type: 'number',
              label: 'Song',
              min: 1,
              max: 151,
            },
            {
              name: 'parts',
              type: 'array',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'assignee',
                  type: 'relationship',
                  relationTo: 'users',
                  hasMany: false,
                },
                {
                  name: 'time',
                  type: 'text',
                  admin: {
                    description: 'Calculated time for this assignment',
                  },
                },
              ],
            },
          ],
        },
        // Closing
        {
          name: 'closing',
          type: 'group',
          fields: [
            {
              name: 'concludingComments',
              type: 'text',
              admin: {
                description: 'Notes for concluding comments (no assigned publisher)',
              },
            },
            {
              name: 'song',
              type: 'number',
              label: 'Closing Song',
              min: 1,
              max: 151,
            },
            {
              name: 'prayer',
              type: 'relationship',
              relationTo: 'users',
              hasMany: false,
            },
          ],
        },
      ],
    },
    {
      name: 'weekendMeeting',
      label: 'Weekend Meeting',
      type: 'group',
      fields: [
        {
          name: 'calculatedTime',
          label: 'Meeting Time',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'Automatically calculated based on congregation settings',
          },
        },
        {
          name: 'chairman',
          type: 'relationship',
          relationTo: 'users',
          hasMany: false,
        },
        {
          name: 'openingSong',
          type: 'number',
          label: 'Opening Song',
          min: 1,
          max: 151,
        },
        {
          name: 'publicTalk',
          type: 'group',
          fields: [
            {
              name: 'talkReference',
              type: 'relationship',
              relationTo: 'public-talk-titles',
              hasMany: false,
            },
            {
              name: 'speaker',
              type: 'group',
              fields: [
                {
                  name: 'isVisitor',
                  type: 'checkbox',
                  label: 'Speaker is a visitor',
                },
                {
                  name: 'publisherReference',
                  type: 'relationship',
                  relationTo: 'users',
                  hasMany: false,
                  admin: {
                    condition: (data, siblingData) => !siblingData.isVisitor,
                  },
                },
                {
                  name: 'visitorName',
                  type: 'text',
                  admin: {
                    condition: (data, siblingData) => siblingData.isVisitor,
                  },
                },
                {
                  name: 'visitorCongregation',
                  type: 'text',
                  admin: {
                    condition: (data, siblingData) => siblingData.isVisitor,
                  },
                },
              ],
            },
          ],
        },
        {
          name: 'middleSong',
          type: 'number',
          label: 'Middle Song',
          min: 1,
          max: 151,
        },
        {
          name: 'watchtowerStudy',
          type: 'group',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'conductor',
              type: 'relationship',
              relationTo: 'users',
              hasMany: false,
            },
          ],
        },
        {
          name: 'closingSong',
          type: 'number',
          label: 'Closing Song',
          min: 1,
          max: 151,
        },
        {
          name: 'prayer',
          type: 'group',
          fields: [
            {
              name: 'isVisitor',
              type: 'checkbox',
              label: 'Prayer by a visitor',
            },
            {
              name: 'publisherReference',
              type: 'relationship',
              relationTo: 'users',
              hasMany: false,
              admin: {
                condition: (data, siblingData) => !siblingData.isVisitor,
              },
            },
            {
              name: 'visitorName',
              type: 'text',
              admin: {
                condition: (data, siblingData) => siblingData.isVisitor,
              },
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
}