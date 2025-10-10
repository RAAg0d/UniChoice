<div align="center">

# 🎓 UniChoice

**Современная платформа для выбора университета и подачи заявлений на поступление**

[![React](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue?style=for-the-badge&logo=postgresql)](https://postgresql.org/)
[![Express](https://img.shields.io/badge/Express-4.21.2-black?style=for-the-badge&logo=express)](https://expressjs.com/)

<p align="center">
  <img src="unichoise-frontend/public/banner.png" alt="UniChoice Banner" width="400"/>
</p>

[🚀 Демо](#-демо) • [📋 Функции](#-функции) • [🛠️ Установка](#️-установка) • [📖 Документация](#-документация) • [🤝 Вклад](#-вклад)

</div>

---

## 📖 О проекте

**UniChoice** — это полнофункциональная веб-платформа, которая помогает абитуриентам найти подходящий университет, изучить специальности и подать заявления на поступление. Система также предоставляет инструменты для представителей вузов и администраторов.

### 🎯 Ключевые особенности

- 🔍 **Умный поиск** вузов с фильтрацией по рейтингу, местоположению и специальностям
- 🎲 **Случайный выбор** университета для тех, кто не может определиться
- ⭐ **Система рейтингов** на основе отзывов студентов
- 📝 **Подача заявлений** на поступление прямо через платформу
- 👥 **Три типа пользователей**: абитуриенты, представители вузов, администраторы
- 📊 **Административная панель** для управления системой

---

## ✨ Функции

### 👨‍🎓 Для абитуриентов
- 🔍 Просмотр каталога университетов
- 📋 Изучение специальностей и требований
- 📝 Подача заявлений на поступление
- ⭐ Оставление отзывов о вузах
- 📊 Отслеживание статуса заявлений

### 🏛️ Для представителей вузов
- 📤 Подача заявки на добавление университета
- 📋 Просмотр заявлений абитуриентов
- ✅ Управление статусами заявлений
- 📊 Аналитика по поступлениям

### 👨‍💼 Для администраторов
- 🏛️ Управление каталогом университетов
- 👥 Управление пользователями
- 📝 Модерация заявлений
- ⭐ Управление отзывами
- 📊 Общая статистика системы

---

## 🛠️ Технологии

### Frontend
- **React 19.0.0** - современная библиотека для UI
- **React Router** - маршрутизация
- **Bootstrap 5.3.3** - адаптивный дизайн
- **React Bootstrap** - компоненты UI
- **Framer Motion** - анимации

### Backend
- **Node.js 18+** - серверная платформа
- **Express 4.21.2** - веб-фреймворк
- **PostgreSQL 14+** - база данных
- **JWT** - аутентификация
- **bcrypt** - хеширование паролей

### Инструменты разработки
- **ESLint** - линтинг кода
- **Prettier** - форматирование
- **Git** - контроль версий

---

## 🚀 Быстрый старт

### Предварительные требования

- **Node.js** 18.0.0 или выше
- **PostgreSQL** 14.0 или выше
- **Git** для клонирования репозитория

### Установка

1. **Клонируйте репозиторий**
   ```bash
   git clone https://github.com/yourusername/unichoice.git
   cd unichoice
   ```

2. **Настройте базу данных**
   ```sql
   -- Создайте базу данных
   CREATE DATABASE "UniChoice";
   
   -- Импортируйте схему (если есть файл schema.sql)
   psql -d UniChoice -f schema.sql
   ```

3. **Установите зависимости**
   ```bash
   # Backend
   cd unichoise-backend
   npm install
   
   # Frontend
   cd ../unichoise-frontend
   npm install
   ```

4. **Настройте переменные окружения**
   
   Создайте файл `.env` в папке `unichoise-backend`:
   ```env
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key
   FRONTEND_ORIGIN=http://localhost:3000
   PGUSER=postgres
   PGHOST=localhost
   PGDATABASE=UniChoice
   PGPASSWORD=your-password
   PGPORT=5432
   ```

### Запуск

Откройте **два терминала**:

**Терминал 1 - Backend (порт 5000):**
```bash
cd unichoise-backend
npm start
```

**Терминал 2 - Frontend (порт 3000):**
```bash
cd unichoise-frontend
npm start
```

**Откройте браузер:** http://localhost:3000

---

## 📱 Скриншоты

<div align="center">

### 🏠 Главная страница
<img src="https://via.placeholder.com/800x400/6a0dad/ffffff?text=Главная+страница+UniChoice" alt="Главная страница" width="400"/>

### 🔍 Каталог университетов
<img src="https://via.placeholder.com/800x400/4CAF50/ffffff?text=Каталог+университетов" alt="Каталог университетов" width="400"/>

### 📝 Подача заявления
<img src="https://via.placeholder.com/800x400/2196F3/ffffff?text=Подача+заявления" alt="Подача заявления" width="400"/>

</div>

---

## 🏗️ Архитектура

```
unichoice/
├── 📁 unichoise-frontend/     # React приложение
│   ├── 📁 src/
│   │   ├── 📁 components/     # React компоненты
│   │   ├── 📁 styles/         # CSS стили
│   │   └── 📄 App.js          # Главный компонент
│   └── 📄 package.json
├── 📁 unichoise-backend/      # Node.js API
│   ├── 📁 src/
│   │   ├── 📁 routes/         # API маршруты
│   │   ├── 📁 middleware/     # Middleware функции
│   │   ├── 📁 db/            # Подключение к БД
│   │   └── 📄 server.js       # Главный сервер
│   └── 📄 package.json
└── 📄 README.md
```

---

## 🔧 API Документация

### Основные эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/universities` | Список университетов |
| `GET` | `/universities/random` | Случайный университет |
| `GET` | `/universities/:id` | Детали университета |
| `POST` | `/login` | Авторизация |
| `POST` | `/register` | Регистрация |
| `GET` | `/admission-applications/my` | Мои заявления |

### Примеры запросов

**Получение списка университетов:**
```bash
curl -X GET "http://localhost:5000/universities?page=1&rating=4.0"
```

**Авторизация:**
```bash
curl -X POST "http://localhost:5000/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

---

## 🧪 Тестирование

```bash
# Запуск тестов backend
cd unichoise-backend
npm test

# Запуск тестов frontend
cd unichoise-frontend
npm test
```

---

## 📊 Статистика проекта

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/yourusername/unichoice?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/unichoice?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/unichoice?color=red)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/unichoice?color=blue)

</div>

---

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта! Вот как вы можете помочь:

1. **Fork** репозитория
2. Создайте **feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** изменения (`git commit -m 'Add some AmazingFeature'`)
4. **Push** в branch (`git push origin feature/AmazingFeature`)
5. Откройте **Pull Request**

### 🐛 Сообщение об ошибках

Если вы нашли ошибку, пожалуйста:
1. Проверьте, что ошибка еще не зарегистрирована в [Issues](../../issues)
2. Создайте новое issue с подробным описанием
3. Укажите шаги для воспроизведения ошибки

---

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. См. файл [LICENSE](LICENSE) для подробностей.

---

## 👥 Авторы

- **Ваше имя** - *Основной разработчик* - [GitHub](https://github.com/yourusername)

---

## 🙏 Благодарности

- [React](https://reactjs.org/) за отличную библиотеку
- [Express](https://expressjs.com/) за простой веб-фреймворк
- [PostgreSQL](https://postgresql.org/) за надежную БД
- [Bootstrap](https://getbootstrap.com/) за красивые компоненты

---

<div align="center">

**⭐ Если проект вам понравился, поставьте звездочку! ⭐**

[⬆ Наверх](#-unichoice)

</div>