/*
 * ODAS App: Allgemeiner Arbeitsmarktmonitor
 *
 * Datenquellen: OpenDataSoft API
 *   - Arbeitslose, ALQ, offene Stellen 1990–2023  (34 Einträge)
 *   - Arbeitslose nach Merkmalen        1990–2023  (33 Einträge)
 *   - Arbeitslose nach Altersgruppen    1997–2023  (27 Einträge)
 *   - Zu- und Abgang Arbeitslose        1990–2023  (34 Einträge)
 *
 * Bereitsteller: Datenanbieter (instanzabhängig)
 *
 * config.json (Beispiel):
 * { "titel": "Arbeitsmarktmonitor", "apiurl": "https://open-data.dortmund.de/api/explore/v2.1/catalog/datasets" }
 *
 * @param {Object} configdata
 * @param enclosingHtmlDivElement
 * @returns {null}
 */
function isOdasProxyEnabled(configdata = {}) {
  return String(configdata.proxyAktiv || "").trim().toLowerCase() === "ja";
}

function extractPathFromUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname + parsedUrl.search;
  } catch (_error) {
    return String(url || "");
  }
}

function getOdasAppBasePath(pathname) {
  let appPath =
    pathname === undefined
      ? typeof window !== "undefined"
        ? window.location.pathname
        : "/"
      : String(pathname || "/");

  if (!appPath.endsWith("/")) {
    const lastSlashIndex = appPath.lastIndexOf("/");
    const lastSegment = appPath.substring(lastSlashIndex + 1);
    if (lastSegment.includes(".")) {
      appPath = appPath.substring(0, lastSlashIndex + 1);
    }
  }

  return appPath.replace(/\/+$/, "");
}

function getOdasProxyEndpoint(targetUrl, pathname) {
  const appPath = getOdasAppBasePath(pathname);
  return `${appPath}/odp-data?path=${encodeURIComponent(
    extractPathFromUrl(targetUrl),
  )}`;
}

async function fetchViaOdasProxy(targetUrl) {
  const response = await fetch(getOdasProxyEndpoint(targetUrl), {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`ODAS-Proxy-Fehler: HTTP ${response.status}`);
  }

  const proxyData = await response.json();
  if (!proxyData || typeof proxyData.content !== "string") {
    throw new Error("ODAS-Proxy-Antwort enthält keinen content-String.");
  }

  return proxyData.content;
}

async function fetchOdasResource(targetUrl, configdata = {}) {
  if (isOdasProxyEnabled(configdata)) {
    return fetchViaOdasProxy(targetUrl);
  }

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.text();
  } catch (error) {
    throw new Error(
      `Direkter Datenabruf fehlgeschlagen (${error.message}). Bitte prüfen Sie die Daten-URL und die CORS-Freigabe der Datenquelle.`,
    );
  }
}

async function fetchOdasJson(targetUrl, configdata = {}) {
  return JSON.parse(await fetchOdasResource(targetUrl, configdata));
}

function app(configdata, enclosingHtmlDivElement) {
  // ─── Konfiguration ───────────────────────────────────────────────────────────
  var TITLE =
    configdata && configdata.titel ? configdata.titel : "Arbeitsmarktmonitor";
  var DO_API =
    configdata && configdata.apiurl ? String(configdata.apiurl).trim() : "";
  var API_HOST = hostFromUrl(DO_API) || "API";

  var CHART_OPTIONS = [
    {
      value: "alq",
      label: "ALQ (alle zivilen EP)",
      field: "arbeitslosenquote_ivh_auf_alle_zivilen_erwerbspersonen_am_30_06",
      src: "alq",
      yLabel: "ALQ (%)",
    },
    {
      value: "al",
      label: "Arbeitslose gesamt",
      field: "arbeitslose_insgesamt_am_30_06",
      src: "alq",
      yLabel: "Personen",
    },
    {
      value: "stellen",
      label: "Gemeldete offene Stellen",
      field: "bestand_gemeldeter_offener_stellen_am_monatsende_am_30_06",
      src: "alq",
      yLabel: "Stellen",
    },
    {
      value: "lza",
      label: "Langzeitarbeitslose",
      field: "langzeitarbeitslose_am_30_06",
      src: "merk",
      yLabel: "Personen",
    },
    {
      value: "zugang",
      label: "Zugang Arbeitslose",
      field: "zugang_arbeitslosen",
      src: "flow",
      yLabel: "Personen",
    },
    {
      value: "abgang",
      label: "Abgang in Erwerbstätigkeit",
      field: "abgang_arbeitslose_in_erwerbstatigkeit",
      src: "flow",
      yLabel: "Personen",
    },
  ];

  // ─── State ───────────────────────────────────────────────────────────────────
  var S = {
    raw: { alq: [], merk: [], alter: [], flow: [] },
    filtered: { alq: [], merk: [], alter: [], flow: [] },
    yearFrom: "",
    yearTo: "",
    activeTable: "alq",
    chart: null,
    chartJsReady: false,
  };

  function isCovidYear(year) {
    return String(year) === "2020" || String(year) === "2021";
  }

  function latestRow(rows) {
    return rows && rows.length ? rows[rows.length - 1] : null;
  }

  function rowStateClass(r, latestYear) {
    var classes = [];
    if (String(r.jahr) === String(latestYear)) classes.push("is-latest");
    if (isCovidYear(r.jahr)) classes.push("is-covid");
    return classes.join(" ");
  }

  function rowBadges(r, latestYear) {
    var badges = [];
    if (String(r.jahr) === String(latestYear)) {
      badges.push(
        '<span class="badge bg-primary ms-1 am-row-badge">Neu</span>',
      );
    }
    if (isCovidYear(r.jahr)) {
      badges.push(
        '<span class="badge bg-warning text-dark ms-1 am-row-badge">COVID</span>',
      );
    }
    return badges.join("");
  }

  function tableHeader(label, sub, extraClass) {
    return (
      "<th" +
      (extraClass ? ' class="' + extraClass + '"' : "") +
      ">" +
      '<span class="am-th-title">' +
      escapeHtml(label) +
      "</span>" +
      (sub ? '<span class="am-th-sub">' + escapeHtml(sub) + "</span>" : "") +
      "</th>"
    );
  }

  function numCell(value, asDecimal, bold) {
    return (
      '<td class="text-end am-num' +
      (bold ? " fw-semibold" : "") +
      '">' +
      (asDecimal ? fmtD(value) : fmtI(value)) +
      "</td>"
    );
  }

  function trendValue(current, previous, asDecimal) {
    var curr = parseFloat(current);
    var prev = parseFloat(previous);
    if (!isFinite(curr) || !isFinite(prev)) return "";
    var delta = curr - prev;
    if (!isFinite(delta) || delta === 0) {
      return '<span class="am-kpi-trend neutral">→ 0</span>';
    }
    var formatted = asDecimal ? fmtD(Math.abs(delta)) : fmtI(Math.abs(delta));
    return (
      '<span class="am-kpi-trend ' +
      (delta > 0 ? "up" : "down") +
      '">' +
      (delta > 0 ? "↑ +" : "↓ -") +
      formatted +
      "</span>"
    );
  }

  // ─── HTML-Gerüst ─────────────────────────────────────────────────────────────
  enclosingHtmlDivElement.innerHTML = [
    '<div id="am-root">',

    // Header
    '<div class="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">',
    "  <div>",
    '    <h2 class="mb-1 fw-bold">' + escapeHtml(TITLE) + "</h2>",
    '    <p class="text-muted small mb-0">',
    '      <span class="badge bg-secondary me-1">' + escapeHtml(API_HOST) + "</span>",
    "      Bereitsteller: Datenanbieter (instanzabhängig)",
    "    </p>",
    "  </div>",
    '  <button class="btn btn-sm btn-outline-primary flex-shrink-0" id="am-reload" type="button">↻ Neu laden</button>',
    "</div>",

    // Alert
    '<div id="am-alert" class="mb-3"></div>',

    // KPI-Kacheln
    '<div class="row g-3 mb-4">',
    kpiCard("kpi-year", "Aktuellstes Datenjahr", "", false, configdata.kpiKontext1),
    kpiCard("kpi-alq", "ALQ gesamt (%)", "Stand 30.06.", true, configdata.kpiKontext2),
    kpiCard("kpi-al", "Arbeitslose insges.", "Stand 30.06.", true, configdata.kpiKontext3),
    kpiCard("kpi-lza", "Langzeitarbeitslose", "Stand 30.06.", true, configdata.kpiKontext4),
    kpiCard("kpi-stellen", "Gem. offene Stellen", "Stand 30.06.", true, configdata.kpiKontext5),
    "</div>",

    // Filter
    '<div class="card shadow-sm mb-4"><div class="card-body">',
    '  <div class="row g-3 align-items-end">',
    '    <div class="col-sm-4 col-md-2">',
    '      <label class="form-label" for="f-from">Jahr von</label>',
    '      <select class="form-select form-select-sm" id="f-from"></select>',
    "    </div>",
    '    <div class="col-sm-4 col-md-2">',
    '      <label class="form-label" for="f-to">Jahr bis</label>',
    '      <select class="form-select form-select-sm" id="f-to"></select>',
    "    </div>",
    '    <div class="col-sm-4 col-md-3">',
    '      <label class="form-label" for="f-chart">Zeitreihe anzeigen</label>',
    '      <select class="form-select form-select-sm" id="f-chart">',
    CHART_OPTIONS.map(function (o) {
      return '<option value="' + o.value + '">' + escapeHtml(o.label) + "</option>";
    }).join(""),
    "      </select>",
    "    </div>",
    '    <div class="col-sm-6 col-md-2">',
    '      <button class="btn btn-sm btn-outline-secondary w-100" id="btn-reset" type="button">Zurücksetzen</button>',
    "    </div>",
    "  </div>",
    "</div></div>",

    // Chart
    '<div class="card shadow-sm mb-4">',
    '  <div class="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">',
    '    <strong id="chart-title">Zeitreihe</strong>',
    '    <span class="text-muted small" id="chart-range"></span>',
    "  </div>",
    '  <div class="card-body">',
    '    <div id="chart-empty" class="text-center text-muted py-4 d-none">Keine Daten.</div>',
    '    <canvas id="am-chart"></canvas>',
    "  </div>",
    "</div>",

    // Sub-Tabs + Tabelle
    '<ul class="nav nav-tabs" id="sub-tabs">',
    '  <li class="nav-item"><button class="nav-link active" data-sub="alq"   type="button">ALQ &amp; Stellen</button></li>',
    '  <li class="nav-item"><button class="nav-link"        data-sub="merk"  type="button">Merkmale</button></li>',
    '  <li class="nav-item"><button class="nav-link"        data-sub="alter" type="button">Altersgruppen</button></li>',
    '  <li class="nav-item"><button class="nav-link"        data-sub="flow"  type="button">Zu-/Abgang</button></li>',
    "</ul>",

    '<div class="card shadow-sm border-top-0 rounded-top-0 mb-4">',
    '  <div class="card-header bg-white d-flex justify-content-between align-items-center">',
    '    <strong id="table-title">ALQ &amp; Offene Stellen</strong>',
    '    <span class="badge bg-secondary" id="table-badge">–</span>',
    "  </div>",
    '  <div class="card-body p-0">',

    '<div class="am-table-panel" id="panel-alq">',
    '  <div class="am-table-scroll">',
    '    <table class="table table-hover table-sm align-middle mb-0 am-table" id="tbl-alq">',
    '    <thead class="table-light"><tr>',
    "      <th>Jahr</th>",
    "      " + tableHeader("Arb.lose m.", "30.06", "text-end"),
    "      " + tableHeader("Arb.lose w.", "30.06", "text-end"),
    "      " + tableHeader("Arb.lose ges.", "30.06", "text-end am-important"),
    "      " + tableHeader("ALQ abh. ZEP", "30.06 (%)", "text-end"),
    "      " +
      tableHeader("ALQ alle ZEP", "30.06 (%)", "text-end am-important"),
    "      " + tableHeader("Gem. Stellen", "30.06", "text-end"),
    "      " + tableHeader("Arb.lose ges.", "31.12", "text-end am-important"),
    "      " +
      tableHeader("ALQ alle ZEP", "31.12 (%)", "text-end am-important"),
    "      " + tableHeader("Gem. Stellen", "31.12", "text-end"),
    "    </tr></thead>",
    '<tbody id="tbody-alq"><tr><td colspan="10" class="text-center text-muted py-4">Lade …</td></tr></tbody>',
    "    </table>",
    "  </div>",
    '  <div class="am-table-legend">',
    '    <span class="am-legend-item"><span class="am-legend-swatch am-legend-latest"></span> Neuester Eintrag</span>',
    '    <span class="am-legend-item"><span class="am-legend-swatch am-legend-covid"></span> COVID-Jahre 2020/2021</span>',
    "  </div>",
    "</div>",

    '<div class="am-table-panel d-none" id="panel-merk">',
    '  <div class="am-table-scroll">',
    '    <table class="table table-hover table-sm align-middle mb-0 am-table" id="tbl-merk">',
    '    <thead class="table-light"><tr>',
    "      <th>Jahr</th>",
    "      " + tableHeader("Nichtdeutsche", "30.06", "text-end"),
    "      " + tableHeader("Schwerbeh.", "30.06", "text-end"),
    "      " + tableHeader("Teilzeit", "30.06", "text-end"),
    "      " + tableHeader("Langzeit-AL", "30.06", "text-end am-important"),
    "      " + tableHeader("Nichtdeutsche", "31.12", "text-end"),
    "      " + tableHeader("Schwerbeh.", "31.12", "text-end"),
    "      " + tableHeader("Langzeit-AL", "31.12", "text-end am-important"),
    "    </tr></thead>",
    '<tbody id="tbody-merk"></tbody>',
    "    </table>",
    "  </div>",
    '  <div class="am-table-legend">',
    '    <span class="am-legend-item"><span class="am-legend-swatch am-legend-latest"></span> Neuester Eintrag</span>',
    '    <span class="am-legend-item"><span class="am-legend-swatch am-legend-covid"></span> COVID-Jahre 2020/2021</span>',
    "  </div>",
    "</div>",

    '<div class="am-table-panel d-none" id="panel-alter">',
    '  <div class="am-table-scroll">',
    '    <table class="table table-hover table-sm align-middle mb-0 am-table" id="tbl-alter">',
    '    <thead class="table-light"><tr>',
    "      <th>Jahr</th>",
    "      " + tableHeader("Ges.", "30.06", "text-end am-important"),
    "      " + tableHeader("<20", "30.06", "text-end"),
    "      " + tableHeader("20–25", "30.06", "text-end"),
    "      " + tableHeader("25–50", "30.06", "text-end"),
    "      " + tableHeader("50–55", "30.06", "text-end"),
    "      " + tableHeader("55+", "30.06", "text-end"),
    "      " + tableHeader("Ges.", "31.12", "text-end am-important"),
    "      " + tableHeader("<20", "31.12", "text-end"),
    "      " + tableHeader("20–25", "31.12", "text-end"),
    "      " + tableHeader("25–50", "31.12", "text-end"),
    "      " + tableHeader("55+", "31.12", "text-end"),
    "    </tr></thead>",
    '<tbody id="tbody-alter"></tbody>',
    "    </table>",
    "  </div>",
    '  <div class="am-table-legend">',
    '    <span class="am-legend-item"><span class="am-legend-swatch am-legend-latest"></span> Neuester Eintrag</span>',
    '    <span class="am-legend-item"><span class="am-legend-swatch am-legend-covid"></span> COVID-Jahre 2020/2021</span>',
    "  </div>",
    "</div>",

    '<div class="am-table-panel d-none" id="panel-flow">',
    '  <div class="am-table-scroll">',
    '    <table class="table table-hover table-sm align-middle mb-0 am-table" id="tbl-flow">',
    '    <thead class="table-light"><tr>',
    "      <th>Jahr</th>",
    "      " + tableHeader("Zugang Arb.lose", "", "text-end am-important"),
    "      " + tableHeader("davon: vorh. Erwerb.", "", "text-end"),
    "      " + tableHeader("davon: betr. Ausb.", "", "text-end"),
    "      " + tableHeader("ohne vorh. Erwerb.", "", "text-end"),
    "      " + tableHeader("Abgang gesamt", "", "text-end am-important"),
    "      " + tableHeader("Abgang in Erwerb.", "", "text-end"),
    "    </tr></thead>",
    '<tbody id="tbody-flow"></tbody>',
    "    </table>",
    "  </div>",
    '  <div class="am-table-legend">',
    '    <span class="am-legend-item"><span class="am-legend-swatch am-legend-latest"></span> Neuester Eintrag</span>',
    '    <span class="am-legend-item"><span class="am-legend-swatch am-legend-covid"></span> COVID-Jahre 2020/2021</span>',
    "  </div>",
    "</div>",

    "  </div>",
    "</div>",

    renderMethodikbox(configdata),
    renderWeitereInfos(configdata),

    "</div>", // am-root
  ].join("");

  // ─── Events ──────────────────────────────────────────────────────────────────
  q("#am-reload").addEventListener("click", initAll);

  q("#f-from").addEventListener("change", function (e) {
    S.yearFrom = e.target.value;
    applyFilter();
    renderAll();
  });
  q("#f-to").addEventListener("change", function (e) {
    S.yearTo = e.target.value;
    applyFilter();
    renderAll();
  });
  q("#f-chart").addEventListener("change", renderChart);
  q("#btn-reset").addEventListener("click", resetFilters);

  q("#sub-tabs").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-sub]");
    if (!btn) return;
    var sub = btn.getAttribute("data-sub");
    S.activeTable = sub;
    q("#sub-tabs")
      .querySelectorAll("[data-sub]")
      .forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
    ["alq", "merk", "alter", "flow"].forEach(function (s) {
      q("#panel-" + s).classList.toggle("d-none", s !== sub);
    });
    updateTableMeta();
  });

  // ─── Init ────────────────────────────────────────────────────────────────────
  initAll();

  async function initAll() {
    setLoading(true);
    if (!DO_API) {
      showAlert(
        "danger",
        "Keine API-URL konfiguriert. Bitte appinstanz.apiurl setzen.",
      );
      setLoading(false);
      return;
    }
    showAlert("info", "Lade Daten von " + API_HOST + " …");
    try {
      await ensureChartJs();
      var results = await fetchJson(DO_API);
      S.raw.alq = results;
      S.raw.merk = results;
      S.raw.alter = results;
      S.raw.flow = results;

      var allYears = collectAvailableYears(S.raw);
      if (allYears.length) {
        S.yearFrom = allYears[0];
        S.yearTo = allYears[allYears.length - 1];
        fillYearSelects(allYears);
      } else {
        S.yearFrom = "";
        S.yearTo = "";
        fillYearSelects([]);
      }

      applyFilter();
      renderAll();
      clearAlert();
    } catch (err) {
      console.error(err);
      showAlert(
        "danger",
        "Fehler beim Laden: " + escapeHtml(String(err.message || err)),
      );
    } finally {
      setLoading(false);
    }
  }

  // Daten laden: direkt oder ueber den ODAS-Proxy (proxyAktiv)
  async function fetchJson(url) {
    var d = await fetchOdasJson(url, configdata);
    return Array.isArray(d.results) ? d.results : [];
  }

  // ─── Filter & Render ─────────────────────────────────────────────────────────
  function applyFilter() {
    var from = parseInt(S.yearFrom, 10);
    var to = parseInt(S.yearTo, 10);
    if (!isFinite(from)) from = Number.NEGATIVE_INFINITY;
    if (!isFinite(to)) to = Number.POSITIVE_INFINITY;
    ["alq", "merk", "alter", "flow"].forEach(function (key) {
      S.filtered[key] = S.raw[key].filter(function (r) {
        var y = parseInt(r.jahr, 10);
        return y >= from && y <= to;
      });
    });
  }

  function renderAll() {
    renderKpis();
    renderChart();
    renderTables();
    showActiveTablePanel(S.activeTable);
    updateTableMeta();
  }

  function resetFilters() {
    var years = collectAvailableYears(S.raw);
    S.yearFrom = years[0] || "";
    S.yearTo = years[years.length - 1] || "";
    q("#f-from").value = S.yearFrom;
    q("#f-to").value = S.yearTo;
    q("#f-chart").value = "alq";
    applyFilter();
    renderAll();
  }

  function showActiveTablePanel(sub) {
    ["alq", "merk", "alter", "flow"].forEach(function (s) {
      var panel = q("#panel-" + s);
      if (panel) panel.classList.toggle("d-none", s !== sub);
    });
  }

  // ─── KPIs ────────────────────────────────────────────────────────────────────
  function renderKpis() {
    var latest = latestRow(S.raw.alq);
    var previous =
      S.raw.alq.length > 1 ? S.raw.alq[S.raw.alq.length - 2] : null;
    if (!latest) return;
    var year = String(latest.jahr || "–");
    var merk = S.raw.merk.find(function (r) {
      return String(r.jahr) === year;
    });
    var merkLatest = latestRow(S.raw.merk);
    var merkPrev =
      S.raw.merk.length > 1 ? S.raw.merk[S.raw.merk.length - 2] : null;

    setKpi("kpi-year", year);
    setKpi(
      "kpi-alq",
      fmtD(
        latest.arbeitslosenquote_ivh_auf_alle_zivilen_erwerbspersonen_am_30_06,
      ) + " %",
    );
    setKpi("kpi-al", fmtI(latest.arbeitslose_insgesamt_am_30_06));
    setKpi(
      "kpi-stellen",
      fmtI(latest.bestand_gemeldeter_offener_stellen_am_monatsende_am_30_06),
    );
    setKpi("kpi-lza", merk ? fmtI(merk.langzeitarbeitslose_am_30_06) : "–");

    setKpiTrend(
      "kpi-alq",
      trendValue(
        latest.arbeitslosenquote_ivh_auf_alle_zivilen_erwerbspersonen_am_30_06,
        previous &&
          previous.arbeitslosenquote_ivh_auf_alle_zivilen_erwerbspersonen_am_30_06,
        true,
      ),
    );
    setKpiTrend(
      "kpi-al",
      trendValue(
        latest.arbeitslose_insgesamt_am_30_06,
        previous && previous.arbeitslose_insgesamt_am_30_06,
        false,
      ),
    );
    setKpiTrend(
      "kpi-stellen",
      trendValue(
        latest.bestand_gemeldeter_offener_stellen_am_monatsende_am_30_06,
        previous &&
          previous.bestand_gemeldeter_offener_stellen_am_monatsende_am_30_06,
        false,
      ),
    );
    setKpiTrend(
      "kpi-lza",
      trendValue(
        merkLatest ? merkLatest.langzeitarbeitslose_am_30_06 : null,
        merkPrev ? merkPrev.langzeitarbeitslose_am_30_06 : null,
        false,
      ),
    );
  }

  // ─── Chart ───────────────────────────────────────────────────────────────────
  function renderChart() {
    var canvas = q("#am-chart");
    var empty = q("#chart-empty");
    if (!canvas || !window.Chart) return;

    var sel = q("#f-chart").value;
    var opt = CHART_OPTIONS.find(function (o) {
      return o.value === sel;
    });
    if (!opt) return;

    var rows = S.filtered[opt.src];
    var labels = [];
    var values = [];

    rows.forEach(function (r) {
      var v = r[opt.field];
      if (r.jahr != null && v != null) {
        labels.push(String(r.jahr));
        values.push(parseFloat(v));
      }
    });

    q("#chart-title").textContent = opt.label;
    q("#chart-range").textContent =
      S.yearFrom && S.yearTo ? S.yearFrom + " – " + S.yearTo : "Alle Jahre";

    if (!labels.length) {
      empty.classList.remove("d-none");
      canvas.style.display = "none";
      if (S.chart) {
        S.chart.destroy();
        S.chart = null;
      }
      return;
    }
    empty.classList.add("d-none");
    canvas.style.display = "";

    // COVID-Jahre 2020/2021 rot markieren
    var ptColors = labels.map(function (yr) {
      return yr === "2020" || yr === "2021"
        ? "rgba(220,53,69,1)"
        : "rgba(13,110,253,1)";
    });
    var ptRadius = labels.map(function (yr) {
      return yr === "2020" || yr === "2021" ? 7 : 4;
    });

    if (S.chart) S.chart.destroy();
    S.chart = new Chart(canvas.getContext("2d"), {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: opt.label,
            data: values,
            borderColor: "rgba(13,110,253,1)",
            backgroundColor: "rgba(13,110,253,0.1)",
            pointBackgroundColor: ptColors,
            pointRadius: ptRadius,
            fill: true,
            tension: 0.25,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (c) {
                var val =
                  c.parsed.y != null ? c.parsed.y.toLocaleString("de-DE") : "–";
                var yr = c.label;
                var suffix = yr === "2020" || yr === "2021" ? " ⚠ COVID" : "";
                return opt.label + ": " + val + suffix;
              },
            },
          },
        },
        scales: {
          y: { title: { display: true, text: opt.yLabel } },
          x: {
            title: { display: true, text: "Jahr" },
            ticks: { maxRotation: 45 },
          },
        },
      },
    });
  }

  // ─── Tabellen ────────────────────────────────────────────────────────────────
  function renderTables() {
    renderTableAlq();
    renderTableMerk();
    renderTableAlter();
    renderTableFlow();
  }

  function renderTableAlq() {
    var rows = S.filtered.alq;
    var newestYear = latestRow(rows) ? String(latestRow(rows).jahr) : "";
    var html = !rows.length
      ? '<tr><td colspan="10" class="text-center text-muted py-4">Keine Daten.</td></tr>'
      : rows
          .map(function (r) {
            return (
              '<tr class="' +
              rowStateClass(r, newestYear) +
              '">' +
              '<td class="am-num"><strong>' +
              escapeHtml(r.jahr) +
              "</strong>" +
              rowBadges(r, newestYear) +
              "</td>" +
              numCell(r.arbeitslose_mannlich_am_30_06, false, false) +
              numCell(r.arbeitslose_weiblich_am_30_06, false, false) +
              numCell(r.arbeitslose_insgesamt_am_30_06, false, true) +
              numCell(
                r.arbeitslosenquote_ivh_auf_abhangig_zivile_erwerbspersonen_am_30_06,
                true,
                false,
              ) +
              numCell(
                r.arbeitslosenquote_ivh_auf_alle_zivilen_erwerbspersonen_am_30_06,
                true,
                true,
              ) +
              numCell(
                r.bestand_gemeldeter_offener_stellen_am_monatsende_am_30_06,
                false,
                false,
              ) +
              numCell(r.arbeitslose_insgesamt_am_31_12, false, true) +
              numCell(
                r.arbeitslosennquote_ivh_auf_alle_zivilen_erwerbspersonen_am_31_12,
                true,
                true,
              ) +
              numCell(
                r.bestand_gemeldeter_offener_stellen_am_monatsende_am_31_12,
                false,
                false,
              ) +
              "</tr>"
            );
          })
          .join("");
    q("#tbody-alq").innerHTML = html;
  }

  function renderTableMerk() {
    var rows = S.filtered.merk;
    var newestYear = latestRow(rows) ? String(latestRow(rows).jahr) : "";
    var html = !rows.length
      ? '<tr><td colspan="8" class="text-center text-muted py-4">Keine Daten.</td></tr>'
      : rows
          .map(function (r) {
            return (
              '<tr class="' +
              rowStateClass(r, newestYear) +
              '">' +
              '<td class="am-num"><strong>' +
              escapeHtml(r.jahr) +
              "</strong>" +
              rowBadges(r, newestYear) +
              "</td>" +
              numCell(r.nichtdeutsche_am_30_06, false, false) +
              numCell(r.schwerbehinderte_am_30_06, false, false) +
              numCell(r.teilzeitarbeitssuchende_am_30_06, false, false) +
              numCell(r.langzeitarbeitslose_am_30_06, false, true) +
              numCell(r.nichtdeutsche_am_31_12, false, false) +
              numCell(r.schwerbehinderte_am_31_12, false, false) +
              numCell(r.langzeitarbeitslose_am_31_12, false, true) +
              "</tr>"
            );
          })
          .join("");
    q("#tbody-merk").innerHTML = html;
  }

  function renderTableAlter() {
    var rows = S.filtered.alter;
    var newestYear = latestRow(rows) ? String(latestRow(rows).jahr) : "";
    var html = !rows.length
      ? '<tr><td colspan="12" class="text-center text-muted py-4">Keine Daten.</td></tr>'
      : rows
          .map(function (r) {
            return (
              '<tr class="' +
              rowStateClass(r, newestYear) +
              '">' +
              '<td class="am-num"><strong>' +
              escapeHtml(r.jahr) +
              "</strong>" +
              rowBadges(r, newestYear) +
              "</td>" +
              numCell(r.insgesamt_am_30_06, false, true) +
              numCell(r.bis_unter_20_jahre_am_30_06, false, false) +
              numCell(r["20_bis_unter_25_jahre_am_30_06"], false, false) +
              numCell(r["25_bis_unter_50_jahre_am_30_06"], false, false) +
              numCell(r["50_bis_unter_55_jahre_am_30_06"], false, false) +
              numCell(r["55_jahre_und_alter_am_30_06"], false, false) +
              numCell(r.insgesamt_am_31_12, false, true) +
              numCell(r.bis_unter_20_jahre_am_31_12, false, false) +
              numCell(r["20_bis_unter_25_jahre_am_31_12"], false, false) +
              numCell(r["25_bis_unter_50_jahre_am_31_12"], false, false) +
              numCell(r["55_jahre_und_alter_am_31_12"], false, false) +
              "</tr>"
            );
          })
          .join("");
    q("#tbody-alter").innerHTML = html;
  }

  function renderTableFlow() {
    var rows = S.filtered.flow;
    var newestYear = latestRow(rows) ? String(latestRow(rows).jahr) : "";
    var html = !rows.length
      ? '<tr><td colspan="7" class="text-center text-muted py-4">Keine Daten.</td></tr>'
      : rows
          .map(function (r) {
            return (
              '<tr class="' +
              rowStateClass(r, newestYear) +
              '">' +
              '<td class="am-num"><strong>' +
              escapeHtml(r.jahr) +
              "</strong>" +
              rowBadges(r, newestYear) +
              "</td>" +
              numCell(r.zugang_arbeitslosen, false, true) +
              numCell(
                r.arbeitslose_nach_vorheriger_erwerbstatigkeit,
                false,
                false,
              ) +
              numCell(
                r.arbeitslose_nach_vorheriger_betrieblicher_ausbildung,
                false,
                false,
              ) +
              numCell(
                r.arbeitslose_ohne_vorherige_erwerbstatigkeit,
                false,
                false,
              ) +
              numCell(r.abgang_arbeitslose, false, true) +
              numCell(r.abgang_arbeitslose_in_erwerbstatigkeit, false, false) +
              "</tr>"
            );
          })
          .join("");
    q("#tbody-flow").innerHTML = html;
  }

  function updateTableMeta() {
    var meta = {
      alq: { title: "ALQ &amp; Offene Stellen", rows: S.filtered.alq },
      merk: { title: "Merkmale Arbeitsloser", rows: S.filtered.merk },
      alter: { title: "Altersgruppen", rows: S.filtered.alter },
      flow: { title: "Zu- und Abgang Arbeitslose", rows: S.filtered.flow },
    };
    var m = meta[S.activeTable];
    if (!m) return;
    q("#table-title").innerHTML =
      m.title +
      (S.yearFrom && S.yearTo ? " (" + S.yearFrom + "–" + S.yearTo + ")" : "");
    q("#table-badge").textContent = m.rows.length + " Einträge";
  }

  function collectAvailableYears(raw) {
    var yearMap = {};
    ["alq", "merk", "alter", "flow"].forEach(function (key) {
      (raw[key] || []).forEach(function (r) {
        var y = String(r && r.jahr != null ? r.jahr : "").trim();
        if (/^\d{4}$/.test(y)) yearMap[y] = true;
      });
    });
    return Object.keys(yearMap).sort();
  }

  // ─── Hilfsfunktionen ─────────────────────────────────────────────────────────
  function kpiCard(id, label, sub, showTrend, kontext) {
    var k = String(kontext || "").trim();
    var kontextHtml = k
      ? '<button class="am-kpi-info-toggle collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#am-kpi-kontext-' + id + '" aria-expanded="false" aria-controls="am-kpi-kontext-' + id + '" aria-label="Erklärung zu diesem Wert"><span class="am-kpi-info-icon" aria-hidden="true">ⓘ</span></button>' +
        '<div id="am-kpi-kontext-' + id + '" class="collapse"><div class="am-kpi-kontext">' + escapeHtml(k) + "</div></div>"
      : "";
    return (
      '<div class="col-sm-6 col-xl">' +
      '<div class="card h-100 shadow-sm border-0 bg-light">' +
      '<div class="card-body py-3">' +
      '<div class="text-muted small">' +
      escapeHtml(label) +
      "</div>" +
      '<div class="fs-4 fw-semibold am-kpi-value" id="' +
      id +
      '">–</div>' +
      (showTrend
        ? '<div class="am-kpi-trend" id="' + id + '-trend"></div>'
        : "") +
      (sub
        ? '<div class="text-muted" style="font-size:.72rem">' +
          escapeHtml(sub) +
          "</div>"
        : "") +
      kontextHtml +
      "</div></div></div>"
    );
  }

  function setKpi(id, val) {
    var el = q("#" + id);
    if (el) el.textContent = val;
  }

  function setKpiTrend(id, html) {
    var el = q("#" + id + "-trend");
    if (el) el.innerHTML = html || "";
  }

  function fmtD(v) {
    if (v == null || !isFinite(parseFloat(v))) return "–";
    return parseFloat(v).toLocaleString("de-DE", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }

  function fmtI(v) {
    if (v == null || !isFinite(parseFloat(v))) return "–";
    return Math.round(parseFloat(v)).toLocaleString("de-DE");
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderWeitereInfos(cfg) {
    var links = String((cfg && cfg.weiterfuehrendeLinks) || "").trim();
    if (!links) return "";
    return (
      '<div class="card border-0 shadow-sm mt-4"><div class="card-body">' +
      '<h2 class="h5 mb-2">Weitere Informationen</h2>' +
      "<div>" +
      links +
      "</div></div></div>"
    );
  }

  function renderMethodikbox(cfg) {
    var hinweis = String((cfg && cfg.datenquelleHinweis) || "").trim();
    var stand = String((cfg && cfg.datenStand) || "").trim();
    if (!hinweis && !stand) return "";
    var standHtml = stand
      ? '<p class="text-muted small mb-2">' + escapeHtml(stand) + "</p>"
      : "";
    return (
      '<div class="card border-0 shadow-sm mt-4"><div class="card-body">' +
      '<button class="am-methodik-toggle btn btn-link text-decoration-none d-flex w-100 justify-content-between align-items-center p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#am-methodik-body" aria-expanded="false" aria-controls="am-methodik-body">' +
      '<h2 class="h5 mb-0">Methodik &amp; Datenquelle</h2>' +
      '<span class="am-methodik-chevron" aria-hidden="true">&#9662;</span>' +
      "</button>" +
      '<div id="am-methodik-body" class="collapse mt-2">' +
      standHtml +
      hinweis +
      "</div>" +
      "</div></div>"
    );
  }

  function hostFromUrl(url) {
    try {
      return new URL(url).host;
    } catch (e) {
      return "";
    }
  }

  function q(sel) {
    return enclosingHtmlDivElement.querySelector(sel);
  }

  function showAlert(type, text) {
    var el = q("#am-alert");
    if (el)
      el.innerHTML =
        '<div class="alert alert-' + type + ' py-2">' + escapeHtml(text) + "</div>";
  }

  function clearAlert() {
    var el = q("#am-alert");
    if (el) el.innerHTML = "";
  }

  function setLoading(on) {
    var btn = q("#am-reload");
    if (btn) {
      btn.disabled = on;
      btn.textContent = on ? "↻ Lade …" : "↻ Neu laden";
    }
  }

  function fillYearSelects(years) {
    var fromSel = q("#f-from");
    var toSel = q("#f-to");
    fromSel.innerHTML = years
      .map(function (y) {
        return (
          '<option value="' +
          y +
          '"' +
          (y === S.yearFrom ? " selected" : "") +
          ">" +
          y +
          "</option>"
        );
      })
      .join("");
    toSel.innerHTML = years
      .slice()
      .reverse()
      .map(function (y) {
        return (
          '<option value="' +
          y +
          '"' +
          (y === S.yearTo ? " selected" : "") +
          ">" +
          y +
          "</option>"
        );
      })
      .join("");
  }

  async function ensureChartJs() {
    if (window.Chart) return;
    if (S.chartJsReady) return;
    await new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/chart.js";
      s.async = true;
      s.onload = function () {
        S.chartJsReady = true;
        resolve();
      };
      s.onerror = function () {
        reject(new Error("Chart.js konnte nicht geladen werden."));
      };
      document.head.appendChild(s);
    });
  }

  return null;
}

/*
 * addToHead() – Chart.js wird dynamisch in ensureChartJs() geladen.
 * Kein Leaflet nötig (keine Koordinatenfelder in den Datensätzen).
 */
function addToHead() {}
