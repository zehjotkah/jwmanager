'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Diamond,
  Wheat,
  BookOpen,
  ChevronLeftIcon,
  ChevronRightIcon,
  PrinterIcon,
  DownloadIcon,
  ShareIcon,
  CalendarIcon,
  BookOpenCheck,
  Radio,
} from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

interface MeetingSchedulePageProps {
  week: any // Idealerweise sollte dies mit einem Typ aus der Payload-Kollektion typisiert werden
}

export default function MeetingSchedulePage({ week }: MeetingSchedulePageProps) {
  const [mounted, setMounted] = useState(false)
  const weekContainerRef = useRef<HTMLDivElement>(null)

  // Nach dem Mounten setzen wir mounted auf true
  useEffect(() => {
    setMounted(true)
  }, [])

  // Format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      const date = parseISO(dateString)
      return format(date, 'dd.MM.yyyy', { locale: de })
    } catch (error) {
      console.error('Fehler beim Formatieren des Datums:', error)
      return dateString
    }
  }

  const formatWeekdayDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      const date = parseISO(dateString)
      return format(date, 'EEE. dd.MM.', { locale: de })
    } catch (error) {
      console.error('Fehler beim Formatieren des Datums:', error)
      return dateString
    }
  }

  const extractName = (person: any) => {
    if (!person) return ''
    if (typeof person === 'string') return person

    if (person.relationTo && person.value) {
      const value = person.value
      if (typeof value === 'string') return value
      if (value.name) return value.name
      if (value.firstName && value.lastName) return `${value.firstName} ${value.lastName}`
    }

    return ''
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    toast({
      title: 'PDF wird generiert',
      description: 'Diese Funktion ist noch in Entwicklung.',
    })
  }

  const handleShare = () => {
    toast({
      title: 'Plan geteilt',
      description: 'Der Versammlungsplan wurde geteilt.',
      variant: 'success',
    })
  }

  // Wenn noch nicht gemounted, geben wir nichts zurück
  if (!mounted) {
    return null
  }

  const midweekMeeting = week?.midweekMeeting || {}
  const weekendMeeting = week?.weekendMeeting || {}
  const weekStartDate = formatDate(week?.weekStartDate || '')
  const midweekDate = formatWeekdayDate(midweekMeeting?.calculatedDate || '')
  const weekendDate = formatWeekdayDate(weekendMeeting?.calculatedDate || '')

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Puerto de la Cruz - Alemana</h1>
        <div className="flex items-center justify-center space-x-2 mt-4">
          <div className="relative overflow-hidden" ref={weekContainerRef}>
            <div className="flex items-center">
              <div className="flex items-center gap-2 bg-muted/50 dark:bg-muted/20 px-5 py-2.5 rounded-xl">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <span className="text-lg font-medium">WOCHE VOM {weekStartDate}</span>
              </div>
            </div>
          </div>
        </div>
        <Separator className="mt-4 mb-6" />
      </div>

      <div className="flex justify-end mb-4">
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-md"
                  onClick={handlePrint}
                >
                  <PrinterIcon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Plan drucken</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-md"
                  onClick={handleDownloadPDF}
                >
                  <DownloadIcon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Als PDF exportieren</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-md"
                  onClick={handleShare}
                >
                  <ShareIcon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Plan teilen</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Section 1 - ZUSAMMENKUNFT UNTER DER WOCHE */}
      <Card className="mb-4 shadow-sm overflow-hidden rounded-md border border-border/50 card-hover">
        <CardHeader className="bg-[#333333] text-white py-3 px-4 flex flex-row items-center justify-between">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-base font-medium uppercase">
              ZUSAMMENKUNFT UNTER DER WOCHE
            </CardTitle>
            <Badge
              variant="outline"
              className="text-white border-white/20 bg-white/10 backdrop-blur-sm"
            >
              {midweekDate}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="space-y-0">
            <div className="grid grid-cols-12 items-center py-3 px-4 border-b border-border/50 transition-all duration-200 hover:bg-muted/30">
              <div className="col-span-1 font-medium text-primary">
                {midweekMeeting.calculatedTime}
              </div>
              <div className="col-span-3">Lied {midweekMeeting.openingSong}</div>
              <div className="col-span-2 text-muted-foreground">Gebet:</div>
              <div className="col-span-6">{extractName(midweekMeeting.openingPrayer)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 - SCHÄTZE AUS GOTTES WORT */}
      {midweekMeeting.treasuresFromGodsWord && (
        <Card className="mb-4 shadow-sm overflow-hidden rounded-md border border-border/50 card-hover">
          <CardHeader className="bg-[#f0f0f0] py-3 px-4 flex flex-row items-center justify-between">
            <div className="flex items-center">
              <div className="mr-2 h-8 w-8 rounded-full bg-[#c0c0c0] flex items-center justify-center">
                <Diamond className="h-4 w-4 text-[#333333]" />
              </div>
              <CardTitle className="text-base font-medium uppercase text-[#333333]">
                SCHÄTZE AUS GOTTES WORT
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-0 bg-[#f0f0f0]/30">
            <div className="space-y-0">
              <div className="grid grid-cols-12 items-center py-3 px-4 border-b border-[#e0e0e0] transition-all duration-200 hover:bg-muted/30">
                <div className="col-span-1 font-medium text-[#333333]">
                  {midweekMeeting.treasuresFromGodsWord.talkTime}
                </div>
                <div className="col-span-5">{midweekMeeting.treasuresFromGodsWord.talkTitle}</div>
                <div className="col-span-6">
                  {extractName(midweekMeeting.treasuresFromGodsWord.talkAssignee)}
                </div>
              </div>
              <div className="grid grid-cols-12 items-center py-3 px-4 border-b border-[#e0e0e0] transition-all duration-200 hover:bg-muted/30">
                <div className="col-span-1 font-medium text-[#333333]">
                  {midweekMeeting.treasuresFromGodsWord.spiritualGemsTime}
                </div>
                <div className="col-span-5">Nach geistigen Schätzen graben</div>
                <div className="col-span-6">
                  {extractName(midweekMeeting.treasuresFromGodsWord.spiritualGemsAssignee)}
                </div>
              </div>
              <div className="grid grid-cols-12 items-center py-3 px-4 border-b border-[#e0e0e0] transition-all duration-200 hover:bg-muted/30">
                <div className="col-span-1 font-medium text-[#333333]">
                  {midweekMeeting.treasuresFromGodsWord.bibleReadingTime}
                </div>
                <div className="col-span-5">
                  {midweekMeeting.treasuresFromGodsWord.bibleReadingScripture || 'Bibellesung'}
                </div>
                <div className="col-span-6">
                  {extractName(midweekMeeting.treasuresFromGodsWord.bibleReadingAssignee)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 3 - UNS IM DIENST VERBESSERN */}
      {midweekMeeting.applyYourselfToFieldMinistry && (
        <Card className="mb-4 shadow-sm overflow-hidden rounded-md border border-border/50 card-hover">
          <CardHeader className="bg-[#f8e8d4] py-3 px-4 flex flex-row items-center justify-between">
            <div className="flex items-center">
              <div className="mr-2 h-8 w-8 rounded-full bg-[#e0c8a0] flex items-center justify-center">
                <Wheat className="h-4 w-4 text-[#333333]" />
              </div>
              <CardTitle className="text-base font-medium uppercase text-[#333333]">
                UNS IM DIENST VERBESSERN
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-0 bg-[#f8e8d4]/30">
            <div className="space-y-0">
              {midweekMeeting.applyYourselfToFieldMinistry.fieldMinistryAssignments?.map(
                (assignment: any, index: number) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 items-center py-3 px-4 border-b border-[#e8d0b0] transition-all duration-200 hover:bg-muted/30"
                  >
                    <div className="col-span-1 font-medium text-[#333333]">{assignment.time}</div>
                    <div className="col-span-5">
                      {assignment.title} {assignment.lesson ? `(${assignment.lesson})` : ''}
                    </div>
                    <div className="col-span-6">
                      {extractName(assignment.assignee)}
                      {assignment.assistant && ` mit ${extractName(assignment.assistant)}`}
                    </div>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 4 - UNSER LEBEN ALS CHRIST */}
      {midweekMeeting.livingAsChristians && (
        <Card className="mb-4 shadow-sm overflow-hidden rounded-md border border-border/50 card-hover">
          <CardHeader className="bg-[#f8d8d8] py-3 px-4 flex flex-row items-center justify-between">
            <div className="flex items-center">
              <div className="mr-2 h-8 w-8 rounded-full bg-[#e0a0a0] flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-[#333333]" />
              </div>
              <CardTitle className="text-base font-medium uppercase text-[#333333]">
                UNSER LEBEN ALS CHRIST
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-0 bg-[#f8d8d8]/30">
            <div className="space-y-0">
              <div className="grid grid-cols-12 items-center py-3 px-4 border-b border-[#e8c0c0] transition-all duration-200 hover:bg-muted/30">
                <div className="col-span-1 font-medium text-[#333333]"></div>
                <div className="col-span-5">
                  Lied {midweekMeeting.livingAsChristians.livingAsChristiansSong}
                </div>
                <div className="col-span-6"></div>
              </div>

              {midweekMeeting.livingAsChristians.assignments?.map(
                (assignment: any, index: number) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 items-center py-3 px-4 border-b border-[#e8c0c0] transition-all duration-200 hover:bg-muted/30"
                  >
                    <div className="col-span-1 font-medium text-[#333333]">{assignment.time}</div>
                    <div className="col-span-5">{assignment.title}</div>
                    <div className="col-span-6">{extractName(assignment.assignee)}</div>
                  </div>
                ),
              )}

              <div className="grid grid-cols-12 items-center py-3 px-4 border-b border-[#e8c0c0] transition-all duration-200 hover:bg-muted/30">
                <div className="col-span-1 font-medium text-[#333333]"></div>
                <div className="col-span-3">Lied {midweekMeeting.closingSong}</div>
                <div className="col-span-2 text-muted-foreground">Gebet:</div>
                <div className="col-span-6">{extractName(midweekMeeting.closingPrayer)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="section-divider"></div>

      {/* ZUSAMMENKUNFT AM WOCHENENDE */}
      <Card className="mb-4 shadow-sm overflow-hidden rounded-md border border-border/50 card-hover">
        <CardHeader className="bg-[#333333] text-white py-3 px-4 flex flex-row items-center justify-between">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-base font-medium uppercase">
              ZUSAMMENKUNFT AM WOCHENENDE
            </CardTitle>
            <Badge
              variant="outline"
              className="text-white border-white/20 bg-white/10 backdrop-blur-sm"
            >
              {weekendDate}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="space-y-0">
            <div className="grid grid-cols-12 items-center py-3 px-4 border-b border-border/50 transition-all duration-200 hover:bg-muted/30">
              <div className="col-span-1 font-medium text-[#333333]">
                {weekendMeeting.calculatedTime}
              </div>
              <div className="col-span-5">Lied {weekendMeeting.openingSong}</div>
              <div className="col-span-6">
                {extractName(weekendMeeting.chairman)} (Vorsitzender)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ÖFFENTLICHER VORTRAG */}
      <Card className="mb-4 shadow-sm overflow-hidden rounded-md border border-border/50 card-hover">
        <CardHeader className="bg-[#d8e8f8] py-3 px-4 flex flex-row items-center justify-between">
          <div className="flex items-center">
            <div className="mr-2 h-8 w-8 rounded-full bg-[#a0c0e0] flex items-center justify-center">
              <Radio className="h-4 w-4 text-[#333333]" />
            </div>
            <CardTitle className="text-base font-medium uppercase text-[#333333]">
              ÖFFENTLICHER VORTRAG
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-[#d8e8f8]/30">
          <div className="space-y-0">
            <div className="grid grid-cols-12 items-center py-3 px-4 border-b border-[#c0d8e8] transition-all duration-200 hover:bg-muted/30">
              <div className="col-span-1 font-medium text-[#333333]"></div>
              <div className="col-span-5">
                {weekendMeeting.publicTalk?.title?.value?.title || 'Öffentlicher Vortrag'}
              </div>
              <div className="col-span-6">{extractName(weekendMeeting.publicTalk?.speaker)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WACHTTURM-STUDIUM */}
      <Card className="mb-4 shadow-sm overflow-hidden rounded-md border border-border/50 card-hover">
        <CardHeader className="bg-[#d8f8d8] py-3 px-4 flex flex-row items-center justify-between">
          <div className="flex items-center">
            <div className="mr-2 h-8 w-8 rounded-full bg-[#a0e0a0] flex items-center justify-center">
              <BookOpenCheck className="h-4 w-4 text-[#333333]" />
            </div>
            <CardTitle className="text-base font-medium uppercase text-[#333333]">
              WACHTTURM-STUDIUM
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-[#d8f8d8]/30">
          <div className="space-y-0">
            <div className="grid grid-cols-12 items-center py-3 px-4 border-b border-[#c0e8c0] transition-all duration-200 hover:bg-muted/30">
              <div className="col-span-1 font-medium text-[#333333]"></div>
              <div className="col-span-5">
                <div>Lied {weekendMeeting.middleSong}</div>
                <div>{weekendMeeting.watchtowerStudy?.title || '"Gebt Jehova die Ehre"'}</div>
              </div>
              <div className="col-span-6">
                <div>{extractName(weekendMeeting.watchtowerStudy?.conductor)} (Leiter)</div>
              </div>
            </div>
            <div className="grid grid-cols-12 items-center py-3 px-4 border-b border-[#c0e8c0] transition-all duration-200 hover:bg-muted/30">
              <div className="col-span-1 font-medium text-[#333333]"></div>
              <div className="col-span-3">Lied {weekendMeeting.closingSong}</div>
              <div className="col-span-2 text-muted-foreground">Gebet:</div>
              <div className="col-span-6">{extractName(weekendMeeting.closingPrayer)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Date */}
      <div className="text-right text-sm text-muted-foreground">
        <div>Druckdatum: {format(new Date(), 'dd.MM.yyyy', { locale: de })}</div>
      </div>
    </div>
  )
}
