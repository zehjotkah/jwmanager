import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest } from 'payload'

const collections: CollectionSlug[] = [
  // Original collections
  'categories',
  'media',
  'pages',
  'posts',
  'users',
  
  // JW Manager collections
  'publishers',
  'groups',
  'weeks',
  'public-talk-titles',
  'field-service-meetings',
]
// Define globals separately to handle them with their specific structures
const headerFooterGlobals: GlobalSlug[] = ['header', 'footer']
const congregationSettingsGlobal: GlobalSlug = 'congregation-settings'

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not
  payload.logger.info(`— Clearing collections and globals...`)

  // clear the header and footer globals
  for (const global of headerFooterGlobals) {
    try {
      // Use type assertion to tell TypeScript that we know what we're doing
      await payload.updateGlobal({
        slug: global,
        data: {
          // @ts-ignore - We know these globals have navItems
          navItems: [],
        },
        depth: 0,
        context: {
          disableRevalidate: true,
        },
      })
    } catch (err) {
      // If there's an error, log it but continue
      const error = err as Error
      payload.logger.warn(`Could not reset ${global}: ${error.message}`)
    }
  }

  // clear the congregation settings global
  try {
    await payload.updateGlobal({
      slug: congregationSettingsGlobal,
      data: {
        congregationName: 'My Congregation',
        midweekMeetingTime: new Date().toISOString(),
        weekendMeetingTime: new Date().toISOString(),
      },
      depth: 0,
      context: {
        disableRevalidate: true,
      },
    })
  } catch (err) {
    // If the congregation settings global doesn't exist yet, we can ignore this error
    const error = err as Error
    payload.logger.warn(`Could not reset congregation settings: ${error.message}`)
  }

  await Promise.all(
    collections.map((collection) => payload.db.deleteMany({ collection, req, where: {} })),
  )

  await Promise.all(
    collections
      .filter((collection) => Boolean(payload.collections[collection].config.versions))
      .map((collection) => payload.db.deleteVersions({ collection, req, where: {} })),
  )

  payload.logger.info(`— Seeding demo author and user...`)

  await payload.delete({
    collection: 'users',
    depth: 0,
    where: {
      email: {
        equals: 'demo-author@example.com',
      },
    },
  })

  // Skip creating media and categories to simplify the seed process
  payload.logger.info(`— Skipping media and categories creation...`)

  // Create a demo user
  const demoAuthor = await payload.create({
    collection: 'users',
    data: {
      name: 'Demo Author',
      email: 'demo-author@example.com',
      password: 'password',
    },
  })

  // Skip creating posts to simplify the seed process
  payload.logger.info(`— Skipping posts creation...`)

  // Skip page creation for now to simplify the seed process
  payload.logger.info(`— Seeding globals...`)

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Admin',
              url: '/admin',
            },
          },
        ],
      },
    }),
    payload.updateGlobal({
      slug: 'footer',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Admin',
              url: '/admin',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Source Code',
              newTab: true,
              url: 'https://github.com/payloadcms/payload/tree/main/templates/website',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Payload',
              newTab: true,
              url: 'https://payloadcms.com/',
            },
          },
        ],
      },
    }),
  ])

  payload.logger.info('Seeded database successfully!')
}
