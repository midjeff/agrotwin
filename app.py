"""
Agro-Twin — главный файл Flask-приложения.
Запуск: python app.py
Открыть в браузере: http://localhost:5000
"""

from flask import Flask, render_template, jsonify, request
import random
import math

app = Flask(__name__)

# ─── Страницы ──────────────────────────────────────────────────────────────────

@app.route("/")
def landing():
    return render_template("landing.html")

@app.route("/monitoring")
def index():
    return render_template("index.html")


# ─── API: Список полей (GeoJSON) ───────────────────────────────────────────────

@app.route("/api/fields")
def get_fields():
    """
    Возвращает GeoJSON с полигонами полей.
    В реальном проекте — читай из БД или .geojson файла.
    """
    fields = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "id": "field_01",
                    "name": "Поле А-01",
                    "crop": "Пшеница",
                    "area_ha": 142.5,
                    "ndvi": 0.72,
                    "anomaly": 0.15
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [71.42, 51.18], [71.46, 51.18],
                        [71.46, 51.21], [71.42, 51.21],
                        [71.42, 51.18]
                    ]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "id": "field_02",
                    "name": "Поле Б-02",
                    "crop": "Ячмень",
                    "area_ha": 89.3,
                    "ndvi": 0.54,
                    "anomaly": 0.63
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [71.48, 51.18], [71.53, 51.18],
                        [71.53, 51.22], [71.48, 51.22],
                        [71.48, 51.18]
                    ]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "id": "field_03",
                    "name": "Поле В-03",
                    "crop": "Рапс",
                    "area_ha": 201.0,
                    "ndvi": 0.81,
                    "anomaly": 0.08
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [71.42, 51.23], [71.47, 51.23],
                        [71.47, 51.27], [71.42, 51.27],
                        [71.42, 51.23]
                    ]]
                }
            }
        ]
    }
    return jsonify(fields)


# ─── API: Динамика NDVI для поля ──────────────────────────────────────────────

@app.route("/api/field/<field_id>/dynamics")
def get_dynamics(field_id):
    """
    Возвращает временные ряды: Raw NDVI + Digital Twin NDVI.
    В реальном проекте — загружай из Sentinel-2 + результаты VMAE.
    """
    # Генерируем 24 точки (2 года по месяцам)
    dates = []
    raw_ndvi = []
    twin_ndvi = []

    seed = sum(ord(c) for c in field_id)
    random.seed(seed)

    for i in range(24):
        month = i % 12
        # Сезонная кривая вегетации
        seasonal = 0.3 + 0.5 * math.sin(math.pi * (month - 1) / 6) if month < 9 else \
                   0.3 + 0.5 * math.sin(math.pi * (month - 1) / 6)
        seasonal = max(0.1, min(0.95, seasonal))

        year = 2023 + i // 12
        dates.append(f"{year}-{month+1:02d}-15")
        # Raw — с шумом и пропусками (облачность)
        noise = random.uniform(-0.12, 0.12)
        raw = round(max(0.05, min(0.95, seasonal + noise)), 3)
        raw_ndvi.append(raw if random.random() > 0.15 else None)  # 15% пропусков
        # Digital Twin — сглаженная восстановленная VMAE
        twin_ndvi.append(round(seasonal + random.uniform(-0.03, 0.03), 3))

    return jsonify({
        "field_id": field_id,
        "dates": dates,
        "raw_ndvi": raw_ndvi,
        "twin_ndvi": twin_ndvi
    })


# ─── API: Латентное пространство Z1-Z2 ────────────────────────────────────────

@app.route("/api/field/<field_id>/latent_space")
def get_latent_space(field_id):
    """
    Возвращает траекторию поля в латентном пространстве VMAE (Z1, Z2).
    Z1 — накопление биомассы, Z2 — биофизический стресс.
    """
    seed = sum(ord(c) for c in field_id)
    random.seed(seed)

    points = []
    for i in range(24):
        month = i % 12
        # Z1 коррелирует с биомассой (сезонно)
        z1 = round(math.sin(math.pi * month / 11) * 2.0 + random.uniform(-0.3, 0.3), 3)
        # Z2 — стресс (выше в засушливые периоды)
        z2 = round(random.uniform(-1.5, 0.5) - 0.5 * math.sin(math.pi * month / 11), 3)
        year = 2023 + i // 12
        ndvi = round(0.3 + 0.5 * max(0, math.sin(math.pi * (month - 1) / 6)), 3)
        points.append({
            "date": f"{year}-{month+1:02d}-15",
            "z1": z1,
            "z2": z2,
            "ndvi": ndvi
        })

    return jsonify({"field_id": field_id, "points": points})


# ─── API: What-if сценарий ─────────────────────────────────────────────────────

@app.route("/api/field/<field_id>/scenario", methods=["POST"])
def run_scenario(field_id):
    """
    Принимает delta_temp и delta_precip, возвращает Scenario NDVI.
    В реальном проекте — здесь вызов TSN Dynamics + VMAE decoder.
    Калман-фильтр применяется для сглаживания шума.
    """
    data = request.get_json()
    delta_temp = float(data.get("delta_temp", 0))       # °C: -5..+5
    delta_precip = float(data.get("delta_precip", 0))   # %: -50..+50

    seed = sum(ord(c) for c in field_id)
    random.seed(seed + 42)

    # Коэффициенты влияния (упрощённая модель TSN)
    temp_penalty = -0.04 * delta_temp if delta_temp > 0 else 0.02 * abs(delta_temp)
    precip_effect = 0.03 * (delta_precip / 10)

    dates = []
    scenario_ndvi = []

    for i in range(24):
        month = i % 12
        year = 2023 + i // 12
        # Базовая сезонная кривая + сценарные поправки
        base = 0.3 + 0.5 * max(0, math.sin(math.pi * (month - 1) / 6))
        scenario = max(0.05, min(0.95, base + temp_penalty + precip_effect + random.uniform(-0.02, 0.02)))
        dates.append(f"{year}-{month+1:02d}-15")
        scenario_ndvi.append(round(scenario, 3))

    return jsonify({
        "field_id": field_id,
        "scenario_ndvi": scenario_ndvi,
        "dates": dates,
        "params": {"delta_temp": delta_temp, "delta_precip": delta_precip}
    })


# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 50)
    print("  Agro-Twin запущен!")
    print("  Открой в браузере: http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000)