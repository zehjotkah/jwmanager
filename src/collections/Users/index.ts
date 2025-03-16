import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Publisher',
    plural: 'Publishers',
  },
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email', 'surname', 'gender', 'privileges'],
    useAsTitle: 'name',
    group: 'JW Manager',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'surname',
      type: 'text',
      required: true,
    },
    {
      name: 'gender',
      type: 'select',
      options: [
        {
          label: 'Brother',
          value: 'brother',
        },
        {
          label: 'Sister',
          value: 'sister',
        },
      ],
      required: true,
    },
    {
      name: 'privileges',
      type: 'select',
      hasMany: true,
      options: [
        {
          label: 'Elder',
          value: 'elder',
        },
        {
          label: 'Ministerial Servant',
          value: 'ministerial-servant',
        },
        {
          label: 'Publisher',
          value: 'publisher',
        },
        {
          label: 'Unbaptized Publisher',
          value: 'unbaptized-publisher',
        },
        {
          label: 'Pioneer',
          value: 'pioneer',
        },
        {
          label: 'Auxiliary Pioneer',
          value: 'auxiliary-pioneer',
        },
        {
          label: 'Special Pioneer',
          value: 'special-pioneer',
        },
      ],
    },
    {
      name: 'assignmentPermissions',
      label: 'Assignment Permissions',
      type: 'select',
      hasMany: true,
      options: [
        {
          label: 'Chairman',
          value: 'chairman',
        },
        {
          label: 'Prayer',
          value: 'prayer',
        },
        {
          label: 'Talk',
          value: 'talk',
        },
        {
          label: 'Spiritual Gems',
          value: 'spiritual-gems',
        },
        {
          label: 'Bible Reading',
          value: 'bible-reading',
        },
        {
          label: 'Field Ministry',
          value: 'field-ministry',
        },
        {
          label: 'Living as Christians',
          value: 'living-as-christians',
        },
        {
          label: 'Public Talk',
          value: 'public-talk',
        },
        {
          label: 'Watchtower Study Conductor',
          value: 'watchtower-conductor',
        },
      ],
    },
    {
      name: 'absenceCalendar',
      label: 'Absence Calendar',
      type: 'array',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
        },
        {
          name: 'endDate',
          type: 'date',
          required: true,
        },
        {
          name: 'reason',
          type: 'text',
        },
      ],
    },
    {
      name: 'assignedGroup',
      label: 'Assigned Group',
      type: 'relationship',
      relationTo: 'groups',
      hasMany: false,
    },
    {
      name: 'address',
      type: 'text',
    },
    {
      name: 'congregationRole',
      type: 'select',
      hasMany: true,
      options: [
        {
          label: 'Coordinator of the body of elders',
          value: 'coordinator',
        },
        {
          label: 'Secretary',
          value: 'secretary',
        },
        {
          label: 'Service Overseer',
          value: 'service-overseer',
        },
        {
          label: 'Watchtower Study Conductor',
          value: 'watchtower-conductor',
        },
        {
          label: 'Life and Ministry Meeting Overseer',
          value: 'lmmo',
        },
        {
          label: 'Public Talk Planner',
          value: 'public-talk-planner',
        },
        {
          label: 'Group Overseer',
          value: 'group-overseer',
        },
        {
          label: 'Group Assistant',
          value: 'group-assistant',
        },
        {
          label: 'JW Manager Admin',
          value: 'jwmanager-admin',
        },
      ],
    },
  ],
  timestamps: true,
}
