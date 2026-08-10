# Testing des Server-Dashboard

## Testumgebung

Getestet wird mein selbst entwickeltes Server-Dashboard. Die Applikation wurde mit Next.js entwickelt und läuft auf einem Ubuntu-Server. Als Laufzeitumgebung wird Node.js verwendet. Die Daten werden aus einer PostgreSQL-Datenbank sowie über verschiedene API-Routen abgerufen.

Auf meinem Windows-PC ist das Dashboard als Web-App installiert. Die Benutzeroberfläche wird deshalb hauptsächlich über die installierte Desktop-App getestet. Da diese auf der Browser-Technologie von Chrome basiert, werden ausgewählte Tests zusätzlich direkt im Webbrowser durchgeführt.

Der Zugriff auf das Dashboard erfolgt über das lokale Netzwerk/VPN/Internet. Die Darstellung wird auf dem Windows-PC und auf meinem Handy getestet. Dadurch werden sowohl die Desktop- als auch die mobile Ansicht überprüft.
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

**Vorbereitung:**

**Testschritte:**

**Erwartetes Resultat:**

**Tatsächliches Resultat:**

**Testergebnis:**

**Bemerkungen:**

---

