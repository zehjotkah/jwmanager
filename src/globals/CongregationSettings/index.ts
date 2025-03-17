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
    // Midweek Meeting Settings
    {
      type: 'row',
      fields: [
        {
          name: 'midweekMeetingDay',
          label: 'Life and Ministry Meeting Day',
          type: 'select',
          required: true,
          options: [
            { label: 'Monday', value: 'monday' },
            { label: 'Tuesday', value: 'tuesday' },
            { label: 'Wednesday', value: 'wednesday' },
            { label: 'Thursday', value: 'thursday' },
            { label: 'Friday', value: 'friday' },
            { label: 'Saturday', value: 'saturday' },
            { label: 'Sunday', value: 'sunday' },
          ],
          admin: {
            width: '50%',
          },
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
              timeIntervals: 1, // Allow selecting any minute
            },
            width: '50%',
          },
        },
      ],
    },
    // Weekend Meeting Settings
    {
      type: 'row',
      fields: [
        {
          name: 'weekendMeetingDay',
          label: 'Weekend Meeting Day',
          type: 'select',
          required: true,
          options: [
            { label: 'Monday', value: 'monday' },
            { label: 'Tuesday', value: 'tuesday' },
            { label: 'Wednesday', value: 'wednesday' },
            { label: 'Thursday', value: 'thursday' },
            { label: 'Friday', value: 'friday' },
            { label: 'Saturday', value: 'saturday' },
            { label: 'Sunday', value: 'sunday' },
          ],
          admin: {
            width: '50%',
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
              timeIntervals: 1, // Allow selecting any minute
            },
            width: '50%',
          },
        },
      ],
    },
  ],
}
