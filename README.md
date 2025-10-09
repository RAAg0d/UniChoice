<div align="center">

# UniChoice

<p align="center">
  <img src="unichoise-frontend/public/banner.png" alt="UniChoice Banner" width="300"/>
</p>

**Веб-платформа для поиска и сравнения университетов**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://postgresql.org/)
[![Express](https://img.shields.io/badge/Express-4.21-black.svg)](https://expressjs.com/)

</div>

## 📋 Описание

UniChoice — современная веб-платформа для поиска и сравнения университетов, просмотра специальностей и подачи заявлений на поступление. Система предоставляет абитуриентам удобный инструмент для выбора подходящего вуза на основе различных критериев.

### ✨ Основные возможности

- **🔍 Поиск и фильтрация** университетов по названию, местоположению, специальности
- **📊 Статистика заявлений** - количество поданных заявлений, активность за последние 30 дней
- **⭐ Система рейтингов** на основе отзывов студентов
- **👤 Аутентификация** с поддержкой разных ролей (студент, представитель вуза, администратор)
- **📝 Управление заявлениями** на поступление
- **💬 Отзывы и рейтинги** университетов
- **🎓 Информация о специальностях** с детальными характеристиками

### 🏗️ Архитектура

- **Frontend**: React 19 + Bootstrap 5 + React Router
- **Backend**: Node.js + Express + PostgreSQL
- **Аутентификация**: JWT токены
- **Стилизация**: Bootstrap + кастомные CSS модули

## 🚀 Быстрый старт

### Требования

- **Node.js** 18+ 
- **PostgreSQL** 14+
- **Git**

### Установка

1. **Клонируйте репозиторий:**
```bash
git clone <repository-url>
cd UniChoice
```

2. **Установите зависимости backend:**
```bash
cd unichoise-backend
npm install
```

3. **Установите зависимости frontend:**
```bash
cd ../unichoise-frontend
npm install
```

4. **Настройте базу данных PostgreSQL:**
   - Создайте базу данных `UniChoice`
   - Обновите настройки подключения в `unichoise-backend/src/config/env.js`

### Запуск

Откройте **два терминала**:

**1️⃣ Backend (порт 5000):**
```bash
cd unichoise-backend
npm run dev
```

**2️⃣ Frontend (порт 3000):**
```bash
cd unichoise-frontend
npm start
```

**3️⃣ Откройте браузер:** http://localhost:3000

## 📁 Структура проекта

```
UniChoice/
├── unichoise-backend/          # Backend API
│   ├── src/
│   │   ├── config/            # Конфигурация
│   │   ├── db/               # Подключение к БД
│   │   ├── middleware/       # Middleware функции
│   │   ├── routes/          # API маршруты
│   │   └── server.js        # Главный файл сервера
│   └── package.json
├── unichoise-frontend/        # Frontend React приложение
│   ├── src/
│   │   ├── components/       # React компоненты
│   │   ├── App.js           # Главный компонент
│   │   └── index.js         # Точка входа
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Аутентификация
- `POST /login` - Вход в систему
- `POST /register` - Регистрация пользователя
- `POST /logout` - Выход из системы
- `GET /me` - Информация о текущем пользователе

### Университеты
- `GET /universities` - Список университетов с фильтрами
- `GET /universities/:id` - Детальная информация об университете
- `GET /universities/random` - Случайный университет
- `POST /universities` - Создание университета (админ)
- `PUT /universities/:id` - Обновление университета (админ)
- `DELETE /universities/:id` - Удаление университета (админ)

### Специальности
- `GET /universities/:id/specialties` - Специальности университета
- `POST /universities/:id/specialties` - Создание специальности (админ)
- `PUT /specialties/:id` - Обновление специальности (админ)
- `DELETE /specialties/:id` - Удаление специальности (админ)

### Отзывы
- `GET /universities/:id/reviews` - Отзывы об университете
- `POST /universities/:id/reviews` - Добавление отзыва

### Заявления
- `GET /admission-applications/my` - Мои заявления
- `POST /admission-applications` - Подача заявления
- `GET /admission-applications/university` - Заявления для представителей вузов

## 🎨 Компоненты Frontend

### Основные компоненты
- **Header** - Навигация и аутентификация
- **UniversityList** - Список университетов с фильтрами
- **UniversityDetails** - Детальная страница университета
- **AuthModal** - Модальное окно входа/регистрации
- **AdminPanel** - Панель администратора

### Специализированные компоненты
- **ReviewsSection** - Секция отзывов
- **SpecialtiesSection** - Секция специальностей
- **MyApplications** - Мои заявления
- **AdmissionApplications** - Управление заявлениями

## 🔐 Роли пользователей

1. **Студент** - просмотр университетов, подача заявлений, оставление отзывов
2. **Представитель вуза** - просмотр заявлений на поступление в свой вуз
3. **Администратор** - полное управление системой

## 📊 Функции статистики

- **Общее количество заявлений** - сумма заявлений на все специальности вуза
- **Заявления за 30 дней** - активность подачи заявлений за последний месяц
- **Дни с последней подачи** - сколько дней прошло с последнего заявления
- **Средний рейтинг** - рейтинг на основе отзывов студентов

## 🛠️ Разработка

### Структура кода
- **Модульная архитектура** - разделение на логические модули
- **Подробные комментарии** - каждый файл содержит детальные комментарии
- **Единый стиль кода** - консистентное форматирование
- **Обработка ошибок** - централизованная обработка ошибок

### Технологии
- **Backend**: Express.js, PostgreSQL, JWT, bcrypt
- **Frontend**: React, React Router, Bootstrap, CSS Modules
- **Инструменты**: Nodemon, React Scripts

## 📝 Лицензия

Этот проект создан в образовательных целях.

## 🤝 Вклад в проект

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📞 Поддержка

Если у вас есть вопросы или предложения, создайте issue в репозитории.
