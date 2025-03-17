# Implementation Plan: Draft Functionality for Weeks Collection

## Overview
This plan outlines the steps to implement draft functionality for the Weeks collection in JW Manager. This will allow users to create and edit weeks as drafts before publishing them.

## Implementation Steps

### 1. Enable Versions with Drafts for the Weeks Collection

We'll update the Weeks collection configuration to enable versions with drafts. This will:
- Add a `_status` field to track if a document is in draft or published state
- Allow users to save changes as drafts without publishing them
- Provide UI controls in the admin panel for publishing/unpublishing

The exact code change needed in `src/collections/Weeks/index.ts`:

```typescript
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
  // Add versions with drafts configuration here
  versions: {
    drafts: true, // Enable drafts without autosave or scheduled publishing
  },
  hooks: {
    // Existing hooks remain unchanged
    // ...
  },
  // Rest of the configuration remains the same
  // ...
}
```

### 2. Understanding the Changes

When drafts are enabled:

1. **New Field Added**: Payload automatically adds a `_status` field to the collection schema with possible values of `draft` or `published`.

2. **Admin UI Changes**:
   - The "Save" button is replaced with "Save Draft" and "Publish" buttons
   - Published documents will show "Unpublish" and "Save Draft" options
   - Documents with unpublished changes will show a "Changed" status

3. **API Behavior**:
   - The `draft` parameter can be used in API calls to work with drafts
   - Example: `GET /api/weeks?draft=true` will return the draft versions if available

### 3. Testing Plan

After implementation, we should test:
1. Creating a new week and saving it as a draft
2. Editing a draft week and publishing it
3. Editing a published week and saving changes as a draft
4. Unpublishing a published week
5. Verifying that the UI shows the correct status for each week

### 4. Implementation Process

1. Make the code changes in `src/collections/Weeks/index.ts`
2. Restart the application to apply the changes
3. Test the functionality in the admin UI
4. Verify that the API behaves as expected

### 5. Future Enhancements (For Later Stages)

1. **Access Control**
   - Restrict access to draft weeks to specific user roles
   - Ensure only published weeks are visible to certain users
   
   ```typescript
   access: {
     read: ({ req }) => {
       // If user is authenticated, allow access to all documents
       if (req.user) return true
       
       // Otherwise, only allow access to published documents
       return {
         _status: {
           equals: 'published',
         },
       }
     },
     // Other access controls remain the same
   },
   ```

2. **Scheduled Publishing**
   - Add ability to schedule weeks to be published at a future date
   - Implement job tasks to handle the scheduled publishing
   
   ```typescript
   versions: {
     drafts: {
       schedulePublish: true, // Enable scheduled publishing
     },
   },
   ```

3. **Autosave**
   - Enable autosave functionality for drafts
   - Configure autosave interval for optimal user experience
   
   ```typescript
   versions: {
     drafts: {
       autosave: {
         interval: 2000, // Autosave every 2 seconds
       },
     },
   },
   ```