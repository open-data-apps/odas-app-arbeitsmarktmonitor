# Changelog

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
