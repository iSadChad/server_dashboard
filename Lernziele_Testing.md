# Testing des Server-Dashboard

## Testumgebung

Getestet wird mein selbst entwickeltes Server-Dashboard. Die Applikation wurde mit Next.js entwickelt und läuft auf einem Ubuntu-Server. Als Laufzeitumgebung wird Node.js verwendet. Die Daten werden aus einer PostgreSQL-Datenbank sowie über verschiedene API-Routen abgerufen.

Auf meinem Windows-PC ist das Dashboard als Web-App installiert. Die Benutzeroberfläche wird deshalb hauptsächlich über die installierte Desktop-App getestet. Da diese auf der Browser-Technologie von Chrome basiert, werden ausgewählte Tests zusätzlich direkt im Webbrowser durchgeführt.

Der Zugriff auf das Dashboard erfolgt über das lokale Netzwerk/VPN/Internet. Die Darstellung wird auf dem Windows-PC und auf meinem Handy getestet. Dadurch werden sowohl die Desktop- als auch die mobile Ansicht überprüft.
Für die Funktionstests werden Testeinträge verwendet, zum Beispiel Notizen und Aufgaben. Dadurch können Daten erstellt, bearbeitet und gelöscht werden, ohne wichtige Daten zu gefährden.

## Testmittel

Für das Server-Dashboard werden Funktions-, Benutzeroberflächen-, API- und Kompatibilitätstests durchgeführt. Für die verschiedenen Testarten werden folgende Testmittel verwendet:

### Funktionstests

Die Funktionen des Dashboards werden über die installierte Desktop-App und Google Chrome getestet. Dazu werden vorbereitete Testdaten verwendet. Getestet werden beispielsweise das Erstellen, Bearbeiten und Löschen von Notizen und Aufgaben.

### Benutzeroberflächentests

Die Darstellung und Bedienbarkeit werden auf meinem Windows-PC und meinem Smartphone überprüft. Als Testmittel dienen Google Chrome, die installierte Desktop-App und die Entwicklerwerkzeuge von Chrome. Mit den Entwicklerwerkzeugen werden zusätzlich verschiedene Bildschirmgrössen simuliert.

### API-Tests

Die API-Routen werden über die Netzwerkansicht der Chrome-Entwicklerwerkzeuge und teilweise über die Kommandozeile geprüft. Dabei werden die zurückgegebenen Daten, Fehlermeldungen und HTTP-Statuscodes kontrolliert.

### Kompatibilitätstests

Die Desktopansicht mit Google Chrome getestet, auf dem Smartphone lauft es über Safari als ein PWA. Es werden keine browserübergreifenden Tests durchgeführt, da ausschliesslich Google Chrome verwendet wird.


## Testfälle
