# Testing des Server Dashboard

## Testumgebung

Getestet wird mein selbst entwickeltes Server Dashboard, die Applikation wurde mit Next.js entwickelt und läuft auf einem Ubuntu Server, als Laufzeitumgebung wird Node.js verwendet und die Daten werden aus einer PostgreSQL Datenbank sowie über verschiedene API Routen abgerufen.

Auf meinem Windows PC ist das Dashboard als PWA installiert, die Benutzeroberfläche wird deshalb hauptsächlich über die installierte Desktop App getestet und da diese auf der Browser Technologie von Chrome basiert, werden ausgewählte Tests zusätzlich direkt im Webbrowser durchgeführt.

Der Zugriff auf das Dashboard erfolgt über Tailscale. Die Darstellung wird auf dem Windows PC und auf meinem Handy getestet, wodurch sowohl die Ansicht auf dem Desktop als auch die mobile Ansicht überprüft werden.
Für die Funktionstests werden Testeinträge verwendet, zum Beispiel Notizen und Aufgaben, dadurch können Daten erstellt, bearbeitet und gelöscht werden, ohne wichtige Daten zu gefährden.

## Testmittel

Für die Tests des Server Dashboard werden folgende Testmittel verwendet:

- **Google Chrome:** zum Testen der Benutzeroberfläche und der Funktionen auf dem Windows PC
- **Installierte Desktop PWA:** zum Testen des Dashboards als eigenständige Anwendung unter Windows
- **Smartphone mit Safari:** zum Installieren der PWA über die Funktion Zum Home Bildschirm sowie zum Testen der mobilen Darstellung und Bedienung
- **Kommandozeile des Ubuntu Servers:** zum Überprüfen der Serverausgaben und Fehlermeldungen
- **Vorbereitete Testdaten:** zum Erstellen, Bearbeiten und Löschen von Einträgen, ohne wichtige Daten zu gefährden

Diese Testmittel werden für Tests der Funktionen, der Benutzeroberfläche, der Verbindungen zwischen den Komponenten und der responsiven Darstellung eingesetzt.


## Testfälle

Die Voraussetzungen, Testdaten und Testschritte werden so dokumentiert, dass jeder Test später unter denselben Bedingungen wiederholt und die Ergebnisse verglichen werden können.

---

### TC-01: Status eines Dienstes im Admin Bereich korrekt anzeigen

**Anforderung:**

Der Admin Bereich muss anzeigen, ob ein vom Server geprüftes Tool beziehungsweise ein Dienst auf dem Server erreichbar ist oder nicht.

**Vorbereitung:**

- Das Dashboard und der Admin Bereich sind erreichbar
- Ein nicht kritisches Tool aus dem Bereich Service Health wird für den Test ausgewählt
- Das ausgewählte Tool ist auf dem Ubuntu Server installiert und kann über die Kommandozeile gestartet und gestoppt werden
- Das Stoppen des ausgewählten Tools beeinträchtigt keine wichtigen Serverfunktionen

**Testschritte:**

1. Das Dashboard öffnen und zur Seite Admin navigieren
2. Das ausgewählte Tool auf dem Ubuntu Server starten
3. Den Admin Bereich aktualisieren und den angezeigten Status unter Service Health kontrollieren
4. Das ausgewählte Tool auf dem Ubuntu Server stoppen
5. Den Admin Bereich erneut aktualisieren
6. Den angezeigten Status unter Service Health erneut kontrollieren

**Erwartetes Resultat:**

Wenn das ausgewählte Tool läuft und auf die Serveranfrage antwortet, wird es im Admin Bereich als online angezeigt, nachdem das Tool gestoppt und der Admin Bereich aktualisiert wurde, wird es als offline angezeigt.

---

### TC-02: Aufgabenbenachrichtigung auf dem Smartphone erhalten

**Anforderung:**

Die auf dem Smartphone installierte PWA muss zum festgelegten Erinnerungszeitpunkt eine Push Benachrichtigung für eine Aufgabe anzeigen, Benachrichtigungen auf dem Computer sind nicht Bestandteil dieses Tests.

**Vorbereitung:**

- Das Dashboard und die PostgreSQL Datenbank sind erreichbar
- Der Worker für die Aufgabenerinnerungen läuft auf dem Ubuntu Server
- Die VAPID Schlüssel sind auf dem Server konfiguriert
- Die PWA wurde auf dem Smartphone über Zum Home Bildschirm installiert
- Benachrichtigungen sind für die PWA erlaubt und das Smartphone ist registriert
- Das Smartphone besitzt eine Internetverbindung

**Testschritte:**

1. Eine Aufgabe mit einem eindeutigen Testtitel erstellen, entweder am Desktop oder auf dem Smartphone
2. Eine Fälligkeit festlegen und den Erinnerungszeitpunkt auf wenige Minuten in der Zukunft setzen
3. Die Aufgabe speichern
4. Die PWA auf dem Smartphone in den Hintergrund verschieben oder schliessen
5. Bis zum Erinnerungszeitpunkt und wegen des einminütigen Prüfintervalls höchstens eine weitere Minute warten
6. Kontrollieren, ob auf dem Smartphone eine Benachrichtigung erscheint
7. Kontrollieren, ob der Titel der Benachrichtigung zur erstellten Aufgabe gehört

**Erwartetes Resultat:**

Die Benachrichtigung erscheint spätestens ungefähr eine Minute nach dem festgelegten Erinnerungszeitpunkt auf dem Smartphone und enthält den Titel der zuvor erstellten Aufgabe.

---

### TC-03: Statistiken des Servers werden korrekt angezeigt

**Anforderung:**

Das Dashboard muss die aktuellen Statistiken des Servers wie normalisierte CPU Auslastung, Arbeitsspeicher, Speicherplatz und Uptime korrekt anzeigen.

**Vorbereitung:**

- Der PC ist über Tailscale mit dem Server verbunden
- Der Ubuntu Server und das Dashboard sind erreichbar
- Die Kommandozeile des Ubuntu Servers ist geöffnet

**Testschritte:**

1. Das Dashboard öffnen
2. Die angezeigten Werte für die normalisierte CPU Auslastung, den Arbeitsspeicher, den Speicherplatz und die Uptime notieren
3. Den Lastdurchschnitt der letzten Minute, die Anzahl der Prozessorkerne, den Arbeitsspeicher, den Speicherplatz des Root Dateisystems und die Uptime über die Kommandozeile abrufen
4. Für den Vergleich der CPU Werte den Lastdurchschnitt der letzten Minute durch die Anzahl der Prozessorkerne teilen und in Prozent umrechnen
5. Die Werte aus dem Dashboard mit den Werten aus der Kommandozeile vergleichen
6. Das Dashboard aktualisieren und kontrollieren, ob die Statistiken weiterhin angezeigt werden

**Erwartetes Resultat:**

Die Statistiken werden vollständig und ohne Fehlermeldung angezeigt, die Uptime und der Speicherplatz des Root Dateisystems stimmen unter Berücksichtigung von Rundungen ungefähr mit den Serverwerten überein und bei den dynamischen Werten der CPU und des Arbeitsspeichers sind geringe Abweichungen zulässig, da die Messwerte nicht exakt zum gleichen Zeitpunkt erfasst werden.

---

### TC-04: Ungültige Aufgabe wird nicht gespeichert

**Anforderung:**

Das Formular auf der Seite Tasks darf keine Aufgabe ohne gültigen Titel absenden, da der Titel ein Pflichtfeld ist.

**Vorbereitung:**

- Das Dashboard ist erreichbar
- Die Seite Tasks ist geöffnet
- Das Formular zum Erstellen einer Aufgabe ist leer

**Testschritte:**

1. Im Feld für den Titel nur Leerzeichen eingeben
2. Optional eine Beschreibung, Kategorie oder Priorität eingeben
3. Kontrollieren, ob die Schaltfläche zum Erstellen der Aufgabe deaktiviert ist
4. Versuchen, das Formular mit der Eingabetaste abzusenden
5. Kontrollieren, ob in der Aufgabenliste ein neuer Eintrag erstellt wurde

**Erwartetes Resultat:**

Die Schaltfläche zum Erstellen der Aufgabe bleibt deaktiviert, das Formular kann nicht abgesendet werden und in der Aufgabenliste wird kein neuer Eintrag erstellt.

---

### TC-05: Daten des Whiteboards speichern und laden

**Anforderung:**

Das Dashboard muss eine auf dem Whiteboard erstellte Zeichnung automatisch speichern und beim erneuten Öffnen wieder anzeigen.

**Vorbereitung:**

- Das Dashboard ist erreichbar
- Die Seite Notes mit dem Whiteboard ist geöffnet
- Für den Test werden einfache Formen und Text ohne eingefügte Bilddateien verwendet

**Testschritte:**

1. Das Whiteboard auf der Seite Notes öffnen
2. Warten, bis das Whiteboard vollständig geladen ist
3. Eine erkennbare Testzeichnung aus mindestens einer Form und einem Textelement erstellen
4. Nach der letzten Änderung mindestens zwei Sekunden warten, damit die Zeichnung gespeichert werden kann
5. Die Seite aktualisieren oder die PWA schliessen und erneut öffnen
6. Das Whiteboard wieder öffnen und die geladene Zeichnung mit der zuvor erstellten Testzeichnung vergleichen

**Erwartetes Resultat:**

Die Testzeichnung wird gespeichert und nach dem Aktualisieren oder erneuten Öffnen mit allen erstellten Formen und Textelementen an den gespeicherten Positionen wieder angezeigt.

---

### TC-06: Darstellung und Navigation der mobilen PWA prüfen

**Anforderung:**

Das Server Dashboard muss als installierte PWA auf dem Smartphone übersichtlich dargestellt und vollständig über die mobile Navigation bedienbar sein.

**Vorbereitung:**

- Die PWA ist auf dem Smartphone installiert
- Das Smartphone besitzt eine Internetverbindung und ist über Tailscale mit dem Server verbunden
- Das Dashboard und seine Seiten sind erreichbar

**Testschritte:**

1. Die installierte PWA auf dem Smartphone öffnen
2. Die Startseite auf abgeschnittene, überlappende oder zu kleine Elemente kontrollieren
3. Das mobile Navigationsmenü öffnen
4. Nacheinander die Seiten Dashboard, Files, Databases, Tasks, Notes, Tools und Admin öffnen
5. Auf jeder Seite kontrollieren, ob der richtige Inhalt angezeigt wird
6. Prüfen, ob Schaltflächen, Formulare und andere Bedienelemente erreichbar und bedienbar sind
7. Kontrollieren, ob das Navigationsmenü nach der Auswahl einer Seite geschlossen wird und erneut geöffnet werden kann

**Erwartetes Resultat:**

Die PWA startet im Standalone Modus auf dem Smartphone und alle aufgeführten Seiten können über das mobile Navigationsmenü geöffnet werden, der jeweils ausgewählte Inhalt wird korrekt dargestellt, Texte, Schaltflächen und Formulare überlappen sich nicht, werden nicht abgeschnitten und können bedient werden und das Navigationsmenü lässt sich zuverlässig öffnen und schliessen.


## Aufbau der Testumgebung

Für die Durchführung der definierten Testfälle wurde die benötigte Testumgebung vorbereitet:

- Das Server Dashboard läuft auf dem Ubuntu Server und ist über Tailscale erreichbar
- Die benötigten PostgreSQL Datenbanken und API Routen sind erreichbar
- Der Admin Bereich kann den Status der ausgewählten Dienste des Servers überprüfen
- Der Worker für die Aufgabenerinnerungen läuft und die Push Benachrichtigungen sind auf dem Smartphone eingerichtet
- Die PWA ist auf dem Windows PC und dem Smartphone installiert
- Google Chrome und der Zugriff auf die Kommandozeile des Servers stehen zur Verfügung
- Die Tabelle `whiteboard_state` mit dem benötigten Datensatz ist vorhanden
- Testdaten für Aufgaben und das Whiteboard wurden vorbereitet
- Für den Test des erreichbaren und nicht erreichbaren Zustands wurde ein nicht kritischer Dienst auf dem Server ausgewählt
