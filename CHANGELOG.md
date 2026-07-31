# Changelog

## 1.9.0 - 2026-07-31
- CHG: toter Konfigurationsschlüssel lizenz entfernt (F-17)
- CHG: brandingCSS und brandingCSSFile als Base-Abhängigkeiten deklariert und lokal gespiegelt (F-17)
- CHG: format.typ von "String" auf v1-sicheres "string" korrigiert (F-18)
- CHG: dropdown-Default auf Feldebene verschoben statt in format (F-18)
- CHG: daten.schema auf assets/schema.json gesetzt (F-20)

## 1.8.0 - 2026-07-30

- **FIX:** Laufzeitfehler nach dem Laden der Konfiguration werden jetzt sichtbar gemeldet; `handleRouting()` wird `await`et und besitzt einen Fehlerpfad. Bisher blieb die Seite bei einem Fehler im Seitenaufbau stumm leer
- **FIX:** `getConfigUrl()` schneidet bei einer URL ohne abschliessenden Schraegstrich nicht mehr das letzte Verzeichnis ab; die Konfiguration wird auch unter `.../app` gefunden
- **FIX:** Klick auf einen Hash-Link, der bereits die aktive Seite bezeichnet, rendert die Seite neu (`setupSamePageLinks()`) - das Logo fuehrt damit aus Unteransichten zurueck zur Startseite
- **ENH:** `app/app-base.js` ist wieder byte-identisch zum Template `oda-generic` 1.4.0; app-spezifisches Aufraeumen laeuft ueber den neuen Hook `onPageLeave(page)` in `app/app.js`
- **FIX:** Die Pfade zu Kopfzeilen-Icon und Branding-CSS werden jetzt relativ zum App-Verzeichnis aufgeloest (`../assets/...`); bisher wurden beide Dateien beim lokalen Test unterhalb von `app/` gesucht und deshalb nicht gefunden - das Logo fehlte dadurch sichtbar

## 1.7.0 - 2026-07-24

- **FIX:** Laufzeit-Fehlermeldung wird vor der Anzeige HTML-maskiert (`escapeHtmlForBase`); ein Fehlertext kann kein Markup mehr in die Seite einschleusen (XSS)
- **FIX:** Startseiten-Renderer wird nun `await`et; bei asynchronen Apps erscheint kein kurzzeitiges `[object Promise]` in `#main-content`

## 1.6.0 - 2026-07-23

- **ENH:** Datenabruf auf den Schalter `proxyAktiv` umgestellt; direkte Abrufe sind der Standard, der ODAS-Proxy wird nur noch bei `ja` verwendet
- **ENH:** Einfachen Standalone-Betrieb hinter Traefik mit derselben `odas-config/config.json` wie in der Entwicklung ergänzt
- **ENH:** Traefik-Anbindung auf das externe Netzwerk `proxynet`, den EntryPoint `websecure` und den Zertifikatsresolver `letsencrypt` festgelegt
- **FIX:** Proxy-Basispfad funktioniert jetzt auch bei URLs mit `index.html`; der Ziel-Pfad wird URL-kodiert
- **DOC:** Start über `STANDALONE=true make up` dokumentiert

## 1.5.0 - 2026-06-16

- ENH: Methodikbox (ausklappbar) mit Datenquelle-Hinweis und Datenstand ergänzt (`datenquelleHinweis`, `datenStand`).
- ENH: KPI-Erklärungstexte unter den Kennzahlen ergänzt (`kpiKontext1`–`kpiKontext5`).

## 1.4.0 - 2026-06-16

- Schale-4-Verstaendlichkeit ergaenzt: „Fuer wen ist diese App?"-Block in Beschreibung und README.
- Konfigurierbarer Abschnitt „Weitere Informationen" mit weiterfuehrenden Links (neues Feld `weiterfuehrendeLinks`, leer = ausgeblendet).

## 1.3.0 - 2026-04-24

- App auf allgemeine Arbeitsmarktmonitor-Nutzung umgestellt.
- Dortmund-Bezuege in Titeln und Texten entfernt; Dortmund nur noch als Beispielwert in Konfigurationsfeldern hinterlegt.
- API-Basis-URL in der App auf Instanzkonfiguration umgestellt (mit Beispiel-Fallback).

## 1.2.0 - 2026-04-02

- App-Metadaten auf Arbeitsmarktmonitor umgestellt (Titel, URL-Name, Beschreibung, Datengrundlage).
- Datenquellen in den Konfigurationsangaben auf eine OpenDataSoft-Instanz aktualisiert.
- Tabellenansicht mit Sticky-Header, eigenem Scrollbereich, Hervorhebungen und Legende dokumentiert.
- CSV-Export aus App-Funktionsumfang entfernt.

## 1.1.0

- Vorheriger Stand der App vor der Umstellung auf den Arbeitsmarktmonitor.
