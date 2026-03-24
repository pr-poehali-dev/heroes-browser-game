/**
 * main.tsx — Точка входа приложения
 *
 * Монтирует корневой компонент App в DOM-элемент #root.
 * Подключает глобальные стили (index.css).
 */
import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);