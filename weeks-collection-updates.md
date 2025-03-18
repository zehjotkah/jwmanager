# Weeks Collection Updates

## 1. Meeting Configuration Changes

### Midweek Meeting
- Convert date and time fields to be editable but pre-filled
- Place date and time in a single row for better UI
- Fields:
  ```typescript
  {
    type: 'row',
    fields: [
      {
        name: 'calculatedDate',
        label: 'Meeting Date',
        type: 'date',
        admin: {
          // Remove readOnly: true
          date: {
            pickerAppearance: 'dayOnly',
            displayFormat: 'MMM d, yyyy',
          },
          description: 'Automatically calculated based on congregation settings',
          width: '50%',
        },
      },
      {
        name: 'calculatedTime',
        label: 'Meeting Time',
        type: 'text',
        admin: {
          // Remove readOnly: true
          description: 'Automatically calculated based on congregation settings',
          width: '50%',
        },
      },
    ],
  }
  ```

### Weekend Meeting
- Apply the same changes to the weekend meeting fields

## 2. Section Headers

### Add TREASURES FROM GOD'S WORD section header 
- Use the SectionHeader component before talk section
- Placement before the talk title and assignee fields
  ```typescript
  {
    name: 'treasuresHeader',
    type: 'text',
    admin: {
      components: {
        Field: '@/components/SectionHeader',
      },
      className: 'section-header',
    },
    defaultValue: "TREASURES FROM GOD'S WORD",
  }
  ```

### Add APPLY YOURSELF TO THE FIELD MINISTRY section header
- Place after Bible Reading Assignee
  ```typescript
  {
    name: 'fieldMinistryHeader',
    type: 'text',
    admin: {
      components: {
        Field: '@/components/SectionHeader',
      },
      className: 'section-header',
    },
    defaultValue: 'APPLY YOURSELF TO THE FIELD MINISTRY',
  }
  ```

## 3. Time Calculations

### Talk Time Calculation
- Formula: Meeting start time + 6 minutes
- Add a new number field for talk duration:
  ```typescript
  {
    name: 'talkDuration',
    type: 'number',
    label: 'Talk Duration (minutes)',
    defaultValue: 10,
    min: 5,
    max: 30,
    admin: {
      width: '50%',
      description: 'Duration in minutes',
    },
  }
  ```
- Update beforeValidate hook to calculate time:
  ```typescript
  // In beforeValidate hook
  // Parse meeting time, add 6 minutes
  const meetingTime = new Date(midweekMeetingTime);
  const talkTime = new Date(meetingTime);
  talkTime.setMinutes(meetingTime.getMinutes() + 6);
  const talkTimeDisplay = talkTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  ```

### Spiritual Gems Time Calculation
- Formula: Meeting start time + 6 minutes + talk duration
- Add a new field for spiritual gems duration:
  ```typescript
  {
    name: 'spiritualGemsDuration',
    type: 'number',
    label: 'Spiritual Gems Duration (minutes)',
    defaultValue: 10,
    min: 5,
    max: 30,
    admin: {
      width: '50%',
      description: 'Duration in minutes',
    },
  }
  ```
- Update time calculation:
  ```typescript
  // In beforeValidate hook
  const spiritualGemsTime = new Date(talkTime);
  spiritualGemsTime.setMinutes(talkTime.getMinutes() + data.talkDuration || 10);
  const spiritualGemsTimeDisplay = spiritualGemsTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  ```

## 4. Bible Reading Fields

### Add Bible Reading Lesson field
```typescript
{
  name: 'bibleReadingLesson',
  type: 'text',
  label: 'Bible Reading Lesson',
  required: false,
  admin: {
    width: '50%',
    description: 'e.g., "Read clearly and accurately"',
  },
}
```

### Add Bible Reading Duration field
```typescript
{
  name: 'bibleReadingDuration',
  type: 'number',
  label: 'Bible Reading Duration (minutes)',
  defaultValue: 4,
  min: 1,
  max: 10,
  admin: {
    width: '50%',
    description: 'Duration in minutes',
  },
}
```

## 5. Implementation Steps

1. Update midweek meeting date/time fields to be editable
2. Add all new fields to the appropriate sections
3. Add section headers at the specified locations
4. Update the beforeValidate hook for time calculations
5. Test the changes in the admin interface
6. Verify that all fields display and function correctly

## Notes

- The hook calculations will need robust error handling
- Time calculations should be tested with various scenarios
- Make sure the UI is responsive and maintains the correct width proportions
- Consider adding validation to ensure duration totals don't exceed the meeting length