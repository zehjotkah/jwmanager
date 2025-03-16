import payload from 'payload'

/**
 * Hook to calculate meeting dates based on week start date and congregation settings
 *
 * This hook:
 * 1. Gets the congregation settings to determine meeting days
 * 2. Calculates the midweek meeting date based on the week start date and midweek meeting day
 * 3. Calculates the weekend meeting date based on the week start date and weekend meeting day
 */
export const calculateMeetingDates = async ({
  data,
  operation,
  req,
}: {
  data: any
  operation: 'create' | 'update'
  req: any
}) => {
  // Only run on create or update operations
  if (operation !== 'create' && operation !== 'update') {
    console.log('Skipping hook: not a create or update operation')
    return data
  }

  // If no week start date, return data as is
  if (!data.weekStartDate) {
    console.log('Skipping hook: no week start date')
    return data
  }

  console.log(`calculateMeetingDates hook running for week: ${data.weekStartDate}`)

  try {
    // Get congregation settings
    const congregationSettings = await payload.findGlobal({
      slug: 'congregation-settings',
      depth: 0,
    })

    console.log('Congregation settings:', JSON.stringify(congregationSettings, null, 2))

    if (!congregationSettings) {
      console.log('No congregation settings found')
      return data
    }

    const { midweekMeetingDay, weekendMeetingDay, midweekMeetingTime, weekendMeetingTime } =
      congregationSettings

    console.log('Meeting days:', { midweekMeetingDay, weekendMeetingDay })
    console.log('Meeting times:', {
      midweekMeetingTime: midweekMeetingTime
        ? new Date(midweekMeetingTime).toISOString()
        : 'not set',
      weekendMeetingTime: weekendMeetingTime
        ? new Date(weekendMeetingTime).toISOString()
        : 'not set',
    })

    // If meeting days are not set, return data as is
    if (!midweekMeetingDay || !weekendMeetingDay) {
      console.log('Meeting days not set, returning original data')
      return data
    }

    // Create a date object from the week start date (Monday)
    const weekStartDate = new Date(data.weekStartDate)
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

    console.log(
      'Day mapping for midweek:',
      dayMapping[midweekMeetingDay as keyof typeof dayMapping],
    )

    // Add days to the week start date to get to the midweek meeting day
    midweekMeetingDate.setDate(
      weekStartDate.getDate() + dayMapping[midweekMeetingDay as keyof typeof dayMapping],
    )
    console.log('Calculated midweek meeting date:', midweekMeetingDate.toISOString())

    // Calculate weekend meeting date
    const weekendMeetingDate = new Date(weekStartDate)

    console.log(
      'Day mapping for weekend:',
      dayMapping[weekendMeetingDay as keyof typeof dayMapping],
    )

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

    // Update the data with calculated dates and times
    console.log('Midweek time display:', midweekTimeDisplay)
    console.log('Weekend time display:', weekendTimeDisplay)

    console.log('Original data.midweekMeeting:', data.midweekMeeting)
    console.log('Original data.weekendMeeting:', data.weekendMeeting)

    // Initialize midweekMeeting and weekendMeeting if they don't exist
    const midweekMeeting = data.midweekMeeting || {}
    const weekendMeeting = data.weekendMeeting || {}

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
    console.error('Error calculating meeting dates:', error)
    return data
  }
}
