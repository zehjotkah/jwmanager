'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useDocumentInfo } from '@payloadcms/ui'

const ImportButtonField = ({ path }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [apiResponse, setApiResponse] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)
  const documentInfo = useDocumentInfo()
  const id = documentInfo?.id

  // Lade Dokumentdaten, wenn ID verfügbar ist
  useEffect(() => {
    const fetchDocumentData = async () => {
      if (!id) return

      try {
        const response = await fetch(`/api/weeks/${id}`)
        if (response.ok) {
          const data = await response.json()
          setApiResponse(data)
        } else {
          console.error('Fehler beim Laden der Wochendaten:', response.statusText)
        }
      } catch (err) {
        console.error('Fehler beim Laden der Wochendaten:', err)
      }
    }

    fetchDocumentData()
  }, [id])

  const handleImport = async () => {
    if (!id) {
      setError('Keine Dokument-ID gefunden.')
      return
    }

    if (!apiResponse) {
      setError('Dokumentdaten konnten nicht geladen werden.')
      return
    }

    if (!apiResponse.weekStartDate) {
      setError(
        "Kein Startdatum in der Datenbank gefunden. Bitte klicke auf 'Speichern', nachdem du das Datum gesetzt hast.",
      )
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setDebugInfo(null)

    try {
      // Berechne Jahr/Woche
      const date = new Date(apiResponse.weekStartDate)
      const year = date.getFullYear()
      const onejan = new Date(year, 0, 1)
      const weekNum = Math.ceil(
        ((date.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7,
      )
      const yearWeek = `${year}/${String(weekNum).padStart(2, '0')}`

      const debugData = {
        startDate: apiResponse.weekStartDate,
        parsedDate: date.toISOString(),
        year,
        weekNum,
        yearWeek,
      }

      setDebugInfo('Import-Parameter: ' + JSON.stringify(debugData, null, 2))

      // Importiere die Daten mit verbesserter Fehlerbehandlung
      let importResponse
      try {
        importResponse = await fetch(`/api/import-jw-meeting?yearWeek=${yearWeek}`)

        if (!importResponse.ok) {
          const errorText = await importResponse.text()
          throw new Error(`API-Fehler (${importResponse.status}): ${errorText}`)
        }
      } catch (fetchErr) {
        throw new Error(`Netzwerkfehler beim Aufruf der Import-API: ${fetchErr.message}`)
      }

      let importData
      try {
        importData = await importResponse.json()
      } catch (jsonErr) {
        throw new Error(`Fehler beim Parsen der API-Antwort: ${jsonErr.message}`)
      }

      if (!importData.success) {
        throw new Error(importData.error || 'Unbekannter Fehler beim Import')
      }

      // Nach dem JSON-Parse von importData:
      if (importData?.weekData) {
        // Stelle sicher, dass wir die Struktur genau nach der Collection-Definition aufbauen
        const updateData = {
          // Wir brauchen nur die Daten, die wir ändern wollen
          midweekMeeting: {
            // Wichtig: Wir lassen meetingDay weg - wird durch Hook gesetzt
            openingSong: importData.weekData.midweekMeeting?.openingSong || 1,
            treasuresFromGodsWord: {
              talkTitle: importData.weekData.midweekMeeting?.treasuresFromGodsWord?.talkTitle || '',
              talkDuration:
                importData.weekData.midweekMeeting?.treasuresFromGodsWord?.talkDuration || 10,
              spiritualGemsDuration:
                importData.weekData.midweekMeeting?.treasuresFromGodsWord?.spiritualGemsDuration ||
                10,
              bibleReadingScripture:
                importData.weekData.midweekMeeting?.treasuresFromGodsWord?.bibleReadingScripture ||
                '',
              bibleReadingLesson:
                importData.weekData.midweekMeeting?.treasuresFromGodsWord?.bibleReadingLesson || '',
              bibleReadingDuration:
                importData.weekData.midweekMeeting?.treasuresFromGodsWord?.bibleReadingDuration ||
                4,
            },
            applyYourselfToFieldMinistry: {
              fieldMinistryAssignments:
                importData.weekData.midweekMeeting?.applyYourselfToFieldMinistry
                  ?.fieldMinistryAssignments || [],
            },
            livingAsChristians: {
              livingAsChristiansSong:
                importData.weekData.midweekMeeting?.livingAsChristians?.livingAsChristiansSong || 1,
              assignments:
                importData.weekData.midweekMeeting?.livingAsChristians?.assignments || [],
            },
            closingSong: importData.weekData.midweekMeeting?.closingSong || 1,
          },
          weekendMeeting: {
            // Wichtig: Wir lassen meetingDay weg - wird durch Hook gesetzt
            openingSong: importData.weekData.weekendMeeting?.openingSong || 1,
            publicTalk: {
              title: importData.weekData.weekendMeeting?.publicTalkTitle || '',
            },
            middleSong: importData.weekData.weekendMeeting?.middleSong || 1,
            watchtowerStudy: {
              title: importData.weekData.weekendMeeting?.watchtowerStudyTitle || '',
            },
            closingSong: importData.weekData.weekendMeeting?.closingSong || 1,
          },
        }

        console.log('Aktualisierte Daten für PATCH:', JSON.stringify(updateData))

        // Aktualisiere die Woche
        const updateResponse = await fetch(`/api/weeks/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updateData),
        })

        if (!updateResponse.ok) {
          throw new Error(`Fehler beim Aktualisieren der Woche: ${updateResponse.statusText}`)
        }

        setSuccess('JW-Daten erfolgreich importiert!')

        // Seite nach 2 Sekunden neu laden, um Änderungen anzuzeigen
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (err) {
      setError(err?.message || 'Unbekannter Fehler')
      console.error('Import-Fehler:', err)
    } finally {
      setLoading(false)
    }
  }

  // Überprüfe, ob das Startdatum fehlt, aber ein Datum im Formularelement vorhanden ist
  const hasUnsavedDate = () => {
    if (typeof window === 'undefined') return false

    const dateInputElement = document.querySelector('.react-datepicker__input-container input')
    return dateInputElement?.value && !apiResponse?.weekStartDate
  }

  // Status bestimmen
  let statusText = 'Lade...'
  let warningText = null

  if (id && !apiResponse) {
    statusText = `ID: ${id}, lade Dokumentdaten...`
  } else if (id && apiResponse) {
    if (apiResponse.weekStartDate) {
      statusText = `Bereit - ID: ${id}, Startdatum: ${apiResponse.weekStartDate}`
    } else {
      statusText = `ID: ${id}, Startdatum fehlt`
      if (hasUnsavedDate()) {
        warningText =
          "⚠️ Es wurde ein Datum eingegeben, aber noch nicht gespeichert! Bitte klicke auf 'Speichern' und versuche es dann erneut."
      }
    }
  }

  return (
    <div className="field-type" style={{ marginBottom: '20px' }}>
      <label className="field-label">JW-Daten</label>
      <div className="field-description">
        Importiere Daten von der JW-Website für diese Woche.
        <strong>Wichtig:</strong> Das Formular muss mit einem gültigen Startdatum gespeichert sein.
      </div>
      <div style={{ marginTop: '10px' }}>
        <Button
          onClick={handleImport}
          disabled={loading || !id || !apiResponse?.weekStartDate}
          style={{
            backgroundColor: '#2563EB',
            color: 'white',
            padding: '10px 16px',
          }}
        >
          {loading ? 'Importiere...' : '📥 JW-Daten importieren'}
        </Button>

        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
          Status: {statusText}
        </div>

        {warningText && (
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#FEFCE8',
              color: '#854D0E',
              borderRadius: '0.25rem',
              fontWeight: 'bold',
            }}
          >
            {warningText}
          </div>
        )}

        {debugInfo && (
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#F1F5F9',
              color: '#475569',
              borderRadius: '0.25rem',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
            }}
          >
            {debugInfo}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '0.5rem',
              backgroundColor: '#FECACA',
              color: '#991B1B',
              borderRadius: '0.25rem',
              marginTop: '0.5rem',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '0.5rem',
              backgroundColor: '#D1FAE5',
              color: '#065F46',
              borderRadius: '0.25rem',
              marginTop: '0.5rem',
            }}
          >
            {success}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImportButtonField
