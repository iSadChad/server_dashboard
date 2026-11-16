# Testing des Server-Dashboards

## Testumgebung

Getestet wird das selbst entwickelte Server-Dashboard. Die Applikation wurde mit Next.js entwickelt und läuft auf einem Ubuntu-Server. Als Laufzeitumgebung wird Node.js verwendet. Die Daten werden aus PostgreSQL-Datenbanken sowie über verschiedene API-Routen abgerufen.

Auf dem Windows-PC wird das Dashboard mit Google Chrome geöffnet und getestet.

Der Zugriff auf das Dashboard erfolgt über Tailscale. Die Darstellung wird auf dem Windows-PC und auf dem Smartphone geprüft, damit sowohl die Desktop- als auch die mobile Ansicht getestet werden.
Für die Funktionstests werden Testeinträge wie Notizen und Aufgaben verwendet. Dadurch können Daten erstellt, bearbeitet und gelöscht werden, ohne wichtige Daten zu gefährden.

## Testmittel

Für die Tests des Server-Dashboards werden folgende Testmittel verwendet:

- **Google Chrome:** zum Testen der Benutzeroberfläche und der Funktionen auf dem Windows-PC
- **Smartphone mit Safari:** zum Installieren der PWA über die Funktion „Zum Home-Bildschirm“ sowie zum Testen der mobilen Darstellung und Bedienung
- **Kommandozeile des Ubuntu-Servers:** zum Überprüfen der Serverausgaben und Fehlermeldungen
- **Node.js Test-Runner:** zum automatischen Prüfen der Antwort der Statistik-API
- **Vorbereitete Testdaten:** zum Erstellen, Bearbeiten und Löschen von Einträgen, ohne wichtige Daten zu gefährden

<br>

Diese Testmittel werden für manuelle und automatische Tests der Funktionen, der Benutzeroberfläche, der Verbindungen zwischen den Komponenten und der responsiven Darstellung eingesetzt.


## Testfälle

Voraussetzungen, Testdaten und Testschritte sind so dokumentiert, dass jeder Test später unter denselben Bedingungen wiederholt und die Ergebnisse verglichen werden können.

---

### TC-01: Status eines Dienstes im Admin-Bereich korrekt anzeigen

**Anforderung:**

Der Admin-Bereich muss anzeigen, ob ein vom Server geprüfter Dienst erreichbar ist.

**Vorbereitung:**

- Das Dashboard und der Admin-Bereich sind erreichbar
- Ein nicht kritischer Dienst aus dem Bereich „Service Health“ wird für den Test ausgewählt
- Der ausgewählte Dienst kann auf dem Ubuntu-Server über seine Verwaltungsoberfläche oder die Kommandozeile gestartet und gestoppt werden
- Das Stoppen des ausgewählten Dienstes beeinträchtigt keine wichtigen Serverfunktionen

**Testschritte:**

1. Das Dashboard öffnen und zur Seite Admin navigieren
2. Den ausgewählten Dienst auf dem Ubuntu-Server starten
3. Den Admin-Bereich aktualisieren und den angezeigten Status unter „Service Health“ kontrollieren
4. Den ausgewählten Dienst auf dem Ubuntu-Server stoppen
5. Den Admin-Bereich erneut aktualisieren
6. Den angezeigten Status unter „Service Health“ erneut kontrollieren

<br>

**Erwartetes Resultat:**

Wenn der ausgewählte Dienst läuft und auf die Serveranfrage antwortet, wird er im Admin-Bereich als online angezeigt. Nach dem Stoppen des Dienstes und dem Aktualisieren des Admin-Bereichs wird er als offline angezeigt.

---

### TC-02: Aufgabenbenachrichtigung auf dem Smartphone erhalten

**Anforderung:**

Die auf dem Smartphone installierte PWA muss zum festgelegten Erinnerungszeitpunkt eine Push-Benachrichtigung für eine Aufgabe anzeigen. Benachrichtigungen auf dem Computer sind nicht Bestandteil dieses Tests.

**Vorbereitung:**

- Das Dashboard und die PostgreSQL-Datenbank sind erreichbar
- Der Worker für die Aufgabenerinnerungen läuft auf dem Ubuntu-Server
- Die VAPID Schlüssel sind auf dem Server konfiguriert
- Die PWA wurde auf dem Smartphone über „Zum Home-Bildschirm“ installiert
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

<br>

**Erwartetes Resultat:**

Die Benachrichtigung erscheint spätestens ungefähr eine Minute nach dem festgelegten Erinnerungszeitpunkt auf dem Smartphone und enthält den Titel der zuvor erstellten Aufgabe.

---

### TC-03A: Antwort der Statistik-API automatisch prüfen

**Anforderung:**

Die Statistik-API muss die Werte für CPU, Arbeitsspeicher, Speicherplatz und Uptime vollständig und in einem gültigen Zahlenformat zurückgeben.

**Vorbereitung:**

- Das Dashboard läuft auf dem Ubuntu-Server
- Node.js ist auf dem Ubuntu-Server installiert
- Die Testdatei `tests/stats-api.test.mjs` ist vorhanden

**Testschritte:**

1. Die Kommandozeile im Projektordner öffnen
2. Den Befehl `npm run test:stats` ausführen
3. Der automatische Test ruft die Route `/api/stats` auf
4. Der Test prüft den HTTP-Statuscode und die zurückgegebenen Werte

<br>

**Erwartetes Resultat:**

Die Route gibt den HTTP-Statuscode `200` und eine JSON-Antwort zurück. Der CPU-Wert liegt zwischen 0 und 100, die Werte für Arbeitsspeicher und Speicherplatz sind gültig und die Uptime ist grösser als 0.

---

### TC-03B: Statistiken des Servers manuell vergleichen

**Anforderung:**

Das Dashboard muss die aktuellen Statistiken des Servers wie normalisierte CPU-Auslastung, Arbeitsspeicher, Speicherplatz und Uptime korrekt anzeigen.

**Vorbereitung:**

- Der PC ist über Tailscale mit dem Server verbunden
- Der Ubuntu-Server und das Dashboard sind erreichbar
- Die Kommandozeile des Ubuntu-Servers ist geöffnet

**Testschritte:**

1. Das Dashboard öffnen
2. Die angezeigten Werte für die normalisierte CPU-Auslastung, den Arbeitsspeicher, den Speicherplatz und die Uptime notieren
3. Den Lastdurchschnitt der letzten Minute, die Anzahl der Prozessorkerne, den Arbeitsspeicher, den Speicherplatz des Root Dateisystems und die Uptime über die Kommandozeile abrufen
4. Für den Vergleich der CPU-Werte den Lastdurchschnitt der letzten Minute durch die Anzahl der Prozessorkerne teilen und in Prozent umrechnen
5. Die Werte aus dem Dashboard mit den Werten aus der Kommandozeile vergleichen
6. Das Dashboard aktualisieren und kontrollieren, ob die Statistiken weiterhin angezeigt werden

<br>

**Erwartetes Resultat:**

Die Statistiken werden vollständig und ohne Fehlermeldung angezeigt. Uptime und Speicherplatz des Root-Dateisystems stimmen unter Berücksichtigung von Rundungen ungefähr mit den Serverwerten überein. Bei den dynamischen Werten für CPU und Arbeitsspeicher sind geringe Abweichungen zulässig, da die Messwerte nicht exakt zum gleichen Zeitpunkt erfasst werden.

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

<br>

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

<br>


**Erwartetes Resultat:**

Die Testzeichnung wird gespeichert und nach dem Aktualisieren oder erneuten Öffnen mit allen erstellten Formen und Textelementen an den gespeicherten Positionen wieder angezeigt.

---

### TC-06: Darstellung und Navigation der mobilen PWA prüfen

**Anforderung:**

Das Server-Dashboard muss als installierte PWA auf dem Smartphone übersichtlich dargestellt und vollständig über die mobile Navigation bedienbar sein.

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

<br>

**Erwartetes Resultat:**

Die PWA startet im Standalone-Modus auf dem Smartphone. Alle aufgeführten Seiten können über das mobile Navigationsmenü geöffnet werden und zeigen den richtigen Inhalt. Texte, Schaltflächen und Formulare überlappen sich nicht, werden nicht abgeschnitten und sind bedienbar. Das Navigationsmenü lässt sich zuverlässig öffnen und schliessen.


## Aufbau der Testumgebung

Für die Durchführung der definierten Testfälle wurde die benötigte Testumgebung vorbereitet:

- Das Server-Dashboard läuft auf dem Ubuntu-Server und ist über Tailscale erreichbar
- Die benötigten PostgreSQL-Datenbanken und API-Routen sind erreichbar
- Der Admin-Bereich kann den Status der ausgewählten Dienste des Servers überprüfen
- Der Worker für die Aufgabenerinnerungen läuft und Push-Benachrichtigungen sind auf dem Smartphone eingerichtet
- Die PWA ist auf dem Smartphone installiert
- Google Chrome und der Zugriff auf die Kommandozeile des Servers stehen zur Verfügung
- Die Tabelle `whiteboard_state` mit dem benötigten Datensatz ist vorhanden
- Testdaten für Aufgaben und das Whiteboard wurden vorbereitet
- Für den Test des erreichbaren und nicht erreichbaren Zustands wurde ein nicht kritischer Dienst auf dem Server ausgewählt

<br>

**Checkliste der Testumgebung:**

| Nr. | Überprüfung | Ergebnis |
| --- | --- | --- |
| 1 | Dashboard über Tailscale geöffnet | Erreichbar |
| 2 | PostgreSQL-Datenbanken und benötigte Tabellen vorhanden | Vorhanden |
| 3 | API-Routen erreichbar | Erreichbar |
| 4 | Admin-Bereich prüft den Status ausgewählter Dienste | Verfügbar |
| 5 | Dashboard und Erinnerungs-Worker auf dem Ubuntu-Server gestartet | Aktiv |
| 6 | PWA auf dem Smartphone installiert und Benachrichtigungen erlaubt | Installiert und aktiviert |
| 7 | Google Chrome und Zugriff auf die Server-Kommandozeile verfügbar | Verfügbar |
| 8 | Tabelle `whiteboard_state` und benötigter Datensatz vorhanden | Vorhanden |
| 9 | Testdaten für Aufgaben und Whiteboard vorbereitet | Vorbereitet |
| 10 | Nicht kritischer Dienst für TC-01 ausgewählt | Stirling PDF |


## Implementierung der automatisierbaren Testfälle

Der automatisch prüfbare Teil von TC-03 wurde als TC-03A umgesetzt. Dafür wird der in Node.js enthaltene Test-Runner verwendet; zusätzliche Pakete sind nicht erforderlich.

Die automatische Prüfung befindet sich in der Datei `tests/stats-api.test.mjs` und kann im Projektordner mit folgendem Befehl gestartet werden:

`npm run test:stats`

Der automatische Test kontrolliert:

- Ob die Route `/api/stats` erreichbar ist
- Ob der HTTP-Statuscode `200` zurückgegeben wird
- Ob die Antwort im JSON-Format vorliegt
- Ob CPU, Arbeitsspeicher, Speicherplatz und Uptime vorhanden sind
- Ob die Werte Zahlen sind und in gültigen Bereichen liegen

Die Testfälle werden im folgenden Abschnitt durchgeführt und die Resultate anschliessend separat ausgewertet und protokolliert.


## Testfälle durchführen

Nach jedem Testfall wird das beobachtete Resultat festgehalten. Die Bewertung und Auswertung erfolgt im folgenden Abschnitt.

### TC-01: Status eines Dienstes im Admin-Bereich korrekt anzeigen

**Datum/Uhrzeit der Durchführung:** 19.10.2026, 07:55 Uhr

**Tatsächliches Resultat:** Stirling PDF wurde im Bereich „Service Health“ zunächst als online angezeigt. Nach Ausführung von `docker compose stop` im Ordner `~/docker/stirling-pdf` und Aktualisierung des Admin-Bereichs wurde der Dienst als offline angezeigt.

**Beobachtungen/Nachweis:** Der Container `stirling-pdf` wurde laut Terminalausgabe gestoppt. Der Status im Admin-Bereich wurde anschliessend aktualisiert. Nach dem Test wurde Stirling PDF wieder gestartet.

---

### TC-02: Aufgabenbenachrichtigung auf dem Smartphone erhalten

**Datum/Uhrzeit der Durchführung:** 19.10.2026, 08:11 Uhr

**Tatsächliches Resultat:** Für die Aufgabe „Testing“ war eine Erinnerung auf 08:10 Uhr und eine Fälligkeit auf 08:11 Uhr eingestellt. Auf dem Smartphone erschien eine Benachrichtigung mit dem Titel „Task Reminder“ und dem Aufgabentitel „Testing“.

**Beobachtungen/Nachweis:** Die Benachrichtigung zeigte „Testing · Due 19 Oct 2026, 08:11“.

---

### TC-03A: Antwort der Statistik-API automatisch prüfen

**Datum/Uhrzeit der Durchführung:** 15.10.2026, 16:15 Uhr

**Tatsächliches Resultat:** `npm run test:stats` wurde auf dem Ubuntu-Server ausgeführt. Der Node.js Test-Runner meldete einen bestandenen und keinen fehlgeschlagenen Test (`pass 1`, `fail 0`). Die Statistik-API lieferte eine gültige Antwort gemäss den definierten Prüfungen.

**Beobachtungen/Nachweis:** Terminalausgabe des Node.js Test-Runners: `pass 1`, `fail 0`.

---

### TC-03B: Statistiken des Servers manuell vergleichen

**Datum/Uhrzeit der Durchführung:** 19.10.2026, 08:20 Uhr

**Tatsächliches Resultat:** Das Dashboard zeigte CPU 1,3 %, Arbeitsspeicher 3,1 GB / 14,8 GB (21,1 %), Speicherplatz 121,3 GB / 467,3 GB (26,0 %) und eine Uptime von 1608 h 23 min. Die Ubuntu-Kommandozeile zeigte einen Lastdurchschnitt von 0,14, 12 Prozessorkerne, Arbeitsspeicher von 3,1 GiB / 14 GiB, das Root-Dateisystem mit 122 G / 468 G (28 %) sowie eine Uptime von 9 Wochen, 4 Tagen und 23 Minuten. Daraus ergibt sich eine CPU-Auslastung von ungefähr 1,2 %. Nach der Aktualisierung waren alle vier Statistiken weiterhin sichtbar: CPU 1,2 %, Arbeitsspeicher 3,1 GB / 14,8 GB (21,2 %), Speicherplatz 121,3 GB / 467,3 GB (26,0 %) und Uptime 1608 h 24 min.

**Beobachtungen/Nachweis:** Die Werte stimmen bis auf geringe zeitliche und Rundungsabweichungen überein. Beim Arbeitsspeicher ist die Gesamtkapazität wegen der Einheiten GB und GiB unterschiedlich angegeben.

---

### TC-04: Ungültige Aufgabe wird nicht gespeichert

**Datum/Uhrzeit der Durchführung:** 19.10.2026, 08:25 Uhr

**Tatsächliches Resultat:** Bei leerem Titelfeld oder ausschliesslich enthaltenen Leerzeichen blieb die Schaltfläche „Add Task“ deaktiviert. Der Mauszeiger zeigte das Verbotszeichen (🚫); die Schaltfläche liess sich nicht anklicken.

**Beobachtungen/Nachweis:** Das Formular liess sich mit leerem Titel oder ausschliesslich Leerzeichen nicht absenden. Es wurde keine Aufgabe erstellt.

---

### TC-05: Daten des Whiteboards speichern und laden

**Datum/Uhrzeit der Durchführung:** 19.10.2026, 08:30 Uhr

**Tatsächliches Resultat beim ersten Durchlauf:** Nach dem erneuten Öffnen des Whiteboards waren die erstellten Zeichnungen und Texte nicht mehr vorhanden.

**Beobachtungen/Nachweis:** Die Testzeichnung und die Textelemente wurden nach dem erneuten Öffnen nicht angezeigt.

**Wiederholungsprüfung nach der Korrektur (10.11.2026, Uhrzeit nicht angegeben):** Der Whiteboard-Test wurde auf dem Ubuntu-Server erneut durchgeführt. Die Zeichnungen und Texte blieben nach dem erneuten Öffnen erhalten.

---

### TC-06: Darstellung und Navigation der mobilen PWA prüfen

**Datum/Uhrzeit der Durchführung:** 15.10.2026, 16:00 Uhr

**Tatsächliches Resultat:** Die installierte PWA wurde über das Symbol auf dem Home-Bildschirm geöffnet. Die Seiten und Inhalte wurden korrekt angezeigt; die mobile Bedienung funktionierte ohne festgestellte Probleme.

**Beobachtungen/Nachweis:** Es wurden keine Darstellungs- oder Bedienungsprobleme festgestellt.


## Testlauf auswerten und Ergebnisse protokollieren

Bei jedem durchgeführten Testfall wird das tatsächliche mit dem erwarteten Resultat verglichen und als bestanden oder nicht bestanden bewertet. Bei nicht bestandenen Tests werden die Abweichung und eine mögliche Korrekturmassnahme festgehalten. Die Bewertung basiert auf den zuvor festgehaltenen Testergebnissen.

| Testfall | Erwartetes Resultat erfüllt? | Bewertung | Abweichung oder Korrekturmassnahme |
| --- | --- | --- | --- |
| TC-01 | Ja, der erwartete Statuswechsel von online zu offline wurde angezeigt | ☒ Bestanden　☐ Nicht bestanden | Stirling PDF wurde nach dem Test wieder gestartet. |
| TC-02 | Ja, die Smartphone-Benachrichtigung erschien mit dem Aufgabentitel | ☒ Bestanden　☐ Nicht bestanden | Keine Abweichung festgestellt. |
| TC-03A | Ja, alle Prüfungen waren erfolgreich (`pass 1`, `fail 0`) | ☒ Bestanden　☐ Nicht bestanden | Keine Abweichung festgestellt. |
| TC-03B | Ja, die vier Statistiken stimmten ungefähr mit den Ubuntu-Werten überein und waren nach der Aktualisierung weiterhin sichtbar | ☒ Bestanden　☐ Nicht bestanden | Nur geringe zeitliche und Rundungsabweichungen festgestellt. |
| TC-04 | Ja, bei leerem Titel oder ausschliesslich Leerzeichen konnte keine Aufgabe abgesendet werden | ☒ Bestanden　☐ Nicht bestanden | Keine Abweichung festgestellt. |
| TC-05 | Ja, nach der Korrektur blieben Zeichnungen und Texte beim erneuten Öffnen erhalten | ☒ Bestanden　☐ Nicht bestanden | Der erste Test schlug fehl. Nach der Codekorrektur war der Wiederholungstest erfolgreich. |
| TC-06 | Ja, die installierte PWA und ihre Seiten wurden korrekt angezeigt und funktionierten | ☒ Bestanden　☐ Nicht bestanden | Keine Darstellungs- oder Bedienungsprobleme festgestellt. |


## 6.8: Sie definieren Korrekturmassnahmen und führen diese durch

### TC-05: Whiteboard speichern und laden

**Ursache:** Die Funktion `serializeAsJSON` wurde mit einem Objekt statt mit den erwarteten einzelnen Parametern aufgerufen. Dadurch schlug die Serialisierung fehl, bevor der Speichervorgang gestartet wurde. Zusätzlich wurde der Editor bereits vor Abschluss des Ladevorgangs als bereit markiert.

**Korrektur:** Der Aufruf von `serializeAsJSON` wurde an die installierte Excalidraw-API angepasst. Der Editor wird erst nach erfolgreichem Laden der gespeicherten Daten angezeigt. Bei einem Ladefehler erscheint stattdessen eine Fehlermeldung mit einer erneuten Ladeoption.

**Status:** Die Codekorrektur wurde umgesetzt und auf dem Ubuntu-Server erneut getestet. Zeichnungen und Texte blieben nach dem erneuten Öffnen erhalten.


## 6.9: Sie überprüfen die Implementierung gemäss dem definierten Sicherheitskonzept und treffen geeignete Korrekturmassnahmen

### Grundlage und Umfang

Als Grundlage dient das englischsprachige [Sicherheitskonzept in Security_Concept.md](Security_Concept.md). Dieses wurde für die bestehende Anwendung nachträglich definiert. Es wird nicht behauptet, dass es bereits bei der ursprünglichen Entwicklung vorlag.

Die folgende Prüfung betrifft den Netzwerkzugriff auf das Dashboard gemäss SEC-01, SEC-02 und SEC-03 sowie eine ergänzende Prüfung der Prozessberechtigungen gemäss SEC-08. Das Dashboard ist ausschliesslich für den persönlichen Gebrauch vorgesehen. Der vorgesehene Zugriff erfolgt über Tailscale und HTTPS; ein direkter Zugriff über das lokale Netzwerk auf den Anwendungsport ist nicht vorgesehen.

**Nachweisgrundlage:** Die Serverbefehle wurden durch den Betreiber auf dem Ubuntu-Server ausgeführt. Die nachfolgenden Feststellungen beruhen auf den bereitgestellten Terminalausgaben und seinen ausdrücklichen Bestätigungen. Ein unabhängiger Fernzugriff auf den Server fand nicht statt. Private Serveradressen und Hostnamen werden hier nicht wiedergegeben.

### Prüfung des ursprünglichen Zustands

Folgende Ausgaben wurden überprüft:

- `sudo ufw status verbose`: Die Firewall war aktiv und blockierte eingehende Verbindungen standardmässig. Für `3000/tcp` bestand jedoch eine ausdrückliche Freigabe von beliebigen Quellen, sowohl für IPv4 als auch für IPv6.
- `ss -lnt`: Das Dashboard lauschte auf `0.0.0.0:3000` und damit auf allen IPv4-Netzwerkschnittstellen.
- `tailscale serve status` und `tailscale funnel status`: Der HTTPS-Zugang auf Port `8443` leitete an `http://127.0.0.1:3000` weiter. Die Ausgabe bezeichnete diesen Zugang als „tailnet only“; eine öffentliche Funnel-Freigabe war nicht ausgewiesen.
- Die gezielt ausgelesenen PM2-Startparameter des Prozesses `server-dashboard` lauteten `start -- -H 0.0.0.0 -p 3000`.
- Der Betreiber bestätigte, dass seine übliche Desktop-Verknüpfung die HTTPS-Adresse mit Port `8443` verwendet.

**Festgestellte Abweichung:** Obwohl ein privater HTTPS-Zugang über Tailscale eingerichtet war, liessen die Bindung an alle IPv4-Schnittstellen und die breite Firewall-Freigabe einen zusätzlichen direkten Zugangsweg auf Port `3000` zu. Diese Konfiguration entsprach nicht dem vorgesehenen ausschliesslichen Zugriff über Tailscale Serve. Eine tatsächliche Erreichbarkeit aus dem Internet wurde damit nicht nachgewiesen; diese hängt zusätzlich von Router, vorgeschalteten Filtern und Netzwerkanbindung ab.

### Durchgeführte Korrekturmassnahmen

Nach Zustimmung des Betreibers wurden folgende Änderungen vorgenommen:

1. Nur der Dashboard-Prozess wurde mit geänderter Bindung neu gestartet:

   `pm2 restart server-dashboard -- start -- -H 127.0.0.1 -p 3000`

   Dadurch nimmt die Anwendung Verbindungen nur noch über die lokale Loopback-Adresse des Servers an. Tailscale Serve kann sie weiterhin über sein bestehendes lokales Weiterleitungsziel erreichen.

2. Nach erfolgreicher Funktionskontrolle wurde die PM2-Konfiguration mit `pm2 save` gespeichert. Der Betreiber bestätigte den erfolgreichen Abschluss.

3. Die nicht mehr benötigte breite Firewall-Freigabe wurde mit `sudo ufw delete allow 3000/tcp` entfernt.

Die Korrektur betraf die Startkonfiguration des Dashboards und dessen Firewall-Freigabe. Änderungen am Anwendungscode, an den gespeicherten Nutzdaten oder an anderen Diensten waren dafür nicht erforderlich.

### Wiederholungsprüfung und Resultat

| Überprüfung | Nachweis / tatsächliches Resultat | Bewertung |
| --- | --- | --- |
| Bindung des Dashboards kontrollieren | `ss -lnt 'sport = :3000'` zeigte ausschliesslich `127.0.0.1:3000` als lauschende Adresse. | Die Bindung an alle IPv4-Schnittstellen wurde aufgehoben. |
| Vorgesehenen HTTPS-Zugang nach dem Neustart prüfen | Der Betreiber öffnete seine bestehende HTTPS-Verknüpfung auf Port `8443` erneut und bestätigte, dass das Dashboard nach dem Aktualisieren weiterhin geladen wurde. | Der vorgesehene Zugang funktionierte nach der Änderung weiterhin. |
| Firewall-Freigaben erneut kontrollieren | Die anschliessend bereitgestellte Ausgabe von `sudo ufw status verbose` enthielt keine Freigabe für Port `3000`, weder für IPv4 noch für IPv6. Die Firewall blieb aktiv. | Die breite Portfreigabe wurde entfernt. |
| Geänderte PM2-Konfiguration speichern | Der Betreiber bestätigte, dass `pm2 save` erfolgreich abgeschlossen wurde. | Speicherung bestätigt; ein Neustart des gesamten Servers wurde nicht getestet. |

**Ergebnis dieser Korrektur:** Der direkte, über die Server-Netzwerkschnittstellen angebotene Zugang auf Port `3000` wurde durch die Loopback-Bindung geschlossen und die zugehörige breite Firewall-Freigabe entfernt. Der bestehende Tailscale-HTTPS-Zugang blieb funktionsfähig. Dies wurde durch die bereitgestellten Konfigurationsausgaben und die Funktionsbestätigung des Betreibers belegt, nicht durch einen separaten Verbindungsversuch von einem unberechtigten Gerät.

### Ergänzende Überprüfung von Zugriff und Berechtigungen

| Anforderung | Prüfung und tatsächliches Resultat | Bewertung |
| --- | --- | --- |
| SEC-01 / SEC-02: Zugriff auf den vorgesehenen Benutzer beschränken | Der Betreiber bestätigte, dass er der einzige Benutzer seines Tailnets ist und den Server nie mit anderen Personen geteilt hat. | Die Angaben entsprechen dem vorgesehenen persönlichen Gebrauch. Eine technische Einsicht in die Tailscale-Zugriffsrichtlinien erfolgte nicht. |
| SEC-08: Anwendung nicht als root betreiben | `id -u` ergab `1000`. Die Ausgabe von `ps -o user=,uid=,comm= -p "$(pm2 pid server-dashboard)"` zeigte ebenfalls UID `1000` für den PM2-verwalteten npm-Startprozess. | Der geprüfte Startprozess läuft nicht als root. Die vollständige Prozesskette wurde nicht separat kontrolliert. |
| SEC-08: Keine breiten passwortlosen Administratorrechte | `sudo -l` zeigte für das Benutzerkonto die Regel `(ALL : ALL) ALL`, ohne `NOPASSWD`-Zusatz. | In der bereitgestellten Regel war keine passwortlose sudo-Freigabe ausgewiesen. Die vorhandene normale Administrationsberechtigung wurde nicht verändert. |

Für diese ergänzenden Prüfungen ergab sich aus den vorliegenden Nachweisen keine zusätzliche Korrekturmassnahme.

### Fazit zu den Lernzielen 6.8 und 6.9

Für **6.8** wurde anhand des Whiteboards eine Fehlerursache beschrieben, eine Korrektur umgesetzt und die Funktion durch einen erfolgreichen Wiederholungstest überprüft.

Für **6.9** wurde die vorhandene Zugriffskonfiguration mit den Anforderungen des Sicherheitskonzepts verglichen. Dabei wurde der zusätzliche direkte Zugang auf Port `3000` als Abweichung erkannt. Die Bindung wurde auf Loopback beschränkt, die breite Firewall-Freigabe entfernt und die geänderte PM2-Konfiguration gespeichert. Die anschliessende Kontrolle der lauschenden Adresse und der Firewall-Regeln sowie der weiterhin funktionierende HTTPS-Zugang belegen die Korrektur im beschriebenen Prüfumfang. Ergänzend wurden die Angaben zum Benutzerkreis und die Prozessberechtigungen überprüft.

### Abgrenzung und verbleibende Sicherheitsarbeiten

Die dokumentierte Abweichung ist korrigiert; dieser Prüf- und Korrekturdurchlauf ist abgeschlossen. Die vollständige Erfüllung aller Anforderungen des Sicherheitskonzepts wird damit nicht behauptet. Insbesondere Tailscale-Zugriffsrichtlinien, die Ablehnung von Zugriffen unberechtigter Geräte und weitere mögliche Weiterleitungswege wurden nicht technisch überprüft. Die Angaben zum Benutzerkreis und zu fehlenden Gerätefreigaben beruhen auf der Bestätigung des Betreibers. Die HTTPS-Nutzung wurde ebenfalls bestätigt; eine gesonderte Zertifikatsprüfung fand nicht statt.

Ein direkter LAN-Verbindungstest auf Port `3000` wurde nicht durchgeführt, da sich der Betreiber während der Prüfung nicht im Heimnetz befand. Auch ein Serverneustart zur Prüfung der Wiederherstellung der gespeicherten PM2-Konfiguration wurde nicht durchgeführt. Diese ergänzenden Tests bleiben offen und werden nicht als bestanden gewertet.

Weitere Anforderungen des Sicherheitskonzepts sowie die übrigen bei der lokalen Codeprüfung festgestellten Punkte sind nicht Gegenstand dieses Korrekturprotokolls und bleiben separat zu bearbeiten. Aus dieser einzelnen erfolgreichen Korrektur wird keine vollständige Sicherheit der Anwendung oder ein Abschluss der gesamten Sicherheitsprüfung abgeleitet.
