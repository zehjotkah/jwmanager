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
    preview: (doc) => {
      if (doc?.weekStartDate) {
        return `/weeks/${doc.weekStartDate}`
      }
      return null
    },
  },
  // Enable versions with drafts
  versions: {
    drafts: true, // Enable basic draft functionality without autosave or scheduled publishing
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
                // For relationship objects, preserve the structure but only sanitize
                // if the value itself is an object (it should be an ID string)
                result[key] = {
                  relationTo: value.relationTo,
                  value:
                    typeof value.value === 'object' && value.value !== null
                      ? { id: value.value.id } // Keep only the ID
                      : value.value, // Keep the ID as is
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

          // Format and calculate meeting times
          // Initialize all time display variables
          let midweekTimeDisplay = 'Not set'
          let weekendTimeDisplay = 'Not set'
          let talkTimeDisplay = 'Not set'
          let spiritualGemsTimeDisplay = 'Not set'

          if (midweekMeetingTime) {
            const midweekTime = new Date(midweekMeetingTime)
            midweekTimeDisplay = midweekTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })

            // Calculate talk time (meeting start + 6 minutes)
            const talkTime = new Date(midweekTime)
            talkTime.setMinutes(midweekTime.getMinutes() + 6)
            talkTimeDisplay = talkTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })

            // Calculate spiritual gems time (talk time + talk duration)
            const spiritualGemsTime = new Date(talkTime)
            const talkDuration = data?.midweekMeeting?.talkDuration || 10
            spiritualGemsTime.setMinutes(talkTime.getMinutes() + talkDuration)
            spiritualGemsTimeDisplay = spiritualGemsTime.toLocaleTimeString([], {
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
              talkTime: talkTimeDisplay,
              spiritualGemsTime: spiritualGemsTimeDisplay,
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
      name: 'showDateTimeFields',
      label: 'Show Date/Time Fields',
      type: 'checkbox',
      defaultValue: false,
    },
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
          type: 'row',
          fields: [
            {
              name: 'calculatedDate',
              label: 'Meeting Date',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                  displayFormat: 'MMM d, yyyy',
                },
                description: 'Automatically calculated based on congregation settings',
                width: '50%',
                condition: (data, siblingData) => {
                  return data.showDateTimeFields === true
                },
              },
            },
            {
              name: 'calculatedTime',
              label: 'Meeting Time',
              type: 'text',
              admin: {
                description: 'Automatically calculated based on congregation settings',
                width: '50%',
                condition: (data, siblingData) => {
                  return data.showDateTimeFields === true
                },
              },
            },
          ],
        },
        // Opening section (flattened)
        {
          type: 'row',
          fields: [
            {
              name: 'openingSong',
              type: 'number',
              label: 'Song',
              min: 1,
              max: 151,
              admin: {
                width: '50%',
              },
            },
            {
              name: 'openingPrayer',
              type: 'relationship',
              relationTo: ['users', 'visitors'],
              hasMany: false,
              admin: {
                width: '50%',
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
        // TREASURES FROM GOD'S WORD group section
        {
          name: 'treasuresFromGodsWord',
          type: 'group',
          label: "Treasures From God's Word",
          fields: [
            // Talk (flattened)
            {
              type: 'row',
              fields: [
                {
                  name: 'talkTitle',
                  type: 'text',
                  label: 'Talk Title',
                  required: false,
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'talkAssignee',
                  type: 'relationship',
                  label: 'Talk Assignee',
                  relationTo: ['users', 'visitors'],
                  hasMany: false,
                  admin: {
                    width: '50%',
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
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'talkDuration',
                  type: 'number',
                  label: 'Talk Duration (minutes)',
                  min: 5,
                  max: 30,
                  admin: {
                    width: '50%',
                    description: 'Duration in minutes',
                    condition: (data, siblingData) => {
                      return data.showDateTimeFields === true
                    },
                  },
                },
                {
                  name: 'talkTime',
                  type: 'text',
                  label: 'Talk Time',
                  admin: {
                    width: '50%',
                    description: 'Calculated time for this assignment',
                    condition: (data, siblingData) => {
                      return data.showDateTimeFields === true
                    },
                  },
                },
              ],
            },

            // Spiritual Gems Assignment
            {
              type: 'row',
              fields: [
                {
                  name: 'spiritualGemsAssignee',
                  type: 'relationship',
                  label: 'Spiritual Gems Assignee',
                  relationTo: ['users', 'visitors'],
                  hasMany: false,
                  admin: {
                    width: '100%',
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
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'spiritualGemsDuration',
                  type: 'number',
                  label: 'Spiritual Gems Duration (minutes)',
                  min: 5,
                  max: 30,
                  admin: {
                    width: '50%',
                    description: 'Duration in minutes',
                    condition: (data, siblingData) => {
                      return data.showDateTimeFields === true
                    },
                  },
                },
                {
                  name: 'spiritualGemsTime',
                  type: 'text',
                  label: 'Spiritual Gems Time',
                  admin: {
                    width: '50%',
                    description: 'Calculated time for this assignment',
                    condition: (data, siblingData) => {
                      return data.showDateTimeFields === true
                    },
                  },
                },
              ],
            },

            // Bible Reading
            {
              type: 'row',
              fields: [
                {
                  name: 'bibleReadingScripture',
                  type: 'text',
                  label: 'Bible Reading Scripture',
                  required: false,
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'bibleReadingLesson',
                  type: 'text',
                  label: 'Bible Reading Lesson',
                  required: false,
                  admin: {
                    width: '50%',
                    description: 'e.g., "Read clearly and accurately"',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'bibleReadingAssignee',
                  type: 'relationship',
                  label: 'Bible Reading Assignee',
                  relationTo: ['users', 'visitors'],
                  hasMany: false,
                  admin: {
                    width: '50%',
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
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'bibleReadingDuration',
                  type: 'number',
                  label: 'Bible Reading Duration (minutes)',
                  min: 1,
                  max: 10,
                  admin: {
                    width: '50%',
                    description: 'Duration in minutes',
                    condition: (data, siblingData) => {
                      return data.showDateTimeFields === true
                    },
                  },
                },
                {
                  name: 'bibleReadingTime',
                  type: 'text',
                  label: 'Bible Reading Time',
                  admin: {
                    width: '50%',
                    description: 'Calculated time for this assignment',
                    condition: (data, siblingData) => {
                      return data.showDateTimeFields === true
                    },
                  },
                },
              ],
            },
          ], // End of treasuresFromGodsWord fields
        },

        // APPLY YOURSELF TO THE FIELD MINISTRY section
        {
          name: 'applyYourselfToFieldMinistry',
          type: 'group',
          label: 'Apply Yourself to the Field Ministry',
          fields: [
            {
              name: 'fieldMinistryAssignments',
              type: 'array',
              label: 'Field Ministry Assignments',
              admin: {
                description: 'Add field ministry assignments for this week',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'title',
                      type: 'text',
                      label: 'Title',
                      required: false,
                      admin: {
                        width: '50%',
                      },
                    },
                    {
                      name: 'lesson',
                      type: 'text',
                      label: 'Lesson',
                      admin: {
                        width: '50%',
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'assignee',
                      type: 'relationship',
                      label: 'Assignee',
                      relationTo: ['users', 'visitors'],
                      hasMany: false,
                      admin: {
                        width: '50%',
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
                            return createVisitorIfNeeded({
                              value,
                              relationTo: ['users', 'visitors'],
                            })
                          },
                        ],
                      },
                    },
                    {
                      name: 'assistant',
                      type: 'relationship',
                      label: 'Assistant',
                      relationTo: ['users', 'visitors'],
                      hasMany: false,
                      admin: {
                        width: '50%',
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
                            return createVisitorIfNeeded({
                              value,
                              relationTo: ['users', 'visitors'],
                            })
                          },
                        ],
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'duration',
                      type: 'number',
                      label: 'Duration (minutes)',
                      min: 1,
                      max: 30,
                      admin: {
                        width: '50%',
                        description: 'Duration in minutes',
                        condition: (data, siblingData) => {
                          return data.showDateTimeFields === true
                        },
                      },
                    },
                    {
                      name: 'time',
                      type: 'text',
                      label: 'Time',
                      admin: {
                        width: '50%',
                        description: 'Calculated time for this assignment',
                        condition: (data, siblingData) => {
                          return data.showDateTimeFields === true
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ], // End of Apply Yourself to the Field Ministry fields
        },
        // LIVING AS CHRISTIANS section
        {
          name: 'livingAsChristians',
          type: 'group',
          label: 'Living as Christians',
          fields: [
            {
              name: 'livingAsChristiansSong',
              type: 'number',
              label: 'Song',
              min: 1,
              max: 151,
            },
            {
              name: 'assignments',
              type: 'array',
              label: 'Living as Christians Assignments',
              admin: {
                description: 'Add Living as Christians assignments for this week',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'title',
                      type: 'text',
                      label: 'Title',
                      required: false,
                      admin: {
                        width: '100%',
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'assignee',
                      type: 'relationship',
                      label: 'Assignee',
                      relationTo: ['users', 'visitors'],
                      hasMany: false,
                      admin: {
                        width: '100%',
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
                            return createVisitorIfNeeded({
                              value,
                              relationTo: ['users', 'visitors'],
                            })
                          },
                        ],
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'duration',
                      type: 'number',
                      label: 'Duration (minutes)',
                      min: 1,
                      max: 30,
                      admin: {
                        width: '50%',
                        description: 'Duration in minutes',
                        condition: (data, siblingData) => {
                          return data.showDateTimeFields === true
                        },
                      },
                    },
                    {
                      name: 'time',
                      type: 'text',
                      label: 'Time',
                      admin: {
                        width: '50%',
                        description: 'Calculated time for this assignment',
                        condition: (data, siblingData) => {
                          return data.showDateTimeFields === true
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ], // End of Living As Christians fields
        },

        // Closing (flattened)
        {
          type: 'row',
          fields: [
            {
              name: 'closingSong',
              type: 'number',
              label: 'Closing Song',
              min: 1,
              max: 151,
              admin: {
                width: '50%',
              },
            },
            {
              name: 'closingPrayer',
              type: 'relationship',
              label: 'Closing Prayer',
              relationTo: ['users', 'visitors'],
              hasMany: false,
              admin: {
                width: '50%',
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
          type: 'row',
          fields: [
            {
              name: 'calculatedDate',
              label: 'Meeting Date',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                  displayFormat: 'MMM d, yyyy',
                },
                description: 'Automatically calculated based on congregation settings',
                width: '50%',
                condition: (data, siblingData) => {
                  return data.showDateTimeFields === true
                },
              },
            },
            {
              name: 'calculatedTime',
              label: 'Meeting Time',
              type: 'text',
              admin: {
                description: 'Automatically calculated based on congregation settings',
                width: '50%',
                condition: (data, siblingData) => {
                  return data.showDateTimeFields === true
                },
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'chairman',
              type: 'relationship',
              relationTo: ['users', 'visitors'],
              hasMany: false,
              admin: {
                width: '50%',
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
                    const { createVisitorIfNeeded } = await import(
                      '../../hooks/createVisitorIfNeeded'
                    )
                    return createVisitorIfNeeded({ value, relationTo: ['users', 'visitors'] })
                  },
                ],
              },
            },
            {
              name: 'openingSong',
              type: 'number',
              label: 'Song',
              min: 1,
              max: 151,
              admin: {
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'publicTalk',
          type: 'group',
          label: 'Public Talk',
          fields: [
            {
              name: 'title',
              type: 'relationship',
              label: 'Public Talk Title',
              relationTo: 'public-talk-titles',
              hasMany: false,
              admin: {
                width: '100%',
              },
            },
            {
              name: 'speaker',
              type: 'relationship',
              label: 'Public Talk Speaker',
              relationTo: ['users', 'visitors'],
              hasMany: false,
              admin: {
                width: '100%',
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
          label: 'Song',
          min: 1,
          max: 151,
        },
        {
          name: 'watchtowerStudy',
          type: 'group',
          label: 'Watchtower Study',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: 'Watchtower Study Title',
              required: false,
              admin: {
                width: '100%',
              },
            },
            {
              name: 'conductor',
              type: 'relationship',
              label: 'Watchtower Study Conductor',
              relationTo: ['users', 'visitors'],
              hasMany: false,
              admin: {
                width: '100%',
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
        // Closing section
        {
          type: 'row',
          fields: [
            {
              name: 'closingSong',
              type: 'number',
              label: 'Song',
              min: 1,
              max: 151,
              admin: {
                width: '50%',
              },
            },
            {
              name: 'closingPrayer',
              type: 'relationship',
              label: 'Closing Prayer',
              relationTo: ['users', 'visitors'],
              hasMany: false,
              admin: {
                width: '50%',
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
  ],
  timestamps: true,
}
