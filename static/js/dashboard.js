/* ═══════════════════════════════════════════════════════════════
   Agro-Twin · Dashboard Scripts
   dashboard.js
═══════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════
// СОСТОЯНИЕ ПРИЛОЖЕНИЯ
// ═══════════════════════════════════════════════════════
const state = {
  selectedFieldId: null,
  currentLayer: 'raw',
  scenarioData: null,
  fieldsData: null,
};

// ═══════════════════════════════════════════════════════
// 1. КАРТА (Leaflet)
// ═══════════════════════════════════════════════════════
const map = L.map('map', {
  center: [54.255, 69.465],
  zoom: 13,
  zoomControl: true,
});

L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { attribution: 'Esri · Sentinel-2 overlay', maxZoom: 19 }
).addTo(map);

let fieldsLayer = null;

function ndviColor(ndvi, layer) {
  if (layer === 'anomaly') {
    const v = ndvi;
    const r = Math.round(255 * v);
    const g = Math.round(50 * (1 - v));
    return `rgba(${r},${g},50,0.6)`;
  }
  const t = Math.max(0, Math.min(1, ndvi));
  if (t < 0.5) {
    const g = Math.round(68 + (158 - 68) * (t * 2));
    return `rgba(239,${g},68,0.65)`;
  } else {
    const r = Math.round(245 - (245 - 34) * ((t - 0.5) * 2));
    return `rgba(${r},197,34,0.65)`;
  }
}

function loadFields() {
  fetch('/api/fields')
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(data => {
      state.fieldsData = data;
      renderFields();
      // Автоматически центрировать карту на полигонах
      if (fieldsLayer) {
        try { map.fitBounds(fieldsLayer.getBounds(), { padding: [30, 30] }); } catch(e) {}
      }
    })
    .catch(err => console.error('[Agro-Twin] /api/fields error:', err));
}

function renderFields() {
  if (fieldsLayer) { map.removeLayer(fieldsLayer); }

  fieldsLayer = L.geoJSON(state.fieldsData, {
    style: feature => {
      const p = feature.properties;
      const val = state.currentLayer === 'anomaly' ? p.anomaly : p.ndvi;
      return {
        fillColor: ndviColor(val, state.currentLayer),
        fillOpacity: 0.65,
        color: state.selectedFieldId === p.id ? '#1a5c24' : '#3a7d44',
        weight: state.selectedFieldId === p.id ? 4 : 2.5,
        opacity: 1,
      };
    },
    onEachFeature: (feature, layer) => {
      const p = feature.properties;

      layer.on('click', () => {
        state.selectedFieldId = p.id;
        renderFields();
        updateInfoBar(p);
        loadDynamics(p.id);
        loadLatent(p.id);
        layer.openPopup();
      });

      const anomalyClass = p.anomaly > 0.5 ? 'danger' : p.anomaly > 0.25 ? 'warn' : 'good';
      const ndviPct = Math.round(p.ndvi * 100);

      layer.bindPopup(`
        <div style="min-width:200px;">
          <div class="popup-title">📍 ${p.name}</div>
          <div class="popup-row">
            <span class="popup-label">Культура</span>
            <span class="popup-val">${p.crop}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">Площадь</span>
            <span class="popup-val">${p.area_ha} га</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">NDVI</span>
            <span class="popup-val" style="color:#3a7d44">${p.ndvi.toFixed(3)}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">Аномалия</span>
            <span class="popup-val" style="color:${
              anomalyClass==='danger' ? '#c0392b' :
              anomalyClass==='warn'   ? '#b45309' : '#2d7a35'
            }">
              ${(p.anomaly * 100).toFixed(0)}%
            </span>
          </div>
          <div class="ndvi-bar">
            <div class="ndvi-marker" style="left:${ndviPct}%"></div>
          </div>
        </div>
      `);
    }
  }).addTo(map);
}

function setLayer(layerName) {
  state.currentLayer = layerName;
  document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('layer-label').textContent =
    { raw: 'RAW NDVI', twin: 'DIGITAL TWIN', anomaly: 'ANOMALY SCORE' }[layerName];
  renderFields();
}

// ═══════════════════════════════════════════════════════
// 2. INFO BAR
// ═══════════════════════════════════════════════════════
function updateInfoBar(props) {
  document.getElementById('chip-field').textContent = props.name;
  document.getElementById('chip-crop').textContent  = props.crop;
  document.getElementById('chip-area').textContent  = props.area_ha + ' га';

  const ndviEl = document.getElementById('chip-ndvi');
  ndviEl.textContent = props.ndvi.toFixed(3);
  ndviEl.className = 'chip-val ' +
    (props.ndvi > 0.6 ? 'good' : props.ndvi > 0.4 ? 'warn' : 'danger');

  const anEl = document.getElementById('chip-anomaly');
  anEl.textContent = (props.anomaly * 100).toFixed(0) + '%';
  anEl.className = 'chip-val ' +
    (props.anomaly < 0.25 ? 'good' : props.anomaly < 0.5 ? 'warn' : 'danger');
}

// ═══════════════════════════════════════════════════════
// 3. СЛАЙДЕРЫ WHAT-IF
// ═══════════════════════════════════════════════════════
function updateSlider(type) {
  if (type === 'temp') {
    const v = parseFloat(document.getElementById('temp-slider').value);
    document.getElementById('temp-val').textContent =
      (v >= 0 ? '+' : '') + v.toFixed(1) + '°C';
  } else {
    const v = parseFloat(document.getElementById('precip-slider').value);
    document.getElementById('precip-val').textContent =
      (v >= 0 ? '+' : '') + v + '%';
  }
}

function runScenario() {
  if (!state.selectedFieldId) {
    alert('Сначала выберите поле на карте!');
    return;
  }

  const btn = document.getElementById('run-btn');
  btn.classList.add('loading');
  btn.textContent = '⏳ МОДЕЛИРОВАНИЕ...';

  const deltaTemp   = parseFloat(document.getElementById('temp-slider').value);
  const deltaPrecip = parseFloat(document.getElementById('precip-slider').value);

  fetch(`/api/field/${state.selectedFieldId}/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delta_temp: deltaTemp, delta_precip: deltaPrecip })
  })
    .then(r => r.json())
    .then(data => {
      state.scenarioData = data;
      updateTimeseriesChart(data);

      const avgNDVI = (
        data.scenario_ndvi.reduce((a, b) => a + b, 0) /
        data.scenario_ndvi.length
      ).toFixed(3);

      document.getElementById('scenario-summary').textContent =
        `Avg NDVI = ${avgNDVI} · Δtemp ${deltaTemp > 0 ? '+' : ''}${deltaTemp}°C · Δprecip ${deltaPrecip > 0 ? '+' : ''}${deltaPrecip}%`;

      document.getElementById('scenario-result').classList.add('visible');
    })
    .finally(() => {
      btn.classList.remove('loading');
      btn.textContent = '▶ ЗАПУСТИТЬ СЦЕНАРИЙ';
    });
}

// ═══════════════════════════════════════════════════════
// 4. ГРАФИК ВРЕМЕННОГО РЯДА
// ═══════════════════════════════════════════════════════
let tsChart = null;

function loadDynamics(fieldId) {
  document.getElementById('ts-loading').classList.remove('hidden');

  fetch(`/api/field/${fieldId}/dynamics`)
    .then(r => r.json())
    .then(data => { initTimeseriesChart(data); })
    .finally(() => {
      document.getElementById('ts-loading').classList.add('hidden');
    });
}

function initTimeseriesChart(data) {
  const ctx = document.getElementById('timeseries-chart').getContext('2d');

  // Фильтруем null и отрицательные значения (облака, шум сенсора)
  const rawPoints  = data.dates
    .map((d, i) => (data.raw_ndvi[i] !== null && data.raw_ndvi[i] > 0) ? { x: d, y: data.raw_ndvi[i] } : null)
    .filter(Boolean);

  const twinPoints = data.dates.map((d, i) => ({ x: d, y: data.twin_ndvi[i] }));

  if (tsChart) { tsChart.destroy(); }

  tsChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Raw NDVI',
          data: rawPoints,
          borderColor: 'rgba(59,130,246,0.9)',
          backgroundColor: 'rgba(59,130,246,0.15)',
          borderWidth: 1.5,
          borderDash: [3, 3],
          pointRadius: 3,
          pointBackgroundColor: 'rgba(59,130,246,0.85)',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          tension: 0.3,
          fill: false,
          showLine: true,
        },
        {
          label: 'Digital Twin NDVI',
          data: twinPoints,
          borderColor: '#2d7d46',
          backgroundColor: 'rgba(45,125,70,0.08)',
          pointRadius: 0,
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
        },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          borderColor: '#c8d9bc',
          borderWidth: 1,
          titleColor: '#1e2d1a',
          bodyColor: '#6b8060',
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(3) ?? '—'}`
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: { unit: 'month', displayFormats: { month: 'MMM yy' } },
          grid: { color: 'rgba(200,217,188,0.6)' },
          ticks: { color: '#6b8060', font: { family: 'monospace', size: 10 } }
        },
        y: {
          min: 0, max: 1,
          grid: { color: 'rgba(200,217,188,0.6)' },
          ticks: { color: '#6b8060', font: { family: 'monospace', size: 10 } }
        }
      }
    }
  });
}

function updateTimeseriesChart(scenarioData) {
  if (!tsChart) return;

  tsChart.data.datasets = tsChart.data.datasets.filter(d => d.label !== 'Scenario NDVI');

  const scenPoints = scenarioData.dates.map((d, i) => ({
    x: d, y: scenarioData.scenario_ndvi[i]
  }));

  tsChart.data.datasets.push({
    label: 'Scenario NDVI',
    data: scenPoints,
    borderColor: '#8db548',
    backgroundColor: 'rgba(141,181,72,0.06)',
    pointRadius: 0,
    borderWidth: 2,
    borderDash: [6, 3],
    tension: 0.4,
    fill: false,
  });

  tsChart.update();
}

// ═══════════════════════════════════════════════════════
// 5. SCATTER PLOT ЛАТЕНТНОГО ПРОСТРАНСТВА
// ═══════════════════════════════════════════════════════
let latentChart = null;

function loadLatent(fieldId) {
  document.getElementById('latent-loading').classList.remove('hidden');

  fetch(`/api/field/${fieldId}/latent_space`)
    .then(r => r.json())
    .then(data => { initLatentChart(data); })
    .finally(() => {
      document.getElementById('latent-loading').classList.add('hidden');
    });
}

function initLatentChart(data) {
  const ctx = document.getElementById('latent-chart').getContext('2d');

  const points = data.points.map((p, i) => ({
    x: p.z1, y: p.z2,
    ndvi: p.ndvi,
    date: p.date,
    idx: i,
  }));

  if (latentChart) { latentChart.destroy(); }

  latentChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Поле',
        data: points,
        pointRadius: ctx2 => ctx2.dataIndex === points.length - 1 ? 8 : 5,
        pointBackgroundColor: points.map(p => {
          if (p.ndvi > 0.65) return '#3a7d44';
          if (p.ndvi > 0.45) return '#8db548';
          return '#c0392b';
        }),
        pointBorderColor: 'rgba(30,45,26,0.15)',
        pointBorderWidth: 1,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          borderColor: '#c8d9bc',
          borderWidth: 1,
          titleColor: '#1e2d1a',
          bodyColor: '#6b8060',
          callbacks: {
            title: items => (items && items[0] && points[items[0].dataIndex]) ? points[items[0].dataIndex].date : '',
            label: items => {
              if (!items || !items[0] || !points[items[0].dataIndex]) return [];
              const p = points[items[0].dataIndex];
              return [
                ` Z₁ (биомасса): ${p.x.toFixed(3)}`,
                ` Z₂ (стресс): ${p.y.toFixed(3)}`,
                ` NDVI: ${p.ndvi.toFixed(3)}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Z₁ — Накопление биомассы',
            color: '#6b8060',
            font: { family: 'monospace', size: 10 }
          },
          grid: { color: 'rgba(200,217,188,0.6)' },
          ticks: { color: '#6b8060', font: { family: 'monospace', size: 9 } }
        },
        y: {
          title: {
            display: true,
            text: 'Z₂ — Биофизический стресс',
            color: '#6b8060',
            font: { family: 'monospace', size: 10 }
          },
          grid: { color: 'rgba(200,217,188,0.6)' },
          ticks: { color: '#6b8060', font: { family: 'monospace', size: 9 } }
        }
      }
    }
  });
}

// ═══════════════════════════════════════════════════════
// МУЛЬТИЯЗЫЧНОСТЬ ДАШБОРДА
// ═══════════════════════════════════════════════════════
const dbI18n = {
  ru: {
    "back":          "На главную",
    "breadcrumb":    "/ МОНИТОРИНГ",
    "subtitle":      "VMAE + TSN Dynamics + Kalman Filter",
    "live":          "LIVE · Sentinel-2 / MODIS / SMAP",
    "chip.field":    "ПОЛЕ",
    "chip.crop":     "КУЛЬТУРА",
    "chip.area":     "ПЛОЩАДЬ",
    "chip.ndvi":     "NDVI",
    "chip.anomaly":  "АНОМАЛИЯ",
    "chip.vmae":     "VMAE ACCURACY",
    "chip.tsn":      "TSN ACCURACY",
    "map.title":     "Интерактивная карта полей",
    "whatif.title":  "Сценарное моделирование «What-if»",
    "latent.title":  "Латентный анализ VMAE Core",
    "ts.title":      "Динамика и прогноз NDVI",
    "btn.run":       "▶ ЗАПУСТИТЬ СЦЕНАРИЙ",
    "temp.label":    "🌡️ ТЕМПЕРАТУРА (Δ°C)",
    "precip.label":  "🌧️ ОСАДКИ (Δ%)",
    "kalman.label":  "KALMAN FILTER STATUS",
    "kalman.status": "Active · Noise correction ON",
    "result.label":  "Scenario NDVI · Прогноз:",
  },
  kz: {
    "back":          "Басты бет",
    "breadcrumb":    "/ МОНИТОРИНГ",
    "subtitle":      "VMAE + TSN Dynamics + Калман сүзгісі",
    "live":          "LIVE · Sentinel-2 / MODIS / SMAP",
    "chip.field":    "ӨРІС",
    "chip.crop":     "ДАҚЫЛ",
    "chip.area":     "АУДАН",
    "chip.ndvi":     "NDVI",
    "chip.anomaly":  "АНОМАЛИЯ",
    "chip.vmae":     "VMAE ДӘЛДІГІ",
    "chip.tsn":      "TSN ДӘЛДІГІ",
    "map.title":     "Интерактивті өрістер картасы",
    "whatif.title":  "«What-if» сценарийлік модельдеу",
    "latent.title":  "VMAE Core жасырын талдауы",
    "ts.title":      "NDVI динамикасы және болжамы",
    "btn.run":       "▶ СЦЕНАРИЙДІ ІСКЕ ҚОСУ",
    "temp.label":    "🌡️ ТЕМПЕРАТУРА (Δ°C)",
    "precip.label":  "🌧️ ЖАУЫН-ШАШЫН (Δ%)",
    "kalman.label":  "KALMAN FILTER КҮЙІ",
    "kalman.status": "Белсенді · Шу түзету ҚОСУЛЫ",
    "result.label":  "Scenario NDVI · Болжам:",
  }
};

function dbSetLang(lang) {
  localStorage.setItem('agrotwin_lang', lang);

  /* Кнопки */
  document.querySelectorAll('.db-lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });

  const t = dbI18n[lang];

  /* Навбар */
  const backEl = document.querySelector('.db-back');
  if (backEl) backEl.lastChild.textContent = ' ' + t['back'];

  const bcEl = document.querySelector('.db-breadcrumb');
  if (bcEl) bcEl.textContent = t['breadcrumb'];

  const subEl = document.querySelector('.db-subtitle');
  if (subEl) subEl.textContent = t['subtitle'];

  const liveEl = document.querySelector('.db-status');
  if (liveEl) liveEl.lastChild.textContent = ' ' + t['live'];

  /* Chip labels */
  const chips    = document.querySelectorAll('.info-chip .chip-label');
  const chipKeys = ['chip.field','chip.crop','chip.area','chip.ndvi','chip.anomaly','chip.vmae','chip.tsn'];
  chips.forEach((el, i) => { if (chipKeys[i]) el.textContent = t[chipKeys[i]]; });

  /* Заголовки карточек */
  const cardTitles = document.querySelectorAll('.card-title');
  const titleKeys  = ['map.title','whatif.title','latent.title','ts.title'];
  cardTitles.forEach((el, i) => { if (titleKeys[i]) el.textContent = t[titleKeys[i]]; });

  /* Слайдеры */
  const sliderNames = document.querySelectorAll('.slider-name');
  if (sliderNames[0]) sliderNames[0].textContent = t['temp.label'];
  if (sliderNames[1]) sliderNames[1].textContent = t['precip.label'];

  /* Кнопка RUN */
  const runBtn = document.getElementById('run-btn');
  if (runBtn && !runBtn.classList.contains('loading')) runBtn.textContent = t['btn.run'];

  /* result-label */
  const resultLabel = document.querySelector('.result-label');
  if (resultLabel) resultLabel.textContent = t['result.label'];

  document.documentElement.lang = lang === 'kz' ? 'kk' : 'ru';
}

// ═══════════════════════════════════════════════════════
// ЗАПУСК
// ═══════════════════════════════════════════════════════
loadFields();

/* Восстанавливаем язык из localStorage */
(function () {
  const saved = localStorage.getItem('agrotwin_lang') || 'ru';
  dbSetLang(saved);
})();