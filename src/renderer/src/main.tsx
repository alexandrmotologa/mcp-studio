import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'
import { initBrowserAdapter } from './browserAdapter'
import { getActiveTheme, applyTheme } from './utils/themeManager'

initBrowserAdapter()
applyTheme(getActiveTheme())

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
