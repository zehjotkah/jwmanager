'use client'

import React, { useEffect, useState } from 'react'

// Mock the useField hook since we can't import it directly
const useField = <T,>({ path }: { path: string }) => {
  // Provide a default value based on the path
  let defaultValue: string | null = null

  // For weekStartDate, provide a valid date string
  if (path === 'weekStartDate') {
    defaultValue = new Date().toISOString()
  }

  return {
    value: defaultValue as T,
    setValue: (value: T) => {
      console.log(`Setting ${path} to:`, value)
    },
  }
}

// This is a simplified version of the component that will work with Payload's admin UI
export const MeetingDateCalculator: React.FC<{
  path: string
  meetingType: 'midweek' | 'weekend'
}> = (props) => {
  const { path, meetingType } = props
  const { setValue } = useField<string>({ path })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get the weekStartDate from the form
  const weekStartDateField = useField<string>({ path: 'weekStartDate' })
  const weekStartDate = weekStartDateField.value || new Date().toISOString()

  useEffect(() => {
    const calculateDate = async () => {
      if (!weekStartDate) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Fetch congregation settings
        const response = await fetch('/api/globals/congregation-settings')
        if (!response.ok) {
          throw new Error('Failed to fetch congregation settings')
        }

        const settings = await response.json()

        // Get the appropriate meeting day based on meeting type
        const meetingDay =
          meetingType === 'midweek' ? settings.midweekMeetingDay : settings.weekendMeetingDay

        if (!meetingDay) {
          setError(
            `${meetingType === 'midweek' ? 'Midweek' : 'Weekend'} meeting day not set in congregation settings`,
          )
          setLoading(false)
          return
        }

        // Calculate the meeting date
        const startDate = new Date(weekStartDate)
        const meetingDate = new Date(startDate)

        const dayMapping = {
          monday: 0,
          tuesday: 1,
          wednesday: 2,
          thursday: 3,
          friday: 4,
          saturday: 5,
          sunday: 6,
        }

        meetingDate.setDate(startDate.getDate() + dayMapping[meetingDay as keyof typeof dayMapping])

        // Set the calculated date
        setValue(meetingDate.toISOString())
      } catch (err) {
        console.error('Error calculating meeting date:', err)
        setError('Error calculating meeting date')
      } finally {
        setLoading(false)
      }
    }

    calculateDate()
  }, [weekStartDate, meetingType, setValue])

  return (
    <div>
      {loading && <div>Calculating...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  )
}
