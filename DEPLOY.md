# Деплой Agro-Twin на Render.com (бесплатно)

## Шаги (5 минут)

### 1. Загрузи проект на GitHub
- Создай репозиторий на github.com
- Загрузи все файлы из этой папки

### 2. Задеплой на Render.com
1. Зайди на render.com → "New +" → "Web Service"
2. Подключи свой GitHub репозиторий
3. Настройки:
   - **Runtime:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
4. Нажми "Create Web Service"
5. Render выдаст ссылку вида `https://agro-twin.onrender.com`

### 3. Передай преподавателю
Ссылку + демо-аккаунты:

| Логин  | Пароль    | Роль          |
|--------|-----------|---------------|
| admin  | admin123  | Администратор |
| viewer | viewer123 | Наблюдатель   |

---
## Локальный запуск

```bash
pip install -r requirements.txt
python app.py
# Открыть: http://localhost:5000
```

## Маршруты

| URL          | Доступ        | Описание         |
|--------------|---------------|------------------|
| /            | Все           | Лендинг          |
| /login       | Все           | Вход             |
| /register    | Все           | Регистрация      |
| /monitoring  | Авторизованные| Дашборд          |
| /logout      | Авторизованные| Выход            |
| /api/*       | Авторизованные| API данных       |
