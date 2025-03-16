import payload from 'payload'

/**
 * Hook to create a visitor if the name doesn't match an existing publisher
 *
 * This hook:
 * 1. Checks if the input is a string (name) rather than a relationship ID
 * 2. If it's a string, checks if a publisher with that name exists
 * 3. If no publisher exists, creates a new visitor with that name
 * 4. Returns the ID of the visitor to use in the relationship
 */
export const createVisitorIfNeeded = async ({
  value,
  relationTo,
  visitorCollection = 'visitors',
}: {
  value: string | { id: string; relationTo: string } | null
  relationTo: string | string[]
  visitorCollection?: string
}) => {
  // If value is null or already a relationship object, return it as is
  if (!value || typeof value !== 'string') {
    return value
  }

  try {
    // Check if this is a publisher name
    const publisherRelation = Array.isArray(relationTo)
      ? relationTo.find((rel) => rel === 'users')
      : relationTo === 'users'
        ? 'users'
        : null

    if (publisherRelation) {
      // Try to find a publisher with this name
      const publishers = await payload.find({
        collection: 'users',
        where: {
          name: {
            equals: value,
          },
        },
        limit: 1,
      })

      // If a publisher is found, return their ID
      if (publishers.docs.length > 0 && publishers.docs[0]?.id) {
        return {
          id: publishers.docs[0].id,
          relationTo: 'users',
        }
      }
    }

    // No publisher found, create a visitor
    const visitor = await payload.create({
      collection: visitorCollection as 'visitors',
      data: {
        name: value,
      },
    })

    // Return the visitor ID
    return {
      id: visitor.id,
      relationTo: visitorCollection as 'visitors',
    }
  } catch (error) {
    console.error('Error in createVisitorIfNeeded hook:', error)
    return value
  }
}
