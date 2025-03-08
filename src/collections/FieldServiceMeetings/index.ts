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

  // For field service meeting conductor, we'll require the field-ministry permission
  const requiredPermission: AssignmentPermission = 'field-ministry';

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
      relationTo: 'publishers',
      hasMany: false,
      hooks: {
        beforeValidate: [validatePublisherPermission],
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  timestamps: true,
}