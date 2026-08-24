# Changelog

## 1.26.0 - 2026-08-22
- **CHG:** `version` in `app-package.json` zu `app-version` umbenannt.
- **ENH:** Top-Level-Feld `app-package-version` ergänzt (Wert `"2"`: mehrere benannte API-URLs über `instanz-config.apiurls`).

## 1.25.0 - 2026-08-21
- **CHG:** Die vier skalaren Felder `apiurl`, `apiurlMerkmale`, `apiurlAltersgruppen`, `apiurlZuUndAbgang` durch das Array-Feld `apiurls` ersetzt (`typ: "array"`, Einträge `alq-stellen`, `merkmale`, `altersgruppen`, `zu-abgang`). Neuer Standard portfolioweit; `app.js` liest jede Quelle jetzt über `getOdasApiUrl(configdata, "<name>")`.

## 1.24.0 - 2026-08-20
- Markdown-Metadaten: Paketbeschreibungen auf echtes Markdown umgestellt, exakte Identität Top-Level/Instanz hergestellt, lokale HTML-Fixture semantisch gespiegelt.

## 1.23.0 - 2026-08-20
- FIX: Generierte IDs (`am-*`, `kpi-*`, `tbl-*`) tragen jetzt durchgängig die Instanzkennung (F-71)

## 1.22.0 - 2026-08-17
- `fetchOdasJson()` wirft jetzt bei nicht-JSON-Antworten (CSV, HTML, leerer Body) eine sprechende Konfigurationsfehlermeldung statt der rohen `JSON.parse`-Parserfehlermeldung (F-66)

## 1.21.0 - 2026-08-17
- **CHG:** `instanz-config`-`category`-Vokabular auf Deutsch umgestellt (`allgemein`, `beschreibung`, `datenherkunft`, `kontakt-rechtliches`, `sonstiges`); die entfallenen Kategorien `metrics` und `advanced` wurden auf `beschreibung` bzw. `sonstiges` verteilt

## 1.20.0 - 2026-08-17
- FIX: F-60-Restklasse geschlossen: `#am-root` war als statisches, JS-ungenutztes CSS-Hook-`id` implementiert — bei zwei Instanzen auf derselben Seite ein doppeltes `id`-Attribut (ungültiges HTML). Auf `class="am-root"` umgestellt, alle CSS-Selektoren in `app.css` von `#am-root` auf `.am-root` mitgezogen; funktional unverändert.

## 1.19.0 - 2026-08-13
- FIX: Lifecycle-Ressourcen sauber abgeräumt (F-57): Die App registriert je Instanz ein synchrones Cleanup in einer top-level Map und definiert `function onPageLeave(page)`, das beim Seitenwechsel die Chart-Instanz per `.destroy()` abräumt und den disposed-Zustand setzt. Nachlaufende Async-Fortsetzungen (verspäteter Chart.js-Load oder verspätetes Daten-Promise) starten danach keine Datenabrufe mehr, rendern keine Chart und überschreiben weder den Seitennavigations-DOM noch zeigen sie einen Fehler- oder Loading-Zustand an.

## 1.18.0 - 2026-08-12
- FIX: `app/index.html` auf den Template-Stand (F-47): Datei byte-gleich aus `oda-generic` übernommen — gültiges HTML, deutsche ARIA-Labels, Footer im Body; Titel und Fußzeile bleiben Platzhalter und werden zur Laufzeit aus der Instanz-Config überschrieben

## 1.17.0 - 2026-08-11
- FIX: Vier Datenquellen mit getrennten Zuständen (F-38): Die App lädt Arbeitslosenquote/Stellen, Merkmale, Altersgruppen sowie Zu-/Abgang jeweils aus dem eigenen Endpunkt (`apiurl`, `apiurlMerkmale`, `apiurlAltersgruppen`, `apiurlZuUndAbgang`) mit getrenntem Lade-/Fehlerstatus je Bereich. Nicht verfügbare oder leere Quellen zeigen im jeweiligen Tab eine fachliche Meldung statt plausibler Leerdaten; die Merkmals-KPIs melden dann „nicht verfügbar".

## 1.16.0 - 2026-08-07
- CHG: Bootstrap-Ziele instanzeindeutig (F-32): KPI-Kontext- und Methodik-Ziele (`#am-kpi-kontext-<id>` und `#am-methodik-body`) um eine Instanzkennung ergänzt — mehrere Instanzen derselben App auf einer Seite klappen ihre Panels unabhängig auf

## 1.15.0 - 2026-08-06
- FIX: Datenschutzangabe beschreibt den tatsaechlichen Stand nach dem Vendoring (Welle G)

## 1.14.0 - 2026-08-06
- FIX: Base auf Template oda-generic 1.6.0 vereinheitlicht (Hook renderPageOverride)

## 1.13.0 - 2026-08-04
- FIX: Datenschutzhinweis "Beim Aufruf kontaktierte Drittanbieter" an das Vendoring angepasst — jetzt lokal ausgelieferte Bibliotheken (Bootstrap/Leaflet/Chart.js) sind aus der Liste entfernt, weiterhin extern geladene Dienste (Kartenkacheln, Zusatzbibliotheken) bleiben genannt

## 1.12.0 - 2026-08-04
- FIX: Bootstrap, Chart.js vendored in `app/vendor/` statt von CDN geladen (F-07 Teil 2) — Standalone-Betrieb laedt diese Bibliotheken nicht mehr extern

## 1.11.0 - 2026-08-04
- FIX: Chart.js-Version vereinheitlicht auf 4.4.9 (vorher uneinheitlich gepinnt oder ganz ungepinnt, laedt bei jedem Aufruf die neueste Version) — Voraussetzung fuer das geplante Vendoring (F-07 Teil 2)

## 1.10.0 - 2026-08-04
- FIX: Drittanbieter (CDN, Kartendienste) in `datenschutz`-Default und README dokumentiert (F-07 Teil 1)
- FIX: Bootstrap CSS/JS auf einheitlich 5.3.8 gezogen (vorher gemischt 5.3.0/5.3.1 bzw. 5.3.0/5.3.0) (F-31)
- CHG: lokale `esc()`-Funktion auf den kanonischen Namen `escapeHtml()` umbenannt (F-24)

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
