import type { CollectionConfig, FieldHook } from 'payload'
import { authenticated } from '../../access/authenticated'

// Define the assignment permission types
type AssignmentPermission =
  | 'chairman'
  | 'prayer'
  | 'talk'
  | 'spiritual-gems'
  | 'bible-reading'
  | 'field-ministry'
  | 'living-as-christians'
  | 'public-talk'
  | 'watchtower-conductor';

// Validation hook to check if a publisher has the required assignment permission
const validatePublisherPermission: FieldHook = async ({
  value, // The selected publisher ID
  operation,
  req,
  siblingData,
  field,
}) => {
  // Skip validation on read operations or if no publisher is selected
  if (operation === 'read' || !value) {
    return value
  }

  // Get the required permission based on the field name or path
  const fieldName = field.name || '';
  // For nested fields, we can use the field's admin.position property if available
  const adminPosition = field.admin?.position || '';
  
  let requiredPermission: AssignmentPermission | null = null;

  if (fieldName === 'prayer' || adminPosition.includes('prayer')) {
    requiredPermission = 'prayer';
  } else if (fieldName === 'chairman' || adminPosition.includes('chairman')) {
    requiredPermission = 'chairman';
  } else if (fieldName === 'assignee' && adminPosition.includes('talk')) {
    requiredPermission = 'talk';
  } else if (fieldName === 'assignee' && adminPosition.includes('spiritualGems')) {
    requiredPermission = 'spiritual-gems';
  } else if (fieldName === 'assignee' && adminPosition.includes('bibleReading')) {
    requiredPermission = 'bible-reading';
  } else if (fieldName === 'assignee' && adminPosition.includes('fieldMinistry')) {
    requiredPermission = 'field-ministry';
  } else if (fieldName === 'assistant' && adminPosition.includes('fieldMinistry')) {
    requiredPermission = 'field-ministry';
  } else if (fieldName === 'assignee' && adminPosition.includes('livingAsChristians')) {
    requiredPermission = 'living-as-christians';
  } else if (fieldName === 'conductor' && adminPosition.includes('watchtowerStudy')) {
    requiredPermission = 'watchtower-conductor';
  } else if (fieldName === 'publisherReference' && adminPosition.includes('publicTalk')) {
    requiredPermission = 'public-talk';
  }

  // If we don't need to validate this field, return the value as is
  if (!requiredPermission) {
    return value;
  }

  try {
    // Fetch the publisher to check their permissions
    const publisher = await req.payload.findByID({
      collection: 'publishers',
      id: value,
    });

    // Check if the publisher has the required permission
    if (
      !publisher.assignmentPermissions ||
      !publisher.assignmentPermissions.includes(requiredPermission)
    ) {
      throw new Error(`This publisher does not have the "${requiredPermission}" assignment permission.`);
    }

    return value;
  } catch (err) {
    const error = err as Error;
    throw new Error(`Error validating publisher permission: ${error.message}`);
  }
}

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
              relationTo: 'publishers',
              hasMany: false,
              hooks: {
                beforeValidate: [validatePublisherPermission],
              },
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
                  relationTo: 'publishers',
                  hasMany: false,
                  hooks: {
                    beforeValidate: [validatePublisherPermission],
                  },
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
                  relationTo: 'publishers',
                  hasMany: false,
                  hooks: {
                    beforeValidate: [validatePublisherPermission],
                  },
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
                  relationTo: 'publishers',
                  hasMany: false,
                  hooks: {
                    beforeValidate: [validatePublisherPermission],
                  },
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
              relationTo: 'publishers',
              hasMany: false,
              hooks: {
                beforeValidate: [validatePublisherPermission],
              },
            },
            {
              name: 'assistant',
              type: 'relationship',
              relationTo: 'publishers',
              hasMany: false,
              hooks: {
                beforeValidate: [validatePublisherPermission],
              },
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
                  relationTo: 'publishers',
                  hasMany: false,
                  hooks: {
                    beforeValidate: [validatePublisherPermission],
                  },
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
              relationTo: 'publishers',
              hasMany: false,
              hooks: {
                beforeValidate: [validatePublisherPermission],
              },
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
          relationTo: 'publishers',
          hasMany: false,
          hooks: {
            beforeValidate: [validatePublisherPermission],
          },
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
                  relationTo: 'publishers',
                  hasMany: false,
                  hooks: {
                    beforeValidate: [validatePublisherPermission],
                  },
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
              relationTo: 'publishers',
              hasMany: false,
              hooks: {
                beforeValidate: [validatePublisherPermission],
              },
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
              relationTo: 'publishers',
              hasMany: false,
              hooks: {
                beforeValidate: [validatePublisherPermission],
              },
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