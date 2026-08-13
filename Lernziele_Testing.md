# Testing des Server-Dashboard

## Testumgebung

Getestet wird mein selbst entwickeltes Server-Dashboard, die Applikation wurde mit Next.js entwickelt und läuft auf einem Ubuntu-Server, als Laufzeitumgebung wird Node.js verwendet und die Daten werden aus einer PostgreSQL-Datenbank sowie über verschiedene API-Routen abgerufen.

Auf meinem Windows-PC ist das Dashboard als Web-App installiert, die Benutzeroberfläche wird deshalb hauptsächlich über die installierte Desktop-App getestet und da diese auf der Browser-Technologie von Chrome basiert, werden ausgewählte Tests zusätzlich direkt im Webbrowser durchgeführt.

Der Zugriff auf das Dashboard erfolgt über Tailscale, was über das Internet verläuft, die Darstellung wird auf dem Windows-PC und auf meinem Handy getestet, wodurch sowohl die Desktop- als auch die mobile Ansicht überprüft werden.
Für die Funktionstests werden Testeinträge verwendet, zum Beispiel Notizen und Aufgaben, dadurch können Daten erstellt, bearbeitet und gelöscht werden, ohne wichtige Daten zu gefährden.

## Testmittel

Für die Tests des Server-Dashboards werden folgende Testmittel verwendet:

- **Google Chrome:** zum Testen der Benutzeroberfläche und der Funktionen auf dem Windows-PC
- **Chrome-Entwicklerwerkzeuge:** zum Überprüfen der API-Anfragen, Fehlermeldungen und verschiedenen Bildschirmgrössen
- **Installierte Desktop-PWA:** zum Testen des Dashboards als eigenständige Anwendung unter Windows
- **Smartphone mit Safari:** zum Installieren der PWA über die Funktion „Zum Home-Bildschirm“ sowie zum Testen der mobilen Darstellung und Bedienung
- **Kommandozeile des Ubuntu-Servers:** zum Überprüfen der Serverausgaben und Fehlermeldungen
- **Vorbereitete Testdaten:** zum Erstellen, Bearbeiten und Löschen von Einträgen, ohne wichtige Daten zu gefährden

Diese Testmittel werden für Funktions-, Benutzeroberflächen-, API- und Responsive-Tests eingesetzt


## Testfälle

Die Voraussetzungen, Testdaten und Testschritte werden so dokumentiert, dass jeder Test später unter denselben Bedingungen wiederholt und die Ergebnisse verglichen werden können

Für jeden Testfall kopiere ich die folgende Vorlage und ersetze die Texte in den eckigen Klammern, die Testfälle werden fortlaufend als `TC-01`, `TC-02`, `TC-03` und so weiter nummeriert

---

### TC-01: Online- und Offline-Status eines Server-Tools korrekt anzeigen

**Anforderung:**

Das Dashboard muss anzeigen, ob ein Tool auf dem Server erreichbar ist oder nicht

**Vorbereitung:**

- Das Dashboard des Servers ist erreichbar
- Das ausgewählte Tool ist auf dem Server installiert
- Für den ersten Teil des Tests läuft das Tool
- Für den zweiten Teil des Tests wird das Tool gestoppt

**Testschritte:**

1. Das Dashboard öffnen
2. Das Tool starten
3. Den angezeigten Status des Tools kontrollieren
4. Das Tool stoppen
5. Das Dashboard aktualisieren
6. Den angezeigten Status des Tools erneut kontrollieren

**Erwartetes Resultat:**

Wenn das Tool läuft, wird es im Dashboard als online angezeigt und nachdem das Tool gestoppt und das Dashboard aktualisiert wurde, wird es als offline angezeigt

---

### TC-02: Benachrichtigung auf dem Smartphone erhalten für das Tool Tasks

**Anforderung:**

Die auf dem Smartphone installierte PWA muss zum festgelegten Erinnerungszeitpunkt eine Benachrichtigung für eine Aufgabe anzeigen, Benachrichtigungen auf dem Computer sind nicht Bestandteil dieses Tests

**Vorbereitung:**

- Das Dashboard und der Benachrichtigungsdienst ist erreichbar 
- Die PWA ist installiert
- Benachrichtigungen sind für die PWA aktiviert
- Das Smartphone besitzt eine Internetverbindung

**Testschritte:**

1. Eine Aufgabe erstellen, entweder am Desktop oder auf dem Smartphone
2. Den Erinnerungszeitpunkt auf wenige Minuten in der Zukunft setzen
3. Die Aufgabe speichern
4. Bis zum festgelegten Erinnerungszeitpunkt warten
5. Kontrollieren ob auf dem Smartphone die Benachrichtigun erscheint
6. Kontrollieren ob die Benachrichtigung zur erstellten Aufgabe gehört

**Erwartetes Resultat:**

Die Benachrichtigung erscheint zum festgelegten Erinnerungszeitpunkt auf dem Smartphone und gehört zur zuvor erstellten Aufgabe

---

### TC-03: Server Statistiken werden korrekt angezeigt

**Anforderung:**

Das Dashboard muss die aktuellen Server Statistiken wie CPU Auslastung, Arbeitsspeicher, Speicherplatz und Uptime korrekt anzeigen 

**Vorbereitung:**

- Der PC ist mit dem Internet verbunden
- Der Ubuntu-Server und das Dashboard sind erreichbar
- Die Kommandozeile des Ubuntu-Servers ist geöffnet

**Testschritte:**

1. Das Dashboard öffnen
2. Die angezeigten Werte für CPU-Auslastung, Arbeitsspeicher, Speicherplatz und Uptime notieren
3. Die aktuellen Werte direkt über die Kommandozeile des Ubuntu-Servers abrufen
4. Die Werte aus dem Dashboard mit den Werten aus der Kommandozeile vergleichen
5. Das Dashboard aktualisieren und kontrollieren, ob die Statistiken weiterhin angezeigt werden

**Erwartetes Resultat:**

Die CPU-Auslastung, der verwendete Arbeitsspeicher, der verwendete Speicherplatz und die Uptime werden im Dashboard vollständig angezeigt, die angezeigten Werte stimmen ungefähr mit den direkt auf dem Ubuntu-Server abgerufenen Werten überein, kleine Abweichungen sind möglich, da die Werte nicht exakt zum gleichen Zeitpunkt erfasst werden und nach dem Aktualisieren des Dashboards werden weiterhin aktuelle Statistiken ohne Fehlermeldung angezeigt

---

### TC-04: Ungültige Aufgabe wird nicht gespeichert

**Anforderung:**

Das Dashboard darf keine Aufgabe ohne Titel speichern, da der Titel ein Pflichtfeld ist

**Vorbereitung:**

- Das Dashboard ist erreichbar
- Die Seite Tasks ist geöffnet
- Das Formular zum Erstellen einer Aufgabe ist leer

**Testschritte:**

1. Das Feld für den Titel leer lassen
2. Optional eine Beschreibung, Kategorie oder Priorität eingeben
3. Kontrollieren, ob die Schaltfläche zum Erstellen der Aufgabe aktiviert ist
4. Versuchen, das Formular ohne Titel abzusenden
5. Kontrollieren, ob in der Aufgabenliste ein neuer Eintrag erstellt wurde

**Erwartetes Resultat:**

Die Schaltfläche zum Erstellen der Aufgabe bleibt deaktiviert, solange kein Titel eingegeben wurde und das Formular kann ohne Titel nicht abgesendet werden und in der Aufgabenliste wird kein neuer Eintrag erstellt

---

### TC-05: Whiteboard-Daten über die API speichern und laden

**Anforderung:**

Das Dashboard muss die auf dem Whiteboard erstellten Zeichnungen automatisch über die API speichern und beim erneuten Öffnen vollständig laden

**Vorbereitung:**

- Das Dashboard und die Whiteboard-API sind erreichbar
- Die PostgreSQL Datenbank ist erreichbar
- Die Seite Notes mit dem Whiteboard ist geöffnet
- Für den Test wird eine leicht erkennbare Testzeichnung verwendet

**Testschritte:**

1. Das Whiteboard auf der Seite Notes öffnen
2. Eine erkennbare Testzeichnung mit mehreren Elementen erstellen
3. Nach der letzten Änderung mindestens zwei Sekunden warten, damit die Zeichnung gespeichert werden kann
4. Die Seite aktualisieren oder die PWA schliessen und erneut öffnen
5. Das Whiteboard wieder öffnen
6. Die geladene Zeichnung mit der zuvor erstellten Testzeichnung vergleichen

**Erwartetes Resultat:**

Die Testzeichnung wird nach der Änderung automatisch über die API in der Datenbank gespeichert und nach dem Aktualisieren oder erneuten Öffnen wird dieselbe Zeichnung wieder angezeigt, wobei die gezeichneten Elemente vollständig vorhanden sind und sich weiterhin an der gespeicherten Position befinden

---

### TC-06: Darstellung und Navigation der mobilen PWA prüfen

**Anforderung:**

Das Server-Dashboard muss auf dem Smartphone übersichtlich dargestellt und vollständig über die mobile Navigation bedienbar sein

**Vorbereitung:**

- Die PWA ist auf dem Smartphone installiert
- Das Smartphone besitzt eine Internetverbindung
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

Die PWA startet auf dem Smartphone und alle aufgeführten Seiten können über das mobile Navigationsmenü geöffnet werden, der jeweils ausgewählte Inhalt wird korrekt dargestellt, Texte, Schaltflächen und Formulare überlappen sich nicht, werden nicht abgeschnitten und können bedient werden und das Navigationsmenü lässt sich zuverlässig öffnen und schliessen

---
