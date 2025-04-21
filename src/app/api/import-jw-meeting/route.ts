import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import { NextResponse } from 'next/server'

const execAsync = promisify(exec)

export async function GET(request: Request) {
  // URL-Parameter auslesen
  const url = new URL(request.url)
  const yearWeek = url.searchParams.get('yearWeek')

  if (!yearWeek) {
    return NextResponse.json(
      { success: false, error: 'Ungültiges Format für yearWeek' },
      { status: 400 },
    )
  }

  try {
    // Debug-Informationen über das aktuelle Verzeichnis
    const cwd = process.cwd()
    console.log('Aktuelles Arbeitsverzeichnis:', cwd)

    // Temporäre JSON-Datei für die Ergebnisse
    const outputFile = path.resolve(cwd, 'temp', `meeting_data_${Date.now()}.json`)

    // Stelle sicher, dass das temp-Verzeichnis existiert
    const tempDir = path.dirname(outputFile)
    console.log('Temp-Verzeichnis:', tempDir)

    if (!fs.existsSync(tempDir)) {
      console.log('Temp-Verzeichnis existiert nicht, erstelle es...')
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Python-Skript aufrufen
    const scriptPath = path.resolve(cwd, 'scripts', 'jw_scraper.py')
    console.log('Skriptpfad:', scriptPath)

    if (!fs.existsSync(scriptPath)) {
      console.error('Python-Skript nicht gefunden:', scriptPath)
      return NextResponse.json(
        { success: false, error: `Python-Skript nicht gefunden: ${scriptPath}` },
        { status: 500 },
      )
    }

    const command = `python3 "${scriptPath}" --year-week ${yearWeek} --output "${outputFile}"`
    console.log('Führe Befehl aus:', command)

    const { stdout, stderr } = await execAsync(command)
    console.log('Python-Skript Ausgabe:', stdout)

    if (stderr) {
      console.error('Python-Skript Fehler:', stderr)
    }

    // Prüfen, ob die Ausgabedatei existiert
    if (!fs.existsSync(outputFile)) {
      console.error('Ausgabedatei wurde nicht erstellt:', outputFile)
      return NextResponse.json(
        {
          success: false,
          error:
            'Ausgabedatei wurde nicht erstellt, das Python-Skript ist möglicherweise fehlgeschlagen',
        },
        { status: 500 },
      )
    }

    // Ergebnisse lesen
    const rawData = fs.readFileSync(outputFile, 'utf-8')
    console.log('Rohdaten gelesen:', rawData.substring(0, 100) + '...')

    let weekData
    try {
      weekData = JSON.parse(rawData)

      // Sicherstellen, dass wir ein gültiges Objekt haben
      if (!weekData.midweekMeeting || !weekData.weekendMeeting) {
        console.error('Ungültige Datenstruktur:', weekData)
        return NextResponse.json(
          { success: false, error: 'Ungültige Datenstruktur vom Scraper' },
          { status: 500 },
        )
      }

      console.log('Datenstruktur gültig, enthält midweekMeeting und weekendMeeting')
    } catch (error) {
      console.error('JSON-Parse-Fehler:', error)
      return NextResponse.json(
        { success: false, error: 'Fehler beim Parsen der JSON-Daten' },
        { status: 500 },
      )
    }

    // Temporäre Datei löschen
    fs.unlinkSync(outputFile)
    console.log('Temporäre Datei erfolgreich gelöscht')

    return NextResponse.json({
      success: true,
      weekData: weekData,
    })
  } catch (error) {
    console.error('Fehler beim Importieren der JW-Meeting-Daten:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unbekannter Fehler beim Import',
      },
      { status: 500 },
    )
  }
}
