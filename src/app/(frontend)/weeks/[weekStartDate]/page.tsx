import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import MeetingSchedulePage from './page.client'

export const runtime = 'nodejs'

type WeekParams = {
  params: {
    weekStartDate: string
  }
}

export default async function WeekPage({ params }: WeekParams) {
  const { isEnabled: draft } = await draftMode()
  const { weekStartDate } = params

  if (!weekStartDate) {
    return notFound()
  }

  try {
    const payload = await getPayload({ config: configPromise })

    // Finde die Woche anhand des Startdatums
    const weeksQuery = await payload.find({
      collection: 'weeks',
      where: {
        weekStartDate: {
          equals: weekStartDate,
        },
      },
      draft,
      depth: 1,
    })

    const week = weeksQuery.docs[0]

    if (!week) {
      return notFound()
    }

    // Lade die Beziehungsdaten für die zugewiesenen Personen
    // Dies lädt die zugewiesenen Benutzer oder Besucher vollständig
    const populatedWeek = await payload.findByID({
      collection: 'weeks',
      id: week.id,
      draft,
      depth: 2, // Tiefe für Beziehungen
    })

    return <MeetingSchedulePage week={populatedWeek} />
  } catch (error) {
    console.error('Fehler beim Laden der Wochendaten:', error)
    return notFound()
  }
}
