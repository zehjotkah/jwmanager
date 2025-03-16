import { Payload } from 'payload'
import { filterPublishersByPermission } from './filterPublishersByPermission'

type PayloadRequest = {
  payload: Payload
  context?: Record<string, any>
}

/**
 * Hook to filter relationship fields based on assignment permissions
 *
 * This hook:
 * 1. Uses the filterPublishersByPermission hook to filter publishers
 * 2. Returns the original value so it doesn't interfere with other hooks
 */
export const filterAssignmentsByPermission = (permission: string) => {
  return async (args: { req: PayloadRequest; value?: any; field?: any; [key: string]: any }) => {
    const { req, value } = args
    try {
      // Use the filterPublishersByPermission hook to filter publishers
      await filterPublishersByPermission({ req, permission })

      // Return the original value so it doesn't interfere with other hooks
      return value
    } catch (error) {
      console.error(`Error in filterAssignmentsByPermission for ${permission}:`, error)
      return value
    }
  }
}
