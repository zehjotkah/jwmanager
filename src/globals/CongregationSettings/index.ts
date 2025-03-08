import type { GlobalConfig } from 'payload'
import { authenticated } from '../../access/authenticated'

export const CongregationSettings: GlobalConfig = {
  slug: 'congregation-settings',
  access: {
    read: authenticated,
    update: authenticated,
  },
  admin: {
    group: 'JW Manager',
  },
  fields: [
    {
      name: 'congregationName',
      label: 'Congregation Name',
      type: 'text',
      required: true,
    },
    {
      name: 'midweekMeetingTime',
      label: 'Start Time Life and Ministry Meeting',
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
      name: 'weekendMeetingTime',
      label: 'Start Time Weekend Meeting',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'timeOnly',
          displayFormat: 'h:mm a',
        },
      },
    },
  ],
}