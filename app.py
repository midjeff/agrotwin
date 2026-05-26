"""
Agro-Twin — главный файл Flask-приложения.
Запуск: python app.py
Открыть в браузере: http://localhost:5000
"""

from flask import Flask, render_template, jsonify, request, session, redirect, url_for, flash
import random
import math
import hashlib
import os
import json

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "agro-twin-secret-2024")

# ─── Демо-пользователи (логин: хэш пароля, роль) ──────────────────────────────
# Пароли: admin → admin123, viewer → viewer123
def _hash(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

USERS = {
    "admin":  {"password": _hash("admin123"),  "role": "admin",  "name": "Администратор"},
    "viewer": {"password": _hash("viewer123"), "role": "viewer", "name": "Наблюдатель"},
}

def current_user():
    return session.get("user")

def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user():
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


# ─── Авторизация ───────────────────────────────────────────────────────────────

@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user():
        return redirect(url_for("index"))
    error = None
    if request.method == "POST":
        username = request.form.get("username", "").strip().lower()
        password = request.form.get("password", "")
        user = USERS.get(username)
        if user and user["password"] == _hash(password):
            session["user"] = {"username": username, "role": user["role"], "name": user["name"]}
            return redirect(url_for("index"))
        error = "Неверный логин или пароль"
    return render_template("login.html", error=error)


@app.route("/register", methods=["GET", "POST"])
def register():
    if current_user():
        return redirect(url_for("index"))
    error = None
    success = None
    if request.method == "POST":
        username = request.form.get("username", "").strip().lower()
        password = request.form.get("password", "")
        confirm  = request.form.get("confirm",  "")
        if not username or not password:
            error = "Заполните все поля"
        elif len(username) < 3:
            error = "Логин должен быть не менее 3 символов"
        elif len(password) < 6:
            error = "Пароль должен быть не менее 6 символов"
        elif password != confirm:
            error = "Пароли не совпадают"
        elif username in USERS:
            error = "Пользователь с таким логином уже существует"
        else:
            USERS[username] = {"password": _hash(password), "role": "viewer", "name": username.capitalize()}
            success = "Аккаунт создан! Войдите."
    return render_template("register.html", error=error, success=success)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


# ─── Страницы ──────────────────────────────────────────────────────────────────

@app.route("/")
def landing():
    return render_template("landing.html")

@app.route("/monitoring")
@login_required
def index():
    return render_template("index.html", user=current_user())


# ─── API: Список полей (GeoJSON) ───────────────────────────────────────────────

@app.route("/api/fields")
@login_required
def get_fields():
    """
    Возвращает реальные полигоны 23 полей (Северный Казахстан, ТОО).
    Читает static/polygons.json по абсолютному пути относительно app.py.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    geojson_path = os.path.join(base_dir, "static", "polygons.json")
    with open(geojson_path, encoding="utf-8") as f:
        data = json.load(f)
    return jsonify(data)


# ─── API: Динамика NDVI для поля ──────────────────────────────────────────────

@app.route("/api/field/<field_id>/dynamics")
@login_required
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
@login_required
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
@login_required
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
    print("  Демо-аккаунты:")
    print("    admin   / admin123  (полный доступ)")
    print("    viewer  / viewer123 (только просмотр)")
    print("=" * 50)
    app.run(debug=True, port=5000)
