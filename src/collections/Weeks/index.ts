import type { CollectionConfig } from 'payload'
import payload from 'payload'
import { authenticated } from '../../access/authenticated'
import { calculateMeetingDates } from './hooks/calculateMeetingDates'
import { calculateMeetingDatesAfterRead } from './hooks/calculateMeetingDatesAfterRead'

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
    defaultColumns: [
      'weekStartDate',
      'midweekMeeting.calculatedDate',
      'weekendMeeting.calculatedDate',
    ],
    useAsTitle: 'weekStartDate',
    group: 'JW Manager',
  },
  hooks: {
    afterRead: [
      async ({ doc }) => {
        // Sanitize relationship data to prevent serialization issues
        const sanitizeDoc = (obj: any): any => {
          if (!obj) return obj

          // Create a new object to avoid mutating the original
          const result = { ...obj }

          // Process each property
          Object.keys(result).forEach((key) => {
            const value = result[key]

            // Handle arrays
            if (Array.isArray(value)) {
              result[key] = value.map((item) => sanitizeDoc(item))
            }
            // Handle objects
            else if (value && typeof value === 'object') {
              // Check if it's a relationship object
              if (value.relationTo && value.value) {
                // Sanitize the relationship value
                result[key] = {
                  relationTo: value.relationTo,
                  value: sanitizeDoc(value.value),
                }
              } else {
                // Recursively sanitize nested objects
                result[key] = sanitizeDoc(value)
              }
            }
          })

          return result
        }

        return sanitizeDoc(doc)
      },
    ],
    beforeValidate: [
      async ({ data = {}, req, operation }) => {
        // Only run on create or update operations
        if (operation !== 'create' && operation !== 'update') {
          return data
        }

        // If no week start date, return data as is
        if (!data?.weekStartDate) {
          return data
        }

        console.log('beforeValidate hook running for week:', data?.weekStartDate)

        try {
          // Get congregation settings
          const congregationSettings = await req.payload.findGlobal({
            slug: 'congregation-settings',
          })

          console.log('Congregation settings:', JSON.stringify(congregationSettings, null, 2))

          if (!congregationSettings) {
            console.log('No congregation settings found')
            return data
          }

          const { midweekMeetingDay, weekendMeetingDay, midweekMeetingTime, weekendMeetingTime } =
            congregationSettings

          console.log('Meeting days:', { midweekMeetingDay, weekendMeetingDay })

          // If meeting days are not set, return data as is
          if (!midweekMeetingDay || !weekendMeetingDay) {
            console.log('Meeting days not set, returning original data')
            return data
          }

          // Create a date object from the week start date (Monday)
          const weekStartDate = new Date(data?.weekStartDate as string)
          console.log('Week start date:', weekStartDate.toISOString())

          // Calculate midweek meeting date
          const midweekMeetingDate = new Date(weekStartDate)
          const dayMapping = {
            monday: 0,
            tuesday: 1,
            wednesday: 2,
            thursday: 3,
            friday: 4,
            saturday: 5,
            sunday: 6,
          }

          // Add days to the week start date to get to the midweek meeting day
          midweekMeetingDate.setDate(
            weekStartDate.getDate() + dayMapping[midweekMeetingDay as keyof typeof dayMapping],
          )
          console.log('Calculated midweek meeting date:', midweekMeetingDate.toISOString())

          // Calculate weekend meeting date
          const weekendMeetingDate = new Date(weekStartDate)

          // Add days to the week start date to get to the weekend meeting day
          weekendMeetingDate.setDate(
            weekStartDate.getDate() + dayMapping[weekendMeetingDay as keyof typeof dayMapping],
          )
          console.log('Calculated weekend meeting date:', weekendMeetingDate.toISOString())

          // Format meeting times for display
          let midweekTimeDisplay = 'Not set'
          let weekendTimeDisplay = 'Not set'

          if (midweekMeetingTime) {
            const midweekTime = new Date(midweekMeetingTime)
            midweekTimeDisplay = midweekTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          }

          if (weekendMeetingTime) {
            const weekendTime = new Date(weekendMeetingTime)
            weekendTimeDisplay = weekendTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          }

          // Initialize midweekMeeting and weekendMeeting if they don't exist
          const midweekMeeting = data?.midweekMeeting || {}
          const weekendMeeting = data?.weekendMeeting || {}

          // Update the data with calculated dates and times
          const result = {
            ...data,
            midweekMeeting: {
              ...midweekMeeting,
              calculatedDate: midweekMeetingDate.toISOString(),
              calculatedTime: midweekTimeDisplay,
            },
            weekendMeeting: {
              ...weekendMeeting,
              calculatedDate: weekendMeetingDate.toISOString(),
              calculatedTime: weekendTimeDisplay,
            },
          }

          console.log('Final result midweekMeeting:', result.midweekMeeting)
          console.log('Final result weekendMeeting:', result.weekendMeeting)

          return result
        } catch (error) {
          console.error('Error in beforeValidate hook:', error)
          return data
        }
      },
    ],
  },
  fields: [
    {
      name: 'weekStartDate',
      label: 'Week Start Date (Monday)',
      type: 'date',
      required: false,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'MMM d, yyyy',
        },
        description: 'Select the Monday that starts this week',
      },
    },
    {
      name: 'midweekMeeting',
      label: 'Midweek Meeting (Life and Ministry)',
      type: 'group',
      fields: [
        {
          name: 'calculatedDate',
          label: 'Meeting Date',
          type: 'date',
          admin: {
            readOnly: true,
            date: {
              pickerAppearance: 'dayOnly',
              displayFormat: 'MMM d, yyyy',
            },
            description: 'Automatically calculated based on congregation settings',
          },
        },
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
              relationTo: ['users', 'visitors'],
              hasMany: false,
              admin: {
                description: 'Only publishers with Prayer permission will be shown',
                condition: () => true, // Always show this field
              },
              filterOptions: ({ relationTo }) => {
                // Only apply the filter to the users collection
                if (relationTo === 'users') {
                  return {
                    assignmentPermissions: {
                      contains: 'prayer',
                    },
                  }
                }

                // Don't filter visitors
                return true
              },
              hooks: {
                beforeChange: [
                  async ({ value }) => {
                    // Import the hook here to avoid circular dependencies
                    const { createVisitorIfNeeded } = await import(
                      '../../hooks/createVisitorIfNeeded'
                    )
                    return createVisitorIfNeeded({ value, relationTo: ['users', 'visitors'] })
                  },
                ],
              },
            },
          ],
        },
        // Treasures from God's Word section
        {
          name: 'treasures',
          label: "TREASURES FROM GOD'S WORD",
          type: 'group',
          fields: [
            {
              name: 'talk',
              type: 'group',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: false,
                },
                {
                  name: 'assignee',
                  type: 'relationship',
                  relationTo: ['users', 'visitors'],
                  hasMany: false,
                  admin: {
                    description: 'Only publishers with Talk permission will be shown',
                  },
                  filterOptions: ({ relationTo }) => {
                    // Only apply the filter to the users collection
                    if (relationTo === 'users') {
                      return {
                        assignmentPermissions: {
                          contains: 'talk',
                        },
                      }
                    }

                    // Don't filter visitors
                    return true
                  },
                  hooks: {
                    beforeChange: [
                      async ({ value }) => {
                        // Import the hook here to avoid circular dependencies
                        const { createVisitorIfNeeded } = await import(
                          '../../hooks/createVisitorIfNeeded'
                        )
                        return createVisitorIfNeeded({ value, relationTo: ['users', 'visitors'] })
                      },
                    ],
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
                  relationTo: ['users', 'visitors'],
                  hasMany: false,
                  admin: {
                    description: 'Only publishers with Spiritual Gems permission will be shown',
                  },
                  filterOptions: ({ relationTo }) => {
                    // Only apply the filter to the users collection
                    if (relationTo === 'users') {
                      return {
                        assignmentPermissions: {
                          contains: 'spiritual-gems',
                        },
                      }
                    }

                    // Don't filter visitors
                    return true
                  },
                  hooks: {
                    beforeChange: [
                      async ({ value }) => {
                        // Import the hook here to avoid circular dependencies
                        const { createVisitorIfNeeded } = await import(
                          '../../hooks/createVisitorIfNeeded'
                        )
                        return createVisitorIfNeeded({ value, relationTo: ['users', 'visitors'] })
                      },
                    ],
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
                  required: false,
                },
                {
                  name: 'assignee',
                  type: 'relationship',
                  relationTo: ['users', 'visitors'],
                  hasMany: false,
                  admin: {
                    description: 'Only publishers with Bible Reading permission will be shown',
                  },
                  filterOptions: ({ relationTo }) => {
                    // Only apply the filter to the users collection
                    if (relationTo === 'users') {
                      return {
                        assignmentPermissions: {
                          contains: 'bible-reading',
                        },
                      }
                    }

                    // Don't filter visitors
                    return true
                  },
                  hooks: {
                    beforeChange: [
                      async ({ value }) => {
                        // Import the hook here to avoid circular dependencies
                        const { createVisitorIfNeeded } = await import(
                          '../../hooks/createVisitorIfNeeded'
                        )
                        return createVisitorIfNeeded({ value, relationTo: ['users', 'visitors'] })
                      },
                    ],
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
              required: false,
            },
            {
              name: 'lesson',
              type: 'text',
            },
            {
              name: 'assignee',
              type: 'relationship',
              relationTo: ['users', 'visitors'],
              hasMany: false,
              admin: {
                description: 'Only publishers with Field Ministry permission will be shown',
              },
              filterOptions: ({ relationTo }) => {
                // Only apply the filter to the users collection
                if (relationTo === 'users') {
                  return {
                    assignmentPermissions: {
                      contains: 'field-ministry',
                    },
                  }
                }

                // Don't filter visitors
                return true
              },
              hooks: {
                beforeChange: [
                  async ({ value }) => {
                    // Import the hook here to avoid circular dependencies
                    const { createVisitorIfNeeded } = await import(
                      '../../hooks/createVisitorIfNeeded'
                    )
                    return createVisitorIfNeeded({ value, relationTo: ['users', 'visitors'] })
                  },
                ],
              },
            },
            {
              name: 'assistant',
              type: 'relationship',
              relationTo: ['users', 'visitors'],
              hasMany: false,
              admin: {
                description: 'Only publishers with Field Ministry permission will be shown',
              },
              filterOptions: ({ relationTo }) => {
                // Only apply the filter to the users collection
                if (relationTo === 'users') {
                  return {
                    assignmentPermissions: {
                      contains: 'field-ministry',
                    },
                  }
                }

                // Don't filter visitors
                return true
              },
              hooks: {
                beforeChange: [
                  async ({ value }) => {
                    // Import the hook here to avoid circular dependencies
                    const { createVisitorIfNeeded } = await import(
                      '../../hooks/createVisitorIfNeeded'
                    )
                    return createVisitorIfNeeded({ value, relationTo: ['users', 'visitors'] })
                  },
                ],
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
                  required: false,
                },
                {
                  name: 'assignee',
                  type: 'relationship',
                  relationTo: ['users', 'visitors'],
                  hasMany: false,
                  admin: {
                    description:
                      'Only publishers with Living as Christians permission will be shown',
                  },
                  filterOptions: ({ relationTo }) => {
                    // Only apply the filter to the users collection
                    if (relationTo === 'users') {
                      return {
                        assignmentPermissions: {
                          contains: 'living-as-christians',
                        },
                      }
                    }

                    // Don't filter visitors
                    return true
                  },
                  hooks: {
                    beforeChange: [
                      async ({ value }) => {
                        // Import the hook here to avoid circular dependencies
                        const { createVisitorIfNeeded } = await import(
                          '../../hooks/createVisitorIfNeeded'
                        )
                        return createVisitorIfNeeded({ value, relationTo: ['users', 'visitors'] })
                      },
                    ],
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
              relationTo: ['users', 'visitors'],
              hasMany: false,
              admin: {
                description: 'Only publishers with Prayer permission will be shown',
              },
              filterOptions: ({ relationTo }) => {
                // Only apply the filter to the users collection
                if (relationTo === 'users') {
                  return {
                    assignmentPermissions: {
                      contains: 'prayer',
                    },
                  }
                }

                // Don't filter visitors
                return true
              },
              hooks: {
                beforeChange: [
                  async ({ value }) => {
                    // Import the hook here to avoid circular dependencies
                    const { createVisitorIfNeeded } = await import(
                      '../../hooks/createVisitorIfNeeded'
                    )
                    return createVisitorIfNeeded({ value, relationTo: ['users', 'visitors'] })
                  },
                ],
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
          name: 'calculatedDate',
          label: 'Meeting Date',
          type: 'date',
          admin: {
            readOnly: true,
            date: {
              pickerAppearance: 'dayOnly',
              displayFormat: 'MMM d, yyyy',
            },
            description: 'Automatically calculated based on congregation settings',
          },
        },
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
          relationTo: ['users', 'visitors'],
          hasMany: false,
          admin: {
            description: 'Only publishers with Chairman permission will be shown',
          },
          filterOptions: ({ relationTo }) => {
            // Only apply the filter to the users collection
            if (relationTo === 'users') {
              return {
                assignmentPermissions: {
                  contains: 'chairman',
                },
              }
            }

            // Don't filter visitors
            return true
          },
          hooks: {
            beforeChange: [
              async ({ value }) => {
                // Import the hook here to avoid circular dependencies
                const { createVisitorIfNeeded } = await import('../../hooks/createVisitorIfNeeded')
                return createVisitorIfNeeded({ value, relationTo: ['users', 'visitors'] })
              },
            ],
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
              type: 'relationship',
              relationTo: ['users', 'visitors'],
              hasMany: false,
              admin: {
                description: 'Only publishers with Public Talk permission will be shown',
              },
              filterOptions: ({ relationTo }) => {
                // Only apply the filter to the users collection
                if (relationTo === 'users') {
                  return {
                    assignmentPermissions: {
                      contains: 'public-talk',
                    },
                  }
                }

                // Don't filter visitors
                return true
              },
              hooks: {
                beforeChange: [
                  async ({ value }) => {
                    // Import the hook here to avoid circular dependencies
                    const { createVisitorIfNeeded } = await import(
                      '../../hooks/createVisitorIfNeeded'
                    )
                    return createVisitorIfNeeded({ value, relationTo: ['users', 'visitors'] })
                  },
                ],
              },
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
              required: false,
            },
            {
              name: 'conductor',
              type: 'relationship',
              relationTo: ['users', 'visitors'],
              hasMany: false,
              admin: {
                description: 'Only publishers with Watchtower Study permission will be shown',
              },
              filterOptions: ({ relationTo }) => {
                // Only apply the filter to the users collection
                if (relationTo === 'users') {
                  return {
                    assignmentPermissions: {
                      contains: 'watchtower-conductor',
                    },
                  }
                }

                // Don't filter visitors
                return true
              },
              hooks: {
                beforeChange: [
                  async ({ value }) => {
                    // Import the hook here to avoid circular dependencies
                    const { createVisitorIfNeeded } = await import(
                      '../../hooks/createVisitorIfNeeded'
                    )
                    return createVisitorIfNeeded({ value, relationTo: ['users', 'visitors'] })
                  },
                ],
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
          type: 'relationship',
          relationTo: ['users', 'visitors'],
          hasMany: false,
          admin: {
            description: 'Only publishers with Prayer permission will be shown',
          },
          filterOptions: ({ relationTo }) => {
            // Only apply the filter to the users collection
            if (relationTo === 'users') {
              return {
                assignmentPermissions: {
                  contains: 'prayer',
                },
              }
            }

            // Don't filter visitors
            return true
          },
          hooks: {
            beforeChange: [
              async ({ value }) => {
                // Import the hook here to avoid circular dependencies
                const { createVisitorIfNeeded } = await import('../../hooks/createVisitorIfNeeded')
                return createVisitorIfNeeded({ value, relationTo: ['users', 'visitors'] })
              },
            ],
          },
        },
      ],
    },
  ],
  timestamps: true,
}
