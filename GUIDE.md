# Agro-Twin · Пошаговый гайд запуска

## Структура проекта

```
agro_twin/
├── app.py              ← Flask-сервер (весь backend)
├── requirements.txt    ← список зависимостей Python
└── templates/
    └── index.html      ← весь frontend (карта + графики + UI)
```

---

## Шаг 1 — Установи Python

Скачай Python 3.10+ с https://python.org/downloads  
При установке **обязательно** поставь галочку **«Add to PATH»**.

Проверь в терминале:
```bash
python --version
# должно вывести: Python 3.10.x или выше
```

---

## Шаг 2 — Создай папку проекта

```bash
mkdir agro_twin
cd agro_twin
mkdir templates
```

---

## Шаг 3 — Положи файлы в папки

| Файл            | Куда класть                  |
|-----------------|------------------------------|
| `app.py`        | `agro_twin/app.py`           |
| `requirements.txt` | `agro_twin/requirements.txt` |
| `index.html`    | `agro_twin/templates/index.html` |

---

## Шаг 4 — Создай виртуальное окружение и установи Flask

```bash
# Находясь в папке agro_twin/:
python -m venv venv

# Активируй окружение:
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Установи Flask:
pip install -r requirements.txt
```

---

## Шаг 5 — Запусти сервер

```bash
python app.py
```

В терминале появится:
```
==================================================
  Agro-Twin запущен!
  Открой в браузере: http://localhost:5000
==================================================
```

Открой в браузере: **http://localhost:5000**

---

## Как пользоваться дашбордом

| Действие | Результат |
|----------|-----------|
| Клик на поле на карте | Поле выделяется, загружается NDVI динамика и латентное пространство |
| Кнопки «Raw NDVI / Digital Twin / Anomaly Score» | Меняется цветовая заливка полей |
| Ползунки Температуры и Осадков | Задают параметры What-if сценария |
| Кнопка «Запустить сценарий» | Добавляет оранжевую линию Scenario NDVI на нижний график |
| Наведение на точки scatter plot | Показывает дату, Z₁, Z₂, NDVI |

---

## Как подключить реальные данные

### 1. Реальные GeoJSON-поля
В `app.py`, функция `get_fields()`:
```python
# Замени заглушку на чтение файла:
import json
with open("fields.geojson", "r") as f:
    fields = json.load(f)
return jsonify(fields)
```

### 2. Реальные данные NDVI (Sentinel-2)
В `app.py`, функция `get_dynamics()`:
```python
# Замени генератор на загрузку из CSV/БД:
import pandas as pd
df = pd.read_csv(f"data/{field_id}_ndvi.csv")
return jsonify({
    "dates": df["date"].tolist(),
    "raw_ndvi": df["raw"].tolist(),
    "twin_ndvi": df["twin"].tolist()
})
```

### 3. Подключение VMAE / TSN моделей
В `app.py`, функция `run_scenario()`:
```python
# Замени упрощённую модель на реальную:
from models.tsn import TSNDynamics
from models.vmae import VMAEDecoder

tsn = TSNDynamics.load("checkpoints/tsn_best.pt")
vmae = VMAEDecoder.load("checkpoints/vmae_best.pt")

scenario_ndvi = tsn.predict(field_id, delta_temp, delta_precip)
return jsonify({"scenario_ndvi": scenario_ndvi, "dates": dates})
```

### 4. Mapbox GL JS вместо Leaflet (опционально)
Замени в `index.html` Leaflet на Mapbox для более красивой спутниковой подложки:
1. Зарегистрируйся на mapbox.com, получи API-ключ
2. Замени в `<head>`:
```html
<script src='https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js'></script>
<link href='https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css' rel='stylesheet'/>
```
3. В JS-секции замени L.map на mapboxgl.Map

---

## API-эндпоинты (для справки)

| URL | Метод | Описание |
|-----|-------|----------|
| `/` | GET | Главная страница дашборда |
| `/api/fields` | GET | GeoJSON всех полей |
| `/api/field/<id>/dynamics` | GET | Raw + Twin NDVI временной ряд |
| `/api/field/<id>/latent_space` | GET | Траектория Z₁-Z₂ |
| `/api/field/<id>/scenario` | POST | What-if сценарий (delta_temp, delta_precip) |

---

## Если что-то не работает

**Ошибка `ModuleNotFoundError: flask`:**
```bash
pip install flask
```

**Белый экран / карта не грузится:**
- Убедись, что `app.py` запущен
- Открой http://localhost:5000 (не 127.0.0.1:8080)

**Карта не показывает поля:**
- Открой DevTools (F12) → вкладка Console → смотри ошибки
- Проверь http://localhost:5000/api/fields — должен вернуть JSON

**Порт 5000 занят:**
В `app.py` последняя строка — измени порт:
```python
app.run(debug=True, port=5001)
```
