/**
 * Точка входа в React приложение UniChoice
 * 
 * Инициализирует React приложение и монтирует его в DOM.
 * Включает глобальные стили Bootstrap и кастомные CSS.
 * 
 * Использует React 18 с новым API createRoot для лучшей производительности.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';                    // Глобальные стили приложения
import App from './App';                 // Главный компонент приложения
import reportWebVitals from './reportWebVitals'; // Метрики производительности
import 'bootstrap/dist/css/bootstrap.min.css';   // Bootstrap CSS фреймворк

// Создаем корневой элемент React 18
const root = ReactDOM.createRoot(document.getElementById('root'));

// Рендерим приложение в строгом режиме для дополнительных проверок
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Запускаем сбор метрик производительности
reportWebVitals();
