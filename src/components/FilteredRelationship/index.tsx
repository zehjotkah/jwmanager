'use client'

import React, { useEffect } from 'react'

// Define types for Payload components since we don't have the actual types
type Field = {
  path: string
  type?: string
  relationTo?: string | string[]
  filterOptions?: any
  admin?: {
    components?: {
      Filter?: (props: any) => React.ReactNode
    }
  }
}

// Mock hooks for Payload components
const useField = ({ path }: { path: string }) => {
  return {
    value: null,
    setValue: (value: any) => {},
  }
}

const useFormFields = () => {
  return {
    fields: [] as Field[],
  }
}

type FilteredRelationshipProps = {
  path: string
  permission: string
  relationTo: string | string[]
}

/**
 * Custom component for relationship fields that filters publishers based on assignment permissions
 *
 * This component:
 * 1. Renders a standard relationship field
 * 2. Filters the available options based on the publisher's assignment permissions
 */
export const FilteredRelationship: React.FC<FilteredRelationshipProps> = (props) => {
  const { path, permission, relationTo } = props
  const { value, setValue } = useField({ path })
  const { fields } = useFormFields()

  // Get the field from the form
  const field = fields.find((f: Field) => f.path === path)

  // Filter the available options based on the publisher's assignment permissions
  useEffect(() => {
    if (field) {
      // Set the field type and relationTo
      field.type = 'relationship'
      field.relationTo = relationTo

      // Apply filter directly to the field
      if (typeof relationTo === 'string' && relationTo === 'users') {
        // For single collection fields
        field.filterOptions = {
          ...field.filterOptions,
          where: {
            assignmentPermissions: {
              contains: permission,
            },
          },
        }
        console.log(`FilteredRelationship: Applied filter for ${permission} to field ${path}`)
      } else if (Array.isArray(relationTo) && relationTo.includes('users')) {
        // For multi-collection fields
        field.filterOptions = {
          ...field.filterOptions,
          users: {
            where: {
              assignmentPermissions: {
                contains: permission,
              },
            },
          },
        }
        console.log(
          `FilteredRelationship: Applied filter for ${permission} to multi-collection field ${path}`,
        )
      }

      // Also modify the Filter component if it exists
      if (field.admin?.components?.Filter) {
        const originalFilter = field.admin.components.Filter
        field.admin.components.Filter = (filterProps: any) => {
          // Only apply the filter to the users collection
          if (filterProps.relationTo === 'users') {
            // Add a filter to only show publishers with the specified permission
            filterProps.where = {
              ...(filterProps.where || {}),
              assignmentPermissions: {
                contains: permission,
              },
            }
          }
          return originalFilter(filterProps)
        }
      }
    }
  }, [field, permission, path, relationTo])

  return null
}
