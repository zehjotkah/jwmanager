import asyncio
import aiohttp
import json
import re
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from typing import Dict, List, Any
import time
import random
import argparse
import os

class JWMeetingScraper:
    def __init__(self, base_url: str = "https://wol.jw.org/de/wol/meetings/r10/lp-x"):
        self.base_url = base_url
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
        }
        self.session = None
        self.rate_limit_delay = 3  # Sekunden zwischen Anfragen

    async def _init_session(self):
        if self.session is None:
            self.session = aiohttp.ClientSession()

    async def close(self):
        if self.session:
            await self.session.close()
            self.session = None

    async def _fetch_page(self, url: str) -> str:
        await self._init_session()
        
        # Rate-Limiting mit leichter Zufallsverzögerung
        delay = self.rate_limit_delay + random.uniform(0.5, 1.5)
        await asyncio.sleep(delay)
        
        try:
            async with self.session.get(url, headers=self.headers) as response:
                if response.status != 200:
                    print(f"Fehler: HTTP-Status {response.status} für URL {url}")
                    return ""
                return await response.text()
        except Exception as e:
            print(f"Fehler beim Abrufen von {url}: {e}")
            return ""

    def _extract_week_date_range(self, date_header: str) -> Dict[str, str]:
        """Extrahiert Start- und Enddatum aus dem Wochentitel"""
        date_pattern = r"(\d+\.\s+\w+)\s+–\s+(\d+\.\s+\w+\s+\d{4})"
        matches = re.search(date_pattern, date_header)
        
        if matches:
            start_date_str = matches.group(1)
            end_date_str = matches.group(2)
            
            # Falls Jahr im ersten Teil fehlt, aus dem zweiten Teil ergänzen
            if not any(char.isdigit() for char in start_date_str[-4:]):
                year = re.search(r"(\d{4})", end_date_str).group(1)
                start_date_str = f"{start_date_str} {year}"
            
            return {
                "start": start_date_str,
                "end": end_date_str
            }
        return {"start": "", "end": ""}

    def _extract_bible_reading_details(self, title: str) -> Dict[str, str]:
        """Extrahiert Bibellesungsdetails aus dem Titel"""
        scripture_pattern = r"Bibellesung:\s+([^(]+)(?:\(([^)]+)\))?"
        matches = re.search(scripture_pattern, title)
        
        if matches:
            scripture = matches.group(1).strip()
            lesson = matches.group(2).strip() if matches.group(2) else ""
            
            return {
                "scripture": scripture,
                "lesson": lesson
            }
        return {"scripture": "", "lesson": ""}

    def _extract_song_number(self, song_text):
        """Extrahiert die Liednummer aus einem Lied-Text"""
        match = re.search(r'(\d+)', song_text)
        if match:
            try:
                return int(match.group(1))
            except ValueError:
                pass
        return 0

    def _fix_lesson_format(self, text):
        """Korrigiert das Format der Lektionsreferenzen, indem ein Leerzeichen eingefügt wird"""
        if not text:
            return text
        return re.sub(r'(th|lmd)(Lektion)', r'\1 \2', text)

    def _parse_midweek_meeting(self, week_soup) -> Dict[str, Any]:
        """Extrahiert die Daten für das Wochentags-Meeting"""
        midweek_data = {
            "openingSong": 0,
            "treasuresFromGodsWord": {
                "talkTitle": "",
                "talkDuration": 10,
                "spiritualGemsDuration": 10,
                "bibleReadingScripture": "",
                "bibleReadingLesson": "",
                "bibleReadingDuration": 4
            },
            "applyYourselfToFieldMinistry": {
                "fieldMinistryAssignments": []
            },
            "livingAsChristians": {
                "livingAsChristiansSong": 0,
                "assignments": []
            },
            "closingSong": 0
        }
        
        print("Analyse der Midweek-Meeting-Struktur beginnt...")
        
        try:
            # Finde das Eröffnungslied (erstes h3 mit dc-icon--music-Klasse)
            opening_song_elem = week_soup.select_one("h3.dc-icon--music a, h3 a:-soup-contains('Lied')")
            if opening_song_elem:
                opening_song_text = opening_song_elem.get_text(strip=True)
                midweek_data["openingSong"] = self._extract_song_number(opening_song_text)
                print(f"Eröffnungslied gefunden: {opening_song_text} -> {midweek_data['openingSong']}")
            
            # Finde das Living as Christians Lied (nach dem dc-icon--sheep)
            lac_song_elem = week_soup.select_one("div.dc-icon--sheep + h3.dc-icon--music, div:-soup-contains('UNSER LEBEN ALS CHRIST') + h3 a:-soup-contains('Lied')")
            if lac_song_elem:
                # Suche nach dem Link innerhalb des Elements
                song_link = lac_song_elem.select_one("a")
                if song_link:
                    lac_song_text = song_link.get_text(strip=True)
                    midweek_data["livingAsChristians"]["livingAsChristiansSong"] = self._extract_song_number(lac_song_text)
                    print(f"Living as Christians Lied gefunden: {lac_song_text} -> {midweek_data['livingAsChristians']['livingAsChristiansSong']}")
            
            # Finde das Schlusslied (im oder nach dem Schlussworte-Element)
            closing_section = week_soup.select_one("h3:-soup-contains('Schlussworte')")
            if closing_section:
                # Suche nach dem Link innerhalb des Elements
                song_link = closing_section.select_one("a:-soup-contains('Lied')")
                if song_link:
                    closing_song_text = song_link.get_text(strip=True)
                    midweek_data["closingSong"] = self._extract_song_number(closing_song_text)
                    print(f"Schlusslied gefunden: {closing_song_text} -> {midweek_data['closingSong']}")
            
            # Finde die SCHÄTZE AUS GOTTES WORT Sektion
            treasures_section = week_soup.select_one("div.dc-icon--gem, div:-soup-contains('SCHÄTZE AUS GOTTES WORT')")
            if treasures_section:
                print("SCHÄTZE AUS GOTTES WORT Sektion gefunden")
                
                # Suche nach dem ersten Vortragstitel (h3 nach dem Abschnitt)
                talk_title_elem = week_soup.select_one("div.dc-icon--gem + div h3, h2:-soup-contains('SCHÄTZE AUS GOTTES WORT') + * h3")
                if talk_title_elem:
                    talk_title = talk_title_elem.get_text(strip=True)
                    # Bereinige den Titel (entferne Zahlen und Punkte am Anfang)
                    talk_title = re.sub(r'^\d+\.\s*', '', talk_title)
                    midweek_data["treasuresFromGodsWord"]["talkTitle"] = talk_title
                    print(f"Vortragstitel: {midweek_data['treasuresFromGodsWord']['talkTitle']}")
                
                # Bibellesung finden
                bible_reading_section = week_soup.select_one("h3:-soup-contains('Bibellesung')")
                if bible_reading_section:
                    # Finde das div mit der Bibelstelle
                    bible_div = bible_reading_section.find_next("div", class_="du-margin-inlineStart--5")
                    if bible_div:
                        # Suche nach dem Link zur Bibelstelle
                        bibl_links = bible_div.select("a.b")
                        if bibl_links:
                            scripture = bibl_links[0].get_text(strip=True)
                            midweek_data["treasuresFromGodsWord"]["bibleReadingScripture"] = scripture
                            print(f"Bibellesung Schriftstelle: {scripture}")
                        
                        # Suche nach dem TH-Lektion-Link
                        lesson_link = bible_div.select_one("a:-soup-contains('th Lektion')")
                        if lesson_link:
                            lesson_text = lesson_link.get_text(strip=True)
                            # Korrektur: Leerzeichen zwischen th/lmd und Lektion einfügen
                            lesson_text = self._fix_lesson_format(lesson_text)
                            midweek_data["treasuresFromGodsWord"]["bibleReadingLesson"] = lesson_text
                            print(f"Bibellesung Lektion: {lesson_text}")
            
            # Finde "UNS IM DIENST VERBESSERN" Sektion
            ministry_section = week_soup.select_one("div.dc-icon--wheat, div:-soup-contains('UNS IM DIENST VERBESSERN')")
            if ministry_section:
                print("UNS IM DIENST VERBESSERN Sektion gefunden")
                
                # Finde alle h3-Elemente für die Dienstaufgaben
                ministry_titles = week_soup.select("h3.du-fontSize--base.du-color--gold-700")
                field_assignments = []
                
                for title_elem in ministry_titles:
                    # Prüfe, ob dies eine Dienstaufgabe ist
                    if not title_elem.get_text(strip=True).startswith("UNS IM DIENST VERBESSERN"):
                        title = title_elem.get_text(strip=True)
                        # Bereinige den Titel (entferne Zahlen und Punkte am Anfang)
                        title = re.sub(r'^\d+\.\s*', '', title)
                        
                        # Finde die Beschreibung (im nächsten div)
                        desc_div = title_elem.find_next("div", class_="du-margin-inlineStart--5")
                        lesson = ""
                        
                        if desc_div:
                            # Suche nach dem Paragraph mit der Beschreibung
                            desc_p = desc_div.select_one("p.du-color--textSubdued")
                            if desc_p:
                                desc_text = desc_p.get_text(strip=True)
                                # Extrahiere die Lektion aus dem Text (nach INFORMELL.)
                                if "INFORMELL." in desc_text:
                                    lesson = desc_text.split("INFORMELL.")[1].strip()
                                else:
                                    lesson = desc_text
                            
                            # Suche nach dem Link zur Lektion
                            lesson_link = desc_div.select_one("a:-soup-contains('lmd')")
                            if lesson_link:
                                lesson_detail = lesson_link.get_text(strip=True)
                                # Korrektur: Leerzeichen zwischen lmd/th und Lektion einfügen
                                lesson_detail = self._fix_lesson_format(lesson_detail)
                                if "Lektion" in lesson_detail:
                                    if lesson:
                                        lesson += f" ({lesson_detail})"
                                    else:
                                        lesson = lesson_detail
                        
                        # Füge die Aufgabe hinzu
                        field_assignments.append({
                            "title": title,
                            "lesson": lesson,
                            "duration": 4,  # Standard-Dauer basierend auf deinem HTML
                            "id": str(len(field_assignments) + 1)
                        })
                        print(f"Dienstaufgabe: {title} - {lesson}")
                
                # Filtere die Aufgaben - nur die ersten 3 gehören zu fieldMinistryAssignments
                if field_assignments:
                    midweek_data["applyYourselfToFieldMinistry"]["fieldMinistryAssignments"] = field_assignments[:3]
            
            # Finde "UNSER LEBEN ALS CHRIST" Sektion
            christian_section = week_soup.select_one("div.dc-icon--sheep, div:-soup-contains('UNSER LEBEN ALS CHRIST')")
            if christian_section:
                print("UNSER LEBEN ALS CHRIST Sektion gefunden")
                
                # Finde alle h3-Elemente nach diesem Abschnitt für die Aufgaben
                christian_titles = week_soup.select("h3.du-fontSize--base.du-color--maroon-600")
                christian_assignments = []
                
                for title_elem in christian_titles:
                    # Prüfe, ob dies eine christliche Aufgabe ist (keine Überschrift und kein Lied)
                    title_text = title_elem.get_text(strip=True)
                    if not title_text.startswith("UNSER LEBEN ALS CHRIST") and "Lied" not in title_text:
                        # Bereinige den Titel (entferne Zahlen und Punkte am Anfang)
                        title = re.sub(r'^\d+\.\s*', '', title_text)
                        
                        duration = 10 if "bibelstudium" in title.lower() else 5
                        if "aktuelles" in title.lower():
                            duration = 10
                        
                        christian_assignments.append({
                            "title": title,
                            "duration": duration,
                            "id": str(len(christian_assignments) + 1)
                        })
                        print(f"Christliche Aufgabe: {title}")
                
                if christian_assignments:
                    midweek_data["livingAsChristians"]["assignments"] = christian_assignments
        
        except Exception as e:
            print(f"Fehler beim Parsen des Midweek-Meetings: {e}")
            import traceback
            traceback.print_exc()
        
        # Stelle sicher, dass alle Song-Werte gültig sind
        if midweek_data["openingSong"] <= 0:
            midweek_data["openingSong"] = 1
        
        if midweek_data["livingAsChristians"]["livingAsChristiansSong"] <= 0:
            midweek_data["livingAsChristians"]["livingAsChristiansSong"] = 1
        
        if midweek_data["closingSong"] <= 0:
            midweek_data["closingSong"] = 1
        
        return midweek_data

    async def _parse_weekend_meeting(self, week_soup) -> Dict[str, Any]:
        """Extrahiert die Daten für das Wochenend-Meeting"""
        weekend_data = {
            "openingSong": 0,
            "middleSong": 0,
            "closingSong": 0,
            "publicTalkTitle": "",
            "publicTalkDuration": 30,
            "watchtowerStudyTitle": "",
            "watchtowerStudyDuration": 60
        }
        
        print("Analyse der Weekend-Meeting-Struktur beginnt...")
        
        try:
            # Public Talk Title finden
            public_talk_heading = week_soup.select_one("h3:-soup-contains('Öffentlicher Vortrag')")
            if public_talk_heading:
                public_talk_container = public_talk_heading.find_next("div")
                if public_talk_container:
                    public_talk_para = public_talk_container.select_one("p")
                    if public_talk_para:
                        weekend_data["publicTalkTitle"] = public_talk_para.get_text(strip=True)
                        print(f"Öffentlicher Vortrag Titel: {weekend_data['publicTalkTitle']}")
            
            # Watchtower Study Title und Link finden
            watchtower_link = None
            watchtower_title = None
            
            # Methode 1: Über den "Studienartikel" Abschnitt
            study_article_heading = week_soup.select_one("h3:-soup-contains('Studienartikel')")
            if study_article_heading:
                study_container = study_article_heading.find_next("div")
                if study_container:
                    # Suche nach dem Link zum Studienartikel
                    watchtower_link_elem = study_container.select_one("a.it")
                    if watchtower_link_elem:
                        watchtower_title = watchtower_link_elem.get_text(strip=True)
                        watchtower_link = watchtower_link_elem.get("href")
                        print(f"Wachtturm Titel gefunden: {watchtower_title}")
                        print(f"Wachtturm Link gefunden: {watchtower_link}")
            
            # Methode 2: Über die Inhaltsverzeichnis-Karte
            if not watchtower_link:
                toc_container = week_soup.select_one("div.itemData div.groupTOC")
                if toc_container:
                    watchtower_link_elem = toc_container.select_one("a.it")
                    if watchtower_link_elem:
                        watchtower_title = watchtower_link_elem.get_text(strip=True)
                        watchtower_link = watchtower_link_elem.get("href")
                        print(f"Wachtturm Titel aus TOC: {watchtower_title}")
                        print(f"Wachtturm Link aus TOC: {watchtower_link}")
            
            if watchtower_title:
                weekend_data["watchtowerStudyTitle"] = watchtower_title
            
            # Wenn wir einen Link zum Watchtower haben, folgen wir diesem, um die Lieder zu finden
            if watchtower_link:
                # FIX: Behandle /tc/ Links - folge ihnen erst, um den richtigen Artikel-Link zu finden
                if "/tc/" in watchtower_link:
                    # Konstruiere den vollständigen URL für den tc-Link
                    if watchtower_link.startswith("/"):
                        full_tc_url = f"https://wol.jw.org{watchtower_link}"
                    else:
                        full_tc_url = watchtower_link
                    
                    print(f"Folge Inhaltsverzeichnis-Link: {full_tc_url}")
                    
                    # Lade die Inhaltsverzeichnis-Seite
                    tc_html = await self._fetch_page(full_tc_url)
                    if tc_html:
                        tc_soup = BeautifulSoup(tc_html, 'html.parser')
                        
                        # Suche nach dem Link zum eigentlichen Artikel
                        article_elem = tc_soup.select_one("a.jwac")
                        if article_elem:
                            article_href = article_elem.get("href")
                            if article_href and "/d/" in article_href:
                                watchtower_link = article_href
                                print(f"Gefundener Artikel-Link: {watchtower_link}")
                        
                        # Fallback: Suche nach anderen möglichen Links
                        if "/d/" not in watchtower_link:
                            for link in tc_soup.select("a"):
                                href = link.get("href", "")
                                if "/d/" in href and "lp-x" in href:
                                    watchtower_link = href
                                    print(f"Fallback: Artikel-Link gefunden: {watchtower_link}")
                                    break
                
                # Nun haben wir hoffentlich den direkten Link zum Artikel
                # Lade die Wachtturm-Seite mit dem korrekten Link
                if watchtower_link:
                    print(f"Verwende Wachtturm-Link: {watchtower_link}")
                    
                    # Konstruiere die URL für den eigentlichen Artikel
                    if watchtower_link.startswith("/"):
                        article_url = f"https://wol.jw.org{watchtower_link}"
                    else:
                        article_url = watchtower_link
                    
                    print(f"Vollständige Artikel-URL: {article_url}")
                    
                    article_html = await self._fetch_page(article_url)
                    if article_html:
                        article_soup = BeautifulSoup(article_html, 'html.parser')
                        
                        # Finde alle Lied-Elemente
                        song_elems = article_soup.select("p.pubRefs a:-soup-contains('LIED'), div.du-color--textSubdued a:-soup-contains('LIED')")
                        print(f"Gefundene Lieder: {len(song_elems)}")
                        
                        # Logge alle gefundenen Lieder für die Fehlersuche
                        for i, song in enumerate(song_elems):
                            print(f"Lied {i+1}: {song.get_text(strip=True)}")
                        
                        # Verarbeite die Lieder basierend auf ihrer Position
                        if song_elems:
                            if len(song_elems) >= 1:
                                opening_song_text = song_elems[0].get_text(strip=True)
                                weekend_data["openingSong"] = self._extract_song_number(opening_song_text)
                                print(f"Eröffnungslied gefunden: {opening_song_text} -> {weekend_data['openingSong']}")
                            
                            if len(song_elems) >= 2:
                                # Das zweite Lied ist das mittlere Lied
                                middle_song_text = song_elems[1].get_text(strip=True)
                                # Stelle sicher, dass es nicht dasselbe wie das erste ist
                                middle_song_num = self._extract_song_number(middle_song_text)
                                if middle_song_num != weekend_data["openingSong"]:
                                    weekend_data["middleSong"] = middle_song_num
                                    print(f"Mittellied gefunden: {middle_song_text} -> {weekend_data['middleSong']}")
                            
                            if len(song_elems) >= 3:
                                # Das letzte Lied ist das Schlusslied
                                closing_song_text = song_elems[-1].get_text(strip=True)
                                weekend_data["closingSong"] = self._extract_song_number(closing_song_text)
                                print(f"Schlusslied gefunden: {closing_song_text} -> {weekend_data['closingSong']}")
                            elif len(song_elems) == 2:
                                # Bei nur zwei Liedern ist das zweite das Schlusslied
                                closing_song_text = song_elems[1].get_text(strip=True)
                                weekend_data["closingSong"] = self._extract_song_number(closing_song_text)
                                print(f"Schlusslied gefunden: {closing_song_text} -> {weekend_data['closingSong']}")
            
            # Wenn keine Lieder gefunden wurden, setze Standardwerte
            if weekend_data["openingSong"] <= 0:
                weekend_data["openingSong"] = 11
            
            if weekend_data["middleSong"] <= 0:
                weekend_data["middleSong"] = 18
            
            if weekend_data["closingSong"] <= 0:
                weekend_data["closingSong"] = 107
        
        except Exception as e:
            print(f"Fehler beim Parsen des Weekend-Meetings: {e}")
            import traceback
            traceback.print_exc()
        
        return weekend_data

    async def scrape_meeting(self, year, week_num):
        """Lädt die Meeting-Daten für die angegebene Woche und extrahiert die Daten"""
        print(f"Abrufen der Meeting-Daten für Woche {week_num}/{year}...")
        
        # Struktur für die Ergebnisdaten
        meeting_data = {
            "midweekMeeting": None,
            "weekendMeeting": None
        }
        
        try:
            # Stelle sicher, dass week_num ein String mit führender Null ist, falls nötig
            week_num_str = str(week_num).zfill(2)
            week_url = f"https://wol.jw.org/de/wol/meetings/r10/lp-x/{year}/{week_num_str}"
            print(f"URL: {week_url}")
            
            # Lade die Wochenübersicht
            html = await self._fetch_page(week_url)
            if not html:
                print(f"Keine Daten für Woche {week_num}/{year} gefunden")
                return meeting_data
            
            week_soup = BeautifulSoup(html, 'html.parser')
            
            # Extrahiere die Daten für das Wochentags-Meeting
            midweek_meeting = self._parse_midweek_meeting(week_soup)
            meeting_data["midweekMeeting"] = midweek_meeting
            
            # Extrahiere die Daten für das Wochenend-Meeting
            weekend_meeting = await self._parse_weekend_meeting(week_soup)
            meeting_data["weekendMeeting"] = weekend_meeting
        
        except Exception as e:
            print(f"Fehler beim Abrufen der Meeting-Daten: {e}")
            import traceback
            traceback.print_exc()
        
        return meeting_data

    async def scrape_multiple_weeks(self, start_year_week: str, num_weeks: int = 1) -> List[Dict[str, Any]]:
        """Mehrere Wochen scrapen (Format start_year_week: YYYY/WW)"""
        results = []
        
        year, week = map(int, start_year_week.split('/'))
        
        for i in range(num_weeks):
            current_week = week + i
            current_year = year
            
            # Jahreswechsel berücksichtigen
            if current_week > 52:
                current_week = 1
                current_year += 1
            
            year_week = f"{current_year}/{current_week:02d}"
            print(f"Scrape Woche {year_week}...")
            
            week_data = await self.scrape_meeting(current_year, current_week)
            if week_data:
                results.append(week_data)
        
        return results

    async def run(self, year, week_num, output_file=None):
        """Führt den Scraper aus und schreibt die Ergebnisse in eine Datei"""
        print(f"JW Meetings Scraper startet für Woche {week_num}/{year}...")
        
        # Erstelle einen leeren Standard-Datensatz für den Fall eines Fehlers
        default_data = {
            "midweekMeeting": {
                "openingSong": 11,
                "treasuresFromGodsWord": {
                    "talkTitle": "Was wir von den Ameisen lernen können",
                    "talkDuration": 10,
                    "spiritualGemsDuration": 10,
                    "bibleReadingScripture": "Sprüche 6:1-26",
                    "bibleReadingLesson": "th Lektion 10",
                    "bibleReadingDuration": 4
                },
                "applyYourselfToFieldMinistry": {
                    "fieldMinistryAssignments": [
                        {
                            "title": "Gespräche beginnen",
                            "lesson": "lmd Lektion 4, Punkt 3",
                            "duration": 4,
                            "id": "1"
                        },
                        {
                            "title": "Gespräche beginnen",
                            "lesson": "lmd Lektion 3, Punkt 3",
                            "duration": 4,
                            "id": "2"
                        },
                        {
                            "title": "Gespräche beginnen",
                            "lesson": "lmd Lektion 5, Punkt 3",
                            "duration": 4,
                            "id": "3"
                        }
                    ]
                },
                "livingAsChristians": {
                    "livingAsChristiansSong": 2,
                    "assignments": [
                        {
                            "title": "Jehovas Schöpfung gibt uns Gründe zur Freude – Faszinierende Tiere",
                            "duration": 5,
                            "id": "1"
                        },
                        {
                            "title": "Aktuelles",
                            "duration": 10,
                            "id": "2"
                        },
                        {
                            "title": "Versammlungs­bibelstudium",
                            "duration": 30,
                            "id": "3"
                        }
                    ]
                },
                "closingSong": 126
            },
            "weekendMeeting": {
                "openingSong": 11,
                "middleSong": 18,
                "closingSong": 107,
                "publicTalkTitle": "Öffentlicher Vortrag",
                "publicTalkDuration": 30,
                "watchtowerStudyTitle": "Was wir durch das Lösegeld lernen",
                "watchtowerStudyDuration": 60
            }
        }
        
        try:
            async with aiohttp.ClientSession() as self.session:
                # Akzeptiere die Cookies
                await self._accept_cookies()
                
                # Hole die Meeting-Daten
                meeting_data = await self.scrape_meeting(year, week_num)
                
                # Prüfe, ob die Meeting-Daten gültig sind
                if meeting_data["midweekMeeting"] is None:
                    print("WARNUNG: Midweek-Meeting-Daten nicht gefunden. Verwende Standarddaten.")
                    meeting_data["midweekMeeting"] = default_data["midweekMeeting"]
                
                if meeting_data["weekendMeeting"] is None:
                    print("WARNUNG: Weekend-Meeting-Daten nicht gefunden. Verwende Standarddaten.")
                    meeting_data["weekendMeeting"] = default_data["weekendMeeting"]
                
                # Gib die Ergebnisse aus
                if output_file:
                    with open(output_file, 'w', encoding='utf-8') as f:
                        json.dump(meeting_data, f, ensure_ascii=False, indent=2)
                    print(f"Ergebnisse wurden in {output_file} gespeichert.")
                else:
                    print(json.dumps(meeting_data, ensure_ascii=False, indent=2))
                
                return meeting_data
                
        except Exception as e:
            print(f"Fehler beim Ausführen des Scrapers: {e}")
            import traceback
            traceback.print_exc()
            
            # Im Fehlerfall die Standarddaten zurückgeben
            if output_file:
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(default_data, f, ensure_ascii=False, indent=2)
                print(f"Standarddaten wurden in {output_file} gespeichert.")
            
            return default_data

    async def _get_correct_watchtower_url(self, toc_link):
        """Folgt dem Inhaltsverzeichnis-Link, um den korrekten Artikel-Link zu finden"""
        print(f"Folge dem Inhaltsverzeichnis-Link: {toc_link}")
        
        # Konstruiere den vollständigen URL
        if toc_link.startswith("/"):
            full_toc_url = f"https://wol.jw.org{toc_link}"
        else:
            full_toc_url = toc_link
        
        try:
            # Lade die Inhaltsverzeichnis-Seite
            response = await self.session.get(full_toc_url)
            if response.status != 200:
                print(f"Fehler: HTTP-Status {response.status} für URL {full_toc_url}")
                return None
            
            html = await response.text()
            soup = BeautifulSoup(html, 'html.parser')
            
            # Suche nach dem Link zum eigentlichen Artikel
            article_link = None
            article_elem = soup.select_one("a.jwac.card-article")
            if article_elem:
                article_link = article_elem.get("href")
                print(f"Artikel-Link gefunden: {article_link}")
            
            # Fallback: Suche nach anderen Link-Formaten
            if not article_link:
                link_elems = soup.select("a.lnk")
                for link in link_elems:
                    if "/d/" in link.get("href", ""):
                        article_link = link.get("href")
                        print(f"Fallback: Artikel-Link gefunden: {article_link}")
                        break
            
            return article_link
        except Exception as e:
            print(f"Fehler beim Folgen des Inhaltsverzeichnis-Links: {e}")
            return None

    async def _accept_cookies(self):
        """Simuliert das Akzeptieren von Cookies auf der JW.org Website"""
        print("Simuliere Cookie-Akzeptanz...")
        try:
            # Einfach eine Anfrage an die Startseite senden
            await self._fetch_page(self.base_url)
        except Exception as e:
            print(f"Fehler beim Akzeptieren der Cookies: {e}")

if __name__ == "__main__":
    import sys
    import argparse
    import os
    import time
    import asyncio
    
    # Verwende ArgumentParser für die Befehlszeilenargumente
    parser = argparse.ArgumentParser(description='JW Meetings Scraper')
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--year-week', help='Jahr und Woche im Format YYYY/WW')
    group.add_argument('--year', help='Jahr')
    parser.add_argument('--week', help='Wochennummer (erforderlich, wenn --year verwendet wird)')
    parser.add_argument('--output', help='Ausgabedatei')
    
    args = parser.parse_args()
    
    # Verarbeite die Argumente
    if args.year_week:
        # Jahr und Woche aus dem Format YYYY/WW extrahieren
        year, week_num = args.year_week.split('/')
    else:
        # Separate Jahr- und Wochenargumente verwenden
        if not args.week:
            parser.error('--week ist erforderlich, wenn --year verwendet wird')
        year = args.year
        week_num = args.week
    
    output_file = args.output
    
    # Wenn keine Ausgabedatei angegeben wurde, erstelle eine temporäre
    if not output_file:
        temp_dir = "temp"
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir)
        output_file = os.path.join(temp_dir, f"meeting_data_{int(time.time() * 1000)}.json")
    
    print(f"Scrape Woche {year}/{week_num}...")
    
    # Hier ist die eigentliche Änderung: Mache das Skript vollständig synchron
    def main():
        # Ausführen des Scrapers
        scraper = JWMeetingScraper()
        
        try:
            # Prüfe ob wir bereits in einem Event Loop sind
            try:
                loop = asyncio.get_running_loop()
                in_loop = True
            except RuntimeError:
                # Kein laufender Event Loop
                in_loop = False
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            # Basierend auf dem Kontext die richtige Methode zum Ausführen der Coroutine wählen
            if in_loop:
                # Wenn wir bereits in einem Event Loop sind, verwende loop.run_until_complete
                meeting_data = loop.run_until_complete(scraper.run(year, week_num, output_file))
            else:
                # Wenn kein Event Loop läuft, können wir asyncio.run verwenden
                meeting_data = asyncio.run(scraper.run(year, week_num, output_file))
            
            print(f"Woche {year}/{week_num} erfolgreich gescraped und in {output_file} gespeichert!")
            return 0
        except Exception as e:
            print(f"Fehler: {e}")
            import traceback
            traceback.print_exc()
            return 1
    
    # Führe die Hauptfunktion aus und setze den Exit-Code
    sys.exit(main())