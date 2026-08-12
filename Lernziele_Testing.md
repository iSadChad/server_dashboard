# Testing des Server-Dashboard

## Testumgebung

Getestet wird mein selbst entwickeltes Server-Dashboard. Die Applikation wurde mit Next.js entwickelt und läuft auf einem Ubuntu-Server. Als Laufzeitumgebung wird Node.js verwendet. Die Daten werden aus einer PostgreSQL-Datenbank sowie über verschiedene API-Routen abgerufen.

Auf meinem Windows-PC ist das Dashboard als Web-App installiert. Die Benutzeroberfläche wird deshalb hauptsächlich über die installierte Desktop-App getestet. Da diese auf der Browser-Technologie von Chrome basiert, werden ausgewählte Tests zusätzlich direkt im Webbrowser durchgeführt.

Der Zugriff auf das Dashboard erfolgt über Tailscale, was über das Internet verläuft. Die Darstellung wird auf dem Windows-PC und auf meinem Handy getestet. Dadurch werden sowohl die Desktop- als auch die mobile Ansicht überprüft.
Für die Funktionstests werden Testeinträge verwendet, zum Beispiel Notizen und Aufgaben. Dadurch können Daten erstellt, bearbeitet und gelöscht werden, ohne wichtige Daten zu gefährden.

## Testmittel

Für die Tests des Server-Dashboards werden folgende Testmittel verwendet:

- **Google Chrome:** zum Testen der Benutzeroberfläche und der Funktionen auf dem Windows-PC.
- **Chrome-Entwicklerwerkzeuge:** zum Überprüfen der API-Anfragen, Fehlermeldungen und verschiedenen Bildschirmgrössen.
- **Installierte Desktop-PWA:** zum Testen des Dashboards als eigenständige Anwendung unter Windows.
- **Smartphone mit Safari:** zum Installieren der PWA über die Funktion „Zum Home-Bildschirm“ sowie zum Testen der mobilen Darstellung und Bedienung.
- **Kommandozeile des Ubuntu-Servers:** zum Überprüfen der Serverausgaben und Fehlermeldungen.
- **Vorbereitete Testdaten:** zum Erstellen, Bearbeiten und Löschen von Einträgen, ohne wichtige Daten zu gefährden.

Diese Testmittel werden für Funktions-, Benutzeroberflächen-, API- und Responsive-Tests eingesetzt.


## Testfälle

Die Voraussetzungen, Testdaten und Testschritte werden so dokumentiert, dass jeder Test später unter denselben Bedingungen wiederholt und die Ergebnisse verglichen werden können.

Für jeden Testfall kopiere ich die folgende Vorlage und ersetze die Texte in den eckigen Klammern. Die Testfälle werden fortlaufend als `TC-01`, `TC-02`, `TC-03` usw. nummeriert.

---

### TC-01: Online- und Offline-Status eines Server-Tools korrekt anzeigen

**Anforderung:**

Das Dashboard muss anzeigen, ob ein Tool auf dem Server erreichbar ist oder nicht.

**Vorbereitung:**

- Das Dashboard des Servers ist erreichbar.
- Das ausgewählte Tool ist auf dem Server installiert.
- Für den ersten Teil des Tests läuft das Tool.
- Für den zweiten Teil des Tests wird das Tool gestoppt.

**Testschritte:**

1. Das Dashboard öffnen.
2. Das Tool starten.
3. Den angezeigten Status des Tools kontrollieren.
4. Das Tool stoppen.
5. Das Dashboard aktualisieren.
6. Den angezeigten Status des Tools erneut kontrollieren.

**Erwartetes Resultat:**

Wenn das Tool läuft, wird es im Dashboard als online angezeigt. Nachdem das Tool gestoppt und das Dashboard aktualisiert wurde, wird es als offline angezeigt.

---

### TC-02: Benachrichtigung auf dem Smartphone erhalten für das Tool Tasks

**Anforderung:**

Die auf dem Smartphone installierte PWA muss zum festgelegten Erinnerungszeitpunkt eine Benachrichtigung für eine Aufgabe anzeigen. Benachrichtigungen auf dem Computer sind nicht Bestandteil dieses Tests.

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

Die CPU-Auslastung, der verwendete Arbeitsspeicher, der verwendete Speicherplatz und die Uptime werden im Dashboard vollständig angezeigt. Die angezeigten Werte stimmen ungefähr mit den direkt auf dem Ubuntu-Server abgerufenen Werten überein. Kleine Abweichungen sind möglich, da die Werte nicht exakt zum gleichen Zeitpunkt erfasst werden. Nach dem Aktualisieren des Dashboards werden weiterhin aktuelle Statistiken ohne Fehlermeldung angezeigt.

---

### TC-04: Verfügbare Updates werden korrekt erkannt und angezeigt

**Anforderung:**


**Vorbereitung:**



**Testschritte:**



**Erwartetes Resultat:**

---

### TC-05: Whiteboard-Daten über die API speichern und laden

**Anforderung:**


**Vorbereitung:**



**Testschritte:**



**Erwartetes Resultat:**

---

### TC-06: Darstellung und Navigation der mobilen PWA prüfen

**Anforderung:**


**Vorbereitung:**



**Testschritte:**



**Erwartetes Resultat:**

---
