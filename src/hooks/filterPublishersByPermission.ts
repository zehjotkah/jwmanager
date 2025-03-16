import { Payload } from 'payload'

type PayloadRequest = {
  payload: Payload
  context?: Record<string, any>
}

/**
 * Hook to filter publishers based on their assignment permissions
 *
 * This hook:
 * 1. Finds all users with the specified permission
 * 2. Stores the filtered user IDs in the request context
 * 3. Modifies the admin UI options to only show publishers with the specified permission
 */
export const filterPublishersByPermission = async ({
  req,
  permission,
}: {
  req: PayloadRequest
  permission: string
}) => {
  try {
    // Find all users with the specified permission
    const users = await req.payload.find({
      collection: 'users',
      where: {
        assignmentPermissions: {
          contains: permission,
        },
      },
    })

    // Store the filtered users in the request context for use in the admin UI
    if (!req.context) {
      req.context = {}
    }

    const filteredUserIds = users.docs.map((user: { id: string }) => user.id)
    req.context[`filteredPublishers_${permission}`] = filteredUserIds

    // Log the filtered publishers
    console.log(`Filtered publishers for ${permission} permission:`, filteredUserIds)

    // Modify the admin UI options
    // This is a hack to modify the admin UI options at runtime
    // It works by monkey-patching the payload.find method for the users collection
    const originalFind = req.payload.find
    req.payload.find = async (args: any) => {
      // Only intercept requests for the users collection
      if (args.collection === 'users') {
        // Check if this is a request for a relationship field
        const referrer = args.req?.headers?.referer || ''
        const isWeeksAdmin = referrer.includes('/admin/collections/weeks/')

        if (isWeeksAdmin) {
          // Add a filter to only show publishers with the specified permission
          if (!args.where) {
            args.where = {}
          }

          // Only apply the filter if it's not already applied
          if (!args.where.assignmentPermissions) {
            args.where.assignmentPermissions = {
              contains: permission,
            }
            console.log(`Applied filter for ${permission} to users collection query:`, args.where)
          }
        }
      }

      // Call the original find method
      return originalFind(args)
    }
  } catch (error) {
    console.error(`Error filtering publishers by ${permission} permission:`, error)
  }
}
