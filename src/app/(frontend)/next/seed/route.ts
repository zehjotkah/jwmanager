// This route has been removed as part of removing the seeding functionality
export async function POST(): Promise<Response> {
  return new Response('Seeding functionality has been removed.', { status: 404 })
}
