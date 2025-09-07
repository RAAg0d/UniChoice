<div align="center">

# UniChoice

<p align="center">
  <img src="/unichoise-frontend/public/banner.png" alt="ZonecoR Banner" width="600"/>
</p>

![Node](https://img.shields.io/badge/Node-18%2B-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791?logo=postgresql&logoColor=white)

</div>

## Краткое описание
UniChoice — веб‑платформа для поиска и сравнения вузов, просмотра специальностей и подачи заявлений на поступление.

## Требования
Необходимое ПО
- Node.js 18+
- PostgreSQL 14+
- Git
- VS Code

## Установка


## Запуск

Откройте два терминала.

1) Бэкенд (порт 5000):
```bash
cd unichoise-backend
npm run dev
```

2) Фронтенд (порт 3000):
```bash
cd unichoise-frontend
npm start
```

Далее откройте браузер: http://localhost:3000

## Примеры использования
- Авторизация: POST `http://localhost:5000/login`
- Регистрация: POST `http://localhost:5000/register`
- Список вузов: GET `http://localhost:5000/universities?page=1&rating=4&location=Moscow`
- Детали вуза: GET `http://localhost:5000/universities/:id`
- Отправка отзыва: POST `http://localhost:5000/universities/:id/reviews`
- Случайный вуз: GET `http://localhost:5000/universities/random`

Интерфейс фронтенда обеспечивает удобную работу с этими эндпойнтами — авторизацию, просмотр вузов и специальностей, а также подачу заявлений.

## Скриншоты
<!-- Замените на актуальные пути к изображениям в репозитории -->
<p align="center">
  <img src=".github/screenshots/home.png" alt="Главная страница" width="600"/>
</p>

## Лицензия
Распространяется по лицензии MIT. См. файл LICENSE (если применимо).

